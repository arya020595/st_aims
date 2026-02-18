/*
Required environment variables:
- REDIS_PORT=6379
- REDIS_HOST=localhost
- # REDIS_SENTINELS=a.server:26379,b.server:26379,c.server:26379
- # REDIS_GROUP_NAME=mymaster
- REDIS_QUEUE_DB=1
*/

const Redis = require("ioredis");
const Queue = require("bull");

const initQueue = (params) => {
  if (!process.env.REDIS_PORT || !process.env.REDIS_HOST) {
    console.warn(`! Not connected to redis, abandon Queue system!`);
    return { redis: {} };
  }

  let options = {
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    host: process.env.REDIS_HOST || "127.0.0.1",
    password: process.env.REDIS_AUTH || "",
    db: process.env.REDIS_QUEUE_DB ? parseInt(process.env.REDIS_QUEUE_DB) : 1,
  };
  if (process.env.REDIS_SENTINELS) {
    options = {
      sentinels: process.env.REDIS_SENTINELS.split(",")
        .filter((str) => !!str)
        .map((str) => {
          return {
            host: str.split(":")[0],
            port: parseInt(str.split(":")[1] || "26379"),
          };
        }),
      name: process.env.REDIS_GROUP_NAME || "mymaster",
    };
  }

  const queue = new Queue(params && params.name ? params.name : "QUEUE", {
    createClient: () => new Redis(options),
  });
  if (process.env.REDIS_SENTINELS) {
    console.log(
      `> Connected to Redis [redis://${process.env.REDIS_SENTINELS}/${options.db}] for Queue system`
    );
  } else {
    console.log(
      `> Connected to Redis [redis://${options.host}:${options.port}/${options.db}] for Queue system`
    );
  }

  return queue;
};

module.exports = initQueue;
