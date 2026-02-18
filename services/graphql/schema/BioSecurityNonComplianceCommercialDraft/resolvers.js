const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const { noConflict } = require("lodash");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;
const lodash = require("lodash");
const axios = require("axios");

const resolvers = {
  Query: {
    allBioSecurityNonComplianceCommercialsDraft: async (
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
          "Commercial Non Compliance & Enforcement:Read"
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
        await context.prisma.bioSecurityNonComplianceCommercialDraft.findMany({
          where: queryFilter,
          orderBy: {
            id: "desc",
          },
        });
      return queryResult;
    },
    tokenizedAllBioSecurityNonComplianceCommercialsDraft: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);

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
        await context.prisma.bioSecurityNonComplianceCommercialDraft.findMany({
          where: queryFilter,
          orderBy: {
            id: "desc",
          },
        });

      let countryUUIDs = queryResult
        .filter((q) => q.countryUUID)
        .map((q) => q.countryUUID);
      countryUUIDs = lodash.uniq(countryUUIDs);
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
        (all, cnt) => {
          if (!all[cnt.uuid]) {
            all[cnt.uuid] = {};
          }
          all[cnt.uuid] = {
            ...cnt,
            id: cnt.id.toString(),
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

      let companyUUIDs = queryResult
        .filter((q) => q.companyUUID)
        .map((q) => q.companyUUID);
      companyUUIDs = lodash.uniq(companyUUIDs);
      const bioSecurityCompanyProfile =
        await context.prisma.bioSecurityCompanyProfile.findMany({
          where: {
            uuid: {
              in: companyUUIDs,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedBioSecurityCompanyProfile = bioSecurityCompanyProfile.reduce(
        (all, prof) => {
          if (!all[prof.uuid]) {
            all[prof.uuid] = {};
          }
          all[prof.uuid] = {
            ...prof,
            id: prof.id.toString(),
          };
          return all;
        },
        {}
      );

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          Company: indexedBioSecurityCompanyProfile[q.companyUUID]
            ? indexedBioSecurityCompanyProfile[q.companyUUID]
            : {},
        };
      });

      let takenActionUUIDs = queryResult
        .filter((q) => q.takenActionUUID)
        .map((q) => q.takenActionUUID);
      takenActionUUIDs = lodash.uniq(takenActionUUIDs);
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
    createBioSecurityNonComplianceCommercialDraft: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);

      const uuid = uuidv4();

      await context.prisma.bioSecurityNonComplianceCommercialDraft.create({
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
          tableName: "bioSecurityNonComplianceCommercial",
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

      if (params.nosReferenceNumber && params.actionByEnforcement) {
        let newNonCompliance = {
          uuid: uuidv4(),
          complianceAndEnforcementUUID: uuid,
          companyProfileUUID: params.companyUUID,
          date: params.entryDate,
          inputByOfficer: context.activeSession.User,
          type: "COMMERCIAL",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: "",
          createdBy: context.activeSession.User,
          updatedBy: context.activeSession.User,
          deletedBy: {},
        };

        await context.prisma.bioSecurityNonComplianceListsDraft.create({
          data: {
            ...newNonCompliance,
          },
        });

        await context.prisma.activityLogs.create({
          data: {
            uuid: uuidv4(),
            type: "CREATE",
            tableName: "bioSecurityNonComplianceListsDraft",
            log: {
              ...newNonCompliance,
            },
          },
        });
      }

      return "success";
    },
    updateBioSecurityNonComplianceCommercialDraft: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);

      await context.prisma.bioSecurityNonComplianceCommercialDraft.update({
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
          tableName: "bioSecurityNonComplianceCommercial",
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

      if (params.nosReferenceNumber && params.actionByEnforcement) {
        const found =
          await context.prisma.bioSecurityNonComplianceListsDraft.findMany({
            where: {
              companyProfileUUID: params.companyUUID,
              date: params.entryDate,
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
          });

        if (found.length === 0) {
          let newNonCompliance = {
            uuid: uuidv4(),
            complianceAndEnforcementUUID: params.uuid,
            companyProfileUUID: params.companyUUID,
            date: params.entryDate,
            inputByOfficer: context.activeSession.User,
            type: "COMMERCIAL",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: "",
            createdBy: context.activeSession.User,
            updatedBy: {
              uuid: context.activeSession.User.uuid,
              username: context.activeSession.User.employeeId,
            },
            deletedBy: {},
          };

          await context.prisma.bioSecurityNonComplianceListsDraft.create({
            data: {
              ...newNonCompliance,
            },
          });
          await context.prisma.activityLogs.create({
            data: {
              uuid: uuidv4(),
              type: "UPDATE",
              tableName: "bioSecurityNonComplianceListsDraft",
              log: {
                ...newNonCompliance,
              },
            },
          });
        }
      }
      return "success";
    },
    deleteBioSecurityNonComplianceCommercialDraft: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);

      let getDeletedData =
        await context.prisma.bioSecurityNonComplianceCommercialDraft.findUnique(
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

      await context.prisma.bioSecurityNonComplianceCommercialDraft.update({
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
          tableName: "bioSecurityNonComplianceCommercial",
          log: {
            ...getDeletedData,
          },
        },
      });

      return "success";
    },
    exportBioSecurityNonComplianceCommercialDraft: async (
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

      if (params.staffName) {
        arraysFilter.push({
          staffName: {
            contains: params.staffName,
          },
        });
      }

      if (params.companyRegNo) {
        let allCompanyProfileByRegNumber =
          await context.prisma.bioSecurityCompanyProfile.findMany({
            where: {
              companyRegNo: {
                contains: params.companyRegNo,
              },
            },
          });
        arraysFilter.push({
          companyUUID: {
            in: allCompanyProfileByRegNumber.map((ret) => ret.uuid),
          },
        });
      }

      if (params.companyUUID) {
        arraysFilter.push({
          companyUUID: {
            in: [params.companyUUID],
          },
        });
      }

      if (params.companyOwnerName) {
        let allCompanyProfileByCompanyOwnerName =
          await context.prisma.bioSecurityCompanyProfile.findMany({
            where: {
              companyOwnerName: {
                contains: params.companyOwnerName,
              },
            },
          });
        arraysFilter.push({
          companyUUID: {
            in: allCompanyProfileByCompanyOwnerName.map((ret) => ret.uuid),
          },
        });
      }

      if (params.icNo) {
        let allCompanyProfileByIcNo =
          await context.prisma.bioSecurityCompanyProfile.findMany({
            where: {
              icNo: {
                contains: params.icNo,
              },
            },
          });
        arraysFilter.push({
          companyUUID: {
            in: allCompanyProfileByIcNo.map((ret) => ret.uuid),
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

      if (arraysFilter.length !== 0) {
        filterQuery = {
          ...filterQuery,
          OR: arraysFilter,
        };
      }

      let commercials =
        await context.prisma.bioSecurityNonComplianceCommercialDraft.findMany({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      let bioSecurityCompanyProfile =
        await context.prisma.bioSecurityCompanyProfile.findMany({
          where: {
            uuid: {
              in: commercials.map((ret) => ret.companyUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      const indexedBioSecurityCompanyProfile = bioSecurityCompanyProfile.reduce(
        (all, company) => {
          if (!all[company.uuid]) {
            all[company.uuid] = {};
          }
          all[company.uuid] = company;
          return all;
        },
        {}
      );

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
              in: commercials.map((ret) => ret.countryUUID),
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
              in: commercials.map((ret) => ret.takenActionUUID),
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
      let productionSheet = workbook.addWorksheet("Non Compliance Commercial");

      let headerRow = [
        "POINT OF ENTRY",
        "STAFF NAME",
        "COMPANY'S REGISTRATION NUMBER",
        "COMPANY NAME",
        "OWNER'S  NAME",
        "IC NUMBER",
        "CONTACT DETAILS",
        "COMPANY'S ADDRESS",
        "DATE OF ENTRY",
        "NON-COMPLIANCE",
        "PERMIT NUMBER",
        "HEALTH CERTIFICATE'S NUMBER",
        "EXPORTING COUNTRY",
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

      for (const commercial of commercials) {
        const bioSecurityCompanyProfile =
          indexedBioSecurityCompanyProfile[commercial.companyUUID];
        const bioSecurityCountry =
          indexedBioSecurityCountry[commercial.countryUUID];
        const bioSecurityTakenAction =
          indexedBioSecurityTakenAction[commercial.takenActionUUID];

        let nonCompliance = "";
        if (
          commercial.nonComplienceUUID &&
          commercial.nonComplienceUUID.length > 0
        ) {
          for (let compliance of commercial.nonComplienceUUID) {
            let nonComp = null;
            if (indexedBioSecurityCompliance[compliance]) {
              nonComp = indexedBioSecurityCompliance[compliance];
            }
            if (nonComp) {
              nonCompliance += `${nonComp.name}, `;
            }
          }
        }

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: commercial?.pointOfEntry || "",
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
          value: commercial?.staffName || "",
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
          value: bioSecurityCompanyProfile?.companyRegNo || "",
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
          value: bioSecurityCompanyProfile?.companyName || "",
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
          value: bioSecurityCompanyProfile?.companyOwnerName || "",
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
          value: bioSecurityCompanyProfile?.icNo || "",
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
          value: bioSecurityCompanyProfile?.contactDetails || "",
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
          value: bioSecurityCompanyProfile?.companyAddress || "",
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
          value: commercial?.entryDate || "",
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
          value: commercial?.permitNumber || "",
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
          value: commercial?.healthCertificateNumber || "",
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
          value: commercial?.remarks || "",
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
          value: commercial?.nosReferenceNumber || "",
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
          value: commercial?.actionByEnforcement || "",
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
      const filename = `non_compliance_commercials.xlsx`;
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
    tokenizedCreateBioSecurityNonComplianceCommercialDraft: async (
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
        companyAddress,
        contactDetails,
        icNo,
        companyOwnerName,
        companyName,
        companyRegNo,
        nonComplienceLists,
        ...payload
      } = tokenized;
      const uuid = uuidv4();

      if (!payload.companyUUID) {
        throw new Error("Company cannot be empty");
      }

      await context.prisma.bioSecurityNonComplianceCommercialDraft.create({
        data: {
          uuid,
          ...payload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: "",
          createdBy: context.activeSession.User,
          updatedBy: context.activeSession.User,
          deletedBy: {},
          syncStatus: "WAITING",
        },
      });
      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "bioSecurityNonComplianceCommercial",
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

      if (payload.nosReferenceNumber && payload.actionByEnforcement) {
        let newNonCompliance = {
          uuid: uuidv4(),
          complianceAndEnforcementUUID: uuid,
          companyProfileUUID: payload.companyUUID,
          date: payload.entryDate,
          inputByOfficer: context.activeSession.User,
          type: "COMMERCIAL",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: "",
          createdBy: context.activeSession.User,
          updatedBy: context.activeSession.User,
          deletedBy: {},
        };

        await context.prisma.bioSecurityNonComplianceListsDraft.create({
          data: {
            ...newNonCompliance,
          },
        });

        await context.prisma.activityLogs.create({
          data: {
            uuid: uuidv4(),
            type: "CREATE",
            tableName: "bioSecurityNonComplianceListsDraft",
            log: {
              ...newNonCompliance,
            },
            userId: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      }

      return "success";
    },
    tokenizedUpdateBioSecurityNonComplianceCommercialDraft: async (
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
        nonComplienceLists,
        companyRegNo,
        TakenAction,
        Company,
        Country,
        __typename,
        companyAddress,
        contactDetails,
        icNo,
        companyOwnerName,
        companyName,
        ...payload
      } = tokenized;

      if (!payload.companyUUID) {
        throw new Error("Company cannot be empty");
      }

      await context.prisma.bioSecurityNonComplianceCommercialDraft.update({
        where: {
          uuid: payload.uuid,
        },
        data: {
          ...payload,
          updatedAt: new Date().toISOString(),
          updatedBy: context.activeSession.User,
          syncStatus: "WAITING",
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "UPDATE",
          tableName: "bioSecurityNonComplianceCommercial",
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

      if (payload.nosReferenceNumber && payload.actionByEnforcement) {
        const found =
          await context.prisma.bioSecurityNonComplianceListsDraft.findMany({
            where: {
              companyProfileUUID: payload.companyUUID,
              date: payload.entryDate,
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
          });

        if (found.length === 0) {
          let newNonCompliance = {
            uuid: uuidv4(),
            complianceAndEnforcementUUID: payload.uuid,
            companyProfileUUID: payload.companyUUID,
            date: payload.entryDate,
            inputByOfficer: context.activeSession.User,
            type: "COMMERCIAL",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: "",
            createdBy: context.activeSession.User,
            updatedBy: {
              uuid: context.activeSession.User.uuid,
              username: context.activeSession.User.employeeId,
            },
            deletedBy: {},
          };

          await context.prisma.bioSecurityNonComplianceListsDraft.create({
            data: {
              ...newNonCompliance,
            },
          });
          await context.prisma.activityLogs.create({
            data: {
              uuid: uuidv4(),
              type: "UPDATE",
              tableName: "bioSecurityNonComplianceListsDraft",
              log: {
                ...newNonCompliance,
              },
              userId: userId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          });
        }
      }
      return "success";
    },
    tokenizedDeleteBioSecurityNonComplianceCommercialDraft: async (
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
        await context.prisma.bioSecurityNonComplianceCommercialDraft.findUnique(
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

      await context.prisma.bioSecurityNonComplianceCommercialDraft.update({
        where: {
          uuid: payload.uuid,
        },
        data: {
          deletedAt: new Date().toISOString(),
          deletedBy: {
            uuid: context.activeSession.User.uuid,
            username: context.activeSession.User.employeeId,
          },
          syncStatus: "WAITING",
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "DELETE",
          tableName: "bioSecurityNonComplianceCommercial",
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
    syncNonComplianceCommercialDraft: async (self, params, context) => {
      try {
        const foundWaitingCompliance =
          await context.prisma.bioSecurityNonComplianceCommercialDraft.findMany(
            {
              where: {
                syncStatus: "WAITING",
              },
              orderBy: {
                id: "desc",
              },
              take: 10,
            }
          );

        if (foundWaitingCompliance.length > 0) {
          for (let item of foundWaitingCompliance) {
            delete item.id;
            let config = {
              method: "POST",

              url: "http://localhost:9301/sync-non-compliance-commercial-draft",
              headers: {
                "Content-Type": "application/json",
              },
              data: JSON.stringify(item),
            };

            const result = await axios(config);
            if (result.data.code === 200) {
              await context.prisma.bioSecurityNonComplianceCommercialDraft.update(
                {
                  where: {
                    uuid: item.uuid,
                  },
                  data: {
                    syncStatus: "SYNCED",
                  },
                }
              );
            }
          }
        }

        const foundWaitingComplianceList =
          await context.prisma.bioSecurityNonComplianceListsDraft.findMany({
            where: {
              syncStatus: "WAITING",
            },
            orderBy: {
              id: "desc",
            },
            take: 10,
          });

        if (foundWaitingComplianceList.length > 0) {
          for (let item of foundWaitingComplianceList) {
            delete item.id;
            let config = {
              method: "POST",

              url: "http://localhost:9301/sync-non-compliance-list",
              headers: {
                "Content-Type": "application/json",
              },
              data: JSON.stringify(item),
            };

            const result = await axios(config);
            if (result.data.code === 200) {
              await context.prisma.bioSecurityNonComplianceCommercialDraft.update(
                {
                  where: {
                    uuid: item.uuid,
                  },
                  data: {
                    syncStatus: "SYNCED",
                  },
                }
              );
            }
          }
        }
      } catch (error) {
        console.log("Error Sync WAITING", error);
      }

      return "success";
    },
  },
  BioSecurityNonComplianceCommercialDraft: {
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
    Company: async (self, params, context) => {
      return await context.prisma.bioSecurityCompanyProfile.findUnique({
        where: {
          uuid: self.companyUUID,
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
