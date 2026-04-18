require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('─────────────────────────────────────────');
  console.log(`[SERVER] URL Shortener started`);
  console.log(`[SERVER] Port     : ${PORT}`);
  console.log(`[SERVER] Base URL : ${process.env.BASE_URL || 'http://localhost:' + PORT}`);
  console.log(`[SERVER] DB Host  : ${process.env.DB_HOST || 'localhost'}`);
  console.log(`[SERVER] SQS Queue: ${process.env.SQS_QUEUE_URL || 'not configured yet'}`);
  console.log(`[SERVER] Region   : ${process.env.AWS_REGION || 'eu-north-1'}`);
  console.log('─────────────────────────────────────────');
});