"""
SpamShield AI — ML Backend
Flask API serving a Naive Bayes spam classifier with TF-IDF features
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os
import re
import string

app = Flask(__name__)
CORS(app)  # Allow requests from the Chrome extension

# ── Load Model ────────────────────────────────────────
MODEL_PATH   = os.path.join(os.path.dirname(__file__), "model", "spam_model.pkl")
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), "model", "vectorizer.pkl")

try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    with open(VECTORIZER_PATH, "rb") as f:
        vectorizer = pickle.load(f)
    print("✅ Model loaded successfully")
except FileNotFoundError:
    print("⚠️  Model not found. Run train_model.py first.")
    model = None
    vectorizer = None


# ── Text Preprocessing ────────────────────────────────
def preprocess(text: str) -> str:
    text = text.lower()
    text = re.sub(r"http\S+|www\S+", " url ", text)
    text = re.sub(r"\b\d+\b", " num ", text)
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ── Spam Keywords for token highlighting ──────────────
SPAM_SIGNALS = [
    "free", "winner", "click here", "urgent", "congratulations",
    "prize", "offer", "limited time", "act now", "earn money",
    "make money", "buy now", "discount", "guaranteed", "no risk",
    "million", "lottery", "inheritance", "bank account",
    "verify your account", "password", "credit card", "bitcoin",
    "investment", "risk-free", "unsubscribe", "dear friend",
    "dear winner", "claim now", "you have been selected",
    "100% free", "double your", "cash bonus", "extra income",
    "fast cash", "get paid", "incredible deal", "join millions",
    "no cost", "no fees", "once in a lifetime", "order now",
    "please read", "pure profit", "special promotion", "this is not spam",
    "you are a winner", "you've been chosen"
]

def extract_top_tokens(text: str, is_spam: bool) -> list:
    lower = text.lower()
    found = [kw for kw in SPAM_SIGNALS if kw in lower]
    return found[:8]


# ── Routes ────────────────────────────────────────────
@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "name": "SpamShield AI API",
        "version": "1.0.0",
        "status": "running",
        "model_loaded": model is not None
    })


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)

    if not data or "email" not in data:
        return jsonify({"error": "Missing 'email' field"}), 400

    email_text = data["email"]

    if not email_text.strip():
        return jsonify({"error": "Email text is empty"}), 400

    if model is None or vectorizer is None:
        # Fallback: keyword-based detection
        return fallback_predict(email_text)

    # Preprocess and vectorize
    cleaned = preprocess(email_text)
    features = vectorizer.transform([cleaned])

    # Predict
    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]

    is_spam = bool(prediction == 1)
    spam_probability = float(probabilities[1])

    top_tokens = extract_top_tokens(email_text, is_spam)

    return jsonify({
        "is_spam": is_spam,
        "spam_probability": round(spam_probability, 4),
        "confidence": round(spam_probability * 100, 1),
        "top_tokens": top_tokens,
        "method": "ml_model"
    })


def fallback_predict(text: str):
    """Keyword-based fallback when model is not loaded"""
    lower = text.lower()
    found = [kw for kw in SPAM_SIGNALS if kw in lower]
    spam_prob = min(len(found) / 5, 1.0)
    is_spam = spam_prob >= 0.4

    return jsonify({
        "is_spam": is_spam,
        "spam_probability": round(spam_prob, 4),
        "confidence": round(spam_prob * 100, 1),
        "top_tokens": found[:8],
        "method": "keyword_fallback"
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "loaded" if model else "not_loaded"})


# ── Run ───────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
