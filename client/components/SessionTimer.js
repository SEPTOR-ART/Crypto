import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SessionTimer() {
  const { sessionExpiry, logout } = useAuth();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!sessionExpiry) {
      setTimeLeft('Not available');
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = sessionExpiry - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        // Auto logout when session expires
        logout();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [sessionExpiry, logout]);

  return <>{timeLeft}</>;
}
