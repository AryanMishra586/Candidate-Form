# Google Gemini API Setup Guide

## Get Your Free API Key

1. Go to: https://ai.google.dev
2. Click **Get API Key**
3. Click **Create API Key in new project**
4. Copy your API key (looks like: `AIzaSy...`)

## Update .env

Replace this line in `.env`:
```
GOOGLE_API_KEY=your_google_gemini_api_key_here
```

With your actual key:
```
GOOGLE_API_KEY=AIzaSy...
```

## Start Server

```powershell
npm run dev
```

## Benefits of Using Gemini

✅ **Free tier:** 60 requests/minute (very generous)
✅ **No credit card required** for free API key
✅ **High quality responses** for document analysis
✅ **Better for** OCR verification and resume analysis
✅ **Fast responses** compared to many alternatives

## What Changed

- ❌ Removed: OpenAI dependency
- ✅ Added: Google Generative AI dependency
- ✅ Updated: `utils/aiVerification.js` to use Gemini
- ✅ Updated: `utils/atsScore.js` to use Gemini
- ✅ Updated: `.env` to use GOOGLE_API_KEY instead of OPENAI_API_KEY

## Testing

Once you add your API key to `.env`:

```powershell
npm run dev
```

Then test with Postman (same as before):
1. POST `/api/candidates/submit` - Upload files
2. POST `/api/candidates/{id}/verify` - Trigger AI verification

The response will be the same, but powered by Google Gemini instead of OpenAI!

## Cost Estimation

- **Free tier:** Up to 60 requests/minute
- **After free credits:** Very affordable pay-as-you-go pricing
- **For a resume verification:** ~0.002 USD per request

Much cheaper than OpenAI!
