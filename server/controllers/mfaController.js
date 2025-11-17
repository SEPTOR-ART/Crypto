const User = require('../models/User');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate QR code for MFA setup
const generateMFAQRCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate a secret key for MFA
    const secret = speakeasy.generateSecret({
      name: `CryptoZen (${user.email})`,
      issuer: 'CryptoZen'
    });
    
    // Save the secret to the user's account (not yet enabled)
    user.twoFactorSecret = secret.base32;
    await user.save();
    
    // Generate QR code URL
    const qrCodeUrl = secret.otpauth_url;
    
    // Generate QR code image
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);
    
    res.json({
      secret: secret.base32,
      qrCodeDataUrl
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify MFA token and enable MFA
const verifyMFA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: 'MFA not set up' });
    }
    
    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });
    
    if (verified) {
      // Enable MFA
      user.twoFactorEnabled = true;
      
      // Generate backup codes
      const backupCodes = [];
      for (let i = 0; i < 10; i++) {
        backupCodes.push(
          Math.random().toString(36).substring(2, 10).toUpperCase()
        );
      }
      
      user.twoFactorBackupCodes = backupCodes;
      await user.save();
      
      res.json({
        success: true,
        backupCodes
      });
    } else {
      res.status(400).json({ message: 'Invalid token' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Disable MFA
const disableMFA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Disable MFA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = undefined;
    await user.save();
    
    res.json({ message: 'MFA disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify backup code
const verifyBackupCode = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: 'MFA not enabled' });
    }
    
    // Check if backup code exists
    const isValidCode = user.twoFactorBackupCodes.includes(code.toUpperCase());
    
    if (isValidCode) {
      // Remove the used backup code
      user.twoFactorBackupCodes = user.twoFactorBackupCodes.filter(
        c => c !== code.toUpperCase()
      );
      await user.save();
      
      res.json({ success: true });
    } else {
      res.status(400).json({ message: 'Invalid backup code' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateMFAQRCode,
  verifyMFA,
  disableMFA,
  verifyBackupCode
};