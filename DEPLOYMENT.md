# CryptoZen Deployment Guide

This guide explains how to deploy the CryptoZen cryptocurrency exchange platform to Netlify (frontend) and Render (backend).

## Prerequisites

1. GitHub account
2. Netlify account
3. Render account
4. MongoDB database (MongoDB Atlas recommended)

## Frontend Deployment (Netlify)

1. **Connect to Netlify:**
   - Go to [Netlify](https://netlify.com) and sign in
   - Click "New site from Git"
   - Connect your GitHub account
   - Select your CryptoZen repository

2. **Configure Build Settings:**
   - Base directory: `client/`
   - Build command: `npm run build`
   - Publish directory: `out/`

3. **Environment Variables:**
   - Go to Site settings > Build & deploy > Environment
   - Add the following variables:
     ```
     NEXT_PUBLIC_API_BASE_URL=https://your-render-app-name.onrender.com
     NEXT_PUBLIC_WS_BASE_URL=wss://your-render-app-name.onrender.com
     ```

4. **Deploy:**
   - Click "Deploy site"
   - Netlify will automatically build and deploy your site

## Backend Deployment (Render)

1. **Connect to Render:**
   - Go to [Render](https://render.com) and sign in
   - Click "New" > "Web Service"
   - Connect your GitHub account
   - Select your CryptoZen repository

2. **Configure Service Settings:**
   - Name: `cryptozen-backend`
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`
   - Instance type: Free

3. **Environment Variables:**
   - Go to Advanced settings > Environment variables
   - Add the following variables:
     ```
     NODE_ENV=production
     PORT=5000
     JWT_SECRET=your_secure_jwt_secret
     MONGODB_URI=your_mongodb_connection_string
     ALLOWED_ORIGINS=https://your-netlify-domain.netlify.app
     ```

4. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy your backend

## MongoDB Setup

1. **Create MongoDB Atlas Account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create Cluster:**
   - Create a free tier cluster
   - Select AWS, GCP, or Azure as provider
   - Choose a region near your users

3. **Configure Database:**
   - Create a database user
   - Add your IP address to the whitelist (or allow access from anywhere for development)
   - Get the connection string

4. **Update Environment Variables:**
   - Replace `your_mongodb_connection_string` with your actual MongoDB connection string
   - Update the JWT_SECRET with a strong secret key

## Post-Deployment Configuration

1. **Update Frontend Environment Variables:**
   - After deploying the backend, update the Netlify environment variables with your actual Render URL:
     ```
     NEXT_PUBLIC_API_BASE_URL=https://your-render-app-name.onrender.com
     NEXT_PUBLIC_WS_BASE_URL=wss://your-render-app-name.onrender.com
     ```

2. **Redeploy Frontend:**
   - Trigger a new deployment on Netlify to apply the environment variable changes

## Custom Domain (Optional)

### Frontend (Netlify):
1. Go to Site settings > Domain management
2. Add your custom domain
3. Configure DNS records as instructed

### Backend (Render):
1. Go to your web service > Settings
2. Add a custom domain
3. Configure DNS records as instructed

## Monitoring and Maintenance

- Monitor your applications through the Netlify and Render dashboards
- Set up alerts for downtime or performance issues
- Regularly update dependencies for security
- Backup your MongoDB database regularly
- Use the built-in health check endpoint at `/health` to monitor backend status

## Troubleshooting

1. **Failed to Fetch Errors:**
   - Check that your API URLs are correct in environment variables
   - Ensure CORS is properly configured on your backend
   - Verify that your backend is running and accessible
   - Check the health status indicator in the bottom right corner of the frontend

2. **Build Failures:**
   - Check the build logs on Netlify/Render
   - Ensure all dependencies are correctly specified
   - Verify Node.js versions match your development environment

3. **Database Connection Issues:**
   - Check your MongoDB connection string
   - Verify IP whitelist settings
   - Ensure your MongoDB cluster is not paused

## Support

For issues with deployment, please check the documentation for [Netlify](https://docs.netlify.com/) and [Render](https://render.com/docs).