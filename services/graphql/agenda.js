const Agenda = require("agenda");

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
  process.exit(1);
}

const MONGO_URL = `mongodb://${userAndPass}${process.env.MONGOD_HOST}:${
  process.env.MONGOD_PORT
}/${process.env.MONGOD_DB}${
  process.env.MONGOD_AUTH_SOURCE
    ? "?authSource=" + process.env.MONGOD_AUTH_SOURCE
    : ""
}&replicaSet=${
  process.env.MONGOD_REPLICA_SET || "rs0"
}&retryWrites=true&w=majority`;

const initAgenda = async ({ mongodb }) => {
  try {
    const agenda = new Agenda(
      mongodb
        ? {
            mongo: mongodb,
            // processEvery: "10 seconds",
            db: {
              collection: "JobProcessorAgenda",
            },
          }
        : {
            db: { address: MONGO_URL, collection: "JobProcessorAgenda" },
          }
    );

    agenda.define("test", async (job) => {
      let data = job.attrs.data;
    });
    // await agenda.schedule("in 1 minutes", "test", { ok: true });
    await agenda.start();

    return {
      agenda,
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

module.exports = initAgenda;
