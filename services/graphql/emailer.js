/*
Required environment variables:
- SES_AWS_DEFAULT_REGION=ap-southeast-1
- SES_ACCESS_CREDENTIAL=
- SES_DEFAULT_SOURCE_NAME=
- SES_DEFAULT_SOURCE=no-rely@email.com
- SES_DEFAULT_REPLY=no-rely@email.com
- SES_DEFAULT_CONFIGURATION_SET=
*/

const fs = require("fs");
const path = require("path");

module.exports = () => {
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

  if (!s3Credentials.accessKeyId || !s3Credentials.secretAccessKey) {
    console.warn(`! Not connected to AWS, missing access key or secret key!`);
    return {
      sendEmail: () => {},
    };
  }

  if (
    !process.env.SES_DEFAULT_SOURCE_NAME ||
    !process.env.SES_DEFAULT_SOURCE ||
    !process.env.SES_DEFAULT_REPLY ||
    !process.env.SES_DEFAULT_CONFIGURATION_SET
  ) {
    console.warn(`! Not connected to AWS Simple Email Service!`);
    return {
      sendEmail: () => {},
    };
  }

  var AWS = require("aws-sdk");
  AWS.config.update({
    region: process.env.S3_REGION_NAME || "ap-southeast-1",
    accessKeyId: s3Credentials.accessKeyId || process.env.S3_ACCESS_KEY,
    secretAccessKey: s3Credentials.secretAccessKey || process.env.S3_SECRET_KEY,
  });
  const emailService = new AWS.SES({
    // apiVersion: "2010-12-01"
  });

  const sendEmail = async ({
    source = process.env.SES_DEFAULT_SOURCE,
    sourceName = process.env.SES_DEFAULT_SOURCE_NAME,
    replyTo = process.env.SES_DEFAULT_REPLY,
    configurationSetName = process.env.SES_DEFAULT_CONFIGURATION_SET,
    // textMessage = "",
    // htmlMessage = "",
    //
    destination = "",
    subject = "",
    templateFile = "",
    params = {},
  }) => {
    console.log("> Sending parameters:", {
      // source,
      // sourceName,
      destination,
      subject,
      templateFile,
      params,
    });

    if (!destination) {
      console.warn(`\n! Error! Please specify destination!`);
      return;
    }
    if (!subject) {
      console.warn(`\n! Error! Please specify subject!`);
      return;
    }
    if (!templateFile) {
      console.warn(`\n! Error! Please specify templateFile!`);
    }

    const filePath = path.resolve(__dirname, "email-templates", templateFile);
    console.log("> Used template:", filePath);
    let htmlMessage = fs.readFileSync(filePath).toString();
    for (const key in params) {
      const value = params[key];
      console.log(`> Replacing {${key}} with ${value}`);
      // htmlMessage = htmlMessage.replaceAll(`{${key}}`, value);
      htmlMessage = htmlMessage.split(`{${key}}`).join(value);
    }

    try {
      var params = {
        /* required */
        Destination: {
          // CcAddresses: [],
          ToAddresses: [destination],
        },
        /* required */
        Message: {
          /* required */
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: htmlMessage,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: subject,
          },
        },
        /* required */
        Source: sourceName ? `"${sourceName}" <${source}>` : source,
        ReplyToAddresses: [replyTo],
        ConfigurationSetName: configurationSetName,
      };

      var result = await emailService.sendEmail(params).promise();
      console.log("> Success sending email with result:", result);
      return {
        messageId: result.MessageId,
      };
    } catch (err) {
      console.warn("Error occured:", err);
    }
  };

  return {
    sendEmail,
  };
};
