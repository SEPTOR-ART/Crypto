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
      <group position={[0, 0.105, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <Text
          fontSize={0.52}
          anchorX="center"
          anchorY="middle"
          color={hovered ? "#00ffff" : "#B8860B"}
          outlineWidth={0.03}
          outlineColor={hovered ? "#00d4ff" : "#DAA520"}
          letterSpacing={0.06}
          fillOpacity={1}
          font="https://fonts.gstatic.com/s/orbitron/v31/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyGy6BoWgz.woff"
        >
          CZ
        </Text>
        {/* Enhanced glowing background */}
        <mesh position={[0, 0, -0.015]}>
          <circleGeometry args={[0.4, 48]} />
          <meshBasicMaterial 
            color={hovered ? "#00d4ff" : "#FFD700"} 
            transparent 
            opacity={0.25}
            toneMapped={false}
          />
        </mesh>
        {/* Secondary outer glow */}
        <mesh position={[0, 0, -0.02]}>
          <circleGeometry args={[0.5, 48]} />
          <meshBasicMaterial 
            color={hovered ? "#0088cc" : "#FFA500"} 
            transparent 
            opacity={0.12}
            toneMapped={false}
          />
        </mesh>
      </group>
      
      {/* Bottom face text - CRYPTOZEN */}
      <group position={[0, -0.105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <Text
          fontSize={0.19}
          anchorX="center"
          anchorY="middle"
          color={hovered ? "#00ffff" : "#B8860B"}
          outlineWidth={0.02}
          outlineColor={hovered ? "#00d4ff" : "#DAA520"}
          letterSpacing={0.1}
          font="https://fonts.gstatic.com/s/orbitron/v31/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyGy6BoWgz.woff"
        >
          CRYPTOZEN
        </Text>
        {/* Top decorative line */}
        <mesh position={[0, 0.35, -0.015]}>
          <planeGeometry args={[0.9, 0.018]} />
          <meshBasicMaterial 
            color={hovered ? "#00d4ff" : "#FFD700"}
            transparent
            opacity={0.7}
            toneMapped={false}
          />
        </mesh>
        {/* Bottom decorative line */}
        <mesh position={[0, -0.35, -0.015]}>
          <planeGeometry args={[0.9, 0.018]} />
          <meshBasicMaterial 
            color={hovered ? "#00d4ff" : "#FFD700"}
            transparent
            opacity={0.7}
            toneMapped={false}
          />
        </mesh>
        {/* Year/Edition text */}
        <Text
          position={[0, -0.5, -0.01]}
          fontSize={0.08}
          anchorX="center"
          anchorY="middle"
          color={hovered ? "#66ffff" : "#CD853F"}
          letterSpacing={0.15}
          font="https://fonts.gstatic.com/s/orbitron/v31/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyGy6BoWgz.woff"
        >
          2024
        </Text>
      </group>
    </group>
  );
}

function Coin({ speed = 0.3, hovered = false }) {
  const coinRef = useRef();
  const rimRef = useRef();
  const glowRef = useRef();
  const innerGlowRef = useRef();
  
  // Premium Bitcoin-style gold material with realistic metallic properties
  const materialProps = useMemo(() => ({
    color: hovered ? '#00d4ff' : '#DAA520', // Goldenrod for authentic gold appearance
    emissive: hovered ? '#0099cc' : '#B8860B', // Dark goldenrod emissive
    emissiveIntensity: hovered ? 0.35 : 0.25,
    roughness: 0.15, // Slightly higher for realistic metal
    metalness: 1.0, // Full metalness for perfect reflection
    envMapIntensity: 2.0, // Enhanced environment reflections
    clearcoat: 1.0,
    clearcoatRoughness: 0.08
  }), [hovered]);
  
  // Enhanced face material with premium finish
  const faceMaterialProps = useMemo(() => ({
    color: hovered ? '#00e5ff' : '#FFD700', // Pure gold
    metalness: 1.0,
    roughness: 0.1,
    emissive: hovered ? '#0088aa' : '#FFA500', // Orange emissive for warmth
    emissiveIntensity: hovered ? 0.25 : 0.18,
    envMapIntensity: 2.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04
  }), [hovered]);
  
  // Rim material with pronounced edge definition
  const rimMaterialProps = useMemo(() => ({
    color: hovered ? '#00ffff' : '#CD853F', // Peru gold for edge
    emissive: hovered ? '#00d4ff' : '#DAA520',
    emissiveIntensity: hovered ? 0.9 : 0.6,
    metalness: 1.0,
    roughness: 0.08,
    toneMapped: false
  }), [hovered]);
  
  // Inner ring accent material
  const innerRingProps = useMemo(() => ({
    color: hovered ? '#66ffff' : '#FFA500',
    emissive: hovered ? '#00aacc' : '#FF8C00',
    emissiveIntensity: hovered ? 0.7 : 0.5,
    metalness: 0.95,
    roughness: 0.12,
    toneMapped: false
  }), [hovered]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Smooth continuous rotation with slight variation
    state.scene.rotation.y = t * speed + Math.sin(t * 0.3) * 0.02;
    
    // Enhanced pulsing glow effect
    if (glowRef.current) {
      const pulse = Math.sin(t * 1.8) * 0.35 + 0.65;
      glowRef.current.scale.setScalar(1 + pulse * 0.08);
      glowRef.current.material.opacity = pulse * 0.5;
    }
    
    // Inner glow pulsing
    if (innerGlowRef.current) {
      const innerPulse = Math.sin(t * 2.2 + Math.PI / 4) * 0.3 + 0.7;
      innerGlowRef.current.material.opacity = innerPulse * 0.35;
    }
    
    // Enhanced rim light pulsing with multiple frequencies
    if (rimRef.current) {
      const basePulse = Math.sin(t * 2.5) * 0.15;
      const fastPulse = Math.sin(t * 4) * 0.08;
      rimRef.current.material.emissiveIntensity = hovered 
        ? (0.9 + basePulse + fastPulse) 
        : (0.6 + basePulse * 0.5);
    }
    
    // Subtle 3D wobble with multiple axes
    if (coinRef.current) {
      coinRef.current.rotation.x = Math.sin(t * 0.6) * 0.025 + Math.sin(t * 1.2) * 0.01;
      coinRef.current.rotation.z = Math.cos(t * 0.8) * 0.025 + Math.cos(t * 1.5) * 0.01;
    }
  });

  return (
    <group ref={coinRef}>
      {/* Outer atmospheric glow ring */}
      <mesh ref={glowRef} position={[0, 0, 0]}>
        <torusGeometry args={[1.4, 0.12, 16, 64]} />
        <meshBasicMaterial 
          color={hovered ? '#00d4ff' : '#FFD700'} 
          transparent 
          opacity={0.35}
          toneMapped={false}
        />
      </mesh>
      
      {/* Inner glow ring for depth */}
      <mesh ref={innerGlowRef} position={[0, 0, 0]}>
        <torusGeometry args={[1.25, 0.06, 16, 64]} />
        <meshBasicMaterial 
          color={hovered ? '#66ffff' : '#FFA500'} 
          transparent 
          opacity={0.25}
          toneMapped={false}
        />
      </mesh>
      
      {/* Main cylinder body with premium gold material */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.15, 1.15, 0.2, 96]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      
      {/* Top face with enhanced reflectivity */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.101, 0]} castShadow>
        <circleGeometry args={[1.1, 96]} />
        <meshStandardMaterial {...faceMaterialProps} />
      </mesh>
      
      {/* Bottom face with enhanced reflectivity */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.101, 0]} castShadow>
        <circleGeometry args={[1.1, 96]} />
        <meshStandardMaterial {...faceMaterialProps} />
      </mesh>
      
      {/* Inner decorative ring - top */}
      <mesh position={[0, 0.102, 0]}>
        <torusGeometry args={[0.9, 0.02, 24, 96]} />
        <meshStandardMaterial {...innerRingProps} />
      </mesh>
      
      {/* Inner decorative ring - bottom */}
      <mesh position={[0, -0.102, 0]}>
        <torusGeometry args={[0.9, 0.02, 24, 96]} />
        <meshStandardMaterial {...innerRingProps} />
      </mesh>
      
      {/* Secondary inner ring for detail - top */}
      <mesh position={[0, 0.102, 0]}>
        <torusGeometry args={[0.75, 0.015, 16, 64]} />
        <meshStandardMaterial 
          color={hovered ? '#88ffff' : '#FFCC00'}
          emissive={hovered ? '#00ccee' : '#FFB700'}
          emissiveIntensity={0.55}
          metalness={0.92}
          roughness={0.15}
        />
      </mesh>
      
      {/* Secondary inner ring - bottom */}
      <mesh position={[0, -0.102, 0]}>
        <torusGeometry args={[0.75, 0.015, 16, 64]} />
        <meshStandardMaterial 
          color={hovered ? '#88ffff' : '#FFCC00'}
          emissive={hovered ? '#00ccee' : '#FFB700'}
          emissiveIntensity={0.55}
          metalness={0.92}
          roughness={0.15}
        />
      </mesh>
      
      {/* Outer rim with premium edge definition - top */}
      <mesh ref={rimRef} position={[0, 0.101, 0]} castShadow>
        <torusGeometry args={[1.17, 0.03, 32, 96]} />
        <meshStandardMaterial {...rimMaterialProps} />
      </mesh>
      
      {/* Outer rim - bottom */}
      <mesh position={[0, -0.101, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <torusGeometry args={[1.17, 0.03, 32, 96]} />
        <meshStandardMaterial {...rimMaterialProps} />
      </mesh>
      
      {/* Decorative accent dots arranged in circle */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <group key={i}>
          {/* Top face dots */}
          <mesh 
            position={[
              Math.cos((angle * Math.PI) / 180) * 1.0,
              0.103,
              Math.sin((angle * Math.PI) / 180) * 1.0
            ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.035, 24]} />
            <meshStandardMaterial
              color={hovered ? '#00ffff' : '#FFD700'}
              emissive={hovered ? '#00ccdd' : '#FFA500'}
              emissiveIntensity={0.9}
              metalness={1}
              roughness={0.05}
              toneMapped={false}
            />
          </mesh>
          
          {/* Bottom face dots */}
          <mesh 
            position={[
              Math.cos((angle * Math.PI) / 180) * 1.0,
              -0.103,
              Math.sin((angle * Math.PI) / 180) * 1.0
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.035, 24]} />
            <meshStandardMaterial
              color={hovered ? '#00ffff' : '#FFD700'}
              emissive={hovered ? '#00ccdd' : '#FFA500'}
              emissiveIntensity={0.9}
              metalness={1}
              roughness={0.05}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
      
      {/* Edge pattern - raised ridges around circumference */}
      {Array.from({ length: 60 }).map((_, i) => {
        const angle = (i / 60) * Math.PI * 2;
        return (
          <mesh
            key={`ridge-${i}`}
            position={[
              Math.cos(angle) * 1.15,
              0,
              Math.sin(angle) * 1.15
            ]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[0.015, 0.18, 0.02]} />
            <meshStandardMaterial
              color={hovered ? '#00aadd' : '#CD853F'}
              metalness={0.95}
              roughness={0.2}
              emissive={hovered ? '#0088bb' : '#B8860B'}
              emissiveIntensity={0.25}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Fallback() {
  return (
    <div style={{
      width: '280px', 
      height: '280px', 
      borderRadius: '50%',
      background: `
        radial-gradient(circle at 35% 35%, #FFD700 0%, #DAA520 30%, #B8860B 60%, #8B6914 100%)
      `,
      boxShadow: `
        0 0 30px rgba(218, 165, 32, 0.5),
        0 0 60px rgba(255, 215, 0, 0.3),
        0 15px 40px rgba(0, 0, 0, 0.4),
        inset 0 0 40px rgba(255, 255, 255, 0.15),
        inset 0 -10px 30px rgba(139, 105, 20, 0.3)
      `,
      border: '3px solid #CD853F',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      animation: 'fallbackPulse 3s ease-in-out infinite'
    }} aria-hidden>
      {/* Shine effect overlay */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.3) 50%, transparent 60%)',
        animation: 'fallbackShine 4s linear infinite'
      }} />
      
      <div style={{
        fontSize: '72px',
        fontWeight: 'bold',
        color: '#8B6914',
        textShadow: `
          0 2px 0 #DAA520,
          0 4px 8px rgba(0, 0, 0, 0.3),
          0 0 20px rgba(255, 215, 0, 0.4)
        `,
        letterSpacing: '4px',
        fontFamily: '"Orbitron", sans-serif',
        position: 'relative',
        zIndex: 1
      }}>
        CZ
      </div>
      
      <div style={{
        fontSize: '14px',
        fontWeight: '600',
        color: '#CD853F',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
        letterSpacing: '3px',
        marginTop: '8px',
        fontFamily: '"Orbitron", sans-serif',
        position: 'relative',
        zIndex: 1
      }}>
        CRYPTOZEN
      </div>
      
      <style>{`
        @keyframes fallbackPulse {
          0%, 100% { 
            transform: scale(1) rotate(0deg);
            box-shadow: 
              0 0 30px rgba(218, 165, 32, 0.5),
              0 0 60px rgba(255, 215, 0, 0.3),
              0 15px 40px rgba(0, 0, 0, 0.4),
              inset 0 0 40px rgba(255, 255, 255, 0.15),
              inset 0 -10px 30px rgba(139, 105, 20, 0.3);
          }
          50% { 
            transform: scale(1.03) rotate(1deg);
            box-shadow: 
              0 0 40px rgba(218, 165, 32, 0.7),
              0 0 80px rgba(255, 215, 0, 0.4),
              0 20px 50px rgba(0, 0, 0, 0.5),
              inset 0 0 50px rgba(255, 255, 255, 0.2),
              inset 0 -15px 40px rgba(139, 105, 20, 0.4);
          }
        }
        
        @keyframes fallbackShine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
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
        <ambientLight intensity={0.6} color="#ffffff" />
        <directionalLight position={[6, 6, 6]} intensity={lowPerf ? 1.0 : 1.4} castShadow color="#fffacd" />
        <directionalLight position={[-6, -4, -6]} intensity={0.5} color="#00d4ff" />
        <pointLight position={[4, 3, 4]} intensity={lowPerf ? 0.7 : 1.0} color="#FFD700" distance={10} decay={2} />
        <pointLight position={[-4, 3, -4]} intensity={lowPerf ? 0.5 : 0.8} color="#00d4ff" distance={10} decay={2} />
        <pointLight position={[0, -3, 0]} intensity={0.4} color="#FFA500" distance={8} decay={2} />
        <spotLight 
          position={[0, 6, 0]} 
          intensity={lowPerf ? 0.6 : 1.0} 
          angle={0.5} 
          penumbra={1} 
          color="#ffffff"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        {/* Rim light for edge definition */}
        <spotLight 
          position={[3, 0, 3]} 
          intensity={0.6} 
          angle={Math.PI / 3} 
          penumbra={0.8} 
          color="#DAA520"
        />
        <Suspense fallback={null}>
          <PresentationControls global polar={[-0.2, 0.4]} azimuth={[-1, 1]} config={{ mass: 1, tension: 200, friction: 26 }} snap>
            <Float floatIntensity={reduceMotion ? 0 : (lowPerf ? 0.5 : 0.8)} rotationIntensity={reduceMotion ? 0 : (lowPerf ? 0.4 : 0.6)}>
              <CoinWithText speed={reduceMotion ? 0 : (lowPerf ? 0.2 : 0.3)} />
            </Float>
          </PresentationControls>
          <Sparkles 
            scale={3.2} 
            count={reduceMotion ? 0 : (lowPerf ? 10 : (isMobile ? 16 : 40))} 
            size={lowPerf ? 1.2 : 1.8} 
            speed={0.25} 
            color="#FFD700"
            opacity={0.7}
          />
          {!reduceMotion && !lowPerf && (
            <>
              <Sparkles 
                scale={3.8} 
                count={isMobile ? 8 : 20} 
                size={2.2} 
                speed={0.18} 
                color="#00d4ff"
                opacity={0.5}
              />
              <Sparkles 
                scale={2.8} 
                count={isMobile ? 6 : 12} 
                size={1.5} 
                speed={0.3} 
                color="#FFA500"
                opacity={0.6}
              />
            </>
          )}
          <Environment preset="sunset" environmentIntensity={lowPerf ? 1.0 : 1.5} />
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