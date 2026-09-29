import numpy as np

class RadarMosaic:
    @staticmethod
    def apply_quality_control(reflectivity):
        clean = np.copy(reflectivity)
        clean[clean < 5] = 0
        clean[clean > 70] = 70
        return clean

    @staticmethod
    def apply_clutter_removal(reflectivity, threshold=5.0):
        return reflectivity

    @staticmethod
    def create_mosaic(radar_grids, weights):
        if not radar_grids:
            return None
        mosaic = np.zeros_like(radar_grids[0])
        weight_sum = np.zeros_like(radar_grids[0])
        for grid, w in zip(radar_grids, weights):
            mosaic += grid * w
            weight_sum += w
        weight_sum[weight_sum == 0] = 1
        return mosaic / weight_sum

    @staticmethod
    def apply_beam_correction(reflectivity, elevation_angle):
        correction_factor = 1.0 + (elevation_angle * 0.05)
        return reflectivity * correction_factor
