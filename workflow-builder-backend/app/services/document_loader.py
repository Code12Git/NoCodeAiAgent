from pathlib import Path
from app.services.text_extractor import text_extractor

def load_text_from_document(document_id: str) -> str:
    print("Loading document with ID:", document_id)
    # Just pass the filename, text_extractor will handle the full path
    return text_extractor.extract(document_id)
