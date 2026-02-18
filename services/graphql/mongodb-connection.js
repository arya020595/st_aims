/*
Required environment variables:
- MONGOD_HOST=localhost
- MONGOD_PORT=27017
- MONGOD_DB=
- MONGOD_USERNAME=
- MONGOD_PASSWORD=
- MONGOD_AUTH_SOURCE=
*/

require("dotenv").config({
  path: "../../.env",
});
const { MongoClient } = require("mongodb");

let userAndPass = "";
if (
  process.env.MONGOD_USERNAME &&
  process.env.MONGOD_PASSWORD &&
  process.env.MONGOD_AUTH_SOURCE
) {
  userAndPass = `${process.env.MONGOD_USERNAME}:${process.env.MONGOD_PASSWORD}@`;
}

if (
  !process.env.MONGOD_HOST ||
  !process.env.MONGOD_PORT ||
  !process.env.MONGOD_DB
) {
  console.log("Incomplete environment variables. Process exitting...");
  process.exit(1);
}

const MONGO_URL =
  process.env.MONGOD_URI_STRING ||
  `mongodb://${userAndPass}${process.env.MONGOD_HOST}:${
    process.env.MONGOD_PORT
  }/${process.env.MONGOD_DB}${
    process.env.MONGOD_AUTH_SOURCE
      ? "?authSource=" + process.env.MONGOD_AUTH_SOURCE
      : ""
  }`;

/*
    Replica Set References:
    - https://docs.mongodb.com/manual/tutorial/convert-standalone-to-replica-set/
    - https://docs.mongodb.com/manual/tutorial/deploy-replica-set/
    - https://mongodb.github.io/node-mongodb-native/2.2/tutorials/connect/
   */

module.exports = async () => {
  try {
    console.log(`  Connecting to MongoDB...`);
    const mongoClient = await MongoClient.connect(MONGO_URL, {
      useNewUrlParser: true,
      // reconnectTries: 60,
      // reconnectInterval: 1000,
      // autoReconnect: true,
      poolSize: 4,
      // bufferMaxEntries: 0
      useUnifiedTopology: true,
    });
    const db = await mongoClient.db(process.env.MONGOD_DB);
    console.log(`> Connected to MongoDB [${MONGO_URL}]`);

    return {
      collection: collectionName => db.collection(collectionName),
      mongodb: db,
      mongoClient,
    };
  } catch (e) {
    // console.log(e);
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 5000);
    });
    throw e;
  }
};
