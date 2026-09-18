import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any

class SolarAnomalyDetector:
    """
    Unsupervised Anomaly Detection using Isolation Forest on multi-dimensional solar features.
    Features: [Expected Power, Actual Power, Shortfall, PR, Irradiance, Module Temp, Hour]
    """
    def __init__(self, contamination: float = 0.08):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=contamination,
            random_state=42,
            bootstrap=False
        )
        self.is_fitted = False

    def prepare_features(self, records: List[Dict[str, Any]]) -> np.ndarray:
        features = []
        for r in records:
            ts = r.get("timestamp", "2026-01-01 12:00:00")
            hour = float(ts.split(" ")[1].split(":")[0]) if " " in ts else 12.0
            
            exp_p = float(r.get("expected_power_kw", 0.0))
            act_p = float(r.get("actual_power_kw", 0.0))
            irr = float(r.get("irradiance_wm2", 0.0))
            mod_t = float(r.get("module_temp_c", 25.0))
            pr = float(r.get("performance_ratio_pct", 100.0))
            shortfall = float(r.get("shortfall_kw", 0.0))
            
            features.append([exp_p, act_p, shortfall, pr, irr, mod_t, hour])
        return np.array(features)

    def fit_and_predict(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not records:
            return []
            
        X = self.prepare_features(records)
        self.model.fit(X)
        self.is_fitted = True
        
        # In scikit-learn IsolationForest: -1 is anomaly, 1 is normal
        preds = self.model.predict(X)
        # decision_function gives negative scores for anomalies (lower is more anomalous)
        scores = self.model.decision_function(X)
        
        results = []
        for idx, r in enumerate(records):
            is_anomaly = bool(preds[idx] == -1 and r.get("irradiance_wm2", 0.0) > 30.0 and r.get("shortfall_kw", 0.0) > 2.0)
            # Normalized anomaly score 0 to 1 (1 = extreme anomaly)
            raw_score = scores[idx]
            norm_score = round(float(np.clip(1.0 - (raw_score + 0.5), 0.0, 1.0)), 2)
            
            results.append({
                "timestamp": r.get("timestamp"),
                "is_anomaly": is_anomaly,
                "anomaly_score": norm_score if is_anomaly else min(0.2, norm_score),
                "actual_power_kw": r.get("actual_power_kw"),
                "expected_power_kw": r.get("expected_power_kw"),
                "shortfall_kw": r.get("shortfall_kw")
            })
            
        return results

solar_anomaly_detector = SolarAnomalyDetector()
