import json
from pathlib import Path
from app.queue.valkey import queue
from app.worker.index_document import process_rag

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import List, Optional

load_dotenv()

router = APIRouter(tags=["knowledge"])

class IndexRequest(BaseModel):
    embedding_provider: str
    embedding_model: str
    chunks: List = []
    
@router.post('/knowledge/process/{document_id}')
async def process_document(document_id: str, body: IndexRequest):
    """
    Enqueue document indexing job for vector embedding and storage.
    
    Returns job_id for status tracking.
    """
    try:
        payload = {
            "document_id": document_id,
            "embedding_provider": body.embedding_provider,
            "embedding_model": body.embedding_model,
            "chunks": body.chunks,
        }

        job = queue.enqueue(
            process_rag,
            payload,
            job_timeout="10m",  # 10 minute timeout
            result_ttl=3600,    # Keep result for 1 hour
            failure_ttl=300,    # Keep failure info for 5 minutes
        )
        
        print(f"[QUEUE] Job enqueued: {job.id}")
        print(f"[QUEUE] Job status: {job.get_status()}")
        
        return {
            "message": "Document indexing started",
            "job_id": job.id,
            "status": "queued",
            "document_id": document_id,
        }
    except Exception as e:
        print(f"[ERROR] Failed to enqueue job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to enqueue job: {str(e)}")


@router.get("/knowledge/status/{job_id}")
def job_status(job_id: str):
    """
    Get the status and result of a queued indexing job.
    
    Possible statuses:
    - queued: Job is waiting to be processed
    - started: Job is currently running
    - finished: Job completed successfully
    - failed: Job failed during execution
    """
    try:
        job = queue.fetch_job(job_id)
        
        if not job:
            print(f"[ERROR] Job not found: {job_id}")
            raise HTTPException(
                status_code=404,
                detail=f"Job {job_id} not found"
            )

        status = job.get_status()
        print(f"[QUEUE] Job {job_id} status: {status}")
        
        # ✅ Build response based on status
        response = {
            "job_id": job.id,
            "status": status,
            "document_id": job.args[0].get("document_id") if job.args else None,
        }
        
        # Add result only when job is finished
        if status == "finished":
            result = job.result
            print(f"[QUEUE] Job {job_id} result: {result}")
            response["result"] = result
            response["message"] = "Document indexing completed successfully"
        
        # Add error info if job failed
        elif status == "failed":
            print(f"[QUEUE] Job {job_id} error: {job.exc_info}")
            response["error"] = job.exc_info
            response["message"] = "Document indexing failed"
        
        # Job still processing
        elif status in ["queued", "started"]:
            response["message"] = f"Document indexing in progress ({status})"
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to fetch job status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch job status: {str(e)}"
        )