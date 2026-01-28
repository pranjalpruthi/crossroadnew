import os
import re
import pandas as pd
import numpy as np
import warnings
from supabase import create_client, Client
from dotenv import load_dotenv
import time

# Load environment variables from .env file
load_dotenv()

# ==============================================================================
# SECTION 1: CONFIGURATION
# ==============================================================================

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
# Prefer Service Role Key for writing data (bypasses RLS), fallback to Anon Key
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY (or VITE_ equivalents) must be set in .env file")

print(f"-> Connecting to Supabase at: {SUPABASE_URL}")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- List of Jobs to Process ---
JOBS_TO_RUN = [
    {
        "project_tag": "ACINETO_BAUM_GLOBAL",
        "project_name": "Global Acinetobacter baumannii SSR Analysis",
        "organism_name": "Acinetobacter baumannii",
        "description": "Analysis of SSRs in 38 A. baumannii genomes from job_ab.",
        "job_output_dir": "/Users/pranjalpruthi/Documents/GitHub/cr_test/ab/ab_input/outf/job_ab"
    },
    {
        "project_tag": "MPOX_GLOBAL_2022",
        "project_name": "Global Mpox Genome SSR Analysis",
        "organism_name": "Mpox virus",
        "description": "Analysis of SSRs in 404 global Mpox virus genomes from job_mpoxref.",
        "job_output_dir": "/Users/pranjalpruthi/Documents/GitHub/cr_test/mpox/outf/job_mpoxref"
    }
]

BATCH_SIZE = 1000  # Number of rows to insert per API request

# ==============================================================================
# SECTION 2: HELPER FUNCTIONS
# ==============================================================================

def prepare_dataframe_for_upload(df, int_columns=None):
    """
    Cleans DataFrame for JSON serialization:
    - Casts specified columns to Int64 (nullable int) to remove .0 decimals
    - Replaces NaNs with None (null in JSON/SQL)
    - Converts DataFrame to list of dictionaries
    """
    if int_columns:
        for col in int_columns:
            if col in df.columns:
                # Convert to numeric, coercing errors, then to Int64 (nullable integer)
                df[col] = pd.to_numeric(df[col], errors='coerce').astype('Int64')

    # Replace NaN with None (must accept object dtype to hold Nones)
    df = df.astype(object).where(pd.notnull(df), None)
    
    return df.to_dict(orient='records')

def batch_insert(table_name, data):
    """
    Inserts data into Supabase table in batches.
    """
    total_records = len(data)
    print(f"      Uploading {total_records} records to '{table_name}'...")
    
    for i in range(0, total_records, BATCH_SIZE):
        batch = data[i:i + BATCH_SIZE]
        try:
            supabase.table(table_name).insert(batch).execute()
            print(f"      - Inserted batch {i} to {min(i + BATCH_SIZE, total_records)}")
        except Exception as e:
            print(f"      !!! Error inserting batch {i}: {e}")
            # Optional: retry logic could go here
            raise e

def get_or_create_project_id(project_config):
    """
    Finds a project by its unique tag. If it doesn't exist, creates it.
    Returns the project_id.
    """
    tag = project_config["project_tag"]
    
    # Check if project exists
    response = supabase.table("projects").select("project_id").eq("project_tag", tag).execute()
    
    if response.data and len(response.data) > 0:
        existing_id = response.data[0]['project_id']
        print(f"-> Found existing project '{tag}' with project_id: {existing_id}")
        return existing_id
    else:
        print(f"-> Project '{tag}' not found. Creating a new project...")
        new_project_data = {
            "project_tag": project_config["project_tag"],
            "project_name": project_config["project_name"],
            "organism_name": project_config["organism_name"],
            "description": project_config["description"]
        }
        res = supabase.table("projects").insert(new_project_data).execute()
        new_id = res.data[0]['project_id']
        print(f"   ...Created new project with project_id: {new_id}")
        return new_id

def parse_log_file(log_path):
    """Parses the croSSRoad log file to extract parameters and summary stats."""
    print(f"-> Parsing log file: {log_path}")
    if not os.path.exists(log_path): 
        raise FileNotFoundError(f"Log file not found at: {log_path}.")
    
    summary_stats, parameters, is_param_section = {}, {}, False
    with open(log_path, 'r') as f: 
        lines = f.readlines()
    
    try: 
        # Convert timestamp to ISO string for JSON serialization
        summary_stats['run_timestamp'] = pd.to_datetime(lines[0].split(' - ')[0]).isoformat()
    except (IndexError, ValueError):
        warnings.warn("Could not parse timestamp. Setting to current time.")
        summary_stats['run_timestamp'] = pd.Timestamp.now(tz='UTC').isoformat()
    
    for line in lines:
        if "Job ID:" in line: 
            summary_stats['job_id'] = line.split(':')[-1].strip()
        if "reference_id:" in line: 
            parameters['reference_id'] = line.split(':')[-1].strip()
        if (m := re.search(r"Total number of genomes detected: (\d+)", line)): 
            summary_stats['genomes_detected_count'] = int(m.group(1))
        if (m := re.search(r"No of clean genomes used for comparison: (\d+)", line)): 
            summary_stats['genomes_used_count'] = int(m.group(1))
        if (m := re.search(r"No of SSRs Detected in total Genomes: (\d+)", line)): 
            summary_stats['ssrs_total_count'] = int(m.group(1))
        if (m := re.search(r"Found (\d+) HSSR records", line)): 
            summary_stats['hssr_records_count'] = int(m.group(1))
        if (m := re.search(r"Records after filtering: (\d+)", line)): 
            summary_stats['hotspots_filtered_count'] = int(m.group(1))
        if (m := re.search(r"Total genes: (\d+)", line)): 
            summary_stats['genes_total_count'] = int(m.group(1))
        if (m := re.search(r"Total genes detected with SSR: (\d+)", line)): 
            summary_stats['genes_with_ssr_count'] = int(m.group(1))
        if (m := re.search(r"Total genes detected without SSR: (\d+)", line)): 
            summary_stats['genes_without_ssr_count'] = int(m.group(1))
        if (m := re.search(r"Total analysis time: (.*)", line)): 
            summary_stats['total_analysis_time'] = m.group(1).strip()
        if "--- Runtime Parameters ---" in line: 
            is_param_section = True
        if is_param_section and "--------------------------" in line: 
            is_param_section = False
        if is_param_section and ':' in (p := line.split(' - ')[-1].strip()):
            key, value = [i.strip() for i in p.split(':', 1)]
            if ' ' not in key and key: 
                parameters[key] = value
    
    summary_stats['reference_genome_id'] = parameters.pop('reference_id', None)
    print("   ...Log parsing complete.")
    return summary_stats, parameters

# ==============================================================================
# SECTION 3: CROASSROAD FILE UPLOAD LOGIC
# ==============================================================================

def upload_croassroad_files(run_id, main_output_path):
    """
    Directly upload all 5 croSSRoad output files to their respective database tables
    """
    print(f"-> Uploading croSSRoad files for run_id: {run_id}")
    
    try:
        # 1. Upload mergedOut.tsv
        print("   ...Processing mergedOut.tsv")
        merged_df = pd.read_csv(os.path.join(main_output_path, 'mergedOut.tsv'), sep='\t', na_values=['undefined'])
        merged_df = merged_df.rename(columns={
            'genomeID': 'genome_id',
            'start': 'start_pos',
            'stop': 'stop_pos',
            'repeat': 'repeat_count',
            'GC_per': 'gc_per',
            'AT_per': 'at_per',
            'N_count': 'n_count',
            'genome_GC_per': 'genome_gc_per'
        })
        merged_df['run_id'] = run_id
        
        # Columns that must be integers
        merged_int_cols = ['start_pos', 'stop_pos', 'repeat_count', 'length_of_motif', 'length_of_ssr', 'year', 'length_genome', 'n_count']
        batch_insert('merged_out', prepare_dataframe_for_upload(merged_df, merged_int_cols))
        
        # 2. Upload hssr_data.csv
        print("   ...Processing hssr_data.csv")
        hssr_df = pd.read_csv(os.path.join(main_output_path, 'hssr_data.csv'), na_values=['undefined'])
        hssr_df = hssr_df.rename(columns={
            'genomeID': 'genome_id',
            'repeat': 'repeat_count',
            'GC_per': 'gc_per',
            'AT_per': 'at_per',
            'N_count': 'n_count',
            'genome_GC_per': 'genome_gc_per',
            'genomeID2': 'genome_id2'
        })
        hssr_df['run_id'] = run_id
        
        hssr_int_cols = ['start1', 'end1', 'repeat_count', 'length_of_motif', 'length_of_ssr', 'year', 'length_genome', 'n_count', 'start2', 'end2']
        batch_insert('hssr_data', prepare_dataframe_for_upload(hssr_df, hssr_int_cols))
        
        # 3. Upload ssr_genecombo.tsv
        print("   ...Processing ssr_genecombo.tsv")
        ssr_gene_df = pd.read_csv(os.path.join(main_output_path, 'ssr_genecombo.tsv'), sep='\t', na_values=['undefined'])
        ssr_gene_df = ssr_gene_df.rename(columns={
            'genomeID': 'genome_id',
            'repeat': 'repeat_count',
            'GC_per': 'gc_per',
            'AT_per': 'at_per',
            'N_count': 'n_count',
            'genome_GC_per': 'genome_gc_per',
            'genomeID2': 'genome_id2'
        })
        ssr_gene_df['run_id'] = run_id
        
        # Same columns as hssr mostly
        ssr_gene_int_cols = ['start1', 'end1', 'repeat_count', 'length_of_motif', 'length_of_ssr', 'year', 'length_genome', 'n_count', 'start2', 'end2']
        batch_insert('ssr_genecombo', prepare_dataframe_for_upload(ssr_gene_df, ssr_gene_int_cols))
        
        # 4. Upload ref_ssr_genecombo.csv
        print("   ...Processing ref_ssr_genecombo.csv")
        ref_ssr_df = pd.read_csv(os.path.join(main_output_path, 'ref_ssr_genecombo.csv'), na_values=['undefined'])
        ref_ssr_df = ref_ssr_df.rename(columns={
            'genomeID': 'genome_id',
            'repeat': 'repeat_count',
            'GC_per': 'gc_per',
            'AT_per': 'at_per',
            'N_count': 'n_count',
            'genome_GC_per': 'genome_gc_per',
            'genomeID2': 'genome_id2'
        })
        ref_ssr_df['run_id'] = run_id
        
        ref_ssr_int_cols = ['start1', 'end1', 'repeat_count', 'length_of_motif', 'length_of_ssr', 'year', 'length_genome', 'n_count', 'start2', 'end2']
        batch_insert('ref_ssr_genecombo', prepare_dataframe_for_upload(ref_ssr_df, ref_ssr_int_cols))
        
        # 5. Upload mutational_hotspot.csv
        print("   ...Processing mutational_hotspot.csv")
        hotspot_df = pd.read_csv(os.path.join(main_output_path, 'mutational_hotspot.csv'))
        hotspot_df = hotspot_df.rename(columns={
            'loci': 'loci_variations',
            'length_of_ssr': 'ssr_length_variations',
            'repeat_count': 'repeat_count_variations',
            'genomeID_count': 'genomeid_count'
        })
        hotspot_df['run_id'] = run_id
        
        hotspot_int_cols = ['length_of_motif', 'genomeid_count']
        batch_insert('mutational_hotspots', prepare_dataframe_for_upload(hotspot_df, hotspot_int_cols))
        
        print("   ...All croSSRoad files uploaded successfully!")
        
    except Exception as e:
        print(f"   ...ERROR during file upload: {e}")
        raise

# ==============================================================================
# SECTION 4: MAIN UPLOAD PROCESS
# ==============================================================================

def process_single_run(job_config):
    """
    Main execution function to process ONE job and upload all its data
    """
    job_output_dir = job_config["job_output_dir"]
    try:
        log_file_name = [f for f in os.listdir(job_output_dir) if f.endswith('.log')][0]
    except IndexError:
        print(f"--- ERROR: No .log file found in '{job_output_dir}'. Skipping this job. ---")
        return

    log_path = os.path.join(job_output_dir, log_file_name)
    main_output_path = os.path.join(job_output_dir, 'output', 'main')
    
    # Check if main output directory exists
    if not os.path.exists(main_output_path):
        print(f"--- ERROR: Main output directory not found: {main_output_path}. Skipping this job. ---")
        return
    
    summary_stats, parameters = parse_log_file(log_path)
    
    try:
        # --- STEP 1: Get or Create Project ID ---
        project_id = get_or_create_project_id(job_config)

        # --- STEP 2: Create Analysis Run ---
        job_id = summary_stats.get('job_id')
        if job_id:
             # Check for existing run and delete it to ensure fresh upload (Cascade delete handles child tables)
             existing_run = supabase.table('analysis_runs').select('run_id').eq('job_id', job_id).execute()
             if existing_run.data:
                 old_run_id = existing_run.data[0]['run_id']
                 print(f"-> Found existing run for job_id '{job_id}' (run_id: {old_run_id}). Deleting to ensure fresh upload...")
                 supabase.table('analysis_runs').delete().eq('run_id', old_run_id).execute()
                 print("   ...Deleted old run and associated data.")

        print("-> Creating new analysis run record...")
        summary_stats['project_id'] = project_id
        
        res = supabase.table('analysis_runs').insert(summary_stats).execute()
        new_run_id = res.data[0]['run_id']
        print(f"   ...New analysis run created with run_id: {new_run_id}")

        # --- STEP 3: Upload Analysis Parameters ---
        print(f"-> Uploading analysis parameters for run_id: {new_run_id}...")
        params_to_exclude = ['fasta', 'categories', 'gene_bed', 'output_dir']
        
        params_list = []
        for k, v in parameters.items():
            if k not in params_to_exclude:
                params_list.append({
                    'run_id': new_run_id,
                    'param_name': k,
                    'param_value': v
                })
        
        if params_list:
            batch_insert('analysis_parameters', params_list)
            print(f"   ...Uploaded {len(params_list)} parameters")

        # --- STEP 4: Upload All croSSRoad Output Files ---
        upload_croassroad_files(new_run_id, main_output_path)

        print(f"\n--- ✅ Job '{job_config['project_tag']}' UPLOADED SUCCESSFULLY! ---")

    except Exception as e:
        print(f"\n--- ❌ ERROR during upload for job '{job_config['project_tag']}' ---")
        print(f"Error details: {e}")
        import traceback
        traceback.print_exc()

# ==============================================================================
# SECTION 5: MAIN EXECUTION
# ==============================================================================

if __name__ == "__main__":
    print(f"\n--- Starting batch upload of {len(JOBS_TO_RUN)} jobs ---\n")
    
    for i, job_config in enumerate(JOBS_TO_RUN):
        print("\n" + "="*80)
        print(f"--- Processing Job {i+1} of {len(JOBS_TO_RUN)}: {job_config['project_tag']} ---")
        print("="*80)
        process_single_run(job_config)

    print("\n" + "="*80)
    print("--- All jobs processed successfully! ---")
    print("="*80)
