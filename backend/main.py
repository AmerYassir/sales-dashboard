from fastapi import FastAPI, UploadFile, HTTPException,Request,Path,Depends
from psycopg2.extras import RealDictCursor
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from db_client import DBClient
from contextlib import asynccontextmanager
from typing import Annotated
from pydantic import BaseModel
from utils import get_password_hash, verify_password, create_access_token,token_required
from datetime import timedelta
from constants import ACCESS_TOKEN_EXPIRE_SECONDS
# Create the FastAPI app
app = FastAPI()
origins = [
    "http://localhost:5173",
]
# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Temporarily allow all origins for development
    allow_credentials=True,  # Allow cookies/credentials if needed
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


class User(BaseModel):
    username: str
    email: str
    password: str

    def as_dict(self):
        return {
            name: val for name, val in self.__dict__.items() if val is not None
        }

class UpdateUser(BaseModel):
    username: str | None = None
    password: str | None = None

    def as_dict(self):
        return {
            name: val for name, val in self.__dict__.items() if val is not None
        }
class Product(BaseModel):
    name: str
    description: str | None = None
    price: float
    stock: int | None = None
    def as_dict(self):
        return {
            name:val for name,val in self.__dict__.items() if val is not None
        }
class UpdateProduct(Product):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    stock: int | None = None

db_client= DBClient()
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

app = FastAPI(lifespan=lifespan)

@app.post("/products/")
@token_required
async def create_product(request:Request,product: Product):
    """
    Endpoint to create a new product.
    """
    print("Creating product :{product}")
    product_id=db_client.add_product(product.as_dict())
    if not product_id:
        raise HTTPException(status_code=500, detail="Failed to create product")
    return {"product_id": product_id,"status":"created","product":db_client.get_product_by_id(product_id)}

@app.put("/products/{product_id}")
@token_required
async def update_product(
    request:Request,
    product_id: Annotated[int, Path(title="The ID of the Product to get", ge=0)],
    q: str | None = None,
    product: UpdateProduct | None = None,
):
    """
    Endpoint to update a product by its ID.
    """
    if not product:
        raise HTTPException(status_code=400, detail="Product data is required")
    
    print(f"Updating product with ID: {product_id}")
    db_client.update_product(product_id, product.as_dict())
    return {"product_id": product_id, "status": "updated", "product": db_client.get_product_by_id(product_id)}


@app.post("/users/")
@token_required
async def create_user(request:Request,user: User):
    """
    Endpoint to create a new user.
    """
    hashed_password = get_password_hash(user.password)
    user_data = user.as_dict()
    user_data["password"] = hashed_password
    user_id = db_client.add_user(user_data)

    return {"user_id": user_id, "username": user_data["username"], "email": user_data["email"]}

@app.get("/products/{product_id}")
@token_required
async def get_product(request:Request, product_id: str):
    """
    Endpoint to retrieve a product by its ID.
    """
    print(f"Retrieving product with ID: {product_id}")
    product = db_client.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.get("/users/{user_id}")
@token_required
async def get_user(request:Request, user_id: str):
    """
    Endpoint to retrieve a user by their ID.
    """
    user = db_client.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/products/")
@token_required
async def get_products(request:Request, page: int = 1, page_size: int = 10):
    """
    Endpoint to retrieve products with pagination.
    """
    if page < 1 or page_size < 1:
        raise HTTPException(status_code=400, detail="Page and page_size must be greater than 0")
    
    offset = (page - 1) * page_size
    products = db_client.get_products_with_paging(page_size, offset)
    print(f"Products retrieved: {products}")
    total_count = db_client.get_table_count('products')
    print(f"Total products count: {total_count}")
    return {
        "products": products,
        "page": page,
        "page_size": page_size,
        "total_count": total_count,
        "total_pages": (total_count + page_size - 1) // page_size
    }

@app.get("/users/")
@token_required
async def get_users(request: Request,page: int = 1, page_size: int = 10):
    """
    Endpoint to retrieve users with pagination.
    """
    if page < 1 or page_size < 1:
        raise HTTPException(status_code=400, detail="Page and page_size must be greater than 0")
    
    offset = (page - 1) * page_size
    users = db_client.get_users_with_paging(page_size, offset)
    total_count = db_client.get_table_count('users')
    
    return {
        "users": users,
        "page": page,
        "page_size": page_size,
        "total_count": total_count,
        "total_pages": (total_count + page_size - 1) // page_size
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
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer","expire": access_token_expires}