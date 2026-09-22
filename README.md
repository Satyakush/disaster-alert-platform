# 🚨 Disaster Intelligence & Early Warning Platform

A full-stack disaster operations platform combining **MERN, FastAPI, geospatial intelligence, real-time alerts, evacuation routing and explainable risk assessment**.

**Detect → Assess Risk → Alert → Recommend Action → Coordinate Response → Analyze Outcomes**

## 🎯 What It Solves

Emergency information is often fragmented across alerts, maps, reports, shelters, responders and resources. This platform brings those workflows into one operational system.

**Roles:** Citizen · Responder · Admin

## ✨ Key Features

- Multi-hazard alert management with lifecycle and severity controls.
- Explainable risk scoring from 0–100 with factor contributions.
- Interactive Leaflet/OpenStreetMap maps and MongoDB geospatial queries.
- Citizen incident reporting and admin verification.
- Shelter discovery and OSRM-based evacuation routing.
- Responder assignment and response-task lifecycle.
- Resource and critical-infrastructure management.
- Real-time Socket.IO alert and task updates.
- Historical analytics for alerts, reports, response and risk.

## 🏗️ Architecture

```text
React + Vite + Tailwind
        │ REST / Socket.IO
        ▼
Node.js + Express
     │           │
     ▼           ▼
MongoDB      FastAPI
Atlas        Risk Service
     │           │
     └─────┬─────┘
           ▼
   Disaster Operations
```

## 🧰 Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express, Mongoose, JWT, Socket.IO |
| Database | MongoDB Atlas + `2dsphere` indexes |
| Intelligence | Python, FastAPI, Pydantic |
| Maps | Leaflet, OpenStreetMap, Nominatim, OSRM |

## 📁 Structure

```text
client/       React frontend
server/       Node/Express API
ml-service/   FastAPI risk intelligence
README.md
```

## 🧠 Risk Model

The current intelligence service uses an **explainable weighted scoring model**:

| Factor | Weight |
|---|---:|
| Hazard intensity | 30% |
| Hazard probability | 20% |
| Exposure | 20% |
| Vulnerability | 20% |
| Historical risk | 10% |

The score is normalized to 0–100 and classified as low, medium, high or critical.

## 🔐 Security

- JWT authentication and role-based authorization.
- Backend resource ownership/assignment checks.
- Protected frontend routes and APIs.
- Environment variables for secrets and service configuration.

## ⚙️ Local Development

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

### FastAPI Service
```bash
cd ml-service
python -m venv .venv
.\.venv\Scripts\activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Environment Variables
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
ML_SERVICE_URL=http://localhost:8000
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🔎 Engineering Highlights

- REST + Socket.IO real-time communication.
- MongoDB geospatial operations.
- Explainable risk scoring.
- Hazard-aware evacuation routing.
- Separation of frontend, backend and intelligence services.

## ⚠️ Scope

This is a decision-support software project. Its risk engine, routing and notifications do not replace official emergency warnings, evacuation orders, emergency services or local authority instructions.

## 👨‍💻 Author

**Satyam Kushwaha** · [GitHub](https://github.com/Satyakush) · [Portfolio](https://satyakush.github.io/Portfolio/)