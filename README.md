# CROSSROAD Web Platform

Crossroad web-based platform for analyzing Simple Sequence Repeat (SSR) patterns across multiple genomes. It provides interactive visualizations and summary statistics to help researchers explore SSR distributions, motif conservation, mutational hotspots, and more.

## Features
- Interactive SSR plots:
  - **Relative Abundance**: SSR counts normalized by motif type
  - **Relative Density**: Distribution of SSR lengths normalized per Mb per genome
  - **Category ↔ Country Sankey**: Link SSR categories to sampling countries
  - **Motif Conservation Heatmap**: Conservation patterns across motifs
  - **SSR Conservation**: SSR conservation across genomes
  - **SSR GC Distribution**: GC content distribution in SSRs
  - **UpSet Plot**: Intersection analysis of SSR features
- Fullscreen mode and tooltips for each plot
- Summary statistics via popovers
- High-performance data processing using Apache Arrow in a Web Worker
- Server-side polling and result handling via TanStack Query

## Tech Stack
- React + TypeScript
- TanStack Router (file-based routing)
- TanStack Query for data fetching
- ECharts & Vega-Lite for plotting
- Web Worker (Apache Arrow) for CPU-intensive data transformation
- Tailwind CSS & Shadcn/UI components


## License
MIT
