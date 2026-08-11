"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import type { Group } from "three";
import * as THREE from "three";

const LIME = "#c8f000";
const LIME_DARK = "#9fc000";

/** Rounded triangular prism ≈ Veo body. */
function VeoBody() {
  const shape = new THREE.Shape();
  const r = 0.42;
  const corner = 0.12;
  // Equilateral-ish rounded triangle in XY
  const pts = [
    new THREE.Vector2(0, r),
    new THREE.Vector2(-r * 0.92, -r * 0.55),
    new THREE.Vector2(r * 0.92, -r * 0.55),
  ];
  shape.moveTo(pts[0]!.x, pts[0]!.y - corner);
  for (let i = 0; i < 3; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % 3]!;
    shape.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.38,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 4,
    curveSegments: 12,
  });
  geo.center();

  return (
    <mesh geometry={geo} rotation={[Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color={LIME} metalness={0.15} roughness={0.45} />
    </mesh>
  );
}

function Lens({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <circleGeometry args={[0.13, 28]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[0.055, 20]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0.04, 0.02, 0.015]}>
        <circleGeometry args={[0.035, 16]} />
        <meshStandardMaterial color="#111" metalness={0.7} roughness={0.15} />
      </mesh>
    </group>
  );
}

function VeoCameraMesh() {
  const group = useRef<Group>(null);

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.y += dt * 0.4;
  });

  return (
    <Float speed={1.3} rotationIntensity={0.15} floatIntensity={0.22}>
      <group ref={group} position={[0, -0.55, 0]} scale={1.15}>
        {/* Mast */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.035, 0.04, 1.35, 16]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.55} roughness={0.35} />
        </mesh>
        {/* Mount */}
        <mesh position={[0, 1.05, 0]}>
          <boxGeometry args={[0.12, 0.08, 0.12]} />
          <meshStandardMaterial color="#111" metalness={0.5} roughness={0.4} />
        </mesh>

        <group position={[0, 1.35, 0]} scale={0.95}>
          <VeoBody />
          <Lens position={[0.12, 0.06, 0.22]} />
          <Lens position={[-0.14, -0.04, 0.2]} />
          {/* Side accent face color */}
          <mesh position={[0, 0, -0.2]} rotation={[0, Math.PI, 0]}>
            <circleGeometry args={[0.08, 20]} />
            <meshStandardMaterial color={LIME_DARK} metalness={0.1} roughness={0.5} />
          </mesh>
        </group>
      </group>
    </Float>
  );
}

/** Optional WebGL Veo : lime triangular body on black mast. */
export function VeoCameraScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [1.2, 1.1, 2.4], fov: 34, near: 0.1, far: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      className="!absolute inset-0 h-full w-full"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.9} />
        <hemisphereLight args={["#ffffff", "#87a0b8", 0.65]} />
        <directionalLight position={[3, 4, 2]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-2, 2, -1]} intensity={0.5} color="#c8f000" />
        <VeoCameraMesh />
      </Suspense>
    </Canvas>
  );
}
