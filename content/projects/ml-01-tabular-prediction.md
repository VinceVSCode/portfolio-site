---
title: "Tabular Prediction with Exploratory Analysis"
summary: "Predicts whether a person earns above 50K from census data, with three models compared by cross-validation and an error analysis."
---

## Problem

Given census answers about a person (age, education, occupation, hours worked and others), predict whether their yearly income is above 50,000 dollars. The aim was the complete workflow for a standard prediction problem, where one command reproduces every number, and not the highest possible score.

The data is the Adult dataset from the UCI Machine Learning Repository (1994 United States census, CC BY 4.0): 48,790 people after cleaning, of whom 24% earn above 50K.

![Three charts: 76% of people earn 50K or less; the share of high incomes rises with education; it rises and then falls with age.](../assets/img/projects/ml-01/data_overview.png)

## Approach

1. **Explore** the raw data in a notebook to see what must be cleaned and which columns relate to income.
2. **Clean:** trim text, turn `?` into missing values, read the two spellings of the target, and drop duplicate rows.
3. **Engineer features** in a scikit-learn `ColumnTransformer` that sits inside each model's pipeline, so nothing is learned from the rows a model is checked on.
4. **Compare** a baseline and three models (logistic regression, random forest, gradient boosting) with 5-fold cross-validation.
5. **Test** the best model once, on rows set aside at the start, and look at where it is wrong.

## Execution instructions

There is no live demo. The project runs on your own machine and writes its results to files.

**With Python** (3.11 or newer), in the cloned project folder:

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1   # macOS or Linux: source .venv/bin/activate
pip install -e .
python scripts/train.py
```

The last command downloads the data (6 MB) on its first run, trains and tests the models in about 40 seconds, and writes the results to `reports/` and the model to `models/`.

**With Docker** (no Python needed): `docker compose run --rm app`. The same files appear in `reports/` and `models/`.

To open the exploratory notebook, install the extra tools with `pip install -e ".[notebook]"`.

## Tech stack

- **Python**, **Pandas** and **scikit-learn** for the data and the models.
- **Matplotlib** for the figures, and a **Jupyter notebook** for the exploration.
- **`pytest`** and **`ruff`**; the tests use a small made-up table and no network.
- **Docker** as a second way to run the training.

## Challenges and solutions

- **Unbalanced classes.** Always answering "50K or less" is right 76% of the time, so accuracy alone says little. The project reports F1, ROC AUC, RMSE and MAE next to a baseline, and explains what each one hides.
- **Reproducibility.** A fixed seed, pinned library versions and a limit on threads make the same command write the same metrics file every time. A test checks this.
- **A light run.** Everything trains in about 40 seconds on a 2-core laptop, with near-default settings and no tuning. Heavier settings live in one configuration file for a later run on a stronger machine.

## Results

Gradient boosting was best in cross-validation on six of seven metrics.

![Bar chart comparing a baseline and three models on seven metrics. Gradient boosting scores best on six of them.](../assets/img/projects/ml-01/thumbnail.png)

On 9,758 test rows the model never saw:

| Metric | Gradient boosting | Baseline |
|---|---|---|
| F1 | 0.724 | 0.000 |
| ROC AUC | 0.933 | 0.500 |
| RMSE (of the probability) | 0.292 | 0.427 |
| MAE (of the probability) | 0.171 | 0.364 |
| Accuracy | 0.876 | 0.761 |

![Test results: a ROC curve with area 0.933, a table of 6,966 and 1,583 correct answers against 456 false alarms and 753 misses, and a histogram of predicted probabilities.](../assets/img/projects/ml-01/demo.png)

The model misses a high income (32% of them) far more often than it raises a false alarm (6%). The misses are not spread evenly: 43% of high-earning women are missed against 30% of men. The data is from 1994 and includes sex and race, so this model is an exercise and must not be used for decisions about people.

## What I learned

This section will be written after the project passes its quality review.
