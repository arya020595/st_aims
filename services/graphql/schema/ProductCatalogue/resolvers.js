const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const dayjs = require("dayjs");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;

const resolvers = {
  Query: {
    allProductCatalogues: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let user = await context.prisma.user.findUnique({
        where: {
          uuid: context.activeSession.User.userId,
        },
      });

      if (!user) {
        return [];
      }

      let role = await context.prisma.userRoles.findUnique({
        where: {
          uuid: user.userRoleId,
        },
      });

      if (!role || !role.privileges.includes("Product Catalogue:Read")) {
        return [];
      }

      const queryResult = await context.prisma.productCatalogue.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      return queryResult;
    },
    tokenizedAllProductCatalogues: async (self, params, context) => {
      // assertValidSession(context.activeSession);

      // let user = await context.prisma.user.findUnique({
      //   where: {
      //     uuid: context.activeSession.User.userId,
      //   },
      // });

      // if (!user) {
      //   return [];
      // }

      // let role = await context.prisma.userRoles.findUnique({
      //   where: {
      //     uuid: user.userRoleId,
      //   },
      // });

      // if (!role || !role.privileges.includes("Product Catalogue:Read")) {
      //   return [];
      // }

      let profileQuery = {};

      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
        //   icPassportNo: context.activeSession.User.icNo,
        // };
        const profile = await context.prisma.agrifoodCompanyProfile.findMany({
          where: {
            icPassportNo: context.activeSession.User.icNo,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });
        if (profile.length === 0) {
          throw new Error("No profile found");
        }
        profileQuery = {
          rocbnRegNo: {
            in: profile.map((user) => user.rocbnRegNo),
          },
        };

        const companyProfile =
          await context.prisma.agrifoodCompanyProfile.findMany({
            where: {
              ...profileQuery,
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
            select: {
              id: true,
              uuid: true,
            },
          });
        profileQuery = {
          companyUUID: {
            in: companyProfile.map((c) => c.uuid),
          },
        };
      }

      let queryResult = await context.prisma.productCatalogue.findMany({
        where: {
          ...profileQuery,
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

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
  },
  Mutation: {
    createProductCatalogue: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let latestNumber = await context.prisma.agrifoodCodeGenerator.findMany({
        where: {
          menu: "Product Catalogue",
          categoryId: params.productCategoryUUID,
        },
        take: 1,
      });

      let counter = 0;
      if (latestNumber.length === 0) {
        counter = 1;
        await context.prisma.agrifoodCodeGenerator.create({
          data: {
            uuid: uuidv4(),
            counter: 1,
            menu: "Product Catalogue",
            categoryId: params.productCategoryUUID,
          },
        });
      } else {
        counter = latestNumber[0].counter + 1;
        await context.prisma.agrifoodCodeGenerator.update({
          where: {
            uuid: latestNumber[0].uuid,
          },
          data: {
            counter,
          },
        });
      }

      const foundCategory =
        await context.prisma.agrifoodProductCategory.findMany({
          where: {
            uuid: params.productCategoryUUID,
          },
          take: 1,
        });

      if (foundCategory.length === 0) {
        throw new Error("Product Category doesn't have Prefix Code!");
      }

      let startCode = foundCategory[0].codePrefix;
      const dataLength = "" + counter;
      const last = dataLength.length * -1;
      startCode = startCode.slice(0, last) + counter;

      const createPayload = {
        uuid: uuidv4(),
        ...params,
        code: startCode,
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

      await context.prisma.productCatalogue.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "productCatalogue",
          log: {
            ...createPayload,
          },
        },
      });
      return "success";
    },
    updateProductCatalogue: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.productCatalogue.update({
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
          tableName: "productCatalogue",
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
    deleteProductCatalogue: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData = await context.prisma.productCatalogue.findUnique({
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

      await context.prisma.productCatalogue.update({
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
          tableName: "productCatalogue",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    tokenizedCreateProductCatalogue: async (self, params, context) => {
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

      if (!payload.companyUUID) {
        throw new Error("Please fill the company name fields");
      }

      if (!payload.productCategoryUUID) {
        throw new Error("Invalid Product Category");
      }

      // let latestNumber = await context.prisma.agrifoodCodeGenerator.findMany({
      //   where: {
      //     menu: "Product Catalogue",
      //     categoryId: payload.productCategoryUUID,
      //   },
      //   take: 1,
      // });

      // let counter = 0;
      // if (latestNumber.length === 0) {
      //   counter = 1;
      //   await context.prisma.agrifoodCodeGenerator.create({
      //     data: {
      //       uuid: uuidv4(),
      //       counter: 1,
      //       menu: "Product Catalogue",
      //       categoryId: payload.productCategoryUUID,
      //     },
      //   });
      // } else {
      //   counter = latestNumber[0].counter + 1;
      //   await context.prisma.agrifoodCodeGenerator.update({
      //     where: {
      //       uuid: latestNumber[0].uuid,
      //     },
      //     data: {
      //       counter,
      //     },
      //   });
      // }

      const foundCategory =
        await context.prisma.agrifoodProductCategory.findMany({
          where: {
            uuid: payload.productCategoryUUID,
          },
          take: 1,
        });

      if (foundCategory.length === 0) {
        throw new Error("Product Category doesn't have Prefix Code!");
      }

      const PREFIX = foundCategory[0].codePrefix.slice(0, 3);
      const latestCatalogue = await context.prisma.productCatalogue.findMany({
        where: {
          code: {
            contains: PREFIX,
          },
        },
        orderBy: {
          code: "desc",
        },
        take: 1,
      });

      const counter =
        parseInt(
          latestCatalogue[0].code.slice(3, latestCatalogue[0].code.length)
        ) + 1;

      let startCode = foundCategory[0].codePrefix;
      const dataLength = "" + counter;
      const last = dataLength.length * -1;
      startCode = startCode.slice(0, last) + counter;
      const createPayload = {
        uuid: uuidv4(),
        ...payload,
        code: startCode,
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

      await context.prisma.productCatalogue.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "productCatalogue",
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
    tokenizedUpdateProductCatalogue: async (self, params, context) => {
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
        createdAt,
        createdBy,
        updatedAt,
        updatedBy,
        deletedAt,
        deletedBy,
        ...payload
      } = tokenized;

      if (!payload.companyUUID) {
        throw new Error("Please fill the company name fields");
      }

      if (!payload.productCategoryUUID) {
        throw new Error("Invalid Product Category");
      }

      await context.prisma.productCatalogue.update({
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
          tableName: "productCatalogue",
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
    tokenizedDeleteProductCatalogue: async (self, params, context) => {
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

      let getDeletedData = await context.prisma.productCatalogue.findUnique({
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

      await context.prisma.productCatalogue.update({
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
          tableName: "productCatalogue",
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
  ProductCatalogue: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
  },
};
exports.resolvers = resolvers;
