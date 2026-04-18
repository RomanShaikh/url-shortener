// This Lambda is triggered by SQS automatically.
// Each message = one URL click event.
// It increments the click count in DynamoDB.

const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const TABLE_NAME = process.env.DYNAMO_TABLE || 'url_analytics';

exports.handler = async (event) => {
  console.log('Received', event.Records.length, 'SQS messages');

  const results = await Promise.allSettled(
    event.Records.map(async (record) => {
      const body = JSON.parse(record.body);
      const { code, timestamp, ip } = body;

      console.log(`Processing click: code=${code}, time=${timestamp}, ip=${ip}`);

      // Atomic increment of click_count in DynamoDB
      const command = new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: {
          code: { S: code },
        },
        UpdateExpression: 'ADD click_count :inc SET last_clicked_at = :ts',
        ExpressionAttributeValues: {
          ':inc': { N: '1' },
          ':ts': { S: timestamp },
        },
        ReturnValues: 'UPDATED_NEW',
      });

      const result = await dynamo.send(command);
      console.log(`Updated count for ${code}:`, result.Attributes);
    })
  );

  // Log any failures (SQS will retry failed messages automatically)
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`Record ${i} failed:`, r.reason);
    }
  });

  return { statusCode: 200, body: 'Processed' };
};
