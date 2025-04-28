from fastapi import FastAPI, UploadFile, HTTPException, Request, Path, Depends, Form
from psycopg2.extras import RealDictCursor
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from db_client import DBClient
from contextlib import asynccontextmanager
from typing import Annotated
from pydantic import BaseModel
from utils import (
    get_password_hash,
    verify_password,
    create_access_token,
    token_required,
)
from datetime import timedelta
from constants import ACCESS_TOKEN_EXPIRE_SECONDS
from pydantic import EmailStr


class User(BaseModel):
    username: str
    email: str
    password: str

    def as_dict(self):
        return {name: val for name, val in self.__dict__.items() if val is not None}


class UpdateUser(BaseModel):
    username: str | None = None
    password: str | None = None

    def as_dict(self):
        return {name: val for name, val in self.__dict__.items() if val is not None}


class Product(BaseModel):
    name: str
    description: str | None = None
    price: float
    stock: int | None = None

    def as_dict(self):
        return {name: val for name, val in self.__dict__.items() if val is not None}


class UpdateProduct(Product):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    stock: int | None = None


db_client = DBClient()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic

    db_client.create_products_table()
    db_client.create_users_table()
    db_client.create_sales_orders_table()
    print("Starting up the application...")
    yield
    # Shutdown logic
    print("Shutting down the application...")
    db_client.close_connection()


app = FastAPI(lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow specific origin and fallback to all
    allow_credentials=True,  # Allow cookies/credentials if needed
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


@app.post("/products/")
@token_required
async def create_product(request: Request, product: Product, tenant_id: int = None):
    """
    Endpoint to create a new product.
    """
    print(f"tenant_id: {tenant_id}")
    print("Creating product: {product}")
    product_id = db_client.add_product(tenant_id, product.as_dict())
    if not product_id:
        raise HTTPException(status_code=500, detail="Failed to create product")
    return {
        "product_id": product_id,
        "status": "created",
        "product": db_client.get_product_by_id(tenant_id, product_id),
    }


@app.put("/products/{product_id}")
@token_required
async def update_product(
    request: Request,
    product_id: Annotated[int, Path(title="The ID of the Product to get", ge=0)],
    q: str | None = None,
    product: UpdateProduct | None = None,
    tenant_id: int | None = None,
):
    """
    Endpoint to update a product by its ID.
    """
    if not product:
        raise HTTPException(status_code=400, detail="Product data is required")

    print(f"Updating product with ID: {product_id}")
    res = db_client.update_product(tenant_id, product_id, product.as_dict())
    if res == -1:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "product_id": product_id,
        "status": "updated",
        "product": db_client.get_product_by_id(tenant_id, product_id),
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


@app.get("/products/{product_id}")
@token_required
async def get_product(request: Request, product_id: str, tenant_id: int = None):
    """
    Endpoint to retrieve a product by its ID.
    """
    print(f"Retrieving product with ID: {product_id}")
    product = db_client.get_product_by_id(tenant_id, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.delete("/products/{product_id}")
@token_required
async def delete_product(
    request: Request,
    product_id: Annotated[int, Path(title="The ID of the Product to get", ge=0)],
    tenant_id: int = None,
):
    """
    Endpoint to delete a product by its ID.
    """
    print(f"Deleting product with ID: {product_id}")
    res = db_client.delete_product(tenant_id, product_id)
    if res == -1:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"status": "deleted", "product_id": product_id}


@app.get("/products/")
@token_required
async def get_products(
    request: Request, page: int = 1, page_size: int = 10, tenant_id: int = None
):
    """
    Endpoint to retrieve products with pagination.
    """
    if page < 1 or page_size < 1:
        raise HTTPException(
            status_code=400, detail="Page and page_size must be greater than 0"
        )
    print(tenant_id)
    offset = (page - 1) * page_size
    products = db_client.get_products_with_paging(tenant_id, page_size, offset)
    print(f"Products retrieved: {products}")
    total_count = db_client.get_table_count(tenant_id, "products")
    print(f"Total products count: {total_count}")
    return {
        "products": products,
        "page": page,
        "page_size": page_size,
        "total_count": total_count,
        "total_pages": (total_count + page_size - 1) // page_size,
    }


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
