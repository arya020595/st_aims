const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const mime = require("mime");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const TOKENIZE = process.env.TOKENIZE;
const resolvers = {
  Query: {
    allMiscellaneousCropsRetailPrices: async (self, params, context) => {
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
        !role.privileges.includes("Miscellaneous Crops Retail Price:Read")
      ) {
        return [];
      }

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }
      let queryResult =
        await context.prisma.miscellaneousCropsRetailPrice.findMany({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      return queryResult;
    },
    tokenizedAllMiscellaneousCropsRetailPrices: async (
      self,
      params,
      context
    ) => {
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
      //   !role.privileges.includes("Miscellaneous Crops Retail Price:Read")
      // ) {
      //   return [];
      // }

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }
      let queryResult =
        await context.prisma.miscellaneousCropsRetailPrice.findMany({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
          skip: params.pageIndex * params.pageSize,
          take: params.pageSize,
        });

      let miscUUIDs = queryResult
        .filter((qr) => qr.miscellaneousCropUUID)
        .map((q) => q.miscellaneousCropUUID);
      miscUUIDs = lodash.uniq(miscUUIDs);

      const miscellaneousCrops =
        await context.prisma.miscellaneousCrops.findMany({
          where: {
            uuid: {
              in: miscUUIDs,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedMiscellaneousCrops = miscellaneousCrops.reduce(
        (all, misc) => {
          if (!all[misc.uuid]) {
            all[misc.uuid] = {};
          }
          all[misc.uuid] = {
            ...misc,
            id: misc.id.toString(),
          };
          return all;
        },
        {}
      );

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          MiscellaneousCrops: indexedMiscellaneousCrops[q.miscellaneousCropUUID]
            ? indexedMiscellaneousCrops[q.miscellaneousCropUUID]
            : {},
        };
      });

      let filteredFarmLocationUUID = queryResult
        .map((q) => q.farmLocationUUID)
        .filter((ret) => ret);
      filteredFarmLocationUUID = lodash.uniq(filteredFarmLocationUUID);
      const farmLocation = await context.prisma.farmLocation.findMany({
        where: {
          uuid: {
            in: filteredFarmLocationUUID,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedFarmLocation = farmLocation.reduce((all, fru) => {
        if (!all[fru.uuid]) {
          all[fru.uuid] = {};
        }
        all[fru.uuid] = {
          ...fru,
          id: fru.id.toString(),
        };
        return all;
      }, {});

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
          FarmLocation: indexedFarmLocation[q.farmLocationUUID]
            ? indexedFarmLocation[q.farmLocationUUID]
            : {},
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    countAllMiscellaneousCropsRetailPrices: async (self, params, context) => {
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
      //   !role.privileges.includes("Miscellaneous Crops Retail Price:Read")
      // ) {
      //   return [];
      // }

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }

      let queryResult =
        await context.prisma.miscellaneousCropsRetailPrice.count({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      return queryResult;

      // const miscellaneousCrops =
      //   await context.prisma.miscellaneousCrops.findMany({
      //     where: {
      //       uuid: {
      //         in: queryResult.map((q) => q.miscellaneousCropUUID),
      //       },
      //       ...NOT_DELETED_DOCUMENT_QUERY,
      //     },
      //   });

      // const indexedMiscellaneousCrops = miscellaneousCrops.reduce(
      //   (all, misc) => {
      //     if (!all[misc.uuid]) {
      //       all[misc.uuid] = {};
      //     }
      //     all[misc.uuid] = {
      //       ...misc,
      //       id: misc.id.toString(),
      //     };
      //     return all;
      //   },
      //   {}
      // );

      // queryResult = queryResult.map((q) => {
      //   return {
      //     ...q,
      //     MiscellaneousCrops: indexedMiscellaneousCrops[q.miscellaneousCropUUID]
      //       ? indexedMiscellaneousCrops[q.miscellaneousCropUUID]
      //       : {},
      //   };
      // });

      // const filteredFarmLocationUUID = queryResult
      //   .map((q) => q.farmLocationUUID)
      //   .filter((ret) => ret);

      // const farmLocation = await context.prisma.farmLocation.findMany({
      //   where: {
      //     uuid: {
      //       in: filteredFarmLocationUUID,
      //     },
      //     ...NOT_DELETED_DOCUMENT_QUERY,
      //   },
      // });

      // const indexedFarmLocation = farmLocation.reduce((all, fru) => {
      //   if (!all[fru.uuid]) {
      //     all[fru.uuid] = {};
      //   }
      //   all[fru.uuid] = {
      //     ...fru,
      //     id: fru.id.toString(),
      //   };
      //   return all;
      // }, {});

      // queryResult = queryResult.map((q) => {
      //   let id = BigInt(q.id);
      //   return {
      //     ...q,
      //     id: id.toString(),
      //     FarmLocation: indexedFarmLocation[q.farmLocationUUID]
      //       ? indexedFarmLocation[q.farmLocationUUID]
      //       : {},
      //   };
      // });

      // return queryResult.length
    },
  },
  Mutation: {
    createMiscellaneousCropsRetailPrice: async (self, params, context) => {
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

      await context.prisma.miscellaneousCropsRetailPrice.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "miscellaneousCropsRetailPrice",
          log: {
            ...createPayload,
          },
        },
      });
      return "success";
    },
    updateMiscellaneousCropsRetailPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.miscellaneousCropsRetailPrice.update({
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
          tableName: "miscellaneousCropsRetailPrice",
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
    deleteMiscellaneousCropsRetailPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData =
        await context.prisma.miscellaneousCropsRetailPrice.findUnique({
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

      await context.prisma.miscellaneousCropsRetailPrice.update({
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
          tableName: "miscellaneousCropsRetailPrice",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },

    importMiscellaneousRetailPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
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
      // ================================================= GRAB THEN SAVE
      const saveFileDir = process.cwd() + "/public/vegetable_retail_price";

      if (!fs.existsSync(saveFileDir)) {
        fs.mkdirSync(saveFileDir);
      }

      const filename = params.fileName;

      const buf = Buffer.from(params.excelBase64.split("base64,")[1], "base64");
      fs.writeFileSync(saveFileDir + "/" + filename, buf);

      // ================================================= LOAD XLSX FILE
      let workbook = new Excel.Workbook();
      await workbook.xlsx.readFile(saveFileDir + "/" + filename);

      let worksheet = workbook.getWorksheet("Template");
      if (!worksheet) {
        worksheet = workbook.getWorksheet("Sheet1");
      }
      if (!worksheet) {
        worksheet = workbook.getWorksheet("Misc Retail Price");
      }

      let keys = [];
      let data = [];
      worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
        if (rowNumber === 1) {
          keys = row.values;
        } else {
          let newData = {
            uuid: uuidv4(),
          };
          keys.forEach((key, index) => {
            if (key) {
              newData[key] = row.values[index] ? row.values[index] : "";
            }
          });
          // console.log("Row " + rowNumber + " = " + JSON.stringify(row.values));
          data.push(newData);
        }
      });

      let listMiscellaneousCrops =
        await context.prisma.miscellaneousCrops.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      listMiscellaneousCrops = listMiscellaneousCrops.map((list) => {
        return {
          uuid: list.uuid,
          miscellaneousCropId: list.miscellaneousCropId,
        };
      });

      for (const newData of data) {
        let newImporTradeData = {
          uuid: uuidv4(),
          monthYear: `${params.year}-${
            params.month > 9 ? params.month : "0" + params.month
          }`,
          ...mapImporKeys(newData),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: "",
          createdBy: context.activeSession.User,
          updatedBy: context.activeSession.User,
          deletedBy: {},
        };

        if (!newImporTradeData.bruneiMuaraPrice) {
          newImporTradeData.bruneiMuaraPrice = 0;
        }
        if (!newImporTradeData.tutongPrice) {
          newImporTradeData.tutongPrice = 0;
        }
        if (!newImporTradeData.belaitPrice) {
          newImporTradeData.belaitPrice = 0;
        }
        if (!newImporTradeData.temburongPrice) {
          newImporTradeData.temburongPrice = 0;
        }
        const total =
          newImporTradeData.bruneiMuaraPrice +
          newImporTradeData.tutongPrice +
          newImporTradeData.belaitPrice +
          newImporTradeData.temburongPrice;

        if (total === 0) continue;

        const foundMiscellaneous = listMiscellaneousCrops.filter(
          (v) => v.miscellaneousCropId === newImporTradeData.miscellaneousCropId
        );

        if (foundMiscellaneous.length === 0) {
          throw new Error(
            `Miscellaneous code with ${newImporTradeData.miscellaneousCropId} not found in Miscellaneous master data`
          );
        }

        if (foundMiscellaneous.length > 1) {
          throw new Error(
            `Duplicate code ${newImporTradeData.miscellaneousCropId} in Miscellaneous master data`
          );
        }

        newImporTradeData["miscellaneousCropUUID"] = foundMiscellaneous[0].uuid;

        delete newImporTradeData.miscellaneousCropId;
        delete newImporTradeData["MISC NAME"];
        await context.prisma.miscellaneousCropsRetailPrice.create({
          data: {
            ...newImporTradeData,
          },
        });
      }
      return "ok";
    },

    exportsMiscellaneousRetailPrice: async (self, params, context) => {
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
      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }
      let retailPrices =
        await context.prisma.miscellaneousCropsRetailPrice.findMany({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      let miscellaneous = await context.prisma.miscellaneousCrops.findMany({
        where: {
          uuid: {
            in: retailPrices.map((ret) => ret.miscellaneousCropUUID),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexMiscellaneous = miscellaneous.reduce((all, misc) => {
        if (!all[misc.uuid]) {
          all[misc.uuid] = {};
        }
        all[misc.uuid] = misc;
        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let retailSheet = workbook.addWorksheet("Miscellaneous Retail Price");

      let columnWidths = [30, 30, 30, 30, 30];

      let headerRow = [
        "MISCELLANEOUS CODE",
        "BRUNEI MUARA RETAIL PRICE",
        "TUTONG RETAIL PRICE",
        "BELAIT RETAIL PRICE",
        "TEMBURONG RETAIL PRICE",
      ];

      let colCounter = 0;
      columnWidths.forEach((width) => {
        const column = ++colCounter;
        excelHelper.setColumnWidth({
          sheet: retailSheet,
          column,
          width,
        });
      });

      colCounter = 0;
      headerRow.forEach((data) => {
        excelHelper.addText({
          sheet: retailSheet,
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

      for (const price of retailPrices) {
        const miscellaneous = indexMiscellaneous[price.miscellaneousCropUUID];
        excelHelper.addText({
          sheet: retailSheet,
          row: rowCounter,
          col: ++colCounter,
          value: miscellaneous?.miscellaneousCropId || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        // bruneiMuaraPrice: Float
        // tutongPrice: Float
        // belaitPrice: Float
        // temburongPrice: Float
        excelHelper.addText({
          sheet: retailSheet,
          row: rowCounter,
          col: ++colCounter,
          value: parseFloat(price.bruneiMuaraPrice || 0),
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });
        excelHelper.addText({
          sheet: retailSheet,
          row: rowCounter,
          col: ++colCounter,
          value: parseFloat(price.tutongPrice || 0),
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        excelHelper.addText({
          sheet: retailSheet,
          row: rowCounter,
          col: ++colCounter,
          value: parseFloat(price.belaitPrice || 0),
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        excelHelper.addText({
          sheet: retailSheet,
          row: rowCounter,
          col: ++colCounter,
          value: parseFloat(price.temburongPrice || 0),
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });
        colCounter = 0;
        rowCounter += 1;
      }

      // Write to buffer instead of file
      const buffer = await workbook.xlsx.writeBuffer();

      // Convert buffer to base64
      const base64 = buffer.toString("base64");

      return base64;
      // const PREFIX = "DoAA";

      // if (!fs.existsSync(process.cwd() + "/static/cache/")) {
      //   fs.mkdirSync(process.cwd() + "/static/cache/");
      // }
      // if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
      //   fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
      // }
      // const filename = `miscellaneous_retail_price.xlsx`;
      // const fileUrl =
      //   `/doaa/cache/${PREFIX}/${filename}?t=` + new Date().toISOString();
      // const folderPath = path.join(
      //   process.cwd(),
      //   `../app/public/cache/${PREFIX}`
      // );
      // fs.mkdirSync(folderPath, {
      //   recursive: true,
      // });
      // const filePath = path.join(
      //   process.cwd(),
      //   `../app/public/cache/${PREFIX}/${filename}`
      // );
      // // console.log({ folderPath, fileUrl, filePath });
      // await workbook.xlsx.writeFile(filePath);

      // // throw {};
      // return fileUrl;
    },
    tokenizedCreateMiscellaneousCropsRetailPrice: async (
      self,
      params,
      context
    ) => {
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
        CropsCategory,
        cropName,
        englishName,
        localName,
        miscellaneousCropId,
        cropsCategoryUUID,
        ...payload
      } = tokenized;

      if (!payload.miscellaneousCropUUID) {
        throw new Error("Invalid Misc. UUID");
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

      await context.prisma.miscellaneousCropsRetailPrice.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "miscellaneousCropsRetailPrice",
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
    tokenizedUpdateMiscellaneousCropsRetailPrice: async (
      self,
      params,
      context
    ) => {
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
        englishName,
        localName,
        FarmLocation,
        MiscellaneousCrops,
        miscellaneousCropId,
        ...payload
      } = tokenized;

      if (!payload.miscellaneousCropUUID) {
        throw new Error("Invalid Misc. UUID");
      }

      await context.prisma.miscellaneousCropsRetailPrice.update({
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
          tableName: "miscellaneousCropsRetailPrice",
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
    tokenizedDeleteMiscellaneousCropsRetailPrice: async (
      self,
      params,
      context
    ) => {
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

      let getDeletedData =
        await context.prisma.miscellaneousCropsRetailPrice.findUnique({
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

      await context.prisma.miscellaneousCropsRetailPrice.update({
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
          tableName: "miscellaneousCropsRetailPrice",
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
    generateMiscellaneousCropsRetailPriceTemplate: async (
      self,
      params,
      context
    ) => {
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
      let queryResult = await context.prisma.miscellaneousCrops.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          localName: "asc",
        },
      });

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let retailSheet = workbook.addWorksheet("Misc Retail Price");

      let columnWidths = [30, 30, 30, 30, 30, 30];

      let headerRow = [
        "MISC CODE",
        "MISC NAME",
        "BRUNEI RETAIL PRICE",
        "TUTONG RETAIL PRICE",
        "BELAIT RETAIL PRICE",
        "TEMBURONG RETAIL PRICE",
      ];

      let colCounter = 0;
      columnWidths.forEach((width) => {
        const column = ++colCounter;
        excelHelper.setColumnWidth({
          sheet: retailSheet,
          column,
          width,
        });
      });

      colCounter = 0;
      headerRow.forEach((data) => {
        excelHelper.addText({
          sheet: retailSheet,
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

      for (const misc of queryResult) {
        excelHelper.addText({
          sheet: retailSheet,
          row: rowCounter,
          col: ++colCounter,
          value: misc?.miscellaneousCropId || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        excelHelper.addText({
          sheet: retailSheet,
          row: rowCounter,
          col: ++colCounter,
          value: misc?.localName || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        // bruneiMuaraPrice: Float
        // tutongPrice: Float
        // belaitPrice: Float
        // temburongPrice: Float
        excelHelper.addText({
          sheet: retailSheet,
          row: rowCounter,
          col: ++colCounter,
          value: 0,
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });
        excelHelper.addText({
          sheet: retailSheet,
          row: rowCounter,
          col: ++colCounter,
          value: 0,
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        excelHelper.addText({
          sheet: retailSheet,
          row: rowCounter,
          col: ++colCounter,
          value: 0,
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        excelHelper.addText({
          sheet: retailSheet,
          row: rowCounter,
          col: ++colCounter,
          value: 0,
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });
        colCounter = 0;
        rowCounter += 1;
      }

      // Write to buffer instead of file
      const buffer = await workbook.xlsx.writeBuffer();

      // Convert buffer to base64
      const base64 = buffer.toString("base64");

      return base64;

      // const PREFIX = "DoAA";

      // if (!fs.existsSync(process.cwd() + "/static/cache/")) {
      //   fs.mkdirSync(process.cwd() + "/static/cache/");
      // }
      // if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
      //   fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
      // }
      // const filename = `misc_retail_price_template.xlsx`;
      // const fileUrl =
      //   `/doaa/cache/${PREFIX}/${filename}?t=` + new Date().toISOString();
      // const folderPath = path.join(
      //   process.cwd(),
      //   `../app/public/cache/${PREFIX}`
      // );
      // fs.mkdirSync(folderPath, {
      //   recursive: true,
      // });
      // const filePath = path.join(
      //   process.cwd(),
      //   `../app/public/cache/${PREFIX}/${filename}`
      // );
      // // console.log({ folderPath, fileUrl, filePath });
      // await workbook.xlsx.writeFile(filePath);

      // // throw {};
      // return fileUrl;
    },
    tokenizedCreateManyMiscellaneousCropsRetailPrice: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);

      let userId = "";

      if (context.activeSession.User && context.activeSession.User.uuid) {
        userId = context.activeSession.User.uuid;
      }

      if (!userId) {
        throw new Error("Invalid Session !!!");
      }

      const tokenized = jwt.verify(params.tokenized, TOKENIZE);
      const { iat, tokenizedPayload } = tokenized;

      const payloads = tokenizedPayload.map((data) => {
        const {
          id,
          CropsCategory,
          cropName,
          englishName,
          localName,
          miscellaneousCropId,
          cropsCategoryUUID,
          ...payload
        } = data;
        return {
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
      });

      for (const payload of payloads) {
        if (!payload.miscellaneousCropUUID) {
          throw new Error("Invalid Misc. UUID");
        }
      }

      await context.prisma.miscellaneousCropsRetailPrice.createMany({
        data: payloads,
        skipDuplicates: false,
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "miscellaneousCropsRetailPrice",
          log: {
            miscellaneousCropsRetailPriceIds: payloads.map((data) => data.uuid),
          },
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      return "success";
    },
  },
  MiscellaneousCropsRetailPrice: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    MiscellaneousCrops: async (self, params, context) => {
      if (self.miscellaneousCropUUID) {
        const found = await context.prisma.miscellaneousCrops.findMany({
          where: {
            uuid: self.miscellaneousCropUUID,
          },
          take: 1,
        });
        if (found.length > 0) {
          return found[0];
        }
      }

      return {};
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

const importKeyMap = {
  // YEAR: "year",
  // TYPE: "type",
  // MONTH: "monthName",
  "MISC CODE": "miscellaneousCropId",
  "BRUNEI RETAIL PRICE": "bruneiMuaraPrice",
  "TUTONG RETAIL PRICE": "tutongPrice",
  "BELAIT RETAIL PRICE": "belaitPrice",
  "TEMBURONG RETAIL PRICE": "temburongPrice",
};

const mapImporKeys = (data) => {
  let mappedData = {};
  Object.keys(data).forEach((key) => {
    const mappedKey = importKeyMap[key.trim()];
    if (mappedKey) {
      mappedData[mappedKey] = data[key];
    } else {
      mappedData[key] = data[key];
    }
  });
  return mappedData;
};

const base64MimeType = (encoded) => {
  var result = null;

  if (typeof encoded !== "string") {
    return result;
  }

  var mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
  if (mime && mime.length) {
    result = mime[1];
  }

  return result;
};
