import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
# IMPORTANT: Use the ANON key, not the Service key, to mimic the frontend
SUPABASE_ANON_KEY = os.getenv("VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY")
    exit(1)

print(f"Connecting to Supabase with ANON key...")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

print("Attempting to fetch 2000 rows from 'merged_out'...")
# Try to fetch more than 1000
response = supabase.table('merged_out').select('genome_id').limit(2000).execute()

count = len(response.data) if response.data else 0
print(f"Fetched Count: {count}")

if count == 1000:
    print("CONFIRMED: Server is enforcing a 1000 row limit per request.")
elif count > 1000:
    print(f"Success! Server allowed fetching {count} rows.")
else:
    print(f"Fetched fewer than 1000 rows ({count}). Dataset might be small.")
