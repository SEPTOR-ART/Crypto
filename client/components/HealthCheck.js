import { useState, useEffect } from 'react';
import styles from '../styles/HealthCheck.module.css';

const HealthCheck = () => {
  const [status, setStatus] = useState('checking');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    // Skip health check on static hosting (Netlify)
    if (typeof window !== 'undefined' && /netlify\.app$/.test(window.location.hostname)) {
      setStatus('static');
      setDetails({ message: 'Health check not available on static hosting' });
      return;
    }
    
    const checkHealth = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
        const isPlaceholder = /your-render-app-name/.test(API_BASE_URL);
        if (isPlaceholder) {
          setStatus('unhealthy');
          setDetails({ error: 'API base URL is not configured' });
          return;
        }
        if (isPlaceholder) {
          setStatus('unhealthy');
          setDetails({ error: 'API base URL is not configured' });
          return;
        }
        const response = await fetch(`${API_BASE_URL}/health`);
        
        if (response.ok) {
          const data = await response.json();
          setStatus('healthy');
          setDetails(data);
        } else {
          setStatus('unhealthy');
          setDetails({ error: `HTTP ${response.status}` });
        }
      } catch (error) {
        // Silently fail health checks in production static hosting
        if (typeof window !== 'undefined' && /netlify\.app$/.test(window.location.hostname)) {
          setStatus('static');
          setDetails({ message: 'Static hosting - health check disabled' });
        } else {
          setStatus('unhealthy');
          setDetails({ error: error.message });
        }
      }
    };

    checkHealth();
    
    // Check every 60 seconds (reduced frequency)
    const interval = setInterval(checkHealth, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (status === 'checking' || status === 'static') {
    return null; // Don't show health check on static hosting
  }

  return (
    <div className={styles.healthCheck}>
      <span className={status === 'healthy' ? styles.healthy : styles.unhealthy}>
        API Status: {status}
      </span>
      {details && (
        <div className={styles.details}>
          {details.timestamp && <div>Last check: {new Date(details.timestamp).toLocaleString()}</div>}
          {details.error && <div>Error: {details.error}</div>}
        </div>
      )}
    </div>
  );
};

export default HealthCheck;
