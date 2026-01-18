"""
PostgreSQL Database Setup and Models

This module provides:
1. Document metadata storage
2. Workflow definitions (optional)
3. Chat logs (optional)

Uses SQLAlchemy ORM with PostgreSQL
"""

from sqlalchemy import create_engine, Column, String, Text, DateTime, JSON, Integer, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/workflow_builder"
)

print(f"[DB] Connecting to: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'localhost'}")

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL logging
    pool_pre_ping=True,  # Test connection before using
)

# Session factory
SessionLocal = sessionmaker(bind=engine)

# Base class for models
Base = declarative_base()


# ===== DATABASE MODELS =====

class DocumentMetadata(Base):
    """
    Store document metadata
    
    Fields:
    - document_id: UUID of the document (from upload)
    - filename: Original filename
    - file_size: Size in bytes
    - chunks_count: Number of chunks extracted
    - embedding_provider: "openai" or "gemini"
    - embedding_model: Model name used for embeddings
    - status: "uploaded", "processing", "indexed", "failed"
    - created_at: Timestamp
    - updated_at: Timestamp
    - metadata: JSON field for extra data
    """
    __tablename__ = "document_metadata"
    
    document_id = Column(String(255), primary_key=True)
    filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=True)  # Bytes
    chunks_count = Column(Integer, default=0)
    embedding_provider = Column(String(50), nullable=False)  # "openai" or "gemini"
    embedding_model = Column(String(100), nullable=False)  # e.g., "text-embedding-3-small"
    status = Column(String(50), default="uploaded")  # uploaded, processing, indexed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    extra_metadata = Column(JSON, default={})  # Extra data: upload_path, error_msg, etc.
    
    def __repr__(self):
        return f"<DocumentMetadata(doc_id={self.document_id}, status={self.status})>"


class WorkflowDefinition(Base):
    """
    Store workflow definitions (optional)
    
    Fields:
    - workflow_id: UUID of the workflow
    - name: Workflow name
    - description: Workflow description
    - definition: JSON containing the workflow nodes and edges
    - created_by: User who created
    - created_at: Timestamp
    - updated_at: Timestamp
    - is_active: Whether workflow is active
    - metadata: Extra data
    """
    __tablename__ = "workflow_definitions"
    
    workflow_id = Column(String(255), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    definition = Column(JSON, nullable=False)  # {nodes: [...], edges: [...]}
    created_by = Column(String(255), nullable=True)  # Username or email
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    extra_metadata = Column(JSON, default={})
    
    def __repr__(self):
        return f"<WorkflowDefinition(workflow_id={self.workflow_id}, name={self.name})>"


class ChatLog(Base):
    """
    Store chat logs (optional)
    
    Fields:
    - chat_id: UUID of the chat session
    - workflow_id: Which workflow was used
    - document_id: Which document was queried
    - query: User's question
    - answer: LLM's response
    - sources: Number of chunks used
    - model: LLM model used
    - temperature: Temperature setting
    - provider: LLM provider (openai or gemini)
    - embedding_model: Which embedding model was used
    - tokens_used: Token count (if available)
    - created_at: Timestamp
    - metadata: Extra data
    """
    __tablename__ = "chat_logs"
    
    chat_id = Column(String(255), primary_key=True)
    workflow_id = Column(String(255), nullable=True)
    document_id = Column(String(255), nullable=False)
    query = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    sources = Column(Integer, default=0)
    model = Column(String(100), nullable=False)  # LLM model
    temperature = Column(String(10), default="0.7")
    provider = Column(String(50), nullable=False)  # openai or gemini
    embedding_model = Column(String(100), nullable=False)  # embedding model used
    tokens_used = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    extra_metadata = Column(JSON, default={})  # web_search_used, custom_prompt, etc.
    
    def __repr__(self):
        return f"<ChatLog(chat_id={self.chat_id}, model={self.model})>"


# ===== DATABASE FUNCTIONS =====

def init_db():
    """Initialize database - create all tables"""
    try:
        Base.metadata.create_all(engine)
        print("[DB] ✅ Database tables created/verified")
    except Exception as e:
        print(f"[DB] ❌ Error initializing database: {str(e)}")
        raise


def get_db_session():
    """Get database session"""
    return SessionLocal()


def close_db_session(session):
    """Close database session"""
    if session:
        session.close()


# ===== CRUD OPERATIONS =====

class DocumentService:
    """Service for document metadata operations"""
    
    @staticmethod
    def create_document(document_id: str, filename: str, embedding_provider: str, 
                       embedding_model: str, file_size: int = None) -> DocumentMetadata:
        """Create new document record"""
        session = get_db_session()
        try:
            doc = DocumentMetadata(
                document_id=document_id,
                filename=filename,
                embedding_provider=embedding_provider,
                embedding_model=embedding_model,
                file_size=file_size,
                status="uploaded"
            )
            session.add(doc)
            session.commit()
            print(f"[DB] ✅ Document created: {document_id}")
            return doc
        except Exception as e:
            session.rollback()
            print(f"[DB] ❌ Error creating document: {str(e)}")
            raise
        finally:
            close_db_session(session)
    
    @staticmethod
    def get_document(document_id: str) -> DocumentMetadata:
        """Get document by ID"""
        session = get_db_session()
        try:
            doc = session.query(DocumentMetadata).filter_by(document_id=document_id).first()
            return doc
        finally:
            close_db_session(session)
    
    @staticmethod
    def update_document_status(document_id: str, status: str, chunks_count: int = None):
        """Update document status"""
        session = get_db_session()
        try:
            doc = session.query(DocumentMetadata).filter_by(document_id=document_id).first()
            if doc:
                doc.status = status
                if chunks_count is not None:
                    doc.chunks_count = chunks_count
                doc.updated_at = datetime.utcnow()
                session.commit()
                print(f"[DB] ✅ Document updated: {document_id} → {status}")
            return doc
        except Exception as e:
            session.rollback()
            print(f"[DB] ❌ Error updating document: {str(e)}")
            raise
        finally:
            close_db_session(session)
    
    @staticmethod
    def list_documents(status: str = None) -> list:
        """List documents (optionally filtered by status)"""
        session = get_db_session()
        try:
            query = session.query(DocumentMetadata)
            if status:
                query = query.filter_by(status=status)
            return query.all()
        finally:
            close_db_session(session)


class ChatLogService:
    """Service for chat log operations"""
    
    @staticmethod
    def create_chat_log(chat_id: str, document_id: str, query: str, answer: str,
                       sources: int, model: str, temperature: float, provider: str,
                       embedding_model: str, workflow_id: str = None) -> ChatLog:
        """Create chat log entry"""
        session = get_db_session()
        try:
            log = ChatLog(
                chat_id=chat_id,
                document_id=document_id,
                query=query,
                answer=answer,
                sources=sources,
                model=model,
                temperature=str(temperature),
                provider=provider,
                embedding_model=embedding_model,
                workflow_id=workflow_id
            )
            session.add(log)
            session.commit()
            print(f"[DB] ✅ Chat log created: {chat_id}")
            return log
        except Exception as e:
            session.rollback()
            print(f"[DB] ❌ Error creating chat log: {str(e)}")
            raise
        finally:
            close_db_session(session)
    
    @staticmethod
    def get_chat_logs(document_id: str = None, limit: int = 50) -> list:
        """Get chat logs (optionally filtered by document)"""
        session = get_db_session()
        try:
            query = session.query(ChatLog)
            if document_id:
                query = query.filter_by(document_id=document_id)
            return query.order_by(ChatLog.created_at.desc()).limit(limit).all()
        finally:
            close_db_session(session)


class WorkflowService:
    """Service for workflow definitions"""
    
    @staticmethod
    def create_workflow(workflow_id: str, name: str, definition: dict,
                       created_by: str = None, description: str = None) -> WorkflowDefinition:
        """Create workflow definition"""
        session = get_db_session()
        try:
            workflow = WorkflowDefinition(
                workflow_id=workflow_id,
                name=name,
                definition=definition,
                created_by=created_by,
                description=description
            )
            session.add(workflow)
            session.commit()
            print(f"[DB] ✅ Workflow created: {workflow_id}")
            return workflow
        except Exception as e:
            session.rollback()
            print(f"[DB] ❌ Error creating workflow: {str(e)}")
            raise
        finally:
            close_db_session(session)
    
    @staticmethod
    def get_workflow(workflow_id: str) -> WorkflowDefinition:
        """Get workflow by ID"""
        session = get_db_session()
        try:
            return session.query(WorkflowDefinition).filter_by(workflow_id=workflow_id).first()
        finally:
            close_db_session(session)


# Initialize on import
if __name__ != "__main__":
    try:
        init_db()
    except Exception as e:
        print(f"[DB] Warning: Could not initialize database: {str(e)}")
        print("[DB] Make sure PostgreSQL is running and DATABASE_URL is set correctly")
