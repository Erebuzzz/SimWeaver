"""
URDF Exporter Adapter for SimWeaver

Translates EIR robot morphology and sensor specifications into standard
Unified Robot Description Format (URDF) XML with visual, collision, and inertial properties.
"""

from __future__ import annotations
import math
from simweaver.core.eir_models import EIRSpec


def generate_urdf(eir: EIRSpec) -> str:
    """Generates standard URDF XML representation of the EIR robot."""
    morphology = eir.robot
    sensor = eir.sensors
    
    r = morphology.radius
    height = 0.22
    mass = morphology.mass
    wheel_radius = 0.06
    wheel_width = 0.03
    wheel_offset_y = morphology.wheel_base / 2.0
    
    # Inertia calculations for cylinder chassis
    ixx = (1.0 / 12.0) * mass * (3.0 * r**2 + height**2)
    iyy = ixx
    izz = 0.5 * mass * r**2

    wheel_mass = 1.2
    w_ixx = (1.0 / 12.0) * wheel_mass * (3.0 * wheel_radius**2 + wheel_width**2)
    w_iyy = w_ixx
    w_izz = 0.5 * wheel_mass * wheel_radius**2

    urdf_lines = [
        '<?xml version="1.0"?>',
        f'<robot name="simweaver_amr_{morphology.type}">',
        '  <!-- Base Footprint (Ground projection) -->',
        '  <link name="base_footprint"/>',
        '',
        '  <joint name="base_joint" type="fixed">',
        '    <parent link="base_footprint"/>',
        '    <child link="base_link"/>',
        f'    <origin xyz="0 0 {wheel_radius + height / 2.0:.4f}" rpy="0 0 0"/>',
        '  </joint>',
        '',
        '  <!-- Main Chassis Body -->',
        '  <link name="base_link">',
        '    <visual>',
        '      <geometry>',
        f'        <cylinder radius="{r:.3f}" length="{height:.3f}"/>',
        '      </geometry>',
        '      <material name="amr_body_color">',
        '        <color rgba="0.12 0.53 0.89 1.0"/>',
        '      </material>',
        '    </visual>',
        '    <collision>',
        '      <geometry>',
        f'        <cylinder radius="{r:.3f}" length="{height:.3f}"/>',
        '      </geometry>',
        '    </collision>',
        '    <inertial>',
        f'      <mass value="{mass:.2f}"/>',
        f'      <inertia ixx="{ixx:.5f}" ixy="0" ixz="0" iyy="{iyy:.5f}" iyz="0" izz="{izz:.5f}"/>',
        '    </inertial>',
        '  </link>',
        '',
        '  <!-- Left Drive Wheel -->',
        '  <link name="left_wheel">',
        '    <visual>',
        '      <geometry>',
        f'        <cylinder radius="{wheel_radius:.3f}" length="{wheel_width:.3f}"/>',
        '      </geometry>',
        '      <material name="wheel_black">',
        '        <color rgba="0.1 0.1 0.1 1.0"/>',
        '      </material>',
        '    </visual>',
        '    <collision>',
        '      <geometry>',
        f'        <cylinder radius="{wheel_radius:.3f}" length="{wheel_width:.3f}"/>',
        '      </geometry>',
        '    </collision>',
        '    <inertial>',
        f'      <mass value="{wheel_mass:.2f}"/>',
        f'      <inertia ixx="{w_ixx:.6f}" ixy="0" ixz="0" iyy="{w_iyy:.6f}" iyz="0" izz="{w_izz:.6f}"/>',
        '    </inertial>',
        '  </link>',
        '',
        '  <joint name="left_wheel_joint" type="continuous">',
        '    <parent link="base_link"/>',
        '    <child link="left_wheel"/>',
        f'    <origin xyz="0 {wheel_offset_y:.4f} {-height / 2.0:.4f}" rpy="-1.57079 0 0"/>',
        '    <axis xyz="0 0 1"/>',
        f'    <limit effort="10.0" velocity="{morphology.max_linear_speed / wheel_radius:.2f}"/>',
        '  </joint>',
        '',
        '  <!-- Right Drive Wheel -->',
        '  <link name="right_wheel">',
        '    <visual>',
        '      <geometry>',
        f'        <cylinder radius="{wheel_radius:.3f}" length="{wheel_width:.3f}"/>',
        '      </geometry>',
        '      <material name="wheel_black">',
        '        <color rgba="0.1 0.1 0.1 1.0"/>',
        '      </material>',
        '    </visual>',
        '    <collision>',
        '      <geometry>',
        f'        <cylinder radius="{wheel_radius:.3f}" length="{wheel_width:.3f}"/>',
        '      </geometry>',
        '    </collision>',
        '    <inertial>',
        f'      <mass value="{wheel_mass:.2f}"/>',
        f'      <inertia ixx="{w_ixx:.6f}" ixy="0" ixz="0" iyy="{w_iyy:.6f}" iyz="0" izz="{w_izz:.6f}"/>',
        '    </inertial>',
        '  </link>',
        '',
        '  <joint name="right_wheel_joint" type="continuous">',
        '    <parent link="base_link"/>',
        '    <child link="right_wheel"/>',
        f'    <origin xyz="0 {-wheel_offset_y:.4f} {-height / 2.0:.4f}" rpy="1.57079 0 0"/>',
        '    <axis xyz="0 0 -1"/>',
        f'    <limit effort="10.0" velocity="{morphology.max_linear_speed / wheel_radius:.2f}"/>',
        '  </joint>',
        '',
        '  <!-- Front Passive Caster -->',
        '  <link name="front_caster">',
        '    <visual>',
        '      <geometry>',
        f'        <sphere radius="{wheel_radius * 0.5:.3f}"/>',
        '      </geometry>',
        '      <material name="caster_metal"><color rgba="0.6 0.6 0.6 1.0"/></material>',
        '    </visual>',
        '    <collision>',
        '      <geometry>',
        f'        <sphere radius="{wheel_radius * 0.5:.3f}"/>',
        '      </geometry>',
        '    </collision>',
        '  </link>',
        '',
        '  <joint name="front_caster_joint" type="fixed">',
        '    <parent link="base_link"/>',
        '    <child link="front_caster"/>',
        f'    <origin xyz="{r * 0.7:.3f} 0 {-height / 2.0 - wheel_radius * 0.5:.4f}" rpy="0 0 0"/>',
        '  </joint>',
    ]

    # 2D LiDAR sensor link
    if sensor.lidar_enabled:
        urdf_lines.extend([
            '',
            '  <!-- 2D LiDAR Sensor -->',
            '  <link name="lidar_link">',
            '    <visual>',
            '      <geometry>',
            '        <cylinder radius="0.04" length="0.035"/>',
            '      </geometry>',
            '      <material name="lidar_black"><color rgba="0.05 0.05 0.05 1.0"/></material>',
            '    </visual>',
            '  </link>',
            '',
            '  <joint name="lidar_joint" type="fixed">',
            '    <parent link="base_link"/>',
            '    <child link="lidar_link"/>',
            f'    <origin xyz="{r * 0.35:.3f} 0 {height / 2.0 + 0.02:.4f}" rpy="0 0 0"/>',
            '  </joint>',
            '',
            '  <gazebo reference="lidar_link">',
            '    <sensor type="ray" name="lidar_sensor">',
            '      <always_on>true</always_on>',
            '      <update_rate>20.0</update_rate>',
            '      <ray>',
            '        <scan>',
            '          <horizontal>',
            f'            <samples>{sensor.lidar_rays}</samples>',
            f'            <min_angle>{-math.radians(sensor.lidar_fov_deg / 2.0):.4f}</min_angle>',
            f'            <max_angle>{math.radians(sensor.lidar_fov_deg / 2.0):.4f}</max_angle>',
            '          </horizontal>',
            '        </scan>',
            '        <range>',
            '          <min>0.10</min>',
            f'          <max>{sensor.lidar_range:.2f}</max>',
            '        </range>',
            '      </ray>',
            '    </sensor>',
            '  </gazebo>'
        ])

    urdf_lines.append('</robot>')
    return '\n'.join(urdf_lines)
