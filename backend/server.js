require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:5173', 
    'https://dairy-frontend-1.onrender.com',
    'https://dairy-frontend-1-baro.onrender.com'
  ],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('Dairy Milk LMS Backend Running');
});

const authRoutes = require('./src/routes/auth');
app.use('/', authRoutes);

const adminRoutes = require('./src/routes/admin');
app.use('/admin', adminRoutes);

const farmerRoutes = require('./src/routes/farmer');
app.use('/farmer', farmerRoutes);

const feedRoutes = require('./src/routes/feed');
app.use('/api/feed', feedRoutes);
// Alternate mount without /api for clients that retry without the prefix
app.use('/feed', feedRoutes);

// Catch-all 404 handler (must be after all routes)
app.use((req, res) => {
  console.log(`404 - ${req.method} ${req.url} not found`);
  res.status(404).json({ message: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
