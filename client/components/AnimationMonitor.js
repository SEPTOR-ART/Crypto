import { useEffect, useRef, useState } from 'react';

export default function AnimationMonitor({ threshold = 58 }) {
  const rafRef = useRef(0);
  const lastRef = useRef(performance.now());
  const framesRef = useRef(0);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    const tick = (now) => {
      framesRef.current += 1;
      const elapsed = now - lastRef.current;
      if (elapsed >= 1000) {
        setFps(Math.round((framesRef.current * 1000) / elapsed));
        framesRef.current = 0;
        lastRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div aria-live="polite" style={{
      position: 'fixed', right: 12, bottom: 12, padding: '6px 10px',
      background: 'rgba(0,0,0,0.7)', color: '#fff', borderRadius: 8,
      fontSize: 12, zIndex: 2000, boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
    }}>
      <strong>FPS:</strong> {fps} {fps < threshold ? '⚠' : ''}
    </div>
  );
}