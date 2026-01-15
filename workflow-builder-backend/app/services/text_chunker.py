from langchain_text_splitters import RecursiveCharacterTextSplitter

class TextChunker:
    def __init__(
        self,
        chunk_size: int = 500,
        chunk_overlap: int = 100
    ):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

    def chunk(self, docs):
        """
        chunks a list of Document objects
        docs: List of Document objects from PyPDFLoader
        """
        print("Chunking documents...")
        chunks = self.splitter.split_documents(documents=docs)
        print("Number of text chunks created:", len(chunks))
        return chunks

text_chunker = TextChunker(chunk_size=1000, chunk_overlap=200)