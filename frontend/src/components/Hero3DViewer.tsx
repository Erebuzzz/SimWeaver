import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { 
  Cube3DIcon, 
  CrosshairIcon, 
  BrainNeuralIcon, 
  SparkleTargetIcon
} from './icons/EngineeringIcons';

interface Hero3DViewerProps {
  isDarkMode: boolean;
}

type ViewMode = 'solid' | 'exploded' | 'xray' | 'wireframe';

interface SubsystemInfo {
  id: string;
  name: string;
  category: string;
  specs: Record<string, string>;
  description: string;
}

const SUBSYSTEM_DATA: Record<string, SubsystemInfo> = {
  lidar: {
    id: 'lidar',
    name: '360° LiDAR Sensor Suite',
    category: 'Perception & Localization',
    specs: {
      'FOV Range': '3.5m - 24.0m',
      'Scan Rate': '20 Hz (360°)',
      'Angular Res': '0.5° (720 beams)',
      'Noise Std': '0.025m Gaussian',
    },
    description: 'Time-of-flight optical scanner with intensity radiance detection and inverse-square attenuation.',
  },
  compute: {
    id: 'compute',
    name: 'Edge AI Compute Carrier',
    category: 'Autonomous Brain & Navigation',
    specs: {
      'SoC Module': 'Jetson AGX Orin 64GB',
      'AI Compute': '275 TOPS (INT8)',
      'Planner Rate': '50 Hz DWA / A*',
      'OS / Middleware': 'ROS2 Humble Ubuntu 22.04',
    },
    description: 'Runs real-time multi-agent kinematics, dynamic window velocity sampling, and spatial-temporal reservations.',
  },
  battery: {
    id: 'battery',
    name: 'LiFePO4 Power Module',
    category: 'Energy & Power Distribution',
    specs: {
      'Chemistry': 'Lithium Iron Phosphate',
      'Capacity': '48V 30Ah (1440 Wh)',
      'Runtime': '8.5 Hours Continuous',
      'Charge Time': '45 min fast charge',
    },
    description: 'High-density modular battery pack with integrated BMS telemetry and cell temperature monitoring.',
  },
  actuators: {
    id: 'actuators',
    name: 'Dual BLDC Drive Actuators',
    category: 'Kinematics & Motion',
    specs: {
      'Motor Type': '250W Geared BLDC',
      'Max Speed': '1.8 m/s (Linear)',
      'Angular Vel': '2.5 rad/s Max',
      'Encoder': '4096 CPR Optical',
    },
    description: 'Differential-drive powertrain featuring closed-loop PID velocity control and active regenerative braking.',
  },
  chassis: {
    id: 'chassis',
    name: 'Machined Titanium Chassis',
    category: 'Structural Airframe',
    specs: {
      'Material': '6061-T6 Al & Titanium',
      'Payload Cap': '120 kg Nominal',
      'Footprint': '0.56m Diameter',
      'Tare Weight': '22.5 kg',
    },
    description: 'Symmetric cylindrical chassis designed for tight warehouse aisle clearance and zero-radius pivot turns.',
  },
};

export const Hero3DViewer: React.FC<Hero3DViewerProps> = ({ isDarkMode }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const robotGroupRef = useRef<THREE.Group | null>(null);

  // Subsystem Groups for Exploded View
  const chassisBaseGroupRef = useRef<THREE.Group | null>(null);
  const topPlateGroupRef = useRef<THREE.Group | null>(null);
  const lidarGroupRef = useRef<THREE.Group | null>(null);
  const leftWheelGroupRef = useRef<THREE.Group | null>(null);
  const rightWheelGroupRef = useRef<THREE.Group | null>(null);
  const internalCoreGroupRef = useRef<THREE.Group | null>(null);

  const puckRef = useRef<THREE.Group | null>(null);
  const fovDiscRef = useRef<THREE.Mesh | null>(null);
  const groundFovRef = useRef<THREE.Mesh | null>(null);
  const pulseRingRef = useRef<THREE.Mesh | null>(null);

  // Materials References for X-Ray / Wireframe Switching
  const materialsRef = useRef<{
    hullMats: THREE.MeshStandardMaterial[];
    internalMats: THREE.MeshStandardMaterial[];
  }>({ hullMats: [], internalMats: [] });

  const [viewMode, setViewMode] = useState<ViewMode>('solid');
  const [explodeProgress, setExplodeProgress] = useState<number>(0);
  const [selectedSubsystem, setSelectedSubsystem] = useState<SubsystemInfo | null>(null);

  const isInteractingRef = useRef<boolean>(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });

  // Update Exploded View Interpolation
  useEffect(() => {
    let target = 0;
    if (viewMode === 'exploded') target = 1.0;
    else target = 0;

    let frameId: number;
    const lerpExplode = () => {
      setExplodeProgress((prev) => {
        const next = prev + (target - prev) * 0.14;
        if (Math.abs(next - target) < 0.005) return target;
        frameId = requestAnimationFrame(lerpExplode);
        return next;
      });
    };
    frameId = requestAnimationFrame(lerpExplode);
    return () => cancelAnimationFrame(frameId);
  }, [viewMode]);

  // Apply Sub-Assembly Offsets according to explodeProgress
  useEffect(() => {
    const e = explodeProgress;

    if (topPlateGroupRef.current) {
      topPlateGroupRef.current.position.y = 0.38 + e * 0.55;
    }
    if (lidarGroupRef.current) {
      lidarGroupRef.current.position.y = e * 0.95;
    }
    if (chassisBaseGroupRef.current) {
      chassisBaseGroupRef.current.position.y = -e * 0.35;
    }
    if (leftWheelGroupRef.current) {
      leftWheelGroupRef.current.position.z = 0.65 + e * 0.5;
    }
    if (rightWheelGroupRef.current) {
      rightWheelGroupRef.current.position.z = -0.65 - e * 0.5;
    }
    if (internalCoreGroupRef.current) {
      internalCoreGroupRef.current.position.y = e * 0.1;
    }
  }, [explodeProgress]);

  // Update Materials for View Mode (Solid vs Exploded vs X-Ray vs Wireframe)
  useEffect(() => {
    const { hullMats, internalMats } = materialsRef.current;

    hullMats.forEach((mat) => {
      if (viewMode === 'wireframe') {
        mat.wireframe = true;
        mat.transparent = false;
        mat.opacity = 1.0;
      } else if (viewMode === 'xray') {
        mat.wireframe = false;
        mat.transparent = true;
        mat.opacity = 0.18;
        mat.roughness = 0.1;
        mat.metalness = 0.9;
      } else {
        mat.wireframe = false;
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.roughness = 0.35;
        mat.metalness = 0.65;
      }
      mat.needsUpdate = true;
    });

    internalMats.forEach((mat) => {
      if (viewMode === 'wireframe') {
        mat.wireframe = true;
      } else {
        mat.wireframe = false;
      }
      mat.needsUpdate = true;
    });
  }, [viewMode]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(3.2, 2.2, 3.6);
    camera.lookAt(0, 0.4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambLight = new THREE.AmbientLight(isDarkMode ? 0x64748b : 0xe2e8f0, isDarkMode ? 1.2 : 1.6);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    keyLight.position.set(4, 5, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf97316, 1.4);
    fillLight.position.set(-4, 3, -3);
    scene.add(fillLight);

    // Ground Grid
    const gridHelper = new THREE.GridHelper(6, 18, isDarkMode ? 0x0284c7 : 0x94a3b8, isDarkMode ? 0x1e293b : 0xe2e8f0);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Robot Main Group
    const robotGroup = new THREE.Group();
    robotGroupRef.current = robotGroup;
    scene.add(robotGroup);

    materialsRef.current.hullMats = [];
    materialsRef.current.internalMats = [];

    // 1. SUB-ASSEMBLY: Lower Chassis Hull
    const chassisBaseGroup = new THREE.Group();
    chassisBaseGroup.name = 'chassis';
    chassisBaseGroupRef.current = chassisBaseGroup;
    robotGroup.add(chassisBaseGroup);

    const baseGeo = new THREE.CylinderGeometry(0.8, 0.82, 0.28, 36);
    const baseMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x1e293b : 0xe2e8f0,
      metalness: 0.7,
      roughness: 0.35,
    });
    materialsRef.current.hullMats.push(baseMat);
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.22;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    chassisBaseGroup.add(baseMesh);

    // 2. SUB-ASSEMBLY: Upper Top Lid & Status Ring
    const topPlateGroup = new THREE.Group();
    topPlateGroup.name = 'chassis_top';
    topPlateGroupRef.current = topPlateGroup;
    robotGroup.add(topPlateGroup);

    const topPlateGeo = new THREE.CylinderGeometry(0.72, 0.78, 0.08, 36);
    const topPlateMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x0f172a : 0xcbd5e1,
      metalness: 0.6,
      roughness: 0.35,
    });
    materialsRef.current.hullMats.push(topPlateMat);
    const topPlate = new THREE.Mesh(topPlateGeo, topPlateMat);
    topPlate.position.y = 0.0;
    topPlate.castShadow = true;
    topPlateGroup.add(topPlate);

    const ringGeo = new THREE.TorusGeometry(0.74, 0.018, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -0.02;
    topPlateGroup.add(ringMesh);

    // 3. SUB-ASSEMBLY: Internal Core (Battery, Compute, Motors, IMU)
    const internalCoreGroup = new THREE.Group();
    internalCoreGroup.name = 'internal_core';
    internalCoreGroupRef.current = internalCoreGroup;
    robotGroup.add(internalCoreGroup);

    // (A) Battery Pack
    const batteryGroup = new THREE.Group();
    batteryGroup.name = 'battery';

    const battGeo = new THREE.BoxGeometry(0.48, 0.14, 0.36);
    const battMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      metalness: 0.4,
      roughness: 0.4,
    });
    materialsRef.current.internalMats.push(battMat);
    const battMesh = new THREE.Mesh(battGeo, battMat);
    battMesh.position.set(0, 0.16, 0);
    batteryGroup.add(battMesh);

    const finGeo = new THREE.BoxGeometry(0.5, 0.02, 0.38);
    const finMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const finMesh = new THREE.Mesh(finGeo, finMat);
    finMesh.position.set(0, 0.23, 0);
    batteryGroup.add(finMesh);

    internalCoreGroup.add(batteryGroup);

    // (B) Edge AI Compute Board
    const computeGroup = new THREE.Group();
    computeGroup.name = 'compute';

    const pcbGeo = new THREE.BoxGeometry(0.38, 0.015, 0.34);
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x065f46,
      roughness: 0.3,
      metalness: 0.5,
    });
    materialsRef.current.internalMats.push(pcbMat);
    const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
    pcbMesh.position.set(0, 0.28, 0);
    computeGroup.add(pcbMesh);

    const chipGeo = new THREE.BoxGeometry(0.14, 0.04, 0.14);
    const chipMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const chipMesh = new THREE.Mesh(chipGeo, chipMat);
    chipMesh.position.set(0, 0.3, 0);
    computeGroup.add(chipMesh);

    internalCoreGroup.add(computeGroup);

    // (C) Dual BLDC Motor Actuators
    const actuatorGroup = new THREE.Group();
    actuatorGroup.name = 'actuators';

    const motorGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.18, 20);
    const motorMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
    materialsRef.current.internalMats.push(motorMat);

    const leftMotor = new THREE.Mesh(motorGeo, motorMat);
    leftMotor.rotation.x = Math.PI / 2;
    leftMotor.position.set(0, 0.18, 0.35);
    actuatorGroup.add(leftMotor);

    const rightMotor = new THREE.Mesh(motorGeo, motorMat);
    rightMotor.rotation.x = Math.PI / 2;
    rightMotor.position.set(0, 0.18, -0.35);
    actuatorGroup.add(rightMotor);

    internalCoreGroup.add(actuatorGroup);

    // (D) IMU Beacon
    const imuGeo = new THREE.BoxGeometry(0.04, 0.02, 0.04);
    const imuMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const imuMesh = new THREE.Mesh(imuGeo, imuMat);
    imuMesh.position.set(0.12, 0.32, 0.1);
    internalCoreGroup.add(imuMesh);

    // 4. SUB-ASSEMBLY: Left & Right Drive Wheels
    const leftWheelGroup = new THREE.Group();
    leftWheelGroup.name = 'actuators';
    leftWheelGroupRef.current = leftWheelGroup;
    robotGroup.add(leftWheelGroup);

    const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.09, 28);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.8 });
    materialsRef.current.hullMats.push(wheelMat);

    const leftWheel = new THREE.Mesh(wheelGeo, wheelMat);
    leftWheel.rotation.z = Math.PI / 2;
    leftWheel.position.set(0, 0.18, 0);
    leftWheel.castShadow = true;
    leftWheelGroup.add(leftWheel);

    const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.095, 16);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8 });
    const leftHub = new THREE.Mesh(hubGeo, hubMat);
    leftHub.rotation.z = Math.PI / 2;
    leftHub.position.set(0, 0.18, 0);
    leftWheelGroup.add(leftHub);

    const rightWheelGroup = new THREE.Group();
    rightWheelGroup.name = 'actuators';
    rightWheelGroupRef.current = rightWheelGroup;
    robotGroup.add(rightWheelGroup);

    const rightWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rightWheel.rotation.z = Math.PI / 2;
    rightWheel.position.set(0, 0.18, 0);
    rightWheel.castShadow = true;
    rightWheelGroup.add(rightWheel);

    const rightHub = new THREE.Mesh(hubGeo, hubMat);
    rightHub.rotation.z = Math.PI / 2;
    rightHub.position.set(0, 0.18, 0);
    rightWheelGroup.add(rightHub);

    // 5. SUB-ASSEMBLY: 360° LiDAR Sensor Suite
    const lidarGroup = new THREE.Group();
    lidarGroup.name = 'lidar';
    lidarGroupRef.current = lidarGroup;
    topPlateGroup.add(lidarGroup);

    const mastGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.16, 16);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    materialsRef.current.hullMats.push(mastMat);
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0.32, 0.1, 0);
    lidarGroup.add(mast);

    const puckGroup = new THREE.Group();
    puckRef.current = puckGroup;
    puckGroup.position.set(0.32, 0.2, 0);

    const puckGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.09, 24);
    const puckMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    materialsRef.current.hullMats.push(puckMat);
    const puckMesh = new THREE.Mesh(puckGeo, puckMat);
    puckGroup.add(puckMesh);

    const opticalLensGeo = new THREE.BoxGeometry(0.06, 0.03, 0.08);
    const opticalLensMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const opticalLens = new THREE.Mesh(opticalLensGeo, opticalLensMat);
    opticalLens.position.set(0.08, 0, 0);
    puckGroup.add(opticalLens);

    lidarGroup.add(puckGroup);

    // 6. Intensity-Driven Omnidirectional FOV Perception Disc
    const fovTexture = createIntensityTexture('thermal');

    const fovGeo = new THREE.PlaneGeometry(4.4, 4.4);
    const fovMat = new THREE.MeshBasicMaterial({
      map: fovTexture,
      transparent: true,
      opacity: isDarkMode ? 0.82 : 0.65,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
    });

    const fovDisc = new THREE.Mesh(fovGeo, fovMat);
    fovDisc.rotation.x = -Math.PI / 2;
    fovDisc.position.set(0.32, 0.2, 0);
    fovDiscRef.current = fovDisc;
    lidarGroup.add(fovDisc);

    // 7. Ground Level Projection Vignette Ring
    const groundFovGeo = new THREE.PlaneGeometry(4.8, 4.8);
    const groundFovMat = new THREE.MeshBasicMaterial({
      map: fovTexture,
      transparent: true,
      opacity: isDarkMode ? 0.38 : 0.25,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const groundFov = new THREE.Mesh(groundFovGeo, groundFovMat);
    groundFov.rotation.x = -Math.PI / 2;
    groundFov.position.set(0.32, 0.01, 0);
    groundFovRef.current = groundFov;
    robotGroup.add(groundFov);

    // 8. ToF Pulse Ring
    const pulseGeo = new THREE.RingGeometry(0.1, 0.15, 48);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const pulseRing = new THREE.Mesh(pulseGeo, pulseMat);
    pulseRing.rotation.x = -Math.PI / 2;
    pulseRing.position.set(0.32, 0.205, 0);
    pulseRingRef.current = pulseRing;
    lidarGroup.add(pulseRing);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Continuous Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let pulseScale = 1.0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Ambient chassis rotation if user not dragging
      if (!isInteractingRef.current && robotGroupRef.current) {
        robotGroupRef.current.rotation.y += delta * 0.32;
      }

      // Continuous LiDAR puck spin
      if (puckRef.current) {
        puckRef.current.rotation.y += delta * 3.5;
      }

      // Rotate intensity sweep texture
      if (fovDiscRef.current) {
        fovDiscRef.current.rotation.z -= delta * 3.5;
      }
      if (groundFovRef.current) {
        groundFovRef.current.rotation.z -= delta * 3.5;
      }

      // Expand & fade ToF pulse wave
      pulseScale += delta * 3.2;
      if (pulseScale > 14.0) pulseScale = 1.0;
      if (pulseRingRef.current) {
        pulseRingRef.current.scale.set(pulseScale, pulseScale, 1.0);
        const pulseOpacity = Math.max(0.0, 0.75 * (1.0 - pulseScale / 14.0));
        (pulseRingRef.current.material as THREE.MeshBasicMaterial).opacity = pulseOpacity;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      fovTexture.dispose();
    };
  }, [isDarkMode]);

  // Interactive Drag & Raycasting Click
  const handleMouseDown = (e: React.MouseEvent) => {
    isInteractingRef.current = true;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isInteractingRef.current && robotGroupRef.current) {
      const deltaX = e.clientX - prevMouseRef.current.x;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
      robotGroupRef.current.rotation.y += deltaX * 0.01;
    }
  };

  const handleMouseUp = () => {
    isInteractingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    if (intersects.length > 0) {
      let current: THREE.Object3D | null = intersects[0].object;
      while (current && current.parent && current !== sceneRef.current) {
        if (current.name && SUBSYSTEM_DATA[current.name]) {
          setSelectedSubsystem(SUBSYSTEM_DATA[current.name]);
          return;
        }
        current = current.parent;
      }
    }
  };

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden liquid-glass border border-[var(--border-subtle)] shadow-2xl flex flex-col transition-colors">
      {/* 3D Canvas Mount */}
      <div
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        className="w-full flex-1 cursor-grab active:cursor-grabbing"
      />

      {/* Floating Viewport Controls: Single-Line Squircle Mode Switcher */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none gap-2 z-10">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] pointer-events-auto text-[10px] font-mono text-[var(--text-secondary)] shadow-sm shrink-0 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping" />
          <span className="font-bold text-[var(--text-primary)]">Autonomous AMR Chassis</span>
        </div>

        {/* Mode Selector (Single Line Without Wrapping) */}
        <div className="flex items-center gap-0.5 bg-[var(--bg-surface)] p-0.5 rounded-md border border-[var(--border-subtle)] pointer-events-auto text-[10px] font-mono shadow-sm shrink-0 flex-nowrap">
          <button
            onClick={() => setViewMode('solid')}
            className={`px-2 py-0.5 rounded text-[9px] font-bold actuator-transition flex items-center gap-1 whitespace-nowrap ${
              viewMode === 'solid'
                ? 'bg-blue-500 text-slate-950 font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Cube3DIcon className="w-2.5 h-2.5" />
            <span>Solid</span>
          </button>

          <button
            onClick={() => setViewMode('exploded')}
            className={`px-2 py-0.5 rounded text-[9px] font-bold actuator-transition flex items-center gap-1 whitespace-nowrap ${
              viewMode === 'exploded'
                ? 'bg-gradient-to-r from-blue-600 to-orange-600 text-white font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <SparkleTargetIcon className="w-2.5 h-2.5 text-orange-400" />
            <span>Explodify</span>
          </button>

          <button
            onClick={() => setViewMode('xray')}
            className={`px-2 py-0.5 rounded text-[9px] font-bold actuator-transition flex items-center gap-1 whitespace-nowrap ${
              viewMode === 'xray'
                ? 'bg-purple-600 text-white font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BrainNeuralIcon className="w-2.5 h-2.5 text-purple-400" />
            <span>X-Ray</span>
          </button>

          <button
            onClick={() => setViewMode('wireframe')}
            className={`px-2 py-0.5 rounded text-[9px] font-bold actuator-transition flex items-center gap-1 whitespace-nowrap ${
              viewMode === 'wireframe'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>Wireframe</span>
          </button>
        </div>
      </div>

      {/* Interactive Subsystem Telemetry Card (When Clicked / Selected) */}
      {selectedSubsystem && (
        <div className="absolute top-11 right-2.5 liquid-glass-card p-2.5 w-60 shadow-2xl border border-blue-500/40 space-y-1.5 z-20 font-mono text-[9px]">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1">
            <span className="font-bold text-orange-400 flex items-center gap-1">
              <CrosshairIcon className="w-2.5 h-2.5" />
              {selectedSubsystem.name}
            </span>
            <button
              onClick={() => setSelectedSubsystem(null)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-xs"
            >
              [×]
            </button>
          </div>

          <div className="text-[8px] text-blue-400 font-bold uppercase">
            {selectedSubsystem.category}
          </div>

          <div className="space-y-0.5 bg-[var(--bg-main)] p-1.5 rounded border border-[var(--border-subtle)]">
            {Object.entries(selectedSubsystem.specs).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">{key}:</span>
                <strong className="text-[var(--text-primary)] font-bold">{val}</strong>
              </div>
            ))}
          </div>

          <p className="text-[8px] text-[var(--text-secondary)] font-sans leading-relaxed">
            {selectedSubsystem.description}
          </p>
        </div>
      )}

      {/* Subsystem Direct Inspect Bar (Pixel-Fitted Bottom Shelf with Zero Collisions) */}
      <div className="h-8 px-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between text-[10px] font-mono shrink-0 w-full z-10">
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] text-[var(--text-muted)] uppercase font-semibold mr-0.5">Inspect:</span>
          {Object.values(SUBSYSTEM_DATA).map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubsystem(sub)}
              className={`px-1.5 py-0.2 rounded text-[8px] font-bold border actuator-transition ${
                selectedSubsystem?.id === sub.id
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                  : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              {sub.name.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[9px] text-[var(--text-muted)] shrink-0">
          <span className="text-orange-400 font-bold">Hardware 3D</span>
          <span>|</span>
          <span className="text-blue-400 font-bold">PBR Studio</span>
        </div>
      </div>
    </div>
  );
};

function createIntensityTexture(mode: 'thermal' | 'snr'): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.46;

  const radGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, maxRadius);
  radGrad.addColorStop(0.0, 'rgba(255, 247, 237, 0.95)');
  radGrad.addColorStop(0.08, 'rgba(249, 115, 22, 0.85)');
  radGrad.addColorStop(0.22, 'rgba(245, 158, 11, 0.55)');
  radGrad.addColorStop(0.45, 'rgba(56, 189, 248, 0.28)');
  radGrad.addColorStop(0.72, 'rgba(99, 102, 241, 0.12)');
  radGrad.addColorStop(0.92, 'rgba(49, 46, 129, 0.025)');
  radGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = radGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
  ctx.fill();

  const sweepGrad = ctx.createConicGradient(-Math.PI / 2, cx, cy);
  sweepGrad.addColorStop(0.0, 'rgba(255, 237, 213, 0.85)');
  sweepGrad.addColorStop(0.05, 'rgba(249, 115, 22, 0.6)');
  sweepGrad.addColorStop(0.18, 'rgba(56, 189, 248, 0.2)');
  sweepGrad.addColorStop(0.45, 'rgba(99, 102, 241, 0.0)');
  sweepGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = sweepGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
