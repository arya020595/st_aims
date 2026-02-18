const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const GraphQLJSON = require("graphql-type-json");
const mime = require("mime");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const { contentType } = require("mime-types");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const { filter } = require("lodash");
const TOKENIZE = process.env.TOKENIZE;
const lodash = require("lodash");

const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    allFarmerProfiles: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("Farmer Profile Livestock:Read")) {
        return [];
      }

      let profileQuery = {};

      if (
        context.activeSession.User &&
        context.activeSession.User.rocbnRegNo &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        const profile = await context.prisma.farmerProfile.findMany({
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

      // let profileQuery = [];
      // if (
      //   context.activeSession.User &&
      //   context.activeSession.User.rocbnRegNo &&
      //   context.activeSession.User.registerType === "FARMER"
      // ) {
      //   profileQuery.push({
      //     rocbnRegNo: context.activeSession.User.doaaRegNo,
      //   });
      //   profileQuery.push({
      //     createdBy: {
      //       path: ['username'],
      //       equals: context.activeSession.User.name
      //     }
      //   })
      // }

      let queryResult = await context.prisma.farmerProfile.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
          ...profileQuery,
        },
        orderBy: {
          id: "desc",
        },
      });

      return queryResult;
    },
    getCountFarmerProfiles: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let user = await context.prisma.user.findUnique({
        where: {
          uuid: context.activeSession.User.userId,
        },
      });

      if (!user) {
        return 0;
      }

      let role = await context.prisma.userRoles.findUnique({
        where: {
          uuid: user.userRoleId,
        },
      });

      if (!role || !role.privileges.includes("Farmer Profile Livestock:Read")) {
        return 0;
      }

      let profileQuery = {};

      if (
        context.activeSession.User &&
        // context.activeSession.User.rocbnRegNo &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
        // };
        const profile = await context.prisma.farmerProfile.findMany({
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

      let queryResult = await context.prisma.farmerProfile.count({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
          ...profileQuery,
        },
        orderBy: {
          id: "desc",
        },
      });
      return queryResult;
    },
    allFarmerProfilesByCompanyRegNo: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let profileQuery = {};

      if (
        context.activeSession.User &&
        // context.activeSession.User.rocbnRegNo &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
        // };
        const profile = await context.prisma.farmerProfile.findMany({
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

      let queryResult = await context.prisma.farmerProfile.findMany({
        where: {
          ...profileQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      return queryResult;
    },
    tokenizedAllFarmerProfile: async (self, params, context) => {
      assertValidSession(context.activeSession);

      // let user = await context.prisma.user.findUnique({
      //   where: {
      //     uuid: context.activeSession.User.userId,
      //   },
      // });

      // if (!user) {
      //   return "";
      // }

      // let role = await context.prisma.userRoles.findUnique({
      //   where: {
      //     uuid: user.userRoleId,
      //   },
      // });

      // if (!role || !role.privileges.includes("Farmer Profile Livestock:Read")) {
      //   return "";
      // }

      let profileQuery = {};

      if (
        context.activeSession.User &&
        // context.activeSession.User.rocbnRegNo &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
        // };
        const profile = await context.prisma.farmerProfile.findMany({
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

      if (!params.pageIndex && !params.pageSize) {
        let queryResult = await context.prisma.farmerProfile.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
            ...profileQuery,
          },
          orderBy: {
            id: "desc",
          },
        });

        queryResult = queryResult.map((q) => {
          let id = BigInt(q.id);
          // let mobileNo = BigInt(q.mobileNo || 0);
          // let telephoneNo = BigInt(q.telephoneNo || 0);
          let dateOfBirth = dayjs(q.dateOfBirth).format("YYYY-MM-DD");
          let companyRegDate = dayjs(q.companyRegDate).format("YYYY-MM-DD");
          let supportSystem = q.supportSystem || [];
          return {
            ...q,
            id: id.toString(),
            // mobileNo: mobileNo.toString(),
            // telephoneNo: telephoneNo.toString(),
            dateOfBirth,
            companyRegDate,
            supportSystem,
          };
        });

        const payload = {
          queryResult,
        };

        let token = jwt.sign(payload, TOKENIZE);
        return token;
      } else {
        let filterQuery = {};
        let searchQuery = [];
        if (params.filters) {
          searchQuery = JSON.parse(params.filters);
        }

        for (const filtered of searchQuery) {
          if (filtered.id === "farmerCompanyName") {
            filterQuery = {
              ...filterQuery,
              farmerCompanyName: {
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

        let queryResult = await context.prisma.farmerProfile.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
            ...profileQuery,
            ...filterQuery,
          },
          orderBy: {
            id: "desc",
          },
          skip: params.pageIndex * params.pageSize,
          take: params.pageSize || 0,
        });

        queryResult = queryResult.map((q) => {
          let id = BigInt(q.id);
          // let mobileNo = BigInt(q.mobileNo || 0);
          // let telephoneNo = BigInt(q.telephoneNo || 0);
          let dateOfBirth = dayjs(q.dateOfBirth).format("YYYY-MM-DD");
          let companyRegDate = dayjs(q.companyRegDate).format("YYYY-MM-DD");
          let supportSystem = q.supportSystem || [];
          return {
            ...q,
            id: id.toString(),
            // mobileNo: mobileNo.toString(),
            // telephoneNo: telephoneNo.toString(),
            dateOfBirth,
            companyRegDate,
            supportSystem,
          };
        });

        const payload = {
          queryResult,
        };

        let token = jwt.sign(payload, TOKENIZE);
        return token;
      }
    },
    tokenizedAllFarmerProfilesByCompanyRegNo: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let profileQuery = {};

      if (
        context.activeSession.User &&
        // context.activeSession.User.rocbnRegNo &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
        // };
        const profile = await context.prisma.farmerProfile.findMany({
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
      if (!params.pageIndex && !params.pageSize) {
        let queryResult = await context.prisma.farmerProfile.findMany({
          where: {
            ...profileQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

        queryResult = queryResult.map((q) => {
          let id = BigInt(q.id);
          // let mobileNo = BigInt(q.mobileNo || 0);
          // let telephoneNo = BigInt(q.telephoneNo || 0);
          let dateOfBirth = dayjs(q.dateOfBirth).format("YYYY-MM-DD");
          let companyRegDate = dayjs(q.companyRegDate).format("YYYY-MM-DD");
          let supportSystem = q.supportSystem || [];
          return {
            ...q,
            id: id.toString(),
            // mobileNo: mobileNo.toString(),
            // telephoneNo: telephoneNo.toString(),
            dateOfBirth,
            companyRegDate,
            supportSystem,
          };
        });

        const payload = {
          queryResult,
        };

        let token = jwt.sign(payload, TOKENIZE);
        return token;
      } else {
        let filterQuery = {};
        let searchQuery = [];
        if (params.filters) {
          searchQuery = JSON.parse(params.filters);
        }

        for (const filtered of searchQuery) {
          if (filtered.id === "farmerCompanyName") {
            filterQuery = {
              ...filterQuery,
              farmerCompanyName: {
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

        let queryResult = await context.prisma.farmerProfile.findMany({
          where: {
            ...profileQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
            ...filterQuery,
          },
          orderBy: {
            id: "desc",
          },
          skip: params.pageIndex * params.pageSize,
          take: params.pageSize,
        });
        queryResult = queryResult.map((q) => {
          let id = BigInt(q.id);
          // let mobileNo = BigInt(q.mobileNo || 0);
          // let telephoneNo = BigInt(q.telephoneNo || 0);
          let dateOfBirth = dayjs(q.dateOfBirth).format("YYYY-MM-DD");
          let companyRegDate = dayjs(q.companyRegDate).format("YYYY-MM-DD");
          let supportSystem = q.supportSystem || [];
          return {
            ...q,
            id: id.toString(),
            // mobileNo: mobileNo.toString(),
            // telephoneNo: telephoneNo.toString(),
            dateOfBirth,
            companyRegDate,
            supportSystem,
          };
        });

        const payload = {
          queryResult,
        };

        let token = jwt.sign(payload, TOKENIZE);
        return token;
      }
    },
    searchFarmerProfileByCompanyRegNo: async (self, params, context) => {
      let profileQuery = {};

      if (
        context.activeSession.User &&
        // context.activeSession.User.rocbnRegNo &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
        // };

        const profile = await context.prisma.farmerProfile.findMany({
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

      if (params.name) {
        profileQuery = {
          ...profileQuery,
          farmerCompanyName: {
            startsWith: params.name,
          },
        };
      }
      let queryResult = await context.prisma.farmerProfile.findMany({
        where: {
          ...profileQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          // id: "desc",
          farmerCompanyName: "asc",
        },
        take: 10,
      });
      if (queryResult.length == 0) {
        profileQuery = {
          ...profileQuery,
          farmerCompanyName: {
            contains: params.name,
          },
        };
        queryResult = await context.prisma.farmerProfile.findMany({
          where: {
            ...profileQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            // id: "desc",
            farmerCompanyName: "asc",
          },
          take: 10,
        });
      }
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
    searchAllFarmerProfiles: async (self, params, context) => {
      let profileQuery = {};

      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
        //   icPassportNo: context.activeSession.User.icNo,
        // };
        const profile = await context.prisma.farmerProfile.findMany({
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

      if (params.name) {
        profileQuery = {
          ...profileQuery,
          farmerCompanyName: {
            contains: params.name,
          },
        };
      }
      let queryResult = await context.prisma.farmerProfile.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
          ...profileQuery,
        },
        orderBy: {
          id: "desc",
        },
        take: 10,
      });
      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        // let mobileNo = BigInt(q.mobileNo || 0);
        // let telephoneNo = BigInt(q.telephoneNo || 0);
        let dateOfBirth = dayjs(q.dateOfBirth).format("YYYY-MM-DD");
        let companyRegDate = dayjs(q.companyRegDate).format("YYYY-MM-DD");
        let supportSystem = q.supportSystem || [];
        return {
          ...q,
          id: id.toString(),
          // mobileNo: mobileNo.toString(),
          // telephoneNo: telephoneNo.toString(),
          dateOfBirth,
          companyRegDate,
          supportSystem,
        };
      });
      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    searchAllFarmerProfilesByFarmerName: async (self, params, context) => {
      let profileQuery = {};

      if (
        context.activeSession.User &&
        // context.activeSession.User.rocbnRegNo &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
        // };
        const profile = await context.prisma.farmerProfile.findMany({
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

      if (params.name) {
        profileQuery = {
          ...profileQuery,
          farmerName: {
            contains: params.name,
          },
        };
      }
      let queryResult = await context.prisma.farmerProfile.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
          ...profileQuery,
        },
        orderBy: {
          id: "desc",
        },
        take: 10,
      });

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        // let mobileNo = BigInt(q.mobileNo || 0);
        // let telephoneNo = BigInt(q.telephoneNo || 0);
        let dateOfBirth = dayjs(q.dateOfBirth).format("YYYY-MM-DD");
        let companyRegDate = dayjs(q.companyRegDate).format("YYYY-MM-DD");
        let supportSystem = q.supportSystem || [];
        return {
          ...q,
          id: id.toString(),
          // mobileNo: mobileNo.toString(),
          // telephoneNo: telephoneNo.toString(),
          dateOfBirth,
          companyRegDate,
          supportSystem,
        };
      });
      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    countAllFarmerProfileByCompanyRegNo: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let profileQuery = {};

      if (
        context.activeSession.User &&
        // context.activeSession.User.rocbnRegNo &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
        // };
        const profile = await context.prisma.farmerProfile.findMany({
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

      let filterQuery = {};
      let searchQuery = [];
      if (params.filters) {
        searchQuery = JSON.parse(params.filters);
      }

      for (const filtered of searchQuery) {
        if (filtered.id === "farmerCompanyName") {
          filterQuery = {
            ...filterQuery,
            farmerCompanyName: {
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

      let queryResult = await context.prisma.farmerProfile.count({
        where: {
          ...profileQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
          ...filterQuery,
        },
        orderBy: {
          id: "desc",
        },
      });

      return queryResult;
    },
  },
  Mutation: {
    createFarmerProfile: async (self, params, context) => {
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

      if (payload.uploadFile && payload.uploadFile.includes("data")) {
        let ContentType = base64MimeType(payload.uploadFile);

        if (ContentType === "application/wps-office.docx") {
          ContentType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        // const mimeType = mime.getExtension(ContentType);
        const fileId = uuidv4();
        const filename = `${payload.companyId}_${fileId}.` + "zip";
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

      let foundDuplicate = await context.prisma.farmerProfile.findMany({
        where: {
          rocbnRegNo: payload.rocbnRegNo,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      if (foundDuplicate.length > 0) {
        throw new Error("Duplicate ROCBN Reg. No");
      }

      foundDuplicate = await context.prisma.farmerProfile.findMany({
        where: {
          companyRegNo: payload.companyRegNo,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      if (foundDuplicate.length > 0) {
        throw new Error("Duplicate Company Reg. No");
      }

      let latestNumber = await context.prisma.profileIdGenerator.findMany({
        where: {
          menu: "Livestock Farmer Profile",
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
            menu: "Livestock Farmer Profile",
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

      if (payload.companyId === "") {
        delete payload.companyId;

        let startCode = "CM0000";

        const dataLength = "" + counter;

        const last = dataLength.length * -1;

        startCode = startCode.slice(0, last) + counter;

        payload.companyId = startCode;
      }

      if (!payload.companyId) {
        throw new Error("Error generate company ID");
      }
      // console.log(payload);
      // throw new Error("error");

      if (!payload.smeCategory) {
        payload.smeCategory = "N/A";
        // throw new Error("Invalid SME Category");
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

      await context.prisma.farmerProfile.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "farmerProfile",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateFarmerProfile: async (self, params, context) => {
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

      if (payload.uploadFile && payload.uploadFile.includes("data")) {
        let ContentType = base64MimeType(payload.uploadFile);

        if (ContentType === "application/wps-office.docx") {
          ContentType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }

        const mimeType = mime.getExtension(ContentType);

        const fileId = uuidv4();
        const filename = `${payload.companyId}_${fileId}.` + "zip";
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
      let foundDuplicate = await context.prisma.farmerProfile.findMany({
        where: {
          rocbnRegNo: payload.rocbnRegNo,
        },
      });

      if (foundDuplicate.length > 1) {
        throw new Error("Duplicate ROCBN Reg. No");
      }

      const foundPrevious = await context.prisma.farmerProfile.findUnique({
        where: {
          uuid: params.uuid,
        },
      });

      if (foundPrevious.companyId !== payload.companyId) {
        throw new Error("Invalid Company ID");
      }

      await context.prisma.farmerProfile.update({
        where: {
          uuid: params.uuid,
        },
        data: {
          ...payload,
          updatedAt: new Date().toISOString(),
          updatedBy: context.activeSession.User,
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
          tableName: "farmerProfile",
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
    deleteFarmerProfile: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData = await context.prisma.farmerProfile.findUnique({
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

      await context.prisma.farmerProfile.update({
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
          tableName: "farmerProfile",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportFarmerProfile: async (self, params, context) => {
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

      let profileQuery = {};
      let farmerProfiles = [];
      if (
        context.activeSession.User &&
        // context.activeSession.User.rocbnRegNo &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
        // };
        const profile = await context.prisma.farmerProfile.findMany({
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

        farmerProfiles = await context.prisma.farmerProfile.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
            ...profileQuery,
          },
          orderBy: {
            id: "desc",
          },
        });
      } else {
        farmerProfiles = await context.prisma.farmerProfile.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      }

      let typeCompanyReg = await context.prisma.typeCompanyReg.findMany({
        where: {
          uuid: {
            in: lodash.uniq(
              farmerProfiles
                .filter((f) => f.typeCompanyRegId)
                .map((type) => type.typeCompanyRegId)
            ),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedTypeCompanyReg = typeCompanyReg.reduce((all, type) => {
        if (!all[type.uuid]) {
          all[type.uuid] = {};
        }
        all[type.uuid] = type;
        return all;
      }, {});

      let position = await context.prisma.position.findMany({
        where: {
          uuid: {
            in: lodash.uniq(
              farmerProfiles
                .filter((f) => f.positionUUID)
                .map((pos) => pos.positionUUID)
            ),
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

      let race = await context.prisma.race.findMany({
        where: {
          uuid: {
            in: lodash.uniq(
              farmerProfiles.filter((f) => f.raceId).map((pos) => pos.raceId)
            ),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedRace = race.reduce((all, rc) => {
        if (!all[rc.uuid]) {
          all[rc.uuid] = {};
        }
        all[rc.uuid] = rc;
        return all;
      }, {});

      let supportType = await context.prisma.supportType.findMany({
        where: {
          uuid: {
            in: lodash.uniq(
              farmerProfiles
                .filter((f) => f.typeOfSupportId)
                .map((sup) => sup.typeOfSupportId)
            ),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedSupportType = supportType.reduce((all, sup) => {
        if (!all[sup.uuid]) {
          all[sup.uuid] = {};
        }
        all[sup.uuid] = sup;
        return all;
      }, {});

      let companyStatus = await context.prisma.companyStatus.findMany({
        where: {
          uuid: {
            in: lodash.uniq(
              farmerProfiles
                .filter((f) => f.companyStatusId)
                .map((sup) => sup.companyStatusId)
            ),
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

      let plantingSystem = await context.prisma.plantingSystem.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedPlantingSystem = plantingSystem.reduce((all, plant) => {
        if (!all[plant.uuid]) {
          all[plant.uuid] = {};
        }
        all[plant.uuid] = plant;
        return all;
      }, {});

      let farmingSystem = await context.prisma.farmingSystem.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedFarmingSystem = farmingSystem.reduce((all, farming) => {
        if (!all[farming.uuid]) {
          all[farming.uuid] = {};
        }
        all[farming.uuid] = farming;
        return all;
      }, {});

      let currentStatus = await context.prisma.currentStatus.findMany({
        where: {
          uuid: {
            in: lodash.uniq(
              farmerProfiles
                .filter((f) => f.currStatusId)
                .map((sup) => sup.currStatusId)
            ),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedCurrentStatus = currentStatus.reduce((all, current) => {
        if (!all[current.uuid]) {
          all[current.uuid] = {};
        }
        all[current.uuid] = current;
        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Farmer Profile");

      let headerRow = [
        "COMPANY NAME",
        "COMPANY ID",
        "COMPANY REG NO",
        "TYPE OF COMPANY REG",
        "COMPANY REG DATE",
        "ROCBN REG NO",
        "COMPANY ADDRESS",
        "MAILING ADDRESS",
        "FARMER NAME",
        "OTHER STAKEHOLDERS",
        "MANAGER NAME",
        "POSITION",
        "DATE OF BIRTH",
        "MOBILE NUMBER",
        "SME CATEGORY",
        "TELEPHONE NUMBER",
        "GENDER",
        "COMPANY STATUS",
        "IC NO / PASSPORT NO ",
        "IC COLOUR",
        "SOCIAL MEDIA ACC",
        "EMAIL ADDRESS",
        "RACE",
        "SUPPORT TYPES",
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
        "PLANTING SYSTEM",
        "FARMING SYSTEM",
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

      for (const farmerProfile of farmerProfiles) {
        const typeCompanyReg =
          indexedTypeCompanyReg[farmerProfile.typeCompanyRegId];
        const position = indexedPosition[farmerProfile.positionUUID];
        const race = indexedRace[farmerProfile.raceId];
        const supportType = indexedSupportType[farmerProfile.typeOfSupportId];
        const companyStatus =
          indexedCompanyStatus[farmerProfile.companyStatusId];
        const currentStatus = indexedCurrentStatus[farmerProfile.currStatusId];

        let plantingSystem = "";

        if (
          farmerProfile.plantingSystem &&
          farmerProfile.plantingSystem.length > 0
        ) {
          for (let plantingSystemId of farmerProfile.plantingSystem) {
            let plantingSys = null;
            if (indexedPlantingSystem[plantingSystemId]) {
              plantingSys = indexedPlantingSystem[plantingSystemId];
            }
            if (plantingSys) {
              plantingSystem += `${plantingSys.description}, `;
            }
          }
        }

        let farmingSystem = "";

        if (
          farmerProfile.farmingSystem &&
          farmerProfile.farmingSystem.length > 0
        ) {
          for (let farmingSystemId of farmerProfile.farmingSystem) {
            let farmingSys = null;
            if (indexedFarmingSystem[farmingSystemId]) {
              farmingSys = indexedFarmingSystem[farmingSystemId];
            }
            if (farmingSys) {
              farmingSystem += `${farmingSys.description}, `;
            }
          }
        }

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: farmerProfile?.farmerCompanyName || "",
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
          value: farmerProfile?.companyId || "",
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
          value: farmerProfile?.companyRegNo || "",
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
          value: farmerProfile?.companyRegDate || "",
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
          value: farmerProfile?.rocbnRegNo || "",
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
          value: farmerProfile?.companyAddress || "",
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
          value: farmerProfile?.mailingAddress || "",
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
          value: farmerProfile?.farmerName || "",
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
          value: farmerProfile?.otherName || "",
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
          value: farmerProfile?.managerName || "",
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
          value: farmerProfile?.dateOfBirth || "",
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
          value: String(farmerProfile?.mobileNo || ""),
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
          value: farmerProfile?.smeCategory || "",
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
          value: String(farmerProfile?.telephoneNo || ""),
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
          value: farmerProfile?.gender || "",
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
          value: farmerProfile?.icPassportNo || "",
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
          value: farmerProfile?.icColour || "",
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
          value: farmerProfile?.socialMediaAcc || "",
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
          value: farmerProfile?.emailAddress || "",
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
          value: supportType?.supports || "",
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
          value: farmerProfile?.unskilledLocal || "",
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
          value: farmerProfile?.semiSkilledLocal || "",
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
          value: farmerProfile?.skilledLocal || "",
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
          value: farmerProfile?.expertLocal || "",
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
          value: farmerProfile?.noOfLabourTotal || "",
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
          value: farmerProfile?.unskilledForeigner || "",
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
          value: farmerProfile?.semiSkilledForeigner || "",
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
          value: farmerProfile?.skilledForeigner || "",
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
          value: farmerProfile?.expertForeigner || "",
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
          value: farmerProfile?.noOfLabourForeigner || "",
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
          value: plantingSystem || "",
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
          value: farmingSystem || "",
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
          value: farmerProfile?.remarks || "",
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
      const filename = `farmer_profile.xlsx`;
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
    tokenizedCreateFarmerProfile: async (self, params, context) => {
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

      const { iat, FarmerProfile, ...payloadTokenized } = tokenized;
      // console.log(payloadTokenized.formData);
      let payload = payloadTokenized.formData;

      for (let p of Object.keys(payload)) {
        if (p === "mobileNo" || p === "telephoneNo") {
          if (payload[p]) {
            payload[p] = "" + payload[p];
          } else {
            payload[p] = "";
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
          p === "skilledForeigner" ||
          p === "totalAnnualRevenue" ||
          p === "totalAssets"
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
          } else if (p === "otherName") {
            if (!payload[p]) {
              payload[p] = "";
            }
          }
        }
      }

      if (payload.uploadFile && payload.uploadFile.includes("data")) {
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
        const filename = `${payload.companyId}_${fileId}.` + "zip";
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

      let foundDuplicate = await context.prisma.farmerProfile.findMany({
        where: {
          rocbnRegNo: payload.rocbnRegNo,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      if (foundDuplicate.length > 0) {
        throw new Error("Duplicate ROCBN Reg. No");
      }

      foundDuplicate = await context.prisma.farmerProfile.findMany({
        where: {
          companyRegNo: payload.companyRegNo,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      if (foundDuplicate.length > 0) {
        throw new Error("Duplicate Company Reg. No");
      }

      // let latestNumber = await context.prisma.profileIdGenerator.findMany({
      //   where: {
      //     menu: "Livestock Farmer Profile",
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
      //       menu: "Livestock Farmer Profile",
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

      const latest = await context.prisma.farmerProfile.findMany({
        where: {},
        take: 2,
        orderBy: {
          companyId: "desc",
        },
      });

      const splitted = latest[0].companyId.split("CM");

      let counter = parseInt(splitted[1]) + 1;
      if (payload.companyId === "") {
        delete payload.companyId;

        let startCode = "CM0000";

        const dataLength = "" + counter;

        const last = dataLength.length * -1;

        startCode = startCode.slice(0, last) + counter;

        payload.companyId = startCode;
      }

      if (!payload.companyId) {
        throw new Error("Error generate company ID");
      }

      const foundExistingCode = await context.prisma.farmerProfile.findMany({
        where: {
          companyId: payload.companyId,
        },
        take: 1,
      });

      if (foundExistingCode.length >= 1) {
        throw new Error("Exisiting Farmer Profile Code..!");
      }

      payload = {
        ...payload,
        // mobileNo: payload.mobileNo.toString(),
        // telephoneNo: payload.telephoneNo.toString(),
      };

      if (!payload.smeCategory) {
        payload.smeCategory = "N/A";
        // throw new Error("Invalid SME Category");
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

      if (!createPayload.noOfLabourForeigner) {
        createPayload.noOfLabourForeigner = 0;
      }
      if (!createPayload.expertLocal) {
        createPayload.expertLocal = 0;
      }
      if (!createPayload.unskilledLocal) {
        createPayload.unskilledLocal = 0;
      }
      if (!createPayload.expertForeigner) {
        createPayload.expertForeigner = 0;
      }
      if (!createPayload.skilledLocal) {
        createPayload.skilledLocal = 0;
      }
      if (!createPayload.semiSkilledLocal) {
        createPayload.semiSkilledLocal = 0;
      }
      if (!createPayload.semiSkilledForeigner) {
        createPayload.semiSkilledForeigner = 0;
      }

      if (!createPayload.unskilledForeigner) {
        createPayload.unskilledForeigner = 0;
      }
      if (!createPayload.skilledForeigner) {
        createPayload.skilledForeigner = 0;
      }

      if (!createPayload.otherName) {
        createPayload.otherName = "";
      }

      if (!createPayload.noOfLabourTotal) {
        createPayload.noOfLabourTotal = 0;
      }

      await context.prisma.farmerProfile.create({
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
          p === "skilledForeigner" ||
          p === "totalAnnualRevenue" ||
          p === "totalAssets"
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
          tableName: "farmerProfile",
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
    tokenizedUpdateFarmerProfile: async (self, params, context) => {
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
        FarmerProfile,
        // farmingSystemId,
        // plantingSystemId,
        // companyProfileId,
        // machineryId,
        // typeCompanyRegId,
        // raceId,
        // typeOfSupportId,
        // currStatusId,
        // companyStatusId,
        // positionUUID,
        ...payloadTokenized
      } = tokenized;

      let payload = payloadTokenized;

      if (!payload.noOfLabourForeigner) {
        payload.noOfLabourForeigner = 0;
      }
      if (!payload.expertLocal) {
        payload.expertLocal = 0;
      }
      if (!payload.unskilledLocal) {
        payload.unskilledLocal = 0;
      }
      if (!payload.expertForeigner) {
        payload.expertForeigner = 0;
      }
      if (!payload.skilledLocal) {
        payload.skilledLocal = 0;
      }
      if (!payload.semiSkilledLocal) {
        payload.semiSkilledLocal = 0;
      }
      if (!payload.semiSkilledForeigner) {
        payload.semiSkilledForeigner = 0;
      }

      if (!payload.unskilledForeigner) {
        payload.unskilledForeigner = 0;
      }
      if (!payload.skilledForeigner) {
        payload.skilledForeigner = 0;
      }

      if (!payload.otherName) {
        payload.otherName = "";
      }

      if (!payload.noOfLabourForeigner) {
        payload.noOfLabourTotal = 0;
      }

      for (let p of Object.keys(payload)) {
        if (p === "mobileNo" || p === "telephoneNo") {
          if (payload[p]) {
            payload[p] = "" + payload[p];
          } else {
            payload[p] = "";
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
          p === "skilledForeigner" ||
          p === "totalAnnualRevenue" ||
          p === "totalAssets"
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

      if (payload.uploadFile && payload.uploadFile.includes("data")) {
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
        const filename = `${payload.companyId}_${fileId}.` + "zip";
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
      let foundDuplicate = await context.prisma.farmerProfile.findMany({
        where: {
          rocbnRegNo: payload.rocbnRegNo,
        },
      });

      if (foundDuplicate.length > 1) {
        throw new Error("Duplicate ROCBN Reg. No");
      }

      const foundPrevious = await context.prisma.farmerProfile.findUnique({
        where: {
          uuid: payload.uuid,
        },
      });
      if (foundPrevious.companyId !== payload.companyId) {
        throw new Error("Invalid Company ID");
      }

      await context.prisma.farmerProfile.update({
        where: {
          uuid: payload.uuid,
        },
        data: {
          ...payload,
          updatedAt: new Date().toISOString(),
          updatedBy: context.activeSession.User,
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
          tableName: "farmerProfile",
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
    tokenizedDeleteFarmerProfile: async (self, params, context) => {
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

      let getDeletedData = await context.prisma.farmerProfile.findUnique({
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

      await context.prisma.farmerProfile.update({
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

      for (let p of Object.keys(getDeletedData)) {
        if (p === "mobileNo" || p === "telephoneNo") {
          if (getDeletedData[p]) {
            getDeletedData[p] = String(getDeletedData[p]);
          } else {
            getDeletedData[p] = String(0n);
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
          if (!getDeletedData[p] || getDeletedData[p] === 0) {
            getDeletedData[p] = 0;
          }
        } else {
          if (p !== "companyRegDate" && p !== "dateOfBirth") {
            if (!getDeletedData[p]) {
              getDeletedData[p] = "";
            }
          } else if (p === "companyRegDate" || p === "dateOfBirth") {
            if (getDeletedData[p]) {
              getDeletedData[p] = new Date(getDeletedData[p]);
            }
          }
        }
      }

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "DELETE",
          tableName: "farmerProfile",
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

  FarmerProfile: {
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
    supportSystem: (self) => {
      if (self.supportSystem) {
        return self.supportSystem;
      }
      return [];
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
