import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_tables():
    print("Creating tables...")

    # Create users table
    supabase.table("users").insert({}).execute()  # placeholder to ensure the table exists

    # Create files table
    supabase.table("files").insert({}).execute()

    # Create media table
    supabase.table("media").insert({}).execute()

    # Create permissions table
    supabase.table("permissions").insert({}).execute()

    print("Tables created (placeholders). Please define exact schema in Supabase UI or SQL scripts.")

if __name__ == "__main__":
    create_tables()
