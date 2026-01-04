# disaster-alert-platform
MERN-based disaster alert &amp; management system with ML-assisted risk scoring.


# Disaster Alert & Management Platform

A MERN-based disaster alert and management system designed to provide
location-based alerts, risk visualization, and real-time updates.
The system uses minimal ML-assisted risk scoring and focuses primarily
on backend engineering, frontend dashboards, and system design.

---

## 📖 Project Overview

Natural disasters often cause damage due to delayed or generic alerts.
This project aims to build a centralized platform where users receive
area-specific disaster alerts, while authorities can manage and monitor
alerts through an admin dashboard.

The core focus of this project is **MERN stack development, real-time
communication, and scalable system architecture**, with Machine Learning
used only where prediction is strictly required.

---

## 🎯 Objectives

- Provide location-based disaster alerts
- Enable real-time alert broadcasting
- Visualize disaster-prone areas on a map
- Maintain alert history and audit logs
- Demonstrate scalable MERN architecture

---

## 🧱 Tech Stack

### Frontend
- React.js
- Context API / Redux
- Leaflet / Google Maps API
- Chart.js / Recharts

### Backend
- Node.js
- Express.js
- MongoDB (with GeoSpatial indexing)
- Socket.io
- JWT Authentication

### Machine Learning (Minimal & Supportive)
- Python
- Logistic Regression / Random Forest
- Risk classification: Low / Medium / High

### Cloud & DevOps
- MongoDB Atlas
- Render / Railway / AWS (deployment)
- GitHub (version control & collaboration)

---

## 🗂️ Folder Structure

disaster-alert-platform/
│
├── client/ # React frontend
├── server/ # Node + Express backend
├── ml-service/ # Minimal ML service
├── docs/ # Documentation & reports
├── .env.example
└── README.md



---

## 🏗️ System Architecture

The system follows a layered architecture:

1. React frontend communicates with backend REST APIs
2. Backend manages authentication, alerts, and business logic
3. MongoDB stores users, alerts, and geospatial data
4. ML service provides risk scoring when required
5. Socket.io enables real-time alert delivery

Detailed diagrams and explanations are available in the `/docs` folder.

---

## 👥 Team & Roles

**Organization:** SNS@2026

- **Satyam Kushwaha** – Lead Engineer & System Architect  
  - System architecture design  
  - Backend implementation  
  - ML integration  
  - Final integration and deployment  

- **Member 1** – Backend Support Contributor  
  - API drafts  
  - Schema suggestions  

- **Member 2** – Frontend Support Contributor  
  - UI components  
  - Dashboard layouts  

All contributions are reviewed, refined, and integrated by the Lead Engineer.

---

## 🔁 Git Workflow

- `main` → Stable, submission-ready branch
- `develop` → Active development branch
- `feature/*` → Contributor feature branches

Rules:
- No direct push to `main`
- All changes via Pull Requests
- At least one review required before merge

---

## 🚀 How to Run Locally

### Backend -
```bash
cd server
npm install
npm run dev

### Frontend -
cd client
npm install
npm start



