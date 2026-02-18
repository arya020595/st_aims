const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;
const resolvers = {
  Query: {
    allPaddySeedProductionDetailsByProductionUUID: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);

      let queryResult = await context.prisma.paddySeedProductionDetail.findMany(
        {
          where: {
            ...params,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        }
      );
      return queryResult;
    },
    tokenizedAllPaddySeedProductionDetailsByProductionUUID: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);

      const tokenized = jwt.verify(params.tokenizedParams, TOKENIZE);

      const { iat, ...payloads } = tokenized;

      let queryResult = await context.prisma.paddySeedProductionDetail.findMany(
        {
          where: {
            ...payloads,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        }
      );
      const cropsPaddySeedVariety =
        await context.prisma.cropsPaddySeedVariety.findMany({
          where: {
            uuid: {
              in: queryResult.map((q) => q.cropsPaddySeedVarietyUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedPaddySeedVariety = cropsPaddySeedVariety.reduce(
        (all, seed) => {
          if (!all[seed.uuid]) {
            all[seed.uuid] = {};
          }
          all[seed.uuid] = {
            ...seed,
            id: seed.id.toString(),
          };
          return all;
        },
        {}
      );

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
          PaddySeed: indexedPaddySeedVariety[q.cropsPaddySeedVarietyUUID]
            ? indexedPaddySeedVariety[q.cropsPaddySeedVarietyUUID]
            : {},
        };
      });
      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
  },
  Mutation: {
    createPaddySeedProductionDetail: async (self, params, context) => {
      assertValidSession(context.activeSession);

      if (!params.cropsPaddySeedVarietyUUID) {
        throw new Error("Please fill the paddy seed variety fields")
      }

      const createPayload = {
        uuid: uuidv4(),
        ...params,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: "",
        createdBy: {
          uuid: context.activeSession.User.uuid,
          username: context.activeSession.User.employeeId,
        },
        updatedBy: {
          uuid: context.activeSession.User.uuid,
          username: context.activeSession.User.employeeId,
        },
        deletedBy: {},
      };

      await context.prisma.paddySeedProductionDetail.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "paddySeedProductionDetail",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updatePaddySeedProductionDetail: async (self, params, context) => {
      assertValidSession(context.activeSession);

      if (!params.cropsPaddySeedVarietyUUID) {
        throw new Error("Please fill the paddy seed variety fields")
      }

      await context.prisma.paddySeedProductionDetail.update({
        where: {
          uuid: params.uuid,
        },
        data: {
          ...params,
          updatedAt: new Date().toISOString(),
          updatedBy: context.activeSession.User,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "UPDATE",
          tableName: "paddySeedProductionDetail",
          log: {
            ...params,
            updatedAt: new Date().toISOString(),
            updatedBy: {
              uuid: context.activeSession.User.uuid,
              username: context.activeSession.User.employeeId,
            },
          },
        },
      });

      return "success";
    },
    deletePaddySeedProductionDetail: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData =
        await context.prisma.paddySeedProductionDetail.findUnique({
          where: {
            uuid: params.uuid,
          },
        });
      getDeletedData = {
        ...getDeletedData,
        id: getDeletedData.id.toString(),
        deletedAt: new Date().toISOString(),
        deletedBy: {
          uuid: context.activeSession.User.uuid,
          username: context.activeSession.User.employeeId,
        },
      };

      await context.prisma.paddySeedProductionDetail.update({
        where: {
          uuid: params.uuid,
        },
        data: {
          deletedAt: new Date().toISOString(),
          deletedBy: {
            uuid: context.activeSession.User.uuid,
            username: context.activeSession.User.employeeId,
          },
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "DELETE",
          tableName: "paddySeedProductionDetail",
          log: {
            ...paddySeedProductionDetail,
          },
        },
      });
      return "success";
    },
    tokenizedCreatePaddySeedProductionDetail: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let userId = ""

      if (context.activeSession.User && context.activeSession.User.uuid) {
        userId = context.activeSession.User.uuid
      }

      if (!userId) {
        throw new Error("Invalid Session !!!")
      }
      const foundUser = await context.prisma.user.findUnique({
        where: {
          uuid: context.activeSession.User.userId,
        },
      });

      if (!foundUser) {
        throw new Error(`User Invalid`);
      }

      if (foundUser.loginStatus === "LOGOUT") {
        throw new Error("User already logged out");
      }

      const tokenized = jwt.verify(params.tokenized, TOKENIZE);

      const {
        iat,
        totalPaddySeedValue,
        totalPaddySeedProduction,
        totalPaddySeedHarvestedArea,
        totalPaddySeedCultivatedArea,
        plantingSeasonDetail,
        farmDistrict,
        farmArea,
        farmVillage,
        farmMukim,
        farmerName,
        farmAddress,
        farmAreaId,
        farmerCompanyName,
        farmerUUID,
        seasonUUID,
        status,
        paddySeedId,
        PaddySeed,

        ...payload
      } = tokenized;

      if (!payload.cropsPaddySeedVarietyUUID) {
        throw new Error("Please fill the paddy seed variety fields")
      }

      const createPayload = {
        uuid: uuidv4(),
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: "",
        createdBy: {
          uuid: context.activeSession.User.uuid,
          username: context.activeSession.User.employeeId,
        },
        updatedBy: {
          uuid: context.activeSession.User.uuid,
          username: context.activeSession.User.employeeId,
        },
        deletedBy: {},
      };

      await context.prisma.paddySeedProductionDetail.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "paddySeedProductionDetail",
          log: {
            ...createPayload,
          },
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      return "success";
    },
    tokenizedUpdatePaddySeedProductionDetail: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let userId = ""

      if (context.activeSession.User && context.activeSession.User.uuid) {
        userId = context.activeSession.User.uuid
      }

      if (!userId) {
        throw new Error("Invalid Session !!!")
      }
      const foundUser = await context.prisma.user.findUnique({
        where: {
          uuid: context.activeSession.User.userId,
        },
      });

      if (!foundUser) {
        throw new Error(`User Invalid`);
      }

      if (foundUser.loginStatus === "LOGOUT") {
        throw new Error("User already logged out");
      }


      const tokenized = jwt.verify(params.tokenized, TOKENIZE);

      const {
        iat,
        id,
        createdAt,
        createdBy,
        updatedAt,
        updatedBy,
        deletedAt,
        deletedBy,
        PaddySeed,
        paddySeedId,
        status,
        ...payload
      } = tokenized;

      if (!payload.cropsPaddySeedVarietyUUID) {
        throw new Error("Please fill the paddy seed variety fields")
      }

      await context.prisma.paddySeedProductionDetail.update({
        where: {
          uuid: payload.uuid,
        },
        data: {
          ...payload,
          updatedAt: new Date().toISOString(),
          updatedBy: context.activeSession.User,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "UPDATE",
          tableName: "paddySeedProductionDetail",
          log: {
            ...payload,
            updatedAt: new Date().toISOString(),
            updatedBy: {
              uuid: context.activeSession.User.uuid,
              username: context.activeSession.User.employeeId,
            },
          },
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      return "success";
    },
    tokenizedDeletePaddySeedProductionDetail: async (Self, params, context) => {
      assertValidSession(context.activeSession);

      let userId = ""

      if (context.activeSession.User && context.activeSession.User.uuid) {
        userId = context.activeSession.User.uuid
      }

      if (!userId) {
        throw new Error("Invalid Session !!!")
      }
      const foundUser = await context.prisma.user.findUnique({
        where: {
          uuid: context.activeSession.User.userId,
        },
      });

      if (!foundUser) {
        throw new Error(`User Invalid`);
      }

      if (foundUser.loginStatus === "LOGOUT") {
        throw new Error("User already logged out");
      }

      const tokenized = jwt.verify(params.tokenized, TOKENIZE);

      const { iat, ...payload } = tokenized;
      let getDeletedData =
        await context.prisma.paddySeedProductionDetail.findUnique({
          where: {
            uuid: payload.uuid,
          },
        });

      getDeletedData = {
        ...getDeletedData,
        id: getDeletedData.id.toString(),
        deletedAt: new Date().toISOString(),
        deletedBy: {
          uuid: context.activeSession.User.uuid,
          username: context.activeSession.User.employeeId,
        },
      };

      await context.prisma.paddySeedProductionDetail.update({
        where: {
          uuid: payload.uuid,
        },
        data: {
          deletedAt: new Date().toISOString(),
          deletedBy: {
            uuid: context.activeSession.User.uuid,
            username: context.activeSession.User.employeeId,
          },
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "DELETE",
          tableName: "paddySeedProductionDetail",
          log: {
            ...getDeletedData,
          },
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      return "success";
    },
  },
  PaddySeedProductionDetail: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    PaddySeed: async (self, params, context) => {
      if (self.cropsPaddySeedVarietyUUID) {
        const found = await context.prisma.cropsPaddySeedVariety.findUnique({
          where: {
            uuid: self.cropsPaddySeedVarietyUUID,
          },
        });

        if (found) {
          return found;
        }
      }
      return {};
    },
  },
};
exports.resolvers = resolvers;
