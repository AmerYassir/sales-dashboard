from pydantic import BaseModel, EmailStr
from typing import Optional

class Customer(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str]
    address: Optional[str]

    def as_dict(self):
        return {name: val for name, val in self.__dict__.items() if val is not None}

class UpdateCustomer(BaseModel):
    name: str | None = None
    phone: str | None = None
    address: str | None = None

    def as_dict(self):
        return {name: val for name, val in self.__dict__.items() if val is not None}
    
class CustomerResponse(BaseModel):
    id: int
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None

