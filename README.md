# Candidate Form - Full Stack Application

A comprehensive candidate submission and verification system with resume extraction and ATS scoring.

## 📁 Project Structure

```
Candidate-Form/
├── backend/          # Express.js backend API
│   ├── config/       # Database configuration
│   ├── controllers/  # Route controllers
│   ├── middleware/   # Custom middleware (file upload)
│   ├── models/       # MongoDB schemas
│   ├── routes/       # API routes
│   ├── utils/        # Helper functions (ATS scoring, resume parsing)
│   ├── uploads/      # User uploaded files
│   ├── package.json
│   ├── index.js
│   ├── server.js
│   └── .env          # Backend environment variables
│
└── frontend/         # React + Vite frontend
    ├── src/
    │   ├── components/   # React components
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js
    └── .env.local       # Frontend environment variables
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account
- Google Generative AI API key

### Backend Setup

```bash
cd backend
npm install

# Create .env file with:
MONGODB_URI=your_mongodb_connection_string
GOOGLE_API_KEY=your_google_api_key
PORT=3000
```

Start backend:
```bash
npm start
```

Backend runs on `http://localhost:3000`

### Frontend Setup

```bash
cd frontend
npm install
```

Start frontend:
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## ✨ Features

### Resume Processing
- PDF text extraction
- Skill identification
- Experience parsing
- Education extraction
- Contact information parsing

### ATS Score Calculation
Hybrid approach (no API calls):
- **Skills Match (40%)**: Based on skill count
- **Experience (30%)**: Years and role levels
- **Education (20%)**: Degree levels
- **Keywords (10%)**: Industry keyword matching

Final Score: 0-100

### Document Management
- Resume upload and parsing
- Aadhar document handling
- Marksheet (10th & 12th) handling
- Automatic file organization

### Candidate Data Storage
- MongoDB persistence
- Structured candidate profiles
- Document references
- Extraction results

## 📡 API Endpoints

### POST `/api/candidates/submit`
Submit form with candidate info and files
- Required files: resume, aadhar, marksheet10, marksheet12

### POST `/api/candidates/:id/verify`
Trigger verification and ATS scoring

### GET `/api/candidates/:id`
Retrieve candidate data with extracted information

### GET `/api/candidates`
Get all candidates

## 🔧 Technical Stack

**Backend:**
- Express.js 5.1.0
- MongoDB + Mongoose 8.20.0
- Multer 1.4.5 (file uploads)
- pdf-parse 1.1.1 (PDF text extraction)
- Google Generative AI (optional verification)

**Frontend:**
- React (Hooks)
- Vite (build tool)
- Axios + Fetch API
- Pure CSS styling

## 📝 Notes

- Verification for Aadhar/Marksheet currently disabled (placeholder)
- All resume extraction working end-to-end
- ATS score calculation uses no external API calls
- Form submission triggers automatic verification

## 🔐 Environment Variables

### Backend (.env)
```
MONGODB_URI=your_mongodb_connection_string
GOOGLE_API_KEY=your_google_generative_ai_key
PORT=3000
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3000
```

## 📦 Deployment

Ready for deployment on platforms like:
- Heroku (backend)
- Vercel/Netlify (frontend)
- AWS/GCP/Azure

## 🤝 Contributing

For improvements or fixes, create a new branch and submit a pull request.

## 📄 License

ISC
