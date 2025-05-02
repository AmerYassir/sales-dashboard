from fastapi import FastAPI, HTTPException, Request, Path, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from contextlib import asynccontextmanager
from typing import Annotated
from app.utils import (
    get_password_hash,
    verify_password,
    create_access_token,
    token_required,
)
from app.routes.products import router as product_router

# from routes.users import router as user_router
from datetime import timedelta
from app.db.client import db_client_ as db_client
from app.constants import ACCESS_TOKEN_EXPIRE_SECONDS
from pydantic import EmailStr
from app.routes.sales_orders import router as sales_order_router
from app.routes.customers import router as customer_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic

    db_client.create_users_table()
    db_client.create_customers_table()
    db_client.create_products_table()
    db_client.create_sales_orders_table()
    print("Starting up the application...")
    yield
    # Shutdown logic
    print("Shutting down the application...")
    db_client.close_connection()


app = FastAPI(lifespan=lifespan)

app.include_router(product_router, prefix="/products", tags=["products"])
app.include_router(sales_order_router, prefix="/sales_orders", tags=["salesorders"])
app.include_router(customer_router, prefix="/customers", tags=["customers"])

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow specific origin and fallback to all
    allow_credentials=True,  # Allow cookies/credentials if needed
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


@app.post("/login/")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Endpoint to log in a user and return an access token.
    """
    user = db_client.get_user_by_email(form_data.username)
    print(f"Logging in user: {form_data.username}, password: {form_data.password}")
    print(user)
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    access_token_expires = timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS)
    access_token = create_access_token(
        data={"sub": user["email"], "tenant_id": user["id"]},
        expires_delta=access_token_expires,
    )
    # return {"access_token": access_token, "token_type": "bearer","expire": access_token_expires}
    return {
        "expire": access_token_expires,
        "username": user["username"],
        "email": user["email"],
        "token_type": "bearer",
        "access_token": access_token,
        "user_id": user["id"],
    }


@app.post("/signup/")
async def create_user(
    request: Request,
    username: str = Form(...),
    email: EmailStr = Form(...),
    password: str = Form(...),
):
    """
    Endpoint to create a new user.
    """

    # Validate password strength
    if len(password) < 8:
        raise HTTPException(
            status_code=400, detail="Password must be at least 8 characters long"
        )
    if not any(char.isdigit() for char in password):
        raise HTTPException(
            status_code=400, detail="Password must contain at least one digit"
        )
    if not any(char.isalpha() for char in password):
        raise HTTPException(
            status_code=400, detail="Password must contain at least one letter"
        )
    if not any(char in "!@#$%^&*()-_=+[]{}|;:'\",.<>?/`~" for char in password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one special character",
        )

    hashed_password = get_password_hash(password)
    user_data = {
        "username": username,
        "email": email,
        "password": hashed_password,
    }
    user_id = db_client.add_user(user_data)
    access_token_expires = timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS)
    access_token = create_access_token(
        data={"sub": email, "tenant_id": user_id}, expires_delta=access_token_expires
    )
    return {
        "expire": access_token_expires,
        "username": username,
        "email": email,
        "token_type": "bearer",
        "access_token": access_token,
        "user_id": user_id,
    }
