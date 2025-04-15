
import os
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

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

    def add_user(self, name, email, password):
        query = """
        INSERT INTO users (name, email, password)
        VALUES (%s, %s, %s)
        RETURNING id;
        """
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, (name, email, password))
                user_id = cursor.fetchone()[0]
                print(f"User added with ID: {user_id}")
                return user_id
        except Exception as e:
            print(f"Error adding user: {e}")
            return None

    def add_product(self, name, description, price, stock):
        query = """
        INSERT INTO products (name, description, price, stock)
        VALUES (%s, %s, %s, %s)
        RETURNING id;
        """
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, (name, description, price, stock))
                product_id = cursor.fetchone()[0]
                print(f"Product added with ID: {product_id}")
                return product_id
        except Exception as e:
            print(f"Error adding product: {e}")
            return None

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

    def get_user_by_id(self, user_id):
        query = """
        SELECT id, name, email, created_at
        FROM users
        WHERE id = %s;
        """
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, (user_id,))
                user = cursor.fetchone()
                if user:
                    print(f"User retrieved: {user}")
                else:
                    print("User not found.")
                return user
        except Exception as e:
            print(f"Error retrieving user: {e}")
            return None

    def get_product_by_id(self, product_id):
        query = """
        SELECT id, name, description, price, stock, created_at
        FROM products
        WHERE id = %s;
        """
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, (product_id,))
                product = cursor.fetchone()
                if product:
                    print(f"Product retrieved: {product}")
                else:
                    print("Product not found.")
                return product
        except Exception as e:
            print(f"Error retrieving product: {e}")
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