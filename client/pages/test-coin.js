import { useState } from 'react';
import ThreeCoin from '../components/ThreeCoin';
import Head from 'next/head';

export default function TestCoin() {
  const [size, setSize] = useState(300);
  
  return (
    <div style={{ minHeight: '100vh', background: '#0a0b14', color: 'white', padding: '2rem' }}>
      <Head>
        <title>3D Coin Test - CryptoZen</title>
      </Head>
      
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#00d4ff' }}>
        3D Coin Animation Test Page
      </h1>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Controls */}
        <div style={{ 
          background: 'rgba(26, 27, 38, 0.6)', 
          padding: '1.5rem', 
          borderRadius: '12px',
          marginBottom: '2rem',
          border: '1px solid rgba(0, 212, 255, 0.2)'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Controls</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <label>Size: {size}px</label>
            <input 
              type="range" 
              min="100" 
              max="600" 
              value={size} 
              onChange={(e) => setSize(parseInt(e.target.value))}
              style={{ flex: 1 }}
            />
          </div>
        </div>
        
        {/* Test Cases */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* Test 1: Default Size */}
          <div style={{
            background: 'rgba(26, 27, 38, 0.4)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(0, 212, 255, 0.2)'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#00d4ff' }}>Test 1: Default</h3>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
              Using default ThreeCoin component
            </p>
            <div style={{ 
              background: '#000', 
              padding: '2rem', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '350px'
            }}>
              <ThreeCoin />
            </div>
          </div>
          
          {/* Test 2: Custom Size */}
          <div style={{
            background: 'rgba(26, 27, 38, 0.4)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(168, 85, 247, 0.2)'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#a855f7' }}>Test 2: Custom Size</h3>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
              Adjustable size (use slider)
            </p>
            <div style={{ 
              background: '#000', 
              padding: '2rem', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '350px'
            }}>
              <div style={{ width: `${size}px`, height: `${size}px` }}>
                <ThreeCoin />
              </div>
            </div>
          </div>
          
          {/* Test 3: In Constrained Container */}
          <div style={{
            background: 'rgba(26, 27, 38, 0.4)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 215, 0, 0.2)'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#ffd700' }}>Test 3: Constrained</h3>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
              Max-width: 240px (like heroAside)
            </p>
            <div style={{ 
              background: '#000', 
              padding: '2rem', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '350px'
            }}>
              <div style={{ maxWidth: '240px', width: '100%' }}>
                <ThreeCoin />
              </div>
            </div>
          </div>
          
          {/* Test 4: Overflow Hidden */}
          <div style={{
            background: 'rgba(26, 27, 38, 0.4)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#ef4444' }}>Test 4: Overflow Hidden</h3>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
              Container with overflow: hidden
            </p>
            <div style={{ 
              background: '#000', 
              padding: '2rem', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '350px',
              overflow: 'hidden'
            }}>
              <ThreeCoin />
            </div>
          </div>
        </div>
        
        {/* Diagnostic Info */}
        <div style={{
          background: 'rgba(26, 27, 38, 0.6)',
          padding: '1.5rem',
          borderRadius: '12px',
          marginTop: '2rem',
          border: '1px solid rgba(0, 212, 255, 0.2)'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Diagnostic Information</h2>
          <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem', fontFamily: 'monospace' }}>
            <div>✅ WebGL Support: {typeof window !== 'undefined' && (() => {
              try {
                const canvas = document.createElement('canvas');
                return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) ? 'Yes' : 'No';
              } catch {
                return 'Unknown';
              }
            })()} </div>
            <div>✅ Device Memory: {typeof navigator !== 'undefined' ? (navigator.deviceMemory || 'Unknown') + ' GB' : 'Unknown'}</div>
            <div>✅ Hardware Concurrency: {typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 'Unknown') + ' cores' : 'Unknown'}</div>
            <div>✅ User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) + '...' : 'Unknown'}</div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '2rem', padding: '2rem' }}>
          <a href="/" style={{ color: '#00d4ff', textDecoration: 'underline', fontSize: '1.1rem' }}>
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
