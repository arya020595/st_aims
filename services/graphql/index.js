require("dotenv").config({
  path: "../../.env",
});
const express = require("express");
const {
  ApolloServer,
  mergeSchemas,
  makeExecutableSchema,
} = require("apollo-server-express");
const {
  authenticate,
  makeSureDefaultUsersAreExists,
} = require("./authentication");
const { createLoaders } = require("./data-loader");
const initEmailer = require("./emailer");
const initS3 = require("./s3");
require("isomorphic-unfetch");
const initClickHouse = require("./clickhouse");

const { lstatSync, readdirSync, existsSync } = require("fs");
const { join } = require("path");
const { composeTypeDefs } = require("./schema/helpers");
const { merge } = require("lodash");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { vegetableMasterData } = require("./vegetable-rest/vegetable");

const isDirectory = (source) => lstatSync(source).isDirectory();
const getDirectories = (source) =>
  readdirSync(source)
    .map((name) => join(source, name))
    .filter(isDirectory);

const mergeResolvers = (resolvers) => {
  let resultingResolvers = {};
  resolvers.forEach((resolver) => {
    resultingResolvers = merge(resultingResolvers, resolver);
  });
  return resultingResolvers;
};

// ############# Populate customTypes
let populatedCustomTypes = [];
const schemaDirs = getDirectories(__dirname + "/schema");
for (const dir of schemaDirs) {
  try {
    const { customTypes } = require(dir + "/types");
    populatedCustomTypes = [...populatedCustomTypes, ...customTypes];
  } catch (e) {
    console.log(
      `Error loading custom types from ${
        dir.split("/")[dir.split("/").length - 1]
      }/types`,
      e.message,
    );
    // process.exit();
  }
}
populatedCustomTypes = populatedCustomTypes.join("\n");

// ############# Populate rootTypes and build schema, and also resolvers
const populatedSchemas = [];
let populatedResolvers = [];
for (const dir of schemaDirs) {
  const schemaName = dir.split("/")[dir.split("/").length - 1];
  try {
    if (existsSync(dir + "/types.js")) {
      const { rootTypes } = require(dir + "/types");
      if (!rootTypes) {
        continue;
      }
      const newSchema = makeExecutableSchema({
        typeDefs: composeTypeDefs([rootTypes, populatedCustomTypes].join("\n")),
      });
      populatedSchemas.push(newSchema);
    }

    try {
      if (existsSync(dir + "/resolvers.js")) {
        const { resolvers } = require(dir + "/resolvers");
        populatedResolvers.push(resolvers);
      }
    } catch (e) {
      console.log(`Error populating ${schemaName}/resolvers`, e);
    }
  } catch (e) {
    console.log(
      // `Error while loading schema of ${dir.split("/")[dir.split("/").length - 1]}!`,
      `Error while loading ${schemaName}/types >>`,
      e.message,
    );
    // process.exit();
  }
}

const schema = mergeSchemas({
  schemas: populatedSchemas,
  resolvers: mergeResolvers(populatedResolvers),
});

const start = async () => {
  const { clickhouse } = initClickHouse();
  const s3 = initS3();
  await makeSureDefaultUsersAreExists(prisma);
  const emailer = initEmailer();
  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      const activeSession = await authenticate(req, { prisma });
      return {
        prisma,
        activeSession,
        s3,
        stan: {
          log: () => {},
        },
      };
    },
    cors: true,
    debug: process.env.NODE_ENV !== "production",
    playground: process.env.NODE_ENV !== "production",
    formatError: (error) => {
      console.log(JSON.stringify(error, null, 5));
      return error;
    },
  });
  const app = express();
  app.use(express.json({ limit: "100mb" }));

  app.get("/callback", (req, res) => {
    return res.json({
      ok: true,
    });
  });

  app.post("/vegetable-list", async (req, res) => {
    const result = await vegetableMasterData({
      context: { prisma },
      request: req,
    });
    return res.status(200).json(result);
  });

  server.applyMiddleware({ app });
  const port = parseInt(process.env.GRAPHQL_API_PORT) || 4000;
  const bindIp = process.env.GRAPHQL_API_BIND_IP || "localhost";
  await app.listen(port, bindIp, () => {
    console.log(
      `🚀  GraphQL server ready at http://${bindIp}:${port}${server.graphqlPath}`,
    );
  });
};

start();
