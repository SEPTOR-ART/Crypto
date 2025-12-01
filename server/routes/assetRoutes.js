const express = require('express');
const router = express.Router();

// Placeholder route for assets
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Asset routes placeholder',
    assets: [
      { symbol: 'BTC', name: 'Bitcoin' },
      { symbol: 'ETH', name: 'Ethereum' },
      { symbol: 'LTC', name: 'Litecoin' },
      { symbol: 'XRP', name: 'Ripple' }
    ]
  });
});

module.exports = router;