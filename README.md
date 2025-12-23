# aakashproject

![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![Stack](https://img.shields.io/badge/Tech-Next.js%20%7C%20FastAPI%20%7C%20Python-green.svg)

**A professional-grade real-time market analytics platform designed for the modern trader.**

The **NSE F&O Stock Analyzer** is a high-performance web application that processes live market data to identify high-probability trading setups. Unlike traditional brokers that list thousands of stocks, this system uses an **intelligent filtering engine** to isolate the few stocks that matter right now.

---

## 🚀 Why This Project Stands Out

In the fast-paced world of F&O (Futures & Options) trading, speed and clarity are everything. This project solves three critical problems:

1.  **Noise Reduction**: Instead of watching 200 stocks, highlights top "Moving" stocks.
2.  **Context-Aware Analysis**: Correlates Price Change with RSI and MACD.
3.  **Instant Decision Making**: Single glance trend analysis.

---

## ⚡ Key Features

*   **📊 God Mode Dashboard**: A unified table view with multi-day performance metrics.
*   **🧠 Smart Strength Engine**: Automatically classifies stocks as **"Buyers Dominating"**, **"Sellers Dominating"**, or **"Neutral"**.
*   **🔍 Advanced Filtering**: Excel-style multi-column filtering.
*   **📉 Real-Time Options Chain**: Live Call/Put data analysis.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: Next.js 14
*   **UI Library**: React 18
*   **Styling**: Tailwind CSS & Shadcn/UI

### Backend
*   **API Framework**: FastAPI (Python)
*   **Data Processing**: Pandas & NumPy
*   **Market Data**: Breeze Connect (ICICIdirect)

---

## 🏁 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)

### Installation

1.  **Setup Backend**
    ```bash
    cd Backend
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # Mac/Linux
    source venv/bin/activate
    
    pip install -r requirements.txt
    python main.py
    ```

2.  **Setup Frontend**
    ```bash
    cd frontend
    # Note: Frontend Setup steps here
    ```

---

## 📄 License
This project is licensed under the MIT License.