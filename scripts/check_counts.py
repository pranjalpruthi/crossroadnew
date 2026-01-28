import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

tables = [
    'projects',
    'analysis_runs',
    'analysis_parameters',
    'merged_out',
    'hssr_data',
    'ssr_genecombo',
    'ref_ssr_genecombo',
    'mutational_hotspots'
]

print("-" * 40)
print(f"{'Table':<25} | {'Row Count':<10}")
print("-" * 40)

for table in tables:
    try:
        # count='exact', head=True is the most efficient way to get count without fetching data
        response = supabase.table(table).select("*", count='exact', head=True).execute()
        count = response.count
        print(f"{table:<25} | {count:<10}")
    except Exception as e:
        print(f"{table:<25} | Error: {e}")

print("-" * 40)
