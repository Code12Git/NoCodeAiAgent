# 🚀 NoCode AI Agent - Workflow Builder

A powerful no-code platform for building AI-powered document processing workflows with a visual node-based interface. Create sophisticated RAG (Retrieval-Augmented Generation) pipelines without writing code!

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🌟 Overview

NoCode AI Agent is a full-stack application that enables users to:
- Build visual AI workflows using drag-and-drop nodes
- Upload and process PDF documents
- Query documents using state-of-the-art LLMs (GPT-4, Gemini)
- Get accurate, context-aware answers with source citations
- Ask follow-up questions with conversation memory
- Leverage vector search for semantic document retrieval

## ✨ Features

### Frontend
- 🎨 **Visual Workflow Builder** - Drag-and-drop node-based interface
- 📄 **Document Upload** - Direct PDF upload with progress tracking
- 🤖 **Multi-Provider Support** - OpenAI and Google Gemini integration
- 💬 **Interactive Chat** - Ask questions and get AI-powered answers
- 🔄 **Follow-up Questions** - Continue conversations with context
- 📊 **Confidence Scoring** - Visual feedback on answer reliability
- 🎯 **Custom Prompts** - Override system behavior
- ⚡ **Real-time Updates** - Live workflow status and notifications

### Backend
- 🔍 **Vector Search** - Qdrant integration for semantic similarity
- 📚 **Document Processing** - Intelligent text extraction and chunking
- 🧠 **RAG Pipeline** - Retrieval-Augmented Generation
- 💾 **PostgreSQL Database** - Document and chat history storage
- 🌐 **Web Search Fallback** - Google Search API integration
- 🔌 **RESTful API** - Well-documented FastAPI endpoints
- 📊 **Confidence Scoring** - Algorithmic response quality assessment
- 🔄 **Background Jobs** - RQ (Redis Queue) for async processing

## 🏗️ Architecture

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend - React + Vite"
        UI[User Interface]
        UserNode[User Input Node]
        KBNode[Knowledge Base Node]
        LLMNode[LLM Configuration Node]
        OutputNode[Output Display Node]
        
        UI --> UserNode
        UserNode --> KBNode
        KBNode --> LLMNode
        LLMNode --> OutputNode
    end
    
    subgraph "Backend - FastAPI"
        UploadAPI[Upload API<br/>/knowledge/upload]
        ProcessAPI[Process API<br/>/process/document]
        LLMAPI[LLM API<br/>/llm/process]
        OutputAPI[Output API<br/>/output/follow-up]
        
        Worker[RQ Background Worker]
    end
    
    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL<br/>Document Metadata<br/>Chat Logs)]
        Qdrant[(Qdrant<br/>Vector Store<br/>Embeddings)]
        Redis[(Redis<br/>Job Queue)]
    end
    
    subgraph "External Services"
        OpenAI[OpenAI API<br/>GPT-4, Embeddings]
        Gemini[Google Gemini<br/>Gemini Pro]
        WebSearch[Google Search<br/>Web Fallback]
    end
    
    %% Frontend to Backend
    KBNode -->|Upload PDF| UploadAPI
    KBNode -->|Process Document| ProcessAPI
    LLMNode -->|Query + RAG| LLMAPI
    OutputNode -->|Follow-up| OutputAPI
    
    %% Backend to Data Layer
    UploadAPI -->|Save Metadata| PostgreSQL
    ProcessAPI -->|Queue Job| Redis
    LLMAPI -->|Store Chat| PostgreSQL
    LLMAPI -->|Search Vectors| Qdrant
    
    %% Worker Processing
    Redis -->|Consume Jobs| Worker
    Worker -->|Generate Embeddings| OpenAI
    Worker -->|Generate Embeddings| Gemini
    Worker -->|Store Vectors| Qdrant
    Worker -->|Update Status| PostgreSQL
    
    %% LLM Processing
    LLMAPI -->|Generate Response| OpenAI
    LLMAPI -->|Generate Response| Gemini
    LLMAPI -->|Fallback Search| WebSearch
    
    style UI fill:#e1f5ff
    style PostgreSQL fill:#336791
    style Qdrant fill:#DC244C
    style Redis fill:#DC382D
    style OpenAI fill:#10a37f
    style Gemini fill:#4285f4
```

### Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Worker
    participant Qdrant
    participant LLM
    participant DB
    
    %% Document Upload Flow
    User->>Frontend: Upload PDF
    Frontend->>Backend: POST /knowledge/upload
    Backend->>Backend: Extract Text & Chunk
    Backend->>DB: Save Document Metadata
    Backend->>Worker: Queue Embedding Job
    Backend-->>Frontend: Return document_id
    
    Worker->>LLM: Generate Embeddings
    LLM-->>Worker: Return Vectors
    Worker->>Qdrant: Store Vectors
    Worker->>DB: Update Status
    
    %% Query Flow
    User->>Frontend: Enter Query
    Frontend->>Backend: POST /llm/process
    Backend->>Qdrant: Vector Search (Top K)
    Qdrant-->>Backend: Return Relevant Chunks
    Backend->>LLM: RAG Prompt + Context
    LLM-->>Backend: Generated Answer
    Backend->>DB: Save Chat Log
    Backend-->>Frontend: Return Answer
    Frontend-->>User: Display Response
    
    %% Follow-up Flow
    User->>Frontend: Ask Follow-up
    Frontend->>Backend: POST /output/follow-up
    Backend->>DB: Retrieve Chat History
    Backend->>Qdrant: Vector Search
    Qdrant-->>Backend: Relevant Chunks
    Backend->>LLM: Context + History + Query
    LLM-->>Backend: Follow-up Answer
    Backend->>DB: Update Chat Log
    Backend-->>Frontend: Return Answer
    Frontend-->>User: Display Response
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Port 5173)                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  React Flow Canvas (Zustand State Management)          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │    │
│  │  │   User   │ │Knowledge │ │   LLM    │ │  Output  │  │    │
│  │  │  Input   │→│   Base   │→│   Node   │→│   Node   │  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/REST API
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Port 8000)                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  FastAPI Application (CORS Enabled)                    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │    │
│  │  │  Upload  │ │ Process  │ │   LLM    │ │  Output  │  │    │
│  │  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │  │    │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │    │
│  └───────┼────────────┼────────────┼────────────┼────────┘    │
│          │            │            │            │              │
│  ┌───────▼────────────▼────────────▼────────────▼────────┐    │
│  │             Business Logic Layer                       │    │
│  │  • File Loader    • Text Extractor                     │    │
│  │  • Text Chunker   • Embedding Services                 │    │
│  │  • Vector Store   • Web Search                         │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │    Qdrant    │ │  OpenAI/     │ │    Redis     │
│   Database   │ │ Vector Store │ │   Gemini     │ │    Queue     │
│              │ │              │ │     API      │ │              │
│ • Documents  │ │ • Embeddings │ │ • GPT-4      │ │ • Job Queue  │
│ • Chat Logs  │ │ • Collections│ │ • Gemini Pro │ │ • RQ Worker  │
│ • Metadata   │ │ • Similarity │ │ • Embeddings │ │ • Async Jobs │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
     Port 5432       Port 6333       External API      Port 6379
```

## 📋 Prerequisites

### System Requirements
- **Node.js** 18+ and npm/yarn/pnpm
- **Python** 3.12+
- **PostgreSQL** 14+
- **Redis** (for background jobs)
- **Qdrant** (vector database)

### API Keys
- **OpenAI API Key** - For GPT models and embeddings
- **Google Gemini API Key** - For Gemini models (optional)
- **Google Search API** - For web search fallback (optional)

### Operating Systems
- ✅ Linux (Ubuntu, Debian, etc.)
- ✅ macOS (see [MACOS_FORK_FIX.md](MACOS_FORK_FIX.md) for worker setup)
- ✅ Windows (WSL recommended)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Code12Git/NoCodeAiAgent.git
cd NoCodeAiAgent
```

### 2. Set Up Backend

```bash
cd workflow-builder-backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://username:password@localhost:5432/workflow_builder
EOF

# Start services (Qdrant and Redis)
docker run -d -p 6333:6333 qdrant/qdrant
docker run -d -p 6379:6379 redis

# Start backend
fastapi dev app/main.py
```

### 3. Set Up Frontend

```bash
# Open new terminal
cd workflow-builder-frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

# Start frontend
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🔧 Backend Setup

### Directory Structure

```
workflow-builder-backend/
├── app/
│   ├── main.py                    # FastAPI app
│   ├── database.py                # SQLAlchemy models
│   ├── api/routes/               # API endpoints
│   ├── embeddings/               # Embedding services
│   ├── services/                 # Business logic
│   ├── vector_store/             # Qdrant integration
│   ├── queue/                    # Redis queue
│   └── worker/                   # Background jobs
├── data/uploads/                 # Uploaded files
├── requirements.txt              # Python dependencies
├── .env                          # Environment variables
└── run_worker.py                # Worker startup script
```

### Environment Variables

Create `workflow-builder-backend/.env`:

```bash
# API Keys
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=AIzaSy...

# Database
DATABASE_URL=postgresql://myuser:password@localhost:5432/mydb

# Qdrant (Optional - uses localhost:6333 by default)
QDRANT_URL=http://localhost:6333
# QDRANT_API_KEY=your_key_here  # For cloud Qdrant

# Redis (Optional - uses localhost:6379 by default)
REDIS_URL=redis://localhost:6379
```

### Database Setup

#### Option A: Local PostgreSQL

```bash
# Install PostgreSQL
sudo apt-get install postgresql  # Ubuntu/Debian
brew install postgresql           # macOS

# Create database
createdb workflow_builder

# Or using psql
psql -U postgres -c "CREATE DATABASE workflow_builder;"
```

#### Option B: Docker PostgreSQL

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=workflow_builder \
  -p 5432:5432 \
  postgres:16
```

### Vector Database Setup

#### Option A: Local Qdrant (Docker)

```bash
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

#### Option B: Qdrant Cloud

1. Sign up at https://cloud.qdrant.io/
2. Create a cluster
3. Add URL and API key to `.env`

### Redis Setup

```bash
# Docker
docker run -d --name redis -p 6379:6379 redis

# Or install locally
sudo apt-get install redis-server  # Ubuntu/Debian
brew install redis                  # macOS
```

### Starting the Backend

#### Terminal 1: Backend API

```bash
cd workflow-builder-backend
source venv/bin/activate
fastapi dev app/main.py
```

#### Terminal 2: Background Worker

**Linux/Windows:**
```bash
cd workflow-builder-backend
source venv/bin/activate
python -m rq worker -c app.queue.valkey
```

**macOS:** (See [MACOS_FORK_FIX.md](MACOS_FORK_FIX.md))
```bash
cd workflow-builder-backend
source venv/bin/activate
python run_worker.py
```

### API Endpoints

- `POST /knowledge/upload` - Upload PDF document
- `POST /process/document` - Process and embed document
- `POST /llm/process` - Query with RAG
- `POST /output/follow-up` - Ask follow-up questions
- `POST /output/confidence` - Calculate confidence score
- `GET /docs` - Interactive API documentation

## 🎨 Frontend Setup

### Directory Structure

```
workflow-builder-frontend/
├── src/
│   ├── api/                      # API integrations
│   ├── helpers/                  # Utilities
│   ├── hook/                     # Custom hooks
│   ├── nodes/                    # Node components
│   │   ├── knowledgeBaseNode.jsx
│   │   ├── llmNode.jsx
│   │   ├── outputNode.jsx
│   │   └── userNode.jsx
│   ├── App.jsx                   # Main component
│   ├── store.js                  # State management
│   ├── toolbar.jsx               # Node toolbar
│   └── ui.jsx                    # Workflow canvas
├── package.json
├── vite.config.js
└── .env
```

### Environment Variables

Create `workflow-builder-frontend/.env`:

```bash
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Workflow Builder
```

### Starting the Frontend

```bash
cd workflow-builder-frontend
npm install
npm run dev
```

The app will be available at http://localhost:5173

### Building for Production

```bash
npm run build
npm run preview  # Preview production build
```

## 📖 Usage Guide

### Creating Your First Workflow

1. **Add User Input Node**
   - Click "User Input" in the toolbar
   - Enter your question (e.g., "What is the main topic?")

2. **Add Knowledge Base Node**
   - Click "Knowledge Base" in the toolbar
   - Upload a PDF document
   - Select embedding provider (OpenAI or Gemini)
   - Choose embedding model

3. **Add LLM Node**
   - Click "LLM" in the toolbar
   - Select LLM model (GPT-4, GPT-3.5, Gemini)
   - Adjust temperature (0.0-1.0)
   - Add custom prompt (optional)
   - Enable web search fallback (optional)

4. **Add Output Node**
   - Click "Output" in the toolbar
   - This will display the AI response

5. **Connect Nodes**
   - Drag from output handles to input handles
   - Order: User Input → Knowledge Base → LLM → Output

6. **Submit Workflow**
   - Click "Submit Workflow" button
   - Wait for processing
   - View response in Output node

### Asking Follow-up Questions

Once you have a response:

1. Go to the Output Node
2. Enter your follow-up question in the text area
3. Click "Send Follow-up"
4. The response will update with context-aware answer

### Example Workflows

#### Simple Document Q&A

```
[User: "What is...?"] → [KB: document.pdf] → [LLM: GPT-4] → [Output]
```

#### With Custom Prompt

```
[User: "Summarize"] → [KB: doc.pdf] → [LLM: GPT-4 + "Be concise"] → [Output]
```

#### With Web Search Fallback

```
[User: "Latest news?"] → [KB: doc.pdf] → [LLM: GPT-4 + Web Search] → [Output]
```

## 📚 API Documentation

### Upload Document

```bash
curl -X POST http://localhost:8000/knowledge/upload \
  -F "file=@document.pdf"
```

**Response:**
```json
{
  "document_id": "unique-id.pdf",
  "chunks_count": 42,
  "chunks": [...]
}
```

### Process Document

```bash
curl -X POST http://localhost:8000/process/document \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "unique-id.pdf",
    "chunks": [...],
    "embedding_provider": "openai",
    "embedding_model": "text-embedding-3-small"
  }'
```

### Query with RAG

```bash
curl -X POST http://localhost:8000/llm/process \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is this about?",
    "provider": "openai",
    "model": "text-embedding-3-small",
    "document_id": "unique-id.pdf",
    "llmModel": "gpt-4",
    "temperature": 0.7,
    "enable_web_search": false,
    "custom_prompt": "You are a helpful assistant."
  }'
```

**Response:**
```json
{
  "answer": "This document is about...",
  "chat_id": "conversation-uuid",
  "sources": [...],
  "confidence": 0.85
}
```

### Follow-up Question

```bash
curl -X POST http://localhost:8000/output/follow-up \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "conversation-uuid",
    "follow_up_query": "Tell me more",
    "document_id": "unique-id.pdf",
    "llm_model": "gpt-4",
    "temperature": 0.7,
    "provider": "openai",
    "embedding_model": "text-embedding-3-small"
  }'
```

## 🗂️ Project Structure

```
NoCodeAiAgent/
├── workflow-builder-backend/       # FastAPI backend
│   ├── app/
│   │   ├── api/routes/            # API endpoints
│   │   ├── embeddings/            # Embedding providers
│   │   ├── services/              # Business logic
│   │   ├── vector_store/          # Qdrant integration
│   │   ├── queue/                 # Redis queue
│   │   ├── worker/                # Background jobs
│   │   ├── database.py            # SQLAlchemy models
│   │   └── main.py                # FastAPI app
│   ├── data/uploads/              # Uploaded files
│   ├── requirements.txt           # Dependencies
│   ├── .env                       # Environment vars
│   └── run_worker.py             # Worker script
│
├── workflow-builder-frontend/      # React frontend
│   ├── src/
│   │   ├── api/                   # API integrations
│   │   ├── nodes/                 # React Flow nodes
│   │   ├── App.jsx                # Main app
│   │   ├── store.js               # Zustand store
│   │   └── ui.jsx                 # Workflow canvas
│   ├── package.json
│   └── .env
│
├── MACOS_FORK_FIX.md              # macOS worker fix
└── README.md                       # This file
```

## 🐛 Troubleshooting

### Backend Issues

#### PostgreSQL Connection Error

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list                # macOS

# Verify credentials
psql -U username -d workflow_builder

# Update DATABASE_URL in .env
```

#### Qdrant Connection Error

```bash
# Check Qdrant status
curl http://localhost:6333/collections

# Restart Qdrant
docker restart qdrant
```

#### Worker Not Processing Jobs (macOS)

See [MACOS_FORK_FIX.md](MACOS_FORK_FIX.md) for detailed macOS worker setup.

```bash
# Use the special worker script
python run_worker.py
```

### Frontend Issues

#### Backend Connection Failed

1. Ensure backend is running on port 8000
2. Check CORS settings in `app/main.py`
3. Verify `VITE_API_URL` in `.env`

#### Nodes Not Updating

1. Clear browser cache
2. Check browser console for errors
3. Verify Zustand store updates

#### File Upload Failing

1. Check file is PDF format
2. Verify backend `/knowledge/upload` endpoint
3. Check file size limits

### Common Errors

#### "No module named 'app'"

```bash
# Ensure you're in the correct directory
cd workflow-builder-backend
source venv/bin/activate
```

#### "Cannot connect to Qdrant"

```bash
# Start Qdrant
docker run -d -p 6333:6333 qdrant/qdrant
```

#### "PostgreSQL connection refused"

```bash
# Check PostgreSQL is running
sudo service postgresql start  # Linux
brew services start postgresql # macOS
```

## 🔒 Security Best Practices

- ✅ Store API keys in `.env` files
- ✅ Never commit `.env` files to Git
- ✅ Use HTTPS in production
- ✅ Implement rate limiting on API
- ✅ Validate all user inputs
- ✅ Restrict file upload types
- ✅ Use proper CORS configuration

## 🚀 Deployment

### Backend (Docker)

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend (Vercel/Netlify)

```bash
npm run build
# Deploy dist/ folder
```

### Environment Variables for Production

```bash
# Backend
DATABASE_URL=postgresql://prod-user:prod-pass@db-host:5432/prod-db
QDRANT_URL=https://your-qdrant-cloud.com
REDIS_URL=redis://prod-redis:6379

# Frontend
VITE_API_URL=https://api.yourapp.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **FastAPI** - Modern Python web framework
- **React Flow** - Node-based UI library
- **LangChain** - LLM application framework
- **Qdrant** - Vector database
- **OpenAI** - GPT models and embeddings
- **Google** - Gemini AI models

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/Code12Git/NoCodeAiAgent/issues)
- 📚 **Docs**: http://localhost:8000/docs (when running)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Code12Git/NoCodeAiAgent/discussions)

---

**Built with ❤️ by Code12Git**

**Star ⭐ this repo if you find it useful!**
