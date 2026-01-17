# disaster-alert-platform
MERN-based disaster alert &amp; management system with ML-assisted risk scoring.

A full-stack Disaster Alert Platform built using MERN Stack, extended with geospatial intelligence and designed to be ML-ready for region-based risk analysis.
This project demonstrates clean architecture, role-based access, real-time CRUD, and map-driven region selection, making it suitable for final-year projects, interviews, and production demos.
🚀 Features

✅ Core (Completed)
🔐 JWT Authentication (Login / Register)
👥 Role-based access (admin, user)
🛡️ Protected routes (frontend + backend)
📢 Alert Management (Create, Read, Update, Delete)
⏱️ Timestamps (createdAt, updatedAt)
🔄 Instant UI updates (no refresh needed)
🗺️ Geo Intelligence (Completed)
🌍 Interactive map (OpenStreetMap + Leaflet)
🔍 Search any location (city / area)
🎯 Region selection (click + adjustable radius)

📐 Captures geospatial payload:
{
  "lat": 22.71,
  "lng": 75.85,
  "radius": 5000
}


🤖 ML / AI (Planned & Ready)
Risk severity prediction per selected region
Flood / Fire / Heat risk models
NLP-based alert summarization
Historical risk analysis


🧱 Tech Stack

Frontend -
React (Vite)
React Router
Tailwind CSS
Axios
Leaflet (Map & Geo features)

Backend - 
Node.js
Express.js

MongoDB (Mongoose)
JWT Authentication
Role-based Middleware
ML (Next Phase)
Python (Flask / FastAPI)
Scikit-learn / TensorFlow
Geo-based datasets
REST integration with backend


📁 Project Structure

disaster-alert-platform/
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── utils/
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   └── config/
│
└── README.md

🔐 Roles & Permissions

Role
Permissions
user
View alerts, view risk regions
admin
Create, edit, delete alerts
Backend source of truth:
enum: ["user", "admin"]

Frontend rule:
const isAdmin = user?.role === "admin";

🗺️ Region Selection Logic (Step-2 Highlight)
Users can:
Search a location on map
Click to select center
Adjust radius via slider
Region data stored in React state
Ready to be sent to backend ML API
This is the bridge between MERN and ML.

🔄 Real-Time UI Sync-
Alerts update instantly after create/edit/delete
State is managed at Dashboard level
No page reloads
Backend remains single source of truth

🧪 API Overview-
Auth-
POST /api/auth/register
POST /api/auth/login

Alerts-
GET    /api/alerts
POST   /api/alerts        (admin)
PUT    /api/alerts/:id    (admin)
DELETE /api/alerts/:id    (admin)
(Planned)

POST /api/risk/analyze
🧠 ML Integration Plan (Future Scope)
Planned pipeline:

Frontend (Map Region)
        ↓
Backend (/api/risk/analyze)
        ↓
ML Service (Python)
        ↓
Risk Severity + Probability
Possible ML use cases:
Flood probability prediction
Fire risk estimation
Heatwave detection
NLP-based alert severity classification

▶️ How to Run Locally

Backend- 

cd server
npm install
npm run dev

Frontend-

cd client
npm install
npm run dev


📌 Why This Project Stands Out-

Not just CRUD — geo-driven intelligence
Clean separation of concerns
ML-ready architecture
Interview-grade explanations
Real-world relevance (disaster management)
📚 Future Enhancements
Polygon-based region selection
Historical risk heatmaps
Alert subscription & notifications
ML model deployment
Admin analytics dashboard
