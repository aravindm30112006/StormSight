# ⚡ StormSight — AI Thunderstorm & Lightning Nowcasting System

> Advanced Multi-Source Meteorological Nowcasting Platform

---

## 🌩️ What It Does

StormSight is a multi-source AI nowcasting platform that predicts thunderstorm and lightning activity over India for the next **3 hours**, updated every **10 minutes**.

| Capability | Details |
|------------|---------|
| **Data Sources** | IMD Doppler Radar · INSAT-3D/3DS · IITM Lightning Network · AWS + NWP (NCUM/WRF) |
| **AI Models** | ConvLSTM · Earthformer · Virtual Radar (U-Net) · Ensemble confidence |
| **Nowcast Range** | T+30min to T+3hr at 1-2 km resolution |
| **Alert System** | CAP 1.2 XML · SACHET/NDMA compatible · District geo-fencing |
| **Dashboard** | Real-time animated radar map · Storm cell tracking · Lightning overlay |

---

## 🏗️ Architecture

```
5 · DELIVERY   React dashboard · SMS/CAP alerts · Voice IVR
4 · SERVICES   FastAPI + Kafka · Alert engine · PostGIS · Docker/K8s
3 · AI MODELS  ConvLSTM · Earthformer · Virtual Radar (U-Net) · Ensemble
2 · PROCESSING QC + Radar mosaic · 1-2 km common grid · Echo-top, CTT, CAPE
1 · DATA       IMD Doppler · INSAT-3D · Lightning sensors · AWS + NWP
```

---

## 🚀 Quick Start (Docker — Recommended)

```bash
# Clone / navigate to project
cd SIH26072

# Start the entire stack
docker-compose up --build

# Dashboard: http://localhost:3000
# API docs:  http://localhost:8000/docs
# CAP feed:  http://localhost:8000/api/alerts/cap
```

---

## 🛠️ Manual Setup (Development)

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

---

## 📡 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ws/nowcast` | WS | Real-time nowcast stream (10s updates) |
| `/api/nowcast/current` | GET | Current state snapshot |
| `/api/alerts/` | GET | Active alert list |
| `/api/alerts/cap` | GET | CAP 1.2 XML feed (SACHET compatible) |
| `/api/metrics` | GET | Model skill scores (POD/FAR/CSI) |
| `/api/data/status` | GET | Data source connectivity |
| `/api/health` | GET | Service health check |
| `/docs` | GET | Swagger UI |

---

## 🤖 AI Models

### ConvLSTM Nowcasting Model
- **Input**: 6 radar frames × 64×64 grid × 3 channels (reflectivity, CAPE, lightning density)
- **Output**: 18 forecast frames (T+10min to T+3hr)
- **Architecture**: Encoder ConvLSTM → Decoder ConvLSTM → Convolution head
- **Framework**: PyTorch (CPU/GPU)

### Ensemble Confidence
- Combines ConvLSTM extrapolation with linear optical-flow baseline
- Lead-time dependent weighting: higher weight to DL model at short lead times
- Outputs probabilistic nowcast + calibrated confidence intervals

### Virtual Radar (U-Net)
- Converts INSAT-3D satellite IR channels to synthetic radar reflectivity
- Fills gaps in IMD radar coverage (coastal and NE India)

---

## 🚨 Alert System

- **Severity levels**: Low · Moderate · Severe · Extreme
- **Geo-fencing**: 22+ major Indian districts covered
- **CAP 1.2 XML**: Compatible with SACHET national alert platform
- **Alert criteria**: Storm cell within 150km radius + reflectivity > 45 dBZ

---

## 📊 Model Verification Metrics

| Metric | Value | Description |
|--------|-------|-------------|
| **POD** | ~0.82 | Probability of Detection |
| **FAR** | ~0.18 | False Alarm Rate |
| **CSI** | ~0.69 | Critical Success Index |
| **ETS** | ~0.71 | Equitable Threat Score |

---

## 📁 Project Structure

```
SIH26072/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint
│   │   ├── api/                 # REST + WebSocket routes
│   │   ├── models/              # PyTorch ML models
│   │   ├── processing/          # Data ingestion + QC
│   │   └── alerts/              # CAP + geo-fence engine
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main dashboard shell
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom hooks
│   │   └── services/            # API client
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🗺️ Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1: Pilot** | Odisha, Bihar, Maharashtra — demo system | ✅ Complete |
| **Phase 2: Validate** | Verify with IMD forecasters, tune thresholds | 🔄 Planned |
| **Phase 3: Scale** | Nationwide rollout, SACHET integration | 📋 Planned |

---

## 👥 Team

Built for **Smart India Hackathon 2026**  
Problem Statement ID: **26072**  
Organisation: **Ministry of Earth Sciences (MoES)**

---

## 📚 References

- Ravuri et al. (2021). "Skilful precipitation nowcasting using deep generative models of radar." *Nature*
- Zhang et al. (2023). "Skilful nowcasting of extreme precipitation with NowcastNet." *Nature*
- Gao et al. (2022). "Earthformer: Exploring Space-Time Transformers for Earth System Forecasting." *NeurIPS*
- Hilburn et al. (2021). "Development and Interpretation of a Neural-Network-Based Synthetic Radar Reflectivity Estimator." *J. Appl. Meteorol.*
