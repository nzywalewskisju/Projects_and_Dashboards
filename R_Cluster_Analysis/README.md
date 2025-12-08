# K-means Clustering of US Violent Crime Data

This project demonstrates a complete clustering workflow in R using the built-in **USArrests** dataset. The script highlights how data preprocessing, distance exploration, K-means modeling, model selection, and geographic visualization can be combined to uncover regional crime patterns in the United States.

---

## Project Overview

The dataset includes 50 US states and four standardized crime variables:

| Variable | Description |
|----------|-------------|
| Murder | Murder arrests per 100000 |
| Assault | Assault arrests per 100000 |
| UrbanPop | Percent of population living in urban areas |
| Rape | Rape arrests per 100000 |

The goal is to group states into clusters based on similar violent crime profiles using **K-means clustering**.

---

## Key Techniques Demonstrated

✔ Data cleaning and scaling  
✔ Distance calculation with Euclidean metrics  
✔ Testing multiple K-means models  
✔ Using **Elbow** and **Silhouette** methods for choosing optimal clusters  
✔ Visualizing cluster separation in reduced dimensions  
✔ Profiling clusters by standardized mean crime levels  
✔ Mapping cluster assignments using **usmap**

---

## Technologies Used

| Tool | Purpose |
|------|---------|
| R | Statistical computing |
| tidyverse | Data wrangling and visualization |
| cluster | Distance and clustering utilities |
| factoextra | Cluster visualization and diagnostics |
| usmap | Geographic plotting of US states |

---

## Workflow Summary

1. Load libraries and inspect dataset  
2. Clean data and apply feature scaling  
3. Compute and visualize distance matrix  
4. Fit multiple K-means models (k = 2 to 5)  
5. Evaluate models using clustering diagnostics  
6. Select and analyze the best model (example: k = 4)  
7. Visualize clusters and their centroids  
8. Map clustering results across the US

---

## Example Output

### Cluster Map of US States (k = 4)

The script outputs a color-coded US map that highlights how states group based on similar crime levels. This helps reveal regional patterns such as high-crime clusters or urban-influenced profiles.

---

## File Information

| File | Description |
|------|-------------|
| `kmeans_us_crime.R` | Main R script containing the complete analysis |

---

## How to Run
Open the R script in your preferred IDE (such as RStudio) and execute it line by line or run the entire file. The visualizations and outputs will generate in the R plotting window.

### Install Required Libraries (only once) (if needed)
```r
install.packages(c("tidyverse", "cluster", "factoextra", "usmap"))
