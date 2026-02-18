const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const { filter } = require("lodash");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;

const resolvers = {
  Query: {
    allFoodSamplings: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("Food Sampling:Read")) {
        return [];
      }

      let filterQuery = {};
      let startDate = {};
      let endDate = {};

      if (params.startDate) {
        startDate = params.startDate;
      }

      if (params.endDate) {
        endDate = params.endDate;
      }

      filterQuery = {
        samplingDate: {
          gte: startDate,
          lte: endDate,
        },
      };
      let queryResult = await context.prisma.foodSampling.findMany({
        where: {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      return queryResult;
    },
    tokenizedAllFoodSamplings: async (self, params, context) => {
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

      // if (!role || !role.privileges.includes("Food Sampling:Read")) {
      //   return [];
      // }

      let filterQuery = {};
      let startDate = {};
      let endDate = {};

      if (params.startDate) {
        startDate = params.startDate;
      }

      if (params.endDate) {
        endDate = params.endDate;
      }

      filterQuery = {
        samplingDate: {
          gte: startDate,
          lte: endDate,
        },
      };

      let searchQuery = [];
      if (params.filters) {
        searchQuery = JSON.parse(params.filters);
      }

      for (const filtered of searchQuery) {
        if (filtered.id === "companyName") {
          const companyProfile =
            await context.prisma.agrifoodCompanyProfile.findMany({
              where: {
                companyName: {
                  contains: filtered.value,
                },
                ...NOT_DELETED_DOCUMENT_QUERY,
              },
            });
          filterQuery = {
            ...filterQuery,
            companyUUID: {
              in: companyProfile.map((f) => f.uuid),
            },
          };
        } else if (filtered.id === "sampleName") {
          filterQuery = {
            ...filterQuery,
            sampleName: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "sampleReferenceNo") {
          filterQuery = {
            ...filterQuery,
            sampleReferenceNo: {
              contains: filtered.value,
            },
          };
        }
      }

      let queryResult = await context.prisma.foodSampling.findMany({
        where: {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
        skip: params.pageIndex * params.pageSize,
        take: params.pageSize,
      });

      const condition = await context.prisma.condition.findMany({
        where: {
          uuid: {
            in: queryResult.map((q) => q.conditionUUID),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedCondition = condition.reduce((all, cond) => {
        if (!all[cond.uuid]) {
          all[cond.uuid] = {};
        }
        all[cond.uuid] = {
          ...cond,
          id: cond.id.toString(),
        };
        return all;
      }, {});

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
          Condition: indexedCondition[q.conditionUUID]
            ? indexedCondition[q.conditionUUID]
            : {},
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    countFoodSamplings: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let filterQuery = {};
      let startDate = {};
      let endDate = {};

      if (params.startDate) {
        startDate = params.startDate;
      }

      if (params.endDate) {
        endDate = params.endDate;
      }

      filterQuery = {
        samplingDate: {
          gte: startDate,
          lte: endDate,
        },
      };

      let searchQuery = [];
      if (params.filters) {
        searchQuery = JSON.parse(params.filters);
      }

      for (const filtered of searchQuery) {
        if (filtered.id === "companyName") {
          const companyProfile =
            await context.prisma.agrifoodCompanyProfile.findMany({
              where: {
                companyName: {
                  contains: filtered.value,
                },
                ...NOT_DELETED_DOCUMENT_QUERY,
              },
            });
          filterQuery = {
            ...filterQuery,
            companyUUID: {
              in: companyProfile.map((f) => f.uuid),
            },
          };
        } else if (filtered.id === "sampleName") {
          filterQuery = {
            ...filterQuery,
            sampleName: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "sampleReferenceNo") {
          filterQuery = {
            ...filterQuery,
            sampleReferenceNo: {
              contains: filtered.value,
            },
          };
        }
      }

      let queryResult = await context.prisma.foodSampling.count({
        where: {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      return queryResult;
    },
  },
  Mutation: {
    createFoodSampling: async (self, params, context) => {
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

      await context.prisma.foodSampling.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "foodSampling",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateFoodSampling: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.foodSampling.update({
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
          tableName: "foodSampling",
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
    deleteFoodSampling: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData = await context.prisma.foodSampling.findUnique({
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

      await context.prisma.foodSampling.update({
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
          tableName: "foodSampling",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportFoodSampling: async (self, params, context) => {
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
      let startDate = "";
      let endDate = "";

      if (params.startDate) {
        startDate = params.startDate;
      }

      if (params.endDate) {
        endDate = params.endDate;
      }

      filterQuery = {
        samplingDate: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (params.companyUUID) {
        arraysFilter.push({
          companyUUID: {
            in: [params.companyUUID],
          },
        });
      }

      if (params.sampleName) {
        arraysFilter.push({
          sampleName: {
            contains: params.sampleName,
          },
        });
      }

      // if (params.typeOfAnalysisIds && params.typeOfAnalysisIds.length > 0) {
      //   arraysFilter.push({
      //     typeOfAnalysisIds: {
      //       in: [...params.typeOfAnalysisIds],
      //     },
      //   });
      // }

      if (arraysFilter.length !== 0) {
        filterQuery = {
          ...filterQuery,
          OR: arraysFilter,
        };
      }
      // console.log(filterQuery.OR[0].typeOfAnalysisIds);

      let tempFoodSampling = await context.prisma.foodSampling.findMany({
        where: {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "asc",
        },
      });

      let allFoodSamplingIds = [];

      for (const temp of tempFoodSampling) {
        if (params.typeOfAnalysisIds && params.typeOfAnalysisIds.length > 0) {
          for (const id of params.typeOfAnalysisIds) {
            const getIndex = temp.typeOfAnalysisIds.findIndex(
              (analysisId) => analysisId === id
            );
            if (getIndex !== -1) {
              allFoodSamplingIds.push(temp.uuid);
            }
          }
        } else {
          allFoodSamplingIds.push(temp.uuid);
        }
      }

      let foodSamplings = await context.prisma.foodSampling.findMany({
        where: {
          uuid: {
            in: allFoodSamplingIds,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "asc",
        },
      });

      let agrifoodCompanyProfile =
        await context.prisma.agrifoodCompanyProfile.findMany({
          where: {
            uuid: {
              in: foodSamplings.map((ret) => ret.companyUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      const indexedAgrifoodCompanyProfile = agrifoodCompanyProfile.reduce(
        (all, company) => {
          if (!all[company.uuid]) {
            all[company.uuid] = {};
          }
          all[company.uuid] = company;
          return all;
        },
        {}
      );

      let condition = await context.prisma.condition.findMany({
        where: {
          uuid: {
            in: foodSamplings.map((ret) => ret.conditionUUID),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedCondition = condition.reduce((all, cond) => {
        if (!all[cond.uuid]) {
          all[cond.uuid] = {};
        }
        all[cond.uuid] = cond;
        return all;
      }, {});

      let typeOfAnalysis = [];
      if (params.typeOfAnalysisIds && params.typeOfAnalysisIds.length > 0) {
        typeOfAnalysis = await context.prisma.typeOfAnalysis.findMany({
          where: {
            uuid: {
              in: foodSamplings.map((ret) => ret.typeOfAnalysisIds),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      } else {
        typeOfAnalysis = await context.prisma.typeOfAnalysis.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      }
      const indexedTypeOfAnalysis = typeOfAnalysis.reduce((all, analysis) => {
        if (!all[analysis.uuid]) {
          all[analysis.uuid] = {};
        }
        all[analysis.uuid] = analysis;
        return all;
      }, {});

      let test = await context.prisma.test.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedTest = test.reduce((all, test) => {
        if (!all[test.uuid]) {
          all[test.uuid] = {};
        }
        all[test.uuid] = test;
        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Food Sampling");

      let headerRow = [
        "COMPANY NAME",
        "NAME OF SAMPLE",
        "TYPE OF SAMPLING",
        "CONDITION",
        "SAMPLE REFERENCE NO",
        "TYPE OF ANALYSIS",
        "LIST OF TEST REQUEST",
        "DATE OF SAMPLING",
        "SAMPLE COLLECTED BY",
        "PURPOSE OF FOOD SAMPLING",
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

      for (const foodSampling of foodSamplings) {
        const agrifoodCompanyProfile =
          indexedAgrifoodCompanyProfile[foodSampling.companyUUID];
        const condition = indexedCondition[foodSampling.conditionUUID];

        let typeOfAnalysis = "";

        if (
          foodSampling.typeOfAnalysisIds &&
          foodSampling.typeOfAnalysisIds.length > 0
        ) {
          for (let analysis of foodSampling.typeOfAnalysisIds) {
            let typeAnalysis = null;
            if (indexedTypeOfAnalysis[analysis]) {
              typeAnalysis = indexedTypeOfAnalysis[analysis];
            }
            if (typeAnalysis) {
              typeOfAnalysis += `${typeAnalysis.name}, `;
            }
          }
        }

        let listOfTest = "";

        if (foodSampling.testIds && foodSampling.testIds.length > 0) {
          for (let test of foodSampling.testIds) {
            let listTest = null;
            if (indexedTest[test]) {
              listTest = indexedTest[test];
            }
            if (listTest) {
              listOfTest += `${listTest.testName}, `;
            }
          }
        }

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: agrifoodCompanyProfile?.companyName || "",
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
          value: foodSampling?.sampleName || "",
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
          value: foodSampling?.typeOfSampling || "",
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
          value: condition?.name || "",
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
          value: foodSampling?.sampleReferenceNo || "",
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
          value: typeOfAnalysis || "",
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
          value: listOfTest || "",
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
          value: foodSampling?.samplingDate || "",
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
          value: foodSampling?.collectedBy || "",
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
          value: foodSampling?.purpose || "",
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
      // const filename = `food_sampling.xlsx`;
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
    tokenizedCreateFoodSampling: async (self, params, context) => {
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

      const { iat, endDate, startDate, CompanyProfile, ...payload } = tokenized;

      if (!payload.companyUUID) {
        throw new Error("Please fill the company name fields");
      }

      if (!payload.conditionUUID) {
        throw new Error("Invalid Condition");
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

      await context.prisma.foodSampling.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "foodSampling",
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
    tokenizedUpdateFoodSampling: async (self, params, context) => {
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
        updatedBy,
        updatedAt,
        deletedAt,
        deletedBy,
        endDate,
        Condition,
        startDate,
        CompanyProfile,
        ...payload
      } = tokenized;

      if (!payload.companyUUID) {
        throw new Error("Please fill the company name fields");
      }

      if (!payload.conditionUUID) {
        throw new Error("Invalid Condition");
      }

      await context.prisma.foodSampling.update({
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
          tableName: "foodSampling",
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
    tokenizedDeleteFoodSampling: async (self, params, context) => {
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

      let getDeletedData = await context.prisma.foodSampling.findUnique({
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

      await context.prisma.foodSampling.update({
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
          tableName: "foodSampling",
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
  FoodSampling: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    Condition: async (self, params, context) => {
      const found = await context.prisma.condition.findUnique({
        where: {
          uuid: self.conditionUUID,
        },
      });
      return found;
    },
  },
};
exports.resolvers = resolvers;
