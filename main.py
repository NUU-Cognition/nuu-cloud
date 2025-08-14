from fastapi import FastAPI
from app.routers import files

app = FastAPI(title="NUU Cloud API")

# Include routers
app.include_router(files.router)

@app.get("/ping")
def ping():
    return {"status": "ok"}
