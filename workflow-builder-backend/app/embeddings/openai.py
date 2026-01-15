from pathlib import Path
import os
from langchain_openai import OpenAIEmbeddings as LangChainOpenAIEmbeddings
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not found in environment")


class OpenAIEmbeddingService:
    def __init__(self,model: str = "text-embedding-3-large"):
        self.embedding_model = LangChainOpenAIEmbeddings(
            model=model,
            api_key=OPENAI_API_KEY
        )
    
    async def get_embedding_model(self):
        print(self)
        return self.embedding_model
    
openai_embeddings = OpenAIEmbeddingService()