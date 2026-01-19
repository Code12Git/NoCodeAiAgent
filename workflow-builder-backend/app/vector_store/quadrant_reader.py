from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from langchain_qdrant.qdrant import QdrantVectorStoreError

def get_qdrant_reader(embedding_model):
    """
    Get or create Qdrant vector store reader.
    
    If collection exists with different dimensions, automatically recreate it.
    This ensures flexibility with different embedding models.
    """
    try:
        return QdrantVectorStore.from_existing_collection(
            collection_name="rag_collection",
            embedding=embedding_model,
            url="http://localhost:6333",
        )
    
    except QdrantVectorStoreError as e:
        # If dimension mismatch, delete and recreate collection
        if "dimensions" in str(e).lower():
            print(f"[QDRANT] Collection dimension mismatch detected")
            print(f"[QDRANT] Error: {str(e)}")
            print(f"[QDRANT] Deleting old collection and creating new one...")
            
            
            client = QdrantClient(url="http://localhost:6333")
            try:
                client.delete_collection(collection_name="rag_collection")
                print(f"[QDRANT]Old collection deleted")
            except Exception as delete_error:
                print(f"[QDRANT] Warning: Could not delete collection: {delete_error}")
            
            vector_store = QdrantVectorStore.from_documents(
                documents=[],   
                embedding=embedding_model,
                url="http://localhost:6333",
                collection_name="rag_collection",
                force_recreate=True,
            )
            print(f"[QDRANT]New collection created with current embedding model")
            return vector_store
        else:
            raise
