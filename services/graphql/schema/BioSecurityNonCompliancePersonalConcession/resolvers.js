const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;
const lodash = require("lodash")

const resolvers = {
  Query: {
    allBioSecurityNonCompliancePersonalConcessions: async (
      self,
      params,
      context
    ) => {
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
        !role.privileges.includes(
          "Personal Concession Non Compliance & Enforcement:Read"
        )
      ) {
        return [];
      }

      let filterQuery = {};

      if (params.monthYear) {
        let startDate = dayjs(params.monthYear)
          .startOf("month")
          .format("YYYY-MM-DD");

        let endDate = dayjs(params.monthYear)
          .endOf("month")
          .format("YYYY-MM-DD");

        filterQuery = {
          entryDate: {
            gte: startDate,
            lte: endDate,
          },
        };
      }
      let queryFilter = {
        ...NOT_DELETED_DOCUMENT_QUERY,
      };

      if (context.activeSession.User && context.activeSession.User.uuid) {
        queryFilter = {
          pointOfEntry: context.activeSession.User.controlPost,
          district: context.activeSession.User.district,
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        };

        if (context.activeSession.User.isUserBioSecurityEnforcementOnly) {
          queryFilter = {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          };
        }
      }
      if (
        context.activeSession.User.userId &&
        context.activeSession.User.userId === "__ROOT__"
      ) {
        queryFilter = {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        };
      }

      let queryResult =
        await context.prisma.bioSecurityNonCompliancePersonalConcession.findMany(
          {
            where: queryFilter,
            orderBy: {
              id: "desc",
            },
          }
        );
      return queryResult;
    },
    tokenizedAllBioSecurityNonCompliancePersonalConcessions: async (
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
      //   !role.privileges.includes(
      //     "Personal Concession Non Compliance & Enforcement:Read"
      //   )
      // ) {
      //   return [];
      // }

      let filterQuery = {};

      if (params.monthYear) {
        let startDate = dayjs(params.monthYear)
          .startOf("month")
          .format("YYYY-MM-DD");

        let endDate = dayjs(params.monthYear)
          .endOf("month")
          .format("YYYY-MM-DD");

        filterQuery = {
          entryDate: {
            gte: startDate,
            lte: endDate,
          },
        };
      }
      let queryFilter = {
        ...NOT_DELETED_DOCUMENT_QUERY,
      };

      if (context.activeSession.User && context.activeSession.User.uuid) {
        queryFilter = {
          pointOfEntry: context.activeSession.User.controlPost,
          district: context.activeSession.User.district,
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        };

        if (context.activeSession.User.isUserBioSecurityEnforcementOnly) {
          queryFilter = {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          };
        }
      }
      if (
        context.activeSession.User.userId &&
        context.activeSession.User.userId === "__ROOT__"
      ) {
        queryFilter = {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        };
      }

      let queryResult =
        await context.prisma.bioSecurityNonCompliancePersonalConcession.findMany(
          {
            where: queryFilter,
            orderBy: {
              id: "desc",
            },
          }
        );

      let countryUUIDs = queryResult.filter((q) => q.countryUUID).map((q) => q.countryUUID)
      countryUUIDs = lodash.uniq(countryUUIDs)
      const bioSecurityCountry =
        await context.prisma.bioSecurityCountry.findMany({
          where: {
            uuid: {
              in: countryUUIDs,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedBioSecurityCountry = bioSecurityCountry.reduce(
        (all, country) => {
          if (!all[country.uuid]) {
            all[country.uuid] = {};
          }
          all[country.uuid] = {
            ...country,
            id: country.id.toString(),
          };
          return all;
        },
        {}
      );

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          Country: indexedBioSecurityCountry[q.countryUUID]
            ? indexedBioSecurityCountry[q.countryUUID]
            : {},
        };
      });

      let takenActionUUIDs = queryResult.filter((q) => q.takenActionUUID).map((q) => q.takenActionUUID)
      takenActionUUIDs = lodash.uniq(takenActionUUIDs)

      const bioSecurityTakenAction =
        await context.prisma.bioSecurityTakenAction.findMany({
          where: {
            uuid: {
              in: takenActionUUIDs,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedBioSecurityTakenAction = bioSecurityTakenAction.reduce(
        (all, action) => {
          if (!all[action.uuid]) {
            all[action.uuid] = {};
          }
          all[action.uuid] = {
            ...action,
            id: action.id.toString(),
          };
          return all;
        },
        {}
      );

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
          TakenAction: indexedBioSecurityTakenAction[q.takenActionUUID]
            ? indexedBioSecurityTakenAction[q.takenActionUUID]
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
    createBioSecurityNonCompliancePersonalConcession: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);

      const uuid = uuidv4();

      await context.prisma.bioSecurityNonCompliancePersonalConcession.create({
        data: {
          uuid,
          ...params,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: "",
          createdBy: context.activeSession.User,
          updatedBy: context.activeSession.User,
          deletedBy: {},
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "bioSecurityNonCompliancePersonalConcession",
          log: {
            uuid,
            ...params,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: "",
            createdBy: context.activeSession.User,
            updatedBy: {
              uuid: context.activeSession.User.uuid,
              username: context.activeSession.User.employeeId,
            },
            deletedBy: {},
          },
        },
      });

      return "success";
    },
    updateBioSecurityNonCompliancePersonalConcession: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);

      await context.prisma.bioSecurityNonCompliancePersonalConcession.update({
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
          tableName: "bioSecurityNonCompliancePersonalConcession",
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
    deleteBioSecurityNonCompliancePersonalConcession: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);

      let getDeletedData =
        await context.prisma.bioSecurityNonCompliancePersonalConcession.findUnique(
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

      await context.prisma.bioSecurityNonCompliancePersonalConcession.update({
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
          tableName: "bioSecurityNonCompliancePersonalConcession",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportBioSecurityNonCompliancePersonalConcession: async (
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
      let arraysFilter = [];
      let filterQuery = {}
      if (params.monthYear) {
        let startDate = dayjs(params.monthYear)
          .startOf("month")
          .format("YYYY-MM-DD");

        let endDate = dayjs(params.monthYear)
          .endOf("month")
          .format("YYYY-MM-DD");

        filterQuery = {
          entryDate: {
            gte: startDate,
            lte: endDate,
          },
        };
      }

      if (params.pointOfEntry) {
        arraysFilter.push({
          pointOfEntry: {
            contains: params.pointOfEntry,
          },
        });
      }

      if (params.name) {
        arraysFilter.push({
          name: {
            contains: params.name,
          },
        });
      }

      if (params.icNo) {
        arraysFilter.push({
          icNo: {
            contains: params.icNo,
          },
        });
      }

      if (params.permitNumber) {
        arraysFilter.push({
          permitNumber: {
            contains: params.permitNumber,
          },
        });
      }

      if (params.countryUUID) {
        arraysFilter.push({
          countryUUID: {
            in: [params.countryUUID],
          },
        });
      }

      if (params.takenActionUUID) {
        arraysFilter.push({
          takenActionUUID: {
            in: [params.takenActionUUID],
          },
        });
      }

      if (arraysFilter.length !== 0) {
        filterQuery = {
          ...filterQuery,
          OR: arraysFilter,
        };
      }

      let Concessions =
        await context.prisma.bioSecurityNonCompliancePersonalConcession.findMany(
          {
            where: {
              ...filterQuery,
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
            orderBy: {
              id: "desc",
            },
          }
        );

      // throw new Error("error");
      let bioSecurityCompliance =
        await context.prisma.bioSecurityCompliance.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      const indexedBioSecurityCompliance = bioSecurityCompliance.reduce(
        (all, comm) => {
          if (!all[comm.uuid]) {
            all[comm.uuid] = {};
          }
          all[comm.uuid] = comm;
          return all;
        },
        {}
      );

      let bioSecurityCountry = await context.prisma.bioSecurityCountry.findMany(
        {
          where: {
            uuid: {
              in: Concessions.map((ret) => ret.countryUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        }
      );
      const indexedBioSecurityCountry = bioSecurityCountry.reduce(
        (all, Country) => {
          if (!all[Country.uuid]) {
            all[Country.uuid] = {};
          }
          all[Country.uuid] = Country;
          return all;
        },
        {}
      );

      let bioSecurityTakenAction =
        await context.prisma.bioSecurityTakenAction.findMany({
          where: {
            uuid: {
              in: Concessions.map((ret) => ret.takenActionUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      const indexedBioSecurityTakenAction = bioSecurityTakenAction.reduce(
        (all, action) => {
          if (!all[action.uuid]) {
            all[action.uuid] = {};
          }
          all[action.uuid] = action;
          return all;
        },
        {}
      );

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet(
        "Non Compliance Personal Concession"
      );

      let headerRow = [
        "POINT OF ENTRY",
        "STAFF NAME",
        "IC NUMBER",
        "NAME",
        "CONTACT DETAILS",
        "ADDRESS",
        "DATE OF ENTRY",
        "NON COMPLIANCE",
        "PERMIT NUMBER",
        "HEALTH CERTIFICATE'S NUMBER",
        "EXPORT COUNTRY",
        "REMARKS",
        "ACTION TO BE TAKEN",
        "NOTICE OF SEIZURE REFERENCE NUMBER",
        "ACTION BY ENFORCEMENT",
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

      for (const Concession of Concessions) {
        const bioSecurityCountry =
          indexedBioSecurityCountry[Concession.countryUUID];
        const bioSecurityTakenAction =
          indexedBioSecurityTakenAction[Concession.takenActionUUID];

        let nonCompliance = "";
        if (
          Concession.nonComplienceUUID &&
          Concession.nonComplienceUUID.length > 0
        ) {
          for (let Concessions of Concession.nonComplienceUUID) {
            let nonComp = null;
            if (indexedBioSecurityCompliance[Concessions]) {
              nonComp = indexedBioSecurityCompliance[Concessions];
            }
            if (nonComp) {
              nonCompliance += `${nonComp.name},   `;
            }
          }
        }

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: Concession?.pointOfEntry || "",
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
          value: Concession?.staffName || "",
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
          value: Concession?.icNo || "",
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
          value: Concession?.name || "",
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
          value: Concession?.contactDetails || "",
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
          value: Concession?.address || "",
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
          value: Concession?.entryDate || "",
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
          value: nonCompliance || "",
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
          value: Concession?.permitNumber || "",
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
          value: Concession?.healthCertificateNumber || "",
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
          value: bioSecurityCountry?.name || "",
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
          value: Concession?.remarks || "",
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
          value: bioSecurityTakenAction?.name || "",
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
          value: Concession?.nosReferenceNumber || "",
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
          value: Concession?.actionByEnforcement || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        colCounter = 0;
        rowCounter += 1;
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = buffer.toString("base64");
      return base64;

      // const PREFIX = "DoAA";

      // if (!fs.existsSync(process.cwd() + "/static/cache/")) {
      //   fs.mkdirSync(process.cwd() + "/static/cache/");
      // }
      // if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
      //   fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
      // }
      // const filename = `non_compliance_personal_concession.xlsx`;
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
    tokenizedCreateBioSecurityNonCompliancePersonalConcession: async (
      self,
      params,
      context
    ) => {
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

      const { iat, nonComplienceLists, ...payload } = tokenized;

      const uuid = uuidv4();

      await context.prisma.bioSecurityNonCompliancePersonalConcession.create({
        data: {
          uuid,
          ...payload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: "",
          createdBy: context.activeSession.User,
          updatedBy: context.activeSession.User,
          deletedBy: {},
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "bioSecurityNonCompliancePersonalConcession",
          log: {
            uuid,
            ...payload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: "",
            createdBy: context.activeSession.User,
            updatedBy: {
              uuid: context.activeSession.User.uuid,
              username: context.activeSession.User.employeeId,
            },
            deletedBy: {},
          },
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      return "success";
    },
    tokenizedUpdateBioSecurityNonCompliancePersonalConcession: async (
      self,
      params,
      context
    ) => {
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
        nonComplienceLists,
        TakenAction,
        Country,
        ...payload
      } = tokenized;

      await context.prisma.bioSecurityNonCompliancePersonalConcession.update({
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
          tableName: "bioSecurityNonCompliancePersonalConcession",
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
    tokenizedDeleteBioSecurityNonCompliancePersonalConcession: async (
      self,
      params,
      context
    ) => {
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

      let getDeletedData =
        await context.prisma.bioSecurityNonCompliancePersonalConcession.findUnique(
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

      await context.prisma.bioSecurityNonCompliancePersonalConcession.update({
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
          tableName: "bioSecurityNonCompliancePersonalConcession",
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
  BioSecurityNonCompliancePersonalConcession: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    Country: async (self, params, context) => {
      return await context.prisma.bioSecurityCountry.findUnique({
        where: {
          uuid: self.countryUUID,
        },
      });
    },
    TakenAction: async (self, params, context) => {
      return await context.prisma.bioSecurityTakenAction.findUnique({
        where: {
          uuid: self.takenActionUUID,
        },
      });
    },
  },
};
exports.resolvers = resolvers;
