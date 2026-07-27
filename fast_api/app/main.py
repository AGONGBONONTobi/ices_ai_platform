"""Point d'entrée du backend FastAPI de Plateforme IA.

Toutes les routes sont montées sous `/api` afin que le frontend n'ait qu'à
changer la base d'URL (`NEXT_PUBLIC_API_BASE_URL`) sans réécrire ses chemins.
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import execute, profile, stripe_routes, tools

logging.basicConfig(level=logging.INFO)

settings = get_settings()

app = FastAPI(
    title="Plateforme IA — API",
    version="0.1.0",
    description="Backend des outils d'analyse IA (catalogue, exécution LLM, facturation).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tools.router, prefix="/api")
app.include_router(execute.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(stripe_routes.router, prefix="/api")


@app.get("/api/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
