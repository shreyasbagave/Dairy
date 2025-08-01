require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'https://dairy-frontend-1.onrender.com'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

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

// TODO: Add routes here

app.listen(PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
