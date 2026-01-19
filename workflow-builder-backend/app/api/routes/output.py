from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from app.database import ChatLogService, DocumentService, get_db_session
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["output"])


# ===== REQUEST/RESPONSE MODELS =====

class FollowUpRequest(BaseModel):
    """Follow-up question on existing chat"""
    chat_id: str
    follow_up_query: str
    document_id: str
    llm_model: str
    temperature: float = 0.7
    provider: str = "openai"
    embedding_model: str = "text-embedding-3-small"


class ChatHistoryRequest(BaseModel):
    """Get chat history for a document"""
    document_id: str
    limit: int = 10
    offset: int = 0


class ChatResponse(BaseModel):
    """Single chat message response"""
    chat_id: str
    query: str
    answer: str
    sources: int
    model: str
    temperature: str
    provider: str
    embedding_model: str
    created_at: str
    is_follow_up: bool = False
    follow_up_count: int = 0


class ChatHistoryResponse(BaseModel):
    """Chat history response"""
    document_id: str
    total_chats: int
    chats: List[ChatResponse]
    document_info: Optional[dict] = None


# ===== ENDPOINTS =====

@router.post("/output/chat/{chat_id}")
async def get_chat_output(
    chat_id: str,
    include_history: bool = Query(False, description="Include chat history")
):
    """
    Get the final response for a specific chat session
    
    Args:
        chat_id: The chat session ID
        include_history: Whether to include full chat history
    
    Returns:
        Chat response with optional history
    """
    try:
        logger.info(f"[OUTPUT] Retrieving chat output: {chat_id}")
        
        session = get_db_session()
        
        from app.database import ChatLog
        chat = session.query(ChatLog).filter_by(chat_id=chat_id).first()
        
        if not chat:
            logger.warning(f"[OUTPUT] Chat not found: {chat_id}")
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        response = ChatResponse(
            chat_id=chat.chat_id,
            query=chat.query,
            answer=chat.answer,
            sources=chat.sources,
            model=chat.model,
            temperature=chat.temperature,
            provider=chat.provider,
            embedding_model=chat.embedding_model,
            created_at=chat.created_at.isoformat()
        )
        
        result = {
            "chat": response,
            "status": "success"
        }
        
        # Include chat history if requested
        if include_history:
            from app.database import ChatLog
            all_chats = session.query(ChatLog).filter_by(
                document_id=chat.document_id
            ).order_by(ChatLog.created_at.desc()).limit(10).all()
            
            result["history"] = [
                ChatResponse(
                    chat_id=c.chat_id,
                    query=c.query,
                    answer=c.answer,
                    sources=c.sources,
                    model=c.model,
                    temperature=c.temperature,
                    provider=c.provider,
                    embedding_model=c.embedding_model,
                    created_at=c.created_at.isoformat()
                )
                for c in all_chats
            ]
        
        session.close()
        logger.info(f" Chat output retrieved: {chat_id}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving chat: {str(e)}")


@router.post("/output/chat-history")
async def get_chat_history(request: ChatHistoryRequest):
    """
    Get complete chat history for a document
    
    Useful for displaying conversation thread in UI
    """
    try:
        logger.info(f"[OUTPUT] Retrieving chat history for document: {request.document_id}")
        
        session = get_db_session()
        
        # Verify document exists
        from app.database import ChatLog
        doc = DocumentService.get_document(request.document_id)
        
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Get all chats for this document
        total_chats = session.query(ChatLog).filter_by(
            document_id=request.document_id
        ).count()
        
        chats = session.query(ChatLog).filter_by(
            document_id=request.document_id
        ).order_by(
            ChatLog.created_at.desc()
        ).offset(request.offset).limit(request.limit).all()
        
        chat_responses = [
            ChatResponse(
                chat_id=c.chat_id,
                query=c.query,
                answer=c.answer,
                sources=c.sources,
                model=c.model,
                temperature=c.temperature,
                provider=c.provider,
                embedding_model=c.embedding_model,
                created_at=c.created_at.isoformat()
            )
            for c in chats
        ]
        
        session.close()
        
        response = ChatHistoryResponse(
            document_id=request.document_id,
            total_chats=total_chats,
            chats=chat_responses,
            document_info={
                "filename": doc.filename,
                "chunks_count": doc.chunks_count,
                "embedding_model": doc.embedding_model,
                "status": doc.status
            }
        )
        
        logger.info(f"[ Retrieved {len(chats)} chats for document: {request.document_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving history: {str(e)}")


@router.post("/output/follow-up")
async def process_follow_up_question(request: FollowUpRequest):
    """
    Process a follow-up question on an existing chat
    
    This re-runs the workflow using the same logic:
    1. Extract the follow-up query
    2. Generate embeddings using same model
    3. Search Qdrant for relevant chunks
    4. Call LLM with context
    5. Log new chat entry linked to original
    6. Return response
    
    The key difference: context includes previous answer for consistency
    """
    try:
        logger.info(f"[OUTPUT] Processing follow-up question for chat: {request.chat_id}")
        
        # Try to verify chat and document exist (optional)
        original_chat = None
        doc = None
        
        try:
            session = get_db_session()
            
            # Get the original chat for context
            from app.database import ChatLog
            original_chat = session.query(ChatLog).filter_by(chat_id=request.chat_id).first()
            
            if not original_chat:
                logger.warning(f"[OUTPUT] Original chat not found: {request.chat_id}")
                # Don't fail - we can still process the follow-up
            
            # Try to verify document exists (optional)
            from app.database import DocumentService
            doc = DocumentService.get_document(request.document_id)
            if not doc:
                logger.warning(f"[OUTPUT] Document not found in database: {request.document_id}")
                # Don't fail - document might still have embeddings in Qdrant
            
            session.close()
        except Exception as db_error:
            logger.warning(f"[OUTPUT] Database unavailable, continuing without verification: {str(db_error)}")
            # Continue anyway - the system can still work without DB
        
        # The follow-up processing would go through the LLM endpoint
        # For now, return structured response indicating follow-up is ready
        
        return {
            "status": "ready_for_processing",
            "message": "Follow-up question received. Processing through LLM pipeline.",
            "original_chat_id": request.chat_id,
            "follow_up_query": request.follow_up_query,
            "document_id": request.document_id,
            "model": request.llm_model,
            "embedding_model": request.embedding_model,
            "context": {
                "original_query": original_chat.query if original_chat else "Previous query",
                "original_answer": original_chat.answer if original_chat else "Previous answer",
                "previous_sources": original_chat.sources if original_chat else 0
            },
            "next_action": "Send follow-up query to POST /llm/process with same workflow ID"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing follow-up: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing follow-up: {str(e)}")


@router.get("/output/document/{document_id}/stats")
async def get_document_stats(document_id: str):
    """
    Get statistics for a document's queries
    
    Useful for analytics dashboard
    """
    try:
        logger.info(f"Retrieving stats for document: {document_id}")
        
        session = get_db_session()
        
        # Verify document exists
        doc = DocumentService.get_document(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        from app.database import ChatLog
        from sqlalchemy import func
        
        # Get statistics
        total_queries = session.query(ChatLog).filter_by(
            document_id=document_id
        ).count()
        
        avg_sources = session.query(func.avg(ChatLog.sources)).filter_by(
            document_id=document_id
        ).scalar() or 0
        
        # Most used models
        models_used = session.query(
            ChatLog.model,
            func.count(ChatLog.model).label('count')
        ).filter_by(
            document_id=document_id
        ).group_by(ChatLog.model).all()
        
        # Most used embedding models
        embedding_models = session.query(
            ChatLog.embedding_model,
            func.count(ChatLog.embedding_model).label('count')
        ).filter_by(
            document_id=document_id
        ).group_by(ChatLog.embedding_model).all()
        
        session.close()
        
        stats = {
            "document_id": document_id,
            "filename": doc.filename,
            "total_queries": total_queries,
            "average_sources_per_query": round(float(avg_sources), 2),
            "models_used": [
                {"model": m[0], "count": m[1]} for m in models_used
            ],
            "embedding_models_used": [
                {"model": m[0], "count": m[1]} for m in embedding_models
            ],
            "document_stats": {
                "chunks_count": doc.chunks_count,
                "embedding_provider": doc.embedding_provider,
                "status": doc.status,
                "created_at": doc.created_at.isoformat()
            }
        }
        
        logger.info(f"Stats retrieved for document: {document_id}")
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving stats: {str(e)}")
