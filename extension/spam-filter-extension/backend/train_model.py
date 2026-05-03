"""
SpamShield AI — Model Trainer
Trains a Naive Bayes classifier on the SMS Spam Collection dataset.
Run this ONCE before starting the API.

Usage:
    python train_model.py
"""

import os
import re
import string
import pickle
import urllib.request

import numpy as np
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, classification_report
)
from sklearn.pipeline import Pipeline

# ── Paths ─────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR  = os.path.join(BASE_DIR, "model")
os.makedirs(MODEL_DIR, exist_ok=True)

MODEL_PATH      = os.path.join(MODEL_DIR, "spam_model.pkl")
VECTORIZER_PATH = os.path.join(MODEL_DIR, "vectorizer.pkl")
DATA_PATH       = os.path.join(MODEL_DIR, "spam.csv")

# ── Dataset Download ──────────────────────────────────
DATASET_URL = (
    "https://raw.githubusercontent.com/justmarkham/pycon-2016-tutorial/"
    "master/data/sms.tsv"
)

def download_dataset():
    if os.path.exists(DATA_PATH):
        print("✅ Dataset already exists, skipping download.")
        return

    print("📥 Downloading SMS Spam Collection dataset...")
    try:
        urllib.request.urlretrieve(DATASET_URL, DATA_PATH)
        print("✅ Dataset downloaded.")
    except Exception as e:
        print(f"❌ Download failed: {e}")
        print("   Please manually download the dataset and place it at:", DATA_PATH)
        raise


# ── Preprocessing ─────────────────────────────────────
def preprocess(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+", " url ", text)
    text = re.sub(r"\b\d+\b", " num ", text)
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ── Load Data ─────────────────────────────────────────
def load_data():
    print("📂 Loading dataset...")
    texts, labels = [], []

    with open(DATA_PATH, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            parts = line.strip().split("\t")
            if len(parts) < 2:
                continue
            label_str, message = parts[0], "\t".join(parts[1:])
            label = 1 if label_str.strip().lower() == "spam" else 0
            texts.append(preprocess(message))
            labels.append(label)

    print(f"   Total samples: {len(texts)}")
    print(f"   Spam: {sum(labels)}, Ham: {len(labels) - sum(labels)}")
    return texts, labels


# ── Train ─────────────────────────────────────────────
def train():
    download_dataset()
    texts, labels = load_data()

    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    print("\n🔧 Training TF-IDF + Naive Bayes model...")

    vectorizer = TfidfVectorizer(
        max_features=10000,
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=2
    )

    model = MultinomialNB(alpha=0.1)

    # Fit
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec  = vectorizer.transform(X_test)
    model.fit(X_train_vec, y_train)

    # Evaluate
    y_pred = model.predict(X_test_vec)
    acc  = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec  = recall_score(y_test, y_pred)
    f1   = f1_score(y_test, y_pred)

    print("\n📊 Model Performance:")
    print(f"   Accuracy  : {acc*100:.2f}%")
    print(f"   Precision : {prec*100:.2f}%")
    print(f"   Recall    : {rec*100:.2f}%")
    print(f"   F1 Score  : {f1*100:.2f}%")
    print("\n" + classification_report(y_test, y_pred, target_names=["Ham", "Spam"]))

    # Save
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(VECTORIZER_PATH, "wb") as f:
        pickle.dump(vectorizer, f)

    print("✅ Model saved to:", MODEL_DIR)
    print("🚀 Now run: python app.py")


if __name__ == "__main__":
    train()
