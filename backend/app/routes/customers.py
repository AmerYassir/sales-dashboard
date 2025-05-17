from fastapi import APIRouter, HTTPException,Depends
from app.models.customer import Customer,UpdateCustomer,CustomerResponse
from app.utils import token_required,common_request_params
router = APIRouter()

# Create a new customer
@router.post("/")
@token_required
async def create_customer(customer: Customer, commons: dict = Depends(common_request_params)):
    customer_id=commons.get("db_client").add_customer(commons.get("tenant_id"), customer.as_dict())
    return {"status": "created", "customer_id": customer_id}

# Get a customer by ID
@router.get("/{customer_id}",response_model=CustomerResponse)
@token_required
async def get_customer(customer_id: int,commons: dict = Depends(common_request_params)):
    customer=commons.get("db_client").get_customer_by_id(commons.get("tenant_id"), customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

# Update a customer
@router.put("/{customer_id}")
@token_required
async def update_customer(customer_id: int, customer: UpdateCustomer,commons: dict = Depends(common_request_params)):
    updated_customer_id=commons.get("db_client").update_customer(commons.get("tenant_id"), customer_id, customer.as_dict())
    if not updated_customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    print(f"Updated customer ID: {updated_customer_id}")
    return {"id": int(updated_customer_id), "status": "updated"}

# Delete a customer
@router.delete("/{customer_id}")
@token_required
async def delete_customer(customer_id: int,commons: dict = Depends(common_request_params)):
    deleted_customer_id=commons.get("db_client").delete_customer(commons.get("tenant_id"), customer_id)
    if not deleted_customer_id:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"customer_id": deleted_customer_id, "status": "deleted"}
    
@router.get("/")
@token_required
async def get_customers(commons: dict = Depends(common_request_params), page: int = 1, page_size: int = 10):
    if page <= 0 or page_size < 0:
        raise HTTPException(status_code=400, detail="Page and Page_size must be greater than 0 and offset must be non-negative.")
    
    offset = (page - 1) * page_size
    customers = commons.get("db_client").get_customers_with_paging(commons.get("tenant_id"), limit=page_size, offset=offset)
    offset = (page - 1) * page_size
    total_count = commons.get("db_client").get_table_count(commons.get("tenant_id"), "customers")
    return {
        "customers": customers,
        "page": page,
        "page_size": page_size,
        "total_count": total_count,
        "total_pages": (total_count + page_size - 1) // page_size,
    }