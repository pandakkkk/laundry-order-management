# 🚀 Vercel Deployment Guide

## Prerequisites

✅ MongoDB Atlas database set up and running  
✅ Application working locally  
✅ GitHub/GitLab account  
✅ Vercel account (free tier is fine)

---

## Step 1: Prepare Your Code for Deployment

### 1.1 Create .gitignore (if not exists)

Create a `.gitignore` file in the root directory:

```
# Dependencies
node_modules/
client/node_modules/

# Environment variables
.env
.env.local
.env.production

# Build outputs
client/build/
dist/

# Logs
logs/
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
```

### 1.2 Verify package.json scripts

Your root `package.json` should have:
```json
{
  "scripts": {
    "start": "node server/index.js",
    "build": "cd client && npm run build"
  }
}
```

---

## Step 2: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Vercel deployment"

# Create GitHub repository and push
# (Follow GitHub instructions to create a new repository)
git remote add origin https://github.com/YOUR_USERNAME/order-monitoring.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Vercel

### 3.1 Import Project

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select your `order-monitoring` repository
5. Click **"Import"**

### 3.2 Configure Build Settings

Vercel should auto-detect the settings, but verify:

**Framework Preset:** Other  
**Root Directory:** `./`  
**Build Command:** `cd client && npm install && npm run build`  
**Output Directory:** `client/build`  
**Install Command:** `npm install`

### 3.3 Add Environment Variables

Click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `MONGODB_URI` | `mongodb+srv://Vercel-Admin-laundry-order-management:YTkHpuE20MEI9ZkK@laundry-order-managemen.nvjptop.mongodb.net/laundry-orders?retryWrites=true&w=majority` |
| `JWT_SECRET` | `laundry-app-secret-key-2024` (or generate a strong random string) |
| `NODE_ENV` | `production` |

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for deployment to complete
3. Once deployed, you'll get a URL like: `https://order-monitoring-xyz.vercel.app`

---

## Step 4: Test Deployment

### 4.1 Access Your App

Visit your Vercel URL: `https://your-app-name.vercel.app`

### 4.2 Test Login

Login with:
- **Email:** `sanjeevmurmu761@gmail.com`
- **Password:** `admin123`

### 4.3 Verify Features

✅ Dashboard loads with statistics  
✅ Orders page shows 100 orders  
✅ Customers page shows 20 customers  
✅ Can create new orders  
✅ Search and filters work  

---

## Step 5: Custom Domain (Optional)

### 5.1 Add Custom Domain

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain (e.g., `laundry.yourdomain.com`)
4. Follow DNS configuration instructions

### 5.2 Update DNS Records

Add these records to your domain:

**Type:** CNAME  
**Name:** `laundry` (or `@` for root domain)  
**Value:** `cname.vercel-dns.com`

---

## Troubleshooting

### Issue: 500 Internal Server Error

**Solution:** Check environment variables are set correctly in Vercel dashboard.

### Issue: API calls failing

**Solution:** Verify MONGODB_URI includes the database name `/laundry-orders`

### Issue: Build fails

**Solution:** 
1. Check build logs in Vercel
2. Ensure all dependencies are in `package.json`
3. Run `npm run build` locally to test

### Issue: Can't login after deployment

**Solution:** 
1. Check JWT_SECRET is set in environment variables
2. Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)

---

## MongoDB Atlas Network Access

### Allow Vercel IPs

Since Vercel uses dynamic IPs, you need to:

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. Navigate to: **Network Access**
3. Click **"Add IP Address"**
4. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
5. Click **"Confirm"**

⚠️ **Note:** This allows access from any IP. For production, consider:
- Using MongoDB's Vercel integration
- Setting up VPC peering
- Using MongoDB Atlas Search for better security

---

## Continuous Deployment

Once connected to GitHub, Vercel automatically deploys:
- ✅ **Main branch:** Auto-deploys to production
- ✅ **Pull Requests:** Creates preview deployments
- ✅ **Other branches:** Creates preview deployments

Simply push to GitHub and Vercel handles the rest!

```bash
git add .
git commit -m "Update feature"
git push
```

Your changes will be live in ~2 minutes!

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |
| `NODE_ENV` | Node environment | `production` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port (Vercel manages this) | `5000` |

---

## Post-Deployment Checklist

- [ ] Test login with all user roles
- [ ] Verify all CRUD operations work
- [ ] Test order creation flow
- [ ] Check customer management
- [ ] Verify search functionality
- [ ] Test on mobile devices
- [ ] Check browser console for errors
- [ ] Monitor Vercel logs for issues
- [ ] Set up custom domain (optional)
- [ ] Enable HTTPS (Vercel does this automatically)

---

## Updating Your Deployment

### Method 1: Through Git

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push

# Vercel automatically deploys
```

### Method 2: Through Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Method 3: Manual Deploy

1. Go to Vercel dashboard
2. Click your project
3. Go to **"Deployments"** tab
4. Click **"Redeploy"**

---

## Monitoring

### View Logs

1. Go to Vercel dashboard
2. Click your project
3. Click **"Logs"** tab
4. Monitor real-time logs

### Analytics

1. Go to **"Analytics"** tab
2. View:
   - Page views
   - Unique visitors
   - Performance metrics
   - Error rates

---

## Security Best Practices

### 1. Rotate Secrets Regularly

Change your `JWT_SECRET` every 90 days:
1. Generate new secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Update in Vercel environment variables
3. Redeploy

### 2. Use Strong Passwords

For production, change all default passwords:
```javascript
// Run this script to create new admin user
npm run create-admin
```

### 3. Enable MongoDB IP Whitelist

Instead of 0.0.0.0/0, whitelist specific IPs when possible.

### 4. Monitor Access Logs

Regularly check MongoDB Atlas logs for suspicious activity.

---

## Cost Estimates

### Vercel (Hobby Plan - Free)
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ 100GB bandwidth/month
- ✅ Serverless functions
- ✅ Perfect for this app!

### MongoDB Atlas (Free Tier)
- ✅ 512 MB storage
- ✅ Shared RAM
- ✅ Good for ~1000 orders
- 💰 Upgrade to $9/month for more storage

### Total Monthly Cost
**$0** (using free tiers)  
**$9** (if you upgrade MongoDB)

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas:** https://docs.atlas.mongodb.com/
- **React Deployment:** https://create-react-app.dev/docs/deployment/

---

## 🎉 You're Done!

Your Laundry Order Monitoring System is now live on Vercel with:
- ✅ Cloud database (MongoDB Atlas)
- ✅ Automatic HTTPS
- ✅ Continuous deployment
- ✅ Global CDN
- ✅ Serverless backend

**Share your app URL with your team and start managing orders!** 🚀

