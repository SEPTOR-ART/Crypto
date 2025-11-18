import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';

function canUseWebGL() {
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

function AnimatedPoints({ count = 1500 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const a = ref.current.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const idx = i * 3 + 1;
      a[idx] += Math.sin(t * 0.6 + i) * 0.002;
    }
    ref.current.attributes.position.needsUpdate = true;
    const px = (state.pointer.x || 0) * 0.6;
    const py = (state.pointer.y || 0) * 0.3;
    state.camera.position.x += (px - state.camera.position.x) * 0.02;
    state.camera.position.y += (py - state.camera.position.y) * 0.02;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <points>
      <bufferGeometry ref={ref}>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#ffd700" sizeAttenuation opacity={0.75} transparent />
    </points>
  );
}

export default function HeroCanvas() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(canUseWebGL()), []);
  if (!ok) return null;
  return (
    <Canvas camera={{ position: [0, 0.6, 3], fov: 45 }} dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 3]} intensity={0.8} />
      <Stars radius={50} depth={20} count={5000} factor={4} saturation={0} fade speed={0.6} />
      <AnimatedPoints />
    </Canvas>
  );
}