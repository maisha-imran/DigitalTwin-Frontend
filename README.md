# DigitalTwin-Frontend

This repository contains the frontend implementation for the **Bengaluru Road Health Intelligence** platform. It utilizes a Physics-Informed Graph Neural Network (GNN) to provide real-time monitoring, predictive maintenance, and budget forecasting for city road networks.

The application is built with **React**, **TypeScript**, and **Vite**, featuring interactive data visualizations powered by **Chart.js** and map views using **Leaflet**.

## 🏗 Related Repositories

This frontend is part of a larger ecosystem. You can find the other components here:
* **Backend**: [https://github.com/maisha-imran/DigitalTwin/backend](https://github.com/maisha-imran/DigitalTwin) (/backend, FastAPI service)
* **Notebooks**: [https://github.com/maisha-imran/DigitalTwin/notebooks](https://github.com/maisha-imran/DigitalTwin) (/notebooks, Model training and research)

## 🚀 Key Features

* **Network Overview Dashboard**: Real-time visualization of network health scores, IRI (International Roughness Index) predictions, and critical road segments.
* **Physics-Informed Insights**: Visualizes model loss curves (Train, Val, and Physics loss) to monitor GNN performance.
* **Predictive Maintenance**: Identifies roads requiring immediate, high, or medium urgency repairs.
* **Budget & Forecast**: Dynamic computation of total repair costs and actionable road segments based on live backend data.

## 🛠 Tech Stack

* **Framework**: React 18 with TypeScript
* **Build Tool**: Vite
* **Styling**: Tailwind CSS & PostCSS
* **Charts**: Chart.js
* **Maps**: Leaflet
* **Database Integration**: Supabase JS

## 🚦 Getting Started

### Prerequisites
The frontend expects a local FastAPI backend running at `http://localhost:8000` to fetch road segments and training history.

### Installation
1. Clone the repository: `https://github.com/maisha-imran/DigitalTwin-Frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📜 Scripts
* `npm run dev`: Starts the Vite development server.
* `npm run build`: Builds the application for production.
* `npm run lint`: Runs ESLint for code quality.
* `npm run typecheck`: Runs TypeScript compiler checks.
