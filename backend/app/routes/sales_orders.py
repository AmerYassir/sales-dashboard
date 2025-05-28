from fastapi import APIRouter, HTTPException,Depends,Request
from typing import List
from app.models.sales_orders import SalesOrder, ResponseSalesOrder
from app.utils import token_required,common_request_params
router = APIRouter()


# Create a new sales order (mock)
@router.post("/")
@token_required
async def create_sales_order(order:SalesOrder,commons:dict=Depends(common_request_params)):
    order=order.as_dict()
    order['items']=[item.as_dict() for item in order['items']]
    
    sale_order_id,sale_items_ids=commons['db_client'].add_sales_order(commons['tenant_id'],order)
    return {
        "sales_order_id": sale_order_id,
        "sale_items_ids": sale_items_ids,
        "status": "created",
    }

# Read all sales orders (mock)
@router.get("/")
@token_required
async def get_sales_orders(commons:dict=Depends(common_request_params), page: int = 1, page_size: int = 10,):
    if page <= 0 or page_size < 0:
        raise HTTPException(status_code=400, detail="page must be greater than 0 and offset must be non-negative.")
    tenant_id = commons['tenant_id']
    db_client = commons['db_client']
    offset = (page - 1) * page_size
    sales_orders = db_client.get_sales_orders_with_paging(tenant_id, limit=page_size, offset=offset)
    print(f"Sales orders: {sales_orders}")

    total_count = db_client.get_table_count(tenant_id, "sales_orders")
    print(f"Total products count: {total_count}")
    return {
        "sales_orders": sales_orders,
        "page": page,
        "page_size": page_size,
        "total_count": total_count,
        "total_pages": (total_count + page_size - 1) // page_size,
    }

# Read a single sales order by ID (mock)
@router.get("/{order_id}")
@token_required
async def get_sales_order(order_id: int,commons:dict=Depends(common_request_params)):
    print(f"Fetching sales order with ID: {order_id}")
    print(f"Commons: {commons}")
    sales_order = commons['db_client'].get_sales_order_by_id(commons['tenant_id'], order_id)
    if not sales_order:
        raise HTTPException(status_code=404, detail="Sales order not found.")
    return sales_order

# Delete a sales order by ID (mock)
@router.delete("/{order_id}")
@token_required
async def delete_sales_order(order_id: int,commons:dict=Depends(common_request_params)):
    print(f"Deleting sales order with ID: {order_id}")
    result = commons['db_client'].delete_sales_order(commons['tenant_id'], order_id)
    if not result:
        raise HTTPException(status_code=404, detail="Sales order not found.")
    return {"status": "deleted", "order_id": order_id}
    
