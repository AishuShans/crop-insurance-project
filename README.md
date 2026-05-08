# AgriShield AI 🛡️🌾
### Enterprise-Grade Satellite-Based Crop Insurance Verification Platform

AgriShield AI is a state-of-the-art insurance platform designed to modernize the agricultural insurance sector. It leverages satellite imagery (NDVI analysis), machine learning models, and automated reporting to provide transparent, fast, and fraud-resistant crop insurance settlements, aligned with the PMFBY (Pradhan Mantri Fasal Bima Yojana) standards.

---

## 🌟 Key Features

- **🛰️ Satellite Intelligence**: Uses Earth Engine API for NDVI (Normalized Difference Vegetation Index) analysis to verify crop health and damage before/after natural disasters.
- **🤖 AI Fraud Detection**: Proprietary ML algorithms to detect fraudulent claims and estimate payout amounts with high precision.
- **🇮🇳 Bilingual Support**: Fully localized interface in **English** and **Hindi** for rural accessibility.
- **📊 Professional Admin Portal**: A command center for officers to review claims with geospatial heatmaps, weather timelines, and ML-driven risk scores.
- **📄 Official Report Generation**: Generates government-compliant PDF reports for every claim, including satellite evidence and digital verification stamps.
- **💬 AI Agri-Chatbot**: Integrated bilingual chatbot powered by Google Gemini to assist farmers with policy queries and claim status.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS 4.0, Leaflet (Geospatial Mapping), Recharts |
| **Backend** | FastAPI (Python 3.10+), SQLAlchemy, SQLite, Uvicorn |
| **AI/ML** | Scikit-learn, Pandas, Earth Engine API, Google Gemini Pro |
| **Styling** | Premium Glassmorphism UI, Modern Typography |

---

## ⚙️ Environment Configuration

### Backend Setup
1. Navigate to the `backend` directory.
2. Create or edit the `.env` file:
   ```env
   GEMINI_API_KEY="your_google_gemini_api_key"
   ```
   *Note: This is required for the AI Chatbot functionality.*

---

## 🚀 Installation & Local Setup

Follow these steps to run the complete platform on your local machine.

### Prerequisites
- **Python 3.10+**
- **Node.js (LTS)**
- **NPM**

### Step 1: Backend (FastAPI)
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```
*The backend will be available at: `http://localhost:8000`*

### Step 2: Frontend (React + Vite)
```bash
# Navigate to frontend (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
*The frontend will be available at: `http://localhost:5173`*

---

## 📖 Usage Guide

- **Farmer Portal**: `http://localhost:5173/` - For submitting claims and tracking status.
- **Researcher/Officer Dashboard**: `http://localhost:5173/researcher` - For field officers to verify data.
- **Admin Portal**: `http://localhost:5173/admin` - For final approval and enterprise analytics.
- **API Documentation**: `http://localhost:8000/docs` - Interactive Swagger UI for the backend.

---

## ☁️ Deployment Instructions

### Frontend (Static Hosting)
1. Run `npm run build` in the `frontend` folder.
2. The output will be in the `dist/` folder.
3. Deploy this folder to **Vercel**, **Netlify**, or **AWS S3**.

### Backend (Python Hosting)
1. Deploy the `backend/` folder to **Render**, **Railway**, or a **VPS (DigitalOcean/Linode)**.
2. Ensure you set the `GEMINI_API_KEY` in the environment variables of your hosting provider.
3. For production, use `gunicorn` with Uvicorn workers:
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   ```

### Database
- The current setup uses **SQLite** for ease of portability.
- For production scaling, update `database.py` to point to a **PostgreSQL** instance.

---

## 🤝 Support
For any technical issues or implementation queries, please refer to the `SETUP_INSTRUCTIONS.md` or contact the development team.

**AgriShield AI - Empowering Farmers with Intelligence.**
