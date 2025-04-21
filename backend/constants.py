# Default user field keys
DEFAULT_USER_GET_FIELD_KEYS = [
    "id",
    "username",
    "email",
]

# Default product field keys
DEFAULT_PRODUCT_GET_FIELD_KEYS = [
    "id",
    "name",
    "description",
    "price",
    "stock",
]
# Filter operators for validation
FILTER_OPERATORS = [
    "=",
    "!=",
    "<",
    ">",
    "<=",
    ">=",
    "LIKE",
    "NOT LIKE",
    "IN",
    "NOT IN",
]

SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 3600  # 1 hour