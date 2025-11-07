# Data Cleaning with the `janitor` Package in R

This project demonstrates how to use the **`janitor`** package in R to clean and prepare a messy dataset for analysis. The workflow focuses on taking raw retail order data and making it consistent, structured, and easier to work with.

---

## Project Overview
The dataset contained inconsistent column names, empty rows and columns, and duplicated customer entries. Using `janitor`, we applied a sequence of simple but powerful cleaning steps to standardize the data and explore it more effectively.

This project shows:
- How to quickly standardize column names
- How to detect and remove unnecessary or uninformative data
- How to identify and examine duplicate records
- How to summarize categorical variables with clear frequency tables

---

## Dataset
**messy_retail_orders.csv**  
The dataset was intentionally left unclean so that the full cleaning workflow could be demonstrated step-by-step.

You can view or download it here:  
[`messy_retail_orders.csv`](./messy_retail_orders.csv)

---

## Functions Used (From the `janitor` Package)
- **clean_names()** — Standardizes column names to a consistent and readable format  
- **remove_empty()** — Removes rows or columns that are entirely empty  
- **remove_constant()** — Removes any column where all values are the same  
- **get_dupes()** — Identifies duplicate entries based on a selected variable (e.g., customer ID)  
- **tabyl()** — Creates quick summary tables for categorical variables (e.g., product purchased)

These functions were demonstrated step-by-step during the data cleaning and exploration process.

---

## Files Included in This Project
| File | Description |
|------|-------------|
| [`Janitor.R`](./Janitor.R) | The R script used for all cleaning and summarization steps. |
| [`messy_retail_orders.csv`](./messy_retail_orders.csv) | The dataset used in the cleaning demonstration. |
| [`R Janitor Package Presentation.pptx`](./R%20Janitor%20Package%20Presentation.pptx) | Slide deck summarizing key functions and workflow. |
| `README.md` | Project documentation (this file). |

---

## Goals of This Project
- Highlight how useful the `janitor` package is for everyday cleaning tasks
- Demonstrate reproducible and interpretable data preparation steps
- Show how quick summaries can help begin exploratory analysis
- Support future use of these techniques in larger analytics workflows
