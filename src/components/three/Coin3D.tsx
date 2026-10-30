import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Coin3DProps {
  isFlipping?: boolean;
  isBurstingWin?: boolean;
  className?: string;
  size?: number; // pixel width/height
}

// Canvas texture with embossed "H"
function createCoinFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  // Rim ring
  ctx.strokeStyle = '#D66A23';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(128, 128, 116, 0, Math.PI * 2);
  ctx.stroke();

  // Subtle inner beaded ring
  ctx.strokeStyle = '#FFAE70';
  ctx.lineWidth = 4;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.arc(128, 128, 102, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Tangerine background fill
  ctx.fillStyle = '#FF8A3D';
  ctx.beginPath();
  ctx.arc(128, 128, 98, 0, Math.PI * 2);
  ctx.fill();

  // Embossed 'H'
  ctx.font = '900 120px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Emboss shadow
  ctx.fillStyle = '#9C3D06';
  ctx.fillText('H', 131, 133);

  // Emboss highlight
  ctx.fillStyle = '#FFE0CC';
  ctx.fillText('H', 126, 126);

  // Main body
  ctx.fillStyle = '#E6691A';
  ctx.fillText('H', 128, 129);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

const CoinMesh: React.FC<{ isFlipping: boolean; isBurstingWin: boolean }> = ({
  isFlipping,
  isBurstingWin,
}) => {
  const coinGroup = useRef<THREE.Group>(null);
  const flipProgress = useRef(0);
  const faceTexture = useMemo(() => createCoinFaceTexture(), []);

  // Particle burst references
  const particles = useMemo(() => {
    return Array.from({ length: 16 }).map(() => ({
      pos: new THREE.Vector3(0, 0, 0),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1.5,
        (Math.random() - 0.5) * 4
      ),
      rot: new THREE.Euler(Math.random(), Math.random(), Math.random()),
      rotVel: (Math.random() - 0.5) * 8,
      life: 1.0,
    }));
  }, []);

  const particleMeshes = useRef<(THREE.Mesh | null)[]>([]);

  useEffect(() => {
    return () => {
      faceTexture.dispose();
    };
  }, [faceTexture]);

  useFrame((_, delta) => {
    if (!coinGroup.current) return;

    if (isFlipping) {
      // Rapid vertical flip end-over-end
      flipProgress.current += delta * 12;
      coinGroup.current.rotation.x = Math.PI / 2 + flipProgress.current;
      coinGroup.current.rotation.y += delta * 8;
    } else {
      flipProgress.current = 0;
      // Coin stands vertically facing the camera directly, spinning on upright Y-axis
      coinGroup.current.rotation.x = THREE.MathUtils.lerp(coinGroup.current.rotation.x, Math.PI / 2, 0.1);
      coinGroup.current.rotation.y += delta * 2.2;
    }

    // Handle win particles burst
    if (isBurstingWin) {
      particles.forEach((p, i) => {
        const mesh = particleMeshes.current[i];
        if (mesh) {
          p.pos.addScaledVector(p.vel, delta);
          p.vel.y -= 9.8 * delta * 0.5; // gravity
          p.life -= delta * 0.6;
          mesh.position.copy(p.pos);
          mesh.rotation.x += p.rotVel * delta;
          mesh.rotation.y += p.rotVel * delta;
          mesh.scale.setScalar(Math.max(0, p.life * 0.2));
          mesh.visible = p.life > 0;
        }
      });
    } else {
      particles.forEach((p, i) => {
        p.pos.set(0, 0, 0);
        p.life = 1.0;
        const mesh = particleMeshes.current[i];
        if (mesh) mesh.visible = false;
      });
    }
  });

  // Materials for cylinder: [side, top, bottom]
  const sideMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#E6691A',
        metalness: 0.85,
        roughness: 0.2,
      }),
    []
  );

  const faceMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: faceTexture,
        metalness: 0.75,
        roughness: 0.3,
      }),
    [faceTexture]
  );

  return (
    <group>
      <group ref={coinGroup} rotation={[Math.PI / 2, 0, 0]}>
        {/* Main 3D embossed coin cylinder standing vertically facing camera */}
        <mesh rotation={[0, 0, 0]} material={[sideMaterial, faceMaterial, faceMaterial]}>
          <cylinderGeometry args={[0.9, 0.9, 0.18, 36]} />
        </mesh>
      </group>

      {/* Particle burst coins */}
      {particles.map((_, idx) => (
        <mesh
          key={idx}
          ref={(el) => (particleMeshes.current[idx] = el)}
          visible={false}
          material={[sideMaterial, faceMaterial, faceMaterial]}
        >
          <cylinderGeometry args={[0.3, 0.3, 0.08, 16]} />
        </mesh>
      ))}
    </group>
  );
};

export const Coin3D: React.FC<Coin3DProps> = ({
  isFlipping = false,
  isBurstingWin = false,
  className = '',
  size = 32,
}) => {
  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
    >
      <Canvas
        camera={{ position: [0, 0, 2.6], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 5, 4]} intensity={2.2} />
        <directionalLight position={[-3, -3, 2]} intensity={0.8} color="#FFD1BA" />
        <CoinMesh isFlipping={isFlipping} isBurstingWin={isBurstingWin} />
      </Canvas>
    </div>
  );
};

export default Coin3D;
