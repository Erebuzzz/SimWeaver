"""
Benchmark Environment and Scenario Presets for SimWeaver

Provides rich, diverse testing layouts:
1. warehouse_5_amr: Standard logistics grid with central crossing.
2. dense_cross_traffic: High-density 8-AMR grid with multiple cross-aisle intersections.
3. hospital_cleanroom: Medical hospital layout with sterile airlocks and wards.
4. airport_baggage_hub: High-throughput circular flow baggage sorting arena.
5. dynamic_obstacle_arena: Multi-corridor layout with dynamic cross-traffic obstacles.
"""

from __future__ import annotations
from typing import Dict, Any, Tuple, List
from simweaver.core.eir_models import EnvironmentSpec, BoxObstacle, ZoneSpec, EIRSpec, ConstraintSpec


def get_preset_environment(preset_id: str) -> Tuple[EnvironmentSpec, int, str]:
    """
    Returns (EnvironmentSpec, robot_count, default_human_intent).
    """
    if preset_id == "dense_cross_traffic":
        env = EnvironmentSpec(
            name="High-Density Cross-Traffic Arena",
            width=28.0,
            height=20.0,
            grid_resolution=0.25,
            aisle_width=1.6,
            obstacles=[
                # 6 compact grid racks
                BoxObstacle(id="rack_1", x=6.0, y=15.0, width=5.0, height=2.0, label="High-Density Rack 1"),
                BoxObstacle(id="rack_2", x=14.0, y=15.0, width=5.0, height=2.0, label="High-Density Rack 2"),
                BoxObstacle(id="rack_3", x=22.0, y=15.0, width=5.0, height=2.0, label="High-Density Rack 3"),
                BoxObstacle(id="rack_4", x=6.0, y=5.0, width=5.0, height=2.0, label="High-Density Rack 4"),
                BoxObstacle(id="rack_5", x=14.0, y=5.0, width=5.0, height=2.0, label="High-Density Rack 5"),
                BoxObstacle(id="rack_6", x=22.0, y=5.0, width=5.0, height=2.0, label="High-Density Rack 6"),
            ],
            zones=[
                ZoneSpec(id="pick_n1", name="Pick North 1", x=6.0, y=13.0, width=4.0, height=1.0, zone_type="pick"),
                ZoneSpec(id="pick_n2", name="Pick North 2", x=14.0, y=13.0, width=4.0, height=1.0, zone_type="pick"),
                ZoneSpec(id="pick_n3", name="Pick North 3", x=22.0, y=13.0, width=4.0, height=1.0, zone_type="pick"),
                ZoneSpec(id="pick_s1", name="Pick South 1", x=6.0, y=7.0, width=4.0, height=1.0, zone_type="pick"),
                ZoneSpec(id="pick_s2", name="Pick South 2", x=14.0, y=7.0, width=4.0, height=1.0, zone_type="pick"),
                ZoneSpec(id="pick_s3", name="Pick South 3", x=22.0, y=7.0, width=4.0, height=1.0, zone_type="pick"),
                ZoneSpec(id="bay_w", name="Sorting Bay West", x=2.0, y=10.0, width=1.5, height=5.0, zone_type="drop"),
                ZoneSpec(id="bay_e", name="Sorting Bay East", x=26.0, y=10.0, width=1.5, height=5.0, zone_type="drop"),
                ZoneSpec(id="int_1", name="West Crossing", x=10.0, y=10.0, width=3.0, height=3.0, zone_type="intersection"),
                ZoneSpec(id="int_2", name="East Crossing", x=18.0, y=10.0, width=3.0, height=3.0, zone_type="intersection"),
            ]
        )
        return env, 8, "Build a high-density warehouse grid with 8 AMRs operating across narrow cross-traffic corridors. Maintain zero collisions, eliminate intersection deadlocks, and achieve completion rate above 98%."

    elif preset_id == "hospital_cleanroom":
        env = EnvironmentSpec(
            name="Hospital Sterile Cleanroom",
            width=22.0,
            height=16.0,
            grid_resolution=0.20,
            aisle_width=2.2,
            obstacles=[
                # Sterile Pharmacy & Isolation Wards
                BoxObstacle(id="pharmacy", x=5.0, y=12.0, width=6.0, height=3.0, label="Central Pharmacy"),
                BoxObstacle(id="ward_a", x=16.0, y=12.0, width=6.0, height=3.0, label="Isolation Ward A"),
                BoxObstacle(id="icu", x=5.0, y=4.0, width=6.0, height=3.0, label="Intensive Care Unit"),
                BoxObstacle(id="lab", x=16.0, y=4.0, width=6.0, height=3.0, label="Diagnostic Laboratory"),
            ],
            zones=[
                ZoneSpec(id="pharm_out", name="Pharmacy Dispatch", x=5.0, y=9.5, width=4.0, height=1.0, zone_type="pick"),
                ZoneSpec(id="lab_out", name="Lab Sample Dispatch", x=16.0, y=6.5, width=4.0, height=1.0, zone_type="pick"),
                ZoneSpec(id="ward_in", name="Ward Delivery Airlock", x=16.0, y=9.5, width=4.0, height=1.0, zone_type="drop"),
                ZoneSpec(id="icu_in", name="ICU Medication Dock", x=5.0, y=6.5, width=4.0, height=1.0, zone_type="drop"),
                ZoneSpec(id="int_hosp", name="Central Corridor Junction", x=10.5, y=8.0, width=3.5, height=3.5, zone_type="intersection"),
            ]
        )
        return env, 4, "Design a cleanroom hospital logistics system with 4 sterile AMRs. Require strict minimum separation of 0.45m, max speed limit of 1.0 m/s, and maximum delivery time of 50.0 seconds."

    elif preset_id == "airport_baggage_hub":
        env = EnvironmentSpec(
            name="Airport Baggage Distribution Loop",
            width=26.0,
            height=18.0,
            grid_resolution=0.25,
            aisle_width=2.5,
            obstacles=[
                # Central Baggage Conveyor Carousel
                BoxObstacle(id="carousel_core", x=13.0, y=9.0, width=10.0, height=6.0, label="Automated Carousel Core"),
                BoxObstacle(id="pillar_nw", x=4.0, y=15.0, width=1.5, height=1.5, label="Structural Column NW"),
                BoxObstacle(id="pillar_ne", x=22.0, y=15.0, width=1.5, height=1.5, label="Structural Column NE"),
                BoxObstacle(id="pillar_sw", x=4.0, y=3.0, width=1.5, height=1.5, label="Structural Column SW"),
                BoxObstacle(id="pillar_se", x=22.0, y=3.0, width=1.5, height=1.5, label="Structural Column SE"),
            ],
            zones=[
                ZoneSpec(id="checkin_1", name="Check-in Infeed 1", x=4.0, y=9.0, width=1.5, height=4.0, zone_type="pick"),
                ZoneSpec(id="checkin_2", name="Check-in Infeed 2", x=22.0, y=9.0, width=1.5, height=4.0, zone_type="pick"),
                ZoneSpec(id="gate_north", name="Flight Gate North", x=13.0, y=16.0, width=6.0, height=1.5, zone_type="drop"),
                ZoneSpec(id="gate_south", name="Flight Gate South", x=13.0, y=2.0, width=6.0, height=1.5, zone_type="drop"),
                ZoneSpec(id="loop_int_1", name="Carousel Junction West", x=7.0, y=9.0, width=2.5, height=2.5, zone_type="intersection"),
                ZoneSpec(id="loop_int_2", name="Carousel Junction East", x=19.0, y=9.0, width=2.5, height=2.5, zone_type="intersection"),
            ]
        )
        return env, 6, "Optimize an airport baggage transfer loop with 6 AMRs. Minimize package transit latency under 45s while ensuring zero baggage collisions in the central loop."

    else:
        # Default warehouse 5 AMR
        env = EnvironmentSpec(
            name="Warehouse Standard Logistics",
            width=24.0,
            height=16.0,
            grid_resolution=0.25,
            aisle_width=2.0,
            obstacles=[
                BoxObstacle(id="shelf_tl", x=6.0, y=12.0, width=6.0, height=2.2, label="Storage Rack 1"),
                BoxObstacle(id="shelf_tr", x=18.0, y=12.0, width=6.0, height=2.2, label="Storage Rack 2"),
                BoxObstacle(id="shelf_bl", x=6.0, y=4.0, width=6.0, height=2.2, label="Storage Rack 3"),
                BoxObstacle(id="shelf_br", x=18.0, y=4.0, width=6.0, height=2.2, label="Storage Rack 4"),
            ],
            zones=[
                ZoneSpec(id="pick_1", name="Pick Zone Shelf 1", x=6.0, y=10.0, width=5.0, height=1.0, zone_type="pick"),
                ZoneSpec(id="pick_2", name="Pick Zone Shelf 2", x=18.0, y=10.0, width=5.0, height=1.0, zone_type="pick"),
                ZoneSpec(id="pick_3", name="Pick Zone Shelf 3", x=6.0, y=6.0, width=5.0, height=1.0, zone_type="pick"),
                ZoneSpec(id="pick_4", name="Pick Zone Shelf 4", x=18.0, y=6.0, width=5.0, height=1.0, zone_type="pick"),
                ZoneSpec(id="bay_west", name="Loading Bay West", x=2.0, y=8.0, width=1.5, height=4.0, zone_type="drop"),
                ZoneSpec(id="bay_east", name="Loading Bay East", x=22.0, y=8.0, width=1.5, height=4.0, zone_type="drop"),
                ZoneSpec(id="int_main", name="Central Intersection", x=12.0, y=8.0, width=3.6, height=3.6, zone_type="intersection"),
            ]
        )
        return env, 5, "Create a warehouse with 5 autonomous mobile robots. Robots must transport packages between shelves and a loading area. They should avoid collisions, maintain at least 30 cm separation, and achieve an average delivery time below 60 seconds."
