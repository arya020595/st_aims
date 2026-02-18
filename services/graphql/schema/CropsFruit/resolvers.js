const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const { startsWith } = require("lodash");
const lodash = require("lodash");
const TOKENIZE = process.env.TOKENIZE;

const resolvers = {
  Query: {
    allCropsFruits: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("Fruit Master Data:Read")) {
        return [];
      }

      let queryResult = await context.prisma.cropsFruit.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      return queryResult;
    },
    tokenizedAllCropsFruits: async (self, params, context) => {
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

      // if (!role || !role.privileges.includes("Fruit Master Data:Read")) {
      //   return [];
      // }

      let queryResult = await context.prisma.cropsFruit.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      let cropsCategoryUUIDs = queryResult
        .filter((qr) => qr.cropsCategoryUUID)
        .map((q) => q.cropsCategoryUUID);

      cropsCategoryUUIDs = lodash.uniq(cropsCategoryUUIDs);

      const cropsCategory = await context.prisma.cropsCategory.findMany({
        where: {
          uuid: {
            in: cropsCategoryUUIDs,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedCropsCategory = cropsCategory.reduce((all, cat) => {
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
          CropsCategory: indexedCropsCategory[q.cropsCategoryUUID]
            ? indexedCropsCategory[q.cropsCategoryUUID]
            : {},
        };
      });

      let seasonUUIDs = queryResult
        .filter((qr) => qr.seasonUUID)
        .map((q) => q.seasonUUID);

      seasonUUIDs = lodash.uniq(seasonUUIDs);

      const season = await context.prisma.season.findMany({
        where: {
          uuid: {
            in: seasonUUIDs,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedSeason = season.reduce((all, season) => {
        if (!all[season.uuid]) {
          all[season.uuid] = {};
        }
        all[season.uuid] = {
          ...season,
          id: season.id.toString(),
        };
        return all;
      }, {});

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          Season: indexedSeason[q.seasonUUID]
            ? indexedSeason[q.seasonUUID]
            : {},
        };
      });

      let uuids = queryResult.filter((qr) => qr.uuid).map((q) => q.uuid);

      uuids = lodash.uniq(uuids);

      const cropsFruitDetails = await context.prisma.cropsFruitDetail.findMany({
        where: {
          cropFruitId: {
            in: uuids,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      queryResult = queryResult.map((q) => {
        const count = cropsFruitDetails.filter((ret) => {
          return ret.cropFruitId === q.uuid;
        });
        return {
          ...q,
          countCropsFruitDetails: count.length,
        };
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
    searchAllCropsFruits: async (self, params, context) => {
      assertValidSession(context.activeSession);
      let nameQuery = {};
      if (params.name) {
        nameQuery = {
          localName: {
            startsWith: params.name,
          },
        };
      }

      let queryResult = await context.prisma.cropsFruit.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
          ...nameQuery,
        },
        orderBy: {
          localName: "asc",
        },
        take: 10,
      });
      if (queryResult.length === 0) {
        if (params.name) {
          nameQuery = {
            localName: {
              contains: params.name,
            },
          };
        }
        queryResult = await context.prisma.cropsFruit.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
            ...nameQuery,
          },
          orderBy: {
            localName: "asc",
          },
          take: 10,
        });
      }
      const cropsCategory = await context.prisma.cropsCategory.findMany({
        where: {
          uuid: {
            in: queryResult.map((q) => q.cropsCategoryUUID),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedCropsCategory = cropsCategory.reduce((all, cat) => {
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
          CropsCategory: indexedCropsCategory[q.cropsCategoryUUID]
            ? indexedCropsCategory[q.cropsCategoryUUID]
            : {},
        };
      });

      const season = await context.prisma.season.findMany({
        where: {
          uuid: {
            in: queryResult.map((q) => q.seasonUUID),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedSeason = season.reduce((all, season) => {
        if (!all[season.uuid]) {
          all[season.uuid] = {};
        }
        all[season.uuid] = {
          ...season,
          id: season.id.toString(),
        };
        return all;
      }, {});

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          Season: indexedSeason[q.seasonUUID]
            ? indexedSeason[q.seasonUUID]
            : {},
        };
      });

      const cropsFruitDetails = await context.prisma.cropsFruitDetail.findMany({
        where: {
          cropFruitId: {
            in: queryResult.map((q) => q.uuid),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      queryResult = queryResult.map((q) => {
        const count = cropsFruitDetails.filter((ret) => {
          return ret.cropFruitId === q.uuid;
        });
        return {
          ...q,
          countCropsFruitDetails: count.length,
        };
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
    createCropsFruit: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let found = await context.prisma.cropsCategory.findMany({
        where: {
          uuid: params.cropsCategoryUUID,
        },
        take: 1,
      });

      if (found.length === 0) {
        throw new Error("Category not found!");
      }
      found = found[0];

      let countData = await context.prisma.cropsFruit.count();

      let startCode = found.prefixCode;

      const dataLength = "" + (countData + 1);

      const last = dataLength.length * -1;

      if (countData === 0) {
        startCode = startCode.slice(0, last) + 1;
      } else {
        startCode = startCode.slice(0, last) + dataLength;
      }

      const fruitId = startCode;

      const createPayload = {
        uuid: uuidv4(),
        ...params,
        fruitId,
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

      await context.prisma.cropsFruit.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "cropsFruit",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateCropsFruit: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.cropsFruit.update({
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
          tableName: "cropsFruit",
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
    deleteCropsFruit: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData = await context.prisma.cropsFruit.findUnique({
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

      await context.prisma.cropsFruit.update({
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
          tableName: "cropsFruit",
          log: {
            ...getDeletedData,
          },
        },
      });

      return "success";
    },
    tokenizedCreateCropsFruit: async (self, params, context) => {
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

      let found = await context.prisma.cropsCategory.findMany({
        where: {
          uuid: payload.cropsCategoryUUID,
        },
        take: 1,
      });

      if (found.length === 0) {
        throw new Error("Category not found!");
      }
      found = found[0];
      const splittedCode = found.prefixCode.split("000")[0];
      let getLatestData = await context.prisma.cropsFruit.findMany({
        where: {
          fruitId: {
            contains: splittedCode,
          },
        },
        orderBy: {
          fruitId: "desc",
        },
        take: 1,
      });
      let countData = 0;
      if (getLatestData.length > 0) {
        getLatestData = {
          ...getLatestData[0],
        };
        getLatestData["codeCount"] =
          getLatestData.fruitId.split(splittedCode)[1];

        countData = parseInt(getLatestData.codeCount);
      }
      let startCode = found.prefixCode;

      const dataLength = "" + (countData + 1);

      const last = dataLength.length * -1;

      if (countData === 0) {
        startCode = startCode.slice(0, last) + 1;
      } else {
        startCode = startCode.slice(0, last) + dataLength;
      }

      const fruitId = startCode;

      const createPayload = {
        uuid: uuidv4(),
        ...payload,
        fruitId,
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

      await context.prisma.cropsFruit.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "cropsFruit",
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
    tokenizedUpdateCropsFruit: async (self, params, context) => {
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
        CropsCategory,
        Season,
        countCropsFruitDetails,
        ...payload
      } = tokenized;

      await context.prisma.cropsFruit.update({
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
          tableName: "cropsFruit",
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
    tokenizedDeleteCropsFruit: async (self, params, context) => {
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

      let getDeletedData = await context.prisma.cropsFruit.findUnique({
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

      await context.prisma.cropsFruit.update({
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
          tableName: "cropsFruit",
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
    exportCropsFruit: async (self, params, context) => {
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

      let fruits = await context.prisma.cropsFruit.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      fruits = fruits.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
        };
      });

      const category = await context.prisma.cropsCategory.findMany({
        where: {
          uuid: {
            in: fruits.map((q) => q.cropsCategoryUUID),
          },
        },
      });

      const indexedCategory = category.reduce((all, cat) => {
        if (!all[cat.uuid]) {
          all[cat.uuid] = {};
        }
        all[cat.uuid] = cat;
        return all;
      }, {});

      const season = await context.prisma.season.findMany({
        where: {
          uuid: {
            in: fruits.map((q) => q.seasonUUID),
          },
        },
      });

      const indexedSeason = season.reduce((all, seas) => {
        if (!all[seas.uuid]) {
          all[seas.uuid] = {};
        }
        all[seas.uuid] = seas;
        return all;
      });

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Fruit");

      let headerRow = [
        "FRUIT ID",
        "CATEGORY",
        "LOCAL NAME",
        "ENGLISH NAME",
        "CROP NAME",
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

      for (const fruit of fruits) {
        const category = indexedCategory[fruit.cropsCategoryUUID];
        const season = indexedSeason[fruit.seasonUUID];

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: fruit?.fruitId || "",
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
          value: category?.name || "",
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
          value: fruit?.localName || "",
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
          value: fruit?.englishName || "",
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
          value: fruit?.cropName || "",
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
      const filename = `fruit.xlsx`;
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
  CropsFruit: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    CropsCategory: async (self, params, context) => {
      const found = await context.prisma.cropsCategory.findMany({
        where: {
          uuid: self.cropsCategoryUUID,
        },
        take: 1,
      });
      if (found.length > 0) {
        return found[0];
      }
      return {};
    },
    Season: async (self, params, context) => {
      if (self.seasonUUID) {
        const found = await context.prisma.season.findMany({
          where: {
            uuid: self.seasonUUID,
          },
          take: 1,
        });
        if (found.length > 0) {
          return found[0];
        }
      }

      return {};
    },
    countCropsFruitDetails: async (self, params, context) => {
      const count = await context.prisma.cropsFruitDetail.findMany({
        where: {
          cropFruitId: self.uuid,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });
      return count.length;
    },
  },
};
exports.resolvers = resolvers;
