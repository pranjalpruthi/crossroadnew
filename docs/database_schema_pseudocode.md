# CrossRoad Database Logic (Pseudocode)

This document provides a high-level overview of the database schema and access logic for the **croSSRoad** platform.

## 1. Data Model (Schema Structure)

The database is built on **PostgreSQL** (via Supabase) and is organized into two main categories: **Project Management** and **Scientific Data**.

### A. Project Management Tables
These tables track user submissions and analysis metadata.

```text
Table: projects
  - project_id (PK): Unique identifier for the project
  - project_tag:     Unique slug/tag for the project
  - name:            Display name of the project
  - organism:        Organism being analyzed
  - description:     User-provided description
  - created_at:      Timestamp

Table: analysis_runs
  - run_id (PK):     Unique identifier for a specific analysis run
  - project_id (FK): Links to the 'projects' table
  - metrics:         Summary stats (genomes_count, ssrs_count, hotspots_count, etc.)
  - timestamps:      Start/End times for the run
```

### B. Scientific Data Tables
These tables store the actual output of the bioinformatics pipeline.

```text
Table: merged_out (Results from mergedOut.tsv)
  - Stores individual SSR (Simple Sequence Repeat) occurrences per genome.
  - Columns: genome_id, motif, repeat_count, length, location, country, year

Table: hssr_data (Results from hssr_data.csv)
  - Stores Hierarchical SSRs (compound/complex repeats).
  - Columns: genome_id, motif, gene_location, intersecting_gene

Table: mutational_hotspots (Results from mutational_hotspot.csv)
  - Stores regions with high mutation frequency.
  - Columns: motif, gene, variations_list, genome_frequency
```

---

## 2. Application Logic (Data Retrieval)

The application (`src/routes/croSSRoadDB`) interacts with this database using **TanStack Query** for state management and the **Supabase Client** for direct SQL querying.

### A. Dashboard Overview (`index.tsx`)
When a user visits the main database page, the app fetches global statistics in parallel.

```javascript
FUNCTION GetDatabaseStats():
  // Execute parallel queries for performance
  PARALLEL_START
    projects_count    = COUNT(*) FROM projects
    runs_count        = COUNT(*) FROM analysis_runs
    ssrs_count        = COUNT(*) FROM merged_out
    hssrs_count       = COUNT(*) FROM hssr_data
    hotspots_count    = COUNT(*) FROM mutational_hotspots
    
    // Fetch recent activity
    recent_projects   = SELECT * FROM projects ORDER BY created_at DESC LIMIT 5
    recent_runs       = SELECT * FROM analysis_runs ORDER BY timestamp DESC LIMIT 5
    
    // Fetch sample data for distinct counts (Country/Year/Motif stats)
    stats_sample      = SELECT * FROM merged_out LIMIT 1000
  PARALLEL_END

  RETURN {
    total_projects: projects_count,
    total_genomes:  SUM(genomes_used_count) FROM analysis_runs,
    total_ssrs:     ssrs_count,
    unique_countries: CALCULATE_UNIQUE(stats_sample.country),
    unique_years:     CALCULATE_UNIQUE(stats_sample.year)
  }
END FUNCTION
```

### B. Search Functionality (`search.tsx`)
The search bar performs a "federated search" across multiple tables simultaneously.

```javascript
FUNCTION SearchDatabase(user_query):
  // 1. Search Projects
  results_projects = SELECT * FROM projects 
                     WHERE name LIKE %user_query% 
                     OR organism LIKE %user_query%
                     OR description LIKE %user_query%

  // 2. Search SSRs
  results_ssrs = SELECT * FROM merged_out 
                 WHERE motif LIKE %user_query% 
                 OR genome_id LIKE %user_query%
                 OR country LIKE %user_query%
                 LIMIT 50

  // 3. Search Hotspots
  results_hotspots = SELECT * FROM mutational_hotspots 
                     WHERE motif LIKE %user_query% 
                     OR gene LIKE %user_query%
                     LIMIT 50

  RETURN COMBINE(results_projects, results_ssrs, results_hotspots)
END FUNCTION
```
