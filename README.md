# Disaster Intelligence & Early Warning Platform

A full-stack, AI-assisted disaster intelligence platform built with MERN, FastAPI, MongoDB geospatial data, Leaflet, Socket.IO, and OSRM routing.

The platform follows an operational workflow:

**Detect → Assess Risk → Predict → Alert → Recommend Action → Track Response**

## Features

### Authentication & Security

- JWT authentication
- Public registration creates citizen accounts only
- Role-based access for `user`, `responder`, and `admin`
- Protected frontend routes and backend APIs
- Admin-controlled responder promotion and revocation
- Response-task ownership enforcement

### Multi-Hazard Early Warning

- Flood
- Cyclone
- Earthquake
- Wildfire
- Heatwave
- Storm
- Landslide
- Tsunami
- Industrial hazard
- Other

### Alert Intelligence

- Structured disaster alerts
- Severity: low, medium, high, critical
- Lifecycle: draft → active → escalated → resolved → archived
- Urgency and certainty classification
- Alert radius and GeoJSON coordinates
- Emergency instructions
- Estimated population, household, infrastructure, road, shelter, and damage impact
- Actual outcome recording for post-incident evaluation
- Real-time Socket.IO alert updates
- AI risk assessment attached to published alerts

### Multi-Hazard Risk Intelligence

- Interactive map-driven region selection
- Hazard scenario selection
- Hazard intensity and probability
- Population exposure
- Vulnerability
- Historical risk
- Weighted risk score from 0–100
- Risk levels: low, medium, high, critical
- Model confidence
- Explainable factor contributions and weights
- Hazard-specific recommended actions
- FastAPI risk intelligence service
- Risk assessment available before publishing an alert

### Notifications

- Live in-app emergency notification center
- Real-time alert and status-change notifications
- Critical/high browser notification support
- Draft alerts are excluded from citizen emergency notifications

### Geospatial Intelligence

- OpenStreetMap + Leaflet
- Location search
- Click-to-select risk regions
- Adjustable risk radius
- Active hazard zones
- Citizen report locations
- Shelter locations
- Critical infrastructure locations
- Evacuation route visualization

### Citizen Reporting

- Citizen incident reporting
- Location coordinates
- Disaster type and priority
- Description and optional media URL
- Verification workflow
- Admin approval/rejection
- Verified reports can be converted into live alerts
- Duplicate alert conversion prevention

### Evacuation Intelligence

- Nearest shelter discovery using MongoDB geospatial queries
- Shelter capacity and availability
- Disaster-specific evacuation guidance
- OSRM driving routes
- Multiple route alternatives
- Hazard-aware route evaluation
- Active hazard exposure scoring
- Hazard warnings and evacuation advisories

### Response Operations

- Admin-controlled responder team
- Responder promotion/revocation
- Incident-to-responder assignment
- Response task lifecycle
- Acknowledge, start, complete, or cancel assignments
- Responder dashboard
- Admin-wide operations view
- Real-time task updates
- Active-assignment protection during responder revocation

### Resource Management

- Ambulances
- Fire trucks
- Rescue teams
- Police units
- Medical teams
- Boats
- Helicopters
- Food and water supplies
- Shelter capacity resources
- Resource availability/deployment tracking
- Responder and alert assignment

### Critical Infrastructure

- Hospitals
- Schools
- Police stations
- Fire stations
- Power facilities
- Water facilities
- Telecom facilities
- Government facilities
- Bridges
- Operational/damaged/limited/closed status
- Geospatial mapping on the intelligence dashboard

### Historical Analytics

- Alert totals and active/resolved counts
- Disaster-type distribution
- Severity distribution
- Historical alert trends
- Citizen-report statistics
- Disaster hotspots
- Response-task statistics
- Risk-confidence analysis
- Prediction-vs-actual severity evaluation

## Architecture

```text
React + Vite + Tailwind
        |
        | REST / Socket.IO
        v
Node.js + Express
        |
        +--------------------+
        |                    |
        v                    v
MongoDB Atlas          FastAPI ML Service
Geospatial Data        Risk Intelligence
        |                    |
        +---------+----------+
                  |
                  v
          Disaster Operations
                  |
        +---------+---------+
        |         |         |
        v         v         v
     Alerts   Evacuation  Response
               Intelligence Operations
```

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- Axios
- Leaflet / React Leaflet
- Socket.IO Client
- Lucide React

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Socket.IO
- Axios

### ML / Intelligence

- Python
- FastAPI
- Pydantic
- Explainable weighted risk model

### Geospatial Services

- OpenStreetMap
- Nominatim geocoding
- OSRM routing
- MongoDB `2dsphere` indexes

## Project Structure

```text
server/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── app.js
│   └── server.js
└── package.json

client/
├── src/
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── pages/
│   └── App.jsx
└── package.json

ml-service/
├── main.py
├── requirements.txt
└── .venv/
```

## Local Setup

### 1. Backend

```text
cd server
npm install
npm run dev
```

Production-style start:

```text
npm start
```

### 2. Frontend

```text
cd client
npm install
npm run dev
```

Production build:

```text
npm run build
```

### 3. ML Service

```text
cd ml-service
python -m venv .venv
.\\.venv\\Scripts\\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

## Environment Variables

### Server

```text
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
ML_SERVICE_URL=http://localhost:8000
ROUTING_SERVICE_URL=https://router.project-osrm.org
```

### Client

```text
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Operational Roles

### Citizen (`user`)

- View disaster intelligence
- View alerts
- Run risk scenarios
- Find shelters and evacuation guidance
- Report incidents
- Receive live emergency notifications

### Responder (`responder`)

- View assigned response tasks
- Update task status
- View field resources
- Support emergency operations

### Administrator (`admin`)

- Create and manage alerts
- Assess and publish AI-assisted risk
- Manage shelters
- Verify citizen reports
- Promote responders
- Assign response tasks
- Manage resources
- Manage infrastructure
- Monitor operations and analytics

## Risk Model

The current intelligence service uses an explainable weighted model:

- Hazard intensity: 30%
- Hazard probability: 20%
- Exposure: 20%
- Vulnerability: 20%
- Historical risk: 10%

The resulting score is normalized to 0–100 and classified into low, medium, high, or critical risk.

## Important Note

The risk engine, notifications, and evacuation routing are decision-support features. They do not replace official emergency warnings, evacuation orders, emergency services, or local authority instructions.
