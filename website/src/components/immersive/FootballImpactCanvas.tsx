"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useMotionValueEvent, type MotionValue } from "framer-motion";
import {
  Suspense,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";
import * as THREE from "three";

type Props = {
  progress: MotionValue<number>;
};

function Football({ impactRef }: { impactRef: MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const [map, bumpMap, logoBadge] = useLoader(THREE.TextureLoader, [
    "/textures/soccer_ball.png?v=2",
    "/textures/soccer_ball_bump.png?v=2",
    "/textures/soccer_logo_badge.png?v=4",
  ]);
  const t0 = useRef(0);

  useLayoutEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    bumpMap.anisotropy = 8;
    logoBadge.colorSpace = THREE.SRGBColorSpace;
    logoBadge.anisotropy = 8;
  }, [map, bumpMap, logoBadge]);

  useFrame((_, dt) => {
    if (!group.current) return;
    const p = impactRef.current;
    t0.current += dt;

    let y: number;
    let squash = 1;
    // No idle yaw — keep the ProDay badge facing the camera until impact
    const spin = THREE.MathUtils.smoothstep(p, 0.48, 1) * Math.PI * 1.65;

    if (p < 0.45) {
      y = 1.2 + Math.sin(t0.current * 0.9) * 0.03;
    } else if (p < 0.62) {
      const t = (p - 0.45) / 0.17;
      y = THREE.MathUtils.lerp(1.2, 0.52, t * t * (3 - 2 * t));
    } else {
      const after = p - 0.62;
      y =
        0.52 +
        Math.exp(-after * 5.5) * Math.sin(after * Math.PI * 3.8) * 0.12;
      const hit = THREE.MathUtils.smoothstep(after, 0, 0.028);
      const recover = THREE.MathUtils.smoothstep(after, 0.03, 0.16);
      squash = THREE.MathUtils.lerp(1, 0.86, hit * (1 - recover));
    }

    const widen = 1 / Math.sqrt(Math.max(0.75, squash));
    group.current.position.set(0, y, 0);
    group.current.rotation.set(spin * 0.18, spin, 0);
    group.current.scale.set(widen, squash, widen);
  });

  return (
    <group ref={group}>
      <mesh castShadow>
        <sphereGeometry args={[0.52, 128, 128]} />
        <meshPhysicalMaterial
          map={map}
          bumpMap={bumpMap}
          bumpScale={0.035}
          roughness={0.52}
          metalness={0}
          clearcoat={0.28}
          clearcoatRoughness={0.45}
        />
      </mesh>
      {/* Brand badge glued to the camera-facing panel */}
      <mesh position={[0, 0.015, 0.522]} scale={[1, 1, 1]} renderOrder={2}>
        <circleGeometry args={[0.175, 64]} />
        <meshStandardMaterial
          map={logoBadge}
          transparent
          alphaTest={0.02}
          depthWrite={false}
          roughness={0.45}
          metalness={0}
          polygonOffset
          polygonOffsetFactor={-8}
        />
      </mesh>
    </group>
  );
}

function Pitch({ impactRef }: { impactRef: MutableRefObject<number> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const colorMap = useLoader(THREE.TextureLoader, "/textures/grass_color.jpg");
  const normalMap = useLoader(THREE.TextureLoader, "/textures/grass_normal.jpg");
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(16, 16, 96, 96);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const normalScale = useMemo(() => new THREE.Vector2(0.5, 0.5), []);

  useLayoutEffect(() => {
    for (const t of [colorMap, normalMap]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(5.5, 5.5);
      t.anisotropy = 8;
    }
    colorMap.colorSpace = THREE.SRGBColorSpace;
  }, [colorMap, normalMap]);

  useFrame(() => {
    if (!mesh.current) return;
    const p = impactRef.current;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const strength = THREE.MathUtils.smoothstep(p, 0.6, 0.85) * 0.24;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      pos.setY(i, -Math.exp(-dist * dist * 1.9) * strength);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <mesh ref={mesh} geometry={geo} receiveShadow>
      <meshStandardMaterial
        map={colorMap}
        normalMap={normalMap}
        normalScale={normalScale}
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
}

function Markings() {
  return (
    <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[1.65, 1.71, 96]} />
        <meshBasicMaterial color="#e8e8e0" transparent opacity={0.22} />
      </mesh>
      <mesh>
        <planeGeometry args={[0.03, 16]} />
        <meshBasicMaterial color="#e8e8e0" transparent opacity={0.16} />
      </mesh>
    </group>
  );
}

function CameraRig({ progress }: { progress: MotionValue<number> }) {
  const { camera } = useThree();
  const pRef = useRef(0);
  useMotionValueEvent(progress, "change", (v) => {
    pRef.current = v;
  });
  useFrame(() => {
    const p = pRef.current;
    camera.position.lerp(
      new THREE.Vector3(
        THREE.MathUtils.lerp(0.4, 0.08, p),
        THREE.MathUtils.lerp(1.65, 1.3, p),
        THREE.MathUtils.lerp(4.5, 3.4, p),
      ),
      0.08,
    );
    camera.lookAt(0, 0.55, 0);
  });
  return null;
}

function Scene({ progress }: Props) {
  const impactRef = useRef(0);
  useMotionValueEvent(progress, "change", (v) => {
    impactRef.current = v;
  });
  useLayoutEffect(() => {
    impactRef.current = progress.get();
  }, [progress]);

  return (
    <>
      <color attach="background" args={["#07100c"]} />
      <fog attach="fog" args={["#07100c", 10, 24]} />
      <ambientLight intensity={0.38} />
      <hemisphereLight args={["#a8b4c8", "#14301c", 0.6]} />
      <spotLight
        castShadow
        position={[4.5, 8, 3]}
        angle={0.48}
        penumbra={0.5}
        intensity={2.8}
        color="#fff3e0"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      <spotLight
        position={[-4, 6, -2]}
        angle={0.55}
        penumbra={0.5}
        intensity={1.25}
        color="#dbe4ff"
      />
      <pointLight position={[0, 2.4, 2.2]} intensity={0.4} color="#ffffff" />
      <Football impactRef={impactRef} />
      <Pitch impactRef={impactRef} />
      <Markings />
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.6}
        scale={12}
        blur={2.5}
        far={5}
      />
      <CameraRig progress={progress} />
    </>
  );
}

export function FootballImpactCanvas({ progress }: Props) {
  return (
    <Canvas
      className="!h-full !w-full"
      style={{ width: "100%", height: "100%", display: "block" }}
      shadows
      camera={{ position: [0.4, 1.65, 4.5], fov: 35, near: 0.1, far: 50 }}
      dpr={[1, 1.6]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#07100c", 1);
        gl.toneMappingExposure = 1.08;
      }}
    >
      <Suspense fallback={null}>
        <Scene progress={progress} />
      </Suspense>
    </Canvas>
  );
}
