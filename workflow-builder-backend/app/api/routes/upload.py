from fastapi import APIRouter, Depends, HTTPException, UploadFile,File
import json
from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.services.file_loader import file_loader
from app.services.text_extractor import text_extractor
from app.services.text_chunker import text_chunker
from dotenv import load_dotenv
load_dotenv()

router = APIRouter(tags=["upload"])

CHUNKS_DIR = Path("app/storage/chunks")
CHUNKS_DIR.mkdir(parents=True, exist_ok=True)


@router.post('/knowledge/upload')
async def upload_document(file: UploadFile = File(...)):
    filename = await file_loader.save(file)
    docs = text_extractor.extract(filename)
    text_splitter =  RecursiveCharacterTextSplitter( chunk_size=1000,chunk_overlap=600 )
    chunks_docs = text_splitter.split_documents(documents=docs)   

    return { "document_id": filename, "chunks_count": len(chunks_docs), "chunks": chunks_docs }

