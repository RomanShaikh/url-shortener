const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const client = new SQSClient({
  region: process.env.AWS_REGION || 'eu-north-1',
});

const QUEUE_URL = process.env.SQS_QUEUE_URL;

async function sendClickEvent(payload) {
  if (!QUEUE_URL) {
    console.warn('[SQS] SQS_QUEUE_URL not set in .env — skipping queue message');
    return;
  }

  console.log(`[SQS] Preparing message for queue: ${QUEUE_URL}`);
  console.log(`[SQS] Payload: ${JSON.stringify(payload)}`);

  const command = new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(payload),
    MessageAttributes: {
      eventType: {
        DataType: 'String',
        StringValue: 'url_click',
      },
    },
  });

  try {
    const result = await client.send(command);
    console.log(`[SQS] Message sent OK — MessageId: ${result.MessageId}`);
    return result;
  } catch (err) {
    console.error(`[SQS ERROR] Failed to send message: ${err.message}`);
    // Non-fatal — don't crash the redirect
  }
}

module.exports = { sendClickEvent };