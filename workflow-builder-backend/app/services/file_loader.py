from fastapi import UploadFile
from pathlib import Path
import uuid

UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class FileLoader:
    async def save(self, file: UploadFile) -> str:
        print("Saving file:", "Triggered")
        ext = Path(file.filename).suffix
        file_id = f"{uuid.uuid4()}{ext}"
        file_path = UPLOAD_DIR / file_id

        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        return file_id

file_loader = FileLoader()
