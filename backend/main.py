from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
from ensure_schema import ensure_onboarding_column
from middleware import RequestLoggingMiddleware, register_error_handlers

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("duolingo")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up — ensuring database schema…")
    await ensure_onboarding_column()
    logger.info("Backend ready at /api/v1")
    yield
    logger.info("Shutting down")


app = FastAPI(
    title="Duolingo Backend API",
    description="FastAPI Backend for Duolingo Clone Language Learning App",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Allowed CORS origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://real-duolingo-frontend.vercel.app",  # Production Vercel placeholder
]

# Add CORS Middleware (allowing localhost wildcard ports and any Vercel subdomain)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)

register_error_handlers(app)

# Register routes
app.include_router(router)

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "duolingo-backend",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
