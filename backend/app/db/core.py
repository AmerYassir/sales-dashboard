
import os
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
from fastapi import HTTPException
from app.constants import *
# Load environment variables from .env file
load_dotenv()


class DBManager:
    def __init__(self):
        self.connection = None
        self._connect()


    def _connect(self):
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
            raise HTTPException(status_code=500, detail="Database connection error")
    

    def _insert_value(self, table_name, data):
        # Ensure data is provided as a dictionary
        if not isinstance(data, dict) or not data:
            raise HTTPException(status_code=400, detail="Data must be a non-empty dictionary")

        # Construct the INSERT part of the query
        columns = sql.SQL(', ').join(sql.Identifier(key) for key in data.keys())
        values = sql.SQL(', ').join(sql.Placeholder() for _ in data.values())
        print(f"Columns: {columns}")
        print(f"Values: {values}")
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
        except psycopg2.IntegrityError as e:
            self.connection.rollback()
            print(f"Integrity error inserting record into {table_name}: {e}")
            raise HTTPException(status_code=409, detail=str(e))
        except psycopg2.ProgrammingError as e:
            self.connection.rollback()
            print(f"Programming error inserting record into {table_name}: {e}")
            raise HTTPException(status_code=500, detail=str(e))
        except psycopg2.DataError as e:
            self.connection.rollback()
            print(f"Data error inserting record into {table_name}: {e}")
            raise HTTPException(status_code=422, detail=str(e))
        except psycopg2.errors.UniqueViolation as e:
            self.connection.rollback()
            print(f"Unique violation error inserting record into {table_name}: {e}")
            raise HTTPException(status_code=400, detail=str(e))
        except psycopg2.Error as e:
            print(f"Database error inserting record into {table_name}: {e}")
            print(type(e))
            raise HTTPException(status_code=500, detail=str(e))
        except Exception as e:
            print(f"Unexpected error inserting record into {table_name}: {e}")
            raise HTTPException(status_code=500, detail=str(e))
        return None
    

    def _update_value(self, table_name, data, filters,tenant_based=True):
        # Ensure data is provided as a dictionary
        if not isinstance(data, dict) or not data:
            raise HTTPException(status_code=400, detail="Data must be a non-empty dictionary")
        # Ensure filters are provided as a dictionary
        if not isinstance(filters, dict) or not filters:
            raise HTTPException(status_code=400, detail="Filters must be a non-empty dictionary")
        if tenant_based and "tenant_id" not in data:
            raise HTTPException(status_code=400, detail="tenant_id is required in data")

        # Construct the SET part of the query
        set_clause = sql.SQL(', ').join(
            sql.SQL("{} = %s").format(sql.Identifier(key)) for key in data.keys()
        )
        set_values = list(data.values())

        # Construct the WHERE part of the query
        filter_conditions = []
        filter_values = []
        if tenant_based:
            filters.update({"tenant_id": ["=", data["tenant_id"]]})

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
                    return -1
        except Exception as e:
            print(f"Error updating record in {table_name}: {e}")
            raise HTTPException(status_code=500, detail=str(e))


    def _delete_value(self, table_name, filters, tenant_based=True):
        # Ensure filters are provided as a dictionary
        if not isinstance(filters, dict) or not filters:
            raise HTTPException(status_code=400, detail="Filters must be a non-empty dictionary")

        # Construct the WHERE part of the query
        filter_conditions = []
        filter_values = []
        if tenant_based and "tenant_id" not in filters:
            raise HTTPException(status_code=400, detail="tenant_id is required in filters for tenant-based deletion")

        for column, (operator, value) in filters.items():
            if operator not in FILTER_OPERATORS:
                raise HTTPException(status_code=400, detail=f"Invalid operator: {operator}")
            filter_conditions.append(
                sql.SQL("{} {} %s").format(sql.Identifier(column), sql.SQL(operator))
            )
            filter_values.append(value)

        where_clause = sql.SQL(" WHERE ") + sql.SQL(" AND ").join(filter_conditions)

        # Combine the query
        query = sql.SQL("DELETE FROM {}{} RETURNING id;").format(
            sql.Identifier(table_name),
            where_clause
        )

        # Execute the query
        try:
            with self.connection.cursor() as cursor:
                print(f"Executing query: {query.as_string(self.connection)}")
                print(f"Filter values: {filter_values}")
                cursor.execute(query, filter_values)
                deleted_id = cursor.fetchone()
                if deleted_id:
                    print(f"Record deleted from {table_name} with ID: {deleted_id[0]}")
                    return deleted_id[0]
                else:
                    print("No matching record found to delete.")
                    return -1
        except Exception as e:
            print(f"Error deleting record from {table_name}: {e}")
            raise HTTPException(status_code=500, detail=str(e))


    def _construct_query(self, tenant_id, table_name, fields, filters, limit=None, offset=None,tenant_based=True):
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
        if tenant_based:
            filters.update({"tenant_id": ["=", tenant_id]})
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


    def _get_value_with_columns(self, tenant_id, table_name, fields, filters, limit=None, offset=None,tenant_based=True):
        query, filter_values = self._construct_query(tenant_id,table_name, fields, filters, limit, offset,tenant_based=tenant_based)

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


    def _get_value(self, tenant_id, table_name, fields, filters, limit=None, offset=None,tenant_based=True):
        query, filter_values = self._construct_query(tenant_id,table_name, fields, filters, limit, offset,tenant_based=tenant_based)

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


    def get_table_count(self,tenant_id, table_name):
        query = sql.SQL("SELECT COUNT(*) FROM {} WHERE tenant_id={};").format(sql.Identifier(table_name),sql.Literal(tenant_id))
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query)
                total_count = cursor.fetchone()[0]
                return total_count
        except Exception as e:
            print(f"Error retrieving count for table {table_name}: {e}")
            return None
        
    
    def _execute_query(self, query):
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