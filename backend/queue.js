const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const client = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const QUEUE_URL = process.env.SQS_QUEUE_URL; // set this after creating the queue

async function sendClickEvent(payload) {
  if (!QUEUE_URL) {
    // Gracefully skip if SQS not configured yet (local dev)
    console.log('[SQS] Queue URL not set, skipping. Payload:', payload);
    return;
  }

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
    console.log('[SQS] Message sent, MessageId:', result.MessageId);
  } catch (err) {
    // Non-fatal — don't fail the redirect if SQS is down
    console.error('[SQS] Failed to send message:', err.message);
  }
}

module.exports = { sendClickEvent };
