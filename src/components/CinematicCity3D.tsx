import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Sun,
  Moon,
  Sunset,
  Camera,
  Maximize2,
  Compass,
  Box,
  Layers,
  Sparkles,
  Eye,
  Info,
  MapPin,
  Building2,
  Activity,
  Crosshair,
} from 'lucide-react';
import { useCity } from '../context/CityContext.tsx';
import { ZoneEntity, FacilityEntity } from '../types/city.ts';
import { MapFocalPoint } from '../types/location.ts';

interface CinematicCity3DProps {
  onSelectEntity?: (entityId: string) => void;
  selectedZoneId?: string | null;
  onSelectZone?: (zone: ZoneEntity) => void;
  focalPoint?: MapFocalPoint | null;
  isPickMode?: boolean;
  onPickCoordinates?: (x: number, y: number) => void;
  radiusKm?: number;
}

type TimeOfDay = 'midnight' | 'dusk' | 'daylight';
type CameraView = 'cinematic' | 'skyline' | 'topdown';

export const CinematicCity3D: React.FC<CinematicCity3DProps> = ({
  onSelectEntity,
  selectedZoneId,
  onSelectZone,
  focalPoint,
  isPickMode = false,
  onPickCoordinates,
  radiusKm = 1.0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { entities, activeScenario, setSelectedEntityId } = useCity();

  // Controls UI State
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('midnight');
  const [cameraView, setCameraView] = useState<CameraView>('cinematic');
  const [isAutoOrbit, setIsAutoOrbit] = useState(true);
  const [hoveredInfo, setHoveredInfo] = useState<{
    name: string;
    type: string;
    code?: string;
    details?: string;
    x: number;
    y: number;
  } | null>(null);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const lightsRef = useRef<{
    ambient: THREE.AmbientLight;
    directional: THREE.DirectionalLight;
    rimLight: THREE.DirectionalLight;
    beaconLight?: THREE.PointLight;
  } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const interactiveObjectsRef = useRef<THREE.Object3D[]>([]);
  const trafficParticlesRef = useRef<THREE.Points[]>([]);
  const holographicBeaconRef = useRef<THREE.Group | null>(null);

  // Focal Point & Interactive Location Selection Refs
  const focalPointRef = useRef<MapFocalPoint | null>(null);
  focalPointRef.current = focalPoint ?? null;

  const isPickModeRef = useRef<boolean>(false);
  isPickModeRef.current = !!isPickMode;

  const onPickCoordsRef = useRef<((x: number, y: number) => void) | undefined>(onPickCoordinates);
  onPickCoordsRef.current = onPickCoordinates;

  const groundMeshRef = useRef<THREE.Mesh | null>(null);
  const focalMarkerGroupRef = useRef<THREE.Group | null>(null);
  const focalPillarMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const sonarRing1Ref = useRef<THREE.Mesh | null>(null);
  const sonarRing2Ref = useRef<THREE.Mesh | null>(null);
  const sonarRingMat1Ref = useRef<THREE.MeshBasicMaterial | null>(null);
  const sonarRingMat2Ref = useRef<THREE.MeshBasicMaterial | null>(null);
  const perimeterRingRef = useRef<THREE.Mesh | null>(null);
  const beaconHeadRef = useRef<THREE.Mesh | null>(null);

  // Mouse Orbit & Pan state
  const isPointerDownRef = useRef(false);
  const pointerButtonRef = useRef(0); // 0 = left, 2 = right
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const orbitAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3.4, radius: 240 });
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const autoOrbitSpeedRef = useRef(0.002);

  // Lighting configurations for TimeOfDay
  const applyLightingPreset = useCallback((preset: TimeOfDay) => {
    if (!sceneRef.current || !lightsRef.current || !rendererRef.current) return;
    const { ambient, directional, rimLight } = lightsRef.current;

    if (preset === 'midnight') {
      sceneRef.current.background = new THREE.Color(0x040814);
      sceneRef.current.fog = new THREE.FogExp2(0x040814, 0.0028);
      ambient.color.setHex(0x1e293b);
      ambient.intensity = 1.2;
      directional.color.setHex(0x38bdf8);
      directional.intensity = 1.8;
      directional.position.set(100, 150, 100);
      rimLight.color.setHex(0x818cf8);
      rimLight.intensity = 2.0;
      rimLight.position.set(-100, 80, -100);
      rendererRef.current.toneMappingExposure = 1.2;
    } else if (preset === 'dusk') {
      sceneRef.current.background = new THREE.Color(0x180b1e);
      sceneRef.current.fog = new THREE.FogExp2(0x180b1e, 0.0025);
      ambient.color.setHex(0x4c1d95);
      ambient.intensity = 1.4;
      directional.color.setHex(0xf97316);
      directional.intensity = 2.8;
      directional.position.set(140, 90, 80);
      rimLight.color.setHex(0xfbbf24);
      rimLight.intensity = 1.6;
      rimLight.position.set(-100, 50, -100);
      rendererRef.current.toneMappingExposure = 1.3;
    } else {
      // daylight
      sceneRef.current.background = new THREE.Color(0x081326);
      sceneRef.current.fog = new THREE.FogExp2(0x081326, 0.0018);
      ambient.color.setHex(0x94a3b8);
      ambient.intensity = 2.0;
      directional.color.setHex(0xf8fafc);
      directional.intensity = 3.2;
      directional.position.set(120, 200, 120);
      rimLight.color.setHex(0x38bdf8);
      rimLight.intensity = 1.2;
      rimLight.position.set(-100, 100, -100);
      rendererRef.current.toneMappingExposure = 1.1;
    }
  }, []);

  // Set camera view preset
  const setCameraPreset = useCallback((view: CameraView) => {
    setCameraView(view);
    if (view === 'cinematic') {
      orbitAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.4, radius: 240 };
      targetLookAtRef.current.set(0, 5, 0);
    } else if (view === 'skyline') {
      orbitAngleRef.current = { theta: Math.PI / 3.2, phi: Math.PI / 2.15, radius: 190 };
      targetLookAtRef.current.set(0, 18, 0);
    } else if (view === 'topdown') {
      orbitAngleRef.current = { theta: 0, phi: 0.08, radius: 280 };
      targetLookAtRef.current.set(0, 0, 0);
    }
  }, []);

  // Main Three.js Scene Setup & Initialization
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 520;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x040814);
    scene.fog = new THREE.FogExp2(0x040814, 0.0028);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1500);
    cameraRef.current = camera;
    camera.position.set(160, 140, 160);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight.position.set(100, 150, 100);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 400;
    dirLight.shadow.camera.left = -150;
    dirLight.shadow.camera.right = 150;
    dirLight.shadow.camera.top = 150;
    dirLight.shadow.camera.bottom = -150;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 2.0);
    rimLight.position.set(-100, 80, -100);
    scene.add(rimLight);

    lightsRef.current = {
      ambient: ambientLight,
      directional: dirLight,
      rimLight,
    };

    // 5. Environment & Ground Grid
    // Ground base plate
    const groundGeo = new THREE.PlaneGeometry(600, 600, 40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x050a16,
      roughness: 0.85,
      metalness: 0.25,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    groundMesh.position.y = -0.5;
    scene.add(groundMesh);
    groundMeshRef.current = groundMesh;

    // Subtle Glowing Wireframe Topographical Grid
    const gridHelper = new THREE.GridHelper(360, 45, 0x0ea5e9, 0x1e293b);
    gridHelper.position.y = 0.05;
    scene.add(gridHelper);

    // 6. Water Canal / River Channel
    const waterGeo = new THREE.PlaneGeometry(70, 360, 24, 60);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x0369a1,
      emissiveIntensity: 0.25,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.rotation.z = Math.PI / 6;
    waterMesh.position.set(-20, 0.2, 0);
    scene.add(waterMesh);

    // 7. Expressways & Arterial Roads
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.3,
    });

    // East-West Arterial Expressway
    const road1 = new THREE.Mesh(new THREE.BoxGeometry(320, 0.6, 12), roadMat);
    road1.position.set(0, 0.3, -40);
    road1.receiveShadow = true;
    scene.add(road1);

    // South Ring Corridor
    const road2 = new THREE.Mesh(new THREE.BoxGeometry(320, 0.6, 12), roadMat);
    road2.position.set(0, 0.3, 50);
    road2.receiveShadow = true;
    scene.add(road2);

    // North-South Central Spine
    const road3 = new THREE.Mesh(new THREE.BoxGeometry(12, 0.6, 320), roadMat);
    road3.position.set(20, 0.3, 0);
    road3.receiveShadow = true;
    scene.add(road3);

    // Neon Center Lane Markings
    const laneMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const lane1 = new THREE.Mesh(new THREE.PlaneGeometry(300, 0.8), laneMat);
    lane1.rotation.x = -Math.PI / 2;
    lane1.position.set(0, 0.65, -40);
    scene.add(lane1);

    const lane2 = new THREE.Mesh(new THREE.PlaneGeometry(300, 0.8), laneMat);
    lane2.rotation.x = -Math.PI / 2;
    lane2.position.set(0, 0.65, 50);
    scene.add(lane2);

    const lane3 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 300), laneMat);
    lane3.rotation.x = -Math.PI / 2;
    lane3.position.set(20, 0.65, 0);
    scene.add(lane3);

    // 8. Dynamic Flowing Traffic Light Particles
    const trafficParticles: THREE.Points[] = [];
    const createTrafficRoute = (count: number, zPos: number, isHorizontal: boolean, color: number) => {
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const offset = (Math.random() - 0.5) * 280;
        if (isHorizontal) {
          positions[i * 3] = offset;
          positions[i * 3 + 1] = 0.9;
          positions[i * 3 + 2] = zPos + (Math.random() - 0.5) * 6;
        } else {
          positions[i * 3] = zPos + (Math.random() - 0.5) * 6;
          positions[i * 3 + 1] = 0.9;
          positions[i * 3 + 2] = offset;
        }
      }
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({
        color,
        size: 2.2,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const points = new THREE.Points(particleGeo, particleMat);
      scene.add(points);
      trafficParticles.push(points);
    };

    createTrafficRoute(70, -40, true, 0x38bdf8); // Cyan Eastbound
    createTrafficRoute(70, 50, true, 0xf43f5e);  // Red Westbound
    createTrafficRoute(60, 20, false, 0xfbbf24); // Amber Northbound
    trafficParticlesRef.current = trafficParticles;

    // 9. Generate Extruded 3D Districts & City Blocks
    const zones = entities.filter(e => e.type === 'ZONE') as ZoneEntity[];
    const interactiveObjects: THREE.Object3D[] = [];

    zones.forEach(z => {
      const zoneGroup = new THREE.Group();
      // Map 2D SVG coords (approx 100..900) to 3D coords (-120..120)
      const worldX = ((z.coordinates.x - 500) / 400) * 120;
      const worldZ = ((z.coordinates.y - 400) / 300) * 110;
      zoneGroup.position.set(worldX, 0, worldZ);

      const isActive = activeScenario?.zoneId === z.id;
      const isSelected = selectedZoneId === z.id;

      // Determine architectural archetype based on classification
      let blockColor = 0x1e293b;
      let windowEmissive = 0x38bdf8;
      let maxTowers = 3;
      let maxHeight = 30;

      if (z.landUseClassification === 'COMMERCIAL') {
        blockColor = 0x0f172a;
        windowEmissive = 0x67e8f9;
        maxTowers = 5;
        maxHeight = 65; // Massive skyscrapers
      } else if (z.landUseClassification === 'RESIDENTIAL') {
        blockColor = 0x111e38;
        windowEmissive = 0x38bdf8;
        maxTowers = 4;
        maxHeight = 35;
      } else if (z.landUseClassification === 'CIVIC') {
        blockColor = 0x2d1a08;
        windowEmissive = 0xfbbf24;
        maxTowers = 2;
        maxHeight = 25;
      } else if (z.landUseClassification === 'INDUSTRIAL') {
        blockColor = 0x181e28;
        windowEmissive = 0x94a3b8;
        maxTowers = 3;
        maxHeight = 20;
      } else if (z.landUseClassification === 'ECOLOGICAL') {
        blockColor = 0x052e16;
        windowEmissive = 0x34d399;
        maxTowers = 1;
        maxHeight = 12;
      }

      // 3D District Base Pedestal Plinth
      const plinthWidth = (z.bounds.width / 400) * 70;
      const plinthDepth = (z.bounds.height / 300) * 60;
      const plinthGeo = new THREE.BoxGeometry(plinthWidth, 1.2, plinthDepth);
      const plinthMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xf59e0b : isActive ? 0x0284c7 : blockColor,
        roughness: 0.4,
        metalness: 0.6,
      });
      const plinth = new THREE.Mesh(plinthGeo, plinthMat);
      plinth.position.y = 0.6;
      plinth.receiveShadow = true;
      zoneGroup.add(plinth);

      // District Plinth Glowing Edge Bevel
      const edgeGeo = new THREE.EdgesGeometry(plinthGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0xfbbf24 : isActive ? 0x38bdf8 : windowEmissive,
        linewidth: 2,
      });
      const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
      edgeLines.position.copy(plinth.position);
      zoneGroup.add(edgeLines);

      // Generate Towers / Architectural volumes on this plinth
      const towerCount = Math.max(1, maxTowers);
      for (let i = 0; i < towerCount; i++) {
        const height = 10 + Math.random() * (maxHeight - 10);
        const w = 6 + Math.random() * 8;
        const d = 6 + Math.random() * 8;
        const offX = (Math.random() - 0.5) * (plinthWidth * 0.65);
        const offZ = (Math.random() - 0.5) * (plinthDepth * 0.65);

        // Building Box
        const towerGeo = new THREE.BoxGeometry(w, height, d);
        const towerMat = new THREE.MeshStandardMaterial({
          color: blockColor,
          roughness: 0.2,
          metalness: 0.8,
          emissive: windowEmissive,
          emissiveIntensity: 0.15,
        });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(offX, height / 2 + 1.2, offZ);
        tower.castShadow = true;
        tower.receiveShadow = true;
        zoneGroup.add(tower);

        // Architectural Roof Edge Frame
        const towerEdges = new THREE.EdgesGeometry(towerGeo);
        const towerEdgeMat = new THREE.LineBasicMaterial({
          color: windowEmissive,
          transparent: true,
          opacity: 0.5,
        });
        const towerWire = new THREE.LineSegments(towerEdges, towerEdgeMat);
        towerWire.position.copy(tower.position);
        zoneGroup.add(towerWire);

        // Tall Skyscraper Communications Spire Antenna
        if (height > 40 && i === 0) {
          const spireGeo = new THREE.CylinderGeometry(0.2, 0.4, 14, 8);
          const spireMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            metalness: 0.9,
            roughness: 0.1,
          });
          const spire = new THREE.Mesh(spireGeo, spireMat);
          spire.position.set(offX, height + 8, offZ);
          zoneGroup.add(spire);

          // Pulsing Beacon Light on Top of Spire
          const beaconGeo = new THREE.SphereGeometry(0.8, 12, 12);
          const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
          const beacon = new THREE.Mesh(beaconGeo, beaconMat);
          beacon.position.set(offX, height + 15, offZ);
          zoneGroup.add(beacon);
        }
      }

      // If Ecological Zone, populate with botanical canopy trees
      if (z.landUseClassification === 'ECOLOGICAL') {
        for (let t = 0; t < 12; t++) {
          const treeGroup = new THREE.Group();
          const treeX = (Math.random() - 0.5) * (plinthWidth * 0.8);
          const treeZ = (Math.random() - 0.5) * (plinthDepth * 0.8);

          // Trunk
          const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.6, 3, 6),
            new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 })
          );
          trunk.position.y = 1.5;
          treeGroup.add(trunk);

          // Foliage Cone
          const foliage = new THREE.Mesh(
            new THREE.ConeGeometry(2.2, 5, 7),
            new THREE.MeshStandardMaterial({
              color: 0x10b981,
              roughness: 0.6,
              emissive: 0x059669,
              emissiveIntensity: 0.2,
            })
          );
          foliage.position.y = 4.5;
          foliage.castShadow = true;
          treeGroup.add(foliage);

          treeGroup.position.set(treeX, 1.2, treeZ);
          zoneGroup.add(treeGroup);
        }
      }

      // Attach metadata for Raycasting
      zoneGroup.userData = {
        isEntity: true,
        entityType: 'ZONE',
        entityId: z.id,
        entityName: z.name,
        entityCode: z.code,
        details: `${z.landUseClassification} District · Density: ${z.densityPerSqKm}/km²`,
        rawZone: z,
      };

      scene.add(zoneGroup);
      interactiveObjects.push(zoneGroup);
    });

    // 10. Generate 3D Holographic Facility Markers
    const facilities = entities.filter(e => e.type === 'FACILITY') as FacilityEntity[];
    facilities.slice(0, 16).forEach(fac => {
      const facGroup = new THREE.Group();
      const fx = ((fac.coordinates.x - 500) / 400) * 120;
      const fz = ((fac.coordinates.y - 400) / 300) * 110;
      facGroup.position.set(fx, 15, fz);

      let pinColor = 0x38bdf8;
      if (fac.category === 'healthcare') pinColor = 0xf43f5e;
      else if (fac.category === 'education') pinColor = 0x3b82f6;
      else if (fac.category === 'transport') pinColor = 0x06b6d4;
      else if (fac.category === 'community') pinColor = 0xfbbf24;

      // Floating 3D Diamond / Octahedron Beacon
      const gemGeo = new THREE.OctahedronGeometry(2.4, 0);
      const gemMat = new THREE.MeshStandardMaterial({
        color: pinColor,
        metalness: 0.7,
        roughness: 0.2,
        emissive: pinColor,
        emissiveIntensity: 0.6,
      });
      const gemMesh = new THREE.Mesh(gemGeo, gemMat);
      facGroup.add(gemMesh);

      // Light Beam Stem
      const beamGeo = new THREE.CylinderGeometry(0.15, 0.15, 14, 6);
      const beamMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        transparent: true,
        opacity: 0.45,
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.y = -7;
      facGroup.add(beamMesh);

      facGroup.userData = {
        isEntity: true,
        entityType: 'FACILITY',
        entityId: fac.id,
        entityName: fac.name,
        entityCode: fac.id,
        details: `${fac.category.toUpperCase()} (${fac.facilityType}) · Capacity: ${fac.capacity} · Util: ${fac.currentUtilizationPct}%`,
      };

      scene.add(facGroup);
      interactiveObjects.push(facGroup);
    });

    interactiveObjectsRef.current = interactiveObjects;

    // 11. Volumetric Holographic Beacon for Active Scenario Zone
    const activeZone = zones.find(z => z.id === activeScenario?.zoneId);
    if (activeZone) {
      const beaconGroup = new THREE.Group();
      const ax = ((activeZone.coordinates.x - 500) / 400) * 120;
      const az = ((activeZone.coordinates.y - 400) / 300) * 110;
      beaconGroup.position.set(ax, 0, az);

      // Vertical Laser Pillar
      const cylinderGeo = new THREE.CylinderGeometry(8, 12, 100, 24, 1, true);
      const cylinderMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const cylinderMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
      cylinderMesh.position.y = 50;
      beaconGroup.add(cylinderMesh);

      // Rotating Hologram Rings
      const ringGeo = new THREE.TorusGeometry(14, 0.4, 8, 36);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.7,
      });
      const ring1 = new THREE.Mesh(ringGeo, ringMat);
      ring1.rotation.x = Math.PI / 2;
      ring1.position.y = 20;
      beaconGroup.add(ring1);

      const ring2 = new THREE.Mesh(ringGeo, ringMat);
      ring2.rotation.x = Math.PI / 2;
      ring2.position.y = 45;
      beaconGroup.add(ring2);

      scene.add(beaconGroup);
      holographicBeaconRef.current = beaconGroup;
    }

    // 11b. Interactive Location Focal Marker & Radar System
    const focalGroup = new THREE.Group();
    focalGroup.name = 'interactiveLocationFocalGroup';
    focalGroup.visible = false;

    // 1. Vertical Holographic Light Pillar
    const focalPillarGeo = new THREE.CylinderGeometry(1.2, 3.2, 110, 24, 1, true);
    const focalPillarMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const focalPillar = new THREE.Mesh(focalPillarGeo, focalPillarMat);
    focalPillar.position.y = 55;
    focalGroup.add(focalPillar);
    focalPillarMatRef.current = focalPillarMat;

    // 2. Concentric Expanding Ground Sonar Wave Rings
    const sonarRingGeo = new THREE.RingGeometry(1.8, 2.6, 32);
    const sonarRingMat1 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const sonarRing1 = new THREE.Mesh(sonarRingGeo, sonarRingMat1);
    sonarRing1.rotation.x = -Math.PI / 2;
    sonarRing1.position.y = 0.55;
    focalGroup.add(sonarRing1);
    sonarRing1Ref.current = sonarRing1;
    sonarRingMat1Ref.current = sonarRingMat1;

    const sonarRingMat2 = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    const sonarRing2 = new THREE.Mesh(sonarRingGeo, sonarRingMat2);
    sonarRing2.rotation.x = -Math.PI / 2;
    sonarRing2.position.y = 0.57;
    focalGroup.add(sonarRing2);
    sonarRing2Ref.current = sonarRing2;
    sonarRingMat2Ref.current = sonarRingMat2;

    // 3. Perimeter Inspection Boundary Circle
    const perimeterRingGeo = new THREE.RingGeometry(19.6, 20.4, 48);
    const perimeterRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const perimeterRing = new THREE.Mesh(perimeterRingGeo, perimeterRingMat);
    perimeterRing.rotation.x = -Math.PI / 2;
    perimeterRing.position.y = 0.52;
    focalGroup.add(perimeterRing);
    perimeterRingRef.current = perimeterRing;

    // 4. Hovering 3D Diamond / Beacon
    const beaconHeadMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
      metalness: 0.8,
      roughness: 0.2,
    });
    const beaconHead = new THREE.Mesh(new THREE.OctahedronGeometry(3.2, 0), beaconHeadMat);
    beaconHead.position.y = 26;
    focalGroup.add(beaconHead);
    beaconHeadRef.current = beaconHead;

    scene.add(focalGroup);
    focalMarkerGroupRef.current = focalGroup;

    // 12. Main Render & Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Auto-Orbit camera when idle & enabled
      if (isAutoOrbit && !isPointerDownRef.current) {
        orbitAngleRef.current.theta += autoOrbitSpeedRef.current;
      }

      // Smooth Orbit Camera Calculation
      const { theta, phi, radius } = orbitAngleRef.current;
      const target = targetLookAtRef.current;

      // Update focal marker animation & position based on focalPoint
      const currentFocal = focalPointRef.current;
      if (focalMarkerGroupRef.current) {
        if (currentFocal) {
          focalMarkerGroupRef.current.visible = true;
          const fx = ((currentFocal.coordinates.x - 500) / 400) * 120;
          const fz = ((currentFocal.coordinates.y - 400) / 300) * 110;
          focalMarkerGroupRef.current.position.set(fx, 0, fz);

          // Update theme color
          const hex = currentFocal.themeColor
            ? parseInt(currentFocal.themeColor.replace('#', '0x'))
            : 0x38bdf8;
          if (focalPillarMatRef.current) focalPillarMatRef.current.color.setHex(hex);
          if (sonarRingMat1Ref.current) sonarRingMat1Ref.current.color.setHex(hex);
          if (beaconHeadRef.current) {
            (beaconHeadRef.current.material as THREE.MeshStandardMaterial).color.setHex(hex);
            (beaconHeadRef.current.material as THREE.MeshStandardMaterial).emissive.setHex(hex);
          }

          // Animate expanding sonar rings
          const wave1 = (elapsedTime * 1.6) % 1.0;
          const wave2 = (elapsedTime * 1.6 + 0.5) % 1.0;
          const maxRadius = Math.max(14, (((currentFocal.radiusKm || 1.0) * 50) / 400) * 120);

          if (sonarRing1Ref.current && sonarRingMat1Ref.current) {
            sonarRing1Ref.current.scale.set(1 + wave1 * maxRadius, 1 + wave1 * maxRadius, 1);
            sonarRingMat1Ref.current.opacity = (1 - wave1) * 0.8;
          }
          if (sonarRing2Ref.current && sonarRingMat2Ref.current) {
            sonarRing2Ref.current.scale.set(1 + wave2 * maxRadius, 1 + wave2 * maxRadius, 1);
            sonarRingMat2Ref.current.opacity = (1 - wave2) * 0.6;
          }
          if (perimeterRingRef.current) {
            perimeterRingRef.current.scale.set(maxRadius / 20, maxRadius / 20, 1);
          }
          if (beaconHeadRef.current) {
            beaconHeadRef.current.rotation.y = elapsedTime * 2.5;
            beaconHeadRef.current.position.y = 28 + Math.sin(elapsedTime * 3.5) * 2;
          }

          // Smoothly glide camera target towards focal coordinates
          target.x += (fx - target.x) * 0.05;
          target.z += (fz - target.z) * 0.05;
          target.y += (6 - target.y) * 0.05;

          const targetRadius = Math.max(90, Math.min(180, (currentFocal.radiusKm || 1) * 45 + 75));
          orbitAngleRef.current.radius += (targetRadius - orbitAngleRef.current.radius) * 0.04;
        } else {
          focalMarkerGroupRef.current.visible = false;
          // Return smoothly to center of city
          target.x += (0 - target.x) * 0.03;
          target.z += (0 - target.z) * 0.03;
          target.y += (5 - target.y) * 0.03;
        }
      }

      const camX = target.x + radius * Math.sin(phi) * Math.sin(theta);
      const camY = target.y + radius * Math.cos(phi);
      const camZ = target.z + radius * Math.sin(phi) * Math.cos(theta);

      camera.position.set(camX, camY, camZ);
      camera.lookAt(target);

      // Rotate and pulse active holographic beacon
      if (holographicBeaconRef.current) {
        holographicBeaconRef.current.rotation.y = elapsedTime * 0.8;
      }

      // Float and rotate facility gems
      interactiveObjects.forEach(obj => {
        if (obj.userData?.entityType === 'FACILITY') {
          obj.rotation.y = elapsedTime * 1.5;
          obj.position.y = 15 + Math.sin(elapsedTime * 3 + obj.position.x) * 1.2;
        }
      });

      // Animate traffic stream particles
      trafficParticles.forEach((points, idx) => {
        const posAttr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
        const array = posAttr.array as Float32Array;
        const speed = (idx + 1) * 0.4;
        for (let i = 0; i < array.length / 3; i++) {
          if (idx === 0) {
            array[i * 3] += speed;
            if (array[i * 3] > 140) array[i * 3] = -140;
          } else if (idx === 1) {
            array[i * 3] -= speed;
            if (array[i * 3] < -140) array[i * 3] = 140;
          } else {
            array[i * 3 + 2] += speed;
            if (array[i * 3 + 2] > 140) array[i * 3 + 2] = -140;
          }
        }
        posAttr.needsUpdate = true;
      });

      renderer.render(scene, camera);
    };

    animate();

    // 13. Window Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 520;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [entities, activeScenario, selectedZoneId, isAutoOrbit]);

  // Handle Raycasting for Hover & Click Interactions
  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If dragging to orbit/pan, update camera angles
    if (isPointerDownRef.current) {
      const deltaX = e.clientX - pointerStartRef.current.x;
      const deltaY = e.clientY - pointerStartRef.current.y;
      pointerStartRef.current = { x: e.clientX, y: e.clientY };

      if (pointerButtonRef.current === 0) {
        // Orbit rotation
        orbitAngleRef.current.theta -= deltaX * 0.006;
        orbitAngleRef.current.phi = Math.max(
          0.05,
          Math.min(Math.PI / 2.05, orbitAngleRef.current.phi - deltaY * 0.006)
        );
      } else {
        // Pan
        targetLookAtRef.current.x -= deltaX * 0.2;
        targetLookAtRef.current.z -= deltaY * 0.2;
      }
      return;
    }

    // Raycast hover detection
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    if (!canvas || !camera) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const intersects = raycaster.intersectObjects(interactiveObjectsRef.current, true);

    if (intersects.length > 0) {
      let topObject: THREE.Object3D | null = intersects[0].object;
      while (topObject && !topObject.userData?.isEntity && topObject.parent) {
        topObject = topObject.parent;
      }

      if (topObject && topObject.userData?.isEntity) {
        setHoveredInfo({
          name: topObject.userData.entityName,
          type: topObject.userData.entityType,
          code: topObject.userData.entityCode,
          details: topObject.userData.details,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        return;
      }
    }

    setHoveredInfo(null);
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = true;
    pointerButtonRef.current = e.button;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    if (!canvas || !camera) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    // 1. If in "Pick on Map" mode, intersect with ground mesh to place pin
    if (isPickModeRef.current && onPickCoordsRef.current) {
      const ground = groundMeshRef.current;
      if (ground) {
        const hits = raycaster.intersectObject(ground);
        if (hits.length > 0) {
          const pt = hits[0].point;
          const mapX = Math.round(((pt.x / 120) * 400) + 500);
          const mapY = Math.round(((pt.z / 110) * 300) + 400);
          const clampedX = Math.max(20, Math.min(980, mapX));
          const clampedY = Math.max(20, Math.min(760, mapY));
          onPickCoordsRef.current(clampedX, clampedY);
          return;
        }
      }
    }

    const intersects = raycaster.intersectObjects(interactiveObjectsRef.current, true);
    if (intersects.length > 0) {
      let topObject: THREE.Object3D | null = intersects[0].object;
      while (topObject && !topObject.userData?.isEntity && topObject.parent) {
        topObject = topObject.parent;
      }

      if (topObject && topObject.userData?.isEntity) {
        const { entityId, entityType, rawZone } = topObject.userData;
        if (entityType === 'ZONE' && rawZone && onSelectZone) {
          onSelectZone(rawZone);
        }
        if (entityId) {
          setSelectedEntityId(entityId);
          if (onSelectEntity) onSelectEntity(entityId);
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    orbitAngleRef.current.radius = Math.max(
      80,
      Math.min(480, orbitAngleRef.current.radius + e.deltaY * 0.15)
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/9] min-h-[460px] max-h-[640px] rounded-2xl overflow-hidden bg-[#040814] border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] select-none group"
    >
      {/* Three.js Canvas Element */}
      <canvas
        ref={canvasRef}
        onMouseMove={handlePointerMove}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        onContextMenu={e => e.preventDefault()}
        className={`w-full h-full ${isPickMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'} block`}
      />

      {/* Cinematic HUD Overlay Top Bar */}
      <div className="absolute top-3.5 inset-x-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-10">
        {/* Left Badge: 3D Twin Status & Active Focus Badge */}
        <div className="flex items-center gap-2">
          <div className="pointer-events-auto bg-slate-950/80 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            <span className="font-display text-xs font-bold text-white tracking-wide">
              REAL-TIME 3D DIGITAL TWIN
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300 font-mono text-[11px]">WebGL Active</span>
          </div>

          {focalPoint && (
            <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-xl border border-cyan-500/50 px-3 py-1.5 rounded-xl shadow-lg hidden sm:flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span className="font-display text-xs font-bold text-white tracking-wide truncate max-w-[180px]">
                {focalPoint.name}
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-800">
                X:{focalPoint.coordinates.x} Y:{focalPoint.coordinates.y}
              </span>
            </div>
          )}
        </div>

        {/* Right Controls: Camera Presets & Lighting */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Time of Day Lighting Toggle */}
          <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 p-0.5 rounded-xl flex items-center shadow-lg">
            <button
              onClick={() => {
                setTimeOfDay('midnight');
                applyLightingPreset('midnight');
              }}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                timeOfDay === 'midnight'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Midnight Cyberpunk Lighting"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setTimeOfDay('dusk');
                applyLightingPreset('dusk');
              }}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                timeOfDay === 'dusk'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Dusk Golden Hour Lighting"
            >
              <Sunset className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setTimeOfDay('daylight');
                applyLightingPreset('daylight');
              }}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                timeOfDay === 'daylight'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Architectural Daylight Studio"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Camera Perspective Angle Switcher */}
          <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 p-0.5 rounded-xl flex items-center shadow-lg">
            <button
              onClick={() => setCameraPreset('cinematic')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                cameraView === 'cinematic'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              45° ISOMETRIC
            </button>
            <button
              onClick={() => setCameraPreset('skyline')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                cameraView === 'skyline'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              SKYLINE
            </button>
            <button
              onClick={() => setCameraPreset('topdown')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                cameraView === 'topdown'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              RADAR
            </button>
          </div>

          {/* Auto-Orbit Cinematic Cam Tour Button */}
          <button
            onClick={() => setIsAutoOrbit(!isAutoOrbit)}
            className={`btn-3d-secondary px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 ${
              isAutoOrbit ? 'text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]' : 'text-slate-400'
            }`}
            title="Toggle Cinematic Auto-Orbit Cam"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isAutoOrbit ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline font-semibold">{isAutoOrbit ? 'ORBITING' : 'TOUR'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Raycast Hover Tooltip Card */}
      {hoveredInfo && (
        <div
          style={{
            left: `${Math.min(hoveredInfo.x + 16, (containerRef.current?.clientWidth || 800) - 260)}px`,
            top: `${Math.max(hoveredInfo.y - 80, 20)}px`,
          }}
          className="absolute z-20 pointer-events-none bg-slate-950/90 backdrop-blur-2xl border border-cyan-500/50 rounded-xl p-3 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.9)] max-w-xs animate-in fade-in text-xs space-y-1"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] text-cyan-300 font-bold">{hoveredInfo.code}</span>
            <span className="text-[10px] text-slate-400 uppercase font-medium">{hoveredInfo.type}</span>
          </div>
          <h4 className="font-display font-bold text-white text-sm leading-tight">{hoveredInfo.name}</h4>
          {hoveredInfo.details && <p className="text-slate-300 text-[11px] leading-relaxed">{hoveredInfo.details}</p>}
          <div className="pt-1 text-[10px] text-cyan-400 font-medium flex items-center gap-1">
            <span>Click to inspect entity dossier</span>
            <span>→</span>
          </div>
        </div>
      )}

      {/* Cinematic Navigation Help Footer Strip */}
      <div className="absolute bottom-3 inset-x-4 flex items-center justify-between text-[11px] text-slate-400 pointer-events-none z-10">
        <div className="bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5 flex items-center gap-3">
          <span>Drag: Orbit</span>
          <span>·</span>
          <span>Right-Click: Pan</span>
          <span>·</span>
          <span>Scroll: Zoom</span>
          <span>·</span>
          <span>Click: Inspect</span>
        </div>

        {activeScenario && (
          <div className="bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-lg border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Pulsing beacon highlights active proposal zone</span>
          </div>
        )}
      </div>
    </div>
  );
};
