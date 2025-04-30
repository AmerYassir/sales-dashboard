from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

import jwt
from jwt import ExpiredSignatureError, InvalidTokenError
from datetime import datetime, timedelta
from datetime import timezone
from typing import Optional
from app.constants import SECRET_KEY, ALGORITHM
from fastapi import HTTPException, Depends, Request
from starlette.status import HTTP_401_UNAUTHORIZED
from app.db.client import get_db_client

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
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login") 
def token_required(func):
    @wraps(func)
    async def wrapper(*args,**kwargs):
        request: Request = kwargs.get('request') or (kwargs.get('commons', {}) or {}).get('request')
        if not request:
            raise HTTPException(status_code=400, detail="Request object is missing")
        
        tenant_id : Optional[str] = None
        try:
            token_string = await oauth2_scheme(request=request) 
            payload = jwt.decode(token_string, SECRET_KEY, algorithms=[ALGORITHM])
            tenant_id = payload.get("tenant_id")

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
        except KeyError as e:
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail=f"Missing token_id in header: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if kwargs.__contains__('commons'):
            kwargs['commons']['tenant_id'] = tenant_id
        elif kwargs.__contains__('tenant_id'):
            kwargs['tenant_id'] = tenant_id
        print(f"Tenant ID: {tenant_id}")
        print(f"kwargs: {kwargs}")
        return await func(*args, **kwargs)
    return wrapper

def common_request_params(request:Request,tenant_id:int=None, db_client=Depends(get_db_client)):
    """
    Common parameters for sales order operations.
    """
    return {
        "tenant_id": tenant_id,
        "db_client": db_client,
        "request": request,
    }