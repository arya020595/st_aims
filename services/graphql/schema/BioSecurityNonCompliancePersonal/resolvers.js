const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const dayjs = require("dayjs");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;
const lodash = require("lodash");

const resolvers = {
  Query: {
    allBioSecurityNonCompliancePersonals: async (self, params, context) => {
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
        !role.privileges.includes("Personal Non Compliance & Enforcement:Read")
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
        await context.prisma.bioSecurityNonCompliancePersonal.findMany({
          where: queryFilter,
          orderBy: {
            id: "desc",
          },
        });
      return queryResult;
    },
    tokenizedAllBioSecurityNonCompliancePersonals: async (
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
      //   !role.privileges.includes("Personal Non Compliance & Enforcement:Read")
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
        await context.prisma.bioSecurityNonCompliancePersonal.findMany({
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
        (all, cont) => {
          if (!all[cont.uuid]) {
            all[cont.uuid] = {};
          }
          all[cont.uuid] = {
            ...cont,
            id: cont.id.toString(),
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
          Country: indexedBioSecurityCountry[q.countryUUID]
            ? indexedBioSecurityCountry[q.countryUUID]
            : {},
        };
      });

      let individualProfileUUIDs = queryResult
        .filter((q) => q.individualProfileUUID)
        .map((q) => q.individualProfileUUID);
      individualProfileUUIDs = lodash.uniq(individualProfileUUIDs);

      const bioSecurityIndividualProfile =
        await context.prisma.bioSecurityIndividualProfile.findMany({
          where: {
            uuid: {
              in: individualProfileUUIDs,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedBioSecurityIndividualProfile =
        bioSecurityIndividualProfile.reduce((all, prof) => {
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
          IndividualProfile: indexedBioSecurityIndividualProfile[
            q.individualProfileUUID
          ]
            ? indexedBioSecurityIndividualProfile[q.individualProfileUUID]
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
    createBioSecurityNonCompliancePersonal: async (self, params, context) => {
      assertValidSession(context.activeSession);

      const uuid = uuidv4();

      await context.prisma.bioSecurityNonCompliancePersonal.create({
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
          tableName: "bioSecurityNonCompliancePersonal",
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
          individualProfileUUID: params.individualProfileUUID,
          date: params.entryDate,
          inputByOfficer: context.activeSession.User,
          type: "PERSONAL",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: "",
          createdBy: context.activeSession.User,
          updatedBy: context.activeSession.User,
          deletedBy: {},
        };

        await context.prisma.bioSecurityNonComplianceLists.create({
          data: {
            ...newNonCompliance,
          },
        });

        await context.prisma.activityLogs.create({
          data: {
            uuid: uuidv4(),
            type: "CREATE",
            tableName: "bioSecurityNonComplianceLists",
            log: {
              ...newNonCompliance,
            },
          },
        });
      }

      return "success";
    },
    updateBioSecurityNonCompliancePersonal: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.bioSecurityNonCompliancePersonal.update({
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
          tableName: "bioSecurityNonCompliancePersonal",
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
          await context.prisma.bioSecurityNonComplianceLists.findMany({
            where: {
              individualProfileUUID: params.individualProfileUUID,
              date: params.entryDate,
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
          });

        if (found.length === 0) {
          let newNonCompliance = {
            uuid: uuidv4(),
            complianceAndEnforcementUUID: uuid,
            individualProfileUUID: params.individualProfileUUID,
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

          await context.prisma.bioSecurityNonComplianceLists.create({
            data: {
              ...newNonCompliance,
            },
          });

          await context.prisma.activityLogs.create({
            data: {
              uuid: uuidv4(),
              type: "UPDATE",
              tableName: "bioSecurityNonComplianceLists",
              log: {
                ...newNonCompliance,
              },
            },
          });
        }
      }
      return "success";
    },
    deleteBioSecurityNonCompliancePersonal: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData =
        await context.prisma.bioSecurityNonCompliancePersonal.findUnique({
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

      await context.prisma.bioSecurityNonCompliancePersonal.update({
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
          tableName: "bioSecurityNonCompliancePersonal",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportBioSecurityNonCompliancePersonal: async (self, params, context) => {
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

      if (params.personalName) {
        let allIndividualProfileByPersonalName =
          await context.prisma.bioSecurityIndividualProfile.findMany({
            where: {
              name: {
                contains: params.personalName,
              },
            },
          });
        arraysFilter.push({
          individualProfileUUID: {
            in: allIndividualProfileByPersonalName.map((ret) => ret.uuid),
          },
        });
      }

      if (params.icNo) {
        let allIndividualProfileByIcNo =
          await context.prisma.bioSecurityIndividualProfile.findMany({
            where: {
              icNo: {
                contains: params.icNo,
              },
            },
          });
        arraysFilter.push({
          individualProfileUUID: {
            in: allIndividualProfileByIcNo.map((ret) => ret.uuid),
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

      let personals =
        await context.prisma.bioSecurityNonCompliancePersonal.findMany({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      let bioSecurityIndividualProfile =
        await context.prisma.bioSecurityIndividualProfile.findMany({
          where: {
            uuid: {
              in: personals
                .filter((pr) => pr.individualProfileUUID)
                .map((ret) => ret.individualProfileUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      const indexedBioSecurityIndividualProfile =
        bioSecurityIndividualProfile.reduce((all, icNo) => {
          if (!all[icNo.uuid]) {
            all[icNo.uuid] = {};
          }
          all[icNo.uuid] = icNo;
          return all;
        }, {});

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
        (all, nonComm) => {
          if (!all[nonComm.uuid]) {
            all[nonComm.uuid] = {};
          }
          all[nonComm.uuid] = nonComm;
          return all;
        },
        {}
      );

      let bioSecurityCountry = await context.prisma.bioSecurityCountry.findMany(
        {
          where: {
            uuid: {
              in: personals.map((ret) => ret.countryUUID),
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
              in: personals.map((ret) => ret.takenActionUUID),
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
      let productionSheet = workbook.addWorksheet("Non Compliance Personal");

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
        "EXPORTING COUNTRY",
        "REMARKS",
        "ACTION TO BE TAKEN",
        "NOTICE OF SEIZURE REFERENCE NUMBER",
        "ACTION TO BE TAKEN",
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

      for (const personal of personals) {
        const bioSecurityIndividualProfile =
          indexedBioSecurityIndividualProfile[personal.individualProfileUUID];
        const bioSecurityCountry =
          indexedBioSecurityCountry[personal.countryUUID];
        const bioSecurityTakenAction =
          indexedBioSecurityTakenAction[personal.takenActionUUID];

        let nonCompliance = "";
        if (
          personal.nonComplienceUUID &&
          personal.nonComplienceUUID.length > 0
        ) {
          for (let personalComp of personal.nonComplienceUUID) {
            let nonComp = null;
            if (indexedBioSecurityCompliance[personalComp]) {
              nonComp = indexedBioSecurityCompliance[personalComp];
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
          value: personal?.pointOfEntry || "",
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
          value: personal?.staffName || "",
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
          value: bioSecurityIndividualProfile?.icNo || "",
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
          value: bioSecurityIndividualProfile?.name || "",
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
          value: bioSecurityIndividualProfile?.contactNumber || "",
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
          value: bioSecurityIndividualProfile?.address || "",
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
          value: personal?.entryDate || "",
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
          value: personal?.permitNumber || "",
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
          value: personal?.healthCertificateNumber || "",
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
          value: personal?.remarks || "",
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
          value: personal?.nosReferenceNumber || "",
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
          value: personal?.actionByEnforcement || "",
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
      // const filename = `non_compliance_personal.xlsx`;
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
    tokenizedCreateBioSecurityNonCompliancePersonal: async (
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

      const uuid = uuidv4();

      const {
        iat,
        address,
        contactNumber,
        name,
        icNo,
        nonComplienceLists,
        ...payload
      } = tokenized;

      if (!payload.companyUUID) {
        throw new Error("Company cannot be empty");
      }

      await context.prisma.bioSecurityNonCompliancePersonal.create({
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
          tableName: "bioSecurityNonCompliancePersonal",
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
          individualProfileUUID: payload.individualProfileUUID,
          date: payload.entryDate,
          inputByOfficer: context.activeSession.User,
          type: "PERSONAL",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: "",
          createdBy: context.activeSession.User,
          updatedBy: context.activeSession.User,
          deletedBy: {},
        };

        await context.prisma.bioSecurityNonComplianceLists.create({
          data: {
            ...newNonCompliance,
          },
        });

        await context.prisma.activityLogs.create({
          data: {
            uuid: uuidv4(),
            type: "CREATE",
            tableName: "bioSecurityNonComplianceLists",
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
    tokenizedUpdateBioSecurityNonCompliancePersonal: async (
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
        TakenAction,
        IndividualProfile,
        Country,
        __typename,
        address,
        contactNumber,
        icNo,
        name,
        ...payload
      } = tokenized;

      if (!payload.companyUUID) {
        throw new Error("Company cannot be empty");
      }

      await context.prisma.bioSecurityNonCompliancePersonal.update({
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
          tableName: "bioSecurityNonCompliancePersonal",
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
          await context.prisma.bioSecurityNonComplianceLists.findMany({
            where: {
              individualProfileUUID: payload.individualProfileUUID,
              date: payload.entryDate,
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
          });

        if (found.length === 0) {
          let newNonCompliance = {
            uuid: uuidv4(),
            complianceAndEnforcementUUID: uuid,
            individualProfileUUID: payload.individualProfileUUID,
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

          await context.prisma.bioSecurityNonComplianceLists.create({
            data: {
              ...newNonCompliance,
            },
          });

          await context.prisma.activityLogs.create({
            data: {
              uuid: uuidv4(),
              type: "UPDATE",
              tableName: "bioSecurityNonComplianceLists",
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
    tokenizedDeleteBioSecurityNonCompliancePersonal: async (
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
        await context.prisma.bioSecurityNonCompliancePersonal.findUnique({
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

      await context.prisma.bioSecurityNonCompliancePersonal.update({
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
          tableName: "bioSecurityNonCompliancePersonal",
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
  BioSecurityNonCompliancePersonal: {
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
    IndividualProfile: async (self, params, context) => {
      return await context.prisma.bioSecurityIndividualProfile.findUnique({
        where: {
          uuid: self.individualProfileUUID,
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
