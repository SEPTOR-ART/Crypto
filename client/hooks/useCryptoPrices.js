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
  const maxRetries = 3; // Reduce max retries
  const pollIntervalRef = useRef(null);
  const reconnectAttemptRef = useRef(false);
  const mountedRef = useRef(true);

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
      // Prevent multiple concurrent connection attempts
      if (reconnectAttemptRef.current || !mountedRef.current) {
        return;
      }
      
      reconnectAttemptRef.current = true;
      
      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

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
          retryCountRef.current = 0; // Reset retry count on successful connection
          reconnectAttemptRef.current = false;
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
          reconnectAttemptRef.current = false;
          
          // Don't retry if component is unmounted
          if (!mountedRef.current) {
            return;
          }
          
          // Check if this is an abnormal closure (code 1006)
          if (event.code === 1006) {
            console.warn('WebSocket closed abnormally. Fallback to polling.');
          }
          
          // Only retry if not closed intentionally and retry count is less than max
          if (!event.wasClean && event.code !== 1000 && retryCountRef.current < maxRetries) {
            retryCountRef.current += 1;
            console.log(`Retrying WebSocket connection... Attempt ${retryCountRef.current}/${maxRetries}`);
            
            // Exponential backoff with jitter (longer delays)
            const retryDelay = Math.min(2000 * Math.pow(2, retryCountRef.current), 30000) + Math.random() * 2000;
            
            retryTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                reconnectAttemptRef.current = false;
                createWebSocketConnection();
              }
            }, retryDelay);
          } else if (retryCountRef.current >= maxRetries) {
            console.log('Max WebSocket retries reached. Using polling fallback.');
            reconnectAttemptRef.current = false;
            if (!pollIntervalRef.current && mountedRef.current) {
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
              }, 60000); // Poll every 60 seconds when WebSocket fails
            }
          } else {
            // Clean close, don't retry
            reconnectAttemptRef.current = false;
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
      mountedRef.current = false;
      reconnectAttemptRef.current = false;
      
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting'); // Graceful close
        wsRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  return { prices, loading, error, refreshing };
};
