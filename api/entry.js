'use strict';

const aws = require('aws-sdk');
const uuid = require('uuid/v4');
const dynamoDb = new aws.DynamoDB.DocumentClient({
  region: process.env.REGION,
});

module.exports.index = async (event, context) => {
  const query = event.queryStringParameters || {};
  try {
    const params = {
      TableName: process.env.STAGE + '_entries',
      IndexName: 'DateGSI',
      ProjectionExpression: 'id, title, dueDate, address, description',
      FilterExpression: '#dueDate BETWEEN :from AND :to',
      ExpressionAttributeNames: {
        '#dueDate': 'dueDate',
      },
      ExpressionAttributeValues: {
        ':from': query.from ? Number(query.from) : 0,
        ':to': query.to ? Number(query.to) : Date.now(),
      },
    };

    const result = await dynamoDb.scan(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({
        count: result.Count,
        entries: result.Items,
      }),
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
    };
  }
};

module.exports.create = async (event, context) => {
  try {
    const body = JSON.parse(event.body);
    const item = {
      id: uuid(),
      dueDate: Date.now(),
      title: body.title,
      description: body.description,
      address: body.address,
    };
    const params = {
      TableName: process.env.STAGE + '_entries',
      Item: item,
    };

    await dynamoDb.put(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        entry: item,
      }),
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
    };
  }
};

module.exports.read = async (event, context) => {
  const id = event.pathParameters.id;

  try {
    const params = {
      Key: { id },
      TableName: process.env.STAGE + '_entries',
    };

    const result = await dynamoDb.get(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        entry: result.Item,
      }),
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
    };
  }
};

module.exports.update = async (event, context) => {
  const id = event.pathParameters.id;
  try {
    const body = JSON.parse(event.body);
    const params = {
      TableName: process.env.STAGE + '_entries',
      Key: { id },
      UpdateExpression:
        'set dueDate = :dueDate, title = :title, description = :description, address = :address',
      ExpressionAttributeValues: {
        ':dueDate': body.dueDate,
        ':title': body.title,
        ':description': body.description,
        ':address': body.address,
      },
      ReturnValues: 'UPDATED_NEW',
    };

    const result = await dynamoDb.update(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        entry: result.Attributes,
      }),
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
    };
  }
};

module.exports.delete = async (event, context) => {
  const id = event.pathParameters.id;

  try {
    const params = {
      Key: { id },
      TableName: process.env.STAGE + '_entries',
    };

    const result = await dynamoDb.delete(params).promise();
    console.log(result);
    return {
      statusCode: 200,
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
    };
  }
};
