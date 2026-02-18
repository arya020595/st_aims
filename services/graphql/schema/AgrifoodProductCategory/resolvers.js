const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const { orderBy } = require("lodash");
const TOKENIZE = process.env.TOKENIZE;
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const resolvers = {
  Query: {
    allAgrifoodProductCategories: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("Product Category:Read")) {
        return [];
      }

      let queryResult = await context.prisma.agrifoodProductCategory.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "asc",
        },
      });
      return queryResult;
    },
    allAgrifoodProductCategoriesByCompanyId: async (self, params, context) => {
      assertValidSession(context.activeSession);

      const catalogues = await context.prisma.productCatalogue.findMany({
        where: {
          companyUUID: params.companyUUID,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const foundCategories =
        await context.prisma.agrifoodProductCategory.findMany({
          where: {
            uuid: {
              in: catalogues.map((c) => c.productCategoryUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      return foundCategories;
    },
    tokenizedAllAgrifoodProductCategories: async (self, params, context) => {
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

      // if (!role || !role.privileges.includes("Product Category:Read")) {
      //   return [];
      // }

      let queryResult = await context.prisma.agrifoodProductCategory.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "asc",
        },
      });

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
        };
      });

      const agrifoodProductSubCategory =
        await context.prisma.agrifoodProductSubCategory.findMany({
          where: {
            productCategoryUUID: {
              in: queryResult.map((q) => q.uuid),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedProductSubCategory = agrifoodProductSubCategory.reduce(
        (all, cat) => {
          if (!all[cat.productCategoryUUID]) {
            all[cat.productCategoryUUID] = [];
          }
          all[cat.productCategoryUUID].push({
            ...cat,
            id: cat.id.toString(),
          });
          return all;
        },
        {}
      );

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          AgrifoodProductSubCategory: indexedProductSubCategory[q.uuid]
            ? indexedProductSubCategory[q.uuid]
            : [],
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    tokenizedAllAgrifoodProductCategoriesByCompanyId: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);

      const tokenized = jwt.verify(params.tokenizedParams, TOKENIZE);

      const { iat, ...payload } = tokenized;

      const catalogues = await context.prisma.productCatalogue.findMany({
        where: {
          companyUUID: payload.companyUUID,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      let foundCategories =
        await context.prisma.agrifoodProductCategory.findMany({
          where: {
            uuid: {
              in: catalogues.map((c) => c.productCategoryUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });
      foundCategories = foundCategories.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
        };
      });

      const agrifoodProductSubCategory =
        await context.prisma.agrifoodProductSubCategory.findMany({
          where: {
            productCategoryUUID: {
              in: foundCategories.map((q) => q.uuid),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedProductSubCategory = agrifoodProductSubCategory.reduce(
        (all, cat) => {
          if (!all[cat.productCategoryUUID]) {
            all[cat.productCategoryUUID] = [];
          }
          all[cat.productCategoryUUID].push({
            ...cat,
            id: cat.id.toString(),
          });
          return all;
        },
        {}
      );

      const productCatalogueDetail =
        await context.prisma.productCatalogueDetails.findMany({
          where: {
            companyUUID: payload.companyUUID,
            productCategoryUUID: {
              in: foundCategories.map((q) => q.uuid),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const agrifoodProductSubCategoryByCatalogueDetail =
        await context.prisma.agrifoodProductSubCategory.findMany({
          where: {
            uuid: {
              in: productCatalogueDetail.map((q) => q.productSubCategoryUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedAgrifoodProductSubCategoryByCatalogueDetail =
        agrifoodProductSubCategoryByCatalogueDetail.reduce((all, cat) => {
          if (!all[cat.productCategoryUUID]) {
            all[cat.productCategoryUUID] = [];
          }
          all[cat.productCategoryUUID].push({
            ...cat,
            id: cat.id.toString(),
          });
          return all;
        }, {});

      foundCategories = foundCategories.map((q) => {
        return {
          ...q,
          AgrifoodProductSubCategory: indexedProductSubCategory[q.uuid]
            ? indexedProductSubCategory[q.uuid]
            : [],

          AgrifoodProductSubCategoryFromCatalogueDetail:
            indexedAgrifoodProductSubCategoryByCatalogueDetail[q.uuid]
              ? indexedAgrifoodProductSubCategoryByCatalogueDetail[q.uuid]
              : [],
        };
      });
      const payloads = {
        foundCategories,
      };

      let token = jwt.sign(payloads, TOKENIZE);
      return token;
    },
  },
  Mutation: {
    createAgrifoodProductCategory: async (self, params, context) => {
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

      await context.prisma.agrifoodProductCategory.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "agrifoodProductCategory",
          log: {
            ...createPayload,
          },
        },
      });
      return "success";
    },
    updateAgrifoodProductCategory: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.agrifoodProductCategory.update({
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
          tableName: "agrifoodProductCategory",
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
    deleteAgrifoodProductCategory: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData =
        await context.prisma.agrifoodProductCategory.findUnique({
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

      await context.prisma.agrifoodProductCategory.update({
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
          tableName: "agrifoodProductCategory",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    tokenizedCreateAgrifoodProductCategory: async (self, params, context) => {
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

      await context.prisma.agrifoodProductCategory.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "agrifoodProductCategory",
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
    tokenizedUpdateAgrifoodProductCategory: async (self, params, context) => {
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
        AgrifoodProductSubCategory,
        ...payload
      } = tokenized;

      await context.prisma.agrifoodProductCategory.update({
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
          tableName: "agrifoodProductCategory",
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
    tokenizedDeleteAgrifoodProductCategory: async (self, params, context) => {
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
        await context.prisma.agrifoodProductCategory.findUnique({
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

      await context.prisma.agrifoodProductCategory.update({
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
          tableName: "agrifoodProductCategory",
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
    exportProductCategory: async (self, params, context) => {
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
      let productCategories =
        await context.prisma.agrifoodProductCategory.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "asc",
          },
        });

      productCategories = productCategories.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
        };
      });

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Product Category");

      let headerRow = [
        "ID",
        "PRODUCT NAME (ENGLISH)",
        "PRODUCT NAME (MALAY)",
        "PREFIX CODE",
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

      for (const productCategory of productCategories) {
        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: productCategory?.id || "",
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
          value: productCategory?.productNameEnglish || "",
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
          value: productCategory?.productNameMalay || "",
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
          value: productCategory?.codePrefix || "",
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
      const filename = `product_category.xlsx`;
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

      const fileBuffer = await fs.promises.readFile(filePath);

      return fileBuffer;
      // throw {};
      // return fileUrl;
    },
  },
  AgrifoodProductCategory: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    AgrifoodProductSubCategory: async (self, params, context) => {
      return await context.prisma.agrifoodProductSubCategory.findMany({
        where: {
          productCategoryUUID: self.uuid,
        },
      });
    },
  },
};
exports.resolvers = resolvers;
