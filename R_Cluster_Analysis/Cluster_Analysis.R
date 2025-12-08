###############################################################################
# Title:    K-means Clustering of US Violent Crime Data
# Author:   Your Name
# Purpose:  Demonstrate a complete clustering workflow in R:
#           data preparation, distance exploration, K-means modeling,
#           model selection, cluster profiling, and geographic visualization.
###############################################################################

# --------------------------- 1. Load Packages --------------------------------

# Uncomment the lines below if you need to install any package
# install.packages("tidyverse")
# install.packages("cluster")
# install.packages("factoextra")
# install.packages("usmap")

library(tidyverse)
library(cluster)
library(factoextra)
library(usmap)

set.seed(123)  # Ensure reproducible K-means results

# --------------------------- 2. Data Preparation ------------------------------

# USArrests is a built in dataset containing violent crime statistics by state.
# Rows represent states, columns represent standardized crime variables:
#   Murder, Assault, UrbanPop, Rape
crime_raw <- USArrests

# Remove any rows with missing values to avoid issues in distance calculations.
crime_clean <- na.omit(crime_raw)

# Scale numeric variables so that all features contribute comparably
# to the distance metric, regardless of their original units or ranges.
crime_scaled <- scale(crime_clean)

# Keep state names for later interpretation and mapping.
state_names <- rownames(crime_clean)

# --------------------------- 3. Explore Distances -----------------------------

# Compute Euclidean distance between states based on standardized crime features.
dist_mat <- get_dist(crime_scaled, method = "euclidean")

# Visualize the distance matrix to see which states are similar and dissimilar.
# Darker blocks indicate more similar states, lighter blocks indicate dissimilarity.
fviz_dist(
  dist_mat,
  lab_size = 3,
  gradient = list(low = "#00AFBB", mid = "white", high = "#FC4E07")
) +
  ggplot2::labs(
    title = "Euclidean Distance Between States Based on Violent Crime",
    subtitle = "Darker colors indicate more similar states"
  )

# --------------------------- 4. Fit K-means Models ----------------------------

# Fit K-means models for a range of cluster counts to compare solutions.
k2 <- kmeans(crime_scaled, centers = 2, nstart = 25)
k3 <- kmeans(crime_scaled, centers = 3, nstart = 25)
k4 <- kmeans(crime_scaled, centers = 4, nstart = 25)
k5 <- kmeans(crime_scaled, centers = 5, nstart = 25)

# Inspect one solution structure to show what K-means returns.
str(k4)

# --------------------------- 5. Visualize Cluster Assignments -----------------

# Visualize each K-means solution in the first two principal components.
# This shows how well clusters are separated in a reduced dimensional view.

fviz_cluster(
  k2,
  data = crime_scaled,
  geom = "point",
  ellipse.type = "norm",
  ggtheme = theme_minimal()
) +
  ggplot2::labs(
    title = "K-means Clustering of USArrests (k = 2)",
    subtitle = "Clusters projected onto first two principal components"
  )

fviz_cluster(
  k3,
  data = crime_scaled,
  geom = "point",
  ellipse.type = "norm",
  ggtheme = theme_minimal()
) +
  ggplot2::labs(title = "K-means Clustering of USArrests (k = 3)")

fviz_cluster(
  k4,
  data = crime_scaled,
  geom = "point",
  ellipse.type = "norm",
  ggtheme = theme_minimal()
) +
  ggplot2::labs(title = "K-means Clustering of USArrests (k = 4)")

fviz_cluster(
  k5,
  data = crime_scaled,
  geom = "point",
  ellipse.type = "norm",
  ggtheme = theme_minimal()
) +
  ggplot2::labs(title = "K-means Clustering of USArrests (k = 5)")

# --------------------------- 6. Choose Number of Clusters ---------------------

# Use two standard diagnostics to select an appropriate number of clusters:
# 1. Within cluster sum of squares (WSS) "elbow" method.
# 2. Silhouette method which evaluates average separation between clusters.

fviz_nbclust(crime_scaled, kmeans, method = "wss") +
  ggplot2::labs(
    title = "Elbow Method for Choosing k",
    y = "Total within cluster sum of squares"
  )

fviz_nbclust(crime_scaled, kmeans, method = "silhouette") +
  ggplot2::labs(
    title = "Silhouette Method for Choosing k",
    y = "Average silhouette width"
  )

# For illustration, assume k = 4 is chosen after reviewing both plots.
best_k <- 4
k_best <- k4

# --------------------------- 7. Inspect Selected Solution ---------------------

# Cluster sizes show how many states fall in each group.
k_best$size

# Cluster centers are mean standardized crime levels for each cluster.
# Higher positive values indicate above average crime, negative values indicate below average.
k_best$centers

# Combine state names with cluster assignments to create a concise summary table.
cluster_assignments <- tibble(
  state   = state_names,
  cluster = factor(k_best$cluster)
)

head(cluster_assignments, 10)

# Create cluster profiles by joining centers back to variable names.
cluster_profiles <- as_tibble(k_best$centers, rownames = "cluster") %>%
  pivot_longer(
    cols = -cluster,
    names_to = "variable",
    values_to = "scaled_mean"
  )

cluster_profiles

# Visualize cluster profiles to see how each group differs by crime type.
cluster_profiles %>%
  ggplot(aes(x = variable, y = scaled_mean, group = cluster)) +
  geom_line(aes(linetype = cluster)) +
  geom_point(aes(shape = cluster)) +
  ggplot2::labs(
    title = "Cluster Profiles for Violent Crime",
    x = "Crime Variable",
    y = "Cluster Mean (standardized)"
  ) +
  theme_minimal()

# --------------------------- 8. Map Clusters by State -------------------------

# Prepare data for mapping with usmap.
# The column for state names must be called "state".
cluster_map <- cluster_assignments

# Plot clusters on a map of the United States.
# This reveals spatial patterns in crime based clusters.
plot_usmap(data = cluster_map, values = "cluster") +
  ggplot2::labs(
    title = "K-means Clusters of US Violent Crime (k = 4)",
    fill = "Cluster"
  ) +
  theme(legend.position = "right")