let checkList = {
  APP_PORT: true,
  GRAPHQL_API_HOST: true,
  GRAPHQL_API_PORT: true,
};
require("dotenv").config({
  path: "../../.env",
});
Object.keys(checkList).forEach((key) => {
  console.log(`Checking ${key}`);
  if (!process.env[key]) {
    console.log("  Not found!");
    if (checkList[key]) {
      console.log("  Process is exitting...");
      process.exit(0);
    }
  } else {
    console.log(`  Found with value: ${process.env[key]}`);
  }
});

const path = require("path");
const bodyParser = require("body-parser");
const next = require("next");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
//

const express = require("express");
const expressApp = express();
const server = require("http").Server(expressApp);
//

const dev = process.env.NODE_ENV !== "production";
//

const nextApp = next({ dev, quiet: !dev });
const nextHandler = nextApp.getRequestHandler();

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

nextApp.prepare().then(() => {
  expressApp.use(
    "/api",
    createProxyMiddleware({
      target: `http://${process.env.GRAPHQL_API_HOST}:${process.env.GRAPHQL_API_PORT}`,
      changeOrigin: true,
      pathRewrite: {
        "^/api": "/graphql",
      },
      onError: (err, req, res) => {
        console.log("onError", { err });
        // res.writeHead(500, {
        //   "Content-Type": "text/plain"
        // });
        res.end("Something went wrong.");
      },
    })
  );

  expressApp.use(bodyParser.json());

  const corsOptions = {
    optionsSuccessStatus: 200,
  };
  // PreFLIGHT!
  expressApp.options("*", cors(corsOptions));

  expressApp.get("/service-worker.js", (req, res) => {
    nextApp.serveStatic(req, res, "./.next/service-worker.js");
  });

  const serviceWorkers = [
    // {
    //   filename: "service-worker.js",
    //   path: "./.next/service-worker.js",
    // },
    {
      filename: "firebase-messaging-sw.js",
      path: "../public/firebase-messaging-sw.js",
    },
  ];

  serviceWorkers.forEach(({ filename, path }) => {
    expressApp.get(`/${filename}`, (req, res) => {
      nextApp.serveStatic(req, res, path);
    });
  });

  const cachePath = process.cwd() + "/public/cache";
  console.log({ cachePath });
  expressApp.use("/cache", express.static(cachePath));
  expressApp.use("/public/cache", express.static(cachePath));
  expressApp.use("/doa/cache", express.static(cachePath));
  expressApp.use("/doaa/cache", express.static(cachePath));

  const templatePath = process.cwd() + "/public/template";
  console.log({ templatePath });
  expressApp.use("/public/template", express.static(templatePath));
  expressApp.use(
    "/template/",
    express.static(path.join(__dirname, "../../graphql/public/template"))
  );

  const tradeDataPath = process.cwd() + "/public/trade_data_file";
  console.log({ tradeDataPath });
  expressApp.use("/public/trade_data_file", express.static(tradeDataPath));
  expressApp.use(
    "/trade_data_file/",
    express.static(path.join(__dirname, "../../graphql/public/trade_data_file"))
  );

  const unstructuredDocument = process.cwd() + "/public/unstructured_document";
  console.log({ unstructuredDocument });
  expressApp.use(
    "/public/unstructured_document",
    express.static(unstructuredDocument)
  );
  expressApp.use(
    "/unstructured_document/",
    express.static(
      path.join(__dirname, "../../graphql/public/unstructured_document")
    )
  );

  if (process.env.S3_BUCKET_NAME) {
    expressApp.get("/storage-presigned-url", async (req, res) => {
      try {
        const bucketName = process.env.S3_BUCKET_NAME;
        if (!bucketName) {
          throw {
            message: `You must specify bucketName on S3_BUCKET_NAME environment variable!`,
          };
        }

        const objectKey = req.query.objectKey || req.query.objectName;
        if (!objectKey) {
          throw {
            message: `You must specify objectKey or objectKey!`,
          };
        }

        const contentType = req.query.contentType;
        if (!contentType) {
          throw {
            message: `You must specify contentType!`,
          };
        }

        const params = {
          Bucket: bucketName,
          Key: objectKey,
          Expires: 5 * 60,
          // ContentType: "application/octet-stream",
          ContentType: contentType,
        };
        // console.log(params);
        let url = await new Promise((resolve, reject) => {
          s3.getSignedUrl("putObject", params, (err, url) => {
            if (err) {
              return reject(err);
            }
            resolve(url);
          });
        });
        // console.log({ url });

        return res.json({
          status: "success",
          url,
        });
      } catch (err) {
        const statusCode = 400;
        return res.status(statusCode).json({
          status: "error",
          statusCode,
          error: err.message,
        });
      }
    });
    // console.log("> File storage infrastructure on S3 was established!");
  }

  expressApp.get("/", (req, res) => {
    return res.redirect("/doa/login");
  });

  expressApp.get("*", (req, res) => {
    return nextHandler(req, res);
  });

  const serverPort = parseInt(process.env.APP_PORT, 10) || 3000;
  const bindIp = process.env.APP_BIND_IP || "localhost";
  server.listen(serverPort, bindIp, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${bindIp}:${serverPort}`);
  });
});
