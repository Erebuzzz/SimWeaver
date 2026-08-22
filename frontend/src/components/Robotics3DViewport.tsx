import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { SimulationFrame, EIRSpec, ExperimentRecord } from '../types';
import { Cube3DIcon, Blueprint2DIcon, GaugeMetricIcon } from './icons/EngineeringIcons';

interface Robotics3DViewportProps {
  currentFrame: SimulationFrame | null;
  eir: EIRSpec | null;
  isDarkMode: boolean;
  history: ExperimentRecord[];
  selectedExpId: number | 'live';
}

export const Robotics3DViewport: React.FC<Robotics3DViewportProps> = ({
  currentFrame,
  eir,
  isDarkMode,
  history,
  selectedExpId,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const robotMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const lidarPointsRef = useRef<THREE.Points | null>(null);
  const fovTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Camera Orbit State
  const [cameraMode, setCameraMode] = useState<'orbit' | 'top' | 'follow'>('orbit');
  const [followedRobotId, setFollowedRobotId] = useState<string | null>(null);
  const [cameraAngle, setCameraAngle] = useState({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 26 });
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  const envWidth = eir?.environment.width || 24.0;
  const envHeight = eir?.environment.height || 16.0;

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(isDarkMode ? 0x090c10 : 0xf6f8fb);
    scene.fog = new THREE.FogExp2(isDarkMode ? 0x090c10 : 0xf6f8fb, 0.015);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    cameraRef.current = camera;
    camera.position.set(
      envWidth / 2 + cameraAngle.radius * Math.sin(cameraAngle.phi) * Math.sin(cameraAngle.theta),
      cameraAngle.radius * Math.cos(cameraAngle.phi),
      envHeight / 2 + cameraAngle.radius * Math.sin(cameraAngle.phi) * Math.cos(cameraAngle.theta)
    );
    camera.lookAt(envWidth / 2, 0, envHeight / 2);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Directional & Ambient Lighting (Blue & Orange Accent Highlights)
    const ambientLight = new THREE.AmbientLight(
      isDarkMode ? 0x64748b : 0xe2e8f0,
      isDarkMode ? 1.1 : 1.5
    );
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff7ed, 1.6);
    mainLight.position.set(envWidth / 2 + 15, 25, envHeight / 2 + 15);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 100;
    const d = 25;
    mainLight.shadow.camera.left = -d;
    mainLight.shadow.camera.right = d;
    mainLight.shadow.camera.top = d;
    mainLight.shadow.camera.bottom = -d;
    mainLight.shadow.bias = -0.0005;
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    rimLight.position.set(envWidth / 2 - 15, 18, envHeight / 2 - 15);
    scene.add(rimLight);

    // 5. Ground Plane
    const groundGeo = new THREE.PlaneGeometry(envWidth + 10, envHeight + 10);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x0e131c : 0xffffff,
      roughness: isDarkMode ? 0.45 : 0.25,
      metalness: isDarkMode ? 0.2 : 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(envWidth / 2, -0.01, envHeight / 2);
    ground.receiveShadow = true;
    scene.add(ground);

    // Precision Grid
    const grid = new THREE.GridHelper(Math.max(envWidth, envHeight) * 1.5, 30, isDarkMode ? 0x334155 : 0xcbd5e1, isDarkMode ? 0x1e293b : 0xe2e8f0);
    grid.position.set(envWidth / 2, 0.0, envHeight / 2);
    scene.add(grid);

    // 6. Spawn 3D Warehouse Shelves
    if (eir?.environment.obstacles) {
      eir.environment.obstacles.forEach((obs) => {
        const rackGroup = new THREE.Group();

        const shelfGeo = new THREE.BoxGeometry(obs.width, 2.2, obs.height);
        const shelfMat = new THREE.MeshStandardMaterial({
          color: isDarkMode ? 0x1e293b : 0xe2e8f0,
          metalness: 0.6,
          roughness: 0.35,
        });
        const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
        shelfMesh.position.set(0, 1.1, 0);
        shelfMesh.castShadow = true;
        shelfMesh.receiveShadow = true;
        rackGroup.add(shelfMesh);

        const edges = new THREE.EdgesGeometry(shelfGeo);
        const lineMat = new THREE.LineBasicMaterial({
          color: isDarkMode ? 0x475569 : 0x94a3b8,
          linewidth: 1,
        });
        const line = new THREE.LineSegments(edges, lineMat);
        line.position.set(0, 1.1, 0);
        rackGroup.add(line);

        rackGroup.position.set(obs.x, 0, obs.y);
        scene.add(rackGroup);
      });
    }

    // 7. Spawn 3D Zone Overlays (Blue and Orange Accents)
    if (eir?.environment.zones) {
      eir.environment.zones.forEach((zone) => {
        const zoneGeo = new THREE.PlaneGeometry(zone.width, zone.height);
        let zoneColor = 0x38bdf8;
        if (zone.zone_type === 'drop') zoneColor = 0x10b981;
        if (zone.zone_type === 'intersection') zoneColor = 0xf97316;

        const zoneMat = new THREE.MeshBasicMaterial({
          color: zoneColor,
          transparent: true,
          opacity: 0.15,
          side: THREE.DoubleSide,
        });
        const zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
        zoneMesh.rotation.x = -Math.PI / 2;
        zoneMesh.position.set(zone.x, 0.02, zone.y);
        scene.add(zoneMesh);
      });
    }

    // 8. Shared Intensity-Driven FOV Vignette Texture
    const fovTexture = createIntensityDrivenTwinTexture();
    fovTextureRef.current = fovTexture;

    // 9. LiDAR Intensity-Modulated Point Cloud Buffer
    const maxLidarPoints = 3000;
    const lidarGeo = new THREE.BufferGeometry();
    const lidarPositions = new Float32Array(maxLidarPoints * 3);
    const lidarColors = new Float32Array(maxLidarPoints * 3);
    lidarGeo.setAttribute('position', new THREE.BufferAttribute(lidarPositions, 3));
    lidarGeo.setAttribute('color', new THREE.BufferAttribute(lidarColors, 3));

    const lidarMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });
    const lidarPointCloud = new THREE.Points(lidarGeo, lidarMat);
    lidarPointsRef.current = lidarPointCloud;
    scene.add(lidarPointCloud);

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

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Rotate LiDAR pucks & intensity FOV discs on active AMRs
      robotMeshesRef.current.forEach((robotGroup) => {
        const puck = robotGroup.getObjectByName('lidar_puck');
        if (puck) {
          puck.rotation.y += delta * 3.5;
        }

        const fovMesh = robotGroup.getObjectByName('fov_disc');
        if (fovMesh) {
          fovMesh.rotation.z -= delta * 3.5;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      fovTexture.dispose();
    };
  }, [eir, isDarkMode, envWidth, envHeight]);

  // Update AMR Robot Positions & 3D Intensity LiDAR in Real-Time
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !currentFrame?.robots) return;

    const rRadius = eir?.robot.radius || 0.28;
    const lidarRange = eir?.sensors.lidar_range || 3.5;
    const colors = [0x38bdf8, 0xf97316, 0x10b981, 0x818cf8, 0xf43f5e, 0x06b6d4];

    const allLidarPoints: number[] = [];
    const allLidarColors: number[] = [];

    currentFrame.robots.forEach((robot, idx) => {
      let robotGroup = robotMeshesRef.current.get(robot.robot_id);

      if (!robotGroup) {
        robotGroup = new THREE.Group();
        robotGroup.name = robot.robot_id;

        // Single Unified Industrial Chassis Body
        const bodyGeo = new THREE.CylinderGeometry(rRadius, rRadius, 0.22, 32);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: isDarkMode ? 0x1e293b : 0xe2e8f0,
          metalness: 0.65,
          roughness: 0.35,
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, 0.15, 0);
        body.castShadow = true;
        body.receiveShadow = true;
        robotGroup.add(body);

        // LED Status Ring Light
        const statusRingGeo = new THREE.TorusGeometry(rRadius * 0.95, 0.012, 12, 32);
        const statusRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const statusRing = new THREE.Mesh(statusRingGeo, statusRingMat);
        statusRing.rotation.x = Math.PI / 2;
        statusRing.position.set(0, 0.25, 0);
        robotGroup.add(statusRing);

        // Drive Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.035, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.8 });
        
        const leftWheel = new THREE.Mesh(wheelGeo, wheelMat);
        leftWheel.rotation.z = Math.PI / 2;
        leftWheel.position.set(0, 0.06, rRadius * 0.7);
        leftWheel.castShadow = true;
        robotGroup.add(leftWheel);

        const rightWheel = new THREE.Mesh(wheelGeo, wheelMat);
        rightWheel.rotation.z = Math.PI / 2;
        rightWheel.position.set(0, 0.06, -rRadius * 0.7);
        rightWheel.castShadow = true;
        robotGroup.add(rightWheel);

        // Rotating LiDAR Puck
        const puckGroup = new THREE.Group();
        puckGroup.name = 'lidar_puck';
        puckGroup.position.set(rRadius * 0.35, 0.28, 0);

        const puckGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.04, 16);
        const puckMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
        const puckMesh = new THREE.Mesh(puckGeo, puckMat);
        puckGroup.add(puckMesh);

        const opticalLensGeo = new THREE.BoxGeometry(0.02, 0.015, 0.04);
        const opticalLensMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
        const opticalLens = new THREE.Mesh(opticalLensGeo, opticalLensMat);
        opticalLens.position.set(0.035, 0, 0);
        puckGroup.add(opticalLens);

        robotGroup.add(puckGroup);

        // Heading Direction Pointer Beacon
        const arrowGeo = new THREE.ConeGeometry(0.05, 0.12, 16);
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const arrow = new THREE.Mesh(arrowGeo, arrowMat);
        arrow.rotation.z = -Math.PI / 2;
        arrow.position.set(rRadius + 0.04, 0.15, 0);
        robotGroup.add(arrow);

        // Intensity-Driven Omnidirectional Vignette FOV Disc
        if (fovTextureRef.current) {
          const fovDiameter = lidarRange * 2.0;
          const fovGeo = new THREE.PlaneGeometry(fovDiameter, fovDiameter);
          const fovMat = new THREE.MeshBasicMaterial({
            map: fovTextureRef.current,
            transparent: true,
            opacity: isDarkMode ? 0.72 : 0.52,
            depthWrite: false,
            side: THREE.DoubleSide,
          });
          const fovDisc = new THREE.Mesh(fovGeo, fovMat);
          fovDisc.name = 'fov_disc';
          fovDisc.rotation.x = -Math.PI / 2;
          fovDisc.position.set(rRadius * 0.35, 0.28, 0);
          robotGroup.add(fovDisc);
        }

        scene.add(robotGroup);
        robotMeshesRef.current.set(robot.robot_id, robotGroup);
      }

      robotGroup.position.set(robot.x, 0, robot.y);
      robotGroup.rotation.y = -robot.theta;

      // Extract LiDAR Hits & Map Return Intensity Color
      if (robot.lidar_hits) {
        robot.lidar_hits.forEach((hit) => {
          allLidarPoints.push(hit[0], 0.28, hit[1]);

          // Compute return distance for intensity thermal mapping
          const dist = Math.hypot(hit[0] - robot.x, hit[1] - robot.y);
          const normDist = Math.min(1.0, dist / lidarRange);

          // Close returns (high intensity) = Orange/Amber; Far returns = Cobalt/Indigo
          if (normDist < 0.3) {
            allLidarColors.push(1.0, 0.6, 0.1); // Blazing amber/orange
          } else if (normDist < 0.7) {
            allLidarColors.push(0.22, 0.74, 0.97); // Cyan / Blue
          } else {
            allLidarColors.push(0.39, 0.4, 0.95); // Deep Indigo
          }
        });
      }
    });

    if (lidarPointsRef.current) {
      const posAttr = lidarPointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colAttr = lidarPointsRef.current.geometry.getAttribute('color') as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;
      const colArr = colAttr.array as Float32Array;
      const count = Math.min(allLidarPoints.length / 3, posArr.length / 3);

      for (let i = 0; i < count * 3; i++) {
        posArr[i] = allLidarPoints[i];
        colArr[i] = allLidarColors[i];
      }
      for (let i = count * 3; i < posArr.length; i++) {
        posArr[i] = -9999;
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    }

    if (cameraMode === 'follow' && followedRobotId && cameraRef.current) {
      const targetRobot = currentFrame.robots.find((r) => r.robot_id === followedRobotId);
      if (targetRobot) {
        const cam = cameraRef.current;
        const camDist = 6.0;
        const camHeight = 3.8;
        const cx = targetRobot.x - Math.cos(targetRobot.theta) * camDist;
        const cz = targetRobot.y - Math.sin(targetRobot.theta) * camDist;
        cam.position.lerp(new THREE.Vector3(cx, camHeight, cz), 0.12);
        cam.lookAt(targetRobot.x, 0.4, targetRobot.y);
      }
    }
  }, [currentFrame, eir, cameraMode, followedRobotId, isDarkMode]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || cameraMode === 'follow') return;

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    setCameraAngle((prev) => {
      const newTheta = prev.theta - deltaX * 0.008;
      const newPhi = Math.max(0.15, Math.min(Math.PI / 2.05, prev.phi - deltaY * 0.008));
      
      if (cameraRef.current) {
        const cam = cameraRef.current;
        cam.position.set(
          envWidth / 2 + prev.radius * Math.sin(newPhi) * Math.sin(newTheta),
          prev.radius * Math.cos(newPhi),
          envHeight / 2 + prev.radius * Math.sin(newPhi) * Math.cos(newTheta)
        );
        cam.lookAt(envWidth / 2, 0, envHeight / 2);
      }

      return { theta: newTheta, phi: newPhi, radius: prev.radius };
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    setCameraAngle((prev) => {
      const newRadius = Math.max(8.0, Math.min(60.0, prev.radius + e.deltaY * 0.03));
      if (cameraRef.current && cameraMode !== 'follow') {
        const cam = cameraRef.current;
        cam.position.set(
          envWidth / 2 + newRadius * Math.sin(prev.phi) * Math.sin(prev.theta),
          newRadius * Math.cos(prev.phi),
          envHeight / 2 + newRadius * Math.sin(prev.phi) * Math.cos(prev.theta)
        );
        cam.lookAt(envWidth / 2, 0, envHeight / 2);
      }
      return { ...prev, radius: newRadius };
    });
  };

  const resetCamera = (mode: 'orbit' | 'top') => {
    setCameraMode(mode);
    setFollowedRobotId(null);
    if (!cameraRef.current) return;
    const cam = cameraRef.current;

    if (mode === 'top') {
      cam.position.set(envWidth / 2, 28, envHeight / 2 + 0.001);
      cam.lookAt(envWidth / 2, 0, envHeight / 2);
    } else {
      const defaultAngle = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 26 };
      setCameraAngle(defaultAngle);
      cam.position.set(
        envWidth / 2 + defaultAngle.radius * Math.sin(defaultAngle.phi) * Math.sin(defaultAngle.theta),
        defaultAngle.radius * Math.cos(defaultAngle.phi),
        envHeight / 2 + defaultAngle.radius * Math.sin(defaultAngle.phi) * Math.cos(defaultAngle.theta)
      );
      cam.lookAt(envWidth / 2, 0, envHeight / 2);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      <div
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* 3D Camera Controls Floating Squircle HUD */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 p-0.5 rounded-md bg-black/60 backdrop-blur-md border border-slate-700/60 text-[10px] font-mono z-20">
        <button
          onClick={() => resetCamera('orbit')}
          className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 transition ${
            cameraMode === 'orbit'
              ? 'bg-blue-500 text-slate-950 font-bold'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Cube3DIcon className="w-3 h-3" />
          <span>Isometric 3D</span>
        </button>

        <button
          onClick={() => resetCamera('top')}
          className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 transition ${
            cameraMode === 'top'
              ? 'bg-blue-500 text-slate-950 font-bold'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Blueprint2DIcon className="w-3 h-3" />
          <span>Top Down</span>
        </button>

        {currentFrame?.robots && currentFrame.robots.length > 0 && (
          <div className="flex items-center gap-0.5 border-l border-slate-700 pl-1">
            <span className="text-[9px] text-slate-400">Follow:</span>
            {currentFrame.robots.slice(0, 4).map((r) => (
              <button
                key={r.robot_id}
                onClick={() => {
                  setCameraMode('follow');
                  setFollowedRobotId(r.robot_id);
                }}
                className={`px-1 py-0.2 rounded-md text-[9px] uppercase font-bold transition ${
                  cameraMode === 'follow' && followedRobotId === r.robot_id
                    ? 'bg-orange-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r.robot_id}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur border border-white/10 text-[9px] font-mono text-slate-400 pointer-events-none z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
        <span>Intensity-Weighted FOV | 1/r² Radiance Colormap</span>
      </div>
    </div>
  );
};

function createIntensityDrivenTwinTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.46;

  // 1. Soft 1/r^2 Intensity Radiance Colormap
  const radGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, maxRadius);
  radGrad.addColorStop(0.0, 'rgba(255, 247, 237, 0.92)'); // White-Hot Core
  radGrad.addColorStop(0.1, 'rgba(249, 115, 22, 0.75)'); // High Return Orange (+18dB)
  radGrad.addColorStop(0.25, 'rgba(245, 158, 11, 0.48)'); // Saffron (+10dB)
  radGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.22)'); // Nominal Cyan (0dB)
  radGrad.addColorStop(0.78, 'rgba(99, 102, 241, 0.08)'); // Indigo (-10dB)
  radGrad.addColorStop(0.95, 'rgba(49, 46, 129, 0.015)'); // Noise Threshold (-18dB)
  radGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = radGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
  ctx.fill();

  // 2. Calibrated Decibel Contours
  const dbSteps = [
    { r: 0.25, color: 'rgba(249, 115, 22, 0.38)' },
    { r: 0.5, color: 'rgba(56, 189, 248, 0.28)' },
    { r: 0.78, color: 'rgba(99, 102, 241, 0.18)' },
  ];

  dbSteps.forEach((s) => {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius * s.r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 3. Dynamic Wavefront Sweep
  const sweepGrad = ctx.createConicGradient(-Math.PI / 2, cx, cy);
  sweepGrad.addColorStop(0.0, 'rgba(255, 237, 213, 0.75)');
  sweepGrad.addColorStop(0.06, 'rgba(249, 115, 22, 0.45)');
  sweepGrad.addColorStop(0.22, 'rgba(56, 189, 248, 0.12)');
  sweepGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.0)');
  sweepGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = sweepGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
