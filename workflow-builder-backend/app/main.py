from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import upload
from app.api.routes import process
from app.api.routes import llm
from app.api.routes import output

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (change to specific URLs in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter()

@app.get("/")
def read_root():
    return {"Hello": "World"}

# include upload router
api_router.include_router(upload.router)
api_router.include_router(process.router)
app.router.include_router(llm.router)
app.router.include_router(output.router)
# IMPORTANT: attach api_router to app
app.include_router(api_router)