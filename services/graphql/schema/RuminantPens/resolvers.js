const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const resolvers = {
  Query: {
    allRuminantPenses: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("Ruminant Pens:Read")) {
        return [];
      }

      const queryResult = await context.prisma.ruminantPens.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      return queryResult;
    },
    tokenizedAllRuminantPenses: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let farmerProfileQuery = [];
      let profileQuery = {};
      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        const profile = await context.prisma.farmerProfile.findMany({
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

        const farmerProfile = await context.prisma.farmerProfile.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
            ...profileQuery,
          },
          select: {
            uuid: true,
            id: true,
          },
          orderBy: {
            id: "desc",
          },
        });

        farmerProfileQuery = farmerProfile;
      }

      let queryResult = await context.prisma.ruminantPens.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
          farmerUUID: {
            in: farmerProfileQuery.map((farm) => farm.uuid),
          },
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
    createRuminantPens: async (self, params, context) => {
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

      const { iat, _id, ...payload } = tokenized;

      if (!payload.farmerUUID) {
        throw new Error("Please fill the company name");
      }

      if (!payload.farmAreaId) {
        throw new Error("Invalid Farm Area");
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

      await context.prisma.ruminantPens.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "ruminantPens",
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
    updateRuminantPens: async (self, params, context) => {
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
        ...payload
      } = tokenized;

      if (!payload.farmerUUID) {
        throw new Error("Please fill the company name");
      }
      if (!payload.farmAreaId) {
        throw new Error("Invalid Farm Area");
      }

      await context.prisma.ruminantPens.update({
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
          tableName: "ruminantPens",
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
    deleteRuminantPens: async (self, params, context) => {
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

      let getDeletedData = await context.prisma.ruminantPens.findUnique({
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

      await context.prisma.ruminantPens.update({
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
          tableName: "ruminantPens",
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
    exportRuminantPens: async (self, params, context) => {
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
      let ruminantPenses = await context.prisma.ruminantPens.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      ruminantPenses = ruminantPenses.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
        };
      });

      const farmProfile = await context.prisma.farmProfile.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedFarmProfile = farmProfile.reduce((all, profile) => {
        if (!all[profile.uuid]) {
          all[profile.uuid] = {};
        }
        all[profile.uuid] = profile;

        return all;
      }, {});

      const farmerProfile = await context.prisma.farmerProfile.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedFarmerProfile = farmerProfile.reduce((all, profile) => {
        if (!all[profile.uuid]) {
          all[profile.uuid] = {};
        }
        all[profile.uuid] = profile;

        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Ruminant Pens");

      let headerRow = [
        "ID",
        "COMPANY NAME",
        "FARM AREA",
        "PENS NO",
        "PENS SYSTEM",
        "PENS CAPACITY",
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

      for (const ruminantPens of ruminantPenses) {
        const farmProfile = indexedFarmProfile[ruminantPens.farmAreaId];
        const farmerProfile = indexedFarmerProfile[ruminantPens.farmerUUID];

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: ruminantPens?.id || "",
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
          value: farmerProfile?.farmerCompanyName || "",
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
          value: farmProfile?.farmArea || "",
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
          value: ruminantPens?.pensNo || "",
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
          value: ruminantPens?.pensSystem || "",
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
          value: ruminantPens?.pensCapacity || "",
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
      const filename = `poultry_house.xlsx`;
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
  RuminantPens: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
  },
};
exports.resolvers = resolvers;
