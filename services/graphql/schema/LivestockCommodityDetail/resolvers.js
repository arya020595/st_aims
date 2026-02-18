const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;
const resolvers = {
  Query: {
    allLivestockCommodityDetails: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let queryResult = await context.prisma.livestockCommodityDetail.findMany({
        where: {
          ...params,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      return queryResult;
    },
    tokenizedAllLivestockCommodityDetails: async (self, params, context) => {
      assertValidSession(context.activeSession);

      if (params.tokenizedParams) {
        const tokenized = jwt.verify(params.tokenizedParams, TOKENIZE);

        const { iat, ...payload } = tokenized;

        let queryResult =
          await context.prisma.livestockCommodityDetail.findMany({
            where: {
              livestockCommodityUUID: payload.livestockCommodityUUID,
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
            orderBy: {
              id: "desc",
            },
          });

        queryResult = queryResult.map((q) => {
          let id = BigInt(q.id);
          return {
            ...q,
            id: id.toString(),
          };
        });

        // console.log(queryResult)

        const unit = await context.prisma.unit.findMany({
          where: {
            uuid: {
              in: queryResult
                .filter((qr) => qr.unitUUID)
                .map((q) => q.unitUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        const indexedUnit = unit.reduce((all, unit) => {
          if (!all[unit.uuid]) {
            all[unit.uuid] = {};
          }
          all[unit.uuid] = {
            ...unit,
            id: unit.id.toString(),
          };
          return all;
        }, {});

        queryResult = queryResult.map((q) => {
          return {
            ...q,
            Unit: indexedUnit[q.unitUUID] ? indexedUnit[q.unitUUID] : {},
          };
        });

        const payloads = {
          queryResult,
        };

        let token = jwt.sign(payloads, TOKENIZE);
        return token;
      }
      return "ok";
    },
  },
  Mutation: {
    createLivestockCommodityDetail: async (self, params, context) => {
      assertValidSession(context.activeSession);

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

      await context.prisma.livestockCommodityDetail.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "livestockCommodityDetail",
          log: {
            ...createPayload,
          },
        },
      });
      return "success";
    },
    updateLivestockCommodityDetail: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.livestockCommodityDetail.update({
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
          tableName: "livestockCommodityDetail",
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
    deleteLivestockCommodityDetail: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.livestockCommodityDetail.update({
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
          tableName: "livestockCommodityDetail",
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
    createLivestockCommodityDetailTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let userId = "";

      if (context.activeSession.User && context.activeSession.User.uuid) {
        userId = context.activeSession.User.uuid;
      }

      if (!userId) {
        throw new Error("Invalid Session !!!");
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

      const { iat, visible, ...payload } = tokenized;
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

      await context.prisma.livestockCommodityDetail.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "livestockCommodityDetail",
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
    updateLivestockCommodityDetailTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let userId = "";

      if (context.activeSession.User && context.activeSession.User.uuid) {
        userId = context.activeSession.User.uuid;
      }

      if (!userId) {
        throw new Error("Invalid Session !!!");
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
        updatedAt,
        updatedBy,
        createdAt,
        createdBy,
        deletedAt,
        deletedBy,
        Unit,
        visible,
        ...payload
      } = tokenized;

      await context.prisma.livestockCommodityDetail.update({
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
          tableName: "livestockCommodityDetail",
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
    deleteLivestockCommodityDetailTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let userId = "";

      if (context.activeSession.User && context.activeSession.User.uuid) {
        userId = context.activeSession.User.uuid;
      }

      if (!userId) {
        throw new Error("Invalid Session !!!");
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

      await context.prisma.livestockCommodityDetail.update({
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
          tableName: "livestockCommodityDetail",
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
  },
  LivestockCommodityDetail: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    Unit: async (self, params, context) => {
      if (self.unitUUID) {
        const found = await context.prisma.unit.findUnique({
          where: {
            uuid: self.unitUUID,
          },
        });
        return found;
      }
      return {};
    },
  },
};
exports.resolvers = resolvers;
