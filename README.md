<div align="center">

# 🚨 Disaster Intelligence & Early Warning Platform

### Detect · Assess · Predict · Alert · Respond

A production-oriented full-stack disaster operations platform combining **MERN, FastAPI, geospatial intelligence, real-time communication and explainable risk assessment**.

<p>
<a href="https://disaster-alert-platform.vercel.app/"><img src="https://img.shields.io/badge/Live%20Demo-2563eb?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"></a>
<a href="https://github.com/Satyakush/disaster-alert-platform"><img src="https://img.shields.io/badge/Source%20Code-111827?style=for-the-badge&logo=github&logoColor=white" alt="Source Code"></a>
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111827" alt="React">
<img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
<img src="https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
</p>

</div>

---

## 🌐 Live Platform

**[Launch Disaster Intelligence Platform →](https://disaster-alert-platform.vercel.app/)**

**Detect → Assess Risk → Predict → Alert → Recommend Action → Coordinate Response → Track**

> This is a decision-support software project. Its risk engine, routing and notifications do not replace official emergency warnings, evacuation orders, emergency services or local authority instructions.

---

## ✨ Core Capabilities

- 🗺️ Geospatial disaster intelligence
- 🤖 Explainable risk analysis
- 🌎 Live earthquake intelligence through USGS data
- 🚨 Real-time multi-hazard alerts
- 📍 Evacuation intelligence and safe-route visualization
- 🏥 Shelter and evacuation-center management
- 👥 Admin, Responder and Citizen workflows
- 📡 Socket.IO real-time updates
- 📝 Citizen incident reporting and verification
- 🏗️ Critical infrastructure monitoring
- 📊 Disaster and response analytics
- 🔐 JWT authentication and protected APIs

---

## 🧠 Risk Intelligence

The intelligence service combines an explainable weighted scoring engine with live external disaster signals.

| Risk Factor | Weight |
|---|---:|
| Hazard intensity | 30% |
| Hazard probability | 20% |
| Exposure | 20% |
| Vulnerability | 20% |
| Historical risk | 10% |

Scores are normalized to **0–100** and classified as **Low · Medium · High · Critical**.

---

## 🗺️ Geospatial Intelligence

- Leaflet + OpenStreetMap interactive maps
- MongoDB geospatial indexes
- Radius/location-based intelligence
- Shelter discovery
- Safe-route visualization
- OSRM-based evacuation routing
- Infrastructure and resource location management

---

## 🚨 Real-Time Operations

Socket.IO powers live operational updates including:

- New disaster alerts
- Alert lifecycle changes
- Incident reports and verification
- Response-task updates
- User/admin notification flows

---

## 👥 Platform Roles

| Role | Core Capabilities |
|---|---|
| 🧑 Citizen | View alerts, report incidents, discover shelters, access evacuation intelligence |
| 🚑 Responder | View assignments, manage response tasks, coordinate resources |
| 🛡️ Admin | Manage alerts, shelters, infrastructure, reports, responders and analytics |

---

## 🏗️ Architecture

~~~
                    ┌──────────────────────┐
                    │     React + Vite     │
                    │ Tailwind + Leaflet   │
                    └──────────┬───────────┘
                               │ REST / Socket.IO
                               ▼
                    ┌──────────────────────┐
                    │   Node.js + Express  │
                    │ Auth • APIs • Events │
                    └───────┬───────┬──────┘
                            │       │
                            ▼       ▼
                     ┌─────────┐  ┌──────────────┐
                     │ MongoDB │  │   FastAPI    │
                     │  Atlas  │  │ Risk Service │
                     └─────────┘  └──────────────┘
~~~

---

## 🧰 Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express.js, Mongoose |
| Authentication | JWT, Role-Based Authorization |
| Database | MongoDB Atlas, 2dsphere indexes |
| Intelligence | Python, FastAPI, Pydantic |
| Real-Time | Socket.IO |
| Maps | Leaflet, OpenStreetMap, Nominatim, OSRM |
| External Data | USGS Earthquake Feed |
| Deployment | Vercel, Render, MongoDB Atlas |

---

## 📁 Project Structure

~~~
disaster-alert-platform/
├── client/          React + Vite frontend
├── server/          Node.js + Express backend
├── ml-service/      FastAPI risk intelligence service
└── README.md
~~~

---

## 🔐 Security

- JWT-based authentication
- Role-based authorization
- Protected frontend routes
- Protected backend APIs
- Resource ownership and assignment checks
- Environment-based secret management
- Backend-enforced permissions

---

## ⚙️ Local Development

### Backend
~~~bash
cd server
npm install
npm run dev
~~~

### Frontend
~~~bash
cd client
npm install
npm run dev
~~~

### FastAPI Risk Service
~~~bash
cd ml-service
python -m venv .venv
.\\.venv\\Scripts\\activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
~~~

---

## 👨‍💻 Author

**Satyam Kushwaha**

[GitHub](https://github.com/Satyakush) · [Portfolio](https://satyakush.github.io/Portfolio/) · [LinkedIn](https://www.linkedin.com/in/satyam-kushwaha-06b7a5244)

<div align="center">

**Built to turn scattered disaster information into actionable intelligence.**

</div>
