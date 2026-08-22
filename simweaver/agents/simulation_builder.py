"""
Simulation Builder Agent for SimWeaver

Translates the simulator-independent EIR into an executable simulation instance.
Enforces the safety boundary: the builder cannot arbitrarily redefine requirements.
"""

from __future__ import annotations
from typing import Optional
from simweaver.core.eir_models import EIRSpec
from simweaver.simulation.engine import SimulationEngine


class SimulationBuilderAgent:
    """
    Compiles EIR into an active simulation runtime.
    """

    def __init__(self):
        pass

    def build_simulation(self, eir: EIRSpec, seed: Optional[int] = 42) -> SimulationEngine:
        """
        Instantiates the simulation engine configured according to the EIR specification.
        """
        engine = SimulationEngine(eir=eir, seed=seed)
        return engine
