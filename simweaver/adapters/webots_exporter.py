"""
Webots World Exporter Adapter for SimWeaver

Translates EIR environment, obstacle geometries, and robot morphology into
standard Webots .wbt simulation world files.
"""

from __future__ import annotations
from simweaver.core.eir_models import EIRSpec


def generate_webots_world(eir: EIRSpec) -> str:
    """Generates complete Webots .wbt world file string."""
    env = eir.environment
    robot = eir.robot
    sensors = eir.sensors

    lines = [
        '#VRML_SIM R2023b utf8',
        '',
        'EXTERNPROTO "webots://projects/objects/backgrounds/protos/TexturedBackground.proto"',
        'EXTERNPROTO "webots://projects/objects/backgrounds/protos/TexturedBackgroundLight.proto"',
        'EXTERNPROTO "webots://projects/objects/floors/protos/Floor.proto"',
        'EXTERNPROTO "webots://projects/objects/solids/protos/SolidBox.proto"',
        '',
        'WorldInfo {',
        '  info [',
        f'    "SimWeaver Generated World: {env.name}"',
        f'    "Design ID: {eir.id}"',
        '  ]',
        '  basicTimeStep 16',
        '  coordinateSystem "NUE"',
        '}',
        '',
        'Viewpoint {',
        '  orientation -0.57735 0.57735 0.57735 2.0944',
        f'  position {env.width / 2.0:.1f} {max(env.width, env.height) * 1.2:.1f} {env.height / 2.0:.1f}',
        '}',
        '',
        'TexturedBackground {}',
        'TexturedBackgroundLight {}',
        '',
        'Floor {',
        f'  size {env.width:.1f} {env.height:.1f}',
        '  tileSize 1 1',
        '}',
    ]

    # Add Warehouse Obstacles / Shelves
    for i, obs in enumerate(env.obstacles):
        lines.extend([
            '',
            f'SolidBox {{',
            f'  translation {obs.x:.2f} 1.0 {obs.y:.2f}',
            f'  size {obs.width:.2f} 2.0 {obs.height:.2f}',
            f'  name "{obs.label.replace(" ", "_")}_{i+1}"',
            f'  appearance PBRAppearance {{',
            f'    baseColor 0.25 0.3 0.38',
            f'    roughness 0.4',
            f'  }}',
            f'}}'
        ])

    # Add AMR Robots
    staging_positions = [
        (2.5, 2.0),
        (env.width - 2.5, 2.0),
        (2.5, env.height - 2.0),
        (env.width - 2.5, env.height - 2.0),
        (env.width / 2.0, 2.0),
        (env.width / 2.0, env.height - 2.0),
        (6.0, env.height / 2.0),
        (env.width - 6.0, env.height / 2.0),
    ]

    for idx in range(robot.count):
        pos = staging_positions[idx % len(staging_positions)]
        lines.extend([
            '',
            f'Robot {{',
            f'  translation {pos[0]:.2f} {robot.radius:.3f} {pos[1]:.2f}',
            f'  rotation 0 1 0 0',
            f'  name "amr_{idx+1}"',
            f'  children [',
            f'    DEF BODY Transform {{',
            f'      translation 0 0 0',
            f'      children [',
            f'        Shape {{',
            f'          appearance PBRAppearance {{ baseColor 0.12 0.53 0.89 }}',
            f'          geometry Cylinder {{ height 0.2 radius {robot.radius:.3f} }}',
            f'        }}',
            f'      ]',
            f'    }}',
            f'    Lidar {{',
            f'      translation 0 0.15 0',
            f'      fieldOfView {sensors.lidar_fov_deg * 3.14159 / 180.0:.3f}',
            f'      horizontalResolution {sensors.lidar_rays}',
            f'      maxRange {sensors.lidar_range:.2f}',
            f'      numberOfLayers 1',
            f'    }}',
            f'  ]',
            f'  boundingObject Cylinder {{ height 0.2 radius {robot.radius:.3f} }}',
            f'  physics Physics {{ mass {robot.mass:.2f} }}',
            f'  controller "amr_controller"',
            f'}}'
        ])

    return '\n'.join(lines)
