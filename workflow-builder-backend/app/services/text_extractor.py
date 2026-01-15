from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 🔥 FIX: go up TWO levels (services → app → project root)
PROJECT_ROOT = Path(__file__).resolve().parents[2]
UPLOADS_DIR = PROJECT_ROOT / "data" / "uploads"

print("Uploads Directory:", UPLOADS_DIR)


class TextExtractor:
    def extract(self, filename: str):
        pdf_path = UPLOADS_DIR / filename
        print("Extracting text from PDF:", pdf_path)
        
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

        loader = PyPDFLoader(str(pdf_path))
        docs = loader.load()

        print("Number of pages extracted:", len(docs))
        return docs


text_extractor = TextExtractor()
