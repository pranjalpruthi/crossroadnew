-- ==============================================================================
-- COMPLETE CROASSROAD DATABASE SCHEMA
-- Version: 3.0 - Simplified Direct File Storage
-- ==============================================================================

-- Core management tables
CREATE TABLE projects (
    project_id BIGSERIAL PRIMARY KEY,
    project_tag VARCHAR(50) UNIQUE NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    organism_name VARCHAR(255) NOT NULL,
    description TEXT,
    creation_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE analysis_runs (
    run_id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    job_id VARCHAR(255) UNIQUE NOT NULL,
    reference_genome_id VARCHAR(255) NOT NULL,
    run_timestamp TIMESTAMPTZ NOT NULL,
    total_analysis_time VARCHAR(50),
    genomes_detected_count INT,
    genomes_used_count INT,
    ssrs_total_count BIGINT,
    hssr_records_count INT,
    hotspots_filtered_count INT,
    genes_total_count INT,
    genes_with_ssr_count INT,
    genes_without_ssr_count INT
);

CREATE TABLE analysis_parameters (
    param_id BIGSERIAL PRIMARY KEY,
    run_id BIGINT NOT NULL REFERENCES analysis_runs(run_id) ON DELETE CASCADE,
    param_name VARCHAR(50) NOT NULL,
    param_value TEXT,
    UNIQUE (run_id, param_name)
);

-- Direct croSSRoad output file tables
-- Table 1: mergedOut.tsv
CREATE TABLE merged_out (
    merged_id BIGSERIAL PRIMARY KEY,
    run_id BIGINT NOT NULL REFERENCES analysis_runs(run_id) ON DELETE CASCADE,
    genome_id VARCHAR(255) NOT NULL,
    start_pos INT NOT NULL,
    stop_pos INT NOT NULL,
    repeat_count INT NOT NULL,
    motif TEXT NOT NULL,
    gc_per REAL,
    at_per REAL,
    length_of_motif INT,
    loci VARCHAR(255),
    length_of_ssr INT,
    category VARCHAR(255),
    optional_category VARCHAR(255),
    year INT,
    length_genome INT,
    n_count INT,
    genome_gc_per REAL
);

-- Table 2: hssr_data.csv
CREATE TABLE hssr_data (
    hssr_id BIGSERIAL PRIMARY KEY,
    run_id BIGINT NOT NULL REFERENCES analysis_runs(run_id) ON DELETE CASCADE,
    genome_id VARCHAR(255) NOT NULL,
    start1 INT NOT NULL,
    end1 INT NOT NULL,
    repeat_count INT NOT NULL,
    motif TEXT NOT NULL,
    gc_per REAL,
    at_per REAL,
    length_of_motif INT,
    loci VARCHAR(255),
    length_of_ssr INT,
    category VARCHAR(255),
    optional_category VARCHAR(255),
    year INT,
    length_genome INT,
    n_count INT,
    genome_gc_per REAL,
    genome_id2 VARCHAR(255),
    start2 INT,
    end2 INT,
    gene VARCHAR(255),
    ssr_position VARCHAR(50)
);

-- Table 3: ssr_genecombo.tsv
CREATE TABLE ssr_genecombo (
    ssr_gene_id BIGSERIAL PRIMARY KEY,
    run_id BIGINT NOT NULL REFERENCES analysis_runs(run_id) ON DELETE CASCADE,
    genome_id VARCHAR(255) NOT NULL,
    start1 INT NOT NULL,
    end1 INT NOT NULL,
    repeat_count INT NOT NULL,
    motif TEXT NOT NULL,
    gc_per REAL,
    at_per REAL,
    length_of_motif INT,
    loci VARCHAR(255),
    length_of_ssr INT,
    category VARCHAR(255),
    optional_category VARCHAR(255),
    year INT,
    length_genome INT,
    n_count INT,
    genome_gc_per REAL,
    genome_id2 VARCHAR(255),
    start2 INT,
    end2 INT,
    gene VARCHAR(255),
    ssr_position VARCHAR(50)
);

-- Table 4: ref_ssr_genecombo.csv
CREATE TABLE ref_ssr_genecombo (
    ref_ssr_id BIGSERIAL PRIMARY KEY,
    run_id BIGINT NOT NULL REFERENCES analysis_runs(run_id) ON DELETE CASCADE,
    genome_id VARCHAR(255) NOT NULL,
    start1 INT NOT NULL,
    end1 INT NOT NULL,
    repeat_count INT NOT NULL,
    motif TEXT NOT NULL,
    gc_per REAL,
    at_per REAL,
    length_of_motif INT,
    loci VARCHAR(255),
    length_of_ssr INT,
    category VARCHAR(255),
    optional_category VARCHAR(255),
    year INT,
    length_genome INT,
    n_count INT,
    genome_gc_per REAL,
    genome_id2 VARCHAR(255),
    start2 INT,
    end2 INT,
    gene VARCHAR(255),
    ssr_position VARCHAR(50)
);

-- Table 5: mutational_hotspot.csv
CREATE TABLE mutational_hotspots (
    hotspot_id BIGSERIAL PRIMARY KEY,
    run_id BIGINT NOT NULL REFERENCES analysis_runs(run_id) ON DELETE CASCADE,
    motif TEXT NOT NULL,
    gene VARCHAR(255),
    length_of_motif INT,
    loci_variations TEXT,
    ssr_length_variations TEXT,
    repeat_count_variations TEXT,
    genomeid_count INT NOT NULL
);

-- Performance indexes
CREATE INDEX idx_projects_tag ON projects(project_tag);
CREATE INDEX idx_analysis_runs_project_id ON analysis_runs(project_id);
CREATE INDEX idx_analysis_runs_job_id ON analysis_runs(job_id);
CREATE INDEX idx_analysis_parameters_run_id ON analysis_parameters(run_id);
CREATE INDEX idx_merged_out_run_id ON merged_out(run_id);
CREATE INDEX idx_merged_out_genome_id ON merged_out(run_id, genome_id);
CREATE INDEX idx_hssr_data_run_id ON hssr_data(run_id);
CREATE INDEX idx_hssr_data_genome_id ON hssr_data(run_id, genome_id);
CREATE INDEX idx_ssr_genecombo_run_id ON ssr_genecombo(run_id);
CREATE INDEX idx_ssr_genecombo_genome_id ON ssr_genecombo(run_id, genome_id);
CREATE INDEX idx_ref_ssr_genecombo_run_id ON ref_ssr_genecombo(run_id);
CREATE INDEX idx_ref_ssr_genecombo_genome_id ON ref_ssr_genecombo(run_id, genome_id);
CREATE INDEX idx_mutational_hotspots_run_id ON mutational_hotspots(run_id);
