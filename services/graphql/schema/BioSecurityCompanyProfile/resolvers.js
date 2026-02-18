const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const mime = require("mime");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;

const resolvers = {
  Query: {
    allBioSecurityCompanyProfiles: async (self, params, context) => {
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
        !role.privileges.includes("Company Profile Profiling Bio Security:Read")
      ) {
        return [];
      }

      let queryResult = await context.prisma.bioSecurityCompanyProfile.findMany(
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
    countBioSecurityCompanyProfiles: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let filterQuery = {};
      let searchQuery = [];
      if (params.filters) {
        searchQuery = JSON.parse(params.filters);
      }

      for (const filtered of searchQuery) {
        if (filtered.id === "companyRegNo") {
          filterQuery = {
            ...filterQuery,
            companyRegNo: {
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
        } else if (filtered.id === "companyOwnerName") {
          filterQuery = {
            ...filterQuery,
            companyOwnerName: {
              contains: filtered.value,
            },
          };
        }
      }

      let queryResult = await context.prisma.bioSecurityCompanyProfile.count({
        where: {
          ...filterQuery,
        },
      });
      return queryResult;
    },
    getBioSecurityCompanyProfilesByCompanyRegNo: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);

      let query = {};

      if (params.type === "COMPANY") {
        query = {
          companyRegNo: params.companyRegNo,
        };
      } else if (params.type === "CROPS") {
        query = {
          companyCropRegNo: params.companyRegNo,
        };
      } else if (params.type === "ANIMAL") {
        query = {
          companyAnimalRegNo: params.companyRegNo,
        };
      }
      if (Object.keys(query).length === 0 || !params.companyRegNo) {
        throw new Error("Invalid Registration Number!");
      }

      let found = await context.prisma.bioSecurityCompanyProfile.findMany({
        where: {
          ...query,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        take: 1,
        orderBy: {
          id: "desc",
        },
      });
      if (found.length > 0) {
        found[0] = {
          ...found[0],
          registrationNumber:
            params.type === "COMPANY"
              ? found[0].companyRegNo
              : params.type === "CROPS"
              ? found[0].companyCropRegNo
              : found[0].companyAnimalRegNo,
        };
        return found[0];
      }

      throw new Error("Company Not Found..");
    },
    getBioSecurityCompanyProfilesByUUID: async (self, params, context) => {
      let found = await context.prisma.bioSecurityCompanyProfile.findMany({
        where: {
          uuid: params.uuid,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        take: 1,
        orderBy: {
          id: "desc",
        },
      });
      if (found.length > 0) {
        return found[0];
      }
      throw new Error("Company Not Found..");
    },
    tokenizedAllBioSecurityCompanyProfiles: async (Self, params, context) => {
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
      //   !role.privileges.includes("Company Profile Profiling Bio Security:Read")
      // ) {
      //   return [];
      // }

      let queryResult = await context.prisma.bioSecurityCompanyProfile.findMany(
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

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    tokenizedGetBioSecurityCompanyProfilesByCompanyRegNo: async (
      self,
      params,
      context
    ) => {
      const tokenized = jwt.verify(params.tokenizedParams, TOKENIZE);

      const { iat, ...payload } = tokenized;

      let found = await context.prisma.bioSecurityCompanyProfile.findMany({
        where: {
          companyRegNo: payload.companyRegNo,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        take: 1,
        orderBy: {
          id: "desc",
        },
      });

      found = found.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
        };
      });

      if (found.length > 0) {
        const payload = {
          ...found[0],
        };

        let token = jwt.sign(payload, TOKENIZE);
        return token;

        // return found[0];
      }

      throw new Error("Company Not Found..");
    },
    tokenizedAllBioSecurityCompanyProfilesPaginated: async (
      self,
      params,
      context
    ) => {
      assertValidSession(context.activeSession);
      let filterQuery = {};
      let searchQuery = [];
      if (params.filters) {
        searchQuery = JSON.parse(params.filters);
      }

      for (const filtered of searchQuery) {
        if (filtered.id === "companyRegNo") {
          filterQuery = {
            ...filterQuery,
            companyRegNo: {
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
        } else if (filtered.id === "companyOwnerName") {
          filterQuery = {
            ...filterQuery,
            companyOwnerName: {
              contains: filtered.value,
            },
          };
        }
      }

      let queryResult = await context.prisma.bioSecurityCompanyProfile.findMany(
        {
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
          skip: params.pageIndex * params.pageSize,
          take: params.pageSize,
        }
      );

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
    searchAllBioSecurityCompanyProfiles: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let filterQuery = {};
      if (params.name) {
        filterQuery = {
          companyName: {
            contains: params.name,
          },
        };
      } else {
        filterQuery = {
          uuid: "none",
        };
      }
      let queryResult = await context.prisma.bioSecurityCompanyProfile.findMany(
        {
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
          take: 20,
        }
      );

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
    createBioSecurityCompanyProfile: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let payload = params.input;

      if (!payload.companyRegNo) {
        throw new Error("Company Reg No");
      }
      const foundDuplicate =
        await context.prisma.bioSecurityCompanyProfile.findMany({
          where: {
            companyRegNo: payload.companyRegNo,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          take: 1,
        });

      if (foundDuplicate.length > 0) {
        throw new Error("Duplicate company reg no");
      }
      let latestNumber = await context.prisma.profileIdGenerator.findMany({
        where: {
          menu: "Bio Security Company Profile",
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
            menu: "Bio Security Company Profile",
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

      let startCode = "BSC000";
      const dataLength = "" + counter;
      const last = dataLength.length * -1;
      startCode = startCode.slice(0, last) + counter;
      payload.companyId = startCode;

      if (payload.uploadFile && payload.uploadFile.includes("data")) {
        let ContentType = base64MimeType(payload.uploadFile);

        if (ContentType === "application/wps-office.docx") {
          ContentType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        const mimeType = mime.getExtension(ContentType);
        const fileId = uuidv4();
        const filename = `${fileId}.` + "zip";
        const buf = Buffer.from(
          payload.uploadFile.split("base64,")[1],
          "base64"
        );
        const type = payload.uploadFile.split(";")[0].split("/")[1];

        const PREFIX = "AgriFoodV2";

        if (!fs.existsSync(process.cwd() + "/static/cache/")) {
          fs.mkdirSync(process.cwd() + "/static/cache/");
        }
        if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
          fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
        }

        const uploadFile =
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
        fs.writeFileSync(filePath, buf);

        payload = {
          ...payload,
          uploadFile,
        };
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
      await context.prisma.bioSecurityCompanyProfile.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "bioSecurityCompanyProfile",
          log: {
            ...createPayload,
          },
        },
      });
      return "success";
    },
    updateBioSecurityCompanyProfile: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let payload = params.input;

      if (payload.uploadFile && payload.uploadFile.includes("data")) {
        let ContentType = base64MimeType(payload.uploadFile);

        if (ContentType === "application/wps-office.docx") {
          ContentType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        const mimeType = mime.getExtension(ContentType);
        const fileId = uuidv4();
        const filename = `${payload.description}_${fileId}.` + "zip";
        const buf = Buffer.from(
          payload.uploadFile.split("base64,")[1],
          "base64"
        );
        const type = payload.uploadFile.split(";")[0].split("/")[1];

        const PREFIX = "AgriFoodV2";

        if (!fs.existsSync(process.cwd() + "/static/cache/")) {
          fs.mkdirSync(process.cwd() + "/static/cache/");
        }
        if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
          fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
        }

        const uploadFile =
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
        fs.writeFileSync(filePath, buf);

        payload = {
          ...payload,
          uploadFile,
        };
      }

      await context.prisma.bioSecurityCompanyProfile.update({
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
          tableName: "bioSecurityCompanyProfile",
          log: {
            ...payload,
            uuid: params.uuid,
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
    deleteBioSecurityCompanyProfile: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData =
        await context.prisma.bioSecurityCompanyProfile.findUnique({
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

      await context.prisma.bioSecurityCompanyProfile.update({
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
          tableName: "bioSecurityCompanyProfile",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportBioSecurityCompanyProfile: async (self, params, context) => {
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
      let companyProfiles =
        await context.prisma.bioSecurityCompanyProfile.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      let bioSecurityTypeOfComodity =
        await context.prisma.bioSecurityTypeOfComodity.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      const indexedBioSecurityTypeOfComodity = bioSecurityTypeOfComodity.reduce(
        (all, comm) => {
          if (!all[comm.uuid]) {
            all[comm.uuid] = {};
          }
          all[comm.uuid] = comm;
          return all;
        },
        {}
      );

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Company Profile");

      let headerRow = [
        "COMPANY STATUS",
        "COMPANY ID",
        "COMPANY REGISTRATION NO",
        "COMPANY REGISTRATION NO (CROP)",
        "COMPANY REGISTRATION NO (ANIMAL)",
        "REGISTERED DATE",
        "REGISTERED DATE (CROP)",
        "RENEWAL DATE (CROP)",
        "REGISTERED DATE (ANIMAL)",
        "RENEWAL DATE (ANIMAL)",
        "COMPANY NAME",
        "COMPANY'S OWNER NAME",
        "IC NO",
        "CONTACT DETAILS",
        "COMPANY ADDRESS",
        "FILED / PREMISES / FACTORY ADDRESS (FORE MORE THAN 1)",
        "APPROVED CATEGORIES OF COMMODITIES",
        "APPROVED SUPPLIER / EXPORTERS",
        "APPROVED SUPPLIER / EXPORTERS ADDRESS",
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

      for (const companyProfile of companyProfiles) {
        let typeOfComodity = "";

        if (
          companyProfile.typeOfComodityIds &&
          companyProfile.typeOfComodityIds.length > 0
        ) {
          for (let typeOfComm of companyProfile.typeOfComodityIds) {
            let comm = null;
            if (indexedBioSecurityTypeOfComodity[typeOfComm]) {
              comm = indexedBioSecurityTypeOfComodity[typeOfComm];
            }
            if (comm) {
              typeOfComodity += `${comm.name}, `;
            }
          }
        }

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: companyProfile?.status || "",
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
          value: companyProfile?.companyId || "",
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
          value: companyProfile?.companyRegNo || "",
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
          value: companyProfile?.companyCropRegNo || "",
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
          value: companyProfile?.companyAnimalRegNo || "",
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
          value: companyProfile?.companyRegDate || "",
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
          value: companyProfile?.companyCropRegDate || "",
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
          value: companyProfile?.companyCropRenewalDate || "",
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
          value: companyProfile?.companyAnimalRegDate || "",
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
          value: companyProfile?.companyAnimalRenewalDate || "",
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
          value: companyProfile?.companyName || "",
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
          value: companyProfile?.companyOwnerName || "",
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
          value: String(companyProfile?.icNo || ""),
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
          value: companyProfile?.contactDetails || "",
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
          value: companyProfile?.companyAddress || "",
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
          value: companyProfile?.otherAddress || "",
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
          value: typeOfComodity || "",
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
          value: companyProfile?.approvedSuppliers || "",
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
          value: companyProfile?.approvedSupplirersAddress || "",
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
      const filename = `company_profile.xlsx`;
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
      // const fileUrlBase64 = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${fileBuffer.toString(
      //   "base64"
      // )}`;

      // // throw {};
      // // return fileUrl;
      // return fileUrlBase64;
    },
    tokenizedCreateBioSecurityCompanyProfile: async (self, params, context) => {
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

      let payload = payloadTokenized.formData;

      if (!payload.companyRegNo) {
        throw new Error("Company Reg No");
      }
      const foundDuplicateCompanyRegNo =
        await context.prisma.bioSecurityCompanyProfile.findMany({
          where: {
            companyRegNo: payload.companyRegNo,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          take: 1,
        });

      if (foundDuplicateCompanyRegNo.length > 0) {
        throw new Error("Duplicate company reg no");
      }

      if (payload.companyAnimalRegNo) {
        const foundDuplicateCompanyAnimalRegNo =
          await context.prisma.bioSecurityCompanyProfile.findMany({
            where: {
              companyAnimalRegNo: payload.companyAnimalRegNo,
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
            take: 1,
          });

        if (foundDuplicateCompanyAnimalRegNo.length > 0) {
          throw new Error("Duplicate company reg no (animal)");
        }
      }

      if (payload.companyCropRegNo) {
        const foundDuplicateCompanyCropsRegNo =
          await context.prisma.bioSecurityCompanyProfile.findMany({
            where: {
              companyCropRegNo: payload.companyCropRegNo,
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
            take: 1,
          });

        if (foundDuplicateCompanyCropsRegNo.length > 0) {
          throw new Error("Duplicate company reg no (crop)");
        }
      }

      let latestNumber = await context.prisma.profileIdGenerator.findMany({
        where: {
          menu: "Bio Security Company Profile",
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
            menu: "Bio Security Company Profile",
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

      let startCode = "BSC000";
      const dataLength = "" + counter;
      const last = dataLength.length * -1;
      startCode = startCode.slice(0, last) + counter;
      payload.companyId = startCode;

      if (payload.uploadFile && payload.uploadFile.includes("data")) {
        let ContentType = base64MimeType(payload.uploadFile);

        if (ContentType === "application/wps-office.docx") {
          ContentType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        const mimeType = mime.getExtension(ContentType);
        const fileId = uuidv4();
        const filename = `${fileId}.` + "zip";
        const buf = Buffer.from(
          payload.uploadFile.split("base64,")[1],
          "base64"
        );
        const type = payload.uploadFile.split(";")[0].split("/")[1];

        const PREFIX = "AgriFoodV2";

        if (!fs.existsSync(process.cwd() + "/static/cache/")) {
          fs.mkdirSync(process.cwd() + "/static/cache/");
        }
        if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
          fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
        }

        const uploadFile =
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
        fs.writeFileSync(filePath, buf);

        payload = {
          ...payload,
          uploadFile,
        };
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
      await context.prisma.bioSecurityCompanyProfile.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "bioSecurityCompanyProfile",
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
    tokenizedUpdateBioSecurityCompanyProfile: async (self, params, context) => {
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
        ...payloadTokenized
      } = tokenized;

      let payload = payloadTokenized;

      if (payload.uploadFile && payload.uploadFile.includes("data")) {
        let ContentType = base64MimeType(payload.uploadFile);

        if (ContentType === "application/wps-office.docx") {
          ContentType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        const mimeType = mime.getExtension(ContentType);
        const fileId = uuidv4();
        const filename = `${payload.description}_${fileId}.` + "zip";
        const buf = Buffer.from(
          payload.uploadFile.split("base64,")[1],
          "base64"
        );
        const type = payload.uploadFile.split(";")[0].split("/")[1];

        const PREFIX = "AgriFoodV2";

        if (!fs.existsSync(process.cwd() + "/static/cache/")) {
          fs.mkdirSync(process.cwd() + "/static/cache/");
        }
        if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
          fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
        }

        const uploadFile =
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
        fs.writeFileSync(filePath, buf);

        payload = {
          ...payload,
          uploadFile,
        };
      }

      await context.prisma.bioSecurityCompanyProfile.update({
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
          tableName: "bioSecurityCompanyProfile",
          log: {
            ...payload,
            uuid: payload.uuid,
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
    tokenizedDeleteBioSecurityCompanyProfile: async (self, params, context) => {
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
        await context.prisma.bioSecurityCompanyProfile.findUnique({
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

      await context.prisma.bioSecurityCompanyProfile.update({
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
          tableName: "bioSecurityCompanyProfile",
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
  BioSecurityCompanyProfile: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
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
