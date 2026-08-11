"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { ContactShadows, Float } from "@react-three/drei";
import { Suspense, useLayoutEffect, useRef } from "react";
import * as THREE from "three";

/** Ballon ProDay — échelle contenue pour ne pas saturer le cadre. */
function EmblemBall() {
  const [map, bumpMap, logoBadge] = useLoader(THREE.TextureLoader, [
    "/textures/soccer_ball.png?v=2",
    "/textures/soccer_ball_bump.png?v=2",
    "/textures/soccer_logo_badge.png?v=4",
  ]);
  const ref = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    bumpMap.anisotropy = 8;
    logoBadge.colorSpace = THREE.SRGBColorSpace;
  }, [map, bumpMap, logoBadge]);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.45;
  });

  return (
    <group ref={ref} position={[0, 0.05, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.42, 64, 64]} />
        <meshPhysicalMaterial
          map={map}
          bumpMap={bumpMap}
          bumpScale={0.028}
          roughness={0.5}
          clearcoat={0.3}
        />
      </mesh>
      <mesh position={[0, 0.015, 0.42]} renderOrder={2}>
        <circleGeometry args={[0.12, 48]} />
        <meshStandardMaterial
          map={logoBadge}
          transparent
          alphaTest={0.02}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/** Anneau derrière le ballon — jamais devant. */
function FemaleEmblem({ active }: { active: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.z += dt * 0.28;
  });
  return (
    <group>
      <mesh ref={ring} position={[0, 0.05, -0.55]} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[0.88, 0.02, 12, 64]} />
        <meshStandardMaterial
          color="#7DD3C7"
          emissive="#7DD3C7"
          emissiveIntensity={active ? 0.4 : 0.18}
          transparent
          opacity={0.9}
        />
      </mesh>
      <Float speed={1.2} floatIntensity={0.18} rotationIntensity={0.1}>
        <EmblemBall />
      </Float>
    </group>
  );
}

/** Piliers en orbite large — hors collision avec le ballon. */
function MaleEmblem({ active }: { active: boolean }) {
  const orbit = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (orbit.current) orbit.current.rotation.y += dt * 0.32;
  });
  return (
    <group>
      <group ref={orbit} position={[0, 0, -0.35]}>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + 0.2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 1.05, -0.08, Math.sin(a) * 0.7]}
              castShadow
            >
              <boxGeometry args={[0.07, 0.26, 0.07]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? "#0054F0" : "#64748b"}
                metalness={0.4}
                roughness={0.35}
                emissive="#0054F0"
                emissiveIntensity={active ? 0.2 : 0.06}
              />
            </mesh>
          );
        })}
      </group>
      <Float speed={1} floatIntensity={0.15} rotationIntensity={0.15}>
        <EmblemBall />
      </Float>
    </group>
  );
}

type Props = {
  gender: "female" | "male";
  active?: boolean;
  className?: string;
};

/** Emblème 3D isolé, cadré, sans chevauchement interne. */
export function GenderEmblemCanvas({
  gender,
  active = false,
  className,
}: Props) {
  const accent = gender === "female" ? "#7DD3C7" : "#4C8BFF";
  return (
    <div className={`relative h-full w-full min-h-0 ${className ?? ""}`}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.2, 2.55], fov: 34, near: 0.1, far: 20 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[2.5, 3.5, 2]} intensity={1.15} color="#fff6ea" />
          <directionalLight position={[-2, 1, -1]} intensity={0.4} color={accent} />
          {gender === "female" ? (
            <FemaleEmblem active={active} />
          ) : (
            <MaleEmblem active={active} />
          )}
          <ContactShadows
            position={[0, -0.72, 0]}
            opacity={0.35}
            scale={5}
            blur={2.2}
            far={2.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
