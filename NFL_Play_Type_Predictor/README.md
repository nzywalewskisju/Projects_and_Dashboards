# NFL Play Type Predictor

A neural network trained on 2024 NFL play-by-play data to predict the type of play an offense will run. Given a game situation — down, distance, field position, clock, score, and formation — the model outputs probabilities for five play types. An interactive R Shiny app lets you explore predictions in real time.

---

## Project Files

| File | Description |
|------|-------------|
| `NN_NFL_Play_Prediction.R` | Loads and cleans data, engineers features, trains the neural network, and saves the model artifacts |
| `RShiny_NFL_Play_Prediction.R` | Loads the saved model and launches an interactive Shiny app for live predictions |

---

## How It Works

### Data
Play-by-play and player participation data for the **2024 NFL season** are pulled using the [`nflreadr`](https://nflreadr.nflverse.com/) package. Only standard run and pass plays with complete feature information are kept.

### Target Variable (5 Classes)
The model predicts one of five play types:

- `run_left`
- `run_middle`
- `run_right`
- `short_pass`
- `long_pass`

### Features
| Feature | Description |
|---------|-------------|
| `team` | Offensive team |
| `offensive_formation` | Pre-snap formation (e.g., Shotgun, Singleback) |
| `down` | Current down (1–4) |
| `distance` | Yards needed for a first down |
| `spot_on_field` | Yards from the opponent's end zone (1–99) |
| `quarter` | Current quarter |
| `game_seconds_remaining` | Seconds left in the game |
| `half_seconds_remaining` | Seconds left in the half |
| `score_differential` | Offense score minus defense score |
| `is_two_minute` | Whether the two-minute warning has passed |
| `is_one_score` | Whether the score differential is 8 points or fewer |
| `is_trailing` | Whether the offense is losing |
| `no_huddle` | Whether the offense is in a no-huddle situation |
| `goal_to_go` | Whether it is a goal-to-go situation |

### Preprocessing
Built with [`recipes`](https://recipes.tidymodels.org/) and [`themis`](https://github.com/tidymodels/themis):
- Rare team/formation categories collapsed into `other`
- Categorical variables one-hot encoded
- Continuous features normalized
- Training classes upsampled to address class imbalance
- Train/test split is **game-grouped** (all plays from a game stay in the same split) using `rsample::group_initial_split()`

### Neural Network Architecture
Built with TensorFlow/Keras via [`reticulate`](https://rstudio.github.io/reticulate/):
Input Layer
    ↓
Dense(128) → BatchNormalization → ReLU → Dropout(0.30)
    ↓
Dense(64)  → BatchNormalization → ReLU → Dropout(0.20)
    ↓
Dense(5, activation = softmax)

- **Optimizer:** Adam (lr = 0.0005)
- **Loss:** Sparse categorical cross-entropy
- **Training:** Up to 100 epochs with early stopping (patience = 6) on validation loss

---

## Shiny App

After training, the R Shiny app lets you enter any game situation and see the predicted probability of each play type.

**User Inputs:**
- Offensive team
- Offense and defense scores
- Field position (yard line slider)
- Quarter, minutes, and seconds remaining
- Down and yards to go
- Offensive formation
- No huddle / goal-to-go toggles

**Output:**
- A probability table sorted from most to least likely play type
- A text summary of the single most likely play

---

## Setup & Usage

### Prerequisites
- R (≥ 4.1)
- Python (for TensorFlow via `reticulate`)

### Step 1 — Install and configure TensorFlow (run once)

Open `NN_NFL_Play_Prediction.R` and run **Part 1 of Setup** only:

```r
install.packages("reticulate")
install.packages("tensorflow")
tensorflow::install_tensorflow(envname = "r-tensorflow")
reticulate::use_virtualenv("r-tensorflow", required = TRUE)
reticulate::py_install("tf_keras", pip = TRUE)
```

**Restart your R session after this step.**

### Step 2 — Train the model

Run **Part 2 of Setup and the rest** of `NN_NFL_Play_Prediction.R`. This will:
1. Download 2024 NFL play-by-play data
2. Clean and preprocess the data
3. Train the neural network
4. Evaluate performance on a held-out test set
5. Save the model and preprocessing artifacts to disk

Before running, update the save path in Step 11 to match your local machine:

```r
model_dir <- "your/local/path/NFL_Play_Type_Predictor"
```

### Step 3 — Launch the Shiny app

Update the working directory in `RShiny_NFL_Play_Prediction.R` to match your save path:

```r
setwd("your/local/path/NFL_Play_Type_Predictor")
```

Then run the file. The Shiny app will launch in your browser.

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `nflreadr` | Loading NFL play-by-play and participation data |
| `reticulate` | R–Python interface for TensorFlow |
| `tensorflow` | Neural network training and inference |
| `rsample` | Game-grouped train/test splitting |
| `recipes` | Feature preprocessing pipeline |
| `themis` | Class upsampling |
| `yardstick` | Model evaluation metrics |
| `shiny` | Interactive web app |
| `DT` | Data table rendering |
| `tidyverse` | Data manipulation utilities |

---

## Data Source

Play-by-play and participation data are sourced from the [nflverse](https://github.com/nflverse) project via the `nflreadr` package.
