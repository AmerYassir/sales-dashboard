from pydantic import BaseModel

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
