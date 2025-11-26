# Backend Testing Guide

## Project Structure

```
Form/
├── config/
│   └── db.js                    # MongoDB connection
├── controllers/
│   └── candidateController.js   # Main business logic
├── middleware/
│   └── upload.js               # Multer file upload configuration
├── models/
│   ├── Candidate.js            # Candidate schema
│   └── Document.js             # Document schema
├── routes/
│   └── candidateRoutes.js       # API endpoints
├── utils/
│   ├── resumeParser.js         # Resume PDF parsing
│   ├── aiVerification.js       # OCR & AI verification
│   └── atsScore.js             # ATS scoring
├── uploads/                    # Uploaded files directory
├── index.js                    # Express server setup
├── .env                        # Environment variables
└── package.json               # Dependencies
```

## Environment Setup

### Required Environment Variables (.env)

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/formdb
OPENAI_API_KEY=your_openai_api_key_here
```

**Important:** Get your OpenAI API key from: https://platform.openai.com/api-keys

### Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will run on: `http://localhost:3000`

---

## API Endpoints

### 1. Submit Form with Files
**POST** `/api/candidates/submit`

**Description:** Upload candidate form with documents

**Request Body (multipart/form-data):**
```
- name: "John Doe" (text, required)
- email: "john@example.com" (text, required)
- phone: "1234567890" (text, optional)
- aadhar: "1234567890123" (text, optional)
- resume: [PDF file] (file, optional)
- aadhar: [PDF/Image file] (file, optional)
- marksheet10: [PDF/Image file] (file, optional)
- marksheet12: [PDF/Image file] (file, optional)
```

**Response (201 Created):**
```json
{
  "message": "Form submitted successfully",
  "candidateId": "674a1b2c3d4e5f6g7h8i9j0k",
  "candidate": {
    "_id": "674a1b2c3d4e5f6g7h8i9j0k",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "aadhar": "1234567890123",
    "documents": ["doc_id_1", "doc_id_2", "doc_id_3", "doc_id_4"],
    "verificationStatus": "pending",
    "createdAt": "2024-11-26T10:30:00.000Z"
  }
}
```

**Postman Instructions:**
1. Set request type to **POST**
2. URL: `http://localhost:3000/api/candidates/submit`
3. Go to **Body** tab → Select **form-data**
4. Add fields:
   - Key: `name` → Value: "John Doe"
   - Key: `email` → Value: "john@example.com"
   - Key: `resume` → Select File (PDF)
   - Key: `aadhar` → Select File (Image/PDF)
   - etc.

---

### 2. Get All Candidates
**GET** `/api/candidates`

**Description:** Fetch all submitted candidates

**Response (200 OK):**
```json
{
  "total": 2,
  "candidates": [
    {
      "_id": "674a1b2c3d4e5f6g7h8i9j0k",
      "name": "John Doe",
      "email": "john@example.com",
      "atsScore": null,
      "verificationStatus": "pending",
      "documents": [
        {
          "_id": "doc_id_1",
          "type": "resume",
          "status": "pending"
        }
      ],
      "createdAt": "2024-11-26T10:30:00.000Z"
    }
  ]
}
```

**Postman Instructions:**
1. Set request type to **GET**
2. URL: `http://localhost:3000/api/candidates`
3. Click **Send**

---

### 3. Get Specific Candidate
**GET** `/api/candidates/:id`

**Description:** Get candidate details with all documents

**Response (200 OK):**
```json
{
  "_id": "674a1b2c3d4e5f6g7h8i9j0k",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "aadhar": "1234567890123",
  "documents": [
    {
      "_id": "doc_id_1",
      "type": "resume",
      "filePath": "uploads/resume-123456.pdf",
      "originalName": "resume.pdf",
      "mimeType": "application/pdf",
      "fileSize": 245000,
      "status": "pending",
      "parsedData": {},
      "atsScore": null,
      "createdAt": "2024-11-26T10:30:00.000Z"
    }
  ],
  "extractedData": {},
  "atsScore": null,
  "verificationStatus": "pending",
  "createdAt": "2024-11-26T10:30:00.000Z",
  "updatedAt": "2024-11-26T10:30:00.000Z"
}
```

**Postman Instructions:**
1. Set request type to **GET**
2. URL: `http://localhost:3000/api/candidates/674a1b2c3d4e5f6g7h8i9j0k`
3. Replace ID with actual candidate ID from submit response

---

### 4. Verify Candidate Documents & Generate Scores
**POST** `/api/candidates/:id/verify`

**Description:** Trigger AI verification, resume parsing, OCR, and ATS scoring

**Request Body:** (empty - no body needed)

**Response (200 OK):**
```json
{
  "message": "Verification completed",
  "candidate": {
    "_id": "674a1b2c3d4e5f6g7h8i9j0k",
    "name": "John Doe",
    "email": "john@example.com",
    "atsScore": 82,
    "verificationStatus": "verified",
    "extractedData": {
      "resume": {
        "contact": {
          "email": "john@example.com",
          "phone": "1234567890"
        },
        "skills": ["Python", "JavaScript", "React", "MongoDB"],
        "experience": [...],
        "education": ["B.Tech in Computer Science"]
      },
      "aadhar": {
        "aadharNumber": "123456789012",
        "name": "John Doe",
        "dob": "01/01/1995"
      },
      "marksheet10": {
        "percentage": 85.5,
        "board": "CBSE"
      },
      "marksheet12": {
        "percentage": 88.0,
        "board": "CBSE"
      }
    },
    "verificationDetails": {
      "processedAt": "2024-11-26T10:35:00.000Z",
      "resumeAtsScore": 82,
      "documentsVerified": ["resume", "aadhar", "marksheet10", "marksheet12"]
    },
    "updatedAt": "2024-11-26T10:35:00.000Z"
  },
  "atsScore": {
    "atsScore": 82,
    "scoreBreakdown": {
      "format": 12,
      "keywords": 14,
      "content": 18,
      "contactInfo": 8,
      "skills": 14,
      "experience": 12,
      "education": 4
    },
    "strengths": [...],
    "weaknesses": [...],
    "recommendations": [...]
  }
}
```

**Postman Instructions:**
1. Set request type to **POST**
2. URL: `http://localhost:3000/api/candidates/674a1b2c3d4e5f6g7h8i9j0k/verify`
3. **Body** tab: Leave empty (or select **raw** → JSON, no content)
4. Click **Send**
5. **⚠️ WARNING:** This will call OpenAI API - costs will apply!

---

### 5. Update Candidate Status
**PATCH** `/api/candidates/:id/status`

**Description:** Manually update candidate verification status

**Request Body (JSON):**
```json
{
  "status": "verified"
}
```

Valid status values: `"pending"`, `"verified"`, `"failed"`

**Response (200 OK):**
```json
{
  "message": "Candidate status updated",
  "candidate": {
    "_id": "674a1b2c3d4e5f6g7h8i9j0k",
    "name": "John Doe",
    "verificationStatus": "verified",
    "updatedAt": "2024-11-26T10:40:00.000Z"
  }
}
```

**Postman Instructions:**
1. Set request type to **PATCH**
2. URL: `http://localhost:3000/api/candidates/674a1b2c3d4e5f6g7h8i9j0k/status`
3. **Body** tab → Select **raw** → **JSON**
4. Paste: `{"status": "verified"}`
5. Click **Send**

---

## Testing Workflow

### Step 1: Submit Form
```
POST http://localhost:3000/api/candidates/submit
(Include test files: resume.pdf, aadhar.pdf, etc.)
→ Note down the candidateId from response
```

### Step 2: Get Candidate
```
GET http://localhost:3000/api/candidates/{candidateId}
→ Verify files are uploaded
```

### Step 3: Trigger Verification
```
POST http://localhost:3000/api/candidates/{candidateId}/verify
→ Wait for response (takes 30-60 seconds)
→ Review extracted data and ATS score
```

### Step 4: Check Updated Candidate
```
GET http://localhost:3000/api/candidates/{candidateId}
→ Verify all extracted data and scores are stored
```

---

## Features Implemented

### ✅ File Upload
- Multer middleware for multipart/form-data
- File size limit: 5MB per file
- Allowed formats: PDF, JPEG, PNG, WebP
- Files stored in `uploads/` directory

### ✅ Resume Parsing
- Extract text from PDF resumes
- Parse skills, experience, education, contact info
- Heuristic-based extraction

### ✅ Document OCR & Verification
- OCR on images using Tesseract.js
- Extract Aadhar numbers, names, DOB
- Extract marksheet data: roll number, percentage, board
- AI-powered verification with OpenAI

### ✅ ATS Scoring
- AI-based resume analysis
- Format, keywords, content scoring
- Strengths, weaknesses, recommendations
- Quick heuristic scoring option

### ✅ Data Storage
- MongoDB for candidate and document data
- Structured extraction and verification results
- Document status tracking (pending → verified/failed)

---

## Error Handling

### Common Errors

**400 Bad Request**
```json
{"error": "Name and email are required"}
```
Solution: Make sure name and email are provided in form submission.

**404 Not Found**
```json
{"error": "Candidate not found"}
```
Solution: Check if candidateId is correct.

**500 Internal Server Error**
```json
{"error": "Failed to parse PDF: ..."}
```
Solution: Make sure PDF file is valid and not corrupted.

**OpenAI API Error**
```json
{"error": "ATS score generation failed: API key invalid"}
```
Solution: Check OPENAI_API_KEY in .env file.

---

## Database Schema

### Candidate Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required),
  phone: String,
  aadhar: String,
  documents: [ObjectId], // References to Document model
  extractedData: {
    resume: Object,
    aadhar: Object,
    marksheet10: Object,
    marksheet12: Object
  },
  atsScore: Number,
  verificationStatus: String (enum: pending, verified, failed),
  verificationDetails: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### Document Model
```javascript
{
  _id: ObjectId,
  candidateId: ObjectId (required),
  type: String (enum: aadhar, marksheet10, marksheet12, resume),
  filePath: String,
  originalName: String,
  mimeType: String,
  fileSize: Number,
  status: String (enum: pending, processing, verified, failed),
  parsedData: Object,
  verificationResult: Object,
  atsScore: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in .env

### Files Not Uploading
- Check multer configuration in `middleware/upload.js`
- Ensure `uploads/` directory exists
- Check file size (max 5MB)
- Check MIME type (PDF, JPEG, PNG, WebP)

### AI Verification Failing
- Verify OPENAI_API_KEY is correct
- Check API key has sufficient credits
- Check rate limits aren't exceeded

### OCR Not Working
- Ensure Tesseract.js is properly installed
- Check image quality (clear, not blurry)
- Try different image format (PNG works best)

---

## Next Steps: Frontend Setup

Once backend is fully tested:
1. Create React frontend with form component
2. Implement file upload UI
3. Connect to these API endpoints
4. Display verification results

---

## API Postman Collection

Ready-to-use collection URL format:
```
{{base_url}} = http://localhost:3000
{{candidateId}} = [from response]
```

For easier testing, import the collection in Postman or create requests manually following the examples above.
