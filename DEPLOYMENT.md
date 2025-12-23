# Deployment Guide

This guide covers how to deploy the **NGTA Stock Analyzer** to production using **Render** (for the Backend) and **Vercel** (for the Frontend).

## Prerequisites

-   Git Provider Account (e.g., GitHub, GitLab)
-   [Render Account](https://render.com)
-   [Vercel Account](https://vercel.com)
-   Code pushed to a Git repository (separating Backend and Frontend directories or monorepo).

---

## Part 1: Deploy Backend to Render

1.  **Dashboard**: Log in to your Render Dashboard.
2.  **New Web Service**: Click **New +** -> **Web Service**.
3.  **Connect Repo**: Connect your Git repository.
4.  **Configuration**:
    -   **Root Directory**: `Backend` (Important!)
    -   **Runtime**: `Python 3`
    -   **Build Command**: `pip install -r requirements.txt`
    -   **Build Command**: `pip install -r requirements.txt`
    -   **Start Command**: `gunicorn -w 1 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:10000 --max-requests 300 --timeout 120`
5.  **Environment Variables**:
    -   Go to the **Environment** tab.
    -   Add `PYTHON_VERSION`: `3.10.0` (or your local version)
    -   Add `ALLOWED_ORIGINS`: `*` (initially, then update with Vercel URL later)
    -   Add `ALLOWED_HOSTS`: `*`
    -   Add `ALLOWED_HOSTS`: `*`
    -   **Add `DEBUG`**: `False` (Important for security)
    -   *(Auth variables formerly required are no longer needed)*
6.  **Deploy Service**: Click **Create Web Service**.
7.  **Copy URL**: Once deployed, copy the service URL (e.g., `https://ngta-backend.onrender.com`).

---

## Part 2: Deploy Frontend to Vercel

1.  **Dashboard**: Log in to Vercel.
2.  **Add New**: Click **Add New** -> **Project**.
3.  **Import Repo**: Import your Git repository.
4.  **Configuration**:
    -   **Framework Preset**: Next.js
    -   **Root Directory**: Edit and select `frontend`.
5.  **Environment Variables**:
    -   Expand **Environment Variables**.
    -   Key: `NEXT_PUBLIC_API_URL`
    -   Value: Your Render Backend URL (e.g., `https://ngta-backend.onrender.com`) **(Remove trailing slash!)**
6.  **Deploy**: Click **Deploy**.

---

## Part 3: Final Integration

1.  **Update Backend CORS** (Optional but Recommended):
    -   Go back to Render -> Environment.
    -   Update `ALLOWED_ORIGINS` to your Vercel URL (e.g., `https://ngta-frontend.vercel.app`).
    -   This prevents other websites from using your backend.

2.  **Test**: Open your Vercel app URL. It should show live data from your Render backend!

---

### Troubleshooting

-   **CORS Errors**: Check `ALLOWED_ORIGINS` in Render. Ensure it exactly matches the frontend URL (no trailing slash usually preferred, but the code handles it).
-   **Build Fails**: Check logs. Ensure `requirements.txt` has all dependencies.
-   **404 Errors**: Ensure `NEXT_PUBLIC_API_URL` is correct and endpoints match `/api/v1/...`.
