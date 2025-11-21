import { useState, useEffect, useRef } from 'react';
import styles from './Chart.module.css';

const Chart = ({ prices, selectedCrypto, loading, error }) => {
  const canvasRef = useRef(null);
  const [timeframe, setTimeframe] = useState('1d'); // 1d, 1w, 1m
  const priceHistoryRef = useRef([]);

  // Generate mock price history data based on current prices
  useEffect(() => {
    if (prices && prices[selectedCrypto] && !loading) {
      const currentPrice = parseFloat(prices[selectedCrypto]);
      
      // Initialize or update price history
      if (priceHistoryRef.current.length === 0) {
        // Generate initial price history (last 24 points)
        const history = [];
        const now = Date.now();
        for (let i = 23; i >= 0; i--) {
          const time = now - i * 60000; // 1 minute intervals
          // Generate realistic price variations
          const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
          const price = currentPrice * (1 + variation * (24 - i) / 24);
          history.push({ time, price });
        }
        priceHistoryRef.current = history;
      } else {
        // Add new price point
        const now = Date.now();
        const newPoint = { time: now, price: currentPrice };
        
        // Add to history and keep only last 24 points
        priceHistoryRef.current.push(newPoint);
        if (priceHistoryRef.current.length > 24) {
          priceHistoryRef.current.shift();
        }
      }
      
      // Draw chart
      drawChart();
    }
  }, [prices, selectedCrypto, loading]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || priceHistoryRef.current.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set chart dimensions with padding
    const padding = 20;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    // Get price data
    const prices = priceHistoryRef.current.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1; // Avoid division by zero
    
    // Draw grid
    ctx.strokeStyle = '#3d3d3d';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let i = 0; i <= 6; i++) {
      const x = padding + (i * chartWidth / 6);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * chartHeight / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Draw price line
    if (priceHistoryRef.current.length > 1) {
      const points = priceHistoryRef.current.map((point, index) => {
        const x = padding + (index * chartWidth / (priceHistoryRef.current.length - 1));
        const y = padding + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
        return { x, y };
      });
      
      // Determine line color based on price trend
      const firstPrice = priceHistoryRef.current[0].price;
      const lastPrice = priceHistoryRef.current[priceHistoryRef.current.length - 1].price;
      const isUp = lastPrice > firstPrice;
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      // Draw smooth line
      for (let i = 1; i < points.length; i++) {
        const xc = (points[i].x + points[i - 1].x) / 2;
        const yc = (points[i].y + points[i - 1].y) / 2;
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
      }
      
      ctx.quadraticCurveTo(
        points[points.length - 1].x, 
        points[points.length - 1].y,
        points[points.length - 1].x, 
        points[points.length - 1].y
      );
      
      ctx.strokeStyle = isUp ? '#4caf50' : '#f44336';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw filled area under curve
      ctx.lineTo(points[points.length - 1].x, height - padding);
      ctx.lineTo(points[0].x, height - padding);
      ctx.closePath();
      
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, isUp ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)');
      gradient.addColorStop(1, isUp ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)');
      
      ctx.fillStyle = gradient;
      ctx.fill();
    }
    
    // Draw current price indicator
    if (priceHistoryRef.current.length > 0) {
      const currentPoint = priceHistoryRef.current[priceHistoryRef.current.length - 1];
      const x = padding + chartWidth;
      const y = padding + chartHeight - ((currentPoint.price - minPrice) / priceRange) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#6a0dad';
      ctx.fill();
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        // Set canvas dimensions to match its display size
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
          canvas.width = displayWidth;
          canvas.height = displayHeight;
          drawChart();
        }
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.chartPlaceholder}>
          <p>Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.chartPlaceholder}>
          <p>Error loading chart: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer} style={{ height: '100%' }}>
      <div className={styles.chartWrapper}>
        <canvas 
          ref={canvasRef} 
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles[selectedCrypto.toLowerCase()]}`}></div>
          <span>{selectedCrypto}/USD</span>
        </div>
      </div>
    </div>
  );
};

export default Chart;