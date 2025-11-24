# Database Migration Scripts

This directory contains scripts to fix database issues.

## Fix Wallet Address Index

If you're experiencing the error:
```
E11000 duplicate key error collection: test.users index: walletAddress_1 dup key: { walletAddress: null }
```

Run the following command to fix the index:

```bash
npm run fix-wallet-index
```

This script will:
1. Connect to your MongoDB database
2. Drop the existing problematic unique index on walletAddress
3. Create a new partial index that only enforces uniqueness for non-empty string values
4. Verify the new index was created correctly

## Prerequisites

Make sure you have the correct MongoDB connection string in your `.env` file:
```
MONGODB_URI=your_mongodb_connection_string_here
```