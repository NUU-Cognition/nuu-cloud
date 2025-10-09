from abc import ABC, abstractmethod

from click import confirm
from supabase_client import supabase
from constants import TABLES


class CRUDOperations(ABC):
    """
    Class for CRUD operations for each table in the database.
    """

    def print_all_tables(self):
        for table in TABLES:
            response = supabase.table(table.value).select("*").execute()
            print(f"Table: {table.value}")
            print(response.data)
            print("-" * 40)

    def print_table(self, table_name: str):
        response = supabase.table(table_name).select("*").execute()
        return response.data

    def insert_row(self, table_name: str, data: dict):
        response = supabase.table(table_name).insert(data).execute()
        return response.data

    def update_row(self, table_name: str, id: int, data: dict):
        response = supabase.table(table_name).update(
            data).eq("id", id).execute()
        return response.data

    def delete_row(self, table_name: str, id: int):
        response = supabase.table(table_name).delete().eq("id", id).execute()
        return response.data

    # TODO: WHERE clause for deletions else error
    def delete_all_rows(self, table=None):
        if table:
            confirm = input(
                f"Are you sure you want to delete all contents of table '{table}'? (y/n) ")
            if confirm.lower() != "y":
                print("Operation cancelled.")
                return
            response = supabase.table(table).delete().execute()
            print(f"Deleted all rows from table: {table}")
            print(response.data)
            print("-" * 40)
            return
        else:
            confirm = input(
                f"Are you sure you want to delete all table contents? (y/n) ")
            if confirm.lower() != "y":
                print("Operation cancelled.")
                return
            for table in TABLES:
                response = supabase.table(table.value).delete().execute()
                print(f"Deleted all rows from table: {table.value}")
                print(response.data)
                print("-" * 40)
