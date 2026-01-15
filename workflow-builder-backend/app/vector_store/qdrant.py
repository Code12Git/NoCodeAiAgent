from langchain_qdrant import QdrantVectorStore

class qdrant_store:
    def __init__(self, url: str, chunks: list[str], embedding_model):

        self.qdrant = QdrantVectorStore.from_documents(
            documents=chunks,
            embedding=embedding_model,
            url=url,
            collection_name="rag_collection", 
        )
    async def get_vector_store(self):
        return self.qdrant

