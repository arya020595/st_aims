const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const dayjs = require("dayjs");
const { contentType } = require("mime-types");
const jwt = require("jsonwebtoken");
const { name } = require("agenda/dist/agenda/name");
const TOKENIZE = process.env.TOKENIZE;
const lodash = require("lodash");

const resolvers = {
  Query: {
    allBioSecurityImportData: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("Import Data:Read")) {
        return [];
      }

      let filterQuery = {};

      if (params.monthYear) {
        let startDate = dayjs(params.monthYear)
          .startOf("month")
          .format("YYYY-MM-DD");

        let endDate = dayjs(params.monthYear)
          .endOf("month")
          .format("YYYY-MM-DD");

        filterQuery = {
          entryDate: {
            gte: startDate,
            lte: endDate,
          },
        };
      }
      let queryFilter = {
        ...NOT_DELETED_DOCUMENT_QUERY,
      };

      if (context.activeSession.User && context.activeSession.User.uuid) {
        queryFilter = {
          pointOfEntry: context.activeSession.User.controlPost,
          district: context.activeSession.User.district,
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        };

        if (context.activeSession.User.isUserBioSecurityEnforcementOnly) {
          queryFilter = {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          };
        }
      }
      if (
        context.activeSession.User.userId &&
        context.activeSession.User.userId === "__ROOT__"
      ) {
        queryFilter = {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        };
      }

      let queryResult = await context.prisma.bioSecurityImportData.findMany({
        where: queryFilter,
        orderBy: {
          id: "desc",
        },
      });
      return queryResult;
    },
    tokenizedAllBioSecurityImportData: async (self, params, context) => {
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

      // if (!role || !role.privileges.includes("Import Data:Read")) {
      //   return [];
      // }

      let filterQuery = {};

      if (params.monthYear) {
        let startDate = dayjs(params.monthYear)
          .startOf("month")
          .format("YYYY-MM-DD");

        let endDate = dayjs(params.monthYear)
          .endOf("month")
          .format("YYYY-MM-DD");

        filterQuery = {
          entryDate: {
            gte: startDate,
            lte: endDate,
          },
        };
      }
      let queryFilter = {
        ...NOT_DELETED_DOCUMENT_QUERY,
      };

      if (context.activeSession.User && context.activeSession.User.uuid) {
        queryFilter = {
          pointOfEntry: context.activeSession.User.controlPost,
          district: context.activeSession.User.district,
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        };

        if (context.activeSession.User.isUserBioSecurityEnforcementOnly) {
          queryFilter = {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          };
        }
      }
      if (
        context.activeSession.User.userId &&
        context.activeSession.User.userId === "__ROOT__"
      ) {
        queryFilter = {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        };
      }

      let queryResult = await context.prisma.bioSecurityImportData.findMany({
        where: queryFilter,
        orderBy: {
          id: "desc",
        },
      });

      let countryUUIDs = queryResult
        .filter((q) => q.countryUUID)
        .map((q) => q.countryUUID);
      countryUUIDs = lodash.uniq(countryUUIDs);
      const bioSecurityCountry =
        await context.prisma.bioSecurityCountry.findMany({
          where: {
            uuid: {
              in: countryUUIDs,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedBioSecurityCountry = bioSecurityCountry.reduce(
        (all, cnt) => {
          if (!all[cnt.uuid]) {
            all[cnt.uuid] = {};
          }
          all[cnt.uuid] = {
            ...cnt,
            id: cnt.id.toString(),
          };
          return all;
        },
        {}
      );

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          Country: indexedBioSecurityCountry[q.countryUUID]
            ? indexedBioSecurityCountry[q.countryUUID]
            : {},
        };
      });

      let filterTypeOfCommodity = queryResult
        .map((q) => q.typeOfComodityUUID)
        .filter((ret) => ret);

      filterTypeOfCommodity = lodash.uniq(filterTypeOfCommodity);

      const bioSecurityTypeOfComodity =
        await context.prisma.bioSecurityTypeOfComodity.findMany({
          where: {
            uuid: {
              in: filterTypeOfCommodity,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedBioSecurityTypeOfComodity = bioSecurityTypeOfComodity.reduce(
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
        return {
          ...q,
          TypeOfComodity: indexedBioSecurityTypeOfComodity[q.typeOfComodityUUID]
            ? indexedBioSecurityTypeOfComodity[q.typeOfComodityUUID]
            : {},
        };
      });

      let filteredTypeOFCommodityDetails = queryResult
        .map((q) => q.comodityDetailUUID)
        .filter((ret) => ret);

      filteredTypeOFCommodityDetails = lodash.uniq(
        filteredTypeOFCommodityDetails
      );

      let bioSecurityTypeOfComodityDetails =
        await context.prisma.bioSecurityTypeOfComodityDetails.findMany({
          where: {
            uuid: {
              in: filteredTypeOFCommodityDetails,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      let bioSecurityCategoryUUIDs = queryResult
        .map((q) => q.bioSecurityCategoryUUID)
        .filter((ret) => ret);

      bioSecurityCategoryUUIDs = lodash.uniq(bioSecurityCategoryUUIDs);

      const bioSecurityCategory =
        await context.prisma.bioSecurityCategory.findMany({
          where: {
            uuid: {
              in: bioSecurityCategoryUUIDs,
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

      const indexedBioSecurityTypeOfComodityDetails =
        bioSecurityTypeOfComodityDetails.reduce((all, prof) => {
          if (!all[prof.uuid]) {
            all[prof.uuid] = {};
          }
          all[prof.uuid] = {
            ...prof,
            id: prof.id.toString(),
          };
          return all;
        }, {});

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          ComodityDetail: indexedBioSecurityTypeOfComodityDetails[
            q.comodityDetailUUID
          ]
            ? indexedBioSecurityTypeOfComodityDetails[q.comodityDetailUUID]
            : {},
        };
      });

      let filteredBioSecuirtyCompany = queryResult
        .map((q) => q.companyUUID)
        .filter((ret) => ret);

      filteredBioSecuirtyCompany = lodash.uniq(filteredBioSecuirtyCompany);

      const bioSecurityCompanyProfile =
        await context.prisma.bioSecurityCompanyProfile.findMany({
          where: {
            uuid: {
              in: filteredBioSecuirtyCompany,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedBioSecurityCompanyProfile = bioSecurityCompanyProfile.reduce(
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
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
          Company: indexedBioSecurityCompanyProfile[q.companyUUID]
            ? indexedBioSecurityCompanyProfile[q.companyUUID]
            : {},
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    tokenizedAllBioSecurityImportDataPaginated: async (
      self,
      params,
      context
    ) => {
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

      // if (!role || !role.privileges.includes("Import Data:Read")) {
      //   return [];
      // }

      let filterQuery = {};

      if (params.monthYear) {
        let startDate = dayjs(params.monthYear)
          .startOf("month")
          .format("YYYY-MM-DD");

        let endDate = dayjs(params.monthYear)
          .endOf("month")
          .format("YYYY-MM-DD");

        filterQuery = {
          entryDate: {
            gte: startDate,
            lte: endDate,
          },
        };
      }
      let queryFilter = {
        ...NOT_DELETED_DOCUMENT_QUERY,
      };

      let searchQuery = [];
      if (params.filters) {
        searchQuery = JSON.parse(params.filters);
      }

      let filteredCompanyProfileId = [];
      let filteredComodityDetailsId = [];
      for (const filtered of searchQuery) {
        if (filtered.id === "pointOfEntry") {
          filterQuery = {
            ...filterQuery,
            pointOfEntry: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "entryDate") {
          filterQuery = {
            ...filterQuery,
            entryDate: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "Company.companyRegNo") {
          const companyPorfile =
            await context.prisma.bioSecurityCompanyProfile.findMany({
              where: {
                companyRegNo: {
                  contains: filtered.value,
                },
              },
            });
          filteredCompanyProfileId.push(
            ...companyPorfile.map((com) => com.uuid)
          );
        } else if (filtered.id === "Company.companyName") {
          const companyPorfile =
            await context.prisma.bioSecurityCompanyProfile.findMany({
              where: {
                companyName: {
                  contains: filtered.value,
                },
              },
            });
          filteredCompanyProfileId.push(
            ...companyPorfile.map((com) => com.uuid)
          );
        } else if (filtered.id === "permitNumber") {
          filterQuery = {
            ...filterQuery,
            permitNumber: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "Country.name") {
          const country = await context.prisma.bioSecurityCountry.findMany({
            where: {
              name: {
                contains: filtered.value,
              },
            },
          });
          filterQuery = {
            ...filterQuery,
            countryUUID: {
              in: country.map((id) => id.uuid),
            },
          };
        } else if (filtered.id === "ComodityDetail.englishName") {
          const catalogueDetails =
            await context.prisma.bioSecurityTypeOfComodityDetails.findMany({
              where: {
                englishName: {
                  contains: filtered.value,
                },
              },
            });
          filteredComodityDetailsId.push(
            ...catalogueDetails.map((cat) => cat.uuid)
          );
        } else if (filtered.id === "ComodityDetail.localName") {
          const catalogueDetails =
            await context.prisma.bioSecurityTypeOfComodityDetails.findMany({
              where: {
                localName: {
                  contains: filtered.value,
                },
              },
            });
          filteredComodityDetailsId.push(
            ...catalogueDetails.map((cat) => cat.uuid)
          );
        }
      }

      if (filteredComodityDetailsId.length > 0) {
        filteredComodityDetailsId = lodash.uniq(filteredComodityDetailsId);
        filterQuery = {
          ...filterQuery,
          comodityDetailUUID: {
            in: filteredComodityDetailsId,
          },
        };
      }

      if (filteredCompanyProfileId.length > 0) {
        filteredCompanyProfileId = lodash.uniq(filteredCompanyProfileId);

        filterQuery = {
          ...filterQuery,
          companyUUID: {
            in: filteredCompanyProfileId,
          },
        };
      }

      if (context.activeSession.User && context.activeSession.User.uuid) {
        queryFilter = {
          pointOfEntry: context.activeSession.User.controlPost,
          district: context.activeSession.User.district,
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        };

        if (context.activeSession.User.isUserBioSecurityEnforcementOnly) {
          queryFilter = {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          };
        }
      }
      if (
        context.activeSession.User.userId &&
        context.activeSession.User.userId === "__ROOT__"
      ) {
        queryFilter = {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        };
      }

      if (queryFilter.pointOfEntry === "All") {
        delete queryFilter.pointOfEntry;
        delete queryFilter.district;
      }

      let queryResult = await context.prisma.bioSecurityImportData.findMany({
        where: queryFilter,
        orderBy: {
          id: "desc",
        },
        skip: params.pageIndex * params.pageSize,
        take: params.pageSize,
      });

      let countryIds = queryResult
        .filter((qr) => qr.countryUUID)
        .map((q) => q.countryUUID);

      countryIds = lodash.uniq(countryIds);

      const bioSecurityCountry =
        await context.prisma.bioSecurityCountry.findMany({
          where: {
            uuid: {
              in: countryIds,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedBioSecurityCountry = bioSecurityCountry.reduce(
        (all, cnt) => {
          if (!all[cnt.uuid]) {
            all[cnt.uuid] = {};
          }
          all[cnt.uuid] = {
            ...cnt,
            id: cnt.id.toString(),
          };
          return all;
        },
        {}
      );

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          Country: indexedBioSecurityCountry[q.countryUUID]
            ? indexedBioSecurityCountry[q.countryUUID]
            : {},
        };
      });

      // const filterTypeOfCommodity = queryResult
      //   .map((q) => q.typeOfComodityUUID)
      //   .filter((ret) => ret);

      let filterTypeOfCommodityIds = queryResult
        .map((q) => q.typeOfComodityUUID)
        .filter((ret) => ret);
      filterTypeOfCommodityIds = lodash.uniq(filterTypeOfCommodityIds);
      const bioSecurityTypeOfComodity =
        await context.prisma.bioSecurityTypeOfComodity.findMany({
          where: {
            uuid: {
              in: filterTypeOfCommodityIds,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedBioSecurityTypeOfComodity = bioSecurityTypeOfComodity.reduce(
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
        return {
          ...q,
          TypeOfComodity: indexedBioSecurityTypeOfComodity[q.typeOfComodityUUID]
            ? indexedBioSecurityTypeOfComodity[q.typeOfComodityUUID]
            : {},
        };
      });

      // const filteredTypeOFCommodityDetails = queryResult
      //   .map((q) => q.comodityDetailUUID)
      //   .filter((ret) => ret);
      let filteredTypeOFCommodityDetails = queryResult
        .map((q) => q.comodityDetailUUID)
        .filter((ret) => ret);
      filteredTypeOFCommodityDetails = lodash.uniq(
        filteredTypeOFCommodityDetails
      );

      let bioSecurityTypeOfComodityDetails =
        await context.prisma.bioSecurityTypeOfComodityDetails.findMany({
          where: {
            uuid: {
              in: filteredTypeOFCommodityDetails,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      let bioSecurityCategoryUUIDIds = bioSecurityTypeOfComodityDetails.map(
        (q) => q.bioSecurityCategoryUUID
      );
      bioSecurityCategoryUUIDIds = lodash.uniq(bioSecurityCategoryUUIDIds);

      const bioSecurityCategory =
        await context.prisma.bioSecurityCategory.findMany({
          where: {
            uuid: {
              in: bioSecurityCategoryUUIDIds,
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

      const indexedBioSecurityTypeOfComodityDetails =
        bioSecurityTypeOfComodityDetails.reduce((all, prof) => {
          if (!all[prof.uuid]) {
            all[prof.uuid] = {};
          }
          all[prof.uuid] = {
            ...prof,
            id: prof.id.toString(),
          };
          return all;
        }, {});

      queryResult = queryResult.map((q) => {
        return {
          ...q,
          ComodityDetail: indexedBioSecurityTypeOfComodityDetails[
            q.comodityDetailUUID
          ]
            ? indexedBioSecurityTypeOfComodityDetails[q.comodityDetailUUID]
            : {},
        };
      });

      // const filteredBioSecuirtyCompany = queryResult
      //   .map((q) => q.companyUUID)
      //   .filter((ret) => ret);

      let filteredBioSecuirtyCompany = queryResult
        .map((q) => q.companyUUID)
        .filter((ret) => ret);

      filteredBioSecuirtyCompany = lodash.uniq(filteredBioSecuirtyCompany);
      const bioSecurityCompanyProfile =
        await context.prisma.bioSecurityCompanyProfile.findMany({
          where: {
            uuid: {
              in: filteredBioSecuirtyCompany,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedBioSecurityCompanyProfile = bioSecurityCompanyProfile.reduce(
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
        let id = BigInt(q.id);
        return {
          ...q,
          id: id.toString(),
          Company: indexedBioSecurityCompanyProfile[q.companyUUID]
            ? indexedBioSecurityCompanyProfile[q.companyUUID]
            : {},
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    countBioSecurityImportData: async (self, params, context) => {
      assertValidSession(context.activeSession);
      let filterQuery = {};

      if (params.monthYear) {
        let startDate = dayjs(params.monthYear)
          .startOf("month")
          .format("YYYY-MM-DD");

        let endDate = dayjs(params.monthYear)
          .endOf("month")
          .format("YYYY-MM-DD");

        filterQuery = {
          entryDate: {
            gte: startDate,
            lte: endDate,
          },
        };
      }
      let queryFilter = {
        ...NOT_DELETED_DOCUMENT_QUERY,
      };

      let searchQuery = [];
      if (params.filters) {
        searchQuery = JSON.parse(params.filters);
      }

      let filteredCompanyProfileId = [];
      let filteredComodityDetailsId = [];
      for (const filtered of searchQuery) {
        if (filtered.id === "pointOfEntry") {
          filterQuery = {
            ...filterQuery,
            pointOfEntry: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "entryDate") {
          filterQuery = {
            ...filterQuery,
            entryDate: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "Company.companyRegNo") {
          const companyPorfile =
            await context.prisma.bioSecurityCompanyProfile.findMany({
              where: {
                companyRegNo: {
                  contains: filtered.value,
                },
              },
            });
          filteredCompanyProfileId.push(
            ...companyPorfile.map((com) => com.uuid)
          );
        } else if (filtered.id === "Company.companyName") {
          const companyPorfile =
            await context.prisma.bioSecurityCompanyProfile.findMany({
              where: {
                companyName: {
                  contains: filtered.value,
                },
              },
            });
          filteredCompanyProfileId.push(
            ...companyPorfile.map((com) => com.uuid)
          );
        } else if (filtered.id === "permitNumber") {
          filterQuery = {
            ...filterQuery,
            permitNumber: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "Country.name") {
          const country = await context.prisma.bioSecurityCountry.findMany({
            where: {
              name: {
                contains: filtered.value,
              },
            },
          });
          filterQuery = {
            ...filterQuery,
            countryUUID: {
              in: country.map((id) => id.uuid),
            },
          };
        } else if (filtered.id === "ComodityDetail.englishName") {
          const catalogueDetails =
            await context.prisma.bioSecurityTypeOfComodityDetails.findMany({
              where: {
                englishName: {
                  contains: filtered.value,
                },
              },
            });
          filteredComodityDetailsId.push(
            ...catalogueDetails.map((cat) => cat.uuid)
          );
        } else if (filtered.id === "ComodityDetail.localName") {
          const catalogueDetails =
            await context.prisma.bioSecurityTypeOfComodityDetails.findMany({
              where: {
                localName: {
                  contains: filtered.value,
                },
              },
            });
          filteredComodityDetailsId.push(
            ...catalogueDetails.map((cat) => cat.uuid)
          );
        }
      }

      if (filteredComodityDetailsId.length > 0) {
        filteredComodityDetailsId = lodash.uniq(filteredComodityDetailsId);
        filterQuery = {
          ...filterQuery,
          comodityDetailUUID: {
            in: filteredComodityDetailsId,
          },
        };
      }

      if (filteredCompanyProfileId.length > 0) {
        filteredCompanyProfileId = lodash.uniq(filteredCompanyProfileId);

        filterQuery = {
          ...filterQuery,
          companyUUID: {
            in: filteredCompanyProfileId,
          },
        };
      }

      if (context.activeSession.User && context.activeSession.User.uuid) {
        queryFilter = {
          pointOfEntry: context.activeSession.User.controlPost,
          district: context.activeSession.User.district,
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        };

        if (context.activeSession.User.isUserBioSecurityEnforcementOnly) {
          queryFilter = {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          };
        }
      }
      if (
        context.activeSession.User.userId &&
        context.activeSession.User.userId === "__ROOT__"
      ) {
        queryFilter = {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        };
      }

      if (queryFilter.pointOfEntry === "All") {
        delete queryFilter.pointOfEntry;
        delete queryFilter.district;
      }

      let queryResult = await context.prisma.bioSecurityImportData.count({
        where: queryFilter,
        orderBy: {
          id: "desc",
        },
      });
      return queryResult;
    },
  },
  Mutation: {
    createBioSecurityImportData: async (self, params, context) => {
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

      await context.prisma.bioSecurityImportData.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "bioSecurityImportData",
          log: {
            ...createPayload,
          },
        },
      });
      return "success";
    },
    updateBioSecurityImportData: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.bioSecurityImportData.update({
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
          tableName: "bioSecurityImportData",
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
    deleteBioSecurityImportData: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData =
        await context.prisma.bioSecurityImportData.findUnique({
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

      await context.prisma.bioSecurityImportData.update({
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
          tableName: "bioSecurityImportData",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportBioSecurityImportData: async (self, params, context) => {
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
        let startDate = dayjs(params.monthYear)
          .startOf("month")
          .format("YYYY-MM-DD");

        let endDate = dayjs(params.monthYear)
          .endOf("month")
          .format("YYYY-MM-DD");

        filterQuery = {
          entryDate: {
            gte: startDate,
            lte: endDate,
          },
        };
      }

      if (params.pointOfEntry) {
        arraysFilter.push({
          pointOfEntry: {
            contains: params.pointOfEntry,
          },
        });
      }

      if (params.companyRegNo) {
        // arraysFilter.push({
        //   companyRegNo: {
        //     contains: params.companyRegNo,
        //   },
        // });
        let allCompanyProfileByRegNumber =
          await context.prisma.bioSecurityCompanyProfile.findMany({
            where: {
              companyRegNo: {
                contains: params.companyRegNo,
              },
            },
          });
        arraysFilter.push({
          companyUUID: {
            in: allCompanyProfileByRegNumber.map((ret) => ret.uuid),
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

      if (params.permitNumber) {
        arraysFilter.push({
          permitNumber: {
            contains: params.permitNumber,
          },
        });
      }

      if (params.countryUUID) {
        arraysFilter.push({
          countryUUID: {
            in: [params.countryUUID],
          },
        });
      }

      if (arraysFilter.length !== 0) {
        filterQuery = {
          ...filterQuery,
          OR: arraysFilter,
        };
      }

      let importDataBioSecurity =
        await context.prisma.bioSecurityImportData.findMany({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      let bioSecurityCompanyProfile =
        await context.prisma.bioSecurityCompanyProfile.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      const indexedBioSecurityCompanyProfile = bioSecurityCompanyProfile.reduce(
        (all, company) => {
          if (!all[company.uuid]) {
            all[company.uuid] = {};
          }
          all[company.uuid] = company;
          return all;
        },
        {}
      );

      let countryUUIDs = importDataBioSecurity
        .filter((rt) => rt.countryUUID)
        .map((ret) => ret.countryUUID);
      countryUUIDs = lodash.uniq(countryUUIDs);

      let bioSecurityCountry = await context.prisma.bioSecurityCountry.findMany(
        {
          where: {
            uuid: {
              in: countryUUIDs,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        }
      );
      const indexedBioSecurityCountry = bioSecurityCountry.reduce(
        (all, Country) => {
          if (!all[Country.uuid]) {
            all[Country.uuid] = {};
          }
          all[Country.uuid] = Country;
          return all;
        },
        {}
      );

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
        (all, Commodity) => {
          if (!all[Commodity.uuid]) {
            all[Commodity.uuid] = {};
          }
          all[Commodity.uuid] = Commodity;
          return all;
        },
        {}
      );

      let bioSecurityTypeOfComodityDetails =
        await context.prisma.bioSecurityTypeOfComodityDetails.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      const indexedBioSecurityTypeOfComodityDetails =
        bioSecurityTypeOfComodityDetails.reduce((all, detail) => {
          if (!all[detail.uuid]) {
            all[detail.uuid] = {};
          }
          all[detail.uuid] = detail;
          return all;
        }, {});

      let bioSecurityUnit = await context.prisma.bioSecurityUnit.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedBioSecurityUnit = bioSecurityUnit.reduce((all, unit) => {
        if (!all[unit.uuid]) {
          all[unit.uuid] = {};
        }
        all[unit.uuid] = unit;
        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Import Data Bio Security");

      let headerRow = [
        "POINT OF ENTRY",
        "DATE OF ENTRY",
        "COMPANY REGISTRATION NUMBER",
        "COMPANY NAME",
        "PERMIT NUMBER",
        "HEALTH CERTIFICATE NUMBER",
        "EXPORTING COUNTRY",
        "TYPE OF COMMODITY",
        "PRODUCT NAME",
        "CATEGORY",
        "PRODUCT CODE",
        "QUANTITY",
        "UNIT",
        "CIF($)",
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
      for (const importBio of importDataBioSecurity) {
        const bioSecurityCompanyProfile =
          indexedBioSecurityCompanyProfile[importBio.companyUUID];
        const bioSecurityCountry =
          indexedBioSecurityCountry[importBio.countryUUID];
        const bioSecurityTypeOfComodity =
          indexedBioSecurityTypeOfComodity[importBio.typeOfComodityUUID];
        const bioSecurityTypeOfComodityDetails =
          indexedBioSecurityTypeOfComodityDetails[importBio.comodityDetailUUID];

        let bioSecurityUnit = null;
        if (
          bioSecurityTypeOfComodityDetails &&
          bioSecurityTypeOfComodityDetails.bioSecurityUnitUUID
        ) {
          bioSecurityUnit =
            indexedBioSecurityUnit[
              bioSecurityTypeOfComodityDetails.bioSecurityUnitUUID
            ];
        }

        let productName = null;

        if (importBio.comodityDetailUUID) {
          productName = `${
            bioSecurityTypeOfComodityDetails?.localName || "-"
          } - ${bioSecurityTypeOfComodityDetails?.englishName || "-"}`;
        }

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: importBio?.pointOfEntry || "",
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
          value: importBio?.entryDate || "",
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
          value: bioSecurityCompanyProfile?.companyRegNo || "",
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
          value: bioSecurityCompanyProfile?.companyName || "",
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
          value: importBio?.permitNumber || "",
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
          value: importBio?.healthCertificateNumber || "",
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
          value: bioSecurityCountry?.name || "",
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
          value: bioSecurityTypeOfComodity?.name || "",
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
          value: productName,
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
          value: bioSecurityTypeOfComodity?.name || "",
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
          value: bioSecurityTypeOfComodityDetails?.code || "",
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
          value: importBio?.quantity || "",
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
          value: bioSecurityUnit?.name || "",
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
          value: importBio?.cif || "",
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
      // return "ok";
      // const PREFIX = "DoAA";

      // if (!fs.existsSync(process.cwd() + "/static/cache/")) {
      //   fs.mkdirSync(process.cwd() + "/static/cache/");
      // }
      // if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
      //   fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
      // }
      // const filename = `import_data_bio_security.xlsx`;
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
    tokenizedCreateBioSecurityImportData: async (self, params, context) => {
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

      let {
        iat,
        productList,
        unit,
        code,
        category,
        _id,
        companyName,
        companyRegNo,
        record,
        id,
        TypeOfComodity,
        createdBy,
        updatedBy,
        ComodityDetails,
        name,
        description,
        companyCropRegNo,
        companyAnimalRegNo,
        ...payload
      } = tokenized;

      // if (payload.pointOfEntry === "All") {
      //   throw new Error("Not Allowed To Saved");
      // }

      if (!payload.companyUUID) {
        throw new Error("Company cannot be empty");
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
      if (createPayload.registrationNumber) {
        delete createPayload.registrationNumber;
      }
      if (createPayload.companyCropRegNo) {
        delete createPayload.companyCropRegNo;
      }
      if (createPayload.companyAnimalRegNo) {
        delete createPayload.companyAnimalRegNo;
      }

      await context.prisma.bioSecurityImportData.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "bioSecurityImportData",
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
    tokenizedUpdateBioSecurityImportData: async (self, params, context) => {
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

      let {
        iat,
        id,
        createdAt,
        createdBy,
        updatedAt,
        updatedBy,
        deletedAt,
        deletedBy,
        productList,
        Company,
        ComodityDetail,
        TypeOfComodity,
        Country,
        __typename,
        companyRegNo,
        companyName,
        category,
        code,
        unit,
        companyCropRegNo,
        companyAnimalRegNo,
        ...payload
      } = tokenized;

      // if (payload.pointOfEntry === "All") {
      //   delete payload.pointOfEntry
      //   // throw new Error("Not Allowed To Update");
      // }

      if (!payload.companyUUID) {
        throw new Error("Company cannot be empty");
      }

      await context.prisma.bioSecurityImportData.update({
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
          tableName: "bioSecurityImportData",
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
    tokenizedDeleteBioSecurityImportData: async (self, params, context) => {
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
        await context.prisma.bioSecurityImportData.findUnique({
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

      await context.prisma.bioSecurityImportData.update({
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
          tableName: "bioSecurityImportData",
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
  BioSecurityImportData: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    Country: async (self, params, context) => {
      if (self.countryUUID) {
        return await context.prisma.bioSecurityCountry.findUnique({
          where: {
            uuid: self.countryUUID,
          },
        });
      }
      return null;
    },
    TypeOfComodity: async (self, params, context) => {
      if (self.typeOfComodityUUID) {
        return await context.prisma.bioSecurityTypeOfComodity.findUnique({
          where: {
            uuid: self.typeOfComodityUUID,
          },
        });
      }
      return null;
    },
    ComodityDetail: async (self, params, context) => {
      if (self.comodityDetailUUID) {
        return await context.prisma.bioSecurityTypeOfComodityDetails.findUnique(
          {
            where: {
              uuid: self.comodityDetailUUID,
            },
          }
        );
      }
      return null;
    },
    Company: async (self, params, context) => {
      if (self.companyUUID) {
        return await context.prisma.bioSecurityCompanyProfile.findUnique({
          where: {
            uuid: self.companyUUID,
          },
        });
      }
      return null;
    },
  },
};
exports.resolvers = resolvers;
