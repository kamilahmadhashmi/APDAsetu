"""
==========================================================================
AAPDASETU - DATA PROVIDER FACTORY
==========================================================================
Selects the active data provider according to the DATA_MODE environment variable:
- DATA_MODE=real      -> RealDataProvider
- DATA_MODE=simulated -> SimulatedDataProvider (Default)
"""

import os
from app.providers.base import DataProvider
from app.providers.simulated_provider import simulated_provider
from app.providers.real_provider import real_provider

def get_data_mode() -> str:
    return os.environ.get("DATA_MODE", "simulated").strip().lower()

def get_data_provider() -> DataProvider:
    mode = get_data_mode()
    if mode == "real":
        return real_provider
    return simulated_provider

__all__ = ["DataProvider", "get_data_provider", "get_data_mode", "simulated_provider", "real_provider"]
