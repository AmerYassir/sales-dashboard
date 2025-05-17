
import os
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
from fastapi import HTTPException
from app.constants import *
from app.db.core import DBManager
# Load environment variables from .env file
load_dotenv()


class DBClient(DBManager):
    def __init__(self):
        super().__init__()
    
    def create_users_table(self):
        query = """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        self._execute_query(query)


    def add_user(self, data):
        return self._insert_value("users", data)


    def update_user(self, user_id, username, email, password):
        data = {
            "username": username,
            "email": email,
            "password": password
        }
        filters = {"id": ["=", user_id]}
        return self._update_value("users", data, filters,tenant_based=False)
    

    def get_user_by_email(self, email, fields=['password']+DEFAULT_USER_GET_FIELD_KEYS):
        result = self._get_value_with_columns('1',"users", fields, {"email": ["=", email]},tenant_based=False)
        return result[0] if result else None
    

    def get_user_by_id(self, user_id, fields=DEFAULT_USER_GET_FIELD_KEYS):
        result=self._get_value_with_columns('1',"users", fields, {"id": ["=",user_id]},tenant_based=False)
        return result[0] if result else None


    def get_users_with_paging(self, limit, offset):
        result =self._get_value_with_columns('1',"users", DEFAULT_USER_GET_FIELD_KEYS, {}, limit, offset,tenant_based=False)
        return result
    

    def create_products_table(self):
        query = """
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            tenant_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            price NUMERIC(10, 2) NOT NULL,
            stock INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tenant_id) REFERENCES users(id)
        );
        """
        self._execute_query(query)


    def add_product(self, tenant_id, data):
        data.update({"tenant_id": tenant_id})
        return self._insert_value("products", data)
    

    def delete_product(self, tenant_id, product_id):
        filters = {"id": ["=", product_id], "tenant_id": ["=", tenant_id]}
        print(f"Deleting product with ID: {product_id} for tenant ID: {tenant_id}")
        return self._delete_value("products", filters)
    

    def update_product(self, tenant_id, product_id, data):

        filters = {"id": ["=", product_id]}
        data.update({"tenant_id": tenant_id})
        print(f"Updating product with ID: {product_id}")
        print(f"Data to update: {data}")
        print(f"Filters: {filters}")
        return self._update_value("products", data, filters)
    

    def get_product_by_id(self, tenant_id, product_id, fields=DEFAULT_PRODUCT_GET_FIELD_KEYS):
        result=self._get_value_with_columns(tenant_id, "products", fields, {"id": ["=",product_id]})
        return result[0] if result else None


    def get_products_with_paging(self, tenant_id, limit, offset):
        return self._get_value_with_columns(tenant_id, "products", DEFAULT_PRODUCT_GET_FIELD_KEYS, {}, limit, offset)



    def create_sales_orders_table(self):
        # customer_id INT REFERENCES users(id),

        query = """
        CREATE TABLE IF NOT EXISTS sales_orders (
            id SERIAL PRIMARY KEY,
            tenant_id INT NOT NULL,
            customer_id INT NOT NULL ,
            order_status VARCHAR(50) NOT NULL,
            order_total NUMERIC(10, 2) NOT NULL,
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_quantity INT NOT NULL,
            shipping_address TEXT,
            billing_address TEXT,
            payment_method VARCHAR(50),
            FOREIGN KEY (tenant_id) REFERENCES users(id),
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        );
        """
        self._execute_query(query)

        query = """
        CREATE TABLE IF NOT EXISTS sales_order_items (
            id SERIAL PRIMARY KEY,
            sales_order_id INT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
            product_id INT NOT NULL REFERENCES products(id),
            tenant_id INT NOT NULL,
            quantity INT NOT NULL,
            total_price NUMERIC(10, 2) NOT NULL,
            unit_price NUMERIC(10, 2) NOT NULL,
            FOREIGN KEY (tenant_id) REFERENCES users(id)

        );
        """
        self._execute_query(query)
  

    def add_sales_order(self,tenant_id, data):

        def get_product_price(product_id):
            product=self.get_product_by_id(tenant_id, product_id, ["price"])
            if product:
                return product["price"]
            else:
                raise HTTPException(status_code=400, detail=f"Product with ID {product_id} not found.")
        
        if not data.get("items"):
            raise HTTPException(status_code=400, detail="at least one Item are required.")
        
        items= data.get("items").copy()
        for i in range(len(items)):
            items[i]["tenant_id"] = tenant_id
            items[i]["unit_price"] = get_product_price(items[i]["product_id"])
            items[i]["total_price"] = items[i]["quantity"] * items[i]["unit_price"]

        data.update({"tenant_id": tenant_id})
        data.update({"order_total": sum(item['total_price'] for item in items)})
        data.update({"total_quantity": sum(item['quantity'] for item in items)})
        
        print(f"Adding sales order with data: {data}")
        del data["items"]
        sale_order_id=self._insert_value("sales_orders", data)
        if sale_order_id:
            sale_items_ids = []
            for item in items:
                item["sales_order_id"] = sale_order_id
                sale_items_ids.append(self._insert_value("sales_order_items", item))
            print(f"Inserted sales order items with IDs: {sale_items_ids}")
            return sale_order_id, sale_items_ids
        return None, None
    

    def get_sales_orders_with_paging(self, tenant_id, limit, offset):
        sale_orders=self._get_value_with_columns(tenant_id, "sales_orders", DEFAULT_SALES_ORDER_GET_FIELD_KEYS, {}, limit, offset)
        
        for order in sale_orders:
            order["items"] = self.get_sales_order_items_by_order_id(tenant_id, order["id"])
        return sale_orders
    
    def get_sales_order_items_by_order_id(self, tenant_id, order_id):
        result=self._get_value_with_columns(tenant_id, "sales_order_items", DEFAULT_SALES_ORDER_ITEM_GET_FIELD_KEYS, {"sales_order_id": ["=",order_id]})
        return result if result else None
    
    def get_sales_order_by_id(self, tenant_id, order_id, fields=DEFAULT_SALES_ORDER_GET_FIELD_KEYS):
        result=self._get_value_with_columns(tenant_id, "sales_orders", fields, {"id": ["=",order_id]})
        if not result:
            raise HTTPException(status_code=404, detail="Sales order not found.")
        result[0]["items"] = self.get_sales_order_items_by_order_id(tenant_id, result[0]["id"])
        print(f"Result from get_sales_order_by_id: {result}")
        return result[0] if result else None

    def delete_sales_order(self, tenant_id, order_id):
        filters = {"id": ["=", order_id], "tenant_id": ["=", tenant_id]}
        return self._delete_value("sales_orders", filters)

    def create_customers_table(self):
        query = """
        CREATE TABLE IF NOT EXISTS customers (
            id SERIAL PRIMARY KEY,
            tenant_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            phone VARCHAR(20),
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tenant_id) REFERENCES users(id)
        );
        """
        self._execute_query(query)

    def add_customer(self, tenant_id, data):
        data.update({"tenant_id": tenant_id})
        return self._insert_value("customers", data)
    

    def update_customer(self, tenant_id, customer_id, data):
        filters = {"id": ["=", customer_id]}
        data.update({"tenant_id": tenant_id})
        return self._update_value("customers", data, filters)
    

    def get_customer_by_id(self, tenant_id, customer_id):
        result=self._get_value_with_columns(tenant_id, "customers",DEFAULT_CUSTOMER_GET_FIELD_KEYS , {"id": ["=",customer_id]})
        return result[0] if result else None
    
    def get_customers_with_paging(self, tenant_id, limit, offset):
        return self._get_value_with_columns(tenant_id, "customers", DEFAULT_CUSTOMER_GET_FIELD_KEYS, {}, limit, offset)
    
    def delete_customer(self, tenant_id, customer_id):
        filters = {"id": ["=", customer_id], "tenant_id": ["=", tenant_id]}
        return self._delete_value("customers", filters)
    
db_client_= DBClient()

def get_db_client():
    return db_client_