# Deployment & Authentication Guide

If your Google Login works in the AI Studio preview but fails on your deployed site (e.g., Vercel, Netlify, Cloud Run) with a popup error, this is a Firebase security feature. 

You must whitelist your deployed domain:
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`serene-engine-qwjkk`)
3. Go to **Authentication** > **Settings** > **Authorized domains**
4. Click **Add domain** and enter your deployed site's URL (e.g., `your-app.vercel.app`)

Wait a few minutes for the changes to propagate, and login will work on your deployed site!

## Firebase Project Name
Note: Your Firebase Project ID (`serene-engine-qwjkk`) is permanent. Google Cloud / Firebase does not allow renaming project IDs once they are created. If you absolutely need a different name, you must create a brand new Firebase project.
