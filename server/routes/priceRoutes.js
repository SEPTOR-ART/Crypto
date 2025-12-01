const express = require('express');
const router = express.Router();

// Placeholder route for prices
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Price routes placeholder',
    prices: {
      BTC: 43250.75,
      ETH: 2650.30,
      LTC: 85.42,
      XRP: 0.52
    }
  });
});

module.exports = router;