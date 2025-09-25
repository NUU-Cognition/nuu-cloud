from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse, JSONResponse
from typing import Optional
import uuid
import os
import mimetypes
import re

from app.utils.supabase_client import supabase
from app.utils.auth import verify_token  # <-- Clerk auth for user ID

router = APIRouter(prefix="/files", tags=["Files"])

# Root local storage path (can change to Supabase/S3 later)
STORAGE_DIR = "./storage"


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Form("vault"),
    user_id: str = Depends(verify_token)  # Get Clerk user ID
):
    try:
        # Generate file UUID
        file_id = str(uuid.uuid4())

        # Read file content
        contents = await file.read()

        # Ensure folder exists
        target_dir = os.path.join(STORAGE_DIR, folder)
        os.makedirs(target_dir, exist_ok=True)

        # Save file with unique filename
        saved_filename = f"{file_id}_{file.filename}"
        filepath = os.path.join(target_dir, saved_filename)

        with open(filepath, "wb") as f:
            f.write(contents)

        # Parse markdown dependencies (if any)
        dependencies = []
        if file.filename.endswith(".md"):
            try:
                text = contents.decode("utf-8")
                dependencies = re.findall(r"\[\[(.*?)\]\]", text)
            except Exception:
                pass

        # Insert metadata into Supabase
        supabase.table("files").insert({
            "id": file_id,
            "user_id": user_id,
            "original_name": file.filename,
            "saved_name": saved_filename,
            "path": f"{folder}/{saved_filename}",
            "version": 1,
            "dependencies": dependencies
        }).execute()

        return JSONResponse(content={
            "id": file_id,
            "original_filename": file.filename,
            "saved_filename": saved_filename,
            "path": f"{folder}/{saved_filename}",
            "dependencies": dependencies
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/{folder}/{filename}")
async def get_file(folder: str, filename: str, include_media: Optional[bool] = False):
    filepath = os.path.join(STORAGE_DIR, folder, filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")

    media_type, _ = mimetypes.guess_type(filepath)
    media_type = media_type or "application/octet-stream"

    return FileResponse(filepath, media_type=media_type, filename=filename)


@router.get("/")
async def list_user_files(user_id: str = Depends(verify_token)):
    try:
        result = supabase \
            .from_("files") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .execute()

        return result.data
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch files: {str(e)}")
