const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const dayjs = require("dayjs");
const mime = require("mime");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const { filter, bind, orderBy } = require("lodash");
const jwt = require("jsonwebtoken");
const { name } = require("agenda/dist/agenda/name");
const TOKENIZE = process.env.TOKENIZE;
const resolvers = {
  Query: {
    allProductCatalogueDetails: async (self, params, context) => {
      assertValidSession(context.activeSession);

      const queryResult = await context.prisma.productCatalogueDetails.findMany(
        {
          where: {
            productCatalogueUUID: params.productCatalogueUUID,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        }
      );
      return queryResult;
    },
    countProductCatalogueDetails: async (self, params, context) => {
      assertValidSession(context.activeSession);

      const queryResult = await context.prisma.productCatalogueDetails.count(
        {}
      );
      return queryResult;
    },
    allProductCatalogueDetailsByCompany: async (self, params, context) => {
      assertValidSession(context.activeSession);

      const queryResult = await context.prisma.productCatalogueDetails.findMany(
        {
          where: {
            ...params,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        }
      );
      return queryResult;
    },
    productCatalogueDetailsWithFilters: async (self, params, context) => {
      assertValidSession(context.activeSession);

      const queryResult = await context.prisma.productCatalogueDetails.findMany(
        {
          where: {
            ...params.filter,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        }
      );
      return queryResult;
    },
    tokenizedAllProductCatalogueDetails: async (self, params, context) => {
      assertValidSession(context.activeSession);

      const tokenized = jwt.verify(params.tokenizedParamsCat, TOKENIZE);

      const { iat, ...payloadParams } = tokenized;

      let queryResult = await context.prisma.productCatalogueDetails.findMany({
        where: {
          ...payloadParams,
          // productCatalogueUUID: params.productCatalogueUUID,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          code: "desc",
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
    tokenizedAllProductCatalogueDetailsByCompany: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);

      const tokenized = jwt.verify(params.tokenizedParams, TOKENIZE);

      const { iat, ...payloadParams } = tokenized;
      let queryResult = await context.prisma.productCatalogueDetails.findMany({
        where: {
          ...payloadParams,
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
    tokenizedProductCatalogueDetailsWithFilters: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);

      const tokenized = jwt.verify(params.tokenizedParams, TOKENIZE);

      const { iat, ...payloadParams } = tokenized;

      let queryResult = await context.prisma.productCatalogueDetails.findMany({
        where: {
          ...payloadParams.filter,
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
  },
  Mutation: {
    createProductCatalogueDetails: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let payload = {
        ...params,
      };

      if (payload.productImageUrl && payload.productImageUrl.includes("data")) {
        let ContentType = base64MimeType(payload.productImageUrl);

        const mimeType = mime.getExtension(ContentType);
        const fileId = uuidv4();
        const filename = `${payload.code}_${fileId}.` + "zip";
        const buf = Buffer.from(
          payload.productImageUrl.split("base64,")[1],
          "base64"
        );
        const type = payload.productImageUrl.split(";")[0].split("/")[1];

        const PREFIX = "AgriFoodV2";

        if (!fs.existsSync(process.cwd() + "/static/cache/")) {
          fs.mkdirSync(process.cwd() + "/static/cache/");
        }
        if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
          fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
        }

        const productImageUrl =
          `/doa/cache/${PREFIX}/${filename}?t=` + new Date().toISOString();
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
        fs.writeFileSync(filePath, buf);

        payload = {
          ...payload,
          productImageUrl,
        };
      }

      const prices = payload.priceLists.map((p) => p.price);
      const foundDuplicates = findDuplicates(prices);

      if (foundDuplicates.length > 0) {
        throw new Error("Duplicate price!");
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
      await context.prisma.productCatalogueDetails.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "productCatalogueDetails",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateProductCatalogueDetails: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let payload = {
        ...params,
      };
      if (payload.productImageUrl && payload.productImageUrl.includes("data")) {
        let ContentType = base64MimeType(payload.productImageUrl);

        const mimeType = mime.getExtension(ContentType);
        const fileId = uuidv4();
        const filename = `${payload.description}_${fileId}.` + "zip";
        const buf = Buffer.from(
          payload.productImageUrl.split("base64,")[1],
          "base64"
        );
        const type = payload.productImageUrl.split(";")[0].split("/")[1];

        const PREFIX = "AgriFoodV2";

        if (!fs.existsSync(process.cwd() + "/static/cache/")) {
          fs.mkdirSync(process.cwd() + "/static/cache/");
        }
        if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
          fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
        }

        const productImageUrl =
          `/doa/cache/${PREFIX}/${filename}?t=` + new Date().toISOString();
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
        fs.writeFileSync(filePath, buf);

        payload = {
          ...payload,
          productImageUrl,
        };
      }

      const prices = payload.priceLists.map((p) => p.price);
      const foundDuplicates = findDuplicates(prices);

      if (foundDuplicates.length > 0) {
        throw new Error("Duplicate price!");
      }

      await context.prisma.productCatalogueDetails.update({
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
          tableName: "productCatalogueDetails",
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
    deleteProductCatalogueDetails: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData =
        await context.prisma.productCatalogueDetails.findUnique({
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

      await context.prisma.productCatalogueDetails.update({
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
          tableName: "productCatalogueDetails",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportsProductCatalogueDetails: async (self, params, context) => {
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

      if (params.productCatalogueUUID) {
        filterQuery = {
          ...filterQuery,
          productCatalogueUUID: params.productCatalogueUUID,
        };
      }

      // if (params.productSubCategoryUUID) {
      //   filterQuery = {
      //     ...filterQuery,
      //     productSubCategoryUUID: params.productSubCategoryUUID,
      //   };
      // }

      // if (params.unit) {
      //   filterQuery = {
      //     ...filterQuery,
      //     unit: params.unit,
      //   };
      // }

      let productCatalogueDetails =
        await context.prisma.productCatalogueDetails.findMany({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      let subCategory =
        await context.prisma.agrifoodProductSubCategory.findMany({
          where: {
            uuid: {
              in: productCatalogueDetails.map(
                (ret) => ret.productSubCategoryUUID
              ),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      const indexedSubCategory = subCategory.reduce((all, sub) => {
        if (!all[sub.uuid]) {
          all[sub.uuid] = {};
        }
        all[sub.uuid] = sub;
        return all;
      }, {});

      let unit = await context.prisma.unit.findMany({
        where: {
          name: {
            in: productCatalogueDetails.map((ret) => ret.unit),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      const indexedUnit = unit.reduce((all, unit) => {
        if (!all[unit.name]) {
          all[unit.name] = {};
        }
        all[unit.name] = unit;
        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Product Catalogue Details");

      let columnWidths = [];
      for (let c = 0; c < 10; c++) {
        columnWidths.push(30);
      }

      let thisLength = [];
      for (const prod of productCatalogueDetails) {
        thisLength.push(prod.priceLists.length);
      }
      let maxLength = Math.max(...thisLength);

      let additionals = [];
      for (let i = 0; i < maxLength; i++) {
        additionals.push(`Price ${i + 1}`);
      }

      let headerRow = [
        "PRODUCT CODE",
        "PRODUCT NAME",
        "SUB-CATEGORY",
        "NET WEIGHT",
        "UNIT",
      ];

      headerRow = [...headerRow, ...additionals];

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

      for (const prod of productCatalogueDetails) {
        const subCategory = indexedSubCategory[prod.productSubCategoryUUID];
        const unit = indexedUnit[prod.unit];

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: prod?.code || "",
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
          value: prod?.name || "",
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
          value: subCategory?.subCategoryNameEnglish || "",
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
          value: prod?.weight || "",
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

        for (const price of prod.priceLists) {
          excelHelper.addText({
            sheet: productionSheet,
            row: rowCounter,
            col: ++colCounter,
            value: price?.price || "",
            alignment: {
              vertical: "middle",
              horizontal: "left",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });
        }
        colCounter = 0;
        rowCounter += 1;
      }

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
      // const filename = `product_catalogue_details.xlsx`;
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
    tokenizedCreateProductCatalogueDetails: async (self, params, context) => {
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

      const { iat, ...payloadTokenized } = tokenized;

      let payload = {
        ...payloadTokenized,
      };

      if (!payload.companyUUID) {
        throw new Error("Please fill the company name fields");
      }

      if (!payload.productCategoryUUID) {
        throw new Error("Invalid Product Category");
      }
      if (!payload.productCatalogueUUID) {
        throw new Error("Invalid Product Catelogue");
      }

      if (payload.productImageUrl && payload.productImageUrl.includes("data")) {
        let ContentType = base64MimeType(payload.productImageUrl);

        const mimeType = mime.getExtension(ContentType);
        const fileId = uuidv4();
        const filename =
          `${payload.code}_${fileId}.` + mime.getExtension(ContentType);
        const buf = Buffer.from(
          payload.productImageUrl.split("base64,")[1],
          "base64"
        );
        const type = payload.productImageUrl.split(";")[0].split("/")[1];

        const PREFIX = "AgriFoodV2";

        if (!fs.existsSync(process.cwd() + "/static/cache/")) {
          fs.mkdirSync(process.cwd() + "/static/cache/");
        }
        if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
          fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
        }

        const productImageUrl =
          `/doa/cache/${PREFIX}/${filename}?t=` + new Date().toISOString();
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
        fs.writeFileSync(filePath, buf);

        payload = {
          ...payload,
          productImageUrl,
        };
      }

      const prices = payload.priceLists.map((p) => p.price);
      const foundDuplicates = findDuplicates(prices);

      if (foundDuplicates.length > 0) {
        throw new Error("Duplicate price!");
      }

      if (!payload.weight) {
        payload.weight = 0;
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
      await context.prisma.productCatalogueDetails.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "productCatalogueDetails",
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
    tokenizedUpdateProductCatalogueDetails: async (self, params, context) => {
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
        ...payloadTokenized
      } = tokenized;

      let payload = {
        ...payloadTokenized,
      };
      if (!payload.companyUUID) {
        throw new Error("Please fill the company name fields");
      }

      if (!payload.productCategoryUUID) {
        throw new Error("Invalid Product Category");
      }
      if (!payload.productCatalogueUUID) {
        throw new Error("Invalid Product Catelogue");
      }
      if (payload.productImageUrl && payload.productImageUrl.includes("data")) {
        let ContentType = base64MimeType(payload.productImageUrl);

        const mimeType = mime.getExtension(ContentType);
        const fileId = uuidv4();
        const filename =
          `${payload.description}_${fileId}.` + mime.getExtension(ContentType);
        const buf = Buffer.from(
          payload.productImageUrl.split("base64,")[1],
          "base64"
        );
        const type = payload.productImageUrl.split(";")[0].split("/")[1];

        const PREFIX = "AgriFoodV2";

        if (!fs.existsSync(process.cwd() + "/static/cache/")) {
          fs.mkdirSync(process.cwd() + "/static/cache/");
        }
        if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
          fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
        }

        const productImageUrl =
          `/doa/cache/${PREFIX}/${filename}?t=` + new Date().toISOString();
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
        fs.writeFileSync(filePath, buf);

        payload = {
          ...payload,
          productImageUrl,
        };
      }

      const prices = payload.priceLists.map((p) => p.price);
      const foundDuplicates = findDuplicates(prices);

      if (foundDuplicates.length > 0) {
        throw new Error("Duplicate price!");
      }

      if (!payload.weight) {
        payload.weight = 0;
      }

      await context.prisma.productCatalogueDetails.update({
        where: {
          uuid: payloadTokenized.uuid,
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
          tableName: "productCatalogueDetails",
          log: {
            uuid: payloadTokenized.uuid,
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
    tokenizedDeleteProductCatalogueDetails: async (self, params, context) => {
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
        await context.prisma.productCatalogueDetails.findUnique({
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

      await context.prisma.productCatalogueDetails.update({
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
          tableName: "productCatalogueDetails",
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
    generateProductCatalogueDetails: async (self, params, context) => {
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
      const existedDetails =
        await context.prisma.productCatalogueDetails.findMany({
          where: {
            companyUUID: params.companyUUID,
            productCategoryUUID: params.productCategoryUUID,
            productSubCategoryUUID: params.productSubCategoryUUID,
            unitUUID: params.unitUUID,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            name: "asc",
          },
        });

      let latestCode = await context.prisma.productCatalogueDetails.findMany({
        where: {
          companyUUID: params.companyUUID,
          productCategoryUUID: params.productCategoryUUID,
          productSubCategoryUUID: params.productSubCategoryUUID,
          unitUUID: params.unitUUID,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          code: "desc",
        },
        take: 2,
      });
      if (latestCode.length === 0) {
        throw new Error("Invalid Code!!");
      }

      const company = await context.prisma.agrifoodCompanyProfile.findUnique({
        where: {
          uuid: params.companyUUID,
        },
      });

      const productCategory =
        await context.prisma.agrifoodProductCategory.findUnique({
          where: {
            uuid: params.productCategoryUUID,
          },
        });

      const productSubCategory =
        await context.prisma.agrifoodProductSubCategory.findUnique({
          where: {
            uuid: params.productSubCategoryUUID,
          },
        });

      const unit = await context.prisma.unit.findUnique({
        where: {
          uuid: params.unitUUID,
        },
      });

      let newData = [];
      latestCode = latestCode[0].code;
      for (let i = 0; i < params.dataWouldInserted; i++) {
        let priceLists = [];

        for (let p = 0; p < 12; p++) {
          priceLists.push({
            uuid: uuidv4(),
            price: 0,
          });
        }

        const code = incrementCode(latestCode);
        latestCode = code;

        newData.push({
          uuid: "IMPORT-" + uuidv4(),
          productCatalogueUUID: params.productCatalogueUUID,
          companyUUID: params.companyUUID,
          companyName: company.companyName,
          productCategoryUUID: params.productCategoryUUID,
          productCategory: productCategory.productNameEnglish,
          code: latestCode,
          priceLists,
          productSubCategoryUUID: params.productSubCategoryUUID,
          productSubCategory: productSubCategory.subCategoryNameEnglish,
          unitUUID: unit.uuid,
          unit: unit.name,
          name: "",
          weight: 0,
          rawMaterial: "",
          sku: "",
          productImageUrl: "",
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
        });
      }
      if (newData.length === 0) {
        throw new Error("ERR");
      }

      const combinedDetails = [...existedDetails, ...newData];

      let headerRow = [
        "uuid",
        "company_uuid",
        "company_name",
        "product_category_uuid",
        "product_category",
        "product_sub_category_uuid",
        "product_sub_category",
        "product_catalogue_uuid",
        "sku",
        "product_name",
        "product_code",
        "weight",
        "unit_uuid",
        "unit",
        "price_1",
        "price_2",
        "price_3",
        "price_4",
        "price_5",
        "price_6",
        "price_7",
        "price_8",
        "price_9",
        "price_10",
        "price_11",
        "price_12",
        "raw_material",
      ];
      let columnWidths = [];
      for (let c = 0; c < headerRow.length; c++) {
        columnWidths.push(15);
      }

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Catalogue Details");

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
          value: data,
          alignment: {
            vertical: "middle",
            horizontal: "center",
          },
          borderStyle: excelHelper.BorderStyle.Thin,
        });
      });

      let rowCounter = 2;
      colCounter = 0;

      for (let combine of combinedDetails) {
        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: combine.uuid,
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
          value: combine.companyUUID,
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
          value: combine.companyName,
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
          value: combine.productCategoryUUID,
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
          value: combine.productCategory,
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
          value: combine.productSubCategoryUUID,
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
          value: combine.productSubCategory,
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
          value: combine.productCatalogueUUID,
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
          value: combine.sku,
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
          value: combine.name,
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
          value: combine.code,
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
          value: combine.weight,
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
          value: combine.unitUUID,
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
          value: combine.unit,
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        for (const price of combine.priceLists) {
          excelHelper.addText({
            sheet: productionSheet,
            row: rowCounter,
            col: ++colCounter,
            value: price.price,
            alignment: {
              vertical: "middle",
              horizontal: "left",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });
        }
        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: combine.rawMaterial,
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
      const filename = `agrifood_catalogue_details.xlsx`;
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
      return fileUrl;
    },
    resyncProductCodeCatalogueDetails: async (self, params, context) => {
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
      const foundCatalogue = await context.prisma.productCatalogue.findUnique({
        where: {
          uuid: params.productCatalogueUUID,
        },
      });

      const foundDuplicates = await context.prisma.productCatalogue.findMany({
        where: {
          code: foundCatalogue.code,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      if (foundDuplicates.length > 1) {
        throw new Error(`Duplicate catalogue code ${foundCatalogue.code}`);
      }

      const foundCatalogueDetails =
        await context.prisma.productCatalogueDetails.findMany({
          where: {
            productCatalogueUUID: params.productCatalogueUUID,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            code: "asc",
          },
        });

      const catalogueCode = foundCatalogue.code + "000";
      // console.log("this code", catalogueCode);

      let catalogueLength = 0;
      for (let catalogueDetail of foundCatalogueDetails) {
        const catalogueDetailsLength = String(catalogueLength + 1);
        catalogueLength += 1;
        // console.log(
        //   "code",
        //   catalogueCode.slice(0, -catalogueDetailsLength.length) +
        //     catalogueLength
        // );
        await context.prisma.productCatalogueDetails.update({
          where: {
            uuid: catalogueDetail.uuid,
          },
          data: {
            code:
              catalogueCode.slice(0, -catalogueDetailsLength.length) +
              catalogueLength,
            updatedAt: new Date().toISOString(),
            updatedBy: context.activeSession.User,
          },
        });
      }

      return "success";
    },
  },
  ProductCatalogueDetails: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    priceLists: (self) => (self.priceLists ? self.priceLists : []),
  },
};
exports.resolvers = resolvers;

const base64MimeType = (encoded) => {
  var result = null;

  if (typeof encoded !== "string") {
    return result;
  }

  var mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
  if (mime && mime.length) {
    result = mime[1];
  }

  return result;
};

const findDuplicates = (arr) =>
  arr.filter((item, index) => arr.indexOf(item) !== index);

const separateParts = (input) => {
  const letters = input.match(/[A-Za-z]+/g)?.join("") || "";
  const numbers = input.match(/\d+/g)?.join("") || "";
  return { letters, numbers };
};

const incrementCode = (code) => {
  const { letters, numbers } = separateParts(code);
  if (numbers) {
    const incrementedNumber = (parseInt(numbers, 10) + 1)
      .toString()
      .padStart(numbers.length, "0");
    return letters + incrementedNumber;
  } else {
    // If there are no numbers, just return the original code
    return code;
  }
};
