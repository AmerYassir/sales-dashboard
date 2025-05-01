from pydantic import BaseModel

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