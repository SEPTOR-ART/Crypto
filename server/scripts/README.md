# Database Migration Scripts

This directory contains scripts to fix database issues.

## Fix Wallet Address Index

If you're experiencing the error:
```
E11000 duplicate key error collection: test.users index: walletAddress_1 dup key: { walletAddress: null }
```

You need to run this script with the correct MongoDB connection string.

### For Local Development:

1. Make sure MongoDB is running on your local machine
2. Run the script:
   ```bash
   npm run fix-wallet-index
   ```

### For Render Deployment:

1. Get your MongoDB connection string from your Render dashboard
2. Set it as an environment variable and run the script:
   ```bash
   MONGODB_URI="your_render_mongodb_connection_string" npm run fix-wallet-index
   ```

### For Other Environments:

1. Set your MongoDB connection string in the `.env` file:
   ```
   MONGODB_URI=your_mongodb_connection_string_here
   ```
2. Run the script:
   ```bash
   npm run fix-wallet-index
   ```

This script will:
1. Connect to your MongoDB database
2. Drop the existing problematic unique index on walletAddress
3. Create a new partial index that only enforces uniqueness for non-empty string values
4. Verify the new index was created correctly

## Troubleshooting

If you get connection errors:
1. Verify your MongoDB connection string is correct
2. Ensure your MongoDB instance is accessible from your current network
3. Check that any required authentication details are included in the connection string