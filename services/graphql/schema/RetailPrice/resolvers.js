const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const mime = require("mime");
const shelljs = require("shelljs");
const lodash = require("lodash");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;
const FlexSearch = require("flexsearch");

const resolvers = {
  Query: {
    allRetailPrices: async (self, params, context) => {
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
      if (!role || !role.privileges.includes("Retail Price Livestock:Read")) {
        return [];
      }

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }
      const queryResult = await context.prisma.retailPrice.findMany({
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
    tokenizedAllRetailPrices: async (self, params, context) => {
      assertValidSession(context.activeSession);
      let user = await context.prisma.user.findMany({
        where: {
          uuid: context.activeSession.User.userId,
        },
      });

      if (!user || user.length === 0) {
        return "";
      }

      // if (user.uuid !== "__ROOT__") {
      //   let role = await context.prisma.userRoles.findUnique({
      //     where: {
      //       uuid: user.userRoleId,
      //     },
      //   });
      //   if (!role || !role.privileges.includes("Retail Price Livestock:Read")) {
      //     return "";
      //   }
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

      for (const filtered of searchQuery) {
        if (filtered.id === "LivestockCommodity.name") {
          const commodity = await context.prisma.livestockCommodity.findMany({
            where: {
              name: {
                contains: filtered.value,
              },
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
          });
          filterQuery = {
            ...filterQuery,
            livestockCommodityUUID: {
              in: commodity.map((f) => f.uuid),
            },
          };
        }

        if (filtered.id === "LivestockCommodityDetail.name") {
          let commodityUUIDs = [];
          if (
            filterQuery.livestockCommodityDetailUUID &&
            filterQuery.livestockCommodityUUID.in.length > 0
          ) {
            commodityUUIDs = filterQuery.livestockCommodityUUID.in;
          }

          let q = {};
          if (commodityUUIDs.length > 0) {
            q = {
              livestockCommodityUUID: {
                in: commodityUUIDs,
              },
            };
          }
          const commodityDetail =
            await context.prisma.LivestockCommodityDetail.findMany({
              where: {
                name: {
                  contains: filtered.value,
                },
                ...q,
                ...NOT_DELETED_DOCUMENT_QUERY,
              },
            });
          filterQuery = {
            ...filterQuery,
            livestockCommodityDetailUUID: {
              in: commodityDetail.map((f) => f.uuid),
            },
          };
        }
      }

      let queryResult = await context.prisma.retailPrice.findMany({
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

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
          month: q.monthYear ? dayjs(q.monthYear).format("MMMM") : 0,
          year: q.monthYear ? dayjs(q.monthYear).format("YYYY") : 0,
        };
      });

      let farmLocationUUIDs = queryResult
        .filter((q) => q.farmLocationUUID)
        .map((q) => q.farmLocationUUID);
      farmLocationUUIDs = lodash.uniq(farmLocationUUIDs);
      const farmLocation = await context.prisma.farmLocation.findMany({
        where: {
          uuid: {
            in: farmLocationUUIDs,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedFarmLocation = farmLocation.reduce((all, loc) => {
        if (!all[loc.uuid]) {
          all[loc.uuid] = {};
        }
        all[loc.uuid] = {
          ...loc,
          id: loc.id.toString(),
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

      let livestockCommodityUUIDs = queryResult
        .filter((qr) => qr.livestockCommodityUUID)
        .map((q) => q.livestockCommodityUUID);
      livestockCommodityUUIDs = lodash.uniq(livestockCommodityUUIDs);

      const livestockCommodity =
        await context.prisma.livestockCommodity.findMany({
          where: {
            uuid: {
              in: livestockCommodityUUIDs,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedLivestockCommodity = livestockCommodity.reduce(
        (all, com) => {
          if (!all[com.uuid]) {
            all[com.uuid] = {};
          }
          all[com.uuid] = {
            ...com,
            id: com.id.toString(),
          };
          return all;
        },
        {}
      );

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          LivestockCommodity: indexedLivestockCommodity[
            q.livestockCommodityUUID
          ]
            ? indexedLivestockCommodity[q.livestockCommodityUUID]
            : {},
        };
      });

      let livestockCommodityDetailUUIDs = queryResult
        .filter((qr) => qr.livestockCommodityDetailUUID)
        .map((q) => q.livestockCommodityDetailUUID);
      livestockCommodityDetailUUIDs = lodash.uniq(
        livestockCommodityDetailUUIDs
      );

      const livestockCommodityDetail =
        await context.prisma.livestockCommodityDetail.findMany({
          where: {
            uuid: {
              in: livestockCommodityDetailUUIDs,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedLivestockCommodityDetail = livestockCommodityDetail.reduce(
        (all, cat) => {
          if (!all[cat.uuid]) {
            all[cat.uuid] = {};
          }
          all[cat.uuid] = {
            ...cat,
            id: cat.id.toString(),
          };
          return all;
        },
        {}
      );

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          LivestockCommodityDetail: indexedLivestockCommodityDetail[
            q.livestockCommodityDetailUUID
          ]
            ? indexedLivestockCommodityDetail[q.livestockCommodityDetailUUID]
            : {},
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    countAllRetailPrices: async (self, params, context) => {
      assertValidSession(context.activeSession);
      // let user = await context.prisma.user.findUnique({
      //   where: {
      //     uuid: context.activeSession.User.userId,
      //   },
      // });

      // if (!user) {
      //   return "";
      // }

      // if (user.uuid !== "__ROOT__") {
      //   let role = await context.prisma.userRoles.findUnique({
      //     where: {
      //       uuid: user.userRoleId,
      //     },
      //   });
      //   if (!role || !role.privileges.includes("Retail Price Livestock:Read")) {
      //     return "";
      //   }
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

      for (const filtered of searchQuery) {
        if (filtered.id === "LivestockCommodity.name") {
          const commodity = await context.prisma.livestockCommodity.findMany({
            where: {
              name: {
                contains: filtered.value,
              },
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
          });
          filterQuery = {
            ...filterQuery,
            livestockCommodityUUID: {
              in: commodity.map((f) => f.uuid),
            },
          };
        }

        if (filtered.id === "LivestockCommodityDetail.name") {
          let commodityUUIDs = [];
          if (
            filterQuery.livestockCommodityDetailUUID &&
            filterQuery.livestockCommodityUUID.in.length > 0
          ) {
            commodityUUIDs = filterQuery.livestockCommodityUUID.in;
          }

          let q = {};
          if (commodityUUIDs.length > 0) {
            q = {
              livestockCommodityUUID: {
                in: commodityUUIDs,
              },
            };
          }
          const commodityDetail =
            await context.prisma.LivestockCommodityDetail.findMany({
              where: {
                name: {
                  contains: filtered.value,
                },
                ...q,
                ...NOT_DELETED_DOCUMENT_QUERY,
              },
            });
          filterQuery = {
            ...filterQuery,
            livestockCommodityDetailUUID: {
              in: commodityDetail.map((f) => f.uuid),
            },
          };
        }
      }

      let queryResult = await context.prisma.retailPrice.count({
        where: {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      return queryResult;
      // queryResult = queryResult.map((q) => {
      //   let id = BigInt(q.id);
      //   return {
      //     ...q,
      //     id: id.toString(),
      //     month: q.monthYear ? dayjs(q.monthYear).format("MMMM") : 0,
      //     year: q.monthYear ? dayjs(q.monthYear).format("YYYY") : 0,
      //   };
      // });

      // const farmLocation = await context.prisma.farmLocation.findMany({
      //   where: {
      //     uuid: {
      //       in: queryResult.map((q) => q.farmLocationUUID),
      //     },
      //     ...NOT_DELETED_DOCUMENT_QUERY,
      //   },
      // });

      // const indexedFarmLocation = farmLocation.reduce((all, loc) => {
      //   if (!all[loc.uuid]) {
      //     all[loc.uuid] = {};
      //   }
      //   all[loc.uuid] = {
      //     ...loc,
      //     id: loc.id.toString(),
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

      // const livestockCommodity =
      //   await context.prisma.livestockCommodity.findMany({
      //     where: {
      //       uuid: {
      //         in: queryResult.map((q) => q.livestockCommodityUUID),
      //       },
      //       ...NOT_DELETED_DOCUMENT_QUERY,
      //     },
      //   });

      // const indexedLivestockCommodity = livestockCommodity.reduce(
      //   (all, com) => {
      //     if (!all[com.uuid]) {
      //       all[com.uuid] = {};
      //     }
      //     all[com.uuid] = {
      //       ...com,
      //       id: com.id.toString(),
      //     };
      //     return all;
      //   },
      //   {}
      // );

      // queryResult = queryResult.map((q) => {
      //   return {
      //     ...q,
      //     LivestockCommodity: indexedLivestockCommodity[
      //       q.livestockCommodityUUID
      //     ]
      //       ? indexedLivestockCommodity[q.livestockCommodityUUID]
      //       : {},
      //   };
      // });

      // const livestockCommodityDetail =
      //   await context.prisma.livestockCommodityDetail.findMany({
      //     where: {
      //       uuid: {
      //         in: queryResult.map((q) => q.livestockCommodityDetailUUID),
      //       },
      //       ...NOT_DELETED_DOCUMENT_QUERY,
      //     },
      //   });

      // const indexedLivestockCommodityDetail = livestockCommodityDetail.reduce(
      //   (all, cat) => {
      //     if (!all[cat.uuid]) {
      //       all[cat.uuid] = {};
      //     }
      //     all[cat.uuid] = {
      //       ...cat,
      //       id: cat.id.toString(),
      //     };
      //     return all;
      //   },
      //   {}
      // );

      // queryResult = queryResult.map((q) => {
      //   return {
      //     ...q,
      //     LivestockCommodityDetail: indexedLivestockCommodityDetail[
      //       q.livestockCommodityDetailUUID
      //     ]
      //       ? indexedLivestockCommodityDetail[q.livestockCommodityDetailUUID]
      //       : {},
      //   };
      // });

      // const payload = {
      //   queryResult,
      // };

      // let token = jwt.sign(payload, TOKENIZE);
      // return token;
    },
  },
  Mutation: {
    createRetailPrice: async (self, params, context) => {
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

      await context.prisma.retailPrice.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "retailPrice",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateRetailPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.retailPrice.update({
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
          tableName: "retailPrice",
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
    deleteRetailPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData = await context.prisma.retailPrice.findUnique({
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

      await context.prisma.retailPrice.update({
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
          tableName: "retailPrice",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportLivestockRetailPrice: async (self, params, context) => {
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
      let arraysFilter = [];
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
        // arraysFilter.push({ monthYear: params.monthYear });
      }

      if (params.livestockCommodityUUID) {
        arraysFilter.push({
          livestockCommodityUUID: {
            in: [params.livestockCommodityUUID],
          },
        });
      }

      if (params.livestockCommodityDetailUUID) {
        arraysFilter.push({
          livestockCommodityDetailUUID: {
            in: [params.livestockCommodityDetailUUID],
          },
        });
      }

      if (arraysFilter.length !== 0) {
        filterQuery = {
          ...filterQuery,
          OR: arraysFilter,
        };
      }

      const retailPrices = await context.prisma.retailPrice.findMany({
        where: {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      const livestockCommodities =
        await context.prisma.livestockCommodity.findMany({
          where: {
            uuid: {
              in: retailPrices.map((ret) => ret.livestockCommodityUUID),
            },
          },
        });

      const indexedLivestockCommodity = livestockCommodities.reduce(
        (all, com) => {
          if (!all[com.uuid]) {
            all[com.uuid] = {};
          }
          all[com.uuid] = com;
          return all;
        },
        {}
      );

      const livestockCommodityDetails =
        await context.prisma.livestockCommodityDetail.findMany({
          where: {
            uuid: {
              in: retailPrices.map((ret) => ret.livestockCommodityDetailUUID),
            },
          },
        });

      const indexedLivestockCommodityDetails = livestockCommodityDetails.reduce(
        (all, com) => {
          if (!all[com.uuid]) {
            all[com.uuid] = {};
          }
          all[com.uuid] = com;
          return all;
        },
        {}
      );

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let sheetData = workbook.addWorksheet("Livestock Retail Price");

      const headerRow = [
        "Year",
        "Month",
        "Commodity",
        "Sub Commodity",
        "Brunei Muara Price ($)",
        "Tutong Price ($)",
        "Belait Price ($)",
        "Temburong Price ($)",
      ];

      let columnWidths = [];
      for (let c = 0; c < headerRow.length; c++) {
        columnWidths.push(15);
      }
      let colCounter = 0;
      columnWidths.forEach((width, index) => {
        const column = ++colCounter;
        excelHelper.setColumnWidth({
          sheet: sheetData,
          column,
          width,
        });
      });

      colCounter = 0;
      headerRow.forEach((data) => {
        excelHelper.addText({
          sheet: sheetData,
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

      colCounter = 0;
      let rowCounter = 2;

      for (const price of retailPrices) {
        const commodity =
          indexedLivestockCommodity[price.livestockCommodityUUID];
        const commodityDetail =
          indexedLivestockCommodityDetails[price.livestockCommodityDetailUUID];

        excelHelper.addText({
          sheet: sheetData,
          row: rowCounter,
          col: ++colCounter,
          value: dayjs(price.monthYear).format("YYYY"),
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          borderStyle: excelHelper.BorderStyle.Thin,
        });

        excelHelper.addText({
          sheet: sheetData,
          row: rowCounter,
          col: ++colCounter,
          value: dayjs(price.monthYear).format("MMMM"),
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          borderStyle: excelHelper.BorderStyle.Thin,
        });

        excelHelper.addText({
          sheet: sheetData,
          row: rowCounter,
          col: ++colCounter,
          value: commodity?.name || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          borderStyle: excelHelper.BorderStyle.Thin,
        });

        excelHelper.addText({
          sheet: sheetData,
          row: rowCounter,
          col: ++colCounter,
          value: commodityDetail?.name || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          borderStyle: excelHelper.BorderStyle.Thin,
        });

        excelHelper.addText({
          sheet: sheetData,
          row: rowCounter,
          col: ++colCounter,
          value: price?.bruneiMuaraPrice || 0,
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          borderStyle: excelHelper.BorderStyle.Thin,
        });

        excelHelper.addText({
          sheet: sheetData,
          row: rowCounter,
          col: ++colCounter,
          value: price?.tutongPrice || 0,
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          borderStyle: excelHelper.BorderStyle.Thin,
        });

        excelHelper.addText({
          sheet: sheetData,
          row: rowCounter,
          col: ++colCounter,
          value: price?.belaitPrice || 0,
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          borderStyle: excelHelper.BorderStyle.Thin,
        });

        excelHelper.addText({
          sheet: sheetData,
          row: rowCounter,
          col: ++colCounter,
          value: price?.temburongPrice || 0,
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          borderStyle: excelHelper.BorderStyle.Thin,
        });

        colCounter = 0;
        rowCounter++;
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

      // const filename = `livestock-retail-price.xlsx`;
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
    tokenizedCreateRetailPrice: async (self, params, context) => {
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

      let { iat, listCommodityDetails, name, detailName, unit, ...payload } =
        tokenized;

      if (!payload.livestockCommodityUUID) {
        throw new Error("Invalid Livestock Commodity");
      }

      if (!payload.livestockCommodityDetailUUID) {
        throw new Error("Invalid Livestock Commodity Detail");
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

      await context.prisma.retailPrice.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "retailPrice",
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
    tokenizedUpdateRetailPrice: async (self, params, context) => {
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
        LivestockCommodity,
        LivestockCommodityDetail,
        unit,
        farmLocationId,
        month,
        year,
        listCommodityDetails,
        ...payload
      } = tokenized;

      if (!payload.livestockCommodityUUID) {
        throw new Error("Invalid Livestock Commodity");
      }

      if (!payload.livestockCommodityDetailUUID) {
        throw new Error("Invalid Livestock Commodity Detail");
      }

      await context.prisma.retailPrice.update({
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
          tableName: "retailPrice",
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
    tokenizedDeleteRetailPrice: async (self, params, context) => {
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

      let getDeletedData = await context.prisma.retailPrice.findUnique({
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

      await context.prisma.retailPrice.update({
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
          tableName: "retailPrice",
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
    importRetailPriceLivestock: async (self, params, context) => {
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

      const saveFileDir = process.cwd() + "/public/livestock_retail_price";

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
        worksheet = workbook.getWorksheet("Livestock Retail Price");
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

      const listCommodity = await context.prisma.livestockCommodity.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      const indexedCommodity = listCommodity.reduce((all, com) => {
        if (!all[com.uuid]) {
          all[com.uuid] = {};
        }
        all[com.uuid] = com;
        return all;
      }, {});

      let listCommodityDetails =
        await context.prisma.livestockCommodityDetail.findMany({
          where: {
            livestockCommodityUUID: {
              in: listCommodity.map((com) => com.uuid),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      listCommodityDetails = listCommodityDetails.map((det) => {
        return {
          ...det,
          commodityName: indexedCommodity[det.livestockCommodityUUID].name,
        };
      });

      let fixedData = [];
      for (const newData of data) {
        let newImportData = {
          monthYear: `${params.year}-${
            params.month > 9 ? params.month : "0" + params.month
          }`,
          ...mapImporKeys(newData),
        };

        const foundCommodity = listCommodity.find(
          (com) =>
            com.name.toUpperCase().trim() ===
            newImportData.name.toUpperCase().trim()
        );
        if (!foundCommodity) {
          throw new Error(`Commodity ${newImportData.name} not found!`);
        }

        const foundCommodityDetails = listCommodityDetails.find(
          (det) =>
            det.name.toUpperCase().trim() ===
              newImportData.subName.toUpperCase().trim() &&
            det.commodityName.toUpperCase().trim() ===
              newImportData.name.toUpperCase().trim()
        );

        if (!foundCommodityDetails) {
          throw new Error(`Sub Commodity ${newImportData.subName} not found!`);
        }

        fixedData.push({
          uuid: uuidv4(),
          monthYear: newImportData.monthYear,
          livestockCommodityUUID: foundCommodity.uuid,
          livestockCommodityDetailUUID: foundCommodityDetails.uuid,

          bruneiMuaraPrice: parseFloat(newImportData.bruneiMuaraPrice || 0),
          tutongPrice: parseFloat(newImportData.tutongPrice || 0),
          belaitPrice: parseFloat(newImportData.belaitPrice || 0),
          temburongPrice: parseFloat(newImportData.temburongPrice || 0),

          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: "",
          createdBy: context.activeSession.User,
          updatedBy: context.activeSession.User,
          deletedBy: {},
        });
      }

      for (const importPayload of fixedData) {
        const total =
          importPayload.bruneiMuaraPrice +
          importPayload.tutongPrice +
          importPayload.belaitPrice +
          importPayload.temburongPrice;

        if (total === 0) continue;

        await context.prisma.retailPrice.create({
          data: {
            ...importPayload,
          },
        });

        await context.prisma.activityLogs.create({
          data: {
            uuid: uuidv4(),
            type: "CREATE",
            tableName: "retailPrice",
            log: {
              ...importPayload,
            },
          },
        });
      }

      return "ok";
    },
    tokenizedCheckDuplicateRetailPrice: async (self, params, context) => {
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

      let { iat, listCommodityDetails, name, detailName, unit, ...payload } =
        tokenized;

      if (!payload.livestockCommodityUUID) {
        throw new Error("Invalid Livestock Commodity");
      }

      if (!payload.livestockCommodityDetailUUID) {
        throw new Error("Invalid Livestock Commodity Detail");
      }

      const foundDuplicate = await context.prisma.retailPrice.findMany({
        where: {
          livestockCommodityUUID: payload.livestockCommodityUUID,
          livestockCommodityDetailUUID: payload.livestockCommodityDetailUUID,
          monthYear: payload.monthYear,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      if (foundDuplicate.length > 0) {
        throw new Error(`Duplicate Record on ${payload.monthYear}`);
      }
      return "ok";
    },
    tokenizedCreateManyRetailPrice: async (self, params, context) => {
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
        const { listCommodityDetails, name, detailName, unit, ...payload } =
          data;
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
        if (!payload.livestockCommodityUUID) {
          throw new Error("Invalid Livestock Commodity");
        }

        if (!payload.livestockCommodityDetailUUID) {
          throw new Error("Invalid Livestock Commodity Detail");
        }
      }

      await context.prisma.retailPrice.createMany({
        data: payloads,
        skipDuplicates: false,
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "retailPrice",
          log: {
            retailPriceIds: payloads.map((pay) => pay.uuid),
          },
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      return "success";
    },
    generateRetailPriceLivestock: async (self, params, context) => {
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
      let livestockCommodities =
        await context.prisma.livestockCommodity.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            name: "asc",
          },
        });

      const livestockCommodityUUID = livestockCommodities.map(
        (com) => com.uuid
      );

      const livestockCommodityDetails =
        await context.prisma.livestockCommodityDetail.findMany({
          where: {
            livestockCommodityUUID: {
              in: livestockCommodityUUID,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      let indexedCommodity = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "uuid",
          field: ["uuid"],
        },
      });
      indexedCommodity.add(livestockCommodities);

      const units = await context.prisma.unit.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "asc",
        },
      });

      let indexedUnit = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "uuid",
          field: ["uuid"],
        },
      });
      indexedUnit.add(units);

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let retailSheet = workbook.addWorksheet("Livestock Retail Price");

      let columnWidths = [30, 30, 30, 30, 30, 30, 30];

      let headerRow = [
        "LIVESTOCK COMMODITY NAME",
        "SUB LIVESTOCK COMMODITY NAME",
        "UNIT",
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

      for (const det of livestockCommodityDetails) {
        const foundCommodity = indexedCommodity.find({
          uuid: det.livestockCommodityUUID,
        });
        const foundUnit = indexedUnit.find({
          uuid: det.unitUUID,
        });
        excelHelper.addText({
          sheet: retailSheet,
          row: rowCounter,
          col: ++colCounter,
          value: foundCommodity?.name || "",
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
          value: det?.name || "",
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
          value: foundUnit?.name || "",
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
      // const filename = `livestock_retail_price_template.xlsx`;
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

      // return fileUrl;
    },
  },
  RetailPrice: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    month: (self) =>
      self.monthYear ? dayjs(self.monthYear).format("MMMM") : 0,
    year: (self) => (self.monthYear ? dayjs(self.monthYear).format("YYYY") : 0),
    FarmLocation: async (self, params, context) => {
      const result = await context.prisma.farmLocation.findUnique({
        where: {
          uuid: self.farmLocationUUID,
        },
      });

      return result;
    },
    LivestockCommodity: async (self, params, context) => {
      if (self.livestockCommodityUUID) {
        const found = await context.prisma.livestockCommodity.findUnique({
          where: {
            uuid: self.livestockCommodityUUID,
          },
        });
        return found;
      }
      return null;
    },
    LivestockCommodityDetail: async (self, params, context) => {
      if (self.livestockCommodityDetailUUID) {
        let queryResult =
          await context.prisma.livestockCommodityDetail.findUnique({
            where: {
              uuid: self.livestockCommodityDetailUUID,
            },
          });

        return queryResult;
      }
      return null;
    },
  },
};
exports.resolvers = resolvers;

const importKeyMap = {
  "LIVESTOCK COMMODITY NAME": "name",
  "SUB LIVESTOCK COMMODITY NAME": "subName",
  "BRUNEI MUARA RETAIL PRICE": "bruneiMuaraPrice",
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
