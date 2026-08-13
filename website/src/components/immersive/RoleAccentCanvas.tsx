"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { ContactShadows, Float } from "@react-three/drei";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { RoleVisualId } from "@/lib/roleVisuals";
import { getPoleBrandColors } from "@/lib/brandColors";
import type {
  JoueurPositionGroup,
  JoueurSceneKind,
} from "@/lib/joueurExperienceTheme";

function accentForRole(role: RoleVisualId): string {
  switch (role) {
    case "supporter":
      return getPoleBrandColors("supporter").accent;
    case "sante":
      return getPoleBrandColors("sante").accent;
    case "pro_club":
      return getPoleBrandColors("pro_club").accent;
    case "coach":
    case "pro_staff":
      return getPoleBrandColors("coach").accent;
    case "evenements":
      return getPoleBrandColors("evenements").accent;
    case "sponsor":
      return getPoleBrandColors("sponsor").accent;
    case "parent":
      return getPoleBrandColors("parent").accent;
    default:
      return getPoleBrandColors("joueur").accent;
  }
}

function SlowYaw({
  children,
  speed = 0.12,
}: {
  children: React.ReactNode;
  speed?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * speed;
  });
  return <group ref={ref}>{children}</group>;
}

/** Textured football : same assets as homepage impact canvas. */
function TexturedBall({ showBadge = true }: { showBadge?: boolean }) {
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
    <group>
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
      {showBadge ? (
        <mesh position={[0, 0.02, 0.72]} renderOrder={2}>
          <circleGeometry args={[0.2, 64]} />
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
      ) : null}
    </group>
  );
}

function ScarfRibbon({ color }: { color: string }) {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.1, 0.35, 0.2),
        new THREE.Vector3(-0.45, 0.55, -0.15),
        new THREE.Vector3(0.15, 0.25, 0.25),
        new THREE.Vector3(0.7, -0.15, -0.05),
        new THREE.Vector3(1.05, -0.55, 0.15),
      ]),
    [],
  );
  const tube = useMemo(
    () => new THREE.TubeGeometry(curve, 64, 0.085, 16, false),
    [curve],
  );

  return (
    <group rotation={[0.15, 0.35, -0.1]}>
      <mesh geometry={tube} castShadow>
        <meshPhysicalMaterial
          color={color}
          roughness={0.72}
          metalness={0.05}
          clearcoat={0.08}
        />
      </mesh>
      <mesh position={[-1.05, 0.2, 0.25]} castShadow>
        <boxGeometry args={[0.12, 0.42, 0.06]} />
        <meshStandardMaterial color="#111" roughness={0.65} />
      </mesh>
      <mesh position={[1.0, -0.7, 0.18]} castShadow>
        <boxGeometry args={[0.12, 0.42, 0.06]} />
        <meshStandardMaterial color="#111" roughness={0.65} />
      </mesh>
    </group>
  );
}

function MedicalCross({ color }: { color: string }) {
  return (
    <group rotation={[0.2, 0.45, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.28, 1.15, 0.18]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.55}
          roughness={0.22}
          clearcoat={0.55}
          clearcoatRoughness={0.2}
        />
      </mesh>
      <mesh castShadow>
        <boxGeometry args={[1.15, 0.28, 0.18]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.55}
          roughness={0.22}
          clearcoat={0.55}
          clearcoatRoughness={0.2}
        />
      </mesh>
    </group>
  );
}

function TrophyCup({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.48, 0.62, 48]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.85}
          roughness={0.18}
          clearcoat={0.7}
          clearcoatRoughness={0.15}
        />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.34, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.85}
          roughness={0.18}
          clearcoat={0.7}
          clearcoatRoughness={0.15}
        />
      </mesh>
      <mesh position={[-0.48, 0.48, 0]} rotation={[0, 0, 0.65]} castShadow>
        <torusGeometry args={[0.2, 0.035, 12, 32, Math.PI]} />
        <meshPhysicalMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.48, 0.48, 0]} rotation={[0, 0, -0.65]} castShadow>
        <torusGeometry args={[0.2, 0.035, 12, 32, Math.PI]} />
        <meshPhysicalMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.18, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 0.28, 24]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.45} metalness={0.3} />
      </mesh>
      <mesh position={[0, -0.4, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.36, 0.08, 48]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.45} metalness={0.3} />
      </mesh>
    </group>
  );
}

function TacticsBoard({ color }: { color: string }) {
  const pins: [number, number, number, string][] = [
    [-0.42, 0.22, 0.05, color],
    [0.08, 0.3, 0.05, color],
    [0.4, 0.1, 0.05, color],
    [-0.18, -0.2, 0.05, color],
    [0.22, -0.28, 0.05, "#ffffff"],
  ];
  return (
    <group rotation={[-0.55, 0.5, 0.08]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.55, 1.05, 0.06]} />
        <meshStandardMaterial color="#0a1810" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.032]}>
        <planeGeometry args={[1.35, 0.012]} />
        <meshBasicMaterial color="#ffffff28" />
      </mesh>
      <mesh position={[0, 0, 0.032]} rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[0.9, 0.012]} />
        <meshBasicMaterial color="#ffffff1f" />
      </mesh>
      {pins.map(([x, y, z, c], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[0.055, 20, 20]} />
          <meshPhysicalMaterial color={c} metalness={0.2} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function EventTicket({ color }: { color: string }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const w = 1.45;
    const h = 0.78;
    const r = 0.06;
    const notch = 0.09;
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, -notch);
    s.absarc(w / 2, 0, notch, -Math.PI / 2, Math.PI / 2, true);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, notch);
    s.absarc(-w / 2, 0, notch, Math.PI / 2, -Math.PI / 2, true);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return s;
  }, []);

  return (
    <group rotation={[0.35, 0.55, -0.12]}>
      <mesh castShadow>
        <extrudeGeometry
          args={[shape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 }]}
        />
        <meshPhysicalMaterial
          color="#121212"
          roughness={0.45}
          metalness={0.15}
          clearcoat={0.2}
        />
      </mesh>
      <mesh position={[0, 0.12, 0.045]}>
        <planeGeometry args={[1.05, 0.1]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.12, 0.045]}>
        <planeGeometry args={[0.7, 0.04]} />
        <meshBasicMaterial color="#ffffff44" />
      </mesh>
    </group>
  );
}

function BrandPlate({ color }: { color: string }) {
  return (
    <group rotation={[0.25, -0.4, 0.05]}>
      <mesh castShadow>
        <boxGeometry args={[1.4, 0.82, 0.1]} />
        <meshPhysicalMaterial
          color="#0e0e0e"
          metalness={0.45}
          roughness={0.28}
          clearcoat={0.35}
        />
      </mesh>
      <mesh position={[0, 0.08, 0.055]}>
        <planeGeometry args={[0.95, 0.16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.2, 0.055]}>
        <planeGeometry args={[0.55, 0.05]} />
        <meshBasicMaterial color="#ffffff40" />
      </mesh>
    </group>
  );
}

function PhoneDevice({ color }: { color: string }) {
  return (
    <group rotation={[0.2, -0.4, 0.08]}>
      <mesh castShadow>
        <boxGeometry args={[0.7, 1.42, 0.08]} />
        <meshPhysicalMaterial
          color="#141414"
          metalness={0.55}
          roughness={0.28}
          clearcoat={0.5}
        />
      </mesh>
      <mesh position={[0, 0.02, 0.045]}>
        <planeGeometry args={[0.58, 1.18]} />
        <meshBasicMaterial color="#070b14" />
      </mesh>
      <mesh position={[0, 0.28, 0.05]}>
        <planeGeometry args={[0.4, 0.09]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.62, 0.045]}>
        <boxGeometry args={[0.2, 0.03, 0.01]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
    </group>
  );
}

function AccessKey({ color }: { color: string }) {
  return (
    <group rotation={[0.25, 0.4, 0.1]}>
      <mesh position={[-0.35, 0, 0]} castShadow>
        <torusGeometry args={[0.28, 0.065, 16, 48]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.75}
          roughness={0.22}
          clearcoat={0.45}
        />
      </mesh>
      <mesh position={[0.28, 0, 0]} castShadow>
        <boxGeometry args={[0.78, 0.1, 0.1]} />
        <meshPhysicalMaterial color="#d6d6d6" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0.52, -0.1, 0]} castShadow>
        <boxGeometry args={[0.09, 0.2, 0.09]} />
        <meshPhysicalMaterial color="#d6d6d6" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0.36, -0.08, 0]} castShadow>
        <boxGeometry args={[0.09, 0.14, 0.09]} />
        <meshPhysicalMaterial color="#d6d6d6" metalness={0.7} roughness={0.25} />
      </mesh>
    </group>
  );
}

function PriceStack({ color }: { color: string }) {
  return (
    <group>
      {[0.58, 0.42, 0.28].map((r, i) => (
        <mesh
          key={r}
          position={[0, 0.18 - i * 0.15, 0]}
          rotation={[Math.PI / 2.1, 0, i * 0.35]}
          castShadow
        >
          <cylinderGeometry args={[r, r, 0.07, 64]} />
          <meshPhysicalMaterial
            color={i === 0 ? color : i === 1 ? "#ecece6" : "#1a1a1a"}
            metalness={i === 0 ? 0.7 : 0.35}
            roughness={i === 0 ? 0.22 : 0.4}
            clearcoat={i === 0 ? 0.4 : 0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

function ShieldMark({ color }: { color: string }) {
  return (
    <group rotation={[0.15, 0.25, 0]}>
      <mesh castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.5, 0.68, 1.15, 6]} />
        <meshPhysicalMaterial
          color="#121212"
          metalness={0.4}
          roughness={0.35}
          clearcoat={0.3}
        />
      </mesh>
      <mesh position={[0, 0.2, 0.34]}>
        <circleGeometry args={[0.18, 32]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

function SystemOrbit({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.18;
  });
  return (
    <group ref={ref}>
      <mesh>
        <torusGeometry args={[0.78, 0.028, 16, 96]} />
        <meshPhysicalMaterial color={color} metalness={0.55} roughness={0.25} />
      </mesh>
      <mesh rotation={[Math.PI / 2.5, 0.35, 0]}>
        <torusGeometry args={[0.55, 0.018, 12, 64]} />
        <meshStandardMaterial color="#ffffff55" metalness={0.2} roughness={0.4} />
      </mesh>
      <mesh castShadow>
        <sphereGeometry args={[0.22, 48, 48]} />
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.28}
          metalness={0.15}
          clearcoat={0.4}
        />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.78, Math.sin(a) * 0.12, Math.sin(a) * 0.78]}
            castShadow
          >
            <sphereGeometry args={[0.06, 20, 20]} />
            <meshStandardMaterial color={i % 2 === 0 ? color : "#fff"} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Mini pitch + ball — youth / warm playful. */
function PitchPlayful({ color, position }: { color: string; position?: JoueurPositionGroup }) {
  const goal = position === "goalkeeper";
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]} receiveShadow>
        <planeGeometry args={[2.4, 1.6]} />
        <meshStandardMaterial color="#1a5c2e" roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.54, 0]}>
        <ringGeometry args={[0.28, 0.32, 48]} />
        <meshBasicMaterial color="#ffffff55" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-0.75 + i * 0.5, -0.35, 0.55]} castShadow>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color={i % 2 === 0 ? color : "#facc15"} emissive={color} emissiveIntensity={0.25} />
        </mesh>
      ))}
      {goal ? (
        <mesh position={[0, -0.15, -0.65]}>
          <boxGeometry args={[0.7, 0.45, 0.06]} />
          <meshStandardMaterial color="#ffffff88" wireframe />
        </mesh>
      ) : null}
      <group position={[0, 0.05, 0.15]} scale={0.72}>
        <TexturedBall showBadge />
      </group>
    </group>
  );
}

/** Dynamic pitch + speed rings — teen. */
function PitchDynamic({ color, position }: { color: string; position?: JoueurPositionGroup }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.z += dt * 0.35;
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2.4, 0.15, 0.1]} position={[0, -0.45, 0]} receiveShadow>
        <planeGeometry args={[2.6, 1.8]} />
        <meshStandardMaterial color="#0f3d22" roughness={0.7} metalness={0.1} />
      </mesh>
      <group ref={ref}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.05, 0.012, 8, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.55} />
        </mesh>
        <mesh rotation={[Math.PI / 2.6, 0.4, 0]}>
          <torusGeometry args={[0.75, 0.01, 8, 64]} />
          <meshBasicMaterial color="#ffffff66" transparent opacity={0.4} />
        </mesh>
      </group>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.9, 0.15 + i * 0.08, Math.sin(a) * 0.9]}
            castShadow
          >
            <boxGeometry args={[0.08, 0.22 + i * 0.06, 0.08]} />
            <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
          </mesh>
        );
      })}
      {position === "forward" ? (
        <mesh position={[0.55, 0.2, 0.2]}>
          <sphereGeometry args={[0.08, 20, 20]} />
          <meshStandardMaterial color="#fff" emissive={color} emissiveIntensity={0.4} />
        </mesh>
      ) : null}
      <group scale={0.78}>
        <TexturedBall showBadge />
      </group>
    </group>
  );
}

/** Data / heatmap style — adult performance. */
function PitchData({ color, position }: { color: string; position?: JoueurPositionGroup }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[2.5, 1.7]} />
        <meshStandardMaterial color="#0b1220" roughness={0.55} metalness={0.25} />
      </mesh>
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 4 }).map((__, col) => {
          const intensity = ((row + col) % 5) / 5;
          return (
            <mesh
              key={`${row}-${col}`}
              rotation={[-Math.PI / 2.2, 0, 0]}
              position={[-0.9 + col * 0.55, -0.48, -0.55 + row * 0.28]}
            >
              <planeGeometry args={[0.45, 0.22]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.12 + intensity * 0.35}
              />
            </mesh>
          );
        }),
      )}
      {[0.35, 0.55, 0.75, 0.45].map((h, i) => (
        <mesh key={i} position={[-0.95 + i * 0.45, -0.35 + h / 2, 0.55]} castShadow>
          <boxGeometry args={[0.12, h, 0.12]} />
          <meshStandardMaterial
            color={i === 2 ? color : "#94a3b8"}
            metalness={0.35}
            roughness={0.35}
          />
        </mesh>
      ))}
      {position === "midfielder" ? (
        <mesh position={[0, 0.35, -0.2]} rotation={[0.2, 0.4, 0]}>
          <torusGeometry args={[0.35, 0.015, 8, 48]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ) : null}
      <group position={[0.15, 0.08, 0]} scale={0.7}>
        <TexturedBall showBadge />
      </group>
    </group>
  );
}

function SceneForRole({
  role,
  sceneKind,
  position,
}: {
  role: RoleVisualId;
  sceneKind?: JoueurSceneKind;
  position?: JoueurPositionGroup;
}) {
  const color = accentForRole(role);
  if (role === "joueur" && sceneKind) {
    if (sceneKind === "pitch_playful") {
      return <PitchPlayful color={color} position={position} />;
    }
    if (sceneKind === "pitch_dynamic") {
      return <PitchDynamic color={color} position={position} />;
    }
    return <PitchData color={color} position={position} />;
  }
  switch (role) {
    case "joueur":
      return <TexturedBall />;
    case "supporter":
      return <ScarfRibbon color={color} />;
    case "sante":
      return <MedicalCross color={color} />;
    case "pro_club":
      return <TrophyCup color={color} />;
    case "coach":
    case "pro_staff":
      return <TacticsBoard color={color} />;
    case "evenements":
      return <EventTicket color={color} />;
    case "sponsor":
      return <BrandPlate color={color} />;
    case "demo":
      return <PhoneDevice color={color} />;
    case "beta":
      return <AccessKey color={color} />;
    case "tarifs":
      return <PriceStack color={color} />;
    case "parent":
    case "confiance":
      return <ShieldMark color={color} />;
    case "fonctionnalites":
    case "faq":
      return <SystemOrbit color={color} />;
    default:
      return <TexturedBall />;
  }
}

type RoleAccentCanvasProps = {
  role: RoleVisualId;
  className?: string;
  sceneKind?: JoueurSceneKind;
  position?: JoueurPositionGroup;
  animationIntensity?: "soft" | "medium" | "high";
};

/** Premium WebGL accent : transparent stage, textured ball, soft studio light. */
export function RoleAccentCanvas({
  role,
  className,
  sceneKind,
  position,
  animationIntensity = "medium",
}: RoleAccentCanvasProps) {
  const accent = accentForRole(role);
  const floatSpeed =
    animationIntensity === "high" ? 1.45 : animationIntensity === "soft" ? 0.85 : 1.1;
  const yawSpeed =
    animationIntensity === "high" ? 0.16 : animationIntensity === "soft" ? 0.07 : 0.1;

  return (
    <div className={className}>
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0.25, 3.4], fov: 34, near: 0.1, far: 40 }}
        shadows
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMappingExposure = 1.05;
        }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.35} />
          <hemisphereLight args={["#dfe6f2", "#0a0a0a", 0.45]} />
          <directionalLight
            castShadow
            position={[3.2, 4.5, 2.2]}
            intensity={1.35}
            color="#fff6ea"
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-2.5, 1.5, -1.5]} intensity={0.45} color={accent} />
          {/* Pas d'Environment CDN : bloqué par CSP et plantait le client. */}
          <Float
            speed={floatSpeed}
            rotationIntensity={animationIntensity === "high" ? 0.28 : 0.18}
            floatIntensity={animationIntensity === "soft" ? 0.28 : 0.35}
          >
            <SlowYaw speed={yawSpeed}>
              <group position={[0, 0.05, 0]}>
                <SceneForRole role={role} sceneKind={sceneKind} position={position} />
              </group>
            </SlowYaw>
          </Float>
          <ContactShadows
            position={[0, -0.95, 0]}
            opacity={0.42}
            scale={9}
            blur={2.8}
            far={4}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
