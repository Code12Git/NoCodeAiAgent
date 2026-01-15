from fastapi import FastAPI, APIRouter
from app.api.routes import upload
from app.api.routes import process
app = FastAPI()

api_router = APIRouter()

@app.get("/")
def read_root():
    return {"Hello": "World"}

# include upload router
api_router.include_router(upload.router)
api_router.include_router(process.router)

# IMPORTANT: attach api_router to app
app.include_router(api_router)
