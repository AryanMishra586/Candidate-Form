# Render Deployment Guide

## Prerequisites
- GitHub account (already have AryanMishra586)
- Render account (free tier available at render.com)
- MongoDB Atlas connection string
- Google API key

## Step-by-Step Deployment

### 1. Push Latest Changes to GitHub
```bash
git add .
git commit -m "Ready for Render deployment with environment variables"
git push origin main
```

### 2. Create Render Account & Connect GitHub
1. Go to https://render.com
2. Sign up with GitHub (AryanMishra586)
3. Authorize Render to access your repositories
4. Select the Candidate-Form repository

### 3. Deploy Backend Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect to your Candidate-Form repository
3. Configure:
   - **Name**: `candidate-form-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free tier (or paid if needed)

4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = Your MongoDB Atlas connection string
   - `GOOGLE_API_KEY` = Your Google API key
   - `PORT` = Leave blank (Render sets this automatically)

5. Click **"Deploy"**
6. Note the backend URL (e.g., `https://candidate-form-backend.onrender.com`)

### 4. Deploy Frontend Service

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect to same repository
3. Configure:
   - **Name**: `candidate-form-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

4. Add Environment Variables:
   - `VITE_API_URL` = `https://candidate-form-backend.onrender.com` (from step 3)

5. Click **"Deploy"**
6. Note the frontend URL (e.g., `https://candidate-form-frontend.onrender.com`)

### 5. Update Frontend API URL (Optional)

If you need to change the API URL after deployment:
1. Go to Frontend service in Render
2. Navigate to **Environment** tab
3. Update `VITE_API_URL` to your backend URL
4. Click **"Deploy"** to redeploy

### 6. Monitor Deployments

1. **Backend**: Check logs at Render dashboard
   - Look for "Server running on..." message
   - If errors, check MongoDB connection and API key

2. **Frontend**: Should auto-deploy when backend is ready
   - Visit your frontend URL
   - Check browser console for any API errors

## Environment Variables Reference

### Backend (.env)
```
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0
GOOGLE_API_KEY=your_key_here
NODE_ENV=production
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend-url.onrender.com
```

## Troubleshooting

### Backend won't deploy
- Check `backend/package.json` has correct start script
- Verify MongoDB URI is correct
- Check Google API key is valid

### Frontend can't reach backend
- Verify `VITE_API_URL` is set correctly
- Check CORS is enabled in backend
- Look at browser console for fetch errors

### Files not uploading to Google Drive
- Verify `GOOGLE_API_KEY` environment variable is set
- Check Google Drive API is enabled in your project
- Files will fallback to local storage if API fails

## Auto-Deployment

Both services are configured for auto-deployment:
- Push to `main` branch → Render automatically redeploys
- Deployments take 2-5 minutes
- Check Render dashboard for build status

## Free Tier Limits

- 15 min idle time (spin down to 0 if inactive)
- Limited build time
- If you need always-on service, upgrade to paid plan

## Support

- Render Docs: https://render.com/docs
- GitHub Issues: Check your repository
- Contact: Check Render support
