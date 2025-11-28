import { useState, useEffect } from 'react';
import styles from '../styles/HealthCheck.module.css';

const HealthCheck = () => {
  const [status, setStatus] = useState('checking');
  const [details, setDetails] = useState(null);

  useEffect(() => {
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
        setStatus('unhealthy');
        setDetails({ error: error.message });
      }
    };

    checkHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (status === 'checking') {
    return (
      <div className={styles.healthCheck}>
        <span className={styles.checking}>Checking API health...</span>
      </div>
    );
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
