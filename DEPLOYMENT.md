# Deployment Guide for Render

## Backend Deployment (https://dairy-1-baro.onrender.com)

### Environment Variables
Set these environment variables in your Render backend service:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=https://dairy-frontend-1.onrender.com
```

### Build Command
```bash
npm install
```

### Start Command
```bash
npm start
```

## Frontend Deployment (https://dairy-frontend-1.onrender.com)

### Environment Variables
Set these environment variables in your Render frontend service:

```
VITE_API_URL=https://dairy-1-baro.onrender.com
```

### Build Command
```bash
npm install && npm run build
```

### Publish Directory
```
dist
```

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:5173` (for local development)
- `https://dairy-frontend-1.onrender.com` (for production)

## Database

Make sure your MongoDB database is accessible from Render's servers. You can use:
- MongoDB Atlas (recommended)
- Self-hosted MongoDB with proper network access

## Important Notes

1. **Environment Variables**: Always set the environment variables in Render's dashboard
2. **Database Connection**: Ensure your MongoDB connection string is correct and accessible
3. **CORS**: The backend is already configured to accept requests from the frontend URL
4. **Build Process**: The frontend build process will automatically use the correct API URL

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Check that the frontend URL is included in the backend's CORS configuration
2. **Database Connection**: Verify your MongoDB connection string and network access
3. **Environment Variables**: Ensure all required environment variables are set in Render
4. **Build Failures**: Check the build logs for any missing dependencies or configuration issues
5. **API Endpoint Errors**: 
   - Ensure all route files are properly created (`admin.js`, `farmer.js`, `auth.js`)
   - Verify routes are mounted with correct prefixes in `server.js`
   - Check that middleware is properly configured

### Recent Fixes Applied:
- ✅ Fixed double `/admin` prefix in routes
- ✅ Created missing farmer routes (`/farmer/milk-logs`)
- ✅ Improved error handling in frontend API calls
- ✅ Enhanced CORS configuration for Render deployment
- ✅ Updated route mounting in server.js

### Testing Endpoints:
Run the test script to verify endpoints are working:
```bash
node test-endpoints.js
``` 