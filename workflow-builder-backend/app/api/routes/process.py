from fastapi import  APIRouter,  HTTPException
from pydantic import BaseModel
from dotenv import   load_dotenv
from app.embeddings.openai import OpenAIEmbeddingService,openai_embeddings
from app.embeddings.geminiai import GeminiEmbeddingService
from app.vector_store.qdrant import qdrant_store
from app.services.document_loader import load_text_from_document
from app.services.text_chunker import TextChunker
load_dotenv()

router = APIRouter(tags=["knowledge"])

class IndexRequest(BaseModel):
    embedding_provider:str
    embedding_model: str 

@router.post('/knowledge/process/{document_id}')
async def process_document(document_id: str, body: IndexRequest):
    embedding_provider = body.embedding_provider
    embedding_model = body.embedding_model
    print("DocumentID",document_id)
    # 1️⃣ Load document text (example)
    text = load_text_from_document(document_id)  # you already have extractor
    print("Loaded Text:",text)
    # 2️⃣ Chunk text
    chunker = TextChunker()
    documents = chunker.chunk(text)  # List[Document]
    print("Document Chunks:",documents)

    print("Embedding_Provider:",embedding_provider)
    print("Embedding_model",embedding_model)
    print("Chunks",documents)
    # Here you would typically retrieve the document using the document_id
    # and then process it (e.g., generate embeddings, store in vector database, etc.)
    if embedding_provider.lower() == "openai":
        OpenAIEmbeddingService(model=embedding_model)
        print("Triggered")
        embeddingModel = await openai_embeddings.get_embedding_model()
        print("EmbeddingMode",embeddingModel)
        qdrant = qdrant_store(url="http://localhost:6333",chunks=documents,embedding_model=embeddingModel)
        vector_store = await qdrant.get_vector_store()
        print("VectorStore",vector_store)
        return {"message": f"Document processed with OpenAI embeddings using model {embedding_model}"}
    elif embedding_model.lower() == 'gemini':
        GeminiEmbeddingService(model=embedding_model)
        qdrant = qdrant_store(url="http://localhost:6333",chunks=documents,embedding_model=embeddingModel)
        vector_store = await qdrant.get_vector_store()
        return {"message": f"Document processed with Gemini embeddings using model {embedding_model}"}
    else:
        raise HTTPException(status_code=400, detail="Invalid embedding provider")    


            