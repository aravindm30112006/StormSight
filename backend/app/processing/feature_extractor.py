import numpy as np

class FeatureExtractor:
    @staticmethod
    def extract_echo_top(reflectivity_grid, threshold_dbz=18):
        echo_top = np.zeros_like(reflectivity_grid)
        mask = reflectivity_grid >= threshold_dbz
        echo_top[mask] = (reflectivity_grid[mask] - threshold_dbz) * 0.2 + 2.0
        return echo_top

    @staticmethod
    def extract_ctt(ir_brightness_temp):
        return ir_brightness_temp - 273.15

    @staticmethod
    def extract_vil(reflectivity_grid):
        vil = np.zeros_like(reflectivity_grid)
        vil = np.power(10, reflectivity_grid / 10.0) * 0.005
        return vil

    @staticmethod
    def extract_lightning_density(strikes, grid_shape, lat_range, lon_range):
        density = np.zeros(grid_shape)
        if not strikes:
            return density
        lat_min, lat_max = lat_range
        lon_min, lon_max = lon_range
        rows, cols = grid_shape
        for strike in strikes:
            lat, lon = strike["lat"], strike["lon"]
            r = int((lat_max - lat) / (lat_max - lat_min) * rows)
            c = int((lon - lon_min) / (lon_max - lon_min) * cols)
            if 0 <= r < rows and 0 <= c < cols:
                density[r, c] += 1
        return density

    @staticmethod
    def extract_cape_field(lat_range, lon_range, grid_shape):
        base_cape = np.random.normal(1500, 200, grid_shape)
        return np.clip(base_cape, 1000, 3500)
