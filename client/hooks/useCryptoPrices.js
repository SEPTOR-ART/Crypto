import { useState, useEffect } from 'react';
import { cryptoService } from '../services/api';

export const useCryptoPrices = () => {
  const [prices, setPrices] = useState({
    BTC: 0,
    ETH: 0,
    LTC: 0,
    XRP: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get initial prices
    const fetchInitialPrices = async () => {
      try {
        const initialPrices = await cryptoService.getPrices();
        setPrices(initialPrices);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchInitialPrices();

    // Create WebSocket connection for real-time updates
    const ws = cryptoService.createPriceWebSocket();

    ws.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'PRICE_UPDATE' || message.type === 'INITIAL_PRICES') {
          setPrices(message.data);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Failed to connect to real-time price updates');
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Clean up WebSocket connection
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return { prices, loading, error };
};