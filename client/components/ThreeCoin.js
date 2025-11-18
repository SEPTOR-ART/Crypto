import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, PresentationControls, Sparkles, Text, ContactShadows } from '@react-three/drei';

function Coin({ speed = 0.3 }) {
  const [hovered, setHovered] = useState(false);
  const materialProps = useMemo(() => ({
    color: '#ffd700',
    emissive: hovered ? '#ffdd55' : '#222222',
    roughness: 0.18,
    metalness: 0.95
  }), [hovered]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    state.scene.rotation.y = t * speed;
  });

  return (
    <group onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <mesh>
        <cylinderGeometry args={[1.1, 1.1, 0.18, 64]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.09, 0]}>
        <circleGeometry args={[1, 64]} />
        <meshStandardMaterial color="#fff6a9" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.09, 0]}>
        <circleGeometry args={[1, 64]} />
        <meshStandardMaterial color="#fff6a9" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.09, 0]}>
        <torusGeometry args={[1.12, 0.02, 24, 64]} />
        <meshStandardMaterial color="#e6c200" metalness={0.95} roughness={0.15} />
      </mesh>
      <mesh position={[0, -0.09, 0]} rotation={[Math.PI, 0, 0]}>
        <torusGeometry args={[1.12, 0.02, 24, 64]} />
        <meshStandardMaterial color="#e6c200" metalness={0.95} roughness={0.15} />
      </mesh>
    </group>
  );
}

function Fallback() {
  return (
    <div style={{
      width: '220px', height: '220px', borderRadius: '50%',
      background: 'radial-gradient(circle, #ffd700 0%, #ffaa00 60%, #bb8800 100%)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    }} aria-hidden />
  );
}

function canUseWebGL() {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

export default function ThreeCoin() {
  const [ok, setOk] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setOk(canUseWebGL());
    if (typeof window !== 'undefined') {
      try {
        setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        setIsMobile(window.matchMedia('(pointer: coarse)').matches);
      } catch {}
    }
  }, []);

  if (!ok) return <Fallback />;

  return (
    <div style={{ width: 'min(300px, 60vw)', height: 'min(300px, 60vw)', margin: '0 auto', cursor: 'grab' }} aria-label="Interactive 3D coin">
      <Canvas camera={{ position: [0, 1.2, 3], fov: 40 }} dpr={[1, isMobile ? 1.5 : 2]} gl={{ antialias: true }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 3, 3]} intensity={0.9} />
        <pointLight position={[-2, -2, -2]} intensity={0.6} />
        <Suspense fallback={null}>
          <PresentationControls global polar={[-0.2, 0.4]} azimuth={[-1, 1]} config={{ mass: 1, tension: 200, friction: 26 }} snap>
            <Float floatIntensity={reduceMotion ? 0 : 0.8} rotationIntensity={reduceMotion ? 0 : 0.6}>
              <Coin speed={reduceMotion ? 0 : 0.3} />
              <group position={[0, 0.091, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <Text
                  fontSize={0.45}
                  anchorX="center"
                  anchorY="middle"
                  color="#cfa500"
                  outlineWidth={0.02}
                  outlineColor="#fff6a9"
                >
                  CZ
                </Text>
              </group>
              <group position={[0, -0.091, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <Text
                  fontSize={0.2}
                  anchorX="center"
                  anchorY="middle"
                  color="#cfa500"
                  outlineWidth={0.015}
                  outlineColor="#fff6a9"
                >
                  CRYPTOZEN
                </Text>
              </group>
            </Float>
          </PresentationControls>
          <Sparkles scale={2.5} count={reduceMotion ? 0 : (isMobile ? 8 : 20)} size={1} speed={0.25} color="#ffd700" />
          <Environment preset="sunset" />
          <ContactShadows opacity={0.35} scale={3.2} blur={2.6} far={2.8} />
        </Suspense>
      </Canvas>
    </div>
  );
}