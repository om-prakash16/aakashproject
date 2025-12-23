# NSE Stock Analyzer - Hosting & Connection Guide

This guide explains how to set up the environment, run the backend and frontend servers, and ensuring the API connection works correctly.

## 1. Prerequisites

Ensure you have the following installed on your system:
- **Python 3.10+** (for the Backend)
- **Node.js 18+** (for the Frontend)
- **Git** (Version Control)

---

## 2. Backend Setup (FastAPI)

The backend handles data fetching, processing, and API requests. It runs on port `8000`.

### Step 1: Navigate to Backend Directory
Open a terminal (Command Prompt or PowerShell) and run:
`cd "e:\Mr Aakash\backend"`

### Step 2: Create a Virtual Environment (Recommended)
This isolates dependencies to avoid conflicts.
`python -m venv venv`

Activate the virtual environment:
- **Windows:** `venv\Scripts\activate`
- **Mac/Linux:** `source venv/bin/activate`

### Step 3: Install Dependencies
`pip install -r requirements.txt`

### Step 4: Run the Backend Server
Start the server using Uvicorn:
`uvicorn app.main:app --reload`

- The API will be available at: `http://localhost:8000`
- API Documentation (Swagger UI): `http://localhost:8000/docs`

---

## 3. Frontend Setup (Next.js)

The frontend provides the user interface and interacts with the backend API. It runs on port `3000`.

### Step 1: Navigate to Frontend Directory
Open a **new** terminal window and run:
`cd "e:\Mr Aakash\frontend"`

### Step 2: Install Dependencies
`npm install`

### Step 3: Run the Frontend Server
`npm run dev`

- The application will be available at: `http://localhost:3000`

---

## 4. API Connection

The frontend is configured to communicate with the backend at `http://localhost:8000`.

### Configuration
If you need to change the backend URL (e.g., for deployment), checking the frontend source code is required as it currently points to `localhost`.

- **Default API URL:** `http://localhost:8000/api/v1`
- **Frontend Files using API:** Mostly located in `src/app` or `src/components`.

**Note:** Ensure the Backend is running **before** using the Frontend to avoid connection errors.

---

## 5. Troubleshooting

- **Port in Use:** If port 8000 or 3000 is taken, the terminal will show an error. specific ports can be specified:
  - Backend: `uvicorn app.main:app --reload --port 8080`
  - Frontend: `npm run dev -- -p 3001`
- **CORS Errors:** The backend is configured to allow all origins (`*`) by default, so you shouldn't face CORS issues during local development.

---

## 6. Building for Production

To run the application in a production-like environment:

### Backend
1.  **Run with multiple workers:**
    `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4`

### Frontend
1.  **Build the application:**
    `npm run build`
2.  **Start the production server:**
    `npm start`
