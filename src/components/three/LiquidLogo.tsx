import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import './LiquidLogoShader';
import { createHawaWordmarkTexture } from './wordmarkTexture';

interface LiquidLogoProps {
  size?: 'large' | 'small';
  interactiveParallax?: boolean;
}

const MeshLogo: React.FC<{ size: 'large' | 'small'; pointerPos: { x: number; y: number } }> = ({
  size,
  pointerPos,
}) => {
  const materialRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => createHawaWordmarkTexture(), []);

  const prefersReduced = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  useFrame((_, delta) => {
    if (!materialRef.current) return;

    if (document.visibilityState === 'hidden' || prefersReduced) {
      // Pause animation
      return;
    }

    const speed = size === 'large' ? 0.9 : 0.25;
    materialRef.current.uTime += delta * speed;

    if (meshRef.current && size === 'large') {
      // Gentle pointer parallax
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        pointerPos.x * 0.15,
        0.05
      );
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        -pointerPos.y * 0.1,
        0.05
      );
    }
  });

  const quadWidth = size === 'large' ? 4.4 : 3.0;
  const quadHeight = size === 'large' ? 2.2 : 1.5;

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[quadWidth, quadHeight, 32, 32]} />
      {/* @ts-ignore - registered via extend() */}
      <liquidLogoMaterial
        ref={materialRef}
        uTexture={texture}
        uSpeed={size === 'large' ? 0.8 : 0.25}
        uIsHeader={size === 'small' ? 1.0 : 0.0}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};

export const LiquidLogo: React.FC<LiquidLogoProps> = ({
  size = 'large',
  interactiveParallax = true,
}) => {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactiveParallax || size !== 'large') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setPointer({ x, y });
  };

  const containerClasses =
    size === 'large'
      ? 'w-full max-w-[340px] sm:max-w-[420px] h-36 sm:h-52 mx-auto'
      : 'w-24 h-9 sm:w-28 sm:h-10';

  return (
    <div
      onPointerMove={handlePointerMove}
      className={`relative flex items-center justify-center ${containerClasses}`}
      style={{ touchAction: 'pan-y' }}
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        frameloop={size === 'large' ? 'always' : 'always'}
        style={{ pointerEvents: 'none' }}
      >
        <MeshLogo size={size} pointerPos={pointer} />
      </Canvas>
    </div>
  );
};

export default LiquidLogo;
