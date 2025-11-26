require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Initialize app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Routes
const candidateRoutes = require('./routes/candidateRoutes');
app.use('/api/candidates', candidateRoutes);

// Health Route
app.get('/', (req, res) => {
  res.send('Backend is running...');
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
