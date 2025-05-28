from enum import Enum
from pydantic import BaseModel,Field
from datetime import datetime
from fastapi import HTTPException, Request,Depends
from app.db.client import get_db_client
from typing import List
# Pydantic model- for SalesOrder
class ResponseSalesOrder(BaseModel):
    id:int
    total_quantity:int
    # customer_id:int
    order_date:datetime
    order_status:bool
    order_total:float

    def as_dict(self):
        return {
            "id": self.id,
            "total_quantity": self.total_quantity,
            # "customer_id": self.customer_id,
            "order_date": self.order_date,
            "order_status": self.order_status,
            "order_total": self.order_total,
        }

class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"
    
class SaleItem(BaseModel):
    product_id: int
    quantity: int=Field(gt=0)
    # unit_price: float
    # subtotal: float  # You might calculate this, but it's good to include

    def as_dict(self):
        return {name: val for name, val in self.__dict__.items() if val is not None}

class SalesOrder(BaseModel):
    customer_id: int
    order_status: OrderStatus  # Use str for status (e.g., "Pending", "Shipped")
    items: List[SaleItem]  # A list of SaleItem models
    shipping_address: str | None = None
    billing_address: str | None = None
    payment_method: str | None = None
    notes: str | None = None
    # Add other relevant order fields here

    def as_dict(self):
        return {name: val for name, val in self.__dict__.items() if val is not None}

    