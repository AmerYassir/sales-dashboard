# routes/products.py
from app.models.product import Product
from app.utils import token_required
from app.models.product import Product, UpdateProduct
from app.db.client import get_db_client
from fastapi import APIRouter, Request,HTTPException,Depends,Path
from typing import Annotated

router = APIRouter()

@router.post("/")
@token_required
async def create_product(request: Request, product: Product,db_client=Depends(get_db_client), tenant_id: int = None):
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


@router.put("/{product_id}")
@token_required
async def update_product(
    request: Request,
    product_id: Annotated[int, Path(title="The ID of the Product to get", ge=0)],
    db_client=Depends(get_db_client),
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


@router.get("/{product_id}")
@token_required
async def get_product(request: Request, product_id: str,db_client=Depends(get_db_client), tenant_id: int = None):
    """
    Endpoint to retrieve a product by its ID.
    """
    print(f"Retrieving product with ID: {product_id}")
    product = db_client.get_product_by_id(tenant_id, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/")
@token_required
async def get_products(
    request: Request,db_client=Depends(get_db_client), page: int = 1, page_size: int = 10, tenant_id: int = None
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


@router.delete("/{product_id}")
@token_required
async def delete_product(
    request: Request,
    product_id: Annotated[int, Path(title="The ID of the Product to get", ge=0)],
    db_client=Depends(get_db_client),
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
