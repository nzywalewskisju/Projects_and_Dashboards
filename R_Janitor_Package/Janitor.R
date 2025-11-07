# USING THE JANITOR PACKAGE
# -------------------------

# install.packages("janitor") # if not already installed
library(janitor)

# Loading data
orders_raw <- read.csv("C:/Users/nzywa/Downloads/DSS445/Janitor Project/messy_retail_orders.csv", header=TRUE)
orders_raw

# ---------------------------
# DATA CLEANING
# ---------------------------
# SLIDE 6
names(orders_raw) # Look at messy column names

orders <- clean_names(orders_raw) # Clean column names
names(orders) # Look at new column names

# SLIDE 7
dim(orders) # Check dimension of dataset prior to dropping anything

# Dropping empty rows and columns
orders <- remove_empty(orders, which = c("rows", "cols"))
dim(orders) # checking the dimension again to see changes

names(orders) # checking which column(s) was/were dropped

# SLIDE 8
# dropping columns with a constant value
orders <- remove_constant(orders)
names(orders) # inspecting which column(s) was/were dropped


# --------------------
# EXPLORING DATA
# --------------------
# SLIDE 9
# Finding which customers appear in the dataset more than once
dupes <- get_dupes(orders, customer_id)
dupes

# SLIDE 10
# Creating a table to summarize what products were purchased
product_table <- tabyl(orders, product_name)
product_table

# Two way table for shipment mode and region
tab_ship_region <- tabyl(orders, ship_mode, region)
tab_ship_region


# -------------------------------------------------------
## THE FOLLOWING ARE FUNCTIONS THAT WE EXPLORED
## BUT WE DID NOT HAVE TIME IN OUR PRESENTATION TO COVER THEM
# -------------------------------------------------------
# 1) Converting Excel serial dates to proper Date; keep original too
orders$order_date <- excel_numeric_to_date(orders$order_date_excel_serial)
# selecting the date columns to see difference
head(orders[, c("order_date_excel_serial", "order_date")])

# 2) Inspecting one-to-one relationships
one_to_one <- get_one_to_one(orders)
one_to_one

# 3) Breakdown of satisfaction levels
# Make sure it's a factor
orders$satisfaction_level <- factor(orders$satisfaction_level,levels = c("Extremely Dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Extremely Satisfied"))
# See distribution of all levels
top_levels(orders$satisfaction_level)
