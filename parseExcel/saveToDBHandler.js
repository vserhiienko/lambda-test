const AWS = require('aws-sdk');
const Excel = require('exceljs');
const uuid = require('uuid');

const s3 = new AWS.S3();
const FIRST_WORKSHEET = 1;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.saveToDB = async (event, context, callback) => {
  let fileName = '';

  event.Records.forEach((record) => {
    fileName = record.s3.object.key;
  });

  const excelFile = await s3.getObject({
    Key: fileName,
    Bucket: process.env.BUCKET,
  }).promise();

  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(excelFile.Body);

  const worksheet = workbook.getWorksheet(FIRST_WORKSHEET);
  const loadPromises = [];

  worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
    row.eachCell({ includeEmpty: true }, function(cell, colNumber) {
      const timestamp = new Date().getTime();

      loadPromises.push(dynamoDb.put({
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          id: uuid.v1(),
          name: cell.value,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      }).promise())
    });
  });

  Promise.all(loadPromises).then(() => {
    console.log('All fine, we made it!')
  });

  return { statusCode: 200, body: { event }}
};
