/*
Required environment variables:
- CLICKHOUSE_URL=
- CLICKHOUSE_PORT=80
- CLICKHOUSE_AUTH=
- CLICKHOUSE_DB=
- # CLICKHOUSE_USERNAME=
- # CLICKHOUSE_PASSWORD=
*/

const { ClickHouse } = require("clickhouse");
const Base64 = require("js-base64").Base64;

const initClickHouse = () => {
  let options = {
    url: process.env.CLICKHOUSE_URL || "http://localhost",
    port: process.env.CLICKHOUSE_PORT || 8123,
    debug: false,
    isUseGzip: false,
    format: "json", // "json" || "csv" || "tsv"
    basicAuth: process.env.CLICKHOUSE_USERNAME
      ? {
          username: process.env.CLICKHOUSE_USERNAME,
          password: process.env.CLICKHOUSE_PASSWORD || "",
        }
      : null,
    config: {
      // session_id: "session_id if neeed",
      // session_timeout: 60,
      // output_format_json_quote_64bit_integers: 0,
      // enable_http_compression: 0,
      database: process.env.CLICKHOUSE_DB || "default",
    },
  };
  if (process.env.CLICKHOUSE_AUTH) {
    try {
      let auth = Base64.decode(process.env.CLICKHOUSE_AUTH).split(":");
      options.basicAuth = {
        username: auth[0],
        password: auth[1],
      };
    } catch (err) {
      console.warn(err);
    }
  }

  const clickhouse = new ClickHouse(options);
  console.warn(
    `> Connected to ClickHouse [${options.url}:${options.port}/${options.config.database}]`
  );

  return { clickhouse };
};

module.exports = initClickHouse;
