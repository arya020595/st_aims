const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const lodash = require("lodash");
const resolvers = {
  Query: {
    allLiveStocks: async (self, params, context) => {
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
      if (!role || !role.privileges.includes("Livestock:Read")) {
        return [];
      }

      let queryResult = await context.prisma.livestock.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });
      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
        };
      });

      const livestockCategory = await context.prisma.livestockCategory.findMany(
        {
          where: {
            uuid: {
              in: queryResult.map((q) => q.livestockCategoryId),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        }
      );

      const indexedLivestockCategory = livestockCategory.reduce((all, cat) => {
        if (!all[cat.uuid]) {
          all[cat.uuid] = {};
        }
        all[cat.uuid] = {
          ...cat,
          id: cat.id.toString(),
        };
        return all;
      }, {});

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          LivestockCategory: indexedLivestockCategory[q.livestockCategoryId]
            ? indexedLivestockCategory[q.livestockCategoryId]
            : {},
        };
      });

      return queryResult;
    },
    allLiveStocksBySupplierOnAnimalFeed: async (self, params, context) => {
      assertValidSession(context.activeSession);

      const findAnimalFeed = await context.prisma.animalFeed.findMany({
        where: {
          supplierId: params.supplierId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      let result = await context.prisma.livestock.findMany({
        where: {
          uuid: {
            in: findAnimalFeed.map((feed) => feed.livestockId),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      result = result.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
        };
      });
      return result;
    },
    tokenizedAllLiveStock: async (self, params, context) => {
      assertValidSession(context.activeSession);

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
      // if (!role || !role.privileges.includes("Livestock:Read")) {
      //   return [];
      // }

      let queryResult = await context.prisma.livestock.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });
      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
        };
      });

      let livestockCategoryIds = queryResult
        .filter((q) => q.livestockCategoryId)
        .map((q) => q.livestockCategoryId);
      livestockCategoryIds = lodash.uniq(livestockCategoryIds);

      const livestockCategory = await context.prisma.livestockCategory.findMany(
        {
          where: {
            uuid: {
              in: livestockCategoryIds,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        }
      );

      const indexedLivestockCategory = livestockCategory.reduce((all, cat) => {
        if (!all[cat.uuid]) {
          all[cat.uuid] = {};
        }
        all[cat.uuid] = {
          ...cat,
          id: cat.id.toString(),
        };
        return all;
      }, {});

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          LivestockCategory: indexedLivestockCategory[q.livestockCategoryId]
            ? indexedLivestockCategory[q.livestockCategoryId]
            : {},
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },

    tokenizedAllLiveStocksBySupplierOnAnimalFeed: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);
      let tokenized = {};
      if (params.tokenizedParams) {
        tokenized = jwt.verify(params.tokenizedParams, TOKENIZE);
      }

      const { iat, ...payloadParams } = tokenized;

      const findAnimalFeed = await context.prisma.animalFeed.findMany({
        where: {
          supplierId: payloadParams.supplierId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      let result = await context.prisma.livestock.findMany({
        where: {
          uuid: {
            in: findAnimalFeed.map((feed) => feed.livestockId),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      result = result.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
        };
      });

      let livestockCategoryIds = result
        .filter((q) => q.livestockCategoryId)
        .map((q) => q.livestockCategoryId);
      livestockCategoryIds = lodash.uniq(livestockCategoryIds);

      const livestockCategory = await context.prisma.livestockCategory.findMany(
        {
          where: {
            uuid: {
              in: livestockCategoryIds,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        }
      );

      const indexedLivestockCategory = livestockCategory.reduce((all, cat) => {
        if (!all[cat.uuid]) {
          all[cat.uuid] = {};
        }
        all[cat.uuid] = {
          ...cat,
          id: cat.id.toString(),
        };
        return all;
      }, {});

      result = result.map((q) => {
        return {
          ...q,
          LivestockCategory: indexedLivestockCategory[q.livestockCategoryId]
            ? indexedLivestockCategory[q.livestockCategoryId]
            : {},
        };
      });

      const payload = {
        result,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
  },
  Mutation: {
    createLiveStock: async (self, params, context) => {
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

      await context.prisma.livestock.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "livestock",
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
    updateLiveStock: async (self, params, context) => {
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
        LivestockCategory,
        ...payload
      } = tokenized;

      await context.prisma.livestock.update({
        where: {
          uuid: payload.uuid,
        },
        data: {
          ...payload,
          updatedBy: context.activeSession.User,
          updatedAt: new Date().toISOString(),
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "UPDATE",
          tableName: "livestock",
          log: {
            ...payload,
            updatedBy: {
              uuid: context.activeSession.User.uuid,
              username: context.activeSession.User.employeeId,
            },
            updatedAt: new Date().toISOString(),
          },
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      return "success";
    },
    deleteLiveStock: async (self, params, context) => {
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

      let getDeletedData = await context.prisma.livestock.findUnique({
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

      await context.prisma.livestock.update({
        where: {
          uuid: payload.uuid,
        },
        data: {
          deletedBy: {
            uuid: context.activeSession.User.uuid,
            username: context.activeSession.User.employeeId,
          },
          deletedAt: new Date().toISOString(),
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "DELETE",
          tableName: "livestock",
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

    exportLivestock: async (self, params, context) => {
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
      let liveStocks = await context.prisma.livestock.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "asc",
        },
      });

      liveStocks = liveStocks.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
        };
      });

      const category = await context.prisma.livestockCategory.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedCategory = category.reduce((all, cat) => {
        if (!all[cat.uuid]) {
          all[cat.uuid] = {};
        }
        all[cat.uuid] = cat;
        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("LiveStock");

      let headerRow = [
        "LIVESTOCK ID",
        "LIVESTOCK CATEGORY",
        "TYPE OF LIVESTOCK",
      ];

      let columnWidths = [];
      for (let c = 0; c < headerRow.length; c++) {
        columnWidths.push(30);
      }

      let colCounter = 0;
      columnWidths.forEach((width) => {
        const column = ++colCounter;
        excelHelper.setColumnWidth({
          sheet: productionSheet,
          column,
          width,
        });
      });

      colCounter = 0;
      headerRow.forEach((data) => {
        excelHelper.addText({
          sheet: productionSheet,
          row: 1,
          col: ++colCounter,
          value: data.toUpperCase(),
          font: { bold: true },
          alignment: {
            vertical: "middle",
            horizontal: "center",
          },
          borderStyle: excelHelper.BorderStyle.Thin,
        });
      });

      let rowCounter = 2;
      colCounter = 0;

      for (const livestock of liveStocks) {
        const category = indexedCategory[livestock.livestockCategoryId];

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: livestock?.id || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: category?.categoryName || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: livestock?.typeOfLiveStock || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        colCounter = 0;
        rowCounter += 1;
      }

      const PREFIX = "DoAA";

      if (!fs.existsSync(process.cwd() + "/static/cache/")) {
        fs.mkdirSync(process.cwd() + "/static/cache/");
      }
      if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
        fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
      }
      const filename = `livestock.xlsx`;
      const fileUrl =
        `/doaa/cache/${PREFIX}/${filename}?t=` + new Date().toISOString();
      const folderPath = path.join(
        process.cwd(),
        `../app/public/cache/${PREFIX}`
      );
      fs.mkdirSync(folderPath, {
        recursive: true,
      });
      const filePath = path.join(
        process.cwd(),
        `../app/public/cache/${PREFIX}/${filename}`
      );
      // console.log({ folderPath, fileUrl, filePath });
      await workbook.xlsx.writeFile(filePath);

      // throw {};
      // return fileUrl;
      const fileBuffer = await fs.promises.readFile(filePath);

      return fileBuffer;
    },
  },
  // Livestock: {
  //   LivestockCategory: async (self, params, context) => {
  //     let found = await context.prisma.livestockCategory.findUnique({
  //       where: {
  //         uuid: self.livestockCategoryId,
  //       },
  //     });

  //     if (found) {
  //       found.id = BigInt(found.id).toString();
  //       return found;
  //     }
  //   },
  // },
};
exports.resolvers = resolvers;
