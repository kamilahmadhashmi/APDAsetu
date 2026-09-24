"""
==============================================================================
AAPDASETU / AEGIS-MESH - DATA PROVIDER CONTRACT & ISOLATION TEST SUITE
==============================================================================
Validates:
1. Provider contract conformance (SimulatedDataProvider vs RealDataProvider)
2. Database isolation (aegis_real.db vs aegis_simulated.db)
3. Normalized API response shapes
4. Weather and alert ingress pipelines
==============================================================================
"""

import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.providers.base import DataProvider
from app.providers.simulated_provider import SimulatedDataProvider, simulated_provider
from app.providers.real_provider import RealDataProvider, real_provider
from app.providers import get_data_provider, get_data_mode


@pytest.fixture
def temp_db_session(tmp_path):
    """Provides a fresh isolated in-memory SQLite session for testing."""
    test_db_path = tmp_path / "test_provider.db"
    engine = create_engine(f"sqlite:///{test_db_path}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


def test_simulated_provider_contract(temp_db_session):
    """SimulatedDataProvider must satisfy the DataProvider interface and return expected baseline values."""
    provider = SimulatedDataProvider()
    assert isinstance(provider, DataProvider)
    assert provider.mode_name == "simulated"
    assert provider.mode_label == "SIMULATION MODE"
    assert provider.is_simulated is True

    # Initialize and seed DB
    provider.initialize_database(temp_db_session)

    # Verify hospitals
    hospitals = provider.get_hospitals(temp_db_session)
    assert isinstance(hospitals, list)
    assert len(hospitals) >= 3
    for h in hospitals:
        assert "id" in h
        assert "name" in h
        assert "total" in h
        assert "occupied" in h

    # Verify fleet
    fleet = provider.get_fleet(temp_db_session)
    assert isinstance(fleet, list)
    assert len(fleet) >= 2

    # Verify weather
    weather = provider.get_weather_telemetry(20.2961, 85.8245)
    assert isinstance(weather, dict)
    assert "rainfall_intensity_mmhr" in weather or "rainfall_mmhr" in weather

    # Verify alerts
    alerts = provider.get_active_alerts(temp_db_session)
    assert isinstance(alerts, list)
    assert len(alerts) >= 1

    # Verify mesh topology
    topo = provider.get_mesh_topology(temp_db_session)
    assert "nodes" in topo
    assert len(topo["nodes"]) >= 1

    # Verify routing solver
    route = provider.solve_routing(
        db=temp_db_session,
        origin_lat=20.2961,
        origin_lng=85.8245,
        flood_depth_m=1.5,
        bed_priority_weight=0.75,
        storm_risk_factor=3.0
    )
    assert route["status"] == "OPTIMAL_SOLUTION_FOUND"
    assert "target_hospital" in route


def test_real_provider_contract(temp_db_session):
    """RealDataProvider must satisfy the DataProvider interface and provide live structures."""
    provider = RealDataProvider()
    assert isinstance(provider, DataProvider)
    assert provider.mode_name == "real"
    assert provider.mode_label == "LIVE DATA"
    assert provider.is_simulated is False

    # Initialize DB (does not throw)
    provider.initialize_database(temp_db_session)

    # Weather telemetry should have normalized structure
    weather = provider.get_weather_telemetry(20.2961, 85.8245)
    assert isinstance(weather, dict)
    assert "status" in weather
    assert "rainfall_intensity_mmhr" in weather
    assert "dam_discharge_m3s" in weather
    assert "current_water_level_m" in weather
    assert "trend" in weather

    # Active alerts should return a list (live GDACS or cached)
    alerts = provider.get_active_alerts(temp_db_session)
    assert isinstance(alerts, list)

    # Mesh topology should compute dynamically
    topo = provider.get_mesh_topology(temp_db_session)
    assert "nodes" in topo
    assert "mesh_protocol" in topo

    # Routing solver on real provider
    routing = provider.solve_routing(
        db=temp_db_session,
        origin_lat=20.2961,
        origin_lng=85.8245,
        flood_depth_m=1.2,
        bed_priority_weight=0.5,
        storm_risk_factor=2.0
    )
    assert "status" in routing
    assert "assignments" in routing


def test_provider_factory_switching():
    """get_data_provider() must dynamically return the appropriate provider based on DATA_MODE."""
    orig_mode = os.environ.get("DATA_MODE")
    try:
        os.environ["DATA_MODE"] = "real"
        assert get_data_mode() == "real"
        assert get_data_provider().mode_name == "real"

        os.environ["DATA_MODE"] = "simulated"
        assert get_data_mode() == "simulated"
        assert get_data_provider().mode_name == "simulated"

        # Default fallback
        if "DATA_MODE" in os.environ:
            del os.environ["DATA_MODE"]
        assert get_data_mode() == "simulated"
        assert get_data_provider().mode_name == "simulated"
    finally:
        if orig_mode is not None:
            os.environ["DATA_MODE"] = orig_mode


def test_database_isolation():
    """Validates that real and simulated database URLs target distinct files."""
    from app.db.database import get_database_url

    real_url = get_database_url("real")
    sim_url = get_database_url("simulated")

    assert "aegis_real.db" in real_url
    assert "aegis_simulated.db" in sim_url
    assert real_url != sim_url
