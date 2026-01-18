from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from openai import OpenAI
from google import genai
from dotenv import load_dotenv
from app.services.web_search import web_search
from langchain_openai import OpenAIEmbeddings
from app.embeddings.geminiai import GeminiEmbeddingService
from app.vector_store.quadrant_reader import get_qdrant_reader
from app.database import ChatLogService
import uuid

load_dotenv()

router = APIRouter(tags=["llm"])
openai_client = OpenAI()
client = genai.Client()


class LLMRequest(BaseModel):
    query: str
    provider: str
    model: str
    document_id: str
    llmModel: str  
    custom_prompt: Optional[str] = None
    temperature: Optional[float] = 0.7  # Controls randomness (0.0-1.0): 0=deterministic, 1=creative
    enable_web_search: Optional[bool] = False  # Fallback to web search if no KB results

@router.post("/llm/process")
async def process_rag(body: LLMRequest):
    """
    Handles a user query with retrieval-augmented generation (RAG) using a specific document.
    
    Features:
    - Vector similarity search in Qdrant
    - Web search fallback if no KB results
    - Custom system prompts
    - Temperature control for response creativity
    - Support for OpenAI and Google Gemini models
    
    Parameters:
    - query: User question to process
    - provider: 'openai' or 'gemini'
    - model: Embedding model name
    - document_id: Document UUID for filtering search results
    - llmModel: LLM model to use (gpt-4, gpt-4-turbo, gemini-pro, etc.)
    - custom_prompt: Optional system prompt override
    - temperature: Control response randomness (0.0=deterministic, 1.0=creative)
    - enable_web_search: Enable fallback to web search
    
    Returns:
    - answer: Generated response from LLM
    - sources: Number of knowledge base chunks used
    """

    print("Processing query for document:", body.document_id)
    print("Request body:", body)
    print(f"Temperature: {body.temperature}, Web Search Enabled: {body.enable_web_search}")

    if body.provider.lower() == "openai":
        embedding_model = OpenAIEmbeddings(model=body.model)

    elif body.provider.lower() == "gemini":
        service = GeminiEmbeddingService(model=body.model)
        embedding_model = await service.get_embedding_model()

    else:
        raise HTTPException(status_code=400, detail="Unsupported embedding provider")

    vector_db = get_qdrant_reader(embedding_model)
    print("Vector store loaded.")

        # Fallback: search without filter
    search_results = vector_db.similarity_search(
            query=body.query,
            k=5
        )
    
    print(f"Found {len(search_results)} relevant chunks.")

    context_blocks = []

    # 4️⃣ KB context
    if search_results:
        kb_context = "\n\n".join(
            f"Page Content:\n{doc.page_content}\n"
            f"Page Number: {doc.metadata.get('page_label')}\n"
            f"Source: {doc.metadata.get('source')}"
            for doc in search_results
        )
        context_blocks.append("KNOWLEDGE BASE CONTEXT:\n" + kb_context)

    # 5️⃣ Web search fallback (only if enabled and no KB results)
    if not search_results and body.enable_web_search:
        print("No KB results found. Attempting web search fallback...")
        web_context = web_search(body.query)
        if web_context:
            context_blocks.append("WEB SEARCH CONTEXT:\n" + web_context)
            
    if not context_blocks:
        print("No context found from KB or web search")
        return {"answer": "I don't know.", "sources": 0}

    final_context = "\n\n---\n\n".join(context_blocks)        

    # 5️⃣ Construct system prompt
    base_prompt = body.custom_prompt or f"""
        You are a helpful AI Assistant who answers user queries based only on the available context 
        retrieved from a PDF file. Make sure to reference the page number for navigation.
        """
    system_prompt = f"""
        {base_prompt}
        Context:
        {final_context}
        """    

    # 6️⃣ Call LLM with temperature control
    if body.provider.lower() == "openai":
        print(f"Calling OpenAI {body.llmModel} with temperature={body.temperature}")
        response = openai_client.chat.completions.create(
            model=body.llmModel,
            temperature=body.temperature,  # Control randomness (0.0-1.0)
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": body.query},
            ],
        )
        answer = response.choices[0].message.content
    elif body.provider.lower() == "gemini":
        print(f"Calling Google Gemini {body.llmModel} with temperature={body.temperature}")
        final_prompt = f"""
            {system_prompt}

            User Question:
            {body.query}
            """
        gemini_response = client.models.generate_content(
            model=body.llmModel,
            contents=final_prompt,
            generation_config={
                "temperature": body.temperature,  # Control randomness (0.0-1.0)
            }
        )
        answer = gemini_response.text
    else:
        raise HTTPException(status_code=400, detail="Unsupported LLM provider")
        
    
    # 7️⃣ Log chat to PostgreSQL
    chat_id = str(uuid.uuid4())
    try:
        ChatLogService.create_chat_log(
            chat_id=chat_id,
            document_id=body.document_id,
            query=body.query,
            answer=answer,
            sources=len(search_results),
            model=body.llmModel,
            temperature=body.temperature,
            provider=body.provider,
            embedding_model=body.model,
            workflow_id=None  # Optional: workflow context if available
        )
        print(f"[LLM] ✅ Chat logged to PostgreSQL: {chat_id}")
    except Exception as e:
        print(f"[LLM] ⚠️ Warning: Could not log chat: {str(e)}")
        # Don't fail the response if logging fails
    
    # 8️⃣ Return response + source info + metadata
    print(f"Response generated. Sources used: {len(search_results)}")
    return {
        "answer": answer,
        "sources": len(search_results),
        "model": body.llmModel,
        "temperature": body.temperature,
        "provider": body.provider,
        "chat_id": chat_id
    }
