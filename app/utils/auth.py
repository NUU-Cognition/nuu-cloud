import os
from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
import requests

CLERK_JWKS_URL = "https://clerk.dev/.well-known/jwks.json"  # Clerk's JWKS endpoint
_jwks_cache = None  # simple in-memory cache


def get_jwks():
    global _jwks_cache
    if _jwks_cache is None:
        resp = requests.get(CLERK_JWKS_URL)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=500, detail="Failed to fetch Clerk JWKS")
        _jwks_cache = resp.json()
    return _jwks_cache


async def verify_token(authorization: str = Header(...)):
    """
    Extracts the user_id (Clerk 'sub') from a verified Clerk JWT
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Invalid Authorization header")

    token = authorization.split(" ")[1]

    try:
        # Decode without verification first to grab header.kid
        unverified_header = jwt.get_unverified_header(token)
        jwks = get_jwks()
        kid = unverified_header.get("kid")

        # Find the matching JWK
        key = next(
            (j for j in jwks["keys"] if j["kid"] == kid),
            None,
        )
        if key is None:
            raise HTTPException(
                status_code=401, detail="No matching JWK found")

        # Build public key from JWK
        from jose.utils import base64url_decode
        from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicNumbers

        n = int.from_bytes(base64url_decode(key["n"].encode("utf-8")), "big")
        e = int.from_bytes(base64url_decode(key["e"].encode("utf-8")), "big")
        public_key = RSAPublicNumbers(e, n).public_key()

        # Verify and decode
        payload = jwt.decode(
            token,
            public_key,
            algorithms=[key["alg"]],
            audience=os.getenv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
            issuer="https://clerk.dev",
        )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="No user_id in token")

        return user_id

    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth failed: {str(e)}")
