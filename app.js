const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const authRoutes = require('./routes/authRoute.js'); 
const userRoutes = require('./routes/userRoute.js');
const projectRoutes = require('./routes/projectRoute.js'); 
const imagesRoutes = require('./routes/imagesRoutes.js');
const appointmentRoutes = require('./routes/appointmentRoute.js');
const statusRoutes = require('./routes/statusRoute.js');

const app = express();

// Configure CORS with specific options
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Add your frontend URL
  credentials: true,
  exposedHeaders: ['Content-Type', 'Content-Length']
}));

// Configure Helmet with specific options for images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

app.use(express.json());

// Serve static files with proper headers
app.use('/images', express.static(path.join(__dirname, 'public/images'), {
  setHeaders: (res, path, stat) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Mount auth routes under /api/auth
app.use('/api/auth', authRoutes);

// Mount user routes under /api/users
app.use('/api/users', userRoutes);

// Mount project routes under /api/projects
app.use('/api/projects', projectRoutes);

// Mount images routes under /api/images
app.use('/api/images', imagesRoutes);

// Mount appointment routes under /api/appointments
app.use('/api/appointments', appointmentRoutes);

// Mount status routes under /api/status
app.use('/api/status', statusRoutes);

// Health check or other routes
app.get('/', (req, res) => {
  res.send('API is running');
});

module.exports = app;
