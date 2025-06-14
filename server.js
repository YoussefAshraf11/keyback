const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const connectDB = require('./config/DBconnection.js');
const app = require('./app');


const port = process.env.PORT || 3000;

// Connect to DB then start server
connectDB()
  .then(() => {
    app.listen(port, '127.0.0.1', () => {
      console.log(`✅ Server running on 127.0.0.1:${port}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to database', err);
    process.exit(1);
  });