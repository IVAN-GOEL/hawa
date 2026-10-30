import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Podium3DProps {
  userRank?: number; // 1, 2, 3, or undefined
  className?: string;
  topUsers?: { displayName: string; score: number }[];
}

const PodiumMesh: React.FC<{ userRank?: number }> = ({ userRank }) => {
  const p1Ref = useRef<THREE.Mesh>(null);
  const p2Ref = useRef<THREE.Mesh>(null);
  const p3Ref = useRef<THREE.Mesh>(null);
  const markerRef = useRef<THREE.Mesh>(null);

  const currentScale = useRef({ p1: 0.01, p2: 0.01, p3: 0.01 });

  useFrame((state, delta) => {
    // Rise on page load
    currentScale.current.p1 = THREE.MathUtils.lerp(currentScale.current.p1, 1, delta * 3.5);
    currentScale.current.p2 = THREE.MathUtils.lerp(currentScale.current.p2, 1, delta * 3.2);
    currentScale.current.p3 = THREE.MathUtils.lerp(currentScale.current.p3, 1, delta * 2.8);

    if (p1Ref.current) {
      p1Ref.current.scale.y = currentScale.current.p1;
      p1Ref.current.position.y = (2.2 * currentScale.current.p1) / 2 - 1.2;
    }
    if (p2Ref.current) {
      p2Ref.current.scale.y = currentScale.current.p2;
      p2Ref.current.position.y = (1.6 * currentScale.current.p2) / 2 - 1.2;
    }
    if (p3Ref.current) {
      p3Ref.current.scale.y = currentScale.current.p3;
      p3Ref.current.position.y = (1.1 * currentScale.current.p3) / 2 - 1.2;
    }

    if (markerRef.current) {
      markerRef.current.rotation.y += delta * 2;
      markerRef.current.position.y += Math.sin(state.clock.elapsedTime * 4) * 0.003;
    }
  });

  // Calculate marker position based on userRank
  let markerX = 0;
  let markerBaseY = 1.35;
  if (userRank === 1) {
    markerX = 0;
    markerBaseY = 1.35;
  } else if (userRank === 2) {
    markerX = -1.55;
    markerBaseY = 0.75;
  } else if (userRank === 3) {
    markerX = 1.55;
    markerBaseY = 0.25;
  }

  return (
    <group position={[0, -0.2, 0]}>
      {/* Rank 2 (Left): Cool Blue #5B8EF2 */}
      <mesh ref={p2Ref} position={[-1.55, -0.4, 0]}>
        <boxGeometry args={[1.25, 1.6, 1.2]} />
        <meshStandardMaterial color="#5B8EF2" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Rank 1 (Center): Petrol #1E5560 */}
      <mesh ref={p1Ref} position={[0, -0.1, 0]}>
        <boxGeometry args={[1.35, 2.2, 1.3]} />
        <meshStandardMaterial color="#1E5560" roughness={0.25} metalness={0.2} />
      </mesh>

      {/* Rank 3 (Right): Baby Pink #F5C6D2 */}
      <mesh ref={p3Ref} position={[1.55, -0.65, 0]}>
        <boxGeometry args={[1.25, 1.1, 1.2]} />
        <meshStandardMaterial color="#F5C6D2" roughness={0.4} metalness={0.05} />
      </mesh>

      {/* Tangerine marker above user's podium block if user in top 3 */}
      {userRank && userRank >= 1 && userRank <= 3 && (
        <mesh ref={markerRef} position={[markerX, markerBaseY, 0]}>
          <octahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial
            color="#FF8A3D"
            emissive="#FF8A3D"
            emissiveIntensity={0.6}
            roughness={0.1}
          />
        </mesh>
      )}
    </group>
  );
};

export const Podium3D: React.FC<Podium3DProps> = ({ userRank, className = '' }) => {
  return (
    <div className={`w-full h-48 sm:h-56 relative select-none ${className}`}>
      <Canvas
        camera={{ position: [0, 1.1, 4.2], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[4, 6, 5]} intensity={1.8} />
        <directionalLight position={[-4, 2, -2]} intensity={0.6} color="#FFEBE5" />
        <PodiumMesh userRank={userRank} />
      </Canvas>
    </div>
  );
};

export default Podium3D;
