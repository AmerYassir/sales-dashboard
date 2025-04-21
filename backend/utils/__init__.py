from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

import jwt
from jwt import ExpiredSignatureError, InvalidTokenError
from datetime import datetime, timedelta
from datetime import timezone
from typing import Optional
from constants import SECRET_KEY, ALGORITHM
from fastapi import HTTPException, Depends, Request
from starlette.status import HTTP_401_UNAUTHORIZED

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_current_time():
    return datetime.now(timezone.utc)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = get_current_time() + expires_delta
    else:
        expire = get_current_time() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

from functools import wraps

def token_required(func):
    @wraps(func)
    async def wrapper(*args,**kwargs):
        request= kwargs.get('request')
        oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")  # Create instance here
        try:
            token_string = await oauth2_scheme(request=request) 
            payload = jwt.decode(token_string, SECRET_KEY, algorithms=[ALGORITHM])
        except ExpiredSignatureError:
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except InvalidTokenError:
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return await func(*args, **kwargs)
    return wrapper