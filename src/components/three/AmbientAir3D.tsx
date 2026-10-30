import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AmbientAir3DProps {
  onFpsDowngrade?: () => void;
}

const BlobsMesh: React.FC<{ onFpsDowngrade?: () => void }> = ({ onFpsDowngrade }) => {
  const blob1 = useRef<THREE.Mesh>(null);
  const blob2 = useRef<THREE.Mesh>(null);
  const blob3 = useRef<THREE.Mesh>(null);

  // Performance FPS tracking
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const lowFpsStartTime = useRef<number | null>(null);

  const prefersReduced = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useFrame((state, delta) => {
    if (prefersReduced) return;

    // Track FPS
    frameCount.current++;
    const now = performance.now();
    if (now - lastTime.current >= 1000) {
      const currentFps = (frameCount.current * 1000) / (now - lastTime.current);
      frameCount.current = 0;
      lastTime.current = now;

      if (currentFps < 40) {
        if (!lowFpsStartTime.current) {
          lowFpsStartTime.current = now;
        } else if (now - lowFpsStartTime.current >= 2000) {
          // Low FPS sustained for 2 seconds -> downgrade
          onFpsDowngrade?.();
        }
      } else {
        lowFpsStartTime.current = null;
      }
    }

    const t = state.clock.elapsedTime * 0.4;

    if (blob1.current) {
      blob1.current.position.x = Math.sin(t * 0.5) * 2.5;
      blob1.current.position.y = Math.cos(t * 0.3) * 1.5;
    }
    if (blob2.current) {
      blob2.current.position.x = Math.cos(t * 0.4) * 3.0;
      blob2.current.position.y = Math.sin(t * 0.6) * 1.8;
    }
    if (blob3.current) {
      blob3.current.position.x = Math.sin(t * 0.3) * 2.0;
      blob3.current.position.y = -Math.cos(t * 0.5) * 1.2;
    }
  });

  return (
    <group position={[0, 0, -4]}>
      {/* Baby-pink soft blob */}
      <mesh ref={blob1} position={[-2, 1, 0]}>
        <sphereGeometry args={[2.5, 24, 24]} />
        <meshBasicMaterial color="#F5C6D2" transparent opacity={0.22} />
      </mesh>

      {/* Cool-blue soft blob */}
      <mesh ref={blob2} position={[2, -1, 0]}>
        <sphereGeometry args={[2.8, 24, 24]} />
        <meshBasicMaterial color="#5B8EF2" transparent opacity={0.16} />
      </mesh>

      {/* Linen-deep subtle warmth blob */}
      <mesh ref={blob3} position={[0, 2, 0]}>
        <sphereGeometry args={[2.2, 20, 20]} />
        <meshBasicMaterial color="#E8DFCF" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export const AmbientAir3D: React.FC<AmbientAir3DProps> = ({ onFpsDowngrade }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-80">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 1]}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
      >
        <BlobsMesh onFpsDowngrade={onFpsDowngrade} />
      </Canvas>
    </div>
  );
};

export default AmbientAir3D;
