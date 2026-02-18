const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const mime = require("mime");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;
const lodash = require("lodash");
const resolvers = {
  Query: {
    allFruitRetailPrices: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("Fruit Retail Price:Read")) {
        return [];
      }

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }
      let queryResult = await context.prisma.fruitRetailPrice.findMany({
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
    tokenizedAllFruitRetailPrices: async (self, params, context) => {
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

      // if (!role || !role.privileges.includes("Fruit Retail Price:Read")) {
      //   return [];
      // }

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }
      let queryResult = await context.prisma.fruitRetailPrice.findMany({
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
        return {
          ...q,
          FarmLocation: indexedFarmLocation[q.farmLocationUUID]
            ? indexedFarmLocation[q.farmLocationUUID]
            : {},
        };
      });

      let cropsFruitUUIDs = queryResult
        .filter((qr) => qr.fruitUUID)
        .map((q) => q.fruitUUID);

      cropsFruitUUIDs = lodash.uniq(cropsFruitUUIDs);

      const cropsFruit = await context.prisma.cropsFruit.findMany({
        where: {
          uuid: {
            in: cropsFruitUUIDs,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedCropsFruit = cropsFruit.reduce((all, fru) => {
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
          Fruit: indexedCropsFruit[q.fruitUUID]
            ? indexedCropsFruit[q.fruitUUID]
            : {},
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    countAllFruitRetailPrices: async (self, params, context) => {
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

      // if (!role || !role.privileges.includes("Fruit Retail Price:Read")) {
      //   return [];
      // }

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }
      let queryResult = await context.prisma.fruitRetailPrice.count({
        where: {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      return queryResult;

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
      //   return {
      //     ...q,
      //     FarmLocation: indexedFarmLocation[q.farmLocationUUID]
      //       ? indexedFarmLocation[q.farmLocationUUID]
      //       : {},
      //   };
      // });

      // const cropsFruit = await context.prisma.cropsFruit.findMany({
      //   where: {
      //     uuid: {
      //       in: queryResult.map((q) => q.fruitUUID),
      //     },
      //     ...NOT_DELETED_DOCUMENT_QUERY,
      //   },
      // });

      // const indexedCropsFruit = cropsFruit.reduce((all, fru) => {
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
      //     Fruit: indexedCropsFruit[q.fruitUUID]
      //       ? indexedCropsFruit[q.fruitUUID]
      //       : {},
      //   };
      // });

      // return queryResult.length
    },
  },
  Mutation: {
    createFruitRetailPrice: async (self, params, context) => {
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

      await context.prisma.fruitRetailPrice.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "fruitRetailPrice",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateFruitRetailPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.fruitRetailPrice.update({
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
          tableName: "fruitRetailPrice",
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
    deleteFruitRetailPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData = await context.prisma.fruitRetailPrice.findUnique({
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

      await context.prisma.fruitRetailPrice.update({
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
          tableName: "fruitRetailPrice",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    importFruitRetailPrice: async (self, params, context) => {
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

      const saveFileDir = process.cwd() + "/public/fruit_retail_price";

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
        worksheet = workbook.getWorksheet("Fruit Retail Price");
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
      let listFruit = await context.prisma.cropsFruit.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      listFruit = listFruit.map((list) => {
        return {
          uuid: list.uuid,
          fruitId: list.fruitId,
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

        const foundFruit = listFruit.filter(
          (v) => v.fruitId === newImporTradeData.fruitId
        );

        if (foundFruit.length === 0) {
          throw new Error(
            `Fruit code with ${newImporTradeData.fruitId} not found in Fruit master data`
          );
        }

        if (foundFruit.length > 1) {
          throw new Error(
            `Duplicate code ${newImporTradeData.fruitId} in fruit master data`
          );
        }

        newImporTradeData["fruitUUID"] = foundFruit[0].uuid;
        delete newImporTradeData.fruitId;
        delete newImporTradeData["FRUIT NAME"];

        await context.prisma.fruitRetailPrice.create({
          data: {
            ...newImporTradeData,
          },
        });

        await context.prisma.activityLogs.create({
          data: {
            uuid: uuidv4(),
            type: "CREATE",
            tableName: "fruitRetailPrice",
            log: {
              ...newImporTradeData,
            },
          },
        });
      }
      return "ok";
    },
    exportFruitRetailPrice: async (self, params, context) => {
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

      let retailPrices = await context.prisma.fruitRetailPrice.findMany({
        where: {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      let fruit = await context.prisma.cropsFruit.findMany({
        where: {
          uuid: {
            in: retailPrices.map((ret) => ret.fruitUUID),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexFruit = fruit.reduce((all, fru) => {
        if (!all[fru.uuid]) {
          all[fru.uuid] = {};
        }
        all[fru.uuid] = fru;
        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let retailSheet = workbook.addWorksheet("Fruit Retail Price");

      let columnWidths = [30, 30, 30, 30, 30];

      let headerRow = [
        "FRUIT CODE",
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

      for (const price of retailPrices) {
        const fruit = indexFruit[price.fruitUUID];
        excelHelper.addText({
          sheet: retailSheet,
          row: rowCounter,
          col: ++colCounter,
          value: fruit?.fruitId || "",
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
      const base64 = buffer.toString('base64');

      return base64;
      // const PREFIX = "DoAA";

      // if (!fs.existsSync(process.cwd() + "/static/cache/")) {
      //   fs.mkdirSync(process.cwd() + "/static/cache/");
      // }
      // if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
      //   fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
      // }
      // const filename = `fruit_retail_price.xlsx`;
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
    tokenizedCreateFruitRetailPrice: async (self, params, context) => {
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
        countCropsFruitDetails,
        Season,
        CropsCategory,
        seasonId,
        cropName,
        englishName,
        localName,
        seasonUUID,
        cropsCategoryUUID,
        id,
        fruitId,
        ...payload
      } = tokenized;

      if (!payload.fruitUUID) {
        throw new Error("Invalid Fruit UUID");
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

      await context.prisma.fruitRetailPrice.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "fruitRetailPrice",
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
    tokenizedUpdateFruitRetailPrice: async (self, params, context) => {
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
        FarmLocation,
        englishName,
        localName,
        Fruit,
        fruitId,
        ...payload
      } = tokenized;

      if (!payload.fruitUUID) {
        throw new Error("Invalid Fruit UUID");
      }
      await context.prisma.fruitRetailPrice.update({
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
          tableName: "fruitRetailPrice",
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
    tokenizedDeleteFruitRetailPrice: async (self, params, context) => {
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

      let getDeletedData = await context.prisma.fruitRetailPrice.findUnique({
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

      await context.prisma.fruitRetailPrice.update({
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
          tableName: "fruitRetailPrice",
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
    generateFruitRetailPriceTemplate: async (self, params, context) => {
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
      assertValidSession(context.activeSession);
      let queryResult = await context.prisma.cropsFruit.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          localName: "asc",
        },
      });

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let retailSheet = workbook.addWorksheet("Fruit Retail Price");

      let columnWidths = [30, 30, 30, 30, 30, 30];

      let headerRow = [
        "FRUIT CODE",
        "FRUIT NAME", 
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

      for (const fruit of queryResult) {
        excelHelper.addText({
          sheet: retailSheet,
          row: rowCounter,
          col: ++colCounter,
          value: fruit?.fruitId || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
        });

        excelHelper.addText({
          sheet: retailSheet,
          row: rowCounter,
          col: ++colCounter,
          value: fruit?.localName || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
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
        });
        colCounter = 0;
        rowCounter += 1;
      }

      // Write to buffer instead of file
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Convert buffer to base64
      const base64 = buffer.toString('base64');

      return base64;
    },
    tokenizedCreateManyFruitRetailPrice: async (self, params, context) => {
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
          countCropsFruitDetails,
          Season,
          CropsCategory,
          seasonId,
          cropName,
          englishName,
          localName,
          seasonUUID,
          cropsCategoryUUID,
          id,
          fruitId,
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
        if (!payload.fruitUUID) {
          throw new Error("Invalid Fruit UUID");
        }
      }

      await context.prisma.fruitRetailPrice.createMany({
        data: payloads,
        skipDuplicates: false,
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "fruitRetailPrice",
          log: {
            fruitRetailPriceIds: payloads.map((data) => data.uuid),
          },
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      return "success";
    },
  },
  FruitRetailPrice: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    Fruit: async (self, params, context) => {
      if (self.fruitUUID) {
        const found = await context.prisma.cropsFruit.findMany({
          where: {
            uuid: self.fruitUUID,
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
  "FRUIT CODE": "fruitId",
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
