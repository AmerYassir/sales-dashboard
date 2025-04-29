
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
        
    def add_user(self, data):
        return self.insert_value("users", data)

    def add_product(self, tenant_id, data):
        data.update({"tenant_id": tenant_id})
        return self.insert_value("products", data)
    

    def delete_product(self, tenant_id, product_id):
        filters = {"id": ["=", product_id], "tenant_id": ["=", tenant_id]}
        print(f"Deleting product with ID: {product_id} for tenant ID: {tenant_id}")
        return self.delete_value("products", filters)
    
    def update_product(self, tenant_id, product_id, data):

        filters = {"id": ["=", product_id]}
        data.update({"tenant_id": tenant_id})
        print(f"Updating product with ID: {product_id}")
        print(f"Data to update: {data}")
        print(f"Filters: {filters}")
        return self.update_value("products", data, filters)
    
    def update_user(self, user_id, username, email, password):
        data = {
            "username": username,
            "email": email,
            "password": password
        }
        filters = {"id": ["=", user_id]}
        return self.update_value("users", data, filters,tenant_based=False)
    

    def add_sales_order(self, user_id, product_id, quantity, total_price):
        query = """
        INSERT INTO sales_orders (user_id, product_id, quantity, total_price)
        VALUES (%s, %s, %s, %s)
        RETURNING id;
        """
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, (user_id, product_id, quantity, total_price))
                order_id = cursor.fetchone()[0]
                print(f"Sales order added with ID: {order_id}")
                return order_id
        except Exception as e:
            print(f"Error adding sales order: {e}")
            return None
        

    def get_user_by_email(self, email, fields=['password']+DEFAULT_USER_GET_FIELD_KEYS):
        result = self.get_value_with_columns('1',"users", fields, {"email": ["=", email]},tenant_based=False)
        return result[0] if result else None
    
    def get_user_by_id(self, user_id, fields=DEFAULT_USER_GET_FIELD_KEYS):
        result=self.get_value_with_columns('1',"users", fields, {"id": ["=",user_id]},tenant_based=False)
        return result[0] if result else None

    def get_product_by_id(self, tenant_id, product_id, fields=DEFAULT_PRODUCT_GET_FIELD_KEYS):
        result=self.get_value_with_columns(tenant_id, "products", fields, {"id": ["=",product_id]})
        return result[0] if result else None

    def get_users_with_paging(self, limit, offset):
        result =self.get_value_with_columns('1',"users", DEFAULT_USER_GET_FIELD_KEYS, {}, limit, offset,tenant_based=False)
        return result

    def get_products_with_paging(self, tenant_id, limit, offset):
        return self.get_value_with_columns(tenant_id, "products", DEFAULT_PRODUCT_GET_FIELD_KEYS, {}, limit, offset)


db_client_= DBClient()

def get_db_client():
    return db_client_