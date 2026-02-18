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
const resolvers = {
  Query: {
    allBroilers: async (self, params, context) => {
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
      if (!role || !role.privileges.includes("Broiler:Read")) {
        return [];
      }

      let filterQuery = {};

      if (params.monthYear) {
        let startDate = new Date(
          dayjs(params.monthYear).startOf("month").format("YYYY-MM-DD")
        );

        let endDate = new Date(
          dayjs(params.monthYear).endOf("month").format("YYYY-MM-DD")
        );

        filterQuery = {
          dateEntry: {
            gte: startDate,
            lte: endDate,
          },
        };
      }

      const queryResult = await context.prisma.broiler.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
          ...filterQuery,
        },
        orderBy: {
          id: "desc",
        },
      });
      return queryResult;
    },
    tokenizedAllBroilers: async (self, params, context) => {
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
      // if (!role || !role.privileges.includes("Broiler:Read")) {
      //   return [];
      // }

      let filterQuery = {};

      if (params.monthYear) {
        let startDate = new Date(
          dayjs(params.monthYear).startOf("month").format("YYYY-MM-DD")
        );

        let endDate = new Date(
          dayjs(params.monthYear).endOf("month").format("YYYY-MM-DD")
        );

        filterQuery = {
          dateEntry: {
            gte: startDate,
            lte: endDate,
          },
        };
      }

      let profileQuery = {};
      let farmerProfileQuery = [];
      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
        //   icPassportNo: context.activeSession.User.icNo,
        // };

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

      let queryResult = [];

      if (
        farmerProfileQuery &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        queryResult = await context.prisma.broiler.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
            ...filterQuery,
            farmerUUID: {
              in: farmerProfileQuery.map((profile) => profile.uuid),
            },
          },
          orderBy: {
            id: "desc",
          },
          skip: params.pageIndex * params.pageSize,
          take: params.pageSize,
        });
      } else {
        let searchQuery = [];
        if (params.filters) {
          searchQuery = JSON.parse(params.filters);
        }

        let filteredFarmAreaId = [];
        for (const filtered of searchQuery) {
          if (filtered.id === "farmerCompanyName") {
            const farmerProfile = await context.prisma.farmerProfile.findMany({
              where: {
                farmerCompanyName: {
                  contains: filtered.value,
                },
                ...NOT_DELETED_DOCUMENT_QUERY,
              },
            });
            filterQuery = {
              ...filterQuery,
              farmerUUID: {
                in: farmerProfile.map((f) => f.uuid),
              },
            };
          } else if (filtered.id === "farmProfileArea") {
            const area = await context.prisma.farmProfile.findMany({
              where: {
                farmArea: {
                  contains: filtered.value,
                },
              },
            });
            filteredFarmAreaId.push(...area.map((ar) => ar.uuid));
          } else if (filtered.id === "farmProfileFarmId") {
            const area = await context.prisma.farmProfile.findMany({
              where: {
                farmId: {
                  contains: filtered.value,
                },
              },
            });
            filteredFarmAreaId.push(...area.map((ar) => ar.uuid));
          } else if (filtered.id === "poultryHouseNo") {
            const poultryHouse = await context.prisma.poultryHouse.findMany({
              where: {
                houseNo: {
                  contains: filtered.value,
                },
              },
            });
            filterQuery = {
              ...filterQuery,
              poultryHouseId: {
                in: poultryHouse.map((f) => f.uuid),
              },
            };
          }
        }

        if (filteredFarmAreaId.length > 0) {
          filteredFarmAreaId = lodash.uniq(filteredFarmAreaId);

          filterQuery = {
            ...filterQuery,
            farmAreaId: {
              in: filteredFarmAreaId,
            },
          };
        }

        queryResult = await context.prisma.broiler.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
            ...filterQuery,
          },
          orderBy: {
            id: "desc",
          },
          skip: params.pageIndex * params.pageSize,
          take: params.pageSize,
        });
      }

      let farmerUUIDs = queryResult
        .filter((q) => q.farmerUUID)
        .map((q) => q.farmerUUID);
      farmerUUIDs = lodash.uniq(farmerUUIDs);
      const farmerProfile = await context.prisma.farmerProfile.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
          uuid: {
            in: farmerUUIDs,
          },
        },
        orderBy: {
          id: "desc",
        },
      });

      const indexedFarmerProfile = farmerProfile.reduce((all, prof) => {
        if (!all[prof.uuid]) {
          all[prof.uuid] = {};
        }
        all[prof.uuid] = prof;
        return all;
      }, {});

      const farmProfiles = await context.prisma.farmProfile.findMany({
        where: {
          uuid: {
            in: lodash.uniq(queryResult.map((q) => q.farmAreaId)),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        select: {
          uuid: true,
          farmId: true,
        },
      });

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        const farmProfile = farmProfiles.find((f) => f.uuid === q.farmAreaId);
        return {
          ...q,
          farmProfileFarmId: farmProfile?.farmId || "-",
          farmerCompanyName: indexedFarmerProfile[q.farmerUUID]
            ? indexedFarmerProfile[q.farmerUUID].farmerCompanyName
            : "",
          id: id.toString(),
          dateEntry: dayjs(q.dateEntry).format("YYYY-MM-DD"),
          productionDate: dayjs(q.productionDate).format("YYYY-MM-DD"),
          Mortality: q.mortalityObject,
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    countAllBroilers: async (self, params, context) => {
      assertValidSession(context.activeSession);
      let filterQuery = {};

      if (params.monthYear) {
        let startDate = new Date(
          dayjs(params.monthYear).startOf("month").format("YYYY-MM-DD")
        );

        let endDate = new Date(
          dayjs(params.monthYear).endOf("month").format("YYYY-MM-DD")
        );

        filterQuery = {
          dateEntry: {
            gte: startDate,
            lte: endDate,
          },
        };
      }

      let profileQuery = {};
      let farmerProfileQuery = [];
      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
        //   icPassportNo: context.activeSession.User.icNo,
        // };
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

      let queryResult = [];

      if (
        farmerProfileQuery &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        queryResult = await context.prisma.broiler.count({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
            ...filterQuery,
            farmerUUID: {
              in: farmerProfileQuery.map((profile) => profile.uuid),
            },
          },
          orderBy: {
            id: "desc",
          },
        });
      } else {
        let searchQuery = [];
        if (params.filters) {
          searchQuery = JSON.parse(params.filters);
        }
        let filteredFarmAreaId = [];
        for (const filtered of searchQuery) {
          if (filtered.id === "farmerCompanyName") {
            const farmerProfile = await context.prisma.farmerProfile.findMany({
              where: {
                farmerCompanyName: {
                  contains: filtered.value,
                },
                ...NOT_DELETED_DOCUMENT_QUERY,
              },
            });
            filterQuery = {
              ...filterQuery,
              farmerUUID: {
                in: farmerProfile.map((f) => f.uuid),
              },
            };
          } else if (filtered.id === "farmProfileArea") {
            const area = await context.prisma.farmProfile.findMany({
              where: {
                farmArea: {
                  contains: filtered.value,
                },
              },
            });
            filteredFarmAreaId.push(...area.map((ar) => ar.uuid));
          } else if (filtered.id === "farmProfileFarmId") {
            const area = await context.prisma.farmProfile.findMany({
              where: {
                farmId: {
                  contains: filtered.value,
                },
              },
            });
            filteredFarmAreaId.push(...area.map((ar) => ar.uuid));
          } else if (filtered.id === "poultryHouseNo") {
            const poultryHouse = await context.prisma.poultryHouse.findMany({
              where: {
                houseNo: {
                  contains: filtered.value,
                },
              },
            });
            filterQuery = {
              ...filterQuery,
              poultryHouseId: {
                in: poultryHouse.map((f) => f.uuid),
              },
            };
          }
        }

        if (filteredFarmAreaId.length > 0) {
          filteredFarmAreaId = lodash.uniq(filteredFarmAreaId);

          filterQuery = {
            ...filterQuery,
            farmAreaId: {
              in: filteredFarmAreaId,
            },
          };
        }

        queryResult = await context.prisma.broiler.count({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
            ...filterQuery,
          },
          orderBy: {
            id: "desc",
          },
        });
      }

      return queryResult;

      // queryResult = queryResult.map((q) => {
      //   let id = BigInt(q.id);
      //   return {
      //     ...q,
      //     id: id.toString(),
      //     dateEntry: dayjs(queryResult.dateEntry).format("YYYY-MM-DD"),
      //     productionDate: dayjs(queryResult.productionDate).format(
      //       "YYYY-MM-DD"
      //     ),
      //     Mortality: q.mortalityObject,
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
    createBroiler: async (self, params, context) => {
      assertValidSession(context.activeSession);
      let payload = params;

      if (payload.dateEntry) {
        payload.dateEntry = new Date(params.dateEntry);
      }

      if (payload.productionDate) {
        payload.productionDate = new Date(params.productionDate);
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

      await context.prisma.broiler.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "broiler",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateBroiler: async (self, params, context) => {
      assertValidSession(context.activeSession);
      let payload = params;

      if (payload.dateEntry) {
        payload.dateEntry = new Date(params.dateEntry);
      }

      if (payload.productionDate) {
        payload.productionDate = new Date(params.productionDate);
      }

      await context.prisma.broiler.update({
        where: {
          uuid: params.uuid,
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
          tableName: "broiler",
          log: {
            uuid: params.uuid,
            ...payload,
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
    deleteBroiler: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData = await context.prisma.broiler.findUnique({
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

      await context.prisma.broiler.update({
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
          tableName: "broiler",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportBroilerExcel: async (self, params, context) => {
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
        let startDate = new Date(
          dayjs(params.monthYear).startOf("month").format("YYYY-MM-DD")
        );

        let endDate = new Date(
          dayjs(params.monthYear).endOf("month").format("YYYY-MM-DD")
        );

        filterQuery = {
          dateEntry: {
            gte: startDate,
            lte: endDate,
          },
        };
        // arraysFilter.push({ monthYear: params.monthYear });
      }

      if (params.farmerUUID) {
        // filterQuery = {
        //   ...filterQuery,
        //   farmerUUID: {
        //     in: [params.farmerUUID],
        //   },
        // };
        arraysFilter.push({
          farmerUUID: {
            in: [params.farmerUUID],
          },
        });
      }

      let farmAreaIdArray = [];
      if (params.farmAreaId) {
        const getOneFarmArea = await context.prisma.farmProfile.findUnique({
          where: {
            uuid: params.farmAreaId,
          },
        });

        const getRelatedFarmArea = await context.prisma.farmProfile.findMany({
          where: {
            farmArea: {
              in: [getOneFarmArea.farmArea],
            },
          },
        });

        farmAreaIdArray = getRelatedFarmArea.map((g) => g.uuid);
      }

      if (farmAreaIdArray.length > 0) {
        farmAreaIdArray = lodash.uniq(farmAreaIdArray);
        // filterQuery = {
        //   ...filterQuery,
        //   farmAreaId: {
        //     in: farmAreaIdArray,
        //   },
        // };
        arraysFilter.push({
          farmAreaId: {
            in: farmAreaIdArray,
          },
        });
      }

      if (arraysFilter.length !== 0) {
        filterQuery = {
          ...filterQuery,
          OR: arraysFilter,
        };
      }

      let profileQuery = {};
      let farmerProfileQuery = [];
      let allBroilers = [];
      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
        //   icPassportNo: context.activeSession.User.icNo,
        // };
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

      if (
        farmerProfileQuery &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        allBroilers = await context.prisma.broiler.findMany({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
            farmerUUID: {
              in: farmerProfileQuery.map((prof) => prof.uuid),
            },
          },
          orderBy: {
            id: "desc",
          },
        });
      } else {
        allBroilers = await context.prisma.broiler.findMany({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      }

      allBroilers = allBroilers.filter(
        (bro) => bro.farmerUUID && bro.farmAreaId && bro.poultryHouseId
      );

      let farmerProfile = await context.prisma.farmerProfile.findMany({
        where: {
          uuid: {
            in: lodash.uniq(allBroilers.map((ret) => ret.farmerUUID)),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      const indexedProfile = farmerProfile.reduce((all, profile) => {
        if (!all[profile.uuid]) {
          all[profile.uuid] = {};
        }
        all[profile.uuid] = profile;
        return all;
      }, {});

      let farmProfile = await context.prisma.farmProfile.findMany({
        where: {
          uuid: {
            in: lodash.uniq(allBroilers.map((ret) => ret.farmAreaId)),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      const indexedFarmProfile = farmProfile.reduce((all, profile) => {
        if (!all[profile.uuid]) {
          all[profile.uuid] = {};
        }
        all[profile.uuid] = profile;
        return all;
      }, {});

      const poultryHouse = await context.prisma.poultryHouse.findMany({
        where: {
          uuid: {
            in: lodash.uniq(allBroilers.map((ret) => ret.poultryHouseId)),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      const indexedPoultryHouse = poultryHouse.reduce((all, profile) => {
        if (!all[profile.uuid]) {
          all[profile.uuid] = {};
        }
        all[profile.uuid] = profile;
        return all;
      }, {});

      let mortalityDays = [];

      if (allBroilers.length > 0) {
        mortalityDays = allBroilers.map((b) => {
          // return b.mortalityObject.listMortalities.length;
          return b.mortalityObject.length;
        });
      } else {
        mortalityDays.push(60);
      }

      mortalityDays = Math.max(...mortalityDays);
      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let sheetData = workbook.addWorksheet("Broiler");

      let headerRow = [
        "Date of Entry",
        "Company Name",
        "Farm Area",
        "House No",
        "Cycle No",
        "No of DOC Entry",
        "DOC Source",
        "Chiken Breed",
        "Feed Source",
        "Mortality by Age (Day)",
      ];

      let columnWidths = [];
      for (let c = 0; c < headerRow.length; c++) {
        columnWidths.push(20);
      }

      let colCounter = 0;
      columnWidths.forEach((width, index) => {
        const column = ++colCounter;
        excelHelper.setColumnWidth({
          sheet: sheetData,
          column,
          width: index !== 8 ? width : 10,
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

        if (data !== "Mortality by Age (Day)") {
          sheetData.mergeCells(1, colCounter, 2, colCounter);
        } else {
          sheetData.mergeCells(
            1,
            colCounter,
            1,
            mortalityDays + (colCounter - 1)
          );
        }
      });

      let headerMortalityColumns = [];
      for (let i = 1; i <= mortalityDays; i++) {
        headerMortalityColumns.push(`Day ${i}`);
      }

      colCounter = colCounter - 1;
      headerMortalityColumns.forEach((data) => {
        excelHelper.addText({
          sheet: sheetData,
          row: 2,
          col: ++colCounter,
          value: data,
          font: { bold: true },
          alignment: {
            vertical: "middle",
            horizontal: "center",
          },
          borderStyle: excelHelper.BorderStyle.Thin,
        });
      });

      const endHeaderRow = ["Total", "Brolier Production"];
      endHeaderRow.forEach((data) => {
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

        sheetData.mergeCells(1, colCounter, 2, colCounter);
      });

      colCounter = 0;
      let rowCounter = 3;
      for (let broiler of allBroilers) {
        const poultryHouse = indexedPoultryHouse[broiler.poultryHouseId];
        const farmerProfile = indexedProfile[broiler.farmerUUID];
        const farmProfile = indexedFarmProfile[broiler.farmAreaId];

        excelHelper.addText({
          sheet: sheetData,
          row: rowCounter,
          col: ++colCounter,
          value: broiler?.dateEntry || "",
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
          value: farmerProfile?.farmerCompanyName || "",
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
          value: farmProfile?.farmArea || "",
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
          value: poultryHouse?.houseNo || "",
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
          value: broiler?.cycleNo || "",
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
          value: broiler?.noDocEntry || "",
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
          value: broiler?.docSource || "",
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
          value: broiler?.chickenBreed || "",
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
          value: broiler?.feedSource || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          borderStyle: excelHelper.BorderStyle.Thin,
        });
        broiler.mortalityObject.forEach((mortal) => {
          excelHelper.addText({
            sheet: sheetData,
            row: rowCounter,
            col: ++colCounter,
            value: mortal.total || 0,
            alignment: {
              vertical: "middle",
              horizontal: "left",
            },
            borderStyle: excelHelper.BorderStyle.Thin,
          });
        });

        excelHelper.addText({
          sheet: sheetData,
          row: rowCounter,
          col: ++colCounter,
          value: broiler?.total || 0,
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
          value: broiler?.production || 0,
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          borderStyle: excelHelper.BorderStyle.Thin,
        });

        rowCounter++;
        colCounter = 0;
      }

      // Write to buffer instead of file
      const buffer = await workbook.xlsx.writeBuffer();

      // Convert buffer to base64
      // const base64 = buffer.toString("base64");

      return buffer;
      // const PREFIX = "DoAA";

      // if (!fs.existsSync(process.cwd() + "/static/cache/")) {
      //   fs.mkdirSync(process.cwd() + "/static/cache/");
      // }
      // if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
      //   fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
      // }
      // const filename = `broiler.xlsx`;
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
      // // throw new Error("error")
      // return fileUrl;
    },

    tokenizedCreateBroiler: async (self, params, context) => {
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

      const { iat, ...payloads } = tokenized;

      if (!payloads.farmerUUID) {
        throw new Error("Please fill the company name fields");
      }

      if (!payloads.farmAreaId) {
        throw new Error("Invalid Farm Area");
      }

      if (!payloads.poultryHouseId) {
        throw new Error("Invalid Poultry House");
      }

      let payload = payloads;

      if (payload.dateEntry) {
        payload.dateEntry = new Date(payloads.dateEntry);
      }

      if (payload.productionDate) {
        payload.productionDate = new Date(payloads.productionDate);
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

      await context.prisma.broiler.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "broiler",
          log: {
            ...createPayload,
          },
          userId: context.activeSession.User.uuid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      return "success";
    },
    tokenizedUpdateBroiler: async (self, params, context) => {
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
        updatedBy,
        updatedAt,
        deletedAt,
        deletedBy,
        Mortality,
        FarmerProfile,
        farmProfileFarmId,
        ...payloads
      } = tokenized;

      if (!payloads.farmerUUID) {
        throw new Error("Please fill the company name fields");
      }
      if (!payloads.farmAreaId) {
        throw new Error("Invalid Farm Area");
      }

      if (!payloads.poultryHouseId) {
        throw new Error("Invalid Poultry House");
      }

      let payload = payloads;

      if (payload.dateEntry === "Invalid Date") {
        delete payload.dateEntry;
      }
      if (payload.dateEntry) {
        payload.dateEntry = new Date(payloads.dateEntry);
      }

      if (payload.productionDate === "Invalid Date") {
        delete payload.productionDate;
      }

      if (payload.productionDate) {
        payload.productionDate = new Date(payloads.productionDate);
      }

      await context.prisma.broiler.update({
        where: {
          uuid: payloads.uuid,
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
          tableName: "broiler",
          log: {
            uuid: payloads.uuid,
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
    tokenizedDeleteBroiler: async (self, params, context) => {
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

      const { iat, ...payloads } = tokenized;

      let getDeletedData = await context.prisma.broiler.findUnique({
        where: {
          uuid: payloads.uuid,
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

      await context.prisma.broiler.update({
        where: {
          uuid: payloads.uuid,
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
          tableName: "broiler",
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
  Broilers: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    dateEntry: (self) => dayjs(self.dateEntry).format("YYYY-MM-DD"),
    productionDate: (self) => dayjs(self.productionDate).format("YYYY-MM-DD"),
    Mortality: (self) => self.mortalityObject,
  },
};
exports.resolvers = resolvers;
