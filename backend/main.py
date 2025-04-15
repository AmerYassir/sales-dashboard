from fastapi import FastAPI, UploadFile, HTTPException,Request
import psycopg2
from psycopg2.extras import RealDictCursor
import uuid
import os
from db_client import DBClient
from contextlib import asynccontextmanager

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
async def create_product(request: Request):
    """
    Endpoint to create a new product.
    """
    user_input = await request.json()
    name= user_input.get("name")
    price= user_input.get("price")
    description= user_input.get("description","hi")
    stock= user_input.get("stock", 0)
    print('here')
    print(f"Creating product: {name}, Price: {price}, Description: {description}, Stock: {stock}")
    product_id=db_client.add_product(name, description, price, stock)
    if not product_id:
        raise HTTPException(status_code=500, detail="Failed to create product")
    return {"product_id": product_id, "name": name, "price": price}


@app.post("/users/")
async def create_user(username: str, email: str,password: str):
    """
    Endpoint to create a new user.
    """
    user_id = str(uuid.uuid4())
    user_id=db_client.add_user(username, email, password)

    return {"user_id": user_id, "username": username, "email": email}

@app.get("/products/{product_id}")
async def get_product(product_id: str):
    """
    Endpoint to retrieve a product by its ID.
    """
    print(f"Retrieving product with ID: {product_id}")
    product = db_client.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.get("/users/{user_id}")
async def get_user(user_id: str):
    """
    Endpoint to retrieve a user by their ID.
    """
    user = db_client.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user