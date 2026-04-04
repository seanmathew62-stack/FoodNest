const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const cookRoutes = require('./routes/cookRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');

// Use routes
app.use('/auth', authRoutes);
app.use('/student', studentRoutes);
app.use('/cook', cookRoutes);
app.use('/delivery', deliveryRoutes);

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
