const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");

const resolvers = {
  Query: {
    allCropRetailPrices: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let queryResult = await context.prisma.cropRetailPrice.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      return queryResult;
    },
  },
  Mutation: {
    createCropRetailPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);
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

      await context.prisma.cropRetailPrice.create({
        data: {
          ...createPayload,
        },
      });
      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "cropRetailPrice",
          log: {
            ...createPayload,
          },
        },
      });
      return "success";
    },
    updateCropRetailPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);
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

      await context.prisma.cropRetailPrice.update({
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
          tableName: "cropRetailPrice",
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
    deleteCropRetailPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);
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

      let getDeletedData = await context.prisma.cropRetailPrice.findUnique({
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
      await context.prisma.cropRetailPrice.update({
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
          tableName: "cropRetailPrice",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
  },
  CropRetailPrice: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    FarmLocation: async (self, params, context) => {
      if (self.farmLocationUUID) {
        const found = await context.prisma.farmLocation.findUnique({
          where: {
            uuid: self.farmLocationUUID,
          },
        });

        if (found) {
          return found;
        }
      }

      return {
        uuid: "",
        district: "",
      };
    },
  },
};
exports.resolvers = resolvers;
