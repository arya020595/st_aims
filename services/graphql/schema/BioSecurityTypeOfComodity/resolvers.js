const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const lodash = require("lodash");
const dayjs = require("dayjs");
const resolvers = {
  Query: {
    allBioSecurityTypeOfComodities: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("Type Of Comodity:Read")) {
        return [];
      }

      let queryResult = await context.prisma.bioSecurityTypeOfComodity.findMany(
        {
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        }
      );
      return queryResult;
    },
    allBioSecurityTypeOfComoditiesByIds: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let queryResult = await context.prisma.bioSecurityTypeOfComodity.findMany(
        {
          where: {
            uuid: {
              in: params.uuids,
            },
          },
          orderBy: {
            id: "desc",
          },
        }
      );
      return queryResult;
    },
    tokenizedAllBioSecurityTypeOfComodities: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let queryResult = await context.prisma.bioSecurityTypeOfComodity.findMany(
        {
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        }
      );

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
        };
      });

      if (
        (params && params.onPage === "MASTER DATA") ||
        (params && params.onPage === "BIOSECURITY IMPORT DATA")
      ) {
        const payload = {
          queryResult,
        };

        let token = jwt.sign(payload, TOKENIZE);
        return token;
      }

      let bioSecurityTypeOfComodityDetails =
        await context.prisma.bioSecurityTypeOfComodityDetails.findMany({
          where: {
            bioSecurityTypeOfComodityUUID: {
              in: queryResult.map((q) => q.uuid),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      let bioSecurityTypeOfComodityDetailsUUIDs =
        bioSecurityTypeOfComodityDetails
          .filter((b) => b.bioSecurityCategoryUUID)
          .map((q) => q.bioSecurityCategoryUUID);

      bioSecurityTypeOfComodityDetailsUUIDs = lodash.uniq(
        bioSecurityTypeOfComodityDetailsUUIDs
      );
      const bioSecurityCategory =
        await context.prisma.bioSecurityCategory.findMany({
          where: {
            uuid: {
              // in: bioSecurityTypeOfComodityDetails.map(
              //   (q) => q.bioSecurityCategoryUUID
              // ),
              in: bioSecurityTypeOfComodityDetailsUUIDs,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedBioSecurityCategory = bioSecurityCategory.reduce(
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

      bioSecurityTypeOfComodityDetails = bioSecurityTypeOfComodityDetails.map(
        (q) => {
          return {
            ...q,
            BioSecurityCategory: indexedBioSecurityCategory[
              q.bioSecurityCategoryUUID
            ]
              ? indexedBioSecurityCategory[q.bioSecurityCategoryUUID]
              : {},
          };
        }
      );

      let bioSecurityUnitUUIDs = bioSecurityTypeOfComodityDetails
        .filter((b) => b.bioSecurityCategoryUUID)
        .map((q) => q.bioSecurityUnitUUID);

      bioSecurityUnitUUIDs = lodash.uniq(bioSecurityUnitUUIDs);

      const bioSecurityUnit = await context.prisma.bioSecurityUnit.findMany({
        where: {
          uuid: {
            // in: bioSecurityTypeOfComodityDetails.map(
            //   (q) => q.bioSecurityUnitUUID
            // ),
            in: bioSecurityUnitUUIDs,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedBioSecurityUnit = bioSecurityUnit.reduce((all, unit) => {
        if (!all[unit.uuid]) {
          all[unit.uuid] = {};
        }
        all[unit.uuid] = {
          ...unit,
          id: unit.id.toString(),
        };
        return all;
      }, {});

      bioSecurityTypeOfComodityDetails = bioSecurityTypeOfComodityDetails.map(
        (q) => {
          return {
            ...q,
            BioSecurityUnit: indexedBioSecurityUnit[q.bioSecurityUnitUUID]
              ? indexedBioSecurityUnit[q.bioSecurityUnitUUID]
              : {},
          };
        }
      );

      const indexedBioSecurityTypeOfComodityDetails =
        bioSecurityTypeOfComodityDetails.reduce((all, det) => {
          if (!all[det.bioSecurityTypeOfComodityUUID]) {
            all[det.bioSecurityTypeOfComodityUUID] = [];
          }
          all[det.bioSecurityTypeOfComodityUUID].push({
            ...det,
            id: det.id.toString(),
          });
          return all;
        }, {});

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          ComodityDetails: indexedBioSecurityTypeOfComodityDetails[q.uuid]
            ? indexedBioSecurityTypeOfComodityDetails[q.uuid]
            : [],
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    tokenizedllBioSecurityTypeOfComoditiesByIds: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);

      if (!params.tokenizedParams) {
        const payload = {
          queryResult: [],
        };

        let token = jwt.sign(payload, TOKENIZE);
        return token;
      }
      const tokenized = jwt.verify(params.tokenizedParams, TOKENIZE);
      const { iat, ...payload } = tokenized;

      let queryResult = await context.prisma.bioSecurityTypeOfComodity.findMany(
        {
          where: {
            uuid: {
              in: payload.ids,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        }
      );

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
        };
      });

      let bioSecurityTypeOfComodityDetails =
        await context.prisma.bioSecurityTypeOfComodityDetails.findMany({
          where: {
            bioSecurityTypeOfComodityUUID: {
              in: queryResult.map((ret) => ret.uuid),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      bioSecurityTypeOfComodityDetails = bioSecurityTypeOfComodityDetails.map(
        (q) => {
          let id = BigInt(q.id);
          return {
            ...q,
            id: id.toString(),
          };
        }
      );

      let categoryUUIDs = bioSecurityTypeOfComodityDetails
        .filter((qr) => qr.bioSecurityCategoryUUID)
        .map((ret) => ret.bioSecurityCategoryUUID);
      categoryUUIDs = lodash.uniq(categoryUUIDs);

      const bioSecurityCategory =
        await context.prisma.bioSecurityCategory.findMany({
          where: {
            uuid: {
              in: categoryUUIDs,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedBioSecurityCategory = bioSecurityCategory.reduce(
        (all, unit) => {
          if (!all[unit.uuid]) {
            all[unit.uuid] = {};
          }
          all[unit.uuid] = {
            ...unit,
            id: unit.id.toString(),
          };
          return all;
        },
        {}
      );

      const bioSecurityUnit = await context.prisma.bioSecurityUnit.findMany({
        where: {
          uuid: {
            in: bioSecurityTypeOfComodityDetails.map(
              (q) => q.bioSecurityUnitUUID
            ),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedBioSecurityUnit = bioSecurityUnit.reduce((all, unit) => {
        if (!all[unit.uuid]) {
          all[unit.uuid] = {};
        }
        all[unit.uuid] = {
          ...unit,
          id: unit.id.toString(),
        };
        return all;
      }, {});

      bioSecurityTypeOfComodityDetails = bioSecurityTypeOfComodityDetails.map(
        (q) => {
          return {
            ...q,
            BioSecurityUnit: indexedBioSecurityUnit[q.bioSecurityUnitUUID]
              ? indexedBioSecurityUnit[q.bioSecurityUnitUUID]
              : {},

            BioSecurityCategory: indexedBioSecurityCategory[
              q.bioSecurityCategoryUUID
            ]
              ? indexedBioSecurityCategory[q.bioSecurityCategoryUUID]
              : {},
          };
        }
      );

      const indexedTypeOfCommodityDetails =
        bioSecurityTypeOfComodityDetails.reduce((all, com) => {
          if (!all[com.bioSecurityTypeOfComodityUUID]) {
            all[com.bioSecurityTypeOfComodityUUID] = [];
          }
          all[com.bioSecurityTypeOfComodityUUID].push(com);
          return all;
        }, {});

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
          ComodityDetails: indexedTypeOfCommodityDetails[q.uuid]
            ? indexedTypeOfCommodityDetails[q.uuid]
            : [],
        };
      });

      const payloads = {
        queryResult,
      };

      let token = jwt.sign(payloads, TOKENIZE);
      return token;
    },
    searchBioSecurityTypeOfComodities: async (self, params, context) => {
      let nameQuery = {
        name: "-",
      };
      if (params.name) {
        nameQuery = {
          name: {
            startsWith: params.name,
          },
        };
      }
      let queryResult = await context.prisma.bioSecurityTypeOfComodity.findMany(
        {
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
            ...nameQuery,
          },
          take: 1,
          orderBy: {
            id: "desc",
          },
        }
      );
      if (queryResult.length === 0) {
        if (params.name) {
          nameQuery = {
            name: {
              contains: params.name,
            },
          };
        }
        queryResult = await context.prisma.bioSecurityTypeOfComodity.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
            ...nameQuery,
          },
          take: 1,
          orderBy: {
            id: "desc",
          },
        });
      }
      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
        };
      });
      if (params.onPage && params.onPage === "import-data") {
        const payload = {
          queryResult,
        };

        let token = jwt.sign(payload, TOKENIZE);
        return token;
      }
      let bioSecurityTypeOfComodityDetails =
        await context.prisma.bioSecurityTypeOfComodityDetails.findMany({
          where: {
            bioSecurityTypeOfComodityUUID: {
              in: queryResult.map((q) => q.uuid),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      let bioSecurityTypeOfComodityDetailsUUIDs =
        bioSecurityTypeOfComodityDetails
          .filter((b) => b.bioSecurityCategoryUUID)
          .map((q) => q.bioSecurityCategoryUUID);

      bioSecurityTypeOfComodityDetailsUUIDs = lodash.uniq(
        bioSecurityTypeOfComodityDetailsUUIDs
      );

      const bioSecurityCategory =
        await context.prisma.bioSecurityCategory.findMany({
          where: {
            uuid: {
              // in: bioSecurityTypeOfComodityDetails.map(
              //   (q) => q.bioSecurityCategoryUUID
              // ),
              in: bioSecurityTypeOfComodityDetailsUUIDs,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedBioSecurityCategory = bioSecurityCategory.reduce(
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

      bioSecurityTypeOfComodityDetails = bioSecurityTypeOfComodityDetails.map(
        (q) => {
          return {
            ...q,
            BioSecurityCategory: indexedBioSecurityCategory[
              q.bioSecurityCategoryUUID
            ]
              ? indexedBioSecurityCategory[q.bioSecurityCategoryUUID]
              : {},
          };
        }
      );

      let bioSecurityUnitUUIDs = bioSecurityTypeOfComodityDetails
        .filter((b) => b.bioSecurityCategoryUUID)
        .map((q) => q.bioSecurityUnitUUID);

      bioSecurityUnitUUIDs = lodash.uniq(bioSecurityUnitUUIDs);

      const bioSecurityUnit = await context.prisma.bioSecurityUnit.findMany({
        where: {
          uuid: {
            // in: bioSecurityTypeOfComodityDetails.map(
            //   (q) => q.bioSecurityUnitUUID
            // ),
            in: bioSecurityUnitUUIDs,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedBioSecurityUnit = bioSecurityUnit.reduce((all, unit) => {
        if (!all[unit.uuid]) {
          all[unit.uuid] = {};
        }
        all[unit.uuid] = {
          ...unit,
          id: unit.id.toString(),
        };
        return all;
      }, {});

      bioSecurityTypeOfComodityDetails = bioSecurityTypeOfComodityDetails.map(
        (q) => {
          return {
            ...q,
            BioSecurityUnit: indexedBioSecurityUnit[q.bioSecurityUnitUUID]
              ? indexedBioSecurityUnit[q.bioSecurityUnitUUID]
              : {},
          };
        }
      );

      const indexedBioSecurityTypeOfComodityDetails =
        bioSecurityTypeOfComodityDetails.reduce((all, det) => {
          if (!all[det.bioSecurityTypeOfComodityUUID]) {
            all[det.bioSecurityTypeOfComodityUUID] = [];
          }
          all[det.bioSecurityTypeOfComodityUUID].push({
            ...det,
            id: det.id.toString(),
          });
          return all;
        }, {});
      console.log("Step 4", dayjs().format("HH:mm:ss"));

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          ComodityDetails: indexedBioSecurityTypeOfComodityDetails[q.uuid]
            ? indexedBioSecurityTypeOfComodityDetails[q.uuid]
            : [],
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
    createBioSecurityTypeOfComodity: async (self, params, context) => {
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

      await context.prisma.bioSecurityTypeOfComodity.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "bioSecurityTypeOfComodity",
          log: {
            ...createPayload,
          },
        },
      });
      return "success";
    },
    updateBioSecurityTypeOfComodity: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.bioSecurityTypeOfComodity.update({
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
          tableName: "bioSecurityTypeOfComodity",
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
    deleteBioSecurityTypeOfComodity: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData =
        await context.prisma.bioSecurityTypeOfComodity.findUnique({
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

      await context.prisma.bioSecurityTypeOfComodity.update({
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
          tableName: "bioSecurityTypeOfComodity",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    tokenizedCreateBioSecurityTypeOfComodity: async (self, params, context) => {
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

      await context.prisma.bioSecurityTypeOfComodity.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "bioSecurityTypeOfComodity",
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

    tokenizedUpdateBioSecurityTypeOfComodity: async (self, params, context) => {
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
        ComodityDetails,
        ...payload
      } = tokenized;

      await context.prisma.bioSecurityTypeOfComodity.update({
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
          tableName: "bioSecurityTypeOfComodity",
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
    tokenizedDeleteBioSecurityTypeOfComodity: async (self, params, context) => {
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
        await context.prisma.bioSecurityTypeOfComodity.findUnique({
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

      await context.prisma.bioSecurityTypeOfComodity.update({
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
          tableName: "bioSecurityTypeOfComodity",
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
    exportBioSecurityTypeOfComodity: async (self, params, context) => {
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

      let typeOfCommodities =
        await context.prisma.bioSecurityTypeOfComodity.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Type Of Commodity");

      let headerRow = ["NAME", "DESCRIPTION"];

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

      for (const typeOfCommodity of typeOfCommodities) {
        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: typeOfCommodity?.name || "",
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
          value: typeOfCommodity?.description || "",
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
      const filename = `type_of_commodity.xlsx`;
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
      // return fileUrl;
      const fileBuffer = await fs.promises.readFile(filePath);

      return fileBuffer;
    },
  },
  BioSecurityTypeOfComodity: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    ComodityDetails: async (self, params, context) => {
      return await context.prisma.bioSecurityTypeOfComodityDetails.findMany({
        where: {
          bioSecurityTypeOfComodityUUID: self.uuid,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });
    },
  },
};
exports.resolvers = resolvers;
