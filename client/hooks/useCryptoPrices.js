import { useState, useEffect, useRef } from 'react';
import { cryptoService } from '../services/api';

export const useCryptoPrices = () => {
  const [prices, setPrices] = useState({
    BTC: 0,
    ETH: 0,
    LTC: 0,
    XRP: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    // Get initial prices
    const fetchInitialPrices = async () => {
      try {
        const initialPrices = await cryptoService.getPrices();
        setPrices(initialPrices);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch initial prices:', err);
        setError(err.message || 'Failed to load initial prices');
        setLoading(false);
      }
    };

    // Create WebSocket connection with retry logic
    const createWebSocketConnection = () => {
      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      // Reset retry count when creating a new connection attempt
      retryCountRef.current = 0;

      try {
        const ws = cryptoService.createPriceWebSocket();
        wsRef.current = ws;
        if (!ws) {
          if (!pollIntervalRef.current) {
            pollIntervalRef.current = setInterval(async () => {
              try {
                const refreshed = await cryptoService.getPrices();
                setPrices(prev => ({ ...prev, ...refreshed }));
                setRefreshing(true);
                setTimeout(() => setRefreshing(false), 300);
              } catch (e) {
                console.error('Polling failed', e);
              }
            }, 5000);
          }
          return;
        }

        ws.onopen = () => {
          console.log('WebSocket connection opened successfully');
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'PRICE_UPDATE' || message.type === 'INITIAL_PRICES') {
              setPrices(prevPrices => ({
                ...prevPrices,
                ...message.data
              }));
              if (message.type === 'PRICE_UPDATE') {
                setRefreshing(true);
                setTimeout(() => setRefreshing(false), 300);
              }
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error occurred:', error);
          setError('Failed to connect to real-time price updates');
        };

        ws.onclose = (event) => {
          console.log('WebSocket connection closed', event);
          
          // Check if this is an abnormal closure (code 1006)
          if (event.code === 1006) {
            console.warn('WebSocket connection was closed abnormally. This may indicate a network issue or server problem.');
            setError('Unable to establish real-time connection. Using periodic updates instead.');
          }
          
          // Only retry if not closed intentionally and retry count is less than max
          if (!event.wasClean && retryCountRef.current < maxRetries) {
            retryCountRef.current += 1;
            console.log(`Retrying WebSocket connection... Attempt ${retryCountRef.current}/${maxRetries}`);
            
            // Exponential backoff with jitter
            const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000) + Math.random() * 1000;
            
            retryTimeoutRef.current = setTimeout(() => {
              createWebSocketConnection();
            }, retryDelay);
          } else if (retryCountRef.current >= maxRetries) {
            setError('Unable to establish real-time connection after multiple attempts. Using periodic updates.');
            if (!pollIntervalRef.current) {
              pollIntervalRef.current = setInterval(async () => {
                try {
                  const refreshed = await cryptoService.getPrices();
                  setPrices(prev => ({ ...prev, ...refreshed }));
                  setRefreshing(true);
                  setTimeout(() => setRefreshing(false), 300);
                } catch (e) {
                  console.error('Polling failed', e);
                  // Handle rate limit errors
                  if (e.message && e.message.includes('429')) {
                    console.log('Rate limit hit, reducing polling frequency');
                    // Reduce polling frequency when rate limited
                    if (pollIntervalRef.current) {
                      clearInterval(pollIntervalRef.current);
                    }
                    pollIntervalRef.current = setInterval(async () => {
                      try {
                        const refreshed = await cryptoService.getPrices();
                        setPrices(prev => ({ ...prev, ...refreshed }));
                        setRefreshing(true);
                        setTimeout(() => setRefreshing(false), 300);
                      } catch (e) {
                        console.error('Polling failed', e);
                      }
                    }, 60000); // Increase to 1 minute when rate limited
                  }
                }
              }, 30000); // Increase polling interval to 30 seconds to reduce server load
            }
          }
        };
      } catch (err) {
        console.error('Failed to create WebSocket connection:', err);
        setError('Failed to establish real-time price connection');
        
        // Retry with exponential backoff
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000) + Math.random() * 1000;
          
          retryTimeoutRef.current = setTimeout(() => {
            createWebSocketConnection();
          }, retryDelay);
        }
      }
    };

    // Fetch initial prices
    fetchInitialPrices();
    
    // Create WebSocket connection
    createWebSocketConnection();

    // Clean up WebSocket connection and timeouts
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting'); // Graceful close
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return { prices, loading, error, refreshing };
};
