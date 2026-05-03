# 🛡️ SpamShield AI — Email Spam Filter Chrome Extension

A modern Chrome extension that uses Machine Learning (Naive Bayes + TF-IDF) to detect spam emails in real-time, with a stunning dark-themed UI.

\---

## 📁 Project Structure

```
spam-filter-extension/
├── extension/              ← Chrome Extension files
│   ├── manifest.json
│   ├── popup.html          ← Main UI
│   ├── css/
│   │   ├── popup.css       ← Extension popup styles
│   │   └── content.css     ← Gmail injection styles
│   ├── js/
│   │   ├── popup.js        ← Popup logic + API calls
│   │   ├── content.js      ← Gmail page integration
│   │   └── background.js   ← Service worker
│   └── icons/              ← Extension icons (add your own)
│
├── backend/                ← Python ML API
│   ├── app.py              ← Flask API server
│   ├── train\\\_model.py      ← Model training script
│   ├── requirements.txt
│   └── model/              ← Auto-created after training
│       ├── spam\\\_model.pkl
│       └── vectorizer.pkl
│
└── README.md
```

\---

## 🚀 Setup Instructions

### Step 1 — Set Up Python Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\\\\Scripts\\\\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2 — Train the ML Model

```bash
python train\\\_model.py
```

This will:

* Download the SMS Spam Collection dataset automatically
* Train a Naive Bayes classifier with TF-IDF features
* Save the model to `backend/model/`
* Print accuracy metrics (\~98% accuracy)

### Step 3 — Start the API Server

```bash
python app.py
```

The API will be running at: `http://localhost:5000`

Test it:

```bash
curl -X POST http://localhost:5000/predict \\\\
  -H "Content-Type: application/json" \\\\
  -d '{"email": "Congratulations! You won a free prize. Click here now!"}'
```

\---

### Step 4 — Install Chrome Extension

1. Open Chrome and go to: `chrome://extensions`
2. Enable **Developer Mode** (top-right toggle)
3. Click **"Load unpacked"**
4. Select the `extension/` folder
5. The SpamShield AI icon will appear in your toolbar!

\---

## ✨ Features

|Feature|Description|
|-|-|
|📝 Manual Scan|Paste any email text and analyze it instantly|
|🔴 Spam Detection|Naive Bayes ML model with 98%+ accuracy|
|📊 Confidence Score|Visual bar showing spam probability|
|🏷️ Signal Tokens|Highlights suspicious keywords found|
|📧 Gmail Auto-Scan|Toggle to scan inbox rows automatically|
|📈 Session Stats|Tracks emails scanned and flagged|
|🌐 Client Fallback|Works offline using keyword detection|

\---

## 🧠 ML Model Details

|Component|Details|
|-|-|
|Algorithm|Multinomial Naive Bayes|
|Features|TF-IDF (unigrams + bigrams, 10k vocab)|
|Dataset|SMS Spam Collection (5,574 messages)|
|Accuracy|\~98.2%|
|Precision|\~99.1%|
|Recall|\~94.3%|

\---

## 🌐 Deploying the Backend (Optional)

To make the extension work on your client's PC without running Python locally, deploy the backend:

### Option A — Railway (Free)

1. Push `backend/` to GitHub
2. Go to [railway.app](https://railway.app)
3. Deploy from GitHub
4. Update `API\\\_URL` in `extension/js/popup.js` and `extension/js/content.js`

### Option B — Render (Free)

1. Go to [render.com](https://render.com)
2. New Web Service → Connect repo
3. Build command: `pip install -r requirements.txt \\\&\\\& python train\\\_model.py`
4. Start command: `python app.py`

\---

## 🔧 Customization

**Change the API URL:** Edit line 2 of both `js/popup.js` and `js/content.js`:

```js
const API\\\_URL = "https://your-deployed-api.com/predict";
```

**Adjust spam threshold:** In `app.py`, change the sensitivity:

```python
is\\\_spam = spam\\\_probability >= 0.5  # Lower = more sensitive
```

\---

## 📄 License

MIT — Free to use and modify.

