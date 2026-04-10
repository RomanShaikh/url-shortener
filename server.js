require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`URL Shortener running on port ${PORT}`);
  console.log(`DB Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`SQS Queue: ${process.env.SQS_QUEUE_URL || 'not configured'}`);
});
