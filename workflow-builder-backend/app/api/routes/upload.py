from fastapi import APIRouter, Depends, HTTPException, UploadFile,File
from app.services.file_loader import file_loader
from app.services.text_extractor import text_extractor
from dotenv import load_dotenv
from app.embeddings.openai import OpenAIEmbeddingService
from app.embeddings.geminiai import GeminiEmbeddingService
load_dotenv()

router = APIRouter(tags=["upload"])



@router.post('/knowledge/upload')
async def upload_document(file: UploadFile = File(...)):
    filename = await file_loader.save(file)
    text_chunks = text_extractor.extract(filename)

    return { "document_id": filename, "chunks_count": len(text_chunks) }

