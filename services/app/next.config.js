require("dotenv").config({
  path: "../../.env",
});
const appConfig = require("./app.json");

module.exports = {
  basePath: appConfig.basePath || "/",
  async redirects() {
    return [
      // {
      //   source: "/app/:slug*",
      //   destination:
      //     (process.env.NODE_ENV === "production"
      //       ? "htps://schoolpay.id"
      //       : `http://localhost:${process.env.ADMIN_PORT}`) + "/app/:slug*",
      //   permanent: false,
      //   basePath: false,
      // },
    ];
  },
  env: {
    ADMIN_PORT: process.env.ADMIN_PORT,
    //
    APP_BIND_PORT: process.env.ADMIN_PORT,
    GRAPHQL_API_HOST: process.env.GRAPHQL_API_HOST,
    GRAPHQL_API_PORT: process.env.GRAPHQL_API_PORT,
    STAGING_ENV: process.env.STAGING_ENV,
    VERSION_PREFIX: process.env.VERSION_PREFIX,
    CDN_PREFIX: process.env.CDN_PREFIX,
  },
  publicRuntimeConfig: {
    MODE: process.env.MODE || "",
    TOKENIZE: process.env.TOKENIZE || "DoAA7656",
  },
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.node = {
        child_process: "empty",
        fs: "empty",
        net: "empty",
        tls: "empty",
        dns: "empty",
        module: "empty",
        "@grpc": "empty",
      };
    }

    return config;
  },
};
