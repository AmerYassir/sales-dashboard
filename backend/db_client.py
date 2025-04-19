
import os
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
from fastapi import HTTPException
from constants import *
# Load environment variables from .env file
load_dotenv()

class DBClient:
    def __init__(self):
        self.connection = None
        self.connect()

    def connect(self):
        try:
            self.connection = psycopg2.connect(
                dbname=os.getenv("DATABASE_NAME"),
                user=os.getenv("DATABASE_USER"),
                password=os.getenv("DATABASE_PASSWORD"),
                host=os.getenv("DATABASE_HOST"),
                port=os.getenv("DATABASE_PORT")
            )
            self.connection.autocommit = True
            print("Database connection established.")
        except Exception as e:
            print(f"Error connecting to the database: {e}")

    def create_users_table(self):
        query = """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        self.execute_query(query)

    def create_products_table(self):
        query = """
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            price NUMERIC(10, 2) NOT NULL,
            stock INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        self.execute_query(query)

    def create_sales_orders_table(self):
        query = """
        CREATE TABLE IF NOT EXISTS sales_orders (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id),
            product_id INT REFERENCES products(id),
            quantity INT NOT NULL,
            total_price NUMERIC(10, 2) NOT NULL,
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        self.execute_query(query)
    def insert_value(self, table_name, data):
        # Ensure data is provided as a dictionary
        if not isinstance(data, dict) or not data:
            raise HTTPException(status_code=400, detail="Data must be a non-empty dictionary")

        # Construct the INSERT part of the query
        columns = sql.SQL(', ').join(sql.Identifier(key) for key in data.keys())
        values = sql.SQL(', ').join(sql.Placeholder() for _ in data.values())

        query = sql.SQL("INSERT INTO {} ({}) VALUES ({}) RETURNING id;").format(
        sql.Identifier(table_name),
        columns,
        values
        )

        # Execute the query
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, list(data.values()))
                inserted_id = cursor.fetchone()[0]
                print(f"Record inserted into {table_name} with ID: {inserted_id}")
                return inserted_id
        except Exception as e:
            print(f"Error inserting record into {table_name}: {e}")
        return None

    def add_user(self, data):
        return self.insert_value("users", data)

    def add_product(self, data):
        return self.insert_value("products", data)
    
    def update_value(self, table_name, data, filters):
        # Ensure data is provided as a dictionary
        if not isinstance(data, dict) or not data:
            raise HTTPException(status_code=400, detail="Data must be a non-empty dictionary")
        # Ensure filters are provided as a dictionary
        if not isinstance(filters, dict) or not filters:
            raise HTTPException(status_code=400, detail="Filters must be a non-empty dictionary")

        # Construct the SET part of the query
        set_clause = sql.SQL(', ').join(
            sql.SQL("{} = %s").format(sql.Identifier(key)) for key in data.keys()
        )
        set_values = list(data.values())

        # Construct the WHERE part of the query
        filter_conditions = []
        filter_values = []

        for column, (operator, value) in filters.items():
            if operator not in FILTER_OPERATORS:
                raise HTTPException(status_code=400, detail=f"Invalid operator: {operator}")
            filter_conditions.append(
                sql.SQL("{} {} %s").format(sql.Identifier(column), sql.SQL(operator))
            )
            filter_values.append(value)

        where_clause = sql.SQL(" WHERE ") + sql.SQL(" AND ").join(filter_conditions)

        # Combine the query
        query = sql.SQL("UPDATE {} SET {}{} RETURNING id;").format(
            sql.Identifier(table_name),
            set_clause,
            where_clause
        )

        # Execute the query
        try:
            with self.connection.cursor() as cursor:
                print(f"Executing query: {query.as_string(self.connection)}")
                print(f"Set values: {set_values}")
                print(f"Filter values: {filter_values}")
                print(f"Combined values: {set_values + filter_values}")
                cursor.execute(query, set_values + filter_values)
                updated_id = cursor.fetchone()
                if updated_id:
                    print(f"Record updated in {table_name} with ID: {updated_id[0]}")
                    return updated_id[0]
                else:
                    print("No matching record found to update.")
                    return None
        except Exception as e:
            print(f"Error updating record in {table_name}: {e}")
            return None

    def update_product(self, product_id, data):

        filters = {"id": ["=", product_id]}
        print(f"Updating product with ID: {product_id}")
        print(f"Data to update: {data}")
        print(f"Filters: {filters}")
        return self.update_value("products", data, filters)
    
    def update_user(self, user_id, name, email, password):
        data = {
            "name": name,
            "email": email,
            "password": password
        }
        filters = {"id": ["=", user_id]}
        return self.update_value("users", data, filters)
    

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
        
    def _construct_query(self, table_name, fields, filters, limit=None, offset=None):
        # Ensure fields are provided as a list
        if not isinstance(fields, list) or not fields:
            raise HTTPException(status_code=400, detail="Fields must be a non-empty list")
        # Ensure filters are provided as a dictionary
        if not isinstance(filters, dict):
            raise HTTPException(status_code=400, detail="Filters must be a dictionary")

        # Construct the SELECT part of the query
        fields_sql = sql.SQL(', ').join(sql.Identifier(field) for field in fields)

        # Construct the WHERE part of the query
        filter_conditions = []
        filter_values = []

        for column, (operator, value) in filters.items():
            if operator not in FILTER_OPERATORS:
                raise HTTPException(status_code=400, detail=f"Invalid operator: {operator}")
            filter_conditions.append(
                sql.SQL("{} {} %s").format(sql.Identifier(column), sql.SQL(operator))
            )
            filter_values.append(value)
        where_clause = sql.SQL("")
        if filter_conditions:
            where_clause = sql.SQL(" WHERE ") + sql.SQL(" AND ").join(filter_conditions)

        # Add LIMIT and OFFSET if provided
        limit_offset_clause = sql.SQL("")
        if limit is not None:
            limit_offset_clause += sql.SQL(" LIMIT %s")
            filter_values.append(limit)
        if offset is not None:
            limit_offset_clause += sql.SQL(" OFFSET %s")
            filter_values.append(offset)

        # Combine the query
        query = sql.SQL("SELECT {} FROM {}{}{};").format(
            fields_sql,
            sql.Identifier(table_name),
            where_clause,
            limit_offset_clause
        )

        return query, filter_values

    def get_value_with_columns(self, table_name, fields, filters, limit=None, offset=None):
        query, filter_values = self._construct_query(table_name, fields, filters, limit, offset)

        # Execute the query
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, filter_values)
                result = cursor.fetchall()
                column_names = [desc[0] for desc in cursor.description]
                for i, res in enumerate(result):
                    result[i] = dict(zip(column_names, res))
                if result:
                    print(f"Query result: {result}")
                else:
                    print("No results found.")
                return result
        except Exception as e:
            print(f"Error executing query: {e}")
            return None

    def get_value(self, table_name, fields, filters, limit=None, offset=None):
        query, filter_values = self._construct_query(table_name, fields, filters, limit, offset)

        # Execute the query
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, filter_values)
                result = cursor.fetchall()
                if result:
                    print(f"Query result: {result}")
                else:
                    print("No results found.")
                return result
        except Exception as e:
            print(f"Error executing query: {e}")
            return None

    def get_user_by_id(self, user_id, fields=DEFAULT_USER_GET_FIELD_KEYS):
        result=self.get_value_with_columns("users", fields, {"id": ["=",user_id]})
        return result[0] if result else None

    def get_product_by_id(self, product_id, fields=DEFAULT_PRODUCT_GET_FIELD_KEYS):
        result=self.get_value_with_columns("products", fields, {"id": ["=",product_id]})
        return result[0] if result else None

    def get_users_with_paging(self, limit, offset):
        result =self.get_value_with_columns("users", DEFAULT_USER_GET_FIELD_KEYS, {}, limit, offset)
        return result

    def get_products_with_paging(self, limit, offset):
        return self.get_value_with_columns("products", DEFAULT_PRODUCT_GET_FIELD_KEYS, {}, limit, offset)

    def get_table_count(self, table_name):
        query = sql.SQL("SELECT COUNT(*) FROM {};").format(sql.Identifier(table_name))
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query)
                total_count = cursor.fetchone()[0]
                return total_count
        except Exception as e:
            print(f"Error retrieving count for table {table_name}: {e}")
            return None


    def execute_query(self, query):
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query)
                print("Query executed successfully.")
        except Exception as e:
            print(f"Error executing query: {e}")

    def close_connection(self):
        if self.connection:
            self.connection.close()
            print("Database connection closed.")