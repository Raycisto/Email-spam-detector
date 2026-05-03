// SpamShield AI — Gmail Content Script
// Monitors Gmail inbox and scans emails automatically

const API_URL = "http://localhost:5000/predict";
let isMonitoring = false;
let observer = null;

// ── Message Listener ───────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "startMonitor") startMonitor();
  if (msg.action === "stopMonitor") stopMonitor();
  if (msg.action === "scanSelected") scanCurrentEmail();
});

// ── Auto-start if saved ────────────────────────────────
chrome.storage.local.get("gmailAutoScan", (data) => {
  if (data.gmailAutoScan) startMonitor();
});

// ── Monitor ────────────────────────────────────────────
function startMonitor() {
  if (isMonitoring) return;
  isMonitoring = true;

  observer = new MutationObserver(debounce(() => {
    scanEmailRows();
  }, 800));

  const target = document.body;
  observer.observe(target, { childList: true, subtree: true });
  scanEmailRows();
}

function stopMonitor() {
  isMonitoring = false;
  if (observer) observer.disconnect();
  // Remove all badges
  document.querySelectorAll(".spamshield-badge").forEach(b => b.remove());
}

// ── Scan email rows in the inbox ───────────────────────
function scanEmailRows() {
  // Gmail email rows have role="row" with email subjects
  const rows = document.querySelectorAll('tr.zA:not([data-spamshield])');

  rows.forEach(row => {
    row.setAttribute("data-spamshield", "pending");

    const subjectEl = row.querySelector('.bog') || row.querySelector('.bqe') || row.querySelector('span[data-thread-id]');
    const senderEl  = row.querySelector('.yP') || row.querySelector('.zF');

    const text = [
      subjectEl ? subjectEl.innerText : "",
      senderEl  ? senderEl.innerText  : ""
    ].join(" ");

    if (!text.trim()) return;

    predictSpam(text).then(result => {
      row.setAttribute("data-spamshield", result.is_spam ? "spam" : "safe");
      if (result.is_spam) {
        addSpamBadge(row, result);
      }
    });
  });
}

// ── Add visual badge to email row ──────────────────────
function addSpamBadge(row, result) {
  if (row.querySelector(".spamshield-badge")) return;

  const badge = document.createElement("span");
  badge.className = "spamshield-badge";
  badge.title = `SpamShield AI: ${Math.round(result.spam_probability * 100)}% spam probability`;

  const pct = Math.round(result.spam_probability * 100);
  badge.textContent = `⚠ ${pct}%`;

  // Insert at the start of the row
  const firstCell = row.querySelector("td");
  if (firstCell) firstCell.prepend(badge);
}

// ── Predict via API (with client fallback) ─────────────
async function predictSpam(text) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: text }),
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return clientFallback(text);
  }
}

// ── Client-side Fallback ───────────────────────────────
function clientFallback(text) {
  const keywords = [
    "free", "winner", "click here", "urgent", "congratulations",
    "prize", "offer", "limited time", "act now", "earn money",
    "buy now", "guaranteed", "no risk", "million", "lottery",
    "inheritance", "verify your account", "bitcoin", "unsubscribe",
    "you have been selected", "dear friend", "claim now"
  ];
  const lower = text.toLowerCase();
  const hits = keywords.filter(k => lower.includes(k));
  const prob = Math.min(hits.length / 4, 1);
  return { is_spam: prob >= 0.4, spam_probability: prob, top_tokens: hits };
}

// ── Scan current open email ────────────────────────────
function scanCurrentEmail() {
  const body = document.querySelector(".a3s.aiL");
  if (!body) return;
  predictSpam(body.innerText).then(result => {
    showOverlayResult(result);
  });
}

function showOverlayResult(result) {
  document.querySelector(".spamshield-overlay")?.remove();
  const overlay = document.createElement("div");
  overlay.className = "spamshield-overlay";
  overlay.innerHTML = `
    <div class="ss-overlay-inner ${result.is_spam ? 'spam' : 'safe'}">
      <span>${result.is_spam ? "🚨 SPAM DETECTED" : "✅ LOOKS SAFE"}</span>
      <span class="ss-pct">${Math.round(result.spam_probability * 100)}% spam</span>
      <button class="ss-close" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

// ── Utils ──────────────────────────────────────────────
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
