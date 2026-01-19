# app/vector_store/qdrant.py
from langchain_qdrant import QdrantVectorStore
from langchain_core.documents import Document
from typing import List, Any

class QdrantManager:
    def __init__(self, url: str = "http://localhost:6333", collection_name: str = "rag_collection"):
        self.url = url
        self.collection_name = collection_name
        self._store = None   

    def get_vector_store(self, embedding: Any) -> QdrantVectorStore:
        """Returns existing collection or creates it if missing"""
        if self._store is None:
            try:
                self._store = QdrantVectorStore.from_existing_collection(
                    embedding=embedding,
                    url=self.url,
                    collection_name=self.collection_name,
                )
            except Exception:
                # collection doesn't exist yet → create it
                self._store = QdrantVectorStore(
                    embedding=embedding,
                    url=self.url,
                    collection_name=self.collection_name,
                )
        return self._store

    def index_chunks_sync(
        self,
        chunks: List[str],
        embedding: Any,
        document_id: str
    ) -> int:
        if not chunks:
            return 0

        docs = [
            Document(
                page_content=chunk,
                metadata={
                    "document_id": document_id,
                    "chunk_index": i,
                }
            )
            for i, chunk in enumerate(chunks)
        ]

        vector_store = self.get_vector_store(embedding)
        vector_store.add_documents(docs)
        return len(docs)


qdrant_manager = QdrantManager()