const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const formParser = require('./parser');

module.exports.saveToBucket = (event, context, callback) => {
  formParser.parse(event).then(({ filename, buffer, fieldname }) => {
    s3.putObject({
      Bucket: process.env.BUCKET,
      Key: `${new Date().getTime()}_${filename}`,
      Body: buffer
    }).promise().then((...props) => {
      const response = {
        statusCode: 200,
        body: JSON.stringify({ filename, buffer, fieldname }),
      };

      callback(null, response);
    })
  });
};
