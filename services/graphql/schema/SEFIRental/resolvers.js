const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { filter } = require("lodash");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const { name } = require("agenda/dist/agenda/name");
const TOKENIZE = process.env.TOKENIZE;

const resolvers = {
  Query: {
    allSEFIRentals: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("SEFI Rental:Read")) {
        return [];
      }

      let filterQuery = {};

      if (params.startDate) {
        filterQuery = {
          startDate: {
            gte: params.startDate,
          },
        };
      }

      if (params.endDate) {
        filterQuery = {
          ...filterQuery,
          endDate: {
            lte: params.endDate,
          },
        };
      }

      const queryResult = await context.prisma.SEFIRental.findMany({
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
    tokenizedAllSEFIRentals: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let filterQuery = {};

      if (params.startDate) {
        filterQuery = {
          startDate: {
            gte: params.startDate,
          },
        };
      }

      if (params.endDate) {
        filterQuery = {
          ...filterQuery,
          endDate: {
            lte: params.endDate,
          },
        };
      }

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
        } else if (filtered.id === "productCatalogueDetailsName") {
          const productName =
            await context.prisma.productCatalogueDetails.findMany({
              where: {
                name: {
                  contains: filtered.value,
                },
              },
            });
          filterQuery = {
            ...filterQuery,
            productCatalogueDetailsUUID: {
              in: productName.map((veg) => veg.uuid),
            },
          };
        }
      }

      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        const profileQuery = {
          icPassportNo: context.activeSession.User.icNo,
          // rocbnRegNo: context.activeSession.User.doaaRegNo,
        };

        const companyProfile =
          await context.prisma.agrifoodCompanyProfile.findMany({
            where: {
              ...profileQuery,
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
            select: {
              id: true,
              uuid: true,
            },
            orderBy: {
              id: "desc",
            },
          });

        filterQuery = {
          ...filterQuery,
          companyUUID: {
            in: companyProfile.map((c) => c.uuid),
          },
        };
      }

      let queryResult = await context.prisma.SEFIRental.findMany({
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

    countAllSEFIRentals: async (self, params, context) => {
      let filterQuery = {};

      if (params.startDate) {
        filterQuery = {
          startDate: {
            gte: params.startDate,
          },
        };
      }

      if (params.endDate) {
        filterQuery = {
          ...filterQuery,
          endDate: {
            lte: params.endDate,
          },
        };
      }

      let searchQuery = [];
      if (params.filters) {
        searchQuery = JSON.parse(params.filters);
      }

      for (const filtered of searchQuery) {
        if (filtered.id === "companyName") {
          const farmerProfile = await context.prisma.farmerProfile.findMany({
            where: {
              farmerCompanyName: {
                contains: filtered.value,
              },
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
          });
          filterQuery = {
            ...filterQuery,
            companyUUID: {
              in: farmerProfile.map((f) => f.uuid),
            },
          };
        } else if (filtered.id === "productCatalogueDetailsName") {
          const productName =
            await context.prisma.productCatalogueDetails.findMany({
              where: {
                name: {
                  contains: filtered.value,
                },
              },
            });
          filterQuery = {
            ...filterQuery,
            productCatalogueDetailsUUID: {
              in: productName.map((veg) => veg.uuid),
            },
          };
        }
      }

      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        const profileQuery = {
          icPassportNo: context.activeSession.User.icNo,
          // rocbnRegNo: context.activeSession.User.doaaRegNo,
        };

        const companyProfile =
          await context.prisma.agrifoodCompanyProfile.findMany({
            where: {
              ...profileQuery,
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
            select: {
              id: true,
              uuid: true,
            },
            orderBy: {
              id: "desc",
            },
          });

        filterQuery = {
          ...filterQuery,
          companyUUID: {
            in: companyProfile.map((c) => c.uuid),
          },
        };
      }

      let queryResult = await context.prisma.SEFIRental.count({
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
    createSEFIRental: async (self, params, context) => {
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

      await context.prisma.SEFIRental.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "SEFIRental",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateSEFIRental: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.SEFIRental.update({
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
          tableName: "SEFIRental",
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
    deleteSEFIRental: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData = await context.prisma.ruminantStock.findUnique({
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

      await context.prisma.SEFIRental.update({
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
          tableName: "SEFIRental",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportSEFIRental: async (self, params, context) => {
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

      // if (params.startDate) {
      //   filterQuery = {
      //     startDate: params.startDate,
      //   };
      // }

      // if (params.endDate) {
      //   filterQuery = {
      //     ...filterQuery,
      //     endDate: params.endDate,
      //   };
      // }

      if (params.startDate) {
        arraysFilter.push({
          startDate: {
            in: [params.startDate],
          },
        });
      }

      if (params.endDate) {
        arraysFilter.push({
          endDate: {
            in: [params.endDate],
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

      if (params.productName) {
        let AllProductCatalogueDetailsByProductName =
          await context.prisma.productCatalogueDetails.findMany({
            where: {
              name: {
                contains: params.productName,
              },
            },
          });
        arraysFilter.push({
          productCatalogueDetailsUUID: {
            in: AllProductCatalogueDetailsByProductName.map((ret) => ret.uuid),
          },
        });
      }

      if (arraysFilter.length !== 0) {
        filterQuery = {
          ...filterQuery,
          OR: arraysFilter,
        };
      }

      let SEFIRentals = await context.prisma.SEFIRental.findMany({
        where: {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      let agrifoodCompanyProfile =
        await context.prisma.agrifoodCompanyProfile.findMany({
          where: {
            uuid: {
              in: SEFIRentals.map((ret) => ret.companyUUID),
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

      let productCatalogueDetails =
        await context.prisma.productCatalogueDetails.findMany({
          where: {
            uuid: {
              in: SEFIRentals.map((ret) => ret.productCatalogueDetailsUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      const indexedProductCatalogueDetails = productCatalogueDetails.reduce(
        (all, name) => {
          if (!all[name.uuid]) {
            all[name.uuid] = {};
          }
          all[name.uuid] = name;
          return all;
        },
        {}
      );

      let SEFIRentalMachinery =
        await context.prisma.sefiRentalMachinery.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      const indexedSEFIRentalMachinery = SEFIRentalMachinery.reduce(
        (all, mach) => {
          if (!all[mach.uuid]) {
            all[mach.uuid] = {};
          }
          all[mach.uuid] = mach;
          return all;
        },
        {}
      );

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("SEFI Rental");

      let headerRow = [
        "START DATE OF RENTAL",
        "END DATE OF RENTAL",
        "COMPANY NAME",
        "PRODUCT NAME",
        "DURATION OF RENTAL (DAY(S))",
        "QUANTITY PRODUCED (KG)",
        "PRICE PER KG ($)",
        "TOTAL VALUE PRODUCED",
        "MACHINERIES USED",
        "PAYMENT RECEIPT NO",
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

      for (const SEFIRental of SEFIRentals) {
        const agrifoodCompanyProfile =
          indexedAgrifoodCompanyProfile[SEFIRental.companyUUID];
        const productCatalogueDetails =
          indexedProductCatalogueDetails[
            SEFIRental.productCatalogueDetailsUUID
          ];

        let SEFIRentalMachinery = "";
        if (
          SEFIRental.sefiMachineryIds &&
          SEFIRental.sefiMachineryIds.length > 0
        ) {
          for (let machineId of SEFIRental.sefiMachineryIds) {
            let machine = null;
            if (indexedSEFIRentalMachinery[machineId]) {
              machine = indexedSEFIRentalMachinery[machineId];
            }
            if (machine) {
              SEFIRentalMachinery += `${machine.machineName}`;
            }
          }
        }

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: SEFIRental?.startDate || "",
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
          value: SEFIRental?.endDate || "",
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
          value: productCatalogueDetails?.name || "",
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
          value: SEFIRental?.durationOfRental || "",
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
          value: SEFIRental?.quantity || "",
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
          value: SEFIRental?.price || "",
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
          value: SEFIRental?.totalValueProduced || "",
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
          value: SEFIRentalMachinery || "",
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
          value: SEFIRental?.paymentReceiptNo || "",
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
      // const filename = `SEFI_Rental.xlsx`;
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
    tokenizedCreateSEFIRental: async (self, params, context) => {
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

      const { iat, PricePerKg, ...payload } = tokenized;

      if (!payload.companyUUID) {
        throw new Error("Please fill the company name fields");
      }

      if (!payload.productCatalogueDetailsUUID) {
        throw new Error("Invalid Catalogue Details");
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

      await context.prisma.SEFIRental.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "SEFIRental",
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
    tokenizedUpdateSEFIRental: async (self, params, context) => {
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
        CompanyProfile,
        PricePerKg,
        ...payload
      } = tokenized;

      if (!payload.companyUUID) {
        throw new Error("Please fill the company name fields");
      }

      if (!payload.productCatalogueDetailsUUID) {
        throw new Error("Invalid Catalogue Details");
      }
      await context.prisma.SEFIRental.update({
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
          tableName: "SEFIRental",
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
    tokenizedDeleteSEFIRental: async (self, params, context) => {
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

      let getDeletedData = await context.prisma.SEFIRental.findUnique({
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

      await context.prisma.SEFIRental.update({
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
          tableName: "SEFIRental",
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
  SEFIRental: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
  },
};
exports.resolvers = resolvers;
