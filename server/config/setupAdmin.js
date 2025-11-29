const User = require('../models/User');

/**
 * Auto-create or promote admin user based on environment variables
 * This runs on server startup
 */
const setupAdminUser = async () => {
  try {
    // Check if admin setup is configured in environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'User';

    // Skip if no admin credentials configured
    if (!adminEmail) {
      console.log('ℹ️  No ADMIN_EMAIL configured - skipping admin setup');
      return;
    }

    // Check if user already exists
    let adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      // User exists - ensure they have admin privileges and update password if provided
      let updated = false;
      
      if (!adminUser.isAdmin) {
        adminUser.isAdmin = true;
        updated = true;
      }
      
      // Update password if provided in environment variables
      if (adminPassword) {
        // Set the password directly - the User model's pre-save hook will hash it
        adminUser.password = adminPassword;
        updated = true;
        console.log(`✅ Admin password updated for: ${adminEmail}`);
      }
      
      if (updated) {
        await adminUser.save();
        console.log(`✅ Promoted existing user to admin: ${adminEmail}`);
      } else {
        console.log(`✓ Admin user already exists: ${adminEmail}`);
      }
      return;
    }

    // User doesn't exist - create new admin user only if password is provided
    if (!adminPassword) {
      console.log(`⚠️  ADMIN_EMAIL is set but ADMIN_PASSWORD is missing - cannot create admin user`);
      return;
    }

    // Hash password - User model's pre-save hook will handle this
    // Don't hash manually to avoid double-hashing

    // Create admin user
    adminUser = new User({
      email: adminEmail,
      password: adminPassword, // Will be hashed by pre-save hook
      firstName: adminFirstName,
      lastName: adminLastName,
      isAdmin: true,
      emailVerified: true,
      kycStatus: 'verified',
      balance: {
        BTC: 0,
        ETH: 0,
        LTC: 0,
        XRP: 0
      }
    });

    await adminUser.save();
    console.log(`✅ Created new admin user: ${adminEmail}`);
    console.log(`⚠️  SECURITY: Change the admin password after first login!`);

  } catch (error) {
    console.error('❌ Error setting up admin user:', error.message);
    // Don't crash the server if admin setup fails
  }
};

module.exports = setupAdminUser;
