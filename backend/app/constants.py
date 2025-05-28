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
# Default sales order field keys
DEFAULT_SALES_ORDER_GET_FIELD_KEYS = [
    "id",
    "total_quantity",
    "customer_id",
    "order_date",
    "order_status",
    "order_total",
    "shipping_address",
    "billing_address",
    "payment_method",
    "notes",
]
DEFAULT_SALES_ORDER_ITEM_GET_FIELD_KEYS = [
    "id",
    "product_id",
    "quantity",
    "unit_price",
    "total_price",
]
DEFAULT_CUSTOMER_GET_FIELD_KEYS = [
    "id",
    "name",
    "email",
    "phone",
    "address",
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