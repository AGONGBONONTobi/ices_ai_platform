"""Profil de l'utilisateur connecté — remplace les lectures `profiles` faites
directement dans les Server Components Next.js."""

from fastapi import APIRouter

from app.deps import CurrentProfile
from app.schemas import Profile

router = APIRouter(tags=["profile"])


@router.get("/me", response_model=Profile)
def read_me(profile: CurrentProfile) -> Profile:
    return profile
