/*
Required environment variables:
- REDIS_PORT=6379
- REDIS_HOST=localhost
- # REDIS_SENTINELS=a.server:26379,b.server:26379,c.server:26379
- # REDIS_GROUP_NAME=mymaster
*/

const Redis = require("ioredis");

const initRedis = () => {
  if (!process.env.REDIS_PORT || !process.env.REDIS_HOST) {
    console.warn(`! Not connected to redis, abandon Cache system!`);
    return { redis: {} };
  }

  let options = {
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    host: process.env.REDIS_HOST || "127.0.0.1",
    password: process.env.REDIS_AUTH || "",
    db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
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
  // console.log(options);

  let redis = new Redis(options);
  if (process.env.REDIS_SENTINELS) {
    console.log(
      `> Connected to Redis [redis://${process.env.REDIS_SENTINELS}/${options.db}] for Cache system`
    );
  } else {
    console.log(
      `> Connected to Redis [redis://${options.host}:${options.port}/${options.db}] for Cache system`
    );
  }

  return {
    redis,
  };
};

module.exports = initRedis;
