import { Suspense, useEffect, useMemo, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, PresentationControls, Sparkles, Text, ContactShadows, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

function CoinWithText({ speed = 0.3 }) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <group onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <Coin speed={speed} hovered={hovered} />
      
      {/* Top face text - CZ logo */}
      <group position={[0, 0.093, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <Text
          fontSize={0.48}
          anchorX="center"
          anchorY="middle"
          color={hovered ? "#00ffff" : "#cfa500"}
          outlineWidth={0.025}
          outlineColor={hovered ? "#00d4ff" : "#fff6a9"}
          letterSpacing={0.05}
          fillOpacity={1}
        >
          CZ
        </Text>
        {/* Glowing background for text */}
        <mesh position={[0, 0, -0.01]}>
          <circleGeometry args={[0.35, 32]} />
          <meshBasicMaterial 
            color={hovered ? "#00d4ff" : "#ffd700"} 
            transparent 
            opacity={0.2}
            toneMapped={false}
          />
        </mesh>
      </group>
      
      {/* Bottom face text - CRYPTOZEN */}
      <group position={[0, -0.093, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <Text
          fontSize={0.18}
          anchorX="center"
          anchorY="middle"
          color={hovered ? "#00ffff" : "#cfa500"}
          outlineWidth={0.018}
          outlineColor={hovered ? "#00d4ff" : "#fff6a9"}
          letterSpacing={0.08}
        >
          CRYPTOZEN
        </Text>
        {/* Decorative lines */}
        <mesh position={[0, 0.3, -0.01]}>
          <planeGeometry args={[0.8, 0.015]} />
          <meshBasicMaterial 
            color={hovered ? "#00d4ff" : "#ffd700"}
            transparent
            opacity={0.6}
          />
        </mesh>
        <mesh position={[0, -0.3, -0.01]}>
          <planeGeometry args={[0.8, 0.015]} />
          <meshBasicMaterial 
            color={hovered ? "#00d4ff" : "#ffd700"}
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>
    </group>
  );
}

function Coin({ speed = 0.3, hovered = false }) {
  const coinRef = useRef();
  const rimRef = useRef();
  const glowRef = useRef();
  
  // Enhanced metallic material with gradient effect
  const materialProps = useMemo(() => ({
    color: hovered ? '#00d4ff' : '#ffd700',
    emissive: hovered ? '#00d4ff' : '#ffaa00',
    emissiveIntensity: hovered ? 0.4 : 0.2,
    roughness: 0.12,
    metalness: 0.98,
    envMapIntensity: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1
  }), [hovered]);
  
  // Face material with holographic effect
  const faceMaterialProps = useMemo(() => ({
    color: hovered ? '#00e5ff' : '#fff6a9',
    metalness: 0.95,
    roughness: 0.08,
    emissive: hovered ? '#00d4ff' : '#ffdd88',
    emissiveIntensity: hovered ? 0.3 : 0.15,
    envMapIntensity: 2,
    clearcoat: 1,
    clearcoatRoughness: 0.05
  }), [hovered]);
  
  // Rim material with neon glow
  const rimMaterialProps = useMemo(() => ({
    color: hovered ? '#00ffff' : '#e6c200',
    emissive: hovered ? '#00d4ff' : '#ffd700',
    emissiveIntensity: hovered ? 0.8 : 0.5,
    metalness: 0.98,
    roughness: 0.05,
    toneMapped: false
  }), [hovered]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Smooth continuous rotation
    state.scene.rotation.y = t * speed;
    
    // Pulsing glow effect
    if (glowRef.current) {
      const pulse = Math.sin(t * 2) * 0.3 + 0.7;
      glowRef.current.scale.setScalar(1 + pulse * 0.05);
      glowRef.current.material.opacity = pulse * 0.4;
    }
    
    // Subtle rim light pulsing
    if (rimRef.current) {
      rimRef.current.material.emissiveIntensity = hovered ? (0.8 + Math.sin(t * 3) * 0.2) : (0.5 + Math.sin(t * 2) * 0.1);
    }
    
    // Coin slight wobble for depth
    if (coinRef.current) {
      coinRef.current.rotation.x = Math.sin(t * 0.5) * 0.02;
      coinRef.current.rotation.z = Math.cos(t * 0.7) * 0.02;
    }
  });

  return (
    <group ref={coinRef}>
      {/* Outer glow ring */}
      <mesh ref={glowRef} position={[0, 0, 0]}>
        <torusGeometry args={[1.35, 0.08, 16, 64]} />
        <meshBasicMaterial 
          color={hovered ? '#00d4ff' : '#ffd700'} 
          transparent 
          opacity={0.3}
          toneMapped={false}
        />
      </mesh>
      
      {/* Main cylinder body with enhanced metallic finish */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 1.1, 0.18, 64]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      
      {/* Top face with holographic effect */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.091, 0]} castShadow>
        <circleGeometry args={[1.05, 64]} />
        <meshStandardMaterial {...faceMaterialProps} />
      </mesh>
      
      {/* Bottom face with holographic effect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.091, 0]} castShadow>
        <circleGeometry args={[1.05, 64]} />
        <meshStandardMaterial {...faceMaterialProps} />
      </mesh>
      
      {/* Inner detail rings */}
      <mesh position={[0, 0.091, 0]}>
        <torusGeometry args={[0.85, 0.015, 16, 64]} />
        <meshStandardMaterial 
          color={hovered ? '#00ffff' : '#ffdd88'}
          emissive={hovered ? '#00d4ff' : '#ffd700'}
          emissiveIntensity={0.6}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0, -0.091, 0]}>
        <torusGeometry args={[0.85, 0.015, 16, 64]} />
        <meshStandardMaterial 
          color={hovered ? '#00ffff' : '#ffdd88'}
          emissive={hovered ? '#00d4ff' : '#ffd700'}
          emissiveIntensity={0.6}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Outer rim with neon glow - top */}
      <mesh ref={rimRef} position={[0, 0.091, 0]} castShadow>
        <torusGeometry args={[1.12, 0.025, 24, 64]} />
        <meshStandardMaterial {...rimMaterialProps} />
      </mesh>
      
      {/* Outer rim with neon glow - bottom */}
      <mesh position={[0, -0.091, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <torusGeometry args={[1.12, 0.025, 24, 64]} />
        <meshStandardMaterial {...rimMaterialProps} />
      </mesh>
      
      {/* Additional decorative elements */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <mesh 
          key={i}
          position={[
            Math.cos((angle * Math.PI) / 180) * 0.95,
            0.092,
            Math.sin((angle * Math.PI) / 180) * 0.95
          ]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.04, 16]} />
          <meshStandardMaterial
            color={hovered ? '#00ffff' : '#ffd700'}
            emissive={hovered ? '#00d4ff' : '#ffaa00'}
            emissiveIntensity={0.8}
            metalness={1}
            roughness={0}
          />
        </mesh>
      ))}
    </group>
  );
}

function Fallback() {
  return (
    <div style={{
      width: '220px', 
      height: '220px', 
      borderRadius: '50%',
      background: 'radial-gradient(circle at 30% 30%, #00d4ff 0%, #ffd700 40%, #ffaa00 60%, #bb8800 100%)',
      boxShadow: `
        0 0 20px rgba(0, 212, 255, 0.4),
        0 0 40px rgba(255, 215, 0, 0.3),
        0 10px 30px rgba(0, 0, 0, 0.3),
        inset 0 0 30px rgba(255, 255, 255, 0.1)
      `,
      border: '2px solid rgba(255, 215, 0, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      animation: 'fallbackPulse 3s ease-in-out infinite'
    }} aria-hidden>
      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#cfa500',
        textShadow: '0 0 10px rgba(0, 212, 255, 0.5), 0 2px 4px rgba(0, 0, 0, 0.5)',
        letterSpacing: '2px'
      }}>
        CZ
      </div>
      <style>{`
        @keyframes fallbackPulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 
              0 0 20px rgba(0, 212, 255, 0.4),
              0 0 40px rgba(255, 215, 0, 0.3),
              0 10px 30px rgba(0, 0, 0, 0.3),
              inset 0 0 30px rgba(255, 255, 255, 0.1);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 
              0 0 30px rgba(0, 212, 255, 0.6),
              0 0 50px rgba(255, 215, 0, 0.4),
              0 15px 40px rgba(0, 0, 0, 0.4),
              inset 0 0 40px rgba(255, 255, 255, 0.15);
          }
        }
      `}</style>
    </div>
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
  const [lowPerf, setLowPerf] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  
  useEffect(() => {
    setOk(canUseWebGL());
    if (typeof window !== 'undefined') {
      try {
        setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        setIsMobile(window.matchMedia('(pointer: coarse)').matches);
        const dm = navigator.deviceMemory || 4;
        const hwConcurrency = navigator.hardwareConcurrency || 4;
        setLowPerf(dm <= 4 || hwConcurrency <= 4);
      } catch {}
    }
  }, []);

  if (!ok || contextLost) return <Fallback />;

  return (
    <div style={{ width: 'min(300px, 60vw)', height: 'min(300px, 60vw)', margin: '0 auto', cursor: 'grab' }} aria-label="Interactive 3D coin">
      <Canvas 
        camera={{ position: [0, 1.2, 3], fov: 40 }} 
        dpr={[1, lowPerf ? 1.25 : (isMobile ? 1.5 : 2)]} 
        gl={{ 
          antialias: !lowPerf,
          alpha: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
        onCreated={({ gl }) => {
          // Handle context loss
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('WebGL context lost, showing fallback');
            setContextLost(true);
          }, false);
          
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored');
            setContextLost(false);
          }, false);
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={lowPerf ? 0.9 : 1.2} castShadow />
        <directionalLight position={[-5, -3, -5]} intensity={0.4} color="#00d4ff" />
        <pointLight position={[3, 2, 3]} intensity={lowPerf ? 0.6 : 0.8} color="#ffd700" />
        <pointLight position={[-3, 2, -3]} intensity={lowPerf ? 0.4 : 0.6} color="#00d4ff" />
        <spotLight 
          position={[0, 5, 0]} 
          intensity={lowPerf ? 0.5 : 0.8} 
          angle={0.6} 
          penumbra={1} 
          color="#ffffff"
          castShadow
        />
        <Suspense fallback={null}>
          <PresentationControls global polar={[-0.2, 0.4]} azimuth={[-1, 1]} config={{ mass: 1, tension: 200, friction: 26 }} snap>
            <Float floatIntensity={reduceMotion ? 0 : (lowPerf ? 0.5 : 0.8)} rotationIntensity={reduceMotion ? 0 : (lowPerf ? 0.4 : 0.6)}>
              <CoinWithText speed={reduceMotion ? 0 : (lowPerf ? 0.2 : 0.3)} />
            </Float>
          </PresentationControls>
          <Sparkles 
            scale={3} 
            count={reduceMotion ? 0 : (lowPerf ? 8 : (isMobile ? 12 : 30))} 
            size={lowPerf ? 1 : 1.5} 
            speed={0.3} 
            color="#ffd700"
            opacity={0.6}
          />
          {!reduceMotion && !lowPerf && (
            <Sparkles 
              scale={3.5} 
              count={isMobile ? 6 : 15} 
              size={2} 
              speed={0.2} 
              color="#00d4ff"
              opacity={0.4}
            />
          )}
          <Environment preset="city" environmentIntensity={lowPerf ? 0.8 : 1.2} />
          {reduceMotion || lowPerf ? null : (
            <ContactShadows 
              opacity={0.5} 
              scale={3.5} 
              blur={3} 
              far={3.2} 
              resolution={512}
              color="#000000"
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}