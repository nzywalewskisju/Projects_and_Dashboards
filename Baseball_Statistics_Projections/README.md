# Baseball Statistics Projections
GitHub sometimes fails to render Jupyter notebooks.  
If the preview doesn’t load, click below to open it directly in Colab:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/nzywalewskisju/Portfolio_Projects/blob/main/baseball_statistics_projections/baseball_statistics_projections.ipynb)

## Project Overview
This project projects **player On-Base Percentage (OBP)** using historical baseball statistics.  
The analysis included data cleaning, imputing missing values, and training machine learning models to make predictions.

## Methods
Two machine learning models were trained and compared:
- **Random Forest Model** – ensemble trees for robust prediction  
- **Gradient Boosting Model** – boosted decision trees providing stronger accuracy  

Missing values were imputed using **K-Nearest Neighbors (KNN)** to ensure dataset completeness.  

## Goals
- Perform exploratory data analysis on historical baseball data  
- Handle missing values using KNN imputation  
- Train and evaluate Random Forest and Gradient Boosting models  
- Select the best-performing model (Gradient Boosting) for final OBP projections
