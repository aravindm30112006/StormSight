import numpy as np
import math
from datetime import datetime, timedelta, timezone

class IndiaStormSimulator:
    def __init__(self):
        self.rows = 64
        self.cols = 64
        self.lat_min = 6.0
        self.lat_max = 38.0
        self.lon_min = 67.0
        self.lon_max = 98.0
        self.time = datetime.now(timezone.utc)
        
        self.cells = []
        self._init_cells()
        
    # India's comprehensive thunderstorm-prone regions covering all zones
    STORM_REGIONS = [
        # (region_name, lat, lon, typical_motion_dir, typical_speed)
        ("Odisha Coast",        20.5,  85.3,  270, 42),
        ("Bihar-Jharkhand",     25.6,  85.1,  290, 30),
        ("West Bengal",         22.6,  88.4,  260, 48),
        ("Assam-Meghalaya",     25.7,  91.5,  260, 44),
        ("Vidarbha / MP",       20.9,  78.6,  275, 34),
        ("Chhattisgarh",        21.3,  81.7,  280, 28),
        ("Telangana-Deccan",    17.9,  79.5,  285, 26),
        ("Delhi-NCR & West UP", 28.6,  77.2,  275, 32),
        ("Punjab-Foothills",    31.3,  75.8,  265, 30),
        ("East UP - Varanasi",  25.8,  83.1,  280, 33),
        ("Gujarat - Saurashtra",22.8,  71.9,  260, 24),
        ("Konkan-Mumbai Coast", 19.3,  73.1,  270, 30),
        ("Karnataka Interior",  13.2,  76.9,  280, 22),
        ("Tamil Nadu - Cauvery",11.5,  79.2,  290, 25),
        ("Kerala Western Ghats",10.1,  76.8,  275, 28),
        ("Andhra Coast",        17.7,  83.3,  280, 36),
    ]

    def _init_cells(self):
        """
        Spawn 14 storm cells covering all meteorological zones across India.
        """
        import random
        rng = random.Random(42)

        self._next_id = 15

        region_configs = [
            # lat,   lon,  dbz,  radius, speed, dir, growth
            (20.5,  85.3,  58.0, 30.0,  42,  272,  0.3),   # Odisha Coast
            (25.6,  85.1,  48.0, 24.0,  28,  288, -0.1),   # Bihar
            (22.6,  88.4,  64.0, 40.0,  48,  258,  0.2),   # West Bengal
            (25.7,  91.5,  62.0, 44.0,  44,  262,  0.1),   # Assam-Meghalaya
            (20.9,  78.6,  53.0, 32.0,  34,  276,  0.25),  # Vidarbha
            (21.3,  81.7,  45.0, 22.0,  26,  280, -0.15),  # Chhattisgarh
            (17.9,  79.5,  51.0, 26.0,  26,  283,  0.15),  # Telangana
            (28.6,  77.2,  56.0, 34.0,  32,  275,  0.2),   # Delhi-NCR
            (31.3,  75.8,  49.0, 25.0,  30,  265, -0.1),   # Punjab
            (25.8,  83.1,  54.0, 28.0,  33,  280,  0.1),   # East UP
            (22.8,  71.9,  42.0, 20.0,  24,  260, -0.2),   # Gujarat
            (19.3,  73.1,  59.0, 36.0,  30,  270,  0.3),   # Konkan-Mumbai
            (13.2,  76.9,  47.0, 24.0,  22,  280,  0.1),   # Karnataka
            (11.5,  79.2,  50.0, 26.0,  25,  290,  0.2),   # Tamil Nadu
        ]

        self.cells = []
        for i, (lat, lon, dbz, radius, speed, direction, growth) in enumerate(region_configs, start=1):
            jitter_lat = rng.uniform(-0.3, 0.3)
            jitter_lon = rng.uniform(-0.3, 0.3)
            self.cells.append({
                "id": f"SC{i:03d}",
                "lat": lat + jitter_lat,
                "lon": lon + jitter_lon,
                "intensity_dbz": dbz + rng.uniform(-2, 2),
                "radius_km": radius + rng.uniform(-2, 2),
                "motion_speed_kmh": float(speed),
                "motion_dir_deg": float(direction + rng.uniform(-5, 5)),
                "growth_rate": growth,
                "age_steps": 0,
            })

    def _spawn_random_cell(self):
        """Occasionally spawn a new storm cell at a random hotspot."""
        import random
        rng = random.Random()
        region = random.choice(self.STORM_REGIONS)
        _, base_lat, base_lon, direction, speed = region
        self._next_id += 1
        return {
            "id": f"SC{self._next_id:03d}",
            "lat": base_lat + rng.uniform(-1.5, 1.5),
            "lon": base_lon + rng.uniform(-1.5, 1.5),
            "intensity_dbz": rng.uniform(30, 55),
            "radius_km": rng.uniform(12, 30),
            "motion_speed_kmh": float(speed + rng.uniform(-8, 8)),
            "motion_dir_deg": float(direction + rng.uniform(-10, 10)),
            "growth_rate": rng.uniform(0.2, 0.6),
            "age_steps": 0,
            "max_age": rng.randint(150, 400),
        }

    def step(self):
        self.time += timedelta(seconds=10)
        for i, cell in enumerate(self.cells):
            dist = cell["motion_speed_kmh"] * (1/12.0)
            dlat = (dist * math.cos(math.radians(cell["motion_dir_deg"]))) / 111.0
            dlon = (dist * math.sin(math.radians(cell["motion_dir_deg"]))) / (111.0 * math.cos(math.radians(cell["lat"])))
            
            cell["lat"] += dlat
            cell["lon"] += dlon
            cell["intensity_dbz"] += cell["growth_rate"]
            cell["intensity_dbz"] = max(20.0, min(70.0, cell["intensity_dbz"]))
            cell["age_steps"] = cell.get("age_steps", 0) + 1

            # Check if cell drifted outside India or died down
            if (cell["lat"] < 8.0 or cell["lat"] > 35.0 or 
                cell["lon"] < 68.0 or cell["lon"] > 96.0 or 
                cell["age_steps"] > cell.get("max_age", 400)):
                # Respawn at a hotspot
                self.cells[i] = self._spawn_random_cell()
            
    def get_current_grid(self):
        grid = np.zeros((self.rows, self.cols))
        lats = np.linspace(self.lat_max, self.lat_min, self.rows)
        lons = np.linspace(self.lon_min, self.lon_max, self.cols)
        lon_grid, lat_grid = np.meshgrid(lons, lats)
        
        for cell in self.cells:
            dlat = lat_grid - cell["lat"]
            dlon = (lon_grid - cell["lon"]) * math.cos(math.radians(cell["lat"]))
            dist_sq = (dlat*111)**2 + (dlon*111)**2
            sigma_sq = (cell["radius_km"] / 2.0)**2
            intensity = cell["intensity_dbz"] * np.exp(-dist_sq / (2 * sigma_sq))
            grid = np.maximum(grid, intensity)
        return grid
        
    def get_forecast_frames(self, lead_times_min):
        frames = []
        for lead in lead_times_min:
            grid = np.zeros((self.rows, self.cols))
            lats = np.linspace(self.lat_max, self.lat_min, self.rows)
            lons = np.linspace(self.lon_min, self.lon_max, self.cols)
            lon_grid, lat_grid = np.meshgrid(lons, lats)
            confidence = max(0.0, 1.0 - (lead / 300.0))
            
            for cell in self.cells:
                dist = cell["motion_speed_kmh"] * (lead / 60.0)
                flat = cell["lat"] + (dist * math.cos(math.radians(cell["motion_dir_deg"]))) / 111.0
                flon = cell["lon"] + (dist * math.sin(math.radians(cell["motion_dir_deg"]))) / (111.0 * math.cos(math.radians(cell["lat"])))
                
                dlat = lat_grid - flat
                dlon = (lon_grid - flon) * math.cos(math.radians(flat))
                dist_sq = (dlat*111)**2 + (dlon*111)**2
                sigma_sq = (cell["radius_km"] / 2.0)**2
                
                intensity = cell["intensity_dbz"] * np.exp(-dist_sq / (2 * sigma_sq))
                grid = np.maximum(grid, intensity)
                
            frames.append({
                "lead_minutes": lead,
                "reflectivity": grid.tolist(),
                "confidence": confidence
            })
        return frames

    def get_lightning(self):
        strikes = []
        for cell in self.cells:
            if cell["intensity_dbz"] > 45:
                num_strikes = int((cell["intensity_dbz"] - 45) / 2)
                for _ in range(num_strikes):
                    r_offset = (np.random.random() - 0.5) * (cell["radius_km"]/111.0)
                    c_offset = (np.random.random() - 0.5) * (cell["radius_km"]/111.0)
                    strikes.append({
                        "lat": cell["lat"] + r_offset,
                        "lon": cell["lon"] + c_offset,
                        "intensity": np.random.random(),
                        "polarity": "negative" if np.random.random() > 0.2 else "positive",
                        "age_seconds": int(np.random.random() * 10)
                    })
        return strikes
        
    def get_current_state(self):
        return {
            "type": "nowcast_update",
            "timestamp": self.time.isoformat(),
            "current_frame": {
                "reflectivity": self.get_current_grid().tolist(),
                "lat_min": self.lat_min,
                "lat_max": self.lat_max,
                "lon_min": self.lon_min,
                "lon_max": self.lon_max,
                "rows": self.rows,
                "cols": self.cols
            },
            "forecast_frames": self.get_forecast_frames([30, 60, 90, 120, 180]),
            "storm_cells": [
                {
                    "id": c["id"],
                    "lat": round(c["lat"], 2), "lon": round(c["lon"], 2),
                    "intensity_dbz": round(c["intensity_dbz"], 1),
                    "radius_km": round(c["radius_km"], 1),
                    "motion_speed_kmh": round(c["motion_speed_kmh"], 1),
                    "motion_dir_deg": round(c["motion_dir_deg"], 1),
                    "severity": "Extreme" if c["intensity_dbz"] >= 58 else ("Severe" if c["intensity_dbz"] >= 46 else "Moderate"),
                    "predicted_path": [
                        {
                            "lat": round(c["lat"] + (c["motion_speed_kmh"] * (t/60.0) * math.cos(math.radians(c["motion_dir_deg"]))) / 111.0, 2),
                            "lon": round(c["lon"] + (c["motion_speed_kmh"] * (t/60.0) * math.sin(math.radians(c["motion_dir_deg"]))) / (111.0 * math.cos(math.radians(c["lat"]))), 2),
                            "time_min": t
                        } for t in [30, 60, 90]
                    ]
                } for c in self.cells
            ],
            "lightning": self.get_lightning(),
            "metrics": {
                "pod": 0.82, "far": 0.18, "csi": 0.69,
                "lead_30_skill": 0.91, "lead_60_skill": 0.84,
                "lead_90_skill": 0.76, "model": "ConvLSTM+Earthformer Ensemble"
            },
            "data_sources": {
                "radar": {"status": "active", "last_update": self.time.isoformat(), "stations": 25},
                "satellite": {"status": "active", "last_update": self.time.isoformat(), "channel": "INSAT-3D IR"},
                "lightning": {"status": "active", "last_update": self.time.isoformat(), "strikes_last_hour": len(self.get_lightning()) * 360},
                "nwp": {"status": "active", "last_update": self.time.isoformat(), "model": "NCUM"}
            }
        }
