const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const mime = require("mime");
const shelljs = require("shelljs");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const TOKENIZE = process.env.TOKENIZE;

const resolvers = {
  Query: {
    allVegetableRetailPrices: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("Vegetable Retail Price:Read")) {
        return [];
      }

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }
      let queryResult = await context.prisma.vegetableRetailPrice.findMany({
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
    tokenizedAllVegetableRetailPrices: async (self, params, context) => {
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

      // if (!role || !role.privileges.includes("Vegetable Retail Price:Read")) {
      //   return [];
      // }

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }
      let searchQuery = [];
      if (params.filters) {
        searchQuery = JSON.parse(params.filters);
      }

      let filteredVegetableUUIDs = [];
      for (const filtered of searchQuery) {
        if (filtered.id === "Vegetable.vegetableId") {
          const cropsVegetable = await context.prisma.cropsVegetable.findMany({
            where: {
              vegetableId: {
                contains: filtered.value,
              },
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
          });

          filteredVegetableUUIDs.push(...cropsVegetable.map((c) => c.uuid));
        } else if (filtered.id === "Vegetable.localName") {
          const cropsVegetable = await context.prisma.cropsVegetable.findMany({
            where: {
              localName: {
                contains: filtered.value,
              },
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
          });
          filteredVegetableUUIDs.push(...cropsVegetable.map((c) => c.uuid));
        }
      }

      if (filteredVegetableUUIDs.length > 0) {
        filteredVegetableUUIDs = lodash.uniq(filteredVegetableUUIDs);
        filterQuery = {
          ...filterQuery,
          vegetableUUID: {
            in: filteredVegetableUUIDs,
          },
        };
      }

      let queryResult = await context.prisma.vegetableRetailPrice.findMany({
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

      let vegetableUUIDs = queryResult
        .filter((qr) => qr.vegetableUUID)
        .map((q) => q.vegetableUUID);
      vegetableUUIDs = lodash.uniq(vegetableUUIDs);

      const cropsVegetable = await context.prisma.cropsVegetable.findMany({
        where: {
          uuid: {
            in: vegetableUUIDs,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedCropsVegetable = cropsVegetable.reduce((all, prof) => {
        if (!all[prof.uuid]) {
          all[prof.uuid] = {};
        }
        all[prof.uuid] = {
          ...prof,
          id: prof.id.toString(),
        };
        return all;
      }, {});

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          Vegetable: indexedCropsVegetable[q.vegetableUUID]
            ? indexedCropsVegetable[q.vegetableUUID]
            : {},
        };
      });

      let filterFarmLocationUUID = queryResult
        .map((q) => q.farmLocationUUID)
        .filter((ret) => ret);

      filterFarmLocationUUID = lodash.uniq(filterFarmLocationUUID);

      const farmLocation = await context.prisma.farmLocation.findMany({
        where: {
          uuid: {
            in: filterFarmLocationUUID,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedFarmLocation = farmLocation.reduce((all, farm) => {
        if (!all[farm.uuid]) {
          all[farm.uuid] = {};
        }
        all[farm.uuid] = {
          ...farm,
          id: farm.id.toString(),
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

    countAllVegetableRetailPrices: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }
      let queryResult = await context.prisma.vegetableRetailPrice.count({
        where: {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      return queryResult;

      // const cropsVegetable = await context.prisma.cropsVegetable.findMany({
      //   where: {
      //     uuid: {
      //       in: queryResult.map((q) => q.vegetableUUID),
      //     },
      //     ...NOT_DELETED_DOCUMENT_QUERY,
      //   },
      // });

      // const indexedCropsVegetable = cropsVegetable.reduce((all, prof) => {
      //   if (!all[prof.uuid]) {
      //     all[prof.uuid] = {};
      //   }
      //   all[prof.uuid] = {
      //     ...prof,
      //     id: prof.id.toString(),
      //   };
      //   return all;
      // }, {});

      // queryResult = queryResult.map((q) => {
      //   return {
      //     ...q,
      //     Vegetable: indexedCropsVegetable[q.vegetableUUID]
      //       ? indexedCropsVegetable[q.vegetableUUID]
      //       : {},
      //   };
      // });

      // const filterFarmLocationUUID = queryResult
      //   .map((q) => q.farmLocationUUID)
      //   .filter((ret) => ret);

      // const farmLocation = await context.prisma.farmLocation.findMany({
      //   where: {
      //     uuid: {
      //       in: filterFarmLocationUUID,
      //     },
      //     ...NOT_DELETED_DOCUMENT_QUERY,
      //   },
      // });

      // const indexedFarmLocation = farmLocation.reduce((all, farm) => {
      //   if (!all[farm.uuid]) {
      //     all[farm.uuid] = {};
      //   }
      //   all[farm.uuid] = {
      //     ...farm,
      //     id: farm.id.toString(),
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
    createVegetableRetailPrice: async (self, params, context) => {
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

      await context.prisma.vegetableRetailPrice.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "vegetableRetailPrice",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateVegetableRetailPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.vegetableRetailPrice.update({
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
          tableName: "vegetableRetailPrice",
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
    deleteVegetableRetailPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData = await context.prisma.vegetableRetailPrice.findUnique(
        {
          where: {
            uuid: params.uuid,
          },
        }
      );
      getDeletedData = {
        ...getDeletedData,
        id: getDeletedData.id.toString(),
        deletedAt: new Date().toISOString(),
        deletedBy: {
          uuid: context.activeSession.User.uuid,
          username: context.activeSession.User.employeeId,
        },
      };

      await context.prisma.vegetableRetailPrice.update({
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
          tableName: "vegetableRetailPrice",
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
    importVegetableRetailPrice: async (self, params, context) => {
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
      // assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      // ==================================================================================
      // ================================================= GRAB THEN SAVE

      const saveFileDir = process.cwd() + "/public/vegetable_retail_price";

      if (!fs.existsSync(saveFileDir)) {
        fs.mkdirSync(saveFileDir);
      }

      const ContentType = base64MimeType(params.excelBase64);
      const fileId = uuidv4();
      const filename = params.fileName;

      // const filename = `${params.fileName}.` + "zip"

      const buf = Buffer.from(params.excelBase64.split("base64,")[1], "base64");
      const type = params.excelBase64.split(";")[0].split("/")[1];
      fs.writeFileSync(saveFileDir + "/" + filename, buf);

      // ==================================================================================
      // ================================================= LOAD XLSX FILE
      let workbook = new Excel.Workbook();
      await workbook.xlsx.readFile(saveFileDir + "/" + filename);

      let worksheet = workbook.getWorksheet("Template");
      if (!worksheet) {
        worksheet = workbook.getWorksheet("Sheet1");
      }
      if (!worksheet) {
        worksheet = workbook.getWorksheet("Vegetable Retail Price");
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

      let listVegetables = await context.prisma.cropsVegetable.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      listVegetables = listVegetables.map((list) => {
        return {
          uuid: list.uuid,
          vegetableId: list.vegetableId,
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
        const foundVegetable = listVegetables.filter(
          (v) => v.vegetableId === newImporTradeData.vegetableId
        );

        if (foundVegetable.length === 0) {
          throw new Error(
            `Vegetable code with ${newImporTradeData.vegetableId} not found in Vegetable master data`
          );
        }

        if (foundVegetable.length > 1) {
          throw new Error(
            `Duplicate code ${newImporTradeData.vegetableId} in Vegetable master data`
          );
        }

        newImporTradeData["vegetableUUID"] = foundVegetable[0].uuid;

        delete newImporTradeData.vegetableId;
        delete newImporTradeData["VEGETABLE NAME"];
        await context.prisma.vegetableRetailPrice.create({
          data: {
            ...newImporTradeData,
          },
        });

        await context.prisma.activityLogs.create({
          data: {
            uuid: uuidv4(),
            type: "CREATE",
            tableName: "vegetableRetailPrice",
            log: {
              ...newImporTradeData,
            },
          },
        });
      }

      return "ok";
    },
    exportVegetableRetailPrice: async (self, params, context) => {
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
      let retailPrices = await context.prisma.vegetableRetailPrice.findMany({
        where: {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      let vegetables = await context.prisma.cropsVegetable.findMany({
        where: {
          uuid: {
            in: retailPrices.map((ret) => ret.vegetableUUID),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedVegetable = vegetables.reduce((all, veg) => {
        if (!all[veg.uuid]) {
          all[veg.uuid] = {};
        }
        all[veg.uuid] = veg;
        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let retailSheet = workbook.addWorksheet("Vegetable Retail Price");

      let columnWidths = [30, 30, 30, 30, 30];

      let headerRow = [
        "VEGETABLE CODE",
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
        const vegetable = indexedVegetable[price.vegetableUUID];
        excelHelper.addText({
          sheet: retailSheet,
          row: rowCounter,
          col: ++colCounter,
          value: vegetable?.vegetableId || "",
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
      // const filename = `vegetable_retail_price.xlsx`;
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
    tokenizedCreateVegetableRetailPrice: async (self, params, context) => {
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
        CropsCategory,
        cropName,
        englishName,
        localName,
        cropsCategoryUUID,
        id,
        vegetableId,
        ...payload
      } = tokenized;

      if (!payload.vegetableUUID) {
        throw new Error("Invalid Vegetabel UUID");
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

      await context.prisma.vegetableRetailPrice.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "vegetableRetailPrice",
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
    tokenizedUpdateVegetableRetailPrice: async (self, params, context) => {
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
        Vegetable,
        englishName,
        vegetableId,
        localName,
        ...payload
      } = tokenized;

      if (!payload.vegetableUUID) {
        throw new Error("Invalid Vegetable UUID");
      }

      await context.prisma.vegetableRetailPrice.update({
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
          tableName: "vegetableRetailPrice",
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
    tokenizedDeleteVegetableRetailPrice: async (self, params, context) => {
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

      let getDeletedData = await context.prisma.vegetableRetailPrice.findUnique(
        {
          where: {
            uuid: payload.uuid,
          },
        }
      );
      getDeletedData = {
        ...getDeletedData,
        id: getDeletedData.id.toString(),
        deletedAt: new Date().toISOString(),
        deletedBy: {
          uuid: context.activeSession.User.uuid,
          username: context.activeSession.User.employeeId,
        },
      };

      await context.prisma.vegetableRetailPrice.update({
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
          tableName: "vegetableRetailPrice",
          log: {
            ...params,
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
    generateVegetableRetailPriceTemplate: async (self, params, context) => {
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
      let vegetables = await context.prisma.cropsVegetable.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          localName: "asc",
        },
      });

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let retailSheet = workbook.addWorksheet("Vegetable Retail Price");

      let columnWidths = [30, 30, 30, 30, 30, 30];

      let headerRow = [
        "VEGETABLE CODE",
        "VEGETABLE NAME",
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

      for (const veg of vegetables) {
        excelHelper.addText({
          sheet: retailSheet,
          row: rowCounter,
          col: ++colCounter,
          value: veg?.vegetableId || "",
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
          value: veg?.localName || "",
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
      // const filename = `vegetable_retail_price_template.xlsx`;
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
    tokenizedCreateManyVegetableRetailPrice: async (self, params, context) => {
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
          CropsCategory,
          cropName,
          englishName,
          localName,
          cropsCategoryUUID,
          id,
          vegetableId,
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
        if (!payload.vegetableUUID) {
          throw new Error("Invalid Vegetabel UUID");
        }
      }

      await context.prisma.vegetableRetailPrice.createMany({
        data: payloads,
        skipDuplicates: false,
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "vegetableRetailPrice",
          log: {
            vegetableRetailPriceIds: payloads.map((data) => data.uuid),
          },
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      return "success";
    },
  },
  VegetableRetailPrice: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    Vegetable: async (self, params, context) => {
      if (self.vegetableUUID) {
        const found = await context.prisma.cropsVegetable.findMany({
          where: {
            uuid: self.vegetableUUID,
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
  "VEGETABLE CODE": "vegetableId",
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
