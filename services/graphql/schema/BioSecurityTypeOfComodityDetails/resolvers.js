const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const TOKENIZE = process.env.TOKENIZE;

const resolvers = {
  Query: {
    allBioSecurityTypeOfComodityDetail: async (self, params, context) => {
      assertValidSession(context.activeSession);

      if (!params.bioSecurityTypeOfComodityUUID) {
        return [];
      }
      let queryResult =
        await context.prisma.bioSecurityTypeOfComodityDetails.findMany({
          where: {
            ...params,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      return queryResult;
    },
    tokenizedAllBioSecurityTypeOfComodityDetail: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);
      if (params.tokenizedParams) {
        const tokenized = jwt.verify(params.tokenizedParams, TOKENIZE);

        const { iat, ...payload } = tokenized;

        if (!params.bioSecurityTypeOfComodityUUID) {
          return [];
        }
        let queryResult =
          await context.prisma.bioSecurityTypeOfComodityDetails.findMany({
            where: {
              ...payload,
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

        const bioSecurityCategory =
          await context.prisma.bioSecurityCategory.findMany({
            where: {
              uuid: {
                in: queryResult.map((q) => q.bioSecurityCategoryUUID),
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

        queryResult = queryResult.map((q) => {
          return {
            ...q,
            BioSecurityCategory: indexedBioSecurityCategory[
              q.bioSecurityCategoryUUID
            ]
              ? indexedBioSecurityCategory[q.bioSecurityCategoryUUID]
              : {},
          };
        });
        const bioSecuritySubCategory =
          await context.prisma.bioSecuritySubCategory.findMany({
            where: {
              uuid: {
                in: queryResult.map((q) => q.bioSecuritySubCategoryUUID),
              },
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
          });

        const indexedBioSecuritySubCategory = bioSecuritySubCategory.reduce(
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
            BioSecuritySubCategory: indexedBioSecuritySubCategory[
              q.bioSecuritySubCategoryUUID
            ]
              ? indexedBioSecuritySubCategory[q.bioSecuritySubCategoryUUID]
              : {},
          };
        });

        const bioSecurityUnit = await context.prisma.bioSecurityUnit.findMany({
          where: {
            uuid: {
              in: queryResult.map((q) => q.bioSecurityUnitUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        const indexedBioSecurityUnit = bioSecurityUnit.reduce((all, cat) => {
          if (!all[cat.uuid]) {
            all[cat.uuid] = {};
          }
          all[cat.uuid] = {
            ...cat,
            id: cat.id.toString(),
          };
          return all;
        }, {});

        queryResult = queryResult.map((q) => {
          return {
            ...q,
            BioSecurityUnit: indexedBioSecurityUnit[q.bioSecurityUnitUUID]
              ? indexedBioSecurityUnit[q.bioSecurityUnitUUID]
              : {},
          };
        });

        const payloads = {
          queryResult,
        };

        let token = jwt.sign(payloads, TOKENIZE);
        return token;
      }
      return "ok";
    },
  },
  Mutation: {
    createBioSecurityTypeOfComodityDetail: async (self, params, context) => {
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

      await context.prisma.bioSecurityTypeOfComodityDetails.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "bioSecurityTypeOfComodityDetails",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateBioSecurityTypeOfComodityDetail: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.bioSecurityTypeOfComodityDetails.update({
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
          tableName: "bioSecurityTypeOfComodityDetails",
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
    deleteBioSecurityTypeOfComodityDetail: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData =
        await context.prisma.bioSecurityTypeOfComodityDetails.findUnique({
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

      await context.prisma.bioSecurityTypeOfComodityDetails.update({
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
          tableName: "bioSecurityTypeOfComodityDetails",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    tokenizedCreateBioSecurityTypeOfComodityDetail: async (
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

      await context.prisma.bioSecurityTypeOfComodityDetails.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "bioSecurityTypeOfComodityDetails",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    tokenizedUpdateBioSecurityTypeOfComodityDetail: async (
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

      const tokenized = jwt.verify(params.tokenized, TOKENIZE);

      const { iat, ...payload } = tokenized;

      await context.prisma.bioSecurityTypeOfComodityDetails.update({
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
          tableName: "bioSecurityTypeOfComodityDetails",
          log: {
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
    tokenizedDeleteBioSecurityTypeOfComodityDetail: async (
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

      const tokenized = jwt.verify(params.tokenized, TOKENIZE);

      const { iat, ...payload } = tokenized;

      let getDeletedData =
        await context.prisma.bioSecurityTypeOfComodityDetails.findUnique({
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

      await context.prisma.bioSecurityTypeOfComodityDetails.update({
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
          tableName: "bioSecurityTypeOfComodityDetails",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportBioSecurityTypeOfComodityDetails: async (self, params, context) => {
      if (!params.bioSecurityTypeOfComodityUUID) {
        return [];
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


      let bioSecurityTypeOfComodityDetails =
        await context.prisma.bioSecurityTypeOfComodityDetails.findMany({
          where: {
            ...params,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      const bioSecurityCategory = await context.prisma.bioSecurityCategory.findMany()

      const indexedBioSecurityCategory = bioSecurityCategory.reduce((all, cat) => {
        if (!all[cat.uuid]) {
          all[cat.uuid] = {};
        }
        all[cat.uuid] = cat;
        return all;
      }, {});

      const bioSecuritySubCategory = await context.prisma.bioSecuritySubCategory.findMany({})

      const indexedBioSecuritySUbCategory = bioSecuritySubCategory.reduce((all, cat) => {
        if (!all[cat.uuid]) {
          all[cat.uuid] = {};
        }
        all[cat.uuid] = cat;
        return all;
      }, {});

      const bioSecurityUnit = await context.prisma.bioSecurityUnit.findMany({})

      const indexedBioSecurityUnit = bioSecurityUnit.reduce((all, unit) => {
        if (!all[unit.uuid]) {
          all[unit.uuid] = {};
        }
        all[unit.uuid] = unit;
        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Type Of Comodity Details");

      let headerRow = [
        "PRODUCT CODE",
        "BIO SECURITY CATEGORY",
        "SUB CATEGORY",
        "ENGLISH NAME",
        "LOCAL NAME",
        "ACTIVE INGREDIENT / CROP NAME",
        "UNIT"
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

      let rowCounter = 2
      colCounter = 0

      for (const bioSecurityTypeOfComodityDetail of bioSecurityTypeOfComodityDetails) {
        const category = indexedBioSecurityCategory[bioSecurityTypeOfComodityDetail.bioSecurityCategoryUUID]
        const subCategory = indexedBioSecuritySUbCategory[bioSecurityTypeOfComodityDetail.bioSecuritySubCategoryUUID]
        const unit = indexedBioSecurityUnit[bioSecurityTypeOfComodityDetail.bioSecurityUnitUUID]

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: bioSecurityTypeOfComodityDetail?.code || "",
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
          value: category?.name || "",
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
          value: subCategory?.name || "",
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
          value: bioSecurityTypeOfComodityDetail?.englishName || "",
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
          value: bioSecurityTypeOfComodityDetail?.localName || "",
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
          value: bioSecurityTypeOfComodityDetail?.activeIngredients || "",
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
          value: unit?.name || "",
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
      const filename = `type_of_comodity_details.xlsx`;
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
    }
  },
  BioSecurityTypeOfComodityDetail: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    BioSecurityTypeOfComodity: async (self, params, context) => {
      // console.log(self);
      // return await context.prisma.bioSecurityTypeOfComodity.findUnique({
      //   where: {
      //     uuid: self.bioSecurityTypeOfComodityUUID,
      //     ...NOT_DELETED_DOCUMENT_QUERY,
      //   },
      // });
    },
    BioSecurityCategory: async (self, params, context) => {
      return await context.prisma.bioSecurityCategory.findUnique({
        where: {
          uuid: self.bioSecurityCategoryUUID,
        },
      });
    },
    BioSecuritySubCategory: async (self, params, context) => {
      return await context.prisma.bioSecuritySubCategory.findUnique({
        where: {
          uuid: self.bioSecuritySubCategoryUUID,
        },
      });
    },
    BioSecurityUnit: async (self, params, context) => {
      return await context.prisma.bioSecurityUnit.findUnique({
        where: {
          uuid: self.bioSecurityUnitUUID,
        },
      });
    },
  },
};
exports.resolvers = resolvers;
