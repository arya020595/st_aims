const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const GraphQLJSON = require("graphql-type-json");
const mime = require("mime");
const fs = require("fs");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const path = require("path");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const TOKENIZE = process.env.TOKENIZE;
const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    allAgrifoodCompanyProfiles: async (self, params, context) => {
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
        !role.privileges.includes("Company Profile Profiling Agrifood:Read")
      ) {
        return [];
      }

      let queryResult = await context.prisma.agrifoodCompanyProfile.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      return queryResult;
    },
    countAgrifoodCompanyProfiles: async (self, params, context) => {
      assertValidSession(context.activeSession);
      let filterQuery = {};
      let searchQuery = [];
      if (params.filters) {
        searchQuery = JSON.parse(params.filters);
      }

      let profileQuery = {};

      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
        //   icPassportNo: context.activeSession.User.icNo,
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
      }

      for (const filtered of searchQuery) {
        if (filtered.id === "companyName") {
          filterQuery = {
            ...filterQuery,
            companyName: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "companyRegNo") {
          filterQuery = {
            ...filterQuery,
            companyRegNo: {
              contains: filtered.value,
            },
          };
        }
      }

      let queryResult = await context.prisma.agrifoodCompanyProfile.count({
        where: {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
          ...profileQuery,
        },
      });

      return queryResult;
    },
    tokenizedAllAgrifoodCompanyProfiles: async (self, params, context) => {
      assertValidSession(context.activeSession);
      let filterQuery = {};
      let searchQuery = [];
      if (params.filters) {
        searchQuery = JSON.parse(params.filters);
      }

      let profileQuery = {};

      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
        //   icPassportNo: context.activeSession.User.icNo,
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
      }

      for (const filtered of searchQuery) {
        if (filtered.id === "companyName") {
          filterQuery = {
            ...filterQuery,
            companyName: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "companyRegNo") {
          filterQuery = {
            ...filterQuery,
            companyRegNo: {
              contains: filtered.value,
            },
          };
        }
      }

      let paginatedQuery = {};
      if (params.pageIndex || params.pageSize) {
        paginatedQuery = {
          skip: params.pageIndex * params.pageSize,
          take: params.pageSize,
        };
      }
      let queryResult = await context.prisma.agrifoodCompanyProfile.findMany({
        where: {
          ...filterQuery,
          ...profileQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
        ...paginatedQuery,
        // skip: params.pageIndex * params.pageSize,
        // take: params.pageSize
      });

      queryResult = queryResult.map((ret) => {
        return {
          ...ret,
          machineryIds: ret.machineryIds || [],
        };
      });

      let machineryIds = [];
      for (const machineId of queryResult.map((q) => q.machineryIds)) {
        machineryIds.push(...machineId);
      }
      let machinery = [];
      if (machineryIds.length > 0) {
        machinery = await context.prisma.machinery.findMany({
          where: {
            uuid: {
              // in: queryResult.map((ret) => ret.machineryIds),
              in: machineryIds,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      }

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);

        let mobileNo = "" + (q.mobileNo || 0);

        let telephoneNo = "" + (q.telephoneNo || 0);

        let dateOfBirth = dayjs(q.dateOfBirth).format("YYYY-MM-DD");

        let companyRegDate = dayjs(q.companyRegDate).format("YYYY-MM-DD");

        let machineryNames = "";

        if (q.machineryIds.length !== 0) {
          const filteredMachinery = machinery.filter(
            (ret) => ret.uuid === q.machineryIds
          );
          const results = filteredMachinery.map((q) => q.machineName);
          machineryNames = results.join(",");
        }

        let totalAssets = q.totalAssets || 0;
        let totalAnnualRevenue = q.totalAnnualRevenue || 0;

        return {
          ...q,
          id: id.toString(),
          mobileNo: mobileNo.toString(),
          telephoneNo: telephoneNo.toString(),
          dateOfBirth,
          companyRegDate,
          machineryNames,
          totalAssets,
          totalAnnualRevenue,
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    searchAllAgrifoodCompanyProfiles: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let profileQuery = {};
      if (params.name) {
        profileQuery = {
          ...profileQuery,
          companyName: {
            startsWith: params.name,
          },
        };
      }
      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   ...profileQuery,
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
        //   icPassportNo: context.activeSession.User.icNo,
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
      }

      let queryResult = await context.prisma.agrifoodCompanyProfile.findMany({
        where: {
          ...profileQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
        take: 20,
      });

      if (queryResult.length === 0) {
        if (params.name) {
          profileQuery = {
            ...profileQuery,
            companyName: {
              contains: params.name,
            },
          };
        }
        queryResult = await context.prisma.agrifoodCompanyProfile.findMany({
          where: {
            ...profileQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
          take: 20,
        });
      }

      queryResult = queryResult.map((ret) => {
        return {
          ...ret,
          machineryIds: ret.machineryIds || [],
        };
      });

      let machineryIds = [];
      for (const machineId of queryResult.map((q) => q.machineryIds)) {
        machineryIds.push(...machineId);
      }
      let machinery = [];
      if (machineryIds.length > 0) {
        machinery = await context.prisma.machinery.findMany({
          where: {
            uuid: {
              // in: queryResult.map((ret) => ret.machineryIds),
              in: machineryIds,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      }

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);

        let mobileNo = "" + (q.mobileNo || 0);

        let telephoneNo = "" + (q.telephoneNo || 0);

        let dateOfBirth = dayjs(q.dateOfBirth).format("YYYY-MM-DD");

        let companyRegDate = dayjs(q.companyRegDate).format("YYYY-MM-DD");

        let machineryNames = "";

        if (q.machineryIds.length !== 0) {
          const filteredMachinery = machinery.filter(
            (ret) => ret.uuid === q.machineryIds
          );
          const results = filteredMachinery.map((q) => q.machineName);
          machineryNames = results.join(",");
        }

        return {
          ...q,
          id: id.toString(),
          mobileNo: mobileNo.toString(),
          telephoneNo: telephoneNo.toString(),
          dateOfBirth,
          companyRegDate,
          machineryNames,
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    getAgrifoodCompanyProfile: async (self, params, context) => {
      assertValidSession(context.activeSession);
      const queryResult =
        await context.prisma.agrifoodCompanyProfile.findUnique({
          where: {
            uuid: params.uuid,
          },
        });
      return queryResult;
    },
  },
  Mutation: {
    createAgrifoodCompanyProfile: async (self, params, context) => {
      assertValidSession(context.activeSession);
      let payload = params.input;

      for (let p of Object.keys(payload)) {
        if (p === "mobileNo" || p === "telephoneNo") {
          if (payload[p]) {
            payload[p] = "" + payload[p];
          } else {
            payload[p] = "" + 0;
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
          p === "skilledForeigner" ||
          p === "unskilledForeigner"
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

      if (payload.uploadFile) {
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

      if (payload.machineryIds) {
        delete payload.machineryIds;
      }

      const foundDuplicate =
        await context.prisma.agrifoodCompanyProfile.findMany({
          where: {
            rocbnRegNo: payload.rocbnRegNo,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          take: 1,
        });

      if (foundDuplicate.length !== 0) {
        throw new Error("Duplicate ROCBN");
      }

      let latestNumber = await context.prisma.profileIdGenerator.findMany({
        where: {
          menu: "Agrifood Company Profile",
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
            menu: "Agrifood Company Profile",
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

      let startCode = "AG000";
      const dataLength = "" + counter;
      const last = dataLength.length * -1;
      startCode = startCode.slice(0, last) + counter;
      payload.companyId = startCode;

      const foundExistingCode =
        await context.prisma.agrifoodCompanyProfile.findMany({
          where: {
            companyId: payload.companyId,
          },
          take: 1,
        });

      if (foundExistingCode.length >= 1) {
        throw new Error("Exisiting Company Profile Code..!");
      }

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

      if (!payload.typeCompanyRegId) {
        createPayload.typeCompanyRegId = "";
        createPayload.typeCompanyRegName = "";
      }

      if (!payload.companyRegDate) {
        createPayload.companyRegDate = "";
      }

      if (!payload.companyStatusId) {
        createPayload.companyStatusId = "";
        createPayload.companyStatusName = "";
      }

      if (!payload.raceId) {
        createPayload.raceId = "";
        createPayload.raceName = "";
      }

      if (!payload.currStatusId) {
        createPayload.currStatusId = "";
        createPayload.currStatusName = "";
      }

      await context.prisma.agrifoodCompanyProfile.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "agrifoodCompanyProfile",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateAgrifoodCompanyProfile: async (self, params, context) => {
      assertValidSession(context.activeSession);
      let payload = params.input;

      for (let p of Object.keys(payload)) {
        if (p === "mobileNo" || p === "telephoneNo") {
          if (payload[p]) {
            payload[p] = "" + payload[p];
          } else {
            payload[p] = "" + 0;
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
          p === "skilledForeigner" ||
          p === "unskilledForeigner"
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

      if (payload.uploadFile) {
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

      if (payload.machineryIds) {
        delete payload.machineryIds;
      }

      if (!payload.typeCompanyRegId) {
        payload.typeCompanyRegId = "";
        payload.typeCompanyRegName = "";
      }

      if (!payload.companyRegDate) {
        payload.companyRegDate = "";
      }

      if (!payload.companyStatusId) {
        payload.companyStatusId = "";
        payload.companyStatusName = "";
      }

      if (!payload.raceId) {
        payload.raceId = "";
        payload.raceName = "";
      }

      if (!payload.currStatusId) {
        payload.currStatusId = "";
        payload.currStatusName = "";
      }

      await context.prisma.agrifoodCompanyProfile.update({
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
          tableName: "agrifoodCompanyProfile",
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
    deleteAgrifoodCompanyProfile: async (self, params, context) => {
      assertValidSession(context.activeSession);
      let getDeletedData =
        await context.prisma.agrifoodCompanyProfile.findUnique({
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
      await context.prisma.agrifoodCompanyProfile.update({
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
          tableName: "agrifoodCompanyProfile",
          log: {
            ...getDeletedData,
          },
        },
      });

      return "success";
    },
    exportAgrifoodCompanyProfile: async (self, params, context) => {
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
        await context.prisma.agrifoodCompanyProfile.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      let typeCompanyRegUUIDs = companyProfiles
        .filter((c) => c.typeCompanyRegId)
        .map((ret) => ret.typeCompanyRegId);

      typeCompanyRegUUIDs = lodash.uniq(typeCompanyRegUUIDs);
      let typeCompanyReg = await context.prisma.typeCompanyReg.findMany({
        where: {
          uuid: {
            in: typeCompanyRegUUIDs,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedTypeCompanyRegId = typeCompanyReg.reduce((all, company) => {
        if (!all[company.uuid]) {
          all[company.uuid] = {};
        }
        all[company.uuid] = company;
        return all;
      }, {});

      let positionUUIDs = companyProfiles
        .filter((c) => c.positionUUID)
        .map((ret) => ret.positionUUID);

      positionUUIDs = lodash.uniq(positionUUIDs);
      let position = await context.prisma.position.findMany({
        where: {
          uuid: {
            in: positionUUIDs,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedPosition = position.reduce((all, pos) => {
        if (!all[pos.uuid]) {
          all[pos.uuid] = {};
        }
        all[pos.uuid] = pos;
        return all;
      }, {});

      let raceUUIDs = companyProfiles
        .filter((c) => c.raceId)
        .map((ret) => ret.raceId);

      raceUUIDs = lodash.uniq(raceUUIDs);
      let race = await context.prisma.race.findMany({
        where: {
          uuid: {
            in: raceUUIDs,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedRace = race.reduce((all, rec) => {
        if (!all[rec.uuid]) {
          all[rec.uuid] = {};
        }
        all[rec.uuid] = rec;
        return all;
      }, {});

      let companyStatusUUIDs = companyProfiles
        .filter((c) => c.companyStatusId)
        .map((ret) => ret.companyStatusId);

      companyStatusUUIDs = lodash.uniq(companyStatusUUIDs);
      let companyStatus = await context.prisma.companyStatus.findMany({
        where: {
          uuid: {
            in: companyStatusUUIDs,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedCompanyStatus = companyStatus.reduce((all, stat) => {
        if (!all[stat.uuid]) {
          all[stat.uuid] = {};
        }
        all[stat.uuid] = stat;
        return all;
      }, {});

      let currentStatusUUIDs = companyProfiles
        .filter((c) => c.currStatusId)
        .map((ret) => ret.currStatusId);

      currentStatusUUIDs = lodash.uniq(currentStatusUUIDs);

      let currentStatus = await context.prisma.currentStatus.findMany({
        where: {
          uuid: {
            in: currentStatusUUIDs,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedCurrentStatus = currentStatus.reduce((all, stat) => {
        if (!all[stat.uuid]) {
          all[stat.uuid] = {};
        }
        all[stat.uuid] = stat;
        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Company Profile");

      let headerRow = [
        "COMPANY NAME",
        "COMPANY ID",
        "TYPES OF REGISTRATION",
        "COMPANY REGISTRATION DATE",
        "COMPANY REGISTRATION NUMBER",
        "ROCBN REGISTRATION NUMBER",
        "COMPANY ADDRESS",
        "MAILING ADDRESS",
        "SOCIAL MEDIA ACCOUNT",
        "SME CATEGORY",
        "MANAGER NAME",
        "POSITION",
        "IC NO / PASPORT NO",
        "MOBILE NO",
        "RACE",
        "EMAIL ADDRESS",
        "DATE OF BIRTH",
        "IC COLOUR",
        "TELEPHONE NO",
        "GENDER",
        "DIRECTOR / SHAREHOLDER / BOARD MEMBER / OFFICIAL MEMBER /  ",
        "COMPANY STATUS",
        "UNSKILLED LOCAL",
        "SEMI SKILLED LOCAL",
        "SKILLED LOCAL",
        "EXPERT LOCAL",
        "NO OF LABOUR TOTAL",
        "UNSKILLED FOREIGNER",
        "SEMI SKILLED FOREIGNER",
        "SKILLED FOREIGNER",
        "EXPERT FOREIGNER",
        "NO OF LABOUR FOREIGNER TOTAL",
        "SUPPORT PROGRAMME / TRAINING ",
        "CURRENT STATUS",
        "REMARKS",
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
        const typeCompanyReg =
          indexedTypeCompanyRegId[companyProfile.typeCompanyRegId];
        const position = indexedPosition[companyProfile.positionUUID];
        const race = indexedRace[companyProfile.raceId];
        const companyStatus =
          indexedCompanyStatus[companyProfile.companyStatusId];
        const currentStatus = indexedCurrentStatus[companyProfile.currStatusId];

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
          value: typeCompanyReg?.typesOfCompany || "",
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
          value: companyProfile?.rocbnRegNo || "",
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
          value: companyProfile?.mailingAddress || "",
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
          value: companyProfile?.socialMediaAcc || "",
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
          value: companyProfile?.smeCategory || "",
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
          value: companyProfile?.managerName || "",
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
          value: position?.name || "",
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
          value: companyProfile?.icPassportNo || "",
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
          value: String(companyProfile?.mobileNo || ""),
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
          value: race?.race || "",
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
          value: companyProfile?.emailAddress || "",
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
          value: companyProfile?.dateOfBirth || "",
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
          value: companyProfile?.icColour || "",
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
          value: String(companyProfile?.telephoneNo || ""),
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
          value: companyProfile?.gender || "",
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
          value: companyProfile?.otherMembers || "",
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
          value: companyStatus?.description || "",
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
          value: companyProfile?.unskilledLocal || "",
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
          value: companyProfile?.semiSkilledLocal || "",
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
          value: companyProfile?.skilledLocal || "",
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
          value: companyProfile?.expertLocal || "",
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
          value: companyProfile?.noOfLabourTotal || "",
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
          value: companyProfile?.unskilledForeigner || "",
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
          value: companyProfile?.semiSkilledForeigner || "",
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
          value: companyProfile?.skilledForeigner || "",
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
          value: companyProfile?.expertForeigner || "",
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
          value: companyProfile?.noOfLabourForeigner || "",
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
          value: companyProfile?.supportMembers || "",
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
          value: currentStatus?.status || "",
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
          value: companyProfile?.remarks || "",
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

      // throw {};
      // return fileUrl;
      const fileBuffer = await fs.promises.readFile(filePath);

      return fileBuffer;
    },
    tokenizedCreateAgrifoodCompanyProfile: async (self, params, context) => {
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
      delete payload.fileName;

      for (let p of Object.keys(payload)) {
        if (p === "mobileNo" || p === "telephoneNo") {
          if (payload[p]) {
            payload[p] = "" + payload[p];
          } else {
            payload[p] = "" + 0;
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
          p === "skilledForeigner" ||
          p === "unskilledForeigner" ||
          p === "totalAssets" ||
          p === "totalAnnualRevenue"
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
      if (payload.uploadFile) {
        let ContentType = base64MimeType(payload.uploadFile);

        if (ContentType === "application/wps-office.docx") {
          ContentType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        // const mimeType = mime.getExtension(ContentType);
        // if (mimeType === null || mimeType === "null") {
        //   throw new Error("Invalid MIME Types");
        // }
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

      if (payload.machineryIds) {
        delete payload.machineryIds;
      }

      const foundDuplicate =
        await context.prisma.agrifoodCompanyProfile.findMany({
          where: {
            rocbnRegNo: payload.rocbnRegNo,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          take: 1,
        });

      if (foundDuplicate.length !== 0) {
        throw new Error("Duplicate ROCBN");
      }

      let latestNumber = await context.prisma.profileIdGenerator.findMany({
        where: {
          menu: "Agrifood Company Profile",
        },
        take: 1,
      });

      // let counter = 0;
      // if (latestNumber.length === 0) {
      //   counter = 1;
      //   await context.prisma.profileIdGenerator.create({
      //     data: {
      //       uuid: uuidv4(),
      //       counter: 1,
      //       menu: "Agrifood Company Profile",
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

      let counter = await context.prisma.agrifoodCompanyProfile.count({});

      let startCode = "AG000";
      const dataLength = "" + counter + 1;
      const last = dataLength.length * -1;
      startCode = startCode.slice(0, last) + counter + 1;
      payload.companyId = startCode;

      const foundExistingCode =
        await context.prisma.agrifoodCompanyProfile.findMany({
          where: {
            companyId: payload.companyId,
          },
          take: 1,
        });

      if (foundExistingCode.length >= 1) {
        throw new Error("Exisiting Company Profile Code..!");
      }
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

      if (!createPayload.typeCompanyRegId) {
        createPayload.typeCompanyRegId = "";
        createPayload.typeCompanyRegName = "";
      }

      if (!createPayload.companyRegDate) {
        createPayload.companyRegDate = dayjs("1900-01-01").format();
      }

      if (!createPayload.companyStatusId) {
        createPayload.companyStatusId = "";
        createPayload.companyStatusName = "";
      }

      if (!createPayload.raceId) {
        createPayload.raceId = "";
        createPayload.raceName = "";
      }

      if (!createPayload.currStatusId) {
        createPayload.currStatusId = "";
        createPayload.currStatusName = "";
      }

      await context.prisma.agrifoodCompanyProfile.create({
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
          p === "skilledForeigner" ||
          p === "unskilledForeigner"
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
          tableName: "agrifoodCompanyProfile",
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
    tokenizedUpdateAgrifoodCompanyProfile: async (self, params, context) => {
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
        farmingSystemId,
        plantingSystemId,
        companyProfileId,
        machineryId,
        typeCompanyRegId,
        raceId,
        currStatusId,
        companyStatusId,
        positionUUID,
        ...payloadTokenized
      } = tokenized;

      let payload = payloadTokenized;
      delete payload.fileName;

      for (let p of Object.keys(payload)) {
        if (p === "mobileNo" || p === "telephoneNo") {
          if (payload[p]) {
            payload[p] = "" + payload[p];
          } else {
            payload[p] = "" + 0;
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
          p === "skilledForeigner" ||
          p === "unskilledForeigner" ||
          p === "totalAssets" ||
          p === "totalAnnualRevenue"
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

      if (payload.uploadFile === "-") {
        delete payload.uploadFile;
      }
      if (payload.uploadFile) {
        let ContentType = base64MimeType(payload.uploadFile);

        if (ContentType === "application/wps-office.docx") {
          ContentType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        // const mimeType = mime.getExtension(ContentType);
        // if (mimeType === null || mimeType === "null") {
        //   throw new Error("Invalid MIME Types");
        // }
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

      if (payload.machineryIds) {
        delete payload.machineryIds;
      }

      if (!payload.typeCompanyRegId) {
        payload.typeCompanyRegId = "";
        payload.typeCompanyRegName = "";
      }

      if (!payload.companyRegDate) {
        payload.companyRegDate = dayjs("1900-01-01").format();
      }

      if (!payload.companyStatusId) {
        payload.companyStatusId = "";
        payload.companyStatusName = "";
      }

      if (!payload.raceId) {
        payload.raceId = "";
        payload.raceName = "";
      }

      if (!payload.currStatusId) {
        payload.currStatusId = "";
        payload.currStatusName = "";
      }

      await context.prisma.agrifoodCompanyProfile.update({
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
          p === "skilledForeigner" ||
          p === "unskilledForeigner"
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
          tableName: "agrifoodCompanyProfile",
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
    tokenizedDeleteAgrifoodCompanyProfile: async (self, params, context) => {
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
        await context.prisma.agrifoodCompanyProfile.findUnique({
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
      await context.prisma.agrifoodCompanyProfile.update({
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
          tableName: "agrifoodCompanyProfile",
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
  AgrifoodCompanyProfile: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    mobileNo: (self) => {
      if (self.mobileNo) {
        let mobileNo = BigInt(self.mobileNo);
        return mobileNo.toString();
      }
      return "";
    },
    telephoneNo: (self) => {
      if (self.telephoneNo) {
        let telephoneNo = BigInt(self.telephoneNo);
        return telephoneNo.toString();
      }
      return "";
    },
    dateOfBirth: (self) => {
      if (self.dateOfBirth) {
        return dayjs(self.dateOfBirth).format("YYYY-MM-DD");
      }
      return "";
    },
    companyRegDate: (self) => {
      if (self.companyRegDate) {
        return dayjs(self.companyRegDate).format("YYYY-MM-DD");
      }
    },
    machineryNames: async (self, params, context) => {
      if (!self.machineryIds || self.machineryIds.length === 0) {
        return "";
      }

      const queryResult = await context.prisma.machinery.findMany({
        where: {
          uuid: {
            in: self.machineryIds,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      const results = queryResult.map((q) => q.machineName);
      return results.join(",");
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
