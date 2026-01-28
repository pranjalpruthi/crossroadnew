import os
from supabase import create_client, Client
from dotenv import load_dotenv
import pandas as pd

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Probing merged_out at offset 100,000...")
# Supabase default limit is often 1000. We use range to paginate.
response = supabase.table('merged_out').select('optional_category').range(100000, 101000).execute()

if response.data:
    df = pd.DataFrame(response.data)
    unique_vals = df['optional_category'].unique()
    print(f"\nUnique optional_category count (offset 100k, sample {len(response.data)}): {len(unique_vals)}")
    print(f"Values: {unique_vals}")
else:
    print("No data found at offset 100,000.")
