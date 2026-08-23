"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { ContactShadows, Float } from "@react-three/drei";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type {
  JoueurPositionGroup,
  JoueurSceneKind,
} from "@/lib/joueurExperienceTheme";

function TexturedBall({ scale = 1 }: { scale?: number }) {
  const [map, bumpMap, logoBadge] = useLoader(THREE.TextureLoader, [
    "/textures/soccer_ball.png?v=2",
    "/textures/soccer_ball_bump.png?v=2",
    "/textures/soccer_logo_badge.png?v=4",
  ]);

  useLayoutEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    bumpMap.anisotropy = 8;
    logoBadge.colorSpace = THREE.SRGBColorSpace;
    logoBadge.anisotropy = 8;
  }, [map, bumpMap, logoBadge]);

  return (
    <group scale={scale}>
      <mesh castShadow>
        <sphereGeometry args={[0.72, 96, 96]} />
        <meshPhysicalMaterial
          map={map}
          bumpMap={bumpMap}
          bumpScale={0.035}
          roughness={0.5}
          metalness={0}
          clearcoat={0.3}
          clearcoatRoughness={0.42}
        />
      </mesh>
      <mesh position={[0, 0.02, 0.72]} renderOrder={2}>
        <circleGeometry args={[0.2, 64]} />
        <meshStandardMaterial
          map={logoBadge}
          transparent
          alphaTest={0.02}
          depthWrite={false}
          roughness={0.45}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

function GateOrbit({ accent }: { accent: string }) {
  const ring = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.y += dt * 0.22;
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 0]} receiveShadow>
        <circleGeometry args={[2.4, 64]} />
        <meshStandardMaterial color="#0a3d1f" roughness={0.9} />
      </mesh>
      <group ref={ring}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 1.55, -0.2 + Math.sin(i) * 0.06, Math.sin(a) * 1.55]}
              castShadow
            >
              <sphereGeometry args={[0.08, 24, 24]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? accent : "#fbbf24"}
                emissive={i % 2 === 0 ? accent : "#fbbf24"}
                emissiveIntensity={0.35}
              />
            </mesh>
          );
        })}
      </group>
      <Float speed={1.4} rotationIntensity={0.28} floatIntensity={0.4}>
        <group position={[0, -0.05, 0]}>
          <TexturedBall scale={0.95} />
        </group>
      </Float>
    </group>
  );
}

function YouthScene({ accent }: { accent: string }) {
  const stars = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (stars.current) stars.current.rotation.y += dt * 0.15;
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.85, 0]} receiveShadow>
        <planeGeometry args={[3.4, 2.4]} />
        <meshStandardMaterial color="#166534" roughness={0.85} />
      </mesh>
      {/* Étoiles en orbite haute — hors du volume du ballon */}
      <group ref={stars} position={[0, 0.55, 0]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.35, Math.sin(a * 1.2) * 0.12, Math.sin(a) * 1.35]}>
              <octahedronGeometry args={[0.1, 0]} />
              <meshStandardMaterial
                color="#facc15"
                emissive="#facc15"
                emissiveIntensity={0.5}
              />
            </mesh>
          );
        })}
      </group>
      <Float speed={1.6} floatIntensity={0.35} rotationIntensity={0.2}>
        <group position={[0, -0.05, 0]}>
          <TexturedBall scale={0.78} />
        </group>
      </Float>
      <mesh position={[1.15, -0.35, 0.55]}>
        <torusGeometry args={[0.22, 0.035, 12, 32]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function TeenScene({ accent }: { accent: string }) {
  const spin = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.z += dt * 0.55;
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2.5, 0.2, 0]} position={[0, -0.7, 0]} receiveShadow>
        <planeGeometry args={[3.6, 2.6]} />
        <meshStandardMaterial color="#052e1a" roughness={0.65} metalness={0.15} />
      </mesh>
      {/* Anneaux larges derrière le ballon */}
      <group ref={spin} position={[0, 0.1, -0.55]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.35, 0.02, 8, 80]} />
          <meshBasicMaterial color={accent} transparent opacity={0.7} />
        </mesh>
        <mesh rotation={[Math.PI / 2.4, 0.5, 0]}>
          <torusGeometry args={[1.0, 0.015, 8, 80]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.55} />
        </mesh>
      </group>
      {/* Barres à gauche — zone distincte du ballon */}
      {[0.4, 0.65, 0.9].map((h, i) => (
        <mesh key={i} position={[-1.35 + i * 0.28, -0.35 + h / 2, 0.55]}>
          <boxGeometry args={[0.12, h, 0.12]} />
          <meshStandardMaterial color={i === 2 ? accent : "#67e8f9"} metalness={0.5} />
        </mesh>
      ))}
      <Float speed={1.8} rotationIntensity={0.3} floatIntensity={0.3}>
        <group position={[0.45, 0, 0.15]}>
          <TexturedBall scale={0.82} />
        </group>
      </Float>
    </group>
  );
}

function AdultScene({ accent }: { accent: string }) {
  const cells = useMemo(() => {
    const out: { x: number; z: number; o: number }[] = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        out.push({
          x: -1.35 + c * 0.55,
          z: -0.95 + r * 0.38,
          o: 0.12 + ((r + c) % 4) * 0.1,
        });
      }
    }
    return out;
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2.15, 0, 0]} position={[0, -0.75, 0]} receiveShadow>
        <planeGeometry args={[3.4, 2.4]} />
        <meshStandardMaterial color="#0f172a" roughness={0.45} metalness={0.35} />
      </mesh>
      {cells.map((cell, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2.15, 0, 0]}
          position={[cell.x, -0.73, cell.z]}
        >
          <planeGeometry args={[0.42, 0.26]} />
          <meshBasicMaterial color={accent} transparent opacity={cell.o} />
        </mesh>
      ))}
      {/* Colonnes à gauche — ballon à droite */}
      {[0.35, 0.55, 0.8, 0.45, 0.65].map((h, i) => (
        <mesh key={i} position={[-1.4 + i * 0.32, -0.45 + h / 2, 0.7]}>
          <boxGeometry args={[0.1, h, 0.1]} />
          <meshStandardMaterial
            color={i === 2 ? accent : "#94a3b8"}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>
      ))}
      <Float speed={0.9} rotationIntensity={0.1} floatIntensity={0.18}>
        <group position={[0.85, 0.05, 0.1]} scale={0.72}>
          <TexturedBall />
        </group>
      </Float>
    </group>
  );
}

function SceneBody({
  kind,
  accent,
  position,
}: {
  kind: JoueurSceneKind | "gate";
  accent: string;
  position?: JoueurPositionGroup;
}) {
  if (kind === "gate") return <GateOrbit accent={accent} />;
  if (kind === "pitch_playful") return <YouthScene accent={accent} />;
  if (kind === "pitch_dynamic") return <TeenScene accent={accent} />;
  return <AdultScene accent={accent} />;
}

type Props = {
  kind: JoueurSceneKind | "gate";
  accent?: string;
  position?: JoueurPositionGroup;
  className?: string;
  intensity?: "soft" | "medium" | "high";
};

/** Full-bleed WebGL stage for Joueur world (gate + universes). */
export function JoueurWorldCanvas({
  kind,
  accent = "#1E3AFF",
  position,
  className,
  intensity = "medium",
}: Props) {
  const camZ = kind === "gate" ? 4.2 : 3.6;
  return (
    <div className={`relative h-full w-full min-h-0 ${className ?? ""}`}>
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0.55, camZ], fov: 36, near: 0.1, far: 50 }}
        shadows
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMappingExposure = intensity === "high" ? 1.15 : 1.05;
        }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.32} />
          <hemisphereLight args={["#e2e8f0", "#020617", 0.5]} />
          <directionalLight
            castShadow
            position={[3.5, 5, 2]}
            intensity={1.4}
            color="#fff7ed"
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-3, 2, -2]} intensity={0.55} color={accent} />
          <pointLight position={[0, 1.5, 1]} intensity={0.4} color={accent} />
          <SceneBody kind={kind} accent={accent} position={position} />
          <ContactShadows
            position={[0, -0.95, 0]}
            opacity={0.45}
            scale={10}
            blur={2.6}
            far={5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
