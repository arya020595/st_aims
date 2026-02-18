const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const { orderBy } = require("lodash");
const TOKENIZE = process.env.TOKENIZE;
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const lodash = require("lodash");
const resolvers = {
  Query: {
    allAnimalFeeds: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("Animal Feed:Read")) {
        return [];
      }

      let queryResult = await context.prisma.animalFeed.findMany({
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
      return queryResult;
    },
    allAnimalFeedBySupplierId: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let queryResult = await context.prisma.animalFeed.findMany({
        where: {
          ...params,
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
      return queryResult;
    },

    tokenizedAllAnimalFeeds: async (self, params, context) => {
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

      // if (!role || !role.privileges.includes("Animal Feed:Read")) {
      //   return [];
      // }

      let queryResult = await context.prisma.animalFeed.findMany({
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

      let livestockIds = queryResult
        .filter((q) => q.livestockId)
        .map((q) => q.livestockId);
      livestockIds = lodash.uniq(livestockIds);

      const Livestock = await context.prisma.Livestock.findMany({
        where: {
          uuid: {
            in: livestockIds,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedLivestock = Livestock.reduce((all, livestock) => {
        if (!all[livestock.uuid]) {
          all[livestock.uuid] = {};
        }
        all[livestock.uuid] = {
          ...livestock,
          id: livestock.id.toString(),
        };
        return all;
      }, {});

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          Livestock: indexedLivestock[q.livestockId]
            ? indexedLivestock[q.livestockId]
            : {},
        };
      });

      let supplierIds = queryResult
        .filter((q) => q.supplierId)
        .map((q) => q.supplierId);
      supplierIds = lodash.uniq(supplierIds);

      const Supplier = await context.prisma.supplier.findMany({
        where: {
          uuid: {
            in: supplierIds,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedSupplier = Supplier.reduce((all, supp) => {
        if (!all[supp.uuid]) {
          all[supp.uuid] = {};
        }
        all[supp.uuid] = {
          ...supp,
          id: supp.id.toString(),
        };
        return all;
      }, {});

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          Supplier: indexedSupplier[q.supplierId]
            ? indexedSupplier[q.supplierId]
            : {},
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },

    tokenizedAllAnimalFeedBySupplierId: async (self, params, context) => {
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

      // if (!role || !role.privileges.includes("Animal Feed:Read")) {
      //   return [];
      // }

      let tokenized = {};

      if (params.tokenizedParams) {
        tokenized = jwt.verify(params.tokenizedParams, TOKENIZE);
      }

      const { iat, ...payloadParams } = tokenized;

      let queryResult = await context.prisma.animalFeed.findMany({
        where: {
          ...payloadParams,
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

      let livestockIds = queryResult
        .filter((q) => q.livestockId)
        .map((q) => q.livestockId);
      livestockIds = lodash.uniq(livestockIds);

      const Livestock = await context.prisma.Livestock.findMany({
        where: {
          uuid: {
            in: livestockIds,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedLivestock = Livestock.reduce((all, livestock) => {
        if (!all[livestock.uuid]) {
          all[livestock.uuid] = {};
        }
        all[livestock.uuid] = {
          ...livestock,
          id: livestock.id.toString(),
        };
        return all;
      }, {});

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          Livestock: indexedLivestock[q.livestockId]
            ? indexedLivestock[q.livestockId]
            : {},
        };
      });

      let supplierIds = queryResult
        .filter((q) => q.supplierId)
        .map((q) => q.supplierId);
      supplierIds = lodash.uniq(supplierIds);

      const Supplier = await context.prisma.supplier.findMany({
        where: {
          uuid: {
            in: supplierIds,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedSupplier = Supplier.reduce((all, supp) => {
        if (!all[supp.uuid]) {
          all[supp.uuid] = {};
        }
        all[supp.uuid] = {
          ...supp,
          id: supp.id.toString(),
        };
        return all;
      }, {});

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          Supplier: indexedSupplier[q.supplierId]
            ? indexedSupplier[q.supplierId]
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
    createAnimalFeed: async (self, params, context) => {
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

      await context.prisma.animalFeed.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "animalFeed",
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
    updateAnimalFeed: async (self, params, context) => {
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
        Supplier,
        Livestock,
        ...payload
      } = tokenized;

      await context.prisma.animalFeed.update({
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
          tableName: "animalFeed",
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
    deleteAnimalFeed: async (self, params, context) => {
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

      let getDeletedData = await context.prisma.animalFeed.findUnique({
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

      await context.prisma.animalFeed.update({
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
          tableName: "animalFeed",
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
    exportAnimalFeed: async (self, params, context) => {
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
      let animalFeeds = await context.prisma.animalFeed.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "asc",
        },
      });

      animalFeeds = animalFeeds.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
        };
      });

      const typeOfLiveStock = await context.prisma.livestock.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedTypeOfLivestock = typeOfLiveStock.reduce((all, live) => {
        if (!all[live.uuid]) {
          all[live.uuid] = {};
        }
        all[live.uuid] = live;
        return all;
      }, {});

      const supplier = await context.prisma.supplier.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedSupplier = supplier.reduce((all, supp) => {
        if (!all[supp.uuid]) {
          all[supp.uuid] = {};
        }
        all[supp.uuid] = supp;
        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Animal Feed");

      let headerRow = [
        "ID",
        "TYPE OF LIVESTOCK",
        "SUPPLIER",
        "LIVESTOCK FEED CATEGORY",
        "LIVESTOCK FEED CODE AND TYPE",
        "DESCRIPTION",
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

      for (const animalFeed of animalFeeds) {
        const typeOfLiveStock = indexedTypeOfLivestock[animalFeed.livestockId];
        const supplier = indexedSupplier[animalFeed.supplierId];

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: animalFeed?.id || "",
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
          value: typeOfLiveStock?.typeOfLiveStock || "",
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
          value: supplier?.supplierName || "",
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
          value: animalFeed?.category || "",
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
          value: animalFeed?.code || "",
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
          value: animalFeed?.description || "",
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
      const filename = `animal_feed.xlsx`;
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
  AnimalFeed: {
    Livestock: async (self, params, context) => {
      const found = await context.prisma.livestock.findUnique({
        where: {
          uuid: self.livestockId,
        },
      });

      return found;
    },
    Supplier: async (self, params, context) => {
      const found = await context.prisma.supplier.findUnique({
        where: {
          uuid: self.supplierId,
        },
      });

      return found;
    },
  },
};
exports.resolvers = resolvers;
