const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const TOKENIZE = process.env.TOKENIZE;
const lodash = require("lodash");

const resolvers = {
  Query: {
    allCropsPaddyVarieties: async (self, params, context) => {
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

      if (
        !role ||
        !role.privileges.includes("Paddy Variety Paddy Master Data Crops:Read")
      ) {
        return [];
      }

      let queryResult = await context.prisma.cropsPaddyVariety.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      return queryResult;
    },
    tokenizedAllCropsPaddyVarieties: async (self, params, context) => {
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

      // if (
      //   !role ||
      //   !role.privileges.includes("Paddy Variety Paddy Master Data Crops:Read")
      // ) {
      //   return [];
      // }

      let queryResult = await context.prisma.cropsPaddyVariety.findMany({
        where: {
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

      let cropsCategoryUUIDs = queryResult
        .filter((qr) => qr.cropsCategoryUUID)
        .map((q) => q.cropsCategoryUUID);

      cropsCategoryUUIDs = lodash.uniq(cropsCategoryUUIDs);

      const CropsCategory = await context.prisma.cropsCategory.findMany({
        where: {
          uuid: {
            in: cropsCategoryUUIDs,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedCropsCategory = CropsCategory.reduce((all, cat) => {
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

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
  },
  Mutation: {
    createCropsPaddyVariety: async (self, params, context) => {
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

      let countData = await context.prisma.cropsPaddyVariety.count();

      let startCode = found.prefixCode;

      const dataLength = "" + (countData + 1);

      const last = dataLength.length * -1;

      if (countData === 0) {
        startCode = startCode.slice(0, last) + 1;
      } else {
        startCode = startCode.slice(0, last) + dataLength;
      }

      const paddyId = startCode;

      const createPayload = {
        uuid: uuidv4(),
        ...params,
        paddyId,
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

      await context.prisma.cropsPaddyVariety.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "cropsPaddyVariety",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateCropsPaddyVariety: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.cropsPaddyVariety.update({
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
          tableName: "cropsPaddyVariety",
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
    deleteCropsPaddyVariety: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData = await context.prisma.cropsPaddyVariety.findUnique({
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

      await context.prisma.cropsPaddyVariety.update({
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
          tableName: "cropsPaddyVariety",
          log: {
            ...getDeletedData,
          },
        },
      });

      return "success";
    },

    tokenizedCreateCropsPaddyVariety: async (self, params, context) => {
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

      let getLatestData = await context.prisma.cropsPaddyVariety.findMany({
        where: {
          paddyId: {
            contains: splittedCode,
          },
        },
        orderBy: {
          paddyId: "desc",
        },
        take: 1,
      });
      let countData = 0;
      if (getLatestData.length > 0) {
        getLatestData = {
          ...getLatestData[0],
        };
        getLatestData["codeCount"] =
          getLatestData.paddyId.split(splittedCode)[1];
        countData = parseInt(getLatestData.codeCount);
      } else {
        countData = 0;
      }

      let startCode = found.prefixCode;

      const dataLength = "" + (countData + 1);

      const last = dataLength.length * -1;

      if (countData === 0) {
        startCode = startCode.slice(0, last) + 1;
      } else {
        startCode = startCode.slice(0, last) + dataLength;
      }

      const paddyId = startCode;

      const createPayload = {
        uuid: uuidv4(),
        ...payload,
        paddyId,
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

      await context.prisma.cropsPaddyVariety.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "cropsPaddyVariety",
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
    tokenizedUpdateCropsPaddyVariety: async (self, params, context) => {
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
        ...payload
      } = tokenized;

      await context.prisma.cropsPaddyVariety.update({
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
          tableName: "cropsPaddyVariety",
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
    tokenizedDeleteCropsPaddyVariety: async (self, params, context) => {
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

      let getDeletedData = await context.prisma.cropsPaddyVariety.findUnique({
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

      await context.prisma.cropsPaddyVariety.update({
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
          tableName: "cropsPaddyVariety",
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
    exportCropsPaddyVariety: async (self, params, context) => {
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

      let paddyVarietys = await context.prisma.cropsPaddyVariety.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      paddyVarietys = paddyVarietys.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
        };
      });

      const category = await context.prisma.cropsCategory.findMany({
        where: {
          uuid: {
            in: paddyVarietys.map((q) => q.cropsCategoryUUID),
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

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Paddy Variety");

      let headerRow = [
        "PADDY ID",
        "PADDY CATEGORY",
        "VARIETY NAME",
        "SCHEME PRICE/KG",
        "MARKET PRICE/KG",
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

      for (const paddyVariety of paddyVarietys) {
        const category = indexedCategory[paddyVariety.cropsCategoryUUID];

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: paddyVariety?.paddyId || "",
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
          value: paddyVariety?.varietyName || "",
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
          value: paddyVariety?.schemePrice || 0,
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
          value: paddyVariety?.marketPrice || 0,
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
      const filename = `paddy_variety.xlsx`;
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

      const fileBuffer = await fs.promises.readFile(filePath);

      return fileBuffer;
      // throw {};
      // return fileUrl;
    },
  },
  CropsPaddyVariety: {
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
  },
};
exports.resolvers = resolvers;
