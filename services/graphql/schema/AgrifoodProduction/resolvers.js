const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const { filter } = require("lodash");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const { default: ReactDatePicker } = require("react-datepicker");
const TOKENIZE = process.env.TOKENIZE;

const resolvers = {
  Query: {
    allAgrifoodProductions: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("Production Agrifood:Read")) {
        return [];
      }

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }
      let queryResult = await context.prisma.agrifoodProduction.findMany({
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
    tokenizedAllAgrifoodProductions: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }
      let queryResult = await context.prisma.agrifoodProduction.findMany({
        where: {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      let companyUUIDs = queryResult
        .filter((q) => q.companyUUID)
        .map((q) => q.companyUUID);
      companyUUIDs = lodash.uniq(companyUUIDs);

      let agrifoodCompanyProfile =
        await context.prisma.agrifoodCompanyProfile.findMany({
          where: {
            uuid: {
              in: companyUUIDs,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      // agrifoodCompanyProfile = agrifoodCompanyProfile.map((q) => {
      //   let mobileNo = BigInt(q.mobileNo);
      //   let telephoneNo = BigInt(q.telephoneNo);
      //   return {
      //     ...q,
      //     mobileNo: mobileNo.toString(),
      //     telephoneNo: telephoneNo.toString(),
      //   };
      // });

      const indexedAgrifoodCompanyProfile = agrifoodCompanyProfile.reduce(
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
        let foundAgrifoodCompany = indexedAgrifoodCompanyProfile[q.companyUUID];
        return {
          ...q,
          companyName: foundAgrifoodCompany?.companyName,
        };
      });

      let premiseUUIDQuerys = queryResult
        .filter((q) => q.premiseUUID)
        .map((q) => q.premiseUUID);
      premiseUUIDQuerys = lodash.uniq(premiseUUIDQuerys);

      const agrifoodPremiseProfile =
        await context.prisma.agrifoodPremiseProfile.findMany({
          where: {
            uuid: {
              in: premiseUUIDQuerys,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedAgrifoodPremiseProfile = agrifoodPremiseProfile.reduce(
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
        let foundPremiseProfile = indexedAgrifoodPremiseProfile[q.premiseUUID];
        return {
          ...q,
          premiseProfile: foundPremiseProfile?.premiseAddress,
        };
      });

      let premiseUUIDs = queryResult
        .filter((q) => q.premiseUUID)
        .map((q) => q.premiseUUID);
      premiseUUIDs = lodash.uniq(premiseUUIDs);

      const agrifoodProductCategory =
        await context.prisma.agrifoodProductCategory.findMany({
          where: {
            uuid: {
              in: premiseUUIDs,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedAgrifoodProductCategory = agrifoodProductCategory.reduce(
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
        let foundAgrifoodProductCategory =
          indexedAgrifoodProductCategory[q.productCategoryUUID];
        return {
          ...q,
          productCategory: foundAgrifoodProductCategory?.productNameEnglish,
        };
      });

      let productSubCategoryUUIDs = queryResult
        .filter((q) => q.productSubCategoryUUID)
        .map((q) => q.productSubCategoryUUID);
      productSubCategoryUUIDs = lodash.uniq(productSubCategoryUUIDs);

      const agrifoodProductSubCategory =
        await context.prisma.agrifoodProductSubCategory.findMany({
          where: {
            uuid: {
              in: productSubCategoryUUIDs,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedAgrifoodProductSubCategory =
        agrifoodProductSubCategory.reduce((all, subCat) => {
          if (!all[subCat.uuid]) {
            all[subCat.uuid] = {};
          }
          all[subCat.uuid] = {
            ...subCat,
            id: subCat.id.toString(),
          };
          return all;
        }, {});

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        let foundAgrifoodProductSubCategory =
          indexedAgrifoodProductSubCategory[q.productSubCategoryUUID];
        return {
          ...q,
          id: id.toString(),
          productSubCategory:
            foundAgrifoodProductSubCategory?.subCategoryNameEnglish || "",
        };
      });

      // console.log("queryResult", queryResult.length, filterQuery);
      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    countAllAgrifoodProductions: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let profileQuery = {};

      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   icPassportNo: context.activeSession.User.icNo,
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
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

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
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
              in: companyProfile.map((c) => c.uuid),
            },
          };
        } else if (filtered.id === "productCategory") {
          const productCategory =
            await context.prisma.agrifoodProductCategory.findMany({
              where: {
                productNameEnglish: {
                  contains: filtered.value,
                },
                ...NOT_DELETED_DOCUMENT_QUERY,
              },
            });
          filterQuery = {
            ...filterQuery,
            productCategoryUUID: {
              in: productCategory.map((c) => c.uuid),
            },
          };
        } else if (filtered.id === "productSubCategory") {
          const productSubCategory =
            await context.prisma.agrifoodProductSubCategory.findMany({
              where: {
                subCategoryNameEnglish: {
                  contains: filtered.value,
                },
                ...NOT_DELETED_DOCUMENT_QUERY,
              },
            });
          filterQuery = {
            ...filterQuery,
            productSubCategoryUUID: {
              in: productSubCategory.map((c) => c.uuid),
            },
          };
        } else if (filtered.id === "productName") {
          const productCatalogue =
            await context.prisma.productCatalogueDetails.findMany({
              where: {
                name: {
                  contains: filtered.value,
                },
                ...NOT_DELETED_DOCUMENT_QUERY,
              },
            });
          filterQuery = {
            ...filterQuery,
            productCatalogueUUID: {
              in: productCatalogue.map((c) => c.uuid),
            },
          };
        }
      }

      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
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

      let queryResult = await context.prisma.agrifoodProduction.count({
        where: {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });
      return queryResult;
    },
    tokenizedAllAgrifoodProductionsPaginated: async (self, params, context) => {
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

      // if (!role || !role.privileges.includes("Production Agrifood:Read")) {
      //   return [];
      // }

      let profileQuery = {};

      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   icPassportNo: context.activeSession.User.icNo,
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
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

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
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
                ...profileQuery,
                ...NOT_DELETED_DOCUMENT_QUERY,
              },
            });
          filterQuery = {
            ...filterQuery,
            companyUUID: {
              in: companyProfile.map((c) => c.uuid),
            },
          };
        } else if (filtered.id === "productCategory") {
          const productCategory =
            await context.prisma.agrifoodProductCategory.findMany({
              where: {
                productNameEnglish: {
                  contains: filtered.value,
                },
                ...NOT_DELETED_DOCUMENT_QUERY,
              },
            });
          filterQuery = {
            ...filterQuery,
            productCategoryUUID: {
              in: productCategory.map((c) => c.uuid),
            },
          };
        } else if (filtered.id === "productSubCategory") {
          const productSubCategory =
            await context.prisma.agrifoodProductSubCategory.findMany({
              where: {
                subCategoryNameEnglish: {
                  contains: filtered.value,
                },
                ...NOT_DELETED_DOCUMENT_QUERY,
              },
            });
          filterQuery = {
            ...filterQuery,
            productSubCategoryUUID: {
              in: productSubCategory.map((c) => c.uuid),
            },
          };
        } else if (filtered.id === "productName") {
          const productCatalogue =
            await context.prisma.productCatalogueDetails.findMany({
              where: {
                name: {
                  contains: filtered.value,
                },
                ...NOT_DELETED_DOCUMENT_QUERY,
              },
            });
          filterQuery = {
            ...filterQuery,
            productCatalogueUUID: {
              in: productCatalogue.map((c) => c.uuid),
            },
          };
        }
      }

      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
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

      let queryResult = await context.prisma.agrifoodProduction.findMany({
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

      let agrifoodCompanyProfile =
        await context.prisma.agrifoodCompanyProfile.findMany({
          where: {
            uuid: {
              in: queryResult.map((q) => q.companyUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      // agrifoodCompanyProfile = agrifoodCompanyProfile.map((q) => {
      //   let mobileNo = BigInt(q.mobileNo);
      //   let telephoneNo = BigInt(q.telephoneNo);
      //   return {
      //     ...q,
      //     mobileNo: mobileNo.toString(),
      //     telephoneNo: telephoneNo.toString(),
      //   };
      // });

      const indexedAgrifoodCompanyProfile = agrifoodCompanyProfile.reduce(
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
        let foundAgrifoodCompany = indexedAgrifoodCompanyProfile[q.companyUUID];
        return {
          ...q,
          companyName: foundAgrifoodCompany?.companyName,
        };
      });

      const agrifoodPremiseProfile =
        await context.prisma.agrifoodPremiseProfile.findMany({
          where: {
            uuid: {
              in: queryResult.map((q) => q.premiseUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedAgrifoodPremiseProfile = agrifoodPremiseProfile.reduce(
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
        let foundPremiseProfile = indexedAgrifoodPremiseProfile[q.premiseUUID];
        return {
          ...q,
          premiseProfile: foundPremiseProfile?.premiseAddress,
        };
      });

      const agrifoodProductCategory =
        await context.prisma.agrifoodProductCategory.findMany({
          where: {
            uuid: {
              in: queryResult.map((q) => q.productCategoryUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedAgrifoodProductCategory = agrifoodProductCategory.reduce(
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
        let foundAgrifoodProductCategory =
          indexedAgrifoodProductCategory[q.productCategoryUUID];
        return {
          ...q,
          productCategory: foundAgrifoodProductCategory?.productNameEnglish,
        };
      });

      const agrifoodProductSubCategory =
        await context.prisma.agrifoodProductSubCategory.findMany({
          where: {
            uuid: {
              in: queryResult.map((q) => q.productSubCategoryUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedAgrifoodProductSubCategory =
        agrifoodProductSubCategory.reduce((all, subCat) => {
          if (!all[subCat.uuid]) {
            all[subCat.uuid] = {};
          }
          all[subCat.uuid] = {
            ...subCat,
            id: subCat.id.toString(),
          };
          return all;
        }, {});

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        let foundAgrifoodProductSubCategory =
          indexedAgrifoodProductSubCategory[q.productSubCategoryUUID];
        return {
          ...q,
          id: id.toString(),
          productSubCategory:
            foundAgrifoodProductSubCategory?.subCategoryNameEnglish || "",
        };
      });

      // console.log("queryResult", queryResult.length, filterQuery);
      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
  },
  Mutation: {
    createAgrifoodProduction: async (self, params, context) => {
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
      await context.prisma.agrifoodProduction.create({
        data: {
          ...createPayload,
        },
      });
      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "agrifoodProduction",
          log: {
            ...createPayload,
          },
        },
      });
      return "success";
    },
    updateAgrifoodProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.agrifoodProduction.update({
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
          tableName: "agrifoodProduction",
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
    deleteAgrifoodProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData = await context.prisma.agrifoodProduction.findUnique({
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

      await context.prisma.agrifoodProduction.update({
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
          tableName: "agrifoodProduction",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportAgrifoodProduction: async (self, params, context) => {
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
        filterQuery = {
          monthYear: params.monthYear,
        };
      }

      if (params.companyUUID) {
        arraysFilter.push({
          companyUUID: {
            in: [params.companyUUID],
          },
        });
      }

      if (params.productCategoryUUID) {
        arraysFilter.push({
          productCategoryUUID: {
            in: [params.productCategoryUUID],
          },
        });
      }

      if (params.productSubCategoryUUID) {
        arraysFilter.push({
          productSubCategoryUUID: {
            in: [params.productSubCategoryUUID],
          },
        });
      }

      if (params.productName) {
        arraysFilter.push({
          productName: {
            contains: params.productName,
          },
        });
      }

      if (arraysFilter.length !== 0) {
        filterQuery = {
          ...filterQuery,
          OR: arraysFilter,
        };
      }

      let profileQuery = {};
      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        // profileQuery = {
        //   icPassportNo: context.activeSession.User.icNo,
        //   rocbnRegNo: context.activeSession.User.doaaRegNo,
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

      let agrifoodProductions =
        await context.prisma.agrifoodProduction.findMany({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      agrifoodProductions = agrifoodProductions.filter(
        (prod) =>
          prod.companyUUID &&
          prod.premiseUUID &&
          prod.productCategoryUUID &&
          prod.productSubCategoryUUID &&
          prod.productCatalogueUUID
      );
      let agrifoodCompanyProfile =
        await context.prisma.agrifoodCompanyProfile.findMany({
          where: {
            uuid: {
              in: lodash.uniq(
                agrifoodProductions.map((ret) => ret.companyUUID)
              ),
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

      let agrifoodPremiseProfile =
        await context.prisma.agrifoodPremiseProfile.findMany({
          where: {
            uuid: {
              in: lodash.uniq(
                agrifoodProductions.map((ret) => ret.premiseUUID)
              ),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      const indexedAgrifoodPremiseProfile = agrifoodPremiseProfile.reduce(
        (all, premise) => {
          if (!all[premise.uuid]) {
            all[premise.uuid] = {};
          }
          all[premise.uuid] = premise;
          return all;
        },
        {}
      );

      let agrifoodProductCategory =
        await context.prisma.agrifoodProductCategory.findMany({
          where: {
            uuid: {
              in: lodash.uniq(
                agrifoodProductions.map((ret) => ret.productCategoryUUID)
              ),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      const indexedProductCatalogue = agrifoodProductCategory.reduce(
        (all, premise) => {
          if (!all[premise.uuid]) {
            all[premise.uuid] = {};
          }
          all[premise.uuid] = premise;
          return all;
        },
        {}
      );

      let subCategory =
        await context.prisma.agrifoodProductSubCategory.findMany({
          where: {
            uuid: {
              in: lodash.uniq(
                agrifoodProductions.map((ret) => ret.productSubCategoryUUID)
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

      let productCatalogueDetailsAgrifood =
        await context.prisma.productCatalogueDetails.findMany({
          where: {
            // uuid: {
            //   in: lodash.uniq(agrifoodProductions.map((ret) => ret.productCatalogueUUID)),
            // },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      const indexedProductCatalogueDetails =
        productCatalogueDetailsAgrifood.reduce((all, product) => {
          if (!all[product.uuid]) {
            all[product.uuid] = {};
          }
          all[product.uuid] = product;
          return all;
        }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Agrifood Production");

      let headerRow = [
        "DATE",
        "COMPANY NAME",
        "PREMISE ADDRESS",
        "PRODUCT CATEGORY",
        "PRODUCT SUB CATEGORY",
        "PRODUCT NAME",
        "PRICE PER UNIT ($)",
        "NET WEIGHT (G)",
        "UNIT PRODUCE",
        "QUANTITY PRODUCED (KG)",
        "PERCENTAGE EXPORTED (%)",
        "VALUE PRODUCED ($)",
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

      for (const agrifoodProduction of agrifoodProductions) {
        const agrifoodCompanyProfile =
          indexedAgrifoodCompanyProfile[agrifoodProduction.companyUUID];
        const agrifoodPremiseProfile =
          indexedAgrifoodPremiseProfile[agrifoodProduction.premiseUUID];
        const productCatalogue =
          indexedProductCatalogue[agrifoodProduction.productCategoryUUID];
        const subCategory =
          indexedSubCategory[agrifoodProduction.productSubCategoryUUID];
        let productCatalogueDetails =
          indexedProductCatalogueDetails[
            agrifoodProduction.productCatalogueUUID
          ];

        if (!productCatalogueDetails) {
          productCatalogueDetails = productCatalogueDetailsAgrifood.find(
            (prod) =>
              prod.productCatalogueUUID ===
                agrifoodProduction.productCatalogueUUID &&
              prod.name === agrifoodProduction.productName
          );
        }

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: agrifoodProduction?.monthYear || "",
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
          value: agrifoodPremiseProfile?.premiseAddress || "",
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
          value: productCatalogue?.productNameEnglish || "",
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
          value: agrifoodProduction?.pricePerUnit || "",
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
          value: agrifoodProduction?.netWeight || "",
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
          value: agrifoodProduction?.actualUnit || "",
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
          value: agrifoodProduction?.quantity || "",
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
          value: agrifoodProduction?.percentageExported || "",
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
          value: agrifoodProduction?.valueProduced || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        colCounter = 0;
        rowCounter += 1;
      }

      // Write to buffer instead of file
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
      // const filename = `agrifood_production.xlsx`;
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
      // // throw new Error("error")
      // return fileUrl;
    },
    tokenizedCreateAgrifoodProduction: async (self, params, context) => {
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
        priceLists,
        productLists,
        listSubCategory,
        records,
        CompanyProfile,
        ...payload
      } = tokenized;

      if (!payload.companyUUID) {
        throw new Error("Please fill the company name fields");
      }

      if (!payload.actualUnit) {
        throw new Error("Unit produced cannot be zero");
      }
      // console.log(payload);
      const duplicates = await context.prisma.agrifoodProduction.findMany({
        where: {
          monthYear: payload.monthYear,
          companyUUID: payload.companyUUID,
          productSubCategoryUUID: payload.productSubCategoryUUID,
          productCatalogueUUID: payload.productCatalogueUUID,
          productName: payload.productName,
          pricePerUnit: payload.pricePerUnit,
          netWeight: payload.netWeight,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      if (duplicates.length > 0) {
        throw new Error("Duplicate Data");
      }

      if (!payload.premiseUUID) {
        throw new Error("Invalid Premise Address");
      }

      if (!payload.productCategoryUUID) {
        throw new Error("Invalid Product Category");
      }

      if (!payload.productSubCategoryUUID) {
        throw new Error("Invalid Product Sub Category");
      }

      if (!payload.productCatalogueUUID) {
        throw new Error("Invalid Product Catalogue");
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

      // console.log({ createPayload });
      await context.prisma.agrifoodProduction.create({
        data: {
          ...createPayload,
        },
      });
      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "agrifoodProduction",
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
    tokenizedUpdateAgrifoodProduction: async (self, params, context) => {
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
        premiseProfile,
        companyName,
        productCategory,
        productSubCategory,
        priceLists,
        productLists,
        listSubCategory,
        CompanyProfile,
        records,
        ...payload
      } = tokenized;

      if (!payload.companyUUID) {
        throw new Error("Please fill the company name fields");
      }

      if (!payload.premiseUUID) {
        throw new Error("Invalid Premise Address");
      }

      if (!payload.productCategoryUUID) {
        throw new Error("Invalid Product Category");
      }

      if (!payload.productSubCategoryUUID) {
        throw new Error("Invalid Product Sub Category");
      }

      if (!payload.productCatalogueUUID) {
        throw new Error("Invalid Product Catalogue");
      }

      await context.prisma.agrifoodProduction.update({
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
          tableName: "agrifoodProduction",
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

    tokenizedDeleteAgrifoodProduction: async (self, params, context) => {
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

      let getDeletedData = await context.prisma.agrifoodProduction.findUnique({
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

      await context.prisma.agrifoodProduction.update({
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
          tableName: "agrifoodProduction",
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

    generateAgrifoodProductionTemplate: async (self, params, context) => {
      const company =
        await await context.prisma.agrifoodCompanyProfile.findUnique({
          where: {
            uuid: params.companyUUID,
          },
        });

      const premise = await context.prisma.agrifoodPremiseProfile.findUnique({
        where: {
          uuid: params.premiseUUID,
        },
      });

      if (company.uuid !== premise.companyUUID) {
        throw new Error("Invalid Company or Premise Address");
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

      let headerRow = [
        "uuid",
        "month_year",
        "company_uuid",
        "company_name",
        "premise_uuid",
        "product_category_uuid",
        "product_category",
        "product_sub_category_uuid",
        "product_sub_category",
        "product_catalogue_uuid",
        "product_name",
        "price_per_unit",
        "net_weight",
        "actual_unit",
        "quantity",
        "percentage_export",
        "value_produced",
        "created_at",
        "updated_at",
        "deleted_at",
        "created_by",
        "updated_by",
        "deletedBy",
        "premise_addres",
      ];

      let columnWidths = [];
      for (let c = 0; c < headerRow.length; c++) {
        columnWidths.push(30);
      }

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Sheet1");

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

      for (const recordGenerate of params.recordGenerate) {
        const productCategory =
          await context.prisma.agrifoodProductCategory.findUnique({
            where: {
              uuid: recordGenerate.productCategoryUUID,
            },
          });

        const productSubCategory =
          await context.prisma.agrifoodProductSubCategory.findUnique({
            where: {
              uuid: recordGenerate.productSubCategoryUUID,
            },
          });

        const productCatalogue =
          await context.prisma.productCatalogueDetails.findUnique({
            where: {
              uuid: recordGenerate.productCatalogueUUID,
            },
          });

        if (!recordGenerate.totalRecordWillGenrate) {
          throw new Error("Invalid Record Will Generate");
        }

        if (!productCategory) {
          throw new Error("Invalid Category");
        }

        if (!productSubCategory) {
          throw new Error("Invalid Sub Category");
        }

        if (!productCatalogue) {
          throw new Error("Invalid Product Catalogue");
        }
        for (let i = 0; i < recordGenerate.totalRecordWillGenrate; i++) {
          excelHelper.addText({
            sheet: productionSheet,
            row: rowCounter,
            col: ++colCounter,
            value: "IMPORT" + uuidv4(),
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
            value: "",
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
            value: company.uuid,
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
            value: company.companyName,
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
            value: premise.uuid,
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
            value: productCategory.uuid,
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
            value: productCategory.productNameMalay,
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
            value: productSubCategory.uuid,
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
            value: productSubCategory.subCategoryNameMalay,
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
            value: productCatalogue.uuid,
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
            value: productCatalogue.name,
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
            value: 0, //price per unit
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
            value: 0, //net weight
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
            value: recordGenerate.pricePerUnit, //actual unit
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
            value: 0, //percentage export
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
            value: 0, // value produced
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
            value: null, //created at
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
            value: null, //updated at
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
            value: null, // deleted at
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
            value: null, //created by
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
            value: null, //updated by
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
            value: null, //deleted by
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
            value: null, //deleted by
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
            value: premise.premiseAddress, //Premis Address
            alignment: {
              vertical: "middle",
              horizontal: "left",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });
          rowCounter++;
          colCounter = 0;
        }
      }

      const PREFIX = "DoAA";

      if (!fs.existsSync(process.cwd() + "/static/cache/")) {
        fs.mkdirSync(process.cwd() + "/static/cache/");
      }
      if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
        fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
      }
      const filename = `agrifood_production_template.xlsx`;
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

      return "success";
    },

    tokenizedCreateManyAgrifoodProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let userId = "";

      if (context.activeSession.User && context.activeSession.User.uuid) {
        userId = context.activeSession.User.uuid;
      }

      if (!userId) {
        throw new Error("Invalid Session !!!");
      }

      const tokenized = jwt.verify(params.tokenized, TOKENIZE);
      const { iat, tokenizedPayload } = tokenized;

      const payloads = tokenizedPayload.map((data) => {
        const {
          priceLists,
          productLists,
          listSubCategory,
          CompanyProfile,
          ...payload
        } = data;
        return {
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
      });

      for (const payload of payloads) {
        if (!payload.companyUUID) {
          throw new Error("Please fill the company name fields");
        }

        if (!payload.actualUnit) {
          throw new Error("Unit produced cannot be zero");
        }

        const duplicates = await context.prisma.agrifoodProduction.findMany({
          where: {
            monthYear: payload.monthYear,
            companyUUID: payload.companyUUID,
            productSubCategoryUUID: payload.productSubCategoryUUID,
            productCatalogueUUID: payload.productCatalogueUUID,
            productName: payload.productName,
            pricePerUnit: payload.pricePerUnit,
            netWeight: payload.netWeight,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        if (duplicates.length > 0) {
          throw new Error("Duplicate Data");
        }

        if (!payload.premiseUUID) {
          throw new Error("Invalid Premise Address");
        }

        if (!payload.productCategoryUUID) {
          throw new Error("Invalid Product Category");
        }

        if (!payload.productSubCategoryUUID) {
          throw new Error("Invalid Product Sub Category");
        }

        if (!payload.productCatalogueUUID) {
          throw new Error("Invalid Product Catalogue");
        }
      }

      // console.log(payloads);

      await context.prisma.agrifoodProduction.createMany({
        data: payloads,
        skipDuplicates: false,
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "agrifoodProduction",
          log: {
            agrifoodProductionIds: payloads.map((data) => data.uuid),
          },
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      return "success";
    },
  },
  AgrifoodProduction: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    companyName: async (self, params, context) => {
      const found = await context.prisma.agrifoodCompanyProfile.findUnique({
        where: {
          uuid: self.companyUUID,
        },
      });

      return found?.companyName || "";
    },
    premiseAddress: async (self, params, context) => {
      const found = await context.prisma.agrifoodPremiseProfile.findUnique({
        where: {
          uuid: self.premiseUUID,
        },
      });

      return found?.premiseAddress || "";
    },
    productCategory: async (self, params, context) => {
      const found = await context.prisma.agrifoodProductCategory.findUnique({
        where: {
          uuid: self.productCategoryUUID,
        },
      });

      return found?.productNameEnglish || "";
    },
    productSubCategory: async (self, params, context) => {
      const found = await context.prisma.agrifoodProductSubCategory.findUnique({
        where: {
          uuid: self.productSubCategoryUUID,
        },
      });

      return found?.subCategoryNameEnglish || "";
    },
  },
};
exports.resolvers = resolvers;
