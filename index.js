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
const webhookRoutes = require('./routes/webhookRoutes');
app.use('/api/webhook', webhookRoutes);

// Health Route
app.get('/', (req, res) => {
  res.send('Backend is running...');
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
