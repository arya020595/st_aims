const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const { filter } = require("lodash");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;
const lodash = require("lodash");

const resolvers = {
  Query: {
    allMilledRiceProductions: async (self, params, context) => {
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
      if (!role || !role.privileges.includes("Milled Rice Production:Read")) {
        return [];
      }

      let queryFilter = {
        ...NOT_DELETED_DOCUMENT_QUERY,
      };
      let filterQuery = {};

      if (params.monthYear) {
        let startDate = dayjs(params.monthYear)
          .startOf("month")
          .format("YYYY-MM-DD");

        let endDate = dayjs(params.monthYear)
          .endOf("month")
          .format("YYYY-MM-DD");

        filterQuery = {
          date: {
            gte: startDate,
            lte: endDate,
          },
        };
      }

      if (context.activeSession.User && context.activeSession.User.uuid) {
        queryFilter = {
          inputByUserUUID: context.activeSession.User.userId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        };
      }
      if (
        context.activeSession.User.userId &&
        context.activeSession.User.userId === "__ROOT__"
      ) {
        queryFilter = {
          ...NOT_DELETED_DOCUMENT_QUERY,
        };
      }

      let queryResult = await context.prisma.milledRiceProduction.findMany({
        where: {
          ...queryFilter,
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      return queryResult;
    },
    tokenizedAllMilledRiceProductions: async (self, params, context) => {
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
      // if (!role || !role.privileges.includes("Milled Rice Production:Read")) {
      //   return [];
      // }

      let queryFilter = {
        ...NOT_DELETED_DOCUMENT_QUERY,
      };
      let filterQuery = {};

      if (params.monthYear) {
        let startDate = dayjs(params.monthYear)
          .startOf("month")
          .format("YYYY-MM-DD");

        let endDate = dayjs(params.monthYear)
          .endOf("month")
          .format("YYYY-MM-DD");

        filterQuery = {
          date: {
            gte: startDate,
            lte: endDate,
          },
        };
      }

      if (context.activeSession.User && context.activeSession.User.uuid) {
        queryFilter = {
          inputByUserUUID: context.activeSession.User.userId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        };
      }
      if (
        context.activeSession.User.userId &&
        context.activeSession.User.userId === "__ROOT__"
      ) {
        queryFilter = {
          ...NOT_DELETED_DOCUMENT_QUERY,
        };
      }

      // let countMilledRiceProductions = await context.prisma.milledRiceProduction.findMany({
      //   where: {
      //     ...queryFilter,
      //     ...filterQuery,
      //     ...NOT_DELETED_DOCUMENT_QUERY,
      //   },
      //   orderBy: {
      //     id: "desc",
      //   },
      // })

      // countMilledRiceProductions = countMilledRiceProductions.length

      // const pages = Math.ceil(countMilledRiceProductions / params.pageSize)

      let searchQuery = [];
      if (params.filters) {
        searchQuery = JSON.parse(params.filters);
      }

      let productionUUIDs = [];
      for (const filtered of searchQuery) {
        if (filtered.id === "Paddy.varietyName") {
          const variety = await context.prisma.cropsPaddyVariety.findMany({
            where: {
              varietyName: {
                contains: filtered.value,
              },
            },
          });
          filterQuery = {
            ...filterQuery,
            cropsPaddyVarietyUUID: {
              in: variety.map((fr) => fr.uuid),
            },
          };
        } else if (filtered.id === "store") {
          const res = await context.prisma.milledRiceProduction.findMany({
            where: {
              store: {
                contains: filtered.value,
              },
            },
          });
          productionUUIDs.push(...res.map((r) => r.uuid));
        } else if (filtered.id === "batchNumber") {
          const res = await context.prisma.milledRiceProduction.findMany({
            where: {
              batchNumber: {
                contains: filtered.value,
              },
            },
          });
          productionUUIDs.push(...res.map((r) => r.uuid));
        } else if (filtered.id === "MilledRiceLocation.location") {
          const location = await context.prisma.milledRiceLocation.findMany({
            where: {
              location: {
                contains: filtered.value,
              },
            },
            orderBy: {
              id: "desc",
            },
          });

          filterQuery = {
            ...filterQuery,
            millingLocationUUID: {
              in: location.map((loc) => loc.uuid),
            },
          };
        }
      }

      if (productionUUIDs.length > 0) {
        productionUUIDs = lodash.uniq(productionUUIDs);
        filterQuery = {
          ...filterQuery,
          uuid: {
            in: productionUUIDs,
          },
        };
      }
      let queryResult = await context.prisma.milledRiceProduction.findMany({
        where: {
          ...queryFilter,
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
        skip: params.pageIndex * params.pageSize,
        take: params.pageSize,
      });

      let millingLocationUUIDs = queryResult.filter((q) => q.millingLocationUUID).map((q) => q.millingLocationUUID)
      millingLocationUUIDs = lodash.uniq(millingLocationUUIDs)

      const milledRiceLocation =
        await context.prisma.milledRiceLocation.findMany({
          where: {
            uuid: {
              in: millingLocationUUIDs,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedMilledRiceLocation = milledRiceLocation.reduce(
        (all, mill) => {
          if (!all[mill.uuid]) {
            all[mill.uuid] = {};
          }
          all[mill.uuid] = {
            ...mill,
            id: mill.id.toString(),
          };
          return all;
        },
        {}
      );

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          MilledRiceLocation: indexedMilledRiceLocation[q.millingLocationUUID]
            ? indexedMilledRiceLocation[q.millingLocationUUID]
            : {},
        };
      });


      let cropsPaddyVarietyUUIDs = queryResult.filter((q) => q.cropsPaddyVarietyUUID).map((q) => q.cropsPaddyVarietyUUID)
      cropsPaddyVarietyUUIDs = lodash.uniq(cropsPaddyVarietyUUIDs)
      const cropsPaddyVariety = await context.prisma.cropsPaddyVariety.findMany(
        {
          where: {
            uuid: {
              in: cropsPaddyVarietyUUIDs,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        }
      );

      const indexedCropsPaddyVariety = cropsPaddyVariety.reduce((all, prof) => {
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
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
          Paddy: indexedCropsPaddyVariety[q.cropsPaddyVarietyUUID]
            ? indexedCropsPaddyVariety[q.cropsPaddyVarietyUUID]
            : {},
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    countAllMilledRiceProductions: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let queryFilter = {
        ...NOT_DELETED_DOCUMENT_QUERY,
      };
      let filterQuery = {};

      if (params.monthYear) {
        let startDate = dayjs(params.monthYear)
          .startOf("month")
          .format("YYYY-MM-DD");

        let endDate = dayjs(params.monthYear)
          .endOf("month")
          .format("YYYY-MM-DD");

        filterQuery = {
          date: {
            gte: startDate,
            lte: endDate,
          },
        };
      }

      if (context.activeSession.User && context.activeSession.User.uuid) {
        queryFilter = {
          inputByUserUUID: context.activeSession.User.userId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        };
      }
      if (
        context.activeSession.User.userId &&
        context.activeSession.User.userId === "__ROOT__"
      ) {
        queryFilter = {
          ...NOT_DELETED_DOCUMENT_QUERY,
        };
      }

      let searchQuery = [];
      if (params.filters) {
        searchQuery = JSON.parse(params.filters);
      }

      let productionUUIDs = [];
      for (const filtered of searchQuery) {
        if (filtered.id === "Paddy.varietyName") {
          const variety = await context.prisma.cropsPaddyVariety.findMany({
            where: {
              varietyName: {
                contains: filtered.value,
              },
            },
          });
          filterQuery = {
            ...filterQuery,
            cropsPaddyVarietyUUID: {
              in: variety.map((fr) => fr.uuid),
            },
          };
        } else if (filtered.id === "store") {
          const res = await context.prisma.milledRiceProduction.findMany({
            where: {
              store: {
                contains: filtered.value,
              },
            },
          });
          productionUUIDs.push(...res.map((r) => r.uuid));
        } else if (filtered.id === "batchNumber") {
          const res = await context.prisma.milledRiceProduction.findMany({
            where: {
              batchNumber: {
                contains: filtered.value,
              },
            },
          });
          productionUUIDs.push(...res.map((r) => r.uuid));
        } else if (filtered.id === "MilledRiceLocation.location") {
          const location = await context.prisma.milledRiceLocation.findMany({
            where: {
              location: {
                contains: filtered.value,
              },
            },
            orderBy: {
              id: "desc",
            },
          });

          filterQuery = {
            ...filterQuery,
            millingLocationUUID: {
              in: location.map((loc) => loc.uuid),
            },
          };
        }
      }

      if (productionUUIDs.length > 0) {
        productionUUIDs = lodash.uniq(productionUUIDs);
        filterQuery = {
          ...filterQuery,
          uuid: {
            in: productionUUIDs,
          },
        };
      }

      let queryResult = await context.prisma.milledRiceProduction.count({
        where: {
          ...queryFilter,
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      return queryResult;

      // const milledRiceLocation =
      //   await context.prisma.milledRiceLocation.findMany({
      //     where: {
      //       uuid: {
      //         in: queryResult.map((q) => q.millingLocationUUID),
      //       },
      //       ...NOT_DELETED_DOCUMENT_QUERY,
      //     },
      //   });

      // const indexedMilledRiceLocation = milledRiceLocation.reduce(
      //   (all, mill) => {
      //     if (!all[mill.uuid]) {
      //       all[mill.uuid] = {};
      //     }
      //     all[mill.uuid] = {
      //       ...mill,
      //       id: mill.id.toString(),
      //     };
      //     return all;
      //   },
      //   {}
      // );

      // queryResult = queryResult.map((q) => {
      //   return {
      //     ...q,
      //     MilledRiceLocation: indexedMilledRiceLocation[q.millingLocationUUID]
      //       ? indexedMilledRiceLocation[q.millingLocationUUID]
      //       : {},
      //   };
      // });

      // const cropsPaddyVariety = await context.prisma.cropsPaddyVariety.findMany(
      //   {
      //     where: {
      //       uuid: {
      //         in: queryResult.map((q) => q.cropsPaddyVarietyUUID),
      //       },
      //       ...NOT_DELETED_DOCUMENT_QUERY,
      //     },
      //   }
      // );

      // const indexedCropsPaddyVariety = cropsPaddyVariety.reduce((all, prof) => {
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
      //   let id = BigInt(q.id);
      //   return {
      //     ...q,
      //     id: id.toString(),
      //     Paddy: indexedCropsPaddyVariety[q.cropsPaddyVarietyUUID]
      //       ? indexedCropsPaddyVariety[q.cropsPaddyVarietyUUID]
      //       : {},
      //   };
      // });

      // return queryResult.length || 0
    },
  },
  Mutation: {
    createMilledRiceProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let inputByUser = {};

      if (context.activeSession.User) {
        inputByUser = {
          inputByUserUUID: context.activeSession.User.userId,
        };
      }

      const newData = {
        uuid: uuidv4(),
        ...params,
        ...inputByUser,
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
      await context.prisma.milledRiceProduction.create({
        data: {
          ...newData,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "milledRiceProduction",
          log: {
            ...newData,
          },
        },
      });
      return newData.uuid;
    },
    updateMilledRiceProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.milledRiceProduction.update({
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
          tableName: "milledRiceProduction",
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
    deleteMilledRiceProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData = await context.prisma.milledRiceProduction.findUnique(
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

      await context.prisma.milledRiceProduction.update({
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
          tableName: "milledRiceProduction",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportMilledRiceProduction: async (self, params, context) => {
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
        let startDate = dayjs(params.monthYear)
          .startOf("month")
          .format("YYYY-MM-DD");

        let endDate = dayjs(params.monthYear)
          .endOf("month")
          .format("YYYY-MM-DD");

        filterQuery = {
          date: {
            gte: startDate,
            lte: endDate,
          },
        };
      }

      if (params.store) {
        arraysFilter.push({
          store: {
            // in: [params.store],
            contains: params.store,
          },
        });
      }

      if (params.batchNumber) {
        arraysFilter.push({
          batchNumber: {
            in: [params.batchNumber],
          },
        });
      }

      if (params.cropsPaddyVarietyUUID) {
        // filterQuery = {
        //   ...filterQuery,
        //   cropsPaddyVarietyUUID: params.cropsPaddyVarietyUUID,
        // };
        arraysFilter.push({
          cropsPaddyVarietyUUID: {
            in: [params.cropsPaddyVarietyUUID],
          },
        });
      }

      if (params.millingLocationUUID) {
        // filterQuery = {
        //   ...filterQuery,
        //   millingLocationUUID: params.millingLocationUUID,
        // };
        arraysFilter.push({
          millingLocationUUID: {
            in: [params.millingLocationUUID],
          },
        });
      }

      if (arraysFilter.length !== 0) {
        filterQuery = {
          ...filterQuery,
          OR: arraysFilter,
        };
      }

      let productions = await context.prisma.milledRiceProduction.findMany({
        where: {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      })

      let paddyVariety = await context.prisma.cropsPaddyVariety.findMany({
        where: {
          uuid: {
            in: productions.map((ret) => ret.cropsPaddyVarietyUUID),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      const indexedPaddy = paddyVariety.reduce((all, pad) => {
        if (!all[pad.uuid]) {
          all[pad.uuid] = {};
        }
        all[pad.uuid] = pad;
        return all;
      }, {});

      let millingLocation = await context.prisma.milledRiceLocation.findMany({
        where: {
          uuid: {
            in: productions.map((ret) => ret.millingLocationUUID),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      const indexedMilling = millingLocation.reduce((all, milling) => {
        if (!all[milling.uuid]) {
          all[milling.uuid] = {};
        }
        all[milling.uuid] = milling;
        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Milled Rice Production");

      let headerRow = [
        "PLANTING MONTH & YEAR",
        "PADDY VARIETY",
        "STORE",
        "MILLING LOCATION",
        "BATCH NO",
        "NO OF SACKS",
        "KG/SACKS (PADDY)",
        "TOTAL PADDY (KG)",
        "NO OF SACKS (BROKEN RICE)",
        "KG/SACKS (BROKEN RICE)",
        "TOTAL BROKEN RICE (KG)",
        "TOTAL VALUE BROKEN RICE",
        "NO OF SACKS (HEAD RICE)",
        "KG/SACKS HEAD RICE",
        "TOTAL HEAD RICE (KG)",
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

      for (const prod of productions) {
        const paddyVariety = indexedPaddy[prod.cropsPaddyVarietyUUID];
        const millingLocation = indexedMilling[prod.millingLocationUUID];

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: prod?.date || "",
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
          value: prod?.store || "",
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
          value: millingLocation?.location || "",
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
          value: prod?.batchNumber || "",
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
          value: prod?.paddyNoOfSacks || 0,
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
          value: prod?.paddyKgSacks || 0,
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
          value: prod.totalPaddy || 0,
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
          value: prod.brokenRiceNoOfSacks || 0,
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
          value: prod.brokenRiceKgSacks || 0,
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
          value: prod.totalBrokenRice || 0,
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
          value: prod.brokenRiceTotalValue || 0,
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
          value: prod.headRiceNoOfSacks || 0,
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
          value: prod.headRiceKgSacks || 0,
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
          value: prod.totalHeadRice || 0,
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
      // const filename = `milled_rice_production.xlsx`;
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
    tokenizedCreateMilledRiceProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let userId = ""

      if (context.activeSession.User && context.activeSession.User.uuid) {
        userId = context.activeSession.User.uuid
      }

      if (!userId) {
        throw new Error("Invalid Session !!!")
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

      const { iat, record, ...payload } = tokenized;

      if (!payload.cropsPaddyVarietyUUID || !payload.millingLocationUUID) {
        throw new Error("Please fill the paddy variety and milling location fileds")
      }

      let inputByUser = {};

      if (context.activeSession.User) {
        inputByUser = {
          inputByUserUUID: context.activeSession.User.userId,
        };
      }

      const newData = {
        uuid: uuidv4(),
        ...payload,
        ...inputByUser,
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
      await context.prisma.milledRiceProduction.create({
        data: {
          ...newData,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "milledRiceProduction",
          log: {
            ...newData,
          },
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      return newData.uuid;
    },
    tokenizedUpdateMilledRiceProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let userId = ""

      if (context.activeSession.User && context.activeSession.User.uuid) {
        userId = context.activeSession.User.uuid
      }

      if (!userId) {
        throw new Error("Invalid Session !!!")
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
        Paddy,
        MilledRiceLocation,
        ...payload
      } = tokenized;

      if (!payload.cropsPaddyVarietyUUID || !payload.millingLocationUUID) {
        throw new Error("Please fill the paddy variety and milling location fileds")
      }

      await context.prisma.milledRiceProduction.update({
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
          tableName: "milledRiceProduction",
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
    tokenizedDeleteMilledRiceProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let userId = ""

      if (context.activeSession.User && context.activeSession.User.uuid) {
        userId = context.activeSession.User.uuid
      }

      if (!userId) {
        throw new Error("Invalid Session !!!")
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

      let getDeletedData = await context.prisma.milledRiceProduction.findUnique(
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

      await context.prisma.milledRiceProduction.update({
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
          tableName: "milledRiceProduction",
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
  MilledRiceProduction: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    MilledRiceLocation: async (self, params, context) => {
      if (self.millingLocationUUID) {
        const found = await context.prisma.milledRiceLocation.findUnique({
          where: {
            uuid: self.millingLocationUUID,
          },
        });

        return found;
      }
      return {};
    },
    Paddy: async (self, params, context) => {
      if (self.cropsPaddyVarietyUUID) {
        const found = await context.prisma.cropsPaddyVariety.findUnique({
          where: {
            uuid: self.cropsPaddyVarietyUUID,
          },
        });

        if (found) {
          return found;
        }
      }

      return {};
    },
  },
};
exports.resolvers = resolvers;
