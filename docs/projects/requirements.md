# Portfolio Projects: Requirements

This document describes each portfolio project and its core focus. Projects are grouped by target role.

> **Where this file sits:** `portfolio-site/docs/projects/requirements.md`. It lists the 24 projects the owner wants to build and show on the portfolio site. It is not the brief for the site itself, which is `portfolio-site/requirements.md`.
>
> **Rules for building a project:** the owner makes the choices, nothing leaves the local machine without the owner's approval, no secrets are stored, and nothing is invented.
>
> **Numbering:** `SD-1` here is `SD-01` in the prompts, with repository id `sd-01`. The same applies to every project.
>
> **Status (2026-11-14):** no project has been started. The site still shows placeholder projects.

---

## Software Developer Projects

### SD-1: CLI Expense or Task Tracker
**Core focus:** Clean, modular code and testing for a small, complete application.
- Object-oriented design with separated concerns
- File or JSON persistence
- Unit tests
- Git version control

### SD-2: REST API with Database
**Core focus:** Designing and securing a backend service.
- REST endpoint design
- SQL schema design
- Input validation
- Authentication
- Containerization with Docker

### SD-3: Full-Stack Mini App (React + Backend)
**Core focus:** Connecting a frontend to a backend end to end.
- Frontend state management
- API integration
- Login and sessions
- Deployment

### SD-4: Web Scraper with Scheduled Data Pipeline
**Core focus:** Automated, reliable data collection.
- HTTP requests
- Error handling and retries
- Job scheduling
- Data storage

### SD-5: CI/CD Pipeline
**Core focus:** Automating testing and deployment for an existing project.
- GitHub Actions workflows
- Automated tests on every commit
- Docker image builds
- Automatic deployment

### SD-6: Open-Source Contribution
**Core focus:** Working inside someone else's codebase.
- Reading and navigating an existing codebase
- Submitting pull requests
- Responding to code review
- Collaboration with maintainers

### SD-7: Large-Dataset Processing with Spark
**Core focus:** Processing data too large for a single machine.
- PySpark batch processing
- Hadoop/HDFS concepts
- Partitioning strategy
- Parquet output

### SD-8: Time-Series Metrics Service
**Core focus:** Storing and querying time-stamped data.
- Time-series databases (TimescaleDB or InfluxDB)
- Time-series schema design
- Retention policies
- Aggregation queries exposed through a REST API

### SD-9: Graph-Database Service
**Core focus:** Modeling and querying relationships.
- Graph database modeling (Neo4j)
- Cypher queries
- Relationship-focused REST API

### SD-10: Kubernetes Deployment
**Core focus:** Running containerized services in an orchestrated environment.
- Kubernetes Deployments, Services, and ConfigMaps
- Health checks
- Manifests that also work on OpenShift

### SD-11: Cloud Deployment
**Core focus:** Deploying and operating an app on a public cloud.
- One cloud provider (AWS, Azure, or GCP)
- Managed database and logging
- IAM basics
- Cost awareness

### SD-12: Search Service for Information Retrieval
**Core focus:** Efficient indexing and retrieval of documents.
- Inverted indexes (Elasticsearch, or Whoosh as a lighter option)
- Search API
- Relevance ranking
- Data structure design for retrieval

---

## Machine Learning Projects

### ML-1: Tabular Prediction with Exploratory Analysis
**Core focus:** The end-to-end workflow for a standard prediction problem.
- Pandas data cleaning
- Feature engineering
- scikit-learn modeling
- Cross-validation and metric selection

### ML-2: CNN Image Classifier
**Core focus:** Deep learning for computer vision.
- PyTorch model building and training
- Data augmentation
- Transfer learning
- Diagnosing overfitting with training curves

### ML-3: Sentiment Analysis with a Fine-Tuned Transformer
**Core focus:** NLP on text data.
- Text preprocessing and tokenization
- Fine-tuning a Hugging Face transformer
- Precision, recall, and F1 evaluation

### ML-4: Movie Recommender
**Core focus:** Recommendation systems.
- Collaborative filtering
- Matrix factorization
- Ranking metrics
- Train/test design for recommenders

### ML-5: End-to-End Model Deployment
**Core focus:** Taking a model from training to production.
- Experiment tracking with MLflow
- Model serving with FastAPI
- Docker packaging
- Basic monitoring

### ML-6: Time-Series Forecasting
**Core focus:** Forecasting with time-aware validation.
- Stationarity and seasonality analysis
- Baseline models
- Backtesting

### ML-7: Paper Reproduction
**Core focus:** Reading research and reproducing its results.
- Reading and implementing from a paper
- Comparing results rigorously
- Writing up findings

### ML-8: Large-Scale Modeling with PySpark MLlib
**Core focus:** Machine learning on datasets too large for pandas.
- Spark pipelines
- Distributed feature engineering
- MLlib model training

### ML-9: Statistical Foundations Study
**Core focus:** The mathematics behind regression and model validation.
- Gradient descent implemented in NumPy
- Ridge, Lasso, and Bayesian shrinkage
- Cross-validation and in-sample vs out-of-sample error
- Significance tests and Monte Carlo simulation

### ML-10: Business Value and ROI Model
**Core focus:** Connecting model performance to business outcomes.
- Cost-sensitive evaluation and threshold selection
- ROI and benefit analysis
- Presenting results to non-technical stakeholders

### ML-11: Information Extraction from Unstructured Documents
**Core focus:** Turning unstructured text into structured data.
- Text mining
- Named-entity recognition (spaCy or Hugging Face)
- PDF parsing
- Extraction accuracy evaluation

### ML-12: Graph-Based Recommender
**Core focus:** Recommendations based on graph traversal.
- Neo4j graph storage
- Cypher queries for user-item paths
- Comparison with the matrix factorization approach in ML-4
