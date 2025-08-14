from fastapi import Header, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
import os
import requests

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_JWKS_URL = "https://clerk.clerk.dev/.well-known/jwks.json"

security = HTTPBearer()
_cached_jwks = None

def get_jwks():
    global _cached_jwks
    if _cached_jwks is None:
        res = requests.get(CLERK_JWKS_URL)
        if res.status_code != 200:
            raise HTTPException(status_code=500, detail="Unable to fetch Clerk JWKS")
        _cached_jwks = res.json()
    return _cached_jwks

def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    token = credentials.credentials
    jwks = get_jwks()

    try:
        unverified_header = jwt.get_unverified_header(token)
        key = next((k for k in jwks["keys"] if k["kid"] == unverified_header["kid"]), None)

        if not key:
            raise HTTPException(status_code=401, detail="Invalid token")

        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )

        return payload["sub"]  # Clerk user ID

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")