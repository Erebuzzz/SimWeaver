"""
Comprehensive test runner for SimWeaver
"""
import sys
from tests import test_eir, test_simulation, test_agents, test_server

def main():
    print("Running Phase 1 tests (EIR and WorldModel)...")
    test_eir.test_eir_serialization()
    test_eir.test_cost_calculation()
    test_eir.test_world_model_history()
    print("[OK] Phase 1 tests passed!\n")

    print("Running Phase 2 tests (Simulation Engine and Planners)...")
    test_simulation.test_astar_planner()
    test_simulation.test_dwa_velocity()
    test_simulation.test_intersection_reservation()
    test_simulation.test_full_simulation_run()
    print("[OK] Phase 2 tests passed!\n")

    print("Running Phase 3 tests (Multi-Agent Reasoning Loop)...")
    test_agents.test_agentic_loop()
    print("[OK] Phase 3 tests passed!\n")

    print("Running Phase 4 tests (FastAPI Server Endpoints)...")
    test_server.test_server_endpoints()
    print("[OK] Phase 4 tests passed!\n")

    print("[OK] ALL SIMWEAVER SYSTEM TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
