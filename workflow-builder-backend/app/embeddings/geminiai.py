# app/embeddings/gemini.py
from pathlib import Path
import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found in environment")


class GeminiEmbeddingService:
    def __init__(self, model: str = "models/embedding-001"):
        self.embedding_model = GoogleGenerativeAIEmbeddings(
            model=model,
            google_api_key=GEMINI_API_KEY
        )
