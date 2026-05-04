# 🛡️ SpamShield AI: Advanced Email Security Suite

**SpamShield AI** is a comprehensive security solution designed to protect users from phishing, spam, and malicious email content. The suite consists of a high-performance **Android Application** and a **Browser Extension**, utilizing Machine Learning and Google Cloud infrastructure for real-time threat detection.

---

## 🚀 Overview
SpamShield AI bridges the gap between traditional email filters and modern security needs. By utilizing **Naive Bayes** and **TF-IDF** algorithms, the system analyzes email text patterns to identify suspicious behavior with high accuracy.

### The Two-Layer Protection
1.  **Mobile App:** A full-featured dashboard for scanning inboxes, viewing risk distribution charts, and managing threat history.
2.  **Browser Extension:** A lightweight, "liquid-glass" popup for instant analysis of pasted content and an experimental **Gmail Auto-Scan** feature.

---

## ✨ Key Features
*   **🤖 ML-Powered Analysis:** Uses Naive Bayes and TF-IDF for linguistic pattern recognition.
*   **📊 Security Dashboard:** Real-time stats on Scanned, Spam, and Safe emails with interactive visualization.
*   **📩 Gmail Auto-Scan:** (Extension) Toggleable background scanning for incoming Gmail messages.
*   **🔍 Content Analyzer:** (Extension) Instantly analyze suspicious snippets with 98.2% accuracy feedback.
*   **🎨 Liquid-Glass UI:** Modern, high-end dark mode aesthetic with backdrop-blur effects.

---

## ⚙️ Technical Infrastructure

### Firebase Integration
The project leverages **Firebase** as a serverless backbone to maintain high performance with zero infrastructure investment:
*   **Hosting:** The Browser Extension assets and landing pages are deployed via **Firebase Hosting**, ensuring global CDN delivery and SSL security.
*   **Firestore:** Stores user-specific security stats (Scanned, Flagged, Safe counts) and threat history, allowing for real-time dashboard updates.

### Google Authentication & OAuth
To ensure a secure and seamless user experience, the app integrates **Google Identity Services**:
*   **Sign-Up/Login:** Uses **Google Authentication** via Firebase, allowing users to sync their scan history across the Mobile App and Extension.
*   **OAuth 2.0 Protocol:** Securely handles user tokens without ever seeing or storing account passwords.

### Google Cloud Console & "Read-Only" Security
The app follows the **Principle of Least Privilege**. Within the **Google Cloud Console (GCP)**, the application is strictly configured with **Read-Only Scopes**:
*   **Gmail API Scope:** Specifically limited to `https://www.googleapis.com/auth/gmail.readonly`.
*   **Security Guarantee:** This ensures the app can **only read** email metadata and content for analysis. It is technically incapable of sending, deleting, or modifying any user emails, providing a "Security-First" guarantee to the user.

---

## 🛠️ Tech Stack
*   **Detection Engine:** Naive Bayes Classifier + TF-IDF Vectorization.
*   **Frontend:** React / React Native with Tailwind CSS v4.
*   **Backend:** Firebase (Auth, Firestore, Hosting).
*   **Cloud:** Google Cloud Platform (Gmail API - Read Only).

---
**Developed by Divyanshu Kaprawan**  
*Empowering users through Intelligent Email Security.*
