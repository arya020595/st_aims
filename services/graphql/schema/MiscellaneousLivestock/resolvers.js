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
    allMiscellaneousLivestocks: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("Miscellaneous Livestock:Read")) {
        return [];
      }

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }
      let queryResult = await context.prisma.miscellaneousLivestock.findMany({
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
    tokenizedAllMiscellaneousLivestocks: async (self, params, context) => {
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

      // if (!role || !role.privileges.includes("Miscellaneous Livestock:Read")) {
      //   return [];
      // }

      let filterQuery = {};
      let profileQuery = {};
      let farmerProfileQuery = [];
      let queryResult = [];
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }

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
        queryResult = await context.prisma.miscellaneousLivestock.findMany({
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
          } else if (filtered.id === "district") {
            const area = await context.prisma.farmProfile.findMany({
              where: {
                farmDistrict: {
                  contains: filtered.value,
                },
              },
            });
            filteredFarmAreaId.push(...area.map((ar) => ar.uuid));
          } else if (filtered.id === "mukim") {
            const area = await context.prisma.farmProfile.findMany({
              where: {
                farmMukim: {
                  contains: filtered.value,
                },
              },
            });
            filteredFarmAreaId.push(...area.map((ar) => ar.uuid));
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

        queryResult = await context.prisma.miscellaneousLivestock.findMany({
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
      }

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
          id: id.toString(),
          farmProfileFarmId: farmProfile?.farmId || "-",
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    countMiscellaneousLivestocks: async (self, params, context) => {
      assertValidSession(context.activeSession);
      let filterQuery = {};
      let profileQuery = {};
      let farmerProfileQuery = [];
      let queryResult = [];
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }

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
        queryResult = await context.prisma.miscellaneousLivestock.count({
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
          } else if (filtered.id === "district") {
            const area = await context.prisma.farmProfile.findMany({
              where: {
                farmDistrict: {
                  contains: filtered.value,
                },
              },
            });
            filteredFarmAreaId.push(...area.map((ar) => ar.uuid));
          } else if (filtered.id === "mukim") {
            const area = await context.prisma.farmProfile.findMany({
              where: {
                farmMukim: {
                  contains: filtered.value,
                },
              },
            });
            filteredFarmAreaId.push(...area.map((ar) => ar.uuid));
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

        queryResult = await context.prisma.miscellaneousLivestock.count({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
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
    createMiscellaneousLivestock: async (self, params, context) => {
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

      await context.prisma.miscellaneousLivestock.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "miscellaneousLivestock",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateMiscellaneousLivestock: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.miscellaneousLivestock.update({
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
          tableName: "miscellaneousLivestock",
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
    deleteMiscellaneousLivestock: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData =
        await context.prisma.miscellaneousLivestock.findUnique({
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
      await context.prisma.miscellaneousLivestock.update({
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
          tableName: "miscellaneousLivestock",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportMiscellaneousLivestock: async (self, params, context) => {
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

      if (params.district) {
        arraysFilter.push({
          district: {
            in: [params.district],
          },
        });
      }
      if (params.mukim) {
        arraysFilter.push({
          mukim: {
            in: [params.mukim],
          },
        });
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

      let farmerProfileQuery = [];
      let allMiscellaneousLivestocks = [];
      let profileQuery = {};
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
        allMiscellaneousLivestocks =
          await context.prisma.miscellaneousLivestock.findMany({
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
        allMiscellaneousLivestocks =
          await context.prisma.miscellaneousLivestock.findMany({
            where: {
              ...filterQuery,
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
            orderBy: {
              id: "desc",
            },
          });
      }

      allMiscellaneousLivestocks = allMiscellaneousLivestocks.filter(
        (miss) => miss.farmerUUID && miss.farmAreaId
      );

      let farmerProfile = await context.prisma.farmerProfile.findMany({
        where: {
          uuid: {
            in: lodash.uniq(
              allMiscellaneousLivestocks.map((ret) => ret.farmerUUID)
            ),
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
            in: lodash.uniq(
              allMiscellaneousLivestocks.map((ret) => ret.farmAreaId)
            ),
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

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";

      let sheetData = workbook.addWorksheet("Miscellaneous Livstock");

      let headerRow = [
        "Month Year",
        "Company Name",
        "Farm Area",
        "District",
        "Mukim",
      ];
      let headerUnggas = ["Ayam Kampung", "Itik", "Puyuh", "Patu", "Angsa"];

      for (let i = 0; i < 2; i++) {
        if (i === 0) {
          headerRow = [
            ...headerRow,
            ...headerUnggas.map((h) => "Type (Birds)"),
          ];
        } else {
          headerRow = [...headerRow, ...headerUnggas.map((h) => "Type (Eggs)")];
        }
      }

      let columnWidths = [];
      for (let c = 0; c < headerRow.length; c++) {
        columnWidths.push(15);
      }

      let colCounter = 0;

      columnWidths.forEach((width, index) => {
        const getRow = headerRow[index];

        const column = ++colCounter;
        excelHelper.setColumnWidth({
          sheet: sheetData,
          column,
          width:
            getRow === "Type (Birds)" || getRow === "Type (Eggs)" ? 10 : width,
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

        if (data !== "Type (Birds)" && data !== "Type (Eggs)") {
          sheetData.mergeCells(1, colCounter, 2, colCounter);
        }
      });

      colCounter = 5;
      for (let i = 0; i < 2; i++) {
        headerUnggas.forEach((data) => {
          excelHelper.addText({
            sheet: sheetData,
            row: 2,
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

        if (i === 0) {
          sheetData.mergeCells(
            1,
            headerUnggas.length + 1,
            1,
            headerUnggas.length + 5
          );
        } else {
          sheetData.mergeCells(1, colCounter - 4, 1, colCounter);
        }
      }

      const endHeaderRow = ["Total"];
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
      for (const stock of allMiscellaneousLivestocks) {
        const farmerProfile = indexedProfile[stock.farmerUUID];
        const farmProfile = indexedFarmProfile[stock.farmAreaId];

        excelHelper.addText({
          sheet: sheetData,
          row: rowCounter,
          col: ++colCounter,
          value: stock?.monthYear || "",
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
          value: stock?.district || "",
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
          value: stock?.mukim || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          borderStyle: excelHelper.BorderStyle.Thin,
        });

        //####### BIRDS ######//
        excelHelper.addText({
          sheet: sheetData,
          row: rowCounter,
          col: ++colCounter,
          value: stock?.totalAyamKampungBirds || "",
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
          value: stock?.totalItikBirds || "",
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
          value: stock?.totalPuyuhBirds || "",
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
          value: stock?.totalPatuBirds || "",
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
          value: stock?.totalAngsaBirds || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          borderStyle: excelHelper.BorderStyle.Thin,
        });

        //####### EGGS ######//
        excelHelper.addText({
          sheet: sheetData,
          row: rowCounter,
          col: ++colCounter,
          value: stock?.totalAyamKampungEggs || "",
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
          value: stock?.totalItikEggs || "",
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
          value: stock?.totalPuyuhEggs || "",
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
          value: stock?.totalPatuEggs || "",
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
          value: stock?.totalAngsaEggs || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          borderStyle: excelHelper.BorderStyle.Thin,
        });

        //###########################################

        let total = 0;
        for (const key of Object.keys(stock)) {
          if (
            key === "totalAyamKampungBirds" ||
            key === "totalAyamKampungEggs" ||
            key === "totalItikBirds" ||
            key === "totalItikEggs" ||
            key === "totalPuyuhBirds" ||
            key === "totalPuyuhEggs" ||
            key === "totalPatuBirds" ||
            key === "totalPatuEggs" ||
            key === "totalAngsaBirds" ||
            key === "totalAngsaEggs"
          ) {
            if (stock[key]) {
              total += stock[key];
            }
          }
        }

        excelHelper.addText({
          sheet: sheetData,
          row: rowCounter,
          col: ++colCounter,
          value: total,
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
      const base64 = buffer.toString("base64");

      return base64;
      // const PREFIX = "DoAA";

      // if (!fs.existsSync(process.cwd() + "/static/cache/")) {
      //   fs.mkdirSync(process.cwd() + "/static/cache/");
      // }
      // if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
      //   fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
      // }

      // const filename = `miscellaneous-stock.xlsx`;
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
    tokenizedCreateMiscellaneousLivestock: async (self, params, context) => {
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

      const { iat, total, ...payload } = tokenized;

      if (!payload.farmerUUID) {
        throw new Error("Invalid Farmer");
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

      await context.prisma.miscellaneousLivestock.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "miscellaneousLivestock",
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
    tokenizedUpdateMiscellaneousLivestock: async (self, params, context) => {
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
        FarmerProfile,
        total,
        farmProfileFarmId,
        ...payload
      } = tokenized;

      await context.prisma.miscellaneousLivestock.update({
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
          tableName: "miscellaneousLivestock",
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
    tokenizedDeleteMiscellaneousLivestock: async (self, params, context) => {
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
        await context.prisma.miscellaneousLivestock.findUnique({
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
      await context.prisma.miscellaneousLivestock.update({
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
          tableName: "miscellaneousLivestock",
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
  MiscellaneousLivestock: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
  },
};
exports.resolvers = resolvers;
