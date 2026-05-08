# Setup Instructions for Crop Insurance System

Follow these steps to run the complete Satellite-Based Crop Insurance Verification System on your friend's laptop.

## Prerequisites
Before you start, make sure the laptop has the following installed:
1. **Python 3.10+** (Checking the box "Add Python to PATH" during installation is required)
2. **Node.js** (LTS version, comes with npm)
3. **VS Code** (Optional, but recommended)

---

## Step 1: Extract the Code
1. Extract the `crop_insurance.zip` file containing this project to a folder on the new laptop (e.g., `Documents\crop_insurance`).
2. Open that extracted folder in VS Code.

---

## Step 2: Set up the Backend (FastAPI + Python)
1. Open a new terminal in VS Code (Terminal -> New Terminal).
2. Navigate to the `backend` folder:
   ```cmd
   cd backend
   ```
3. Create a new Python virtual environment:
   ```cmd
   python -m venv venv
   ```
4. Activate the virtual environment:
   - On Windows: 
     ```cmd
     venv\Scripts\activate
     ```
   - On Mac/Linux:
     ```bash
     source venv/bin/activate
     ```
5. Install the required Python dependencies:
   ```cmd
   pip install -r requirements.txt
   ```
6. Start the backend server:
   ```cmd
   uvicorn main:app --reload --port 8000
   ```
*(Keep this terminal running in the background).*

---

## Step 3: Set up the Frontend (React + Vite)
1. Open a **second** terminal in VS Code (Click the `+` icon in the terminal panel).
2. Navigate to the `frontend` folder:
   ```cmd
   cd frontend
   ```
3. Install the Node modules (this might take a minute):
   ```cmd
   npm install
   ```
4. Start the frontend development server:
   ```cmd
   npm run dev
   ```

---

## Step 4: Use the Application

Once both servers are running successfully:
- Open your browser and go to: **[http://localhost:5173](http://localhost:5173)** to view the Frontend.
- The Admin Portal is located at **[http://localhost:5173/admin](http://localhost:5173/admin)**.
- The backend API docs can be viewed at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

> **Note:** The SQLite database `claims.db` is already included in the `backend/` folder inside the zip so any data you submitted will carry over!
