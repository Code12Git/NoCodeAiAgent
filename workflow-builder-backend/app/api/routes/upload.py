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
    try:
        filename = await file_loader.save(file)
        docs = text_extractor.extract(filename)
        text_splitter =  RecursiveCharacterTextSplitter( chunk_size=1000,chunk_overlap=600 )
        chunks_docs = text_splitter.split_documents(documents=docs)   

        # ── Optionally create document record in database ──────────────────────
        # This is optional - the system will work without it
        # but it's needed for follow-up queries to find the document
        document_id = filename
        try:
            # Try to import and create document record
            # If PostgreSQL is not available, this will fail silently
            try:
                from app.database import DocumentService
                DocumentService.create_document(
                    document_id=document_id,
                    filename=filename,
                    embedding_provider="openai",  # Default, will be updated when embedding is done
                    embedding_model="text-embedding-3-small",  # Default, will be updated
                    file_size=file.size if file.size else None
                )
                print(f"[UPLOAD] ✅ Document record created in database: {document_id}")
            except Exception as import_error:
                print(f"[UPLOAD] ℹ️ Database not available, skipping document record: {str(import_error)}")
                # Continue without database - document still uploaded successfully
        except Exception as e:
            print(f"[UPLOAD] ⚠️ Warning: {str(e)}")
        
        return { "document_id": filename, "chunks_count": len(chunks_docs), "chunks": chunks_docs }
    
    except Exception as e:
        print(f"[UPLOAD] ❌ Error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

