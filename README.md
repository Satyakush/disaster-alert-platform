# disaster-alert-platform

MERN-based disaster alert & management system with ML-assisted risk scoring.

A full-stack Disaster Alert Platform built using the MERN Stack, extended with geospatial intelligence and designed to be ML-ready for region-based risk analysis. This project demonstrates clean architecture, role-based access, real-time CRUD operations, and map-driven region selection — making it suitable for final-year projects, interviews, and production demos.

---

## 🚀 Features

### ✅ Core (Completed)
- 🔐 JWT Authentication (Login / Register)
- 👥 Role-based access (Admin, User)
- 🛡 Protected routes (Frontend + Backend)
- 📢 Alert Management (Create, Read, Update, Delete)
- ⏱️ Timestamps (createdAt, updatedAt)
- 🔄 Instant UI updates (No refresh needed)

---

### 🗺 Geo Intelligence (Completed)
- 🌍 Interactive Map (OpenStreetMap + Leaflet)
- 🔍 Search any location (City / Area)
- 🎯 Region selection (Click + Adjustable radius)



## 🧱 Tech Stack

### Frontend
- React (Vite)
- React Router
- Tailwind CSS
- Axios
- Leaflet (Maps & Geospatial features)

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Role-based Authorization (Middleware)

### Machine Learning (Planned)
- Python (Flask / FastAPI)
- Scikit-learn / TensorFlow
- Geospatial datasets
- REST-based integration with backend



## ▶️ How to Run Locally

### Prerequisites

- Node.js (v18 or later)
- npm
- MongoDB (Local or Atlas)

### Backend Setup

- cd server
- npm install
- npm run dev

### Frontend Setup

- cd client
- npm install
- npm run dev

### Python setup

- cd ml-service
- python -m venv .venv
- .\.venv\Scripts\activate
- python -m pip install --upgrade pip
- python -m pip install -r requirements.txt
- python -m uvicorn main:app --reload --port 8000
