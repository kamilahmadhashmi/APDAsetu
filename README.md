# ⚡ EMERGE | AEGIS-MESH Emergency Disaster Dispatch & Resilience System

[![System Status](https://img.shields.io/badge/System-Operational-10B981?style=for-the-badge&logo=shield)](https://github.com/)
[![Protocol](https://img.shields.io/badge/Protocol-BLE_Mesh_5.3-8B5CF6?style=for-the-badge&logo=bluetooth)](https://github.com/)
[![Vision](https://img.shields.io/badge/AI_Engine-YOLOv8_FP16-06B6D4?style=for-the-badge&logo=python)](https://github.com/)
[![Encryption](https://img.shields.io/badge/Security-AES--256--GCM-EF4444?style=for-the-badge&logo=lock)](https://github.com/)

**AEGIS-MESH** (EMERGE) is an advanced, offline-resilient emergency disaster dispatch and command-and-control platform designed for extreme flood and natural disaster scenarios. It combines real-time GIS spatial mapping, offline peer-to-peer Bluetooth Low Energy (BLE) mesh telemetry, computer vision target detection (YOLOv8), and automated multi-objective logistics route solvers.

---

## 📸 Overview & Product Layers

The repository includes both the **Command & Control Desktop Operations Center** and a **Standalone Smartphone Product Simulator**:

| Core Platform Tier | Purpose | Quick Reference |
| :--- | :--- | :--- |
| **Command Center (Main App)** | Full desktop dispatch dashboard for system administrators, NDRF rescue teams, and emergency dispatchers. | [index.html](file:///C:/Users/KIIT/.gemini/antigravity/scratch/aegis-disaster-response/index.html) |
| **Smartphone Simulator** | Standalone mobile demonstration layer showcasing the product running inside a realistic 3D smartphone chassis. | [simulation/index.html](file:///C:/Users/KIIT/.gemini/antigravity/scratch/aegis-disaster-response/simulation/index.html) |

---

## 🌟 Key Features

### 1. 🗺️ Real-Time GIS Command Center & Flood Surge Engine
- **Interactive Spatial Map**: Powered by Leaflet.js, rendering live incident locations (P1 Critical, P2 Urgent, P3 Normal), hospital occupancy capacity, and rescue fleet assets (Rescue Boats, Choppers, Amphibious Vehicles, Pumper Trucks, Mobile Generators).
- **Rising Flood Surge Simulator**: Dynamic water level tracking (+0.4m/hr velocity), synthetic aperture radar (SAR) flood extent overlays, and route hazard monitoring.
- **Hospital & Fleet Operations**: Real-time bed occupancy tracking (Apex Trauma Center, St. Jude Relief Hub, NDRF Mobile Field Hospital).

### 2. 👁️ AI / YOLOv8 Computer Vision Pipeline
- **Multi-Source Aerial Ingestion**: Processes feeds from Aerial Drones (Sector B4), Sentinel-2 SAR Satellite imagery, and FLIR Night Thermal Infrared camera streams.
- **Survivor & Asset Detection**: Real-time bounding boxes, segmentation masks, confidence thresholds, and spatial coordinate mapping for stranded victims and submerged vehicles.

### 3. 📡 Offline Peer BLE Mesh Network Protocol
- **Cellular Blackout Mode**: Operates seamlessly when cellular and internet infrastructure collapses during severe flooding.
- **Peer-to-Peer Telemetry Broadcast**: Relays encrypted emergency distress packets over multi-hop BLE 5.3, Wi-Fi Direct, and LoRa gateways.
- **AES-256-GCM Encryption**: Secure telemetry payload transmission with hop-by-hop ACK confirmation.

### 4. 🧮 Logistics Dispatch Routing Solver
- **Multi-Objective Optimization**: Computes optimal evacuation corridors and resource distribution routes.
- **Hazard Avoidance**: Dynamically recalculates pathing around flooded roads, submerged bridges, and structural collapse zones.

### 5. 🌐 Multi-Language Support (i18n)
- Native internationalization engine supporting **English**, **Hindi (हिंदी)**, and **Odia (ଓଡ଼ିଆ)** across all UI views and emergency alerts.

### 6. 📱 Standalone Smartphone Simulator (`/simulation`)
- Recreates the mobile user experience inside a responsive 3D smartphone bezel complete with dynamic island notch, live status bar clock, mobile navigation, and interactive emergency SOS workflow.

---

## 📁 Project Architecture & File Structure

```
aegis-disaster-response/
├── index.html                   # Main Command & Control Center entry point
├── vercel.json                  # Vercel deployment & API rewrite config
├── requirements.txt             # Python dependencies (FastAPI, Uvicorn, etc.)
│
├── src/                         # Frontend application source
│   ├── app.js                   # Main application initialization & tab router
│   ├── i18n.js                  # Multi-language translations (EN, HI, OR)
│   ├── modals.js                # System prompts & Emergency SOS modal handlers
│   ├── components/
│   │   ├── gis-map.js           # Interactive GIS Command map & flood surge engine
│   │   ├── ai-vision.js         # YOLOv8 Computer Vision feed processor
│   │   ├── mesh-network.js      # Offline BLE Mesh relay & ping visualizer
│   │   ├── routing-solver.js    # Logistics routing solver & comparison engine
│   │   └── architecture.js      # System architecture & data flow pipeline
│   ├── services/
│   │   ├── flood-prediction.js  # Hydrological flood surge calculation engine
│   │   └── weather-ingress.js   # Live weather data ingress service
│   └── styles/
│       └── main.css             # Main styling & Tailwind custom design system
│
├── backend/                     # Python FastAPI Backend
│   ├── main.py                  # FastAPI application entry point & CORS configuration
│   ├── test_backend.py          # Backend test suite
│   └── app/
│       ├── api/
│       │   └── endpoints.py     # API endpoints for telemetry, vision, & solver
│       ├── models/
│       │   └── schemas.py       # Pydantic data schemas
│       └── services/
│           ├── mesh_engine.py   # BLE Mesh packet encryption & relay service
│           ├── routing_engine.py# Route optimization solver
│           ├── vision_engine.py # YOLOv8 inference wrapper
│           └── weather_engine.py# Hydrological forecasting core
│
├── api/
│   └── index.py                 # Vercel serverless entry point handler
│
└── simulation/                  # Standalone Smartphone Simulator Website
    ├── index.html               # Smartphone presentation shell & 3D device frame
    ├── css/
    │   └── smartphone.css       # Smartphone chassis styling & custom keyframe animations
    └── js/
        ├── app.js               # Mobile simulator application coordinator
        ├── i18n-sim.js          # Simulator multi-language translation engine
        ├── modals/
        │   └── sos.js           # Smartphone Emergency SOS distress modal
        └── views/
            ├── splash.js        # Boot splash & role onboarding screen
            ├── dashboard.js     # Mobile disaster dashboard view
            ├── map.js           # Mobile Leaflet GIS map view
            ├── vision.js        # Mobile AI field camera scanner
            ├── mesh.js          # Mobile BLE mesh communicator
            └── routing.js       # Evacuation route & shelter finder
```

---

## ⚡ Getting Started

### Prerequisites
- Modern Web Browser (Chrome, Firefox, Edge, Safari)
- Python 3.9+ (optional, for backend API server)

### 1. Launching the Main Operations Center
Simply open [index.html](file:///C:/Users/KIIT/.gemini/antigravity/scratch/aegis-disaster-response/index.html) directly in your browser, or serve it using Python:

```bash
# Serve main project from root
python -m http.server 8080
```
Then navigate to `http://localhost:8080`.

### 2. Launching the Smartphone Simulator
To run the standalone smartphone presentation demo:

```bash
# Serve simulator directory
python -m http.server 8085 --directory simulation
```
Then navigate to `http://localhost:8085`.

### 3. Running the FastAPI Backend Server
To run the Python backend API services locally:

```bash
# Install backend dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn backend.main:app --reload --port 8000
```
The API documentation will be available at `http://localhost:8000/docs`.

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Gateway health check & latency metrics |
| `GET` | `/api/incidents` | Fetch active emergency incidents & distress packets |
| `POST` | `/api/sos` | Transmit encrypted BLE Mesh SOS distress telemetry packet |
| `GET` | `/api/fleet` | Get live positions & status of rescue fleet vehicles |
| `GET` | `/api/hospitals` | Retrieve emergency shelter & trauma hospital capacities |
| `POST` | `/api/solve-routes` | Compute multi-objective evacuation routes avoiding hazards |

---

## 🛡️ Security & Resilience Specifications
- **Data Encryption**: AES-256-GCM symmetric encryption for all mesh packets.
- **Failover Architecture**: Automatic seamless failover from Cellular/FastAPI gateway $\rightarrow$ BLE Mesh Peer Relay upon network degradation.
- **Zero Modification Guarantee**: The `/simulation` directory is fully isolated, ensuring zero side effects on the core command platform.

---

## 📄 License & Acknowledgments
Created for **EMERGE / AEGIS Disaster Response Framework**. Built with Leaflet, Tailwind CSS, Lucide Icons, Material Symbols, and FastAPI.
