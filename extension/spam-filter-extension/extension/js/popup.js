// ── Config ────────────────────────────────────────────
const API_URL = "http://localhost:5000/predict"; // Change to your deployed URL

// ── DOM References ─────────────────────────────────────
const emailInput    = document.getElementById("emailInput");
const scanBtn       = document.getElementById("scanBtn");
const resultSection = document.getElementById("resultSection");
const resultCard    = document.getElementById("resultCard");
const resultIcon    = document.getElementById("resultIcon");
const resultLabel   = document.getElementById("resultLabel");
const resultSublabel= document.getElementById("resultSublabel");
const confidencePct = document.getElementById("confidencePct");
const confidenceFill= document.getElementById("confidenceBarFill");
const tokensList    = document.getElementById("tokensList");
const tokensWrap    = document.getElementById("tokensWrap");
const charCount     = document.getElementById("charCount");
const statScanned   = document.getElementById("statScanned");
const statBlocked   = document.getElementById("statBlocked");
const gmailToggle   = document.getElementById("gmailToggle");

// ── State ──────────────────────────────────────────────
let stats = { scanned: 0, flagged: 0 };

// ── Init ───────────────────────────────────────────────
chrome.storage.local.get(["stats", "gmailAutoScan"], (data) => {
  if (data.stats) {
    stats = data.stats;
    updateStatDisplay();
  }
  if (data.gmailAutoScan !== undefined) {
    gmailToggle.checked = data.gmailAutoScan;
  }
});

// ── Char Counter ───────────────────────────────────────
emailInput.addEventListener("input", () => {
  const len = emailInput.value.length;
  charCount.textContent = `${len} char${len !== 1 ? "s" : ""}`;
});

// ── Scan Button ────────────────────────────────────────
scanBtn.addEventListener("click", async () => {
  const text = emailInput.value.trim();
  if (!text) {
    shakeInput();
    return;
  }
  await analyzeEmail(text);
});

// ── Gmail Toggle ───────────────────────────────────────
gmailToggle.addEventListener("change", () => {
  const val = gmailToggle.checked;
  chrome.storage.local.set({ gmailAutoScan: val });
  chrome.tabs.query({ url: "https://mail.google.com/*" }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: val ? "startMonitor" : "stopMonitor"
      });
    });
  });
});

// ── Core: Analyze ──────────────────────────────────────
async function analyzeEmail(text) {
  setLoading(true);
  hideResult();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: text }),
    });

    if (!response.ok) throw new Error("Server error");
    const data = await response.json();

    showResult(data);
    updateStats(data.is_spam);

  } catch (err) {
    // Fallback: client-side naive detection for demo
    const result = clientSideDetect(text);
    showResult(result);
    updateStats(result.is_spam);
  } finally {
    setLoading(false);
  }
}

// ── Client-side Fallback Detector ──────────────────────
function clientSideDetect(text) {
  const spamKeywords = [
    "free", "winner", "click here", "urgent", "congratulations",
    "prize", "offer", "limited time", "act now", "earn money",
    "make money", "buy now", "discount", "guaranteed", "no risk",
    "million dollars", "lottery", "inheritance", "bank account",
    "verify your account", "password", "credit card", "bitcoin",
    "investment", "risk-free", "unsubscribe", "dear friend",
    "dear winner", "claim now", "you've been selected"
  ];

  const lowerText = text.toLowerCase();
  const foundTokens = [];

  for (const kw of spamKeywords) {
    if (lowerText.includes(kw)) foundTokens.push(kw);
  }

  const spamScore = Math.min(foundTokens.length / 5, 1);
  const confidence = Math.round(spamScore * 100);
  const is_spam = confidence >= 40;

  return {
    is_spam,
    confidence: is_spam ? confidence : 100 - confidence,
    spam_probability: spamScore,
    top_tokens: foundTokens.slice(0, 8),
    method: "client-side"
  };
}

// ── Show Result ────────────────────────────────────────
function showResult(data) {
  const { is_spam, spam_probability, top_tokens } = data;
  const pct = Math.round((spam_probability ?? (is_spam ? 0.85 : 0.05)) * 100);

  resultCard.className = `result-card ${is_spam ? "spam" : "safe"}`;

  if (is_spam) {
    resultIcon.className = "result-icon spam-icon";
    resultIcon.innerHTML = "🚨";
    resultLabel.className = "result-label is-spam";
    resultLabel.textContent = "SPAM DETECTED";
    resultSublabel.textContent = "This email contains suspicious patterns";
  } else {
    resultIcon.className = "result-icon safe-icon";
    resultIcon.innerHTML = "✅";
    resultLabel.className = "result-label is-safe";
    resultLabel.textContent = "LOOKS SAFE";
    resultSublabel.textContent = "No spam indicators found";
  }

  // Confidence bar
  confidencePct.textContent = `${pct}%`;
  setTimeout(() => {
    confidenceFill.style.width = `${pct}%`;
    if (pct < 30) confidenceFill.style.background = "var(--safe)";
    else if (pct < 60) confidenceFill.style.background = "var(--warn)";
    else confidenceFill.style.background = "linear-gradient(90deg, #FF6B35, #FF3D6B)";
  }, 50);

  // Tokens
  tokensList.innerHTML = "";
  if (top_tokens && top_tokens.length > 0) {
    tokensWrap.style.display = "block";
    top_tokens.forEach((token, i) => {
      const pill = document.createElement("span");
      pill.className = `token-pill ${is_spam ? "" : "safe-token"}`;
      pill.textContent = token;
      pill.style.animationDelay = `${i * 50}ms`;
      tokensList.appendChild(pill);
    });
  } else {
    tokensWrap.style.display = "none";
  }

  resultSection.classList.add("visible");
}

function hideResult() {
  resultSection.classList.remove("visible");
}

// ── Stats ──────────────────────────────────────────────
function updateStats(isSpam) {
  stats.scanned += 1;
  if (isSpam) stats.flagged += 1;
  chrome.storage.local.set({ stats });
  updateStatDisplay();
}

function updateStatDisplay() {
  animateCount(statScanned, parseInt(statScanned.textContent) || 0, stats.scanned);
  animateCount(statBlocked, parseInt(statBlocked.textContent) || 0, stats.flagged);
}

function animateCount(el, from, to) {
  const dur = 600;
  const start = performance.now();
  const update = (now) => {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(from + (to - from) * easeOut(p));
    if (p < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

// ── UI Helpers ─────────────────────────────────────────
function setLoading(state) {
  scanBtn.classList.toggle("loading", state);
  scanBtn.disabled = state;
}

function shakeInput() {
  emailInput.style.animation = "none";
  emailInput.getBoundingClientRect();
  emailInput.style.animation = "shake 0.4s ease";
  emailInput.style.borderColor = "rgba(255,61,107,0.6)";
  setTimeout(() => {
    emailInput.style.borderColor = "";
    emailInput.style.animation = "";
  }, 500);
}
