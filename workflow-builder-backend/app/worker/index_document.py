# app/worker/index_document.py
#MUST BE FIRST - before any other imports
import os
os.environ["OBJC_DISABLE_INITIALIZE_FORK_SAFETY"] = "YES"

import sys
from dotenv import load_dotenv
from langchain_core.documents import Document

from app.vector_store.qdrant import qdrant_manager
from langchain_openai import OpenAIEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore

load_dotenv()

def process_rag(job_payload: dict):
    try:
        document_id    = job_payload["document_id"]
        provider       = job_payload["embedding_provider"].lower()
        model_name     = job_payload["embedding_model"]
        chunks         = job_payload["chunks"]
        if not chunks:
            raise ValueError("No chunks provided")

        print(f"[WORKER] Starting indexing for document: {document_id}")
        print(f"[WORKER] Provider: {provider}, Model: {model_name}")
        print(f"[WORKER] Chunks: {len(chunks)}")
        
        # ── Convert dict chunks to LangChain Document objects ───────────
        documents = []
        for chunk in chunks:
            if isinstance(chunk, dict):
                # Create Document from dict
                doc = Document(
                    page_content=chunk.get("page_content", chunk.get("text", "")),
                    metadata=chunk.get("metadata", {})
                )
                documents.append(doc)
            else:
                # Already a Document object
                documents.append(chunk)
        
        print(f"[WORKER] Converted {len(documents)} chunks to Document objects")

        # ── Create embedding function/object ────────────────────────
        if provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY not set in environment")
            
            print(f"[WORKER] Creating OpenAI embedding with key: {api_key[:20]}...")
            embedding_model = OpenAIEmbeddings(model=model_name, api_key=api_key)

        elif provider == "gemini":
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY not set in environment")
                
            print(f"[WORKER] Creating Gemini embedding with key: {api_key[:20]}...")
            embedding_model = GoogleGenerativeAIEmbeddings(model=model_name, google_api_key=api_key)

        else:
            raise ValueError(f"Unsupported provider: {provider}")

        print(f"[WORKER] Indexing {len(chunks)} chunks using {provider}/{model_name}")

        # ── Actually index ───────────────────────────────────────────
        # Use force_recreate=True to handle dimension mismatches
        # This ensures different embedding models can be used with same collection
        qdrant = QdrantVectorStore.from_documents(
            documents=documents,
            embedding=embedding_model,
            url="http://localhost:6333",
            collection_name="rag_collection",
            force_recreate=True,  # ← Recreate collection if dimensions change
        )


        count = len(documents)

        # ── Update document status in database ──────────────────────
        try:
            from app.database import DocumentService
            DocumentService.update_document_status(
                document_id=document_id,
                status="indexed",
                chunks_count=count
            )
            print(f"[WORKER]Document status updated in DB: {document_id}")
        except Exception as db_error:
            print(f"[WORKER]Warning: Could not update document status: {str(db_error)}")
            # Don't fail the indexing if DB update fails

        result = {
            "document_id": document_id,
            "chunks_indexed": count,
            "embedding_provider": provider,
            "embedding_model": model_name,
            "status": "indexed",
            "message": f"Indexed {count} chunks successfully"
        }

        print(f"[WORKER]Success → {result}")
        return result

    except Exception as e:
        import traceback
        msg = f"Indexing failed: {str(e)}"
        print(f"[WORKER]  ERROR: {msg}")
        print(f"[WORKER] Traceback: {traceback.format_exc()}")
        return {
            "document_id": job_payload.get("document_id"),
            "status": "failed",
            "error": msg,
            "chunks_indexed": 0,
        }