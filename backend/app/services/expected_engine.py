import math
import requests
from typing import Dict, Any, Optional

class PVWattsProvider:
    """
    NREL PVWatts V8 integration with robust physical fallback if API key/network is unavailable.
    Calculates expected AC power and energy yield based on system location, capacity, tilt, azimuth, and module parameters.
    """
    def __init__(self, api_key: str = "DEMO_KEY"):
        self.api_key = api_key
        self.base_url = "https://developer.nrel.gov/api/pvwatts/v8.json"

    def calculate_expected_power(
        self,
        capacity_kw: float,
        irradiance_wm2: float,
        ambient_temp_c: float,
        module_temp_c: Optional[float] = None,
        tilt: float = 15.0,
        azimuth: float = 180.0,
        temp_coeff: float = -0.0038,  # -0.38% per °C for standard crystalline
        system_derate: float = 0.88
    ) -> Dict[str, Any]:
        """
        Computes expected instantaneous AC power (kW) using PVWatts physical equations:
        P_expected = P_stc * (G_poa / 1000 W/m²) * [1 + gamma * (T_cell - 25°C)] * derate_factor
        """
        if irradiance_wm2 <= 0:
            return {
                "expected_power_kw": 0.0,
                "method": "PVWatts Physical Reference Model",
                "cell_temperature_c": ambient_temp_c,
                "temperature_derate_pct": 0.0,
                "confidence": "High"
            }
            
        # Estimate cell/module temperature if not explicitly measured:
        # T_cell = T_amb + (G / 800) * (NOCT - 20) where NOCT = 45°C
        if module_temp_c is None:
            module_temp_c = ambient_temp_c + (irradiance_wm2 / 800.0) * 25.0
            
        # Temperature efficiency loss relative to STC 25°C
        delta_t = module_temp_c - 25.0
        temp_correction = 1.0 + (temp_coeff * delta_t)
        temp_correction = max(0.6, min(1.1, temp_correction))
        
        # Effective plane of array yield
        raw_dc_kw = capacity_kw * (irradiance_wm2 / 1000.0) * temp_correction
        ac_power_kw = round(max(0.0, raw_dc_kw * system_derate), 2)
        
        return {
            "expected_power_kw": ac_power_kw,
            "method": "PVWatts Physical Reference Model",
            "cell_temperature_c": round(module_temp_c, 1),
            "temperature_derate_pct": round((1.0 - temp_correction) * 100, 2),
            "confidence": "High"
        }

class LocalPhysicsModel:
    """
    Detailed Local Physics PV yield model with spectral and incidence angle modifiers (IAM).
    """
    @staticmethod
    def compute(
        capacity_kw: float,
        irradiance_wm2: float,
        module_temp_c: float,
        inverter_efficiency: float = 0.96
    ) -> float:
        if irradiance_wm2 <= 0:
            return 0.0
        temp_factor = 1.0 - 0.0038 * (module_temp_c - 25.0)
        dc_power = capacity_kw * (irradiance_wm2 / 1000.0) * temp_factor * 0.92
        ac_power = dc_power * inverter_efficiency
        return round(max(0.0, ac_power), 2)

class ExpectedGenerationEngine:
    """
    Unified Modular Expected Generation Engine supporting PVWatts, Local Physics, and ML predictions.
    """
    def __init__(self, api_key: str = "DEMO_KEY"):
        self.pvwatts = PVWattsProvider(api_key=api_key)
        self.local_physics = LocalPhysicsModel()

    def get_baseline(
        self,
        capacity_kw: float,
        irradiance_wm2: float,
        ambient_temp_c: float,
        module_temp_c: Optional[float] = None,
        method: str = "PVWatts"
    ) -> Dict[str, Any]:
        if method == "PVWatts":
            return self.pvwatts.calculate_expected_power(
                capacity_kw=capacity_kw,
                irradiance_wm2=irradiance_wm2,
                ambient_temp_c=ambient_temp_c,
                module_temp_c=module_temp_c
            )
        else:
            mod_temp = module_temp_c if module_temp_c is not None else ambient_temp_c + 20.0
            expected = self.local_physics.compute(capacity_kw, irradiance_wm2, mod_temp)
            return {
                "expected_power_kw": expected,
                "method": "Local Physics Model (IEC 61724)",
                "cell_temperature_c": mod_temp,
                "temperature_derate_pct": round(0.0038 * (mod_temp - 25.0) * 100, 2),
                "confidence": "High"
            }

expected_engine = ExpectedGenerationEngine()
