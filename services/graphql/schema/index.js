const { mergeSchemas, makeExecutableSchema } = require("apollo-server-express");
const { lstatSync, readdirSync, existsSync } = require("fs");
const { join } = require("path");
const { composeTypeDefs } = require("./helpers");
const { merge } = require("lodash");

const ts = new Date();
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
const schemaDirs = getDirectories(__dirname + "/");
for (const dir of schemaDirs) {
  try {
    const { customTypes } = require(dir + "/types");
    populatedCustomTypes = [...populatedCustomTypes, ...customTypes];
  } catch (e) {
    console.log(
      `Error loading custom types from ${
        dir.split("/")[dir.split("/").length - 1]
      }/types`,
      e.message
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
      console.log(`Error populating ${schemaName}/resolvers`, e.message);
    }
  } catch (e) {
    console.log(
      // `Error while loading schema of ${dir.split("/")[dir.split("/").length - 1]}!`,
      `Error while loading ${schemaName}/types >>`,
      e.message
    );
    // process.exit();
  }
}

const schema = mergeSchemas({
  schemas: populatedSchemas,
  resolvers: mergeResolvers(populatedResolvers),
});

console.log("> Loading schema took", new Date().getTime() - ts.getTime(), "ms");
module.exports = schema;
