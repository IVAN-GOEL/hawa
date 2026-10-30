import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createHawaWordmarkTexture } from './wordmarkTexture';
import './LiquidLogoShader';

interface LandingCanvasProps {
  currentSlide: number; // 0 to 9
}

const SceneContent: React.FC<{ currentSlide: number }> = ({ currentSlide }) => {
  const logoMaterialRef = useRef<any>(null);
  const logoMeshRef = useRef<THREE.Mesh>(null);
  const coinGroupRef = useRef<THREE.Group>(null);
  const cardsGroupRef = useRef<THREE.Group>(null);
  const podiumGroupRef = useRef<THREE.Group>(null);

  const texture = useMemo(() => createHawaWordmarkTexture(), []);

  // Floating question cards
  const cards = useMemo(() => [
    { text: 'Will the mess serve biryani?', y: 1.2, x: -1.8, rot: 0.15 },
    { text: 'Who headlines the fest?', y: 0.1, x: 1.6, rot: -0.1 },
    { text: 'Will Hostel A win?', y: -1.0, x: -1.2, rot: 0.08 },
  ], []);

  // Coins for shower
  const showerCoins = useMemo(() => {
    return Array.from({ length: 24 }).map(() => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 8 - 4,
        (Math.random() - 0.5) * 4
      ),
      speed: Math.random() * 2 + 1.5,
      rotSpeed: (Math.random() - 0.5) * 4,
    }));
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // 1. Logo animation (Slide 9 outro)
    if (logoMaterialRef.current) {
      logoMaterialRef.current.uTime += delta * 0.8;
    }
    if (logoMeshRef.current) {
      const isOutroSlide = currentSlide === 9;
      const targetScale = isOutroSlide ? 1.0 : 0.001;
      logoMeshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 4);
      logoMeshRef.current.position.y = Math.sin(t * 1.5) * 0.08;
    }

    // 2. Question Cards (Slide 1: Hook)
    if (cardsGroupRef.current) {
      const isCardSlide = currentSlide === 1;
      const targetScale = isCardSlide ? 1.0 : 0.001;
      cardsGroupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 4);
      cardsGroupRef.current.position.y = Math.sin(t * 1.2) * 0.1;
      cardsGroupRef.current.rotation.y = Math.cos(t * 0.8) * 0.1;
    }

    // 3. Coin shower & drifting coins (Slides 0, 2, 5, 9 - "use the coin alot")
    if (coinGroupRef.current) {
      const isCoinSlide = currentSlide === 0 || currentSlide === 2 || currentSlide === 5 || currentSlide === 9;
      const targetScale = isCoinSlide ? 1.0 : 0.001;
      coinGroupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 4);

      if (isCoinSlide) {
        showerCoins.forEach((c) => {
          c.pos.y -= delta * c.speed;
          if (c.pos.y < -4) c.pos.y = 4;
        });
      }
    }

    // 4. Podium (Slide 6: Hostel Wars)
    if (podiumGroupRef.current) {
      const isPodiumSlide = currentSlide === 6;
      const targetScale = isPodiumSlide ? 1.0 : 0.001;
      podiumGroupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 4);
      podiumGroupRef.current.rotation.y = Math.sin(t * 0.5) * 0.15;
    }
  });

  return (
    <group>
      {/* 1. Giant Liquid Logo Mesh (Slides 0 & 9) */}
      <mesh ref={logoMeshRef} position={[0, 0.2, 0]}>
        <planeGeometry args={[4.8, 2.4, 32, 32]} />
        {/* @ts-ignore */}
        <liquidLogoMaterial
          ref={logoMaterialRef}
          uTexture={texture}
          uSpeed={0.85}
          uIsHeader={0.0}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* 2. Floating 3D Question Cards (Slide 1) */}
      <group ref={cardsGroupRef} position={[0, 0, 0]} scale={[0.001, 0.001, 0.001]}>
        {cards.map((c, i) => (
          <mesh key={i} position={[c.x, c.y, -0.5]} rotation={[0, 0, c.rot]}>
            <boxGeometry args={[2.2, 0.8, 0.08]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.2} metalness={0.1} />
          </mesh>
        ))}
      </group>

      {/* 3. Coin Shower Group (Slide 5) */}
      <group ref={coinGroupRef} position={[0, 0, 0]} scale={[0.001, 0.001, 0.001]}>
        {showerCoins.map((c, idx) => (
          <mesh key={idx} position={c.pos.toArray()} rotation={[Math.PI / 2, idx * 0.5, idx * 0.2]}>
            <cylinderGeometry args={[0.28, 0.28, 0.06, 16]} />
            <meshStandardMaterial color="#FF8A3D" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* 4. Hostel Wars Podium (Slide 6) */}
      <group ref={podiumGroupRef} position={[0, -0.6, 0]} scale={[0.001, 0.001, 0.001]}>
        {/* Rank 2 (Left): Hostel B */}
        <mesh position={[-1.4, 0.2, 0]}>
          <boxGeometry args={[1.1, 1.4, 1.0]} />
          <meshStandardMaterial color="#5B8EF2" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Rank 1 (Center): Hostel A */}
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[1.2, 2.0, 1.1]} />
          <meshStandardMaterial color="#1E5560" roughness={0.25} metalness={0.2} />
        </mesh>
        {/* Rank 3 (Right): Hostel C */}
        <mesh position={[1.4, -0.1, 0]}>
          <boxGeometry args={[1.1, 0.9, 1.0]} />
          <meshStandardMaterial color="#F5C6D2" roughness={0.4} metalness={0.05} />
        </mesh>
      </group>
    </group>
  );
};

export const LandingCanvas: React.FC<LandingCanvasProps> = ({ currentSlide }) => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={1.4} />
        <directionalLight position={[4, 5, 4]} intensity={2.0} />
        <directionalLight position={[-4, -2, 2]} intensity={0.8} color="#FFD1BA" />
        <SceneContent currentSlide={currentSlide} />
      </Canvas>
    </div>
  );
};

export default LandingCanvas;
