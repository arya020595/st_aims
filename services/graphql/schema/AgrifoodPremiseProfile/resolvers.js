const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const { assertValidSession } = require("../../authentication");
const excelHelper = require("../../excel");
const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const TOKENIZE = process.env.TOKENIZE;
const resolvers = {
  Query: {
    allAgrifoodPremiseProfiles: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("Premise Profile:Read")) {
        return [];
      }

      let queryResult = await context.prisma.agrifoodPremiseProfile.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      return queryResult;
    },
    countAgrifoodPremiseProfiles: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let filterQuery = {};
      let searchQuery = [];
      if (params.filters) {
        searchQuery = JSON.parse(params.filters);
      }

      for (const filtered of searchQuery) {
        if (filtered.id === "premiseId") {
          filterQuery = {
            ...filterQuery,
            premiseId: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "companyName") {
          filterQuery = {
            ...filterQuery,
            companyName: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "ocbsRefNo") {
          filterQuery = {
            ...filterQuery,
            ocbsRefNo: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "premiseAddress") {
          filterQuery = {
            ...filterQuery,
            premiseAddress: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "farmMukim") {
          filterQuery = {
            ...filterQuery,
            farmMukim: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "farmArea") {
          filterQuery = {
            ...filterQuery,
            farmArea: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "farmCategory") {
          filterQuery = {
            ...filterQuery,
            farmCategory: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "expiryDate ") {
          filterQuery = {
            ...filterQuery,
            expiryDate: {
              contains: filtered.value,
            },
          };
        }
      }

      let queryResult = await context.prisma.agrifoodPremiseProfile.count({
        where: {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });
      return queryResult;
    },
    tokenizedAllAgrifoodPremiseProfiles: async (self, params, context) => {
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

      // if (!role || !role.privileges.includes("Premise Profile:Read")) {
      //   return [];
      // }

      let queryResult = await context.prisma.agrifoodPremiseProfile.findMany({
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

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    tokenizedAllAgrifoodPremiseProfilesPaginated: async (
      self,
      params,
      context
    ) => {
      let filterQuery = {};
      let searchQuery = [];
      if (params.filters) {
        searchQuery = JSON.parse(params.filters);
      }

      for (const filtered of searchQuery) {
        if (filtered.id === "premiseId") {
          filterQuery = {
            ...filterQuery,
            premiseId: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "companyName") {
          filterQuery = {
            ...filterQuery,
            companyName: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "ocbsRefNo") {
          filterQuery = {
            ...filterQuery,
            ocbsRefNo: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "premiseAddress") {
          filterQuery = {
            ...filterQuery,
            premiseAddress: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "farmMukim") {
          filterQuery = {
            ...filterQuery,
            farmMukim: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "farmArea") {
          filterQuery = {
            ...filterQuery,
            farmArea: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "farmCategory") {
          filterQuery = {
            ...filterQuery,
            farmCategory: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "expiryDate ") {
          filterQuery = {
            ...filterQuery,
            expiryDate: {
              contains: filtered.value,
            },
          };
        }
      }

      let profileQuery = {};

      if (
        context.activeSession.User &&
        context.activeSession.User.rocbnRegNo &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
        // };

        const profile = await context.prisma.agrifoodCompanyProfile.findMany({
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

        const companyProfile =
          await context.prisma.agrifoodCompanyProfile.findMany({
            where: {
              ...profileQuery,
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
            select: {
              id: true,
              uuid: true,
            },
          });
        filterQuery = {
          ...filterQuery,
          companyUUID: {
            in: companyProfile.map((c) => c.uuid),
          },
        };
      }

      let queryResult = await context.prisma.agrifoodPremiseProfile.findMany({
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
    createAgrifoodPremiseProfile: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let payload = params.input;

      for (let p of Object.keys(payload)) {
        if (p === "mobileNo" || p === "telephoneNo") {
          if (payload[p]) {
            payload[p] = BigInt(payload[p]);
          } else {
            payload[p] = BigInt(0n);
          }
        } else if (
          p === "unskilledLocal" ||
          p === "skilledLocal" ||
          p === "expertForeigner" ||
          p === "expertLocal" ||
          p === "semiSkilledLocal" ||
          p === "semiSkilledForeigner" ||
          p === "noOfLabourTotal" ||
          p === "noOfLabourForeigner" ||
          p === "unskilledForeigner" ||
          p === "skilledForeigner"
        ) {
          if (!payload[p] || payload[p] === 0) {
            payload[p] = 0;
          }
        } else {
          if (p !== "companyRegDate" && p !== "dateOfBirth") {
            if (!payload[p]) {
              payload[p] = "";
            }
          } else if (p === "companyRegDate" || p === "dateOfBirth") {
            if (payload[p]) {
              payload[p] = new Date(payload[p]);
            }
          }
        }
      }

      let latestNumber = await context.prisma.profileIdGenerator.findMany({
        where: {
          menu: "Agrifood Premise Profile",
        },
        take: 1,
      });

      let counter = 0;
      if (latestNumber.length === 0) {
        counter = 1;
        await context.prisma.profileIdGenerator.create({
          data: {
            uuid: uuidv4(),
            counter: 1,
            menu: "Agrifood Premise Profile",
          },
        });
      } else {
        counter = latestNumber[0].counter + 1;
        await context.prisma.profileIdGenerator.update({
          where: {
            uuid: latestNumber[0].uuid,
          },
          data: {
            counter,
          },
        });
      }

      let startCode = payload.PREFIX;
      const dataLength = "" + counter;
      const last = dataLength.length * -1;
      startCode = startCode.slice(0, last) + counter;
      if (!payload.premiseId) {
        payload.premiseId = "";
      }
      payload.premiseId = startCode;

      delete payload.PREFIX;

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

      await context.prisma.agrifoodPremiseProfile.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "agrifoodPremiseProfile",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateAgrifoodPremiseProfile: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let payload = params.input;

      for (let p of Object.keys(payload)) {
        if (p === "mobileNo" || p === "telephoneNo") {
          if (payload[p]) {
            payload[p] = BigInt(payload[p]);
          } else {
            payload[p] = BigInt(0n);
          }
        } else if (
          p === "unskilledLocal" ||
          p === "skilledLocal" ||
          p === "expertForeigner" ||
          p === "expertLocal" ||
          p === "semiSkilledLocal" ||
          p === "semiSkilledForeigner" ||
          p === "noOfLabourTotal" ||
          p === "noOfLabourForeigner" ||
          p === "unskilledForeigner" ||
          p === "skilledForeigner"
        ) {
          if (!payload[p] || payload[p] === 0) {
            payload[p] = 0;
          }
        } else {
          if (p !== "companyRegDate" && p !== "dateOfBirth") {
            if (!payload[p]) {
              payload[p] = "";
            }
          } else if (p === "companyRegDate" || p === "dateOfBirth") {
            if (payload[p]) {
              payload[p] = new Date(payload[p]);
            }
          }
        }
      }

      await context.prisma.agrifoodPremiseProfile.update({
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
          tableName: "agrifoodPremiseProfile",
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
    deleteAgrifoodPremiseProfile: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData =
        await context.prisma.agrifoodPremiseProfile.findUnique({
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

      await context.prisma.agrifoodPremiseProfile.update({
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
          tableName: "agrifoodPremiseProfile",
          log: {
            ...getDeletedData,
          },
        },
      });

      return "success";
    },
    exportPremiseProfile: async (self, params, context) => {
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
      let premiseProfiles =
        await context.prisma.agrifoodPremiseProfile.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      let companyUUIDS = premiseProfiles
        .filter((p) => p.companyUUID)
        .map((ret) => ret.companyUUID);
      companyUUIDS = lodash.uniq(companyUUIDS);

      let agrifoodCompanyProfile =
        await context.prisma.agrifoodCompanyProfile.findMany({
          where: {
            uuid: {
              in: companyUUIDS,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      const indexedAgrifoodCompanyProfile = agrifoodCompanyProfile.reduce(
        (all, company) => {
          if (!all[company.uuid]) {
            all[company.uuid] = {};
          }
          all[company.uuid] = company;
          return all;
        },
        {}
      );

      let farmLocationUUIDs = premiseProfiles
        .filter((p) => p.farmLocationUUID)
        .map((ret) => ret.farmLocationUUID);
      farmLocationUUIDs = lodash.uniq(farmLocationUUIDs);

      let farmLocation = await context.prisma.farmLocation.findMany({
        where: {
          uuid: {
            in: farmLocationUUIDs,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedFarmLocation = farmLocation.reduce((all, district) => {
        if (!all[district.uuid]) {
          all[district.uuid] = {};
        }
        all[district.uuid] = district;
        return all;
      }, {});

      let awardUUIDS = premiseProfiles
        .filter((p) => p.awardTypeId)
        .map((ret) => ret.awardTypeId);

      awardUUIDS = lodash.uniq(awardUUIDS);

      let awardType = await context.prisma.awardType.findMany({
        where: {
          uuid: {
            in: awardUUIDS,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedAwardType = awardType.reduce((all, award) => {
        if (!all[award.uuid]) {
          all[award.uuid] = {};
        }
        all[award.uuid] = award;
        return all;
      }, {});

      let contractStatusUUIDs = premiseProfiles
        .filter((p) => p.contractStatusUUID)
        .map((ret) => ret.contractStatusUUID);

      contractStatusUUIDs = lodash.uniq(contractStatusUUIDs);

      let contractStatus = await context.prisma.contractStatus.findMany({
        where: {
          uuid: {
            in: contractStatusUUIDs,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedContractStatus = contractStatus.reduce((all, Contract) => {
        if (!all[Contract.uuid]) {
          all[Contract.uuid] = {};
        }
        all[Contract.uuid] = Contract;
        return all;
      }, {});

      let agrifoodProductCategory =
        await context.prisma.agrifoodProductCategory.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      const indexedAgrifoodProductCategory = agrifoodProductCategory.reduce(
        (all, cate) => {
          if (!all[cate.uuid]) {
            all[cate.uuid] = {};
          }
          all[cate.uuid] = cate;
          return all;
        },
        {}
      );

      let agrifoodProductSubCategory =
        await context.prisma.agrifoodProductSubCategory.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      const indexedAgrifoodProductSubCategory =
        agrifoodProductSubCategory.reduce((all, cate) => {
          if (!all[cate.uuid]) {
            all[cate.uuid] = {};
          }
          all[cate.uuid] = cate;
          return all;
        }, {});

      let machinery = await context.prisma.machinery.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedKMachinery = machinery.reduce((all, mach) => {
        if (!all[mach.uuid]) {
          all[mach.uuid] = {};
        }
        all[mach.uuid] = mach;
        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Premise Profile");

      let headerRow = [
        "PREMISE ID",
        "COMPANY NAME",
        "COMPANY ID",
        "OCBS REFERENCE NO",
        "PARTNER / INVESTOR",
        "SUPERVISOR",
        "SUPERVISOR NAME (MORE THAN 1)",
        "PREMISE ADDRESS",
        "PREMISE STRUCTURE",
        "PREMISE (SQMT)",
        "DISTRICT",
        "MUKIM",
        "VILLAGE",
        "FARM AREA",
        "LAND APPROVAL DATE",
        "ALLOW ACTIVITIES",
        "LAND CONTRACT EXPIRY",
        "FARM CATEGORY",
        "TYPE OF AWARD ",
        "CONTRACT STATUS",
        "COMMENCEMENT DATE",
        "LAND SIZE (HA)",
        "FACTORY SIZE (SQMT)",
        "PRODUCT CATEGORY",
        "SUB PRODUCT CATEGORY",
        "TYPE OF MACHINERY",
        "UNSKILLED LOCAL",
        "SEMI SKILLED LOCAL",
        "SKILLED LOCAL",
        "EXPERT LOCAL",
        "NO OF LABOUR LOCAL TOTAL",
        "UNSKILLED FOREIGNER",
        "SEMI SKILLED FOREIGNER",
        "SKILLED FOREIGNER",
        "EXPERT FOREIGNER",
        "NO OF LABOUR FOREIGNER TOTAL",
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

      for (const premiseProfile of premiseProfiles) {
        const agrifoodCompanyProfile =
          indexedAgrifoodCompanyProfile[premiseProfile.companyUUID];
        const farmLocation =
          indexedFarmLocation[premiseProfile.farmLocationUUID];
        const awardType = indexedAwardType[premiseProfile.awardTypeId];
        const contractStatus =
          indexedContractStatus[premiseProfile.contractStatusUUID];

        let productCategory = "";
        if (
          premiseProfile.agrifoodProductCategoryIds &&
          premiseProfile.agrifoodProductCategoryIds.length > 0
        ) {
          for (let Category of premiseProfile.agrifoodProductCategoryIds) {
            let cat = null;
            if (indexedAgrifoodProductCategory[Category]) {
              cat = indexedAgrifoodProductCategory[Category];
            }
            if (cat) {
              productCategory += `${cat.productNameEnglish}, `;
            }
          }
        }

        let subCategory = "";
        if (
          premiseProfile.agrifoodProductSubCategoryIds &&
          premiseProfile.agrifoodProductSubCategoryIds.length > 0
        ) {
          for (let SubCategory of premiseProfile.agrifoodProductSubCategoryIds) {
            let subCat = null;
            if (indexedAgrifoodProductSubCategory[SubCategory]) {
              subCat = indexedAgrifoodProductSubCategory[SubCategory];
            }
            if (subCat) {
              subCategory += `${subCat.subCategoryNameEnglish}, `;
            }
          }
        }

        let machinery = "";
        if (
          premiseProfile.machineryIds &&
          premiseProfile.machineryIds.length > 0
        ) {
          for (let machine of premiseProfile.machineryIds) {
            let mach = null;
            if (indexedKMachinery[machine]) {
              mach = indexedKMachinery[machine];
              // console.log("machinery", mach);
            }
            if (mach) {
              machinery += `${mach.machineName}, `;
            }
          }
        }

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: premiseProfile?.premiseId || "",
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
          value: agrifoodCompanyProfile?.companyName || "",
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
          value: agrifoodCompanyProfile?.companyId || "",
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
          value: premiseProfile?.ocbsRefNo || "",
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
          value: premiseProfile?.partnerInvestor || "",
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
          value: premiseProfile?.supervisorName || "",
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
          value: premiseProfile?.otherSupervisorName || "",
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
          value: premiseProfile?.premiseAddress || "",
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
          value: premiseProfile?.premiseStructure || "",
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
          value: premiseProfile?.premiseSize || "",
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
          value: farmLocation?.district || "",
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
          value: premiseProfile?.farmMukim || "",
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
          value: premiseProfile?.farmVillage || "",
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
          value: premiseProfile?.farmArea || "",
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
          value: premiseProfile?.landApprovalDate || "",
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
          value: premiseProfile?.allowedActivites || "",
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
          value: premiseProfile?.expiryDate || "",
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
          value: premiseProfile?.farmCategory || "",
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
          value: awardType?.award || "",
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
          value: contractStatus?.status || "",
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
          value: premiseProfile?.commencementDate || "",
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
          value: premiseProfile?.landSize || "",
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
          value: premiseProfile?.factorySize || "",
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
          value: productCategory || "",
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
          value: subCategory || "",
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
          value: machinery || "",
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
          value: premiseProfile.unskilledLocal || "",
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
          value: premiseProfile.semiSkilledLocal || "",
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
          value: premiseProfile.skilledLocal || "",
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
          value: premiseProfile.expertLocal || "",
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
          value: premiseProfile.noOfLabourTotal || "",
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
          value: premiseProfile.unskilledForeigner || "",
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
          value: premiseProfile.semiSkilledForeigner || "",
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
          value: premiseProfile.skilledForeigner || "",
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
          value: premiseProfile.expertForeigner || "",
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
          value: premiseProfile.noOfLabourForeigner || "",
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
      const filename = `premise_profile.xlsx`;
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
      return fileUrl;
    },
    tokenizedCreateAgrifoodPremiseProfile: async (self, params, context) => {
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

      const tokenized = jwt.verify(params.input.tokenized, TOKENIZE);

      const { iat, ...payloadTokenized } = tokenized;
      let payload = payloadTokenized.data;
      if (!payload.companyUUID) {
        throw new Error("Please fill the company name fields");
      }

      for (let p of Object.keys(payload)) {
        if (p === "mobileNo" || p === "telephoneNo") {
          if (payload[p]) {
            payload[p] = BigInt(payload[p]);
          } else {
            payload[p] = BigInt(0n);
          }
        } else if (
          p === "unskilledLocal" ||
          p === "skilledLocal" ||
          p === "expertForeigner" ||
          p === "expertLocal" ||
          p === "semiSkilledLocal" ||
          p === "semiSkilledForeigner" ||
          p === "noOfLabourTotal" ||
          p === "noOfLabourForeigner" ||
          p === "unskilledForeigner" ||
          p === "skilledForeigner"
        ) {
          if (!payload[p] || payload[p] === 0) {
            payload[p] = 0;
          }
        } else {
          if (p !== "companyRegDate" && p !== "dateOfBirth") {
            if (!payload[p]) {
              payload[p] = "";
            }
          } else if (p === "companyRegDate" || p === "dateOfBirth") {
            if (payload[p]) {
              payload[p] = new Date(payload[p]);
            }
          }
        }
      }

      // let latestNumber = await context.prisma.profileIdGenerator.findMany({
      //   where: {
      //     menu: "Agrifood Premise Profile",
      //   },
      //   take: 1,
      // });

      // let counter = 0;
      // if (latestNumber.length === 0) {
      //   counter = 1;
      //   await context.prisma.profileIdGenerator.create({
      //     data: {
      //       uuid: uuidv4(),
      //       counter: 1,
      //       menu: "Agrifood Premise Profile",
      //     },
      //   });
      // } else {
      //   counter = latestNumber[0].counter + 1;
      //   await context.prisma.profileIdGenerator.update({
      //     where: {
      //       uuid: latestNumber[0].uuid,
      //     },
      //     data: {
      //       counter,
      //     },
      //   });
      // }

      let startCode = payload.PREFIX;

      let counter = 0;
      if (startCode.includes("TM")) {
        let latest = await context.prisma.agrifoodPremiseProfile.findMany({
          where: {
            premiseId: {
              contains: "TM",
            },
          },
          orderBy: {
            premiseId: "desc",
          },
          take: 2,
        });

        if (latest.length > 0) {
          let splitted = latest[0].premiseId.split("TM")[1];
          counter = parseInt(splitted) + 1;
        } else {
          counter = 1;
        }

        // counter = latest + 1;
      } else if (startCode.includes("BM")) {
        let latest = await context.prisma.agrifoodPremiseProfile.findMany({
          where: {
            premiseId: {
              contains: "BM",
            },
          },
          orderBy: {
            premiseId: "desc",
          },
          take: 2,
        });

        if (latest.length > 0) {
          let splitted = latest[0].premiseId.split("BM")[1];
          counter = parseInt(splitted);
        } else {
          counter = 1;
        }

        // counter = latest + 1;
      } else if (startCode.includes("TT")) {
        let latest = await context.prisma.agrifoodPremiseProfile.findMany({
          where: {
            premiseId: {
              contains: "TT",
            },
          },
          orderBy: {
            premiseId: "desc",
          },
          take: 2,
        });

        if (latest.length > 0) {
          let splitted = latest[0].premiseId.split("TT")[1];
          counter = parseInt(splitted);
        } else {
          counter = 1;
        }
      } else if (startCode.includes("BL")) {
        let latest = await context.prisma.agrifoodPremiseProfile.findMany({
          where: {
            premiseId: {
              contains: "BL",
            },
          },
          orderBy: {
            premiseId: "desc",
          },
          take: 2,
        });

        if (latest.length > 0) {
          let splitted = latest[0].premiseId.split("BL")[1];
          counter = parseInt(splitted);
        } else {
          counter = 1;
        }

        // counter = latest + 1;
      }

      let dataLength = "" + counter;
      let last = dataLength.length * -1;
      startCode = startCode.slice(0, last) + counter;
      payload.premiseId = startCode;

      const foundExistingCode =
        await context.prisma.agrifoodPremiseProfile.findMany({
          where: {
            premiseId: payload.premiseId,
          },
          take: 1,
        });

      if (foundExistingCode.length >= 1) {
        counter = parseInt(foundExistingCode[0].premiseId.slice(2)) + 1;
        dataLength = "" + counter;
        last = dataLength.length * -1;
        startCode = startCode.slice(0, last) + counter;
        payload.premiseId = startCode;
      }

      delete payload.PREFIX;

      let createPayload = {
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
      if (!createPayload.landSize) {
        createPayload.landSize = 0;
      }
      if (!createPayload.factorySize) {
        createPayload.factorySize = 0;
      }

      if (!createPayload.companyUUID) {
        throw new Error("Company Name not fill in!");
      }

      if (
        !createPayload.agrifoodProductCategoryIds ||
        createPayload.agrifoodProductCategoryIds.length === 0
      ) {
        throw new Error("Product Category Not Selected!");
      }

      if (
        !createPayload.agrifoodProductSubCategoryIds ||
        createPayload.agrifoodProductSubCategoryIds.length === 0
      ) {
        throw new Error("SUub Product Category Not Selected!");
      }

      await context.prisma.agrifoodPremiseProfile.create({
        data: {
          ...createPayload,
        },
      });

      for (let p of Object.keys(createPayload)) {
        if (p === "mobileNo" || p === "telephoneNo") {
          if (createPayload[p]) {
            createPayload[p] = String(createPayload[p]);
          } else {
            createPayload[p] = String(0n);
          }
        } else if (
          p === "unskilledLocal" ||
          p === "skilledLocal" ||
          p === "expertForeigner" ||
          p === "expertLocal" ||
          p === "semiSkilledLocal" ||
          p === "semiSkilledForeigner" ||
          p === "noOfLabourTotal" ||
          p === "noOfLabourForeigner" ||
          p === "unskilledForeigner" ||
          p === "skilledForeigner"
        ) {
          if (!createPayload[p] || createPayload[p] === 0) {
            createPayload[p] = 0;
          }
        } else {
          if (p !== "companyRegDate" && p !== "dateOfBirth") {
            if (!createPayload[p]) {
              createPayload[p] = "";
            }
          } else if (p === "companyRegDate" || p === "dateOfBirth") {
            if (createPayload[p]) {
              createPayload[p] = new Date(createPayload[p]);
            }
          }
        }
      }

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "agrifoodPremiseProfile",
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
    tokenizedUpdateAgrifoodPremiseProfile: async (self, params, context) => {
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
      const tokenized = jwt.verify(params.input.tokenized, TOKENIZE);

      const {
        iat,
        id,
        updatedAt,
        updatedBy,
        createdAt,
        createdBy,
        deletedAt,
        deletedBy,
        PREFIX,
        ...payloadTokenized
      } = tokenized;

      if (!payloadTokenized.companyUUID) {
        throw new Error("Please fill the company name fields");
      }

      let payload = payloadTokenized;

      for (let p of Object.keys(payload)) {
        if (p === "mobileNo" || p === "telephoneNo") {
          if (payload[p]) {
            payload[p] = BigInt(payload[p]);
          } else {
            payload[p] = BigInt(0n);
          }
        } else if (
          p === "unskilledLocal" ||
          p === "skilledLocal" ||
          p === "expertForeigner" ||
          p === "expertLocal" ||
          p === "semiSkilledLocal" ||
          p === "semiSkilledForeigner" ||
          p === "noOfLabourTotal" ||
          p === "noOfLabourForeigner" ||
          p === "unskilledForeigner" ||
          p === "skilledForeigner"
        ) {
          if (!payload[p] || payload[p] === 0) {
            payload[p] = 0;
          }
        } else {
          if (p !== "companyRegDate" && p !== "dateOfBirth") {
            if (!payload[p]) {
              payload[p] = "";
            }
          } else if (p === "companyRegDate" || p === "dateOfBirth") {
            if (payload[p]) {
              payload[p] = new Date(payload[p]);
            }
          }
        }
      }

      if (!payload.landSize) {
        payload.landSize = 0;
      }
      if (!payload.factorySize) {
        payload.factorySize = 0;
      }
      if (!payload.premiseSize) {
        payload.premiseSize = 0;
      }

      await context.prisma.agrifoodPremiseProfile.update({
        where: {
          uuid: payload.uuid,
        },
        data: {
          ...payload,
          updatedAt: new Date().toISOString(),
          updatedBy: {
            uuid: context.activeSession.User.uuid,
            username: context.activeSession.User.employeeId,
          },
        },
      });

      for (let p of Object.keys(payload)) {
        if (p === "mobileNo" || p === "telephoneNo") {
          if (payload[p]) {
            payload[p] = String(payload[p]);
          } else {
            payload[p] = String(0n);
          }
        } else if (
          p === "unskilledLocal" ||
          p === "skilledLocal" ||
          p === "expertForeigner" ||
          p === "expertLocal" ||
          p === "semiSkilledLocal" ||
          p === "semiSkilledForeigner" ||
          p === "noOfLabourTotal" ||
          p === "noOfLabourForeigner" ||
          p === "unskilledForeigner" ||
          p === "skilledForeigner"
        ) {
          if (!payload[p] || payload[p] === 0) {
            payload[p] = 0;
          }
        } else {
          if (p !== "companyRegDate" && p !== "dateOfBirth") {
            if (!payload[p]) {
              payload[p] = "";
            }
          } else if (p === "companyRegDate" || p === "dateOfBirth") {
            if (payload[p]) {
              payload[p] = new Date(payload[p]);
            }
          }
        }
      }

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "UPDATE",
          tableName: "agrifoodPremiseProfile",
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
    tokenizedDeleteAgrifoodPremiseProfile: async (self, params, context) => {
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
        await context.prisma.agrifoodPremiseProfile.findUnique({
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

      await context.prisma.agrifoodPremiseProfile.update({
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
          tableName: "agrifoodPremiseProfile",
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
  AgrifoodPremiseProfile: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
  },
};
exports.resolvers = resolvers;
