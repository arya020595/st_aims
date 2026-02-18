/*
Required environment variables:
- S3_ACCESS_CREDENTIAL=
- S3_BUCKET_NAME=
- S3_REGION_NAME=ap-southeast-1
- # S3_ACCESS_KEY=
- # S3_SECRET_KEY=
*/

require("dotenv").config();

const initS3 = () => {
  let s3Credentials = process.env.S3_ACCESS_CREDENTIAL;
  if (s3Credentials) {
    const { Base64 } = require("js-base64");
    s3Credentials = Base64.decode(s3Credentials).split(":");
    s3Credentials = {
      accessKeyId: s3Credentials[0],
      secretAccessKey: s3Credentials[1],
    };
  } else {
    s3Credentials = {
      accessKeyId: null,
      secretAccessKey: null,
    };
  }
  const AWS = require("aws-sdk");
  AWS.config.update({
    region: process.env.S3_REGION_NAME || "ap-southeast-1",
    accessKeyId: s3Credentials.accessKeyId || process.env.S3_ACCESS_KEY,
    secretAccessKey: s3Credentials.secretAccessKey || process.env.S3_SECRET_KEY,
  });
  const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

  s3.cleanup = async (objectPublicUrl) => {
    if (!objectPublicUrl || objectPublicUrl.indexOf("amazonaws.com") < 0)
      return;

    const url = new URL(objectPublicUrl);
    const objectKey = url.pathname.substring(1);

    return new Promise((resolve, reject) => {
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Delete: {
          Objects: [
            {
              Key: objectKey,
            },
          ],
        },
      };
      // console.log(objectPublicUrl, objectKey, params);
      s3.deleteObjects(params, (err, url) => {
        if (err) {
          return reject(err);
        }
        resolve(url);
      });
    });
  };

  return s3;
};

module.exports = initS3;
