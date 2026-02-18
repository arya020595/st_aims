const { v4: uuidv4 } = require("uuid");
const dayjs = require("dayjs");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { filter } = require("lodash");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const mime = require("mime");
const shelljs = require("shelljs");
const { error } = require("console");
const lodash = require("lodash");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;

const resolvers = {
  Query: {
    allPaddySeedProductions: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("Paddy Seed Production:Read")) {
        return [];
      }

      let profileQuery = {};
      let filterQuery = {};

      if (params.monthYear) {
        filterQuery = {
          plantingMonthYear: params.monthYear,
        };
      }
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

      if (profileQuery.rocbnRegNo) {
        const getCompany = await context.prisma.farmerProfile.findMany({
          where: {
            ...profileQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          select: {
            uuid: true,
            id: true,
          },
          orderBy: {
            id: "desc",
          },
        });
        const found = await context.prisma.paddySeedProduction.findMany({
          where: {
            farmerUUID: {
              in: getCompany.map((c) => c.uuid),
            },
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
        return found;
      } else {
        let queryResult = await context.prisma.paddySeedProduction.findMany({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
        return queryResult;
      }
    },
    tokenizedAllPaddySeedProductions: async (self, params, context) => {
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

      // if (!role || !role.privileges.includes("Paddy Seed Production:Read")) {
      //   return [];
      // }

      let profileQuery = {};
      let filterQuery = {};

      if (params.monthYear) {
        filterQuery = {
          plantingMonthYear: params.monthYear,
        };
      }
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

      if (profileQuery.rocbnRegNo) {
        const getCompany = await context.prisma.farmerProfile.findMany({
          where: {
            ...profileQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          select: {
            uuid: true,
            id: true,
          },
          orderBy: {
            id: "desc",
          },
        });

        // let countPaddySeedProductions = await context.prisma.paddySeedProduction.findMany({
        //   where: {
        //     farmerUUID: {
        //       in: getCompany.map((c) => c.uuid),
        //     },
        //     ...filterQuery,
        //     ...NOT_DELETED_DOCUMENT_QUERY,
        //   },
        //   orderBy: {
        //     id: "desc",
        //   },
        // })

        // countPaddySeedProductions = countPaddySeedProductions.length

        // const pages = Math.ceil(countPaddySeedProductions / params.pageSize)

        let found = await context.prisma.paddySeedProduction.findMany({
          where: {
            farmerUUID: {
              in: getCompany.map((c) => c.uuid),
            },
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
          skip: params.pageIndex * params.pageSize,
          take: params.pageSize,
        });

        let farmerUUIDs = found
          .filter((q) => q.farmerUUID)
          .map((q) => q.farmerUUID);
        farmerUUIDs = lodash.uniq(farmerUUIDs);
        let farmerProfile = await context.prisma.farmerProfile.findMany({
          where: {
            uuid: {
              in: farmerUUIDs,
            },
            // ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        // farmerProfile = farmerProfile.map((q) => {
        //   let mobileNo = BigInt(q.mobileNo);
        //   let telephoneNo = BigInt(q.telephoneNo);
        //   return {
        //     ...q,
        //     mobileNo: mobileNo.toString(),
        //     telephoneNo: telephoneNo.toString(),
        //   };
        // });

        const indexedFarmerProfile = farmerProfile.reduce((all, prof) => {
          if (!all[prof.uuid]) {
            all[prof.uuid] = {};
          }
          all[prof.uuid] = {
            ...prof,
            id: prof.id.toString(),
          };
          return all;
        }, {});

        found = found.map((q) => {
          return {
            ...q,
            FarmerProfile: indexedFarmerProfile[q.farmerUUID]
              ? indexedFarmerProfile[q.farmerUUID]
              : {},
          };
        });

        let farmAreaIds = found
          .filter((q) => q.farmAreaId)
          .map((q) => q.farmAreaId);
        farmAreaIds = lodash.uniq(farmAreaIds);
        let farmProfile = await context.prisma.farmProfile.findMany({
          where: {
            uuid: {
              in: farmAreaIds,
            },
            // ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        const indexedFarmProfile = farmProfile.reduce((all, prof) => {
          if (!all[prof.uuid]) {
            all[prof.uuid] = {};
          }
          all[prof.uuid] = {
            ...prof,
            id: prof.id.toString(),
          };
          return all;
        }, {});

        found = found.map((q) => {
          return {
            ...q,
            FarmProfile: indexedFarmProfile[q.farmAreaId]
              ? indexedFarmProfile[q.farmAreaId]
              : {},
          };
        });

        let seasonUUIDs = found
          .filter((q) => q.seasonUUID)
          .map((q) => q.seasonUUID);
        seasonUUIDs = lodash.uniq(seasonUUIDs);
        let season = await context.prisma.season.findMany({
          where: {
            uuid: {
              in: seasonUUIDs,
            },
            // ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        const indexedSeason = season.reduce((all, seas) => {
          if (!all[seas.uuid]) {
            all[seas.uuid] = {};
          }
          all[seas.uuid] = {
            ...seas,
            id: seas.id.toString(),
          };
          return all;
        }, {});

        found = found.map((q) => {
          let id = BigInt(q.id);
          return {
            ...q,
            id: id.toString(),
            Season: indexedSeason[q.seasonUUID]
              ? indexedSeason[q.seasonUUID]
              : {},
          };
        });

        let queryResult = found;

        const payload = {
          queryResult,
        };

        let token = jwt.sign(payload, TOKENIZE);
        return token;
      } else {
        // let countPaddySeedProductions = await context.prisma.paddySeedProduction.findMany({
        //   where: {
        //     ...filterQuery,
        //     ...NOT_DELETED_DOCUMENT_QUERY,
        //   },
        //   orderBy: {
        //     id: "desc",
        //   },
        // });

        // countPaddySeedProductions = countPaddySeedProductions.length
        // const pages = Math.ceil(countPaddySeedProductions / params.pageSize)

        let searchQuery = [];
        if (params.filters) {
          searchQuery = JSON.parse(params.filters);
        }

        let filteredFarmAreaId = [];
        let farmerUUIDs = [];
        for (const filtered of searchQuery) {
          if (filtered.id === "FarmerProfile.farmerCompanyName") {
            const farmerProfile = await context.prisma.farmerProfile.findMany({
              where: {
                farmerCompanyName: {
                  contains: filtered.value,
                },
                // ...NOT_DELETED_DOCUMENT_QUERY,
              },
            });
            farmerUUIDs.push(...farmerProfile.map((prof) => prof.uuid));
          } else if (filtered.id === "FarmProfile.farmArea") {
            const area = await context.prisma.farmProfile.findMany({
              where: {
                farmArea: {
                  contains: filtered.value,
                },
              },
            });
            filteredFarmAreaId.push(...area.map((ar) => ar.uuid));
          } else if (filtered.id === "FarmerProfile.farmerName") {
            const farmer = await context.prisma.farmerProfile.findMany({
              where: {
                farmerName: {
                  contains: filtered.value,
                },
              },
            });
            farmerUUIDs.push(...farmer.map((prof) => prof.uuid));
          } else if (filtered.id === "FarmProfile.farmId") {
            const farm = await context.prisma.farmProfile.findMany({
              where: {
                farmId: {
                  contains: filtered.value,
                },
              },
            });
            filteredFarmAreaId.push(...farm.map((ar) => ar.uuid));
          }
        }

        if (filteredFarmAreaId.length > 0) {
          filteredFarmAreaId = lodash.uniq(filteredFarmAreaId);

          filterQuery = {
            ...filterQuery,
            farmAreaId: {
              in: filteredFarmAreaId,
            },
          };
        }

        if (farmerUUIDs.length > 0) {
          farmerUUIDs = lodash.uniq(farmerUUIDs);

          filterQuery = {
            ...filterQuery,
            farmerUUID: {
              in: farmerUUIDs,
            },
          };
        }

        let queryResult = await context.prisma.paddySeedProduction.findMany({
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

        let farmerUUIDQuerys = queryResult
          .filter((q) => q.farmerUUID)
          .map((q) => q.farmerUUID);
        farmerUUIDQuerys = lodash.uniq(farmerUUIDQuerys);
        let farmerProfile = await context.prisma.farmerProfile.findMany({
          where: {
            uuid: {
              in: farmerUUIDQuerys,
            },
            // ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        // farmerProfile = farmerProfile.map((q) => {
        //   let mobileNo = BigInt(q.mobileNo);
        //   let telephoneNo = BigInt(q.telephoneNo);
        //   return {
        //     ...q,
        //     mobileNo: mobileNo.toString(),
        //     telephoneNo: telephoneNo.toString(),
        //   };
        // });

        const indexedFarmerProfile = farmerProfile.reduce((all, prof) => {
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
            FarmerProfile: indexedFarmerProfile[q.farmerUUID]
              ? indexedFarmerProfile[q.farmerUUID]
              : {},
          };
        });

        let farmAreaIds = queryResult
          .filter((q) => q.farmAreaId)
          .map((q) => q.farmAreaId);
        farmAreaIds = lodash.uniq(farmAreaIds);
        let farmProfile = await context.prisma.farmProfile.findMany({
          where: {
            uuid: {
              in: farmAreaIds,
            },
            // ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        const indexedFarmProfile = farmProfile.reduce((all, prof) => {
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
            FarmProfile: indexedFarmProfile[q.farmAreaId]
              ? indexedFarmProfile[q.farmAreaId]
              : {},
          };
        });

        let seasonUUIDs = queryResult
          .filter((q) => q.seasonUUID)
          .map((q) => q.seasonUUID);
        seasonUUIDs = lodash.uniq(seasonUUIDs);
        let season = await context.prisma.season.findMany({
          where: {
            uuid: {
              in: seasonUUIDs,
            },
            // ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        const indexedSeason = season.reduce((all, seas) => {
          if (!all[seas.uuid]) {
            all[seas.uuid] = {};
          }
          all[seas.uuid] = {
            ...seas,
            id: seas.id.toString(),
          };
          return all;
        }, {});

        queryResult = queryResult.map((q) => {
          let id = BigInt(q.id);
          return {
            ...q,
            id: id.toString(),
            Season: indexedSeason[q.seasonUUID]
              ? indexedSeason[q.seasonUUID]
              : {},
          };
        });

        const payload = {
          queryResult,
        };

        let token = jwt.sign(payload, TOKENIZE);
        return token;
      }
    },
    countPaddySeedProductions: async (self, params, context) => {
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

      // if (!role || !role.privileges.includes("Paddy Seed Production:Read")) {
      //   return [];
      // }

      let profileQuery = {};
      let filterQuery = {};

      if (params.monthYear) {
        filterQuery = {
          plantingMonthYear: params.monthYear,
        };
      }
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

      if (profileQuery.rocbnRegNo) {
        const getCompany = await context.prisma.farmerProfile.findMany({
          where: {
            ...profileQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          select: {
            uuid: true,
            id: true,
          },
          orderBy: {
            id: "desc",
          },
        });

        let found = await context.prisma.paddySeedProduction.count({
          where: {
            farmerUUID: {
              in: getCompany.map((c) => c.uuid),
            },
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

        return found;

        // let farmerProfile = await context.prisma.farmerProfile.findMany({
        //   where: {
        //     uuid: {
        //       in: found.map((q) => q.farmerUUID),
        //     },
        //     ...NOT_DELETED_DOCUMENT_QUERY,
        //   },
        // });

        // farmerProfile = farmerProfile.map((q) => {
        //   let mobileNo = BigInt(q.mobileNo);
        //   let telephoneNo = BigInt(q.telephoneNo);
        //   return {
        //     ...q,
        //     mobileNo: mobileNo.toString(),
        //     telephoneNo: telephoneNo.toString(),
        //   };
        // });

        // const indexedFarmerProfile = farmerProfile.reduce((all, prof) => {
        //   if (!all[prof.uuid]) {
        //     all[prof.uuid] = {};
        //   }
        //   all[prof.uuid] = {
        //     ...prof,
        //     id: prof.id.toString(),
        //   };
        //   return all;
        // }, {});

        // found = found.map((q) => {
        //   return {
        //     ...q,
        //     FarmerProfile: indexedFarmerProfile[q.farmerUUID]
        //       ? indexedFarmerProfile[q.farmerUUID]
        //       : {},
        //   };
        // });

        // let farmProfile = await context.prisma.farmProfile.findMany({
        //   where: {
        //     uuid: {
        //       in: found.map((q) => q.farmAreaId),
        //     },
        //     ...NOT_DELETED_DOCUMENT_QUERY,
        //   },
        // });

        // const indexedFarmProfile = farmProfile.reduce((all, prof) => {
        //   if (!all[prof.uuid]) {
        //     all[prof.uuid] = {};
        //   }
        //   all[prof.uuid] = {
        //     ...prof,
        //     id: prof.id.toString(),
        //   };
        //   return all;
        // }, {});

        // found = found.map((q) => {
        //   return {
        //     ...q,
        //     FarmProfile: indexedFarmProfile[q.farmAreaId]
        //       ? indexedFarmProfile[q.farmAreaId]
        //       : {},
        //   };
        // });

        // let season = await context.prisma.season.findMany({
        //   where: {
        //     uuid: {
        //       in: found.map((q) => q.seasonUUID),
        //     },
        //     ...NOT_DELETED_DOCUMENT_QUERY,
        //   },
        // });

        // const indexedSeason = season.reduce((all, seas) => {
        //   if (!all[seas.uuid]) {
        //     all[seas.uuid] = {};
        //   }
        //   all[seas.uuid] = {
        //     ...seas,
        //     id: seas.id.toString(),
        //   };
        //   return all;
        // }, {});

        // found = found.map((q) => {
        //   let id = BigInt(q.id);
        //   return {
        //     ...q,
        //     id: id.toString(),
        //     Season: indexedSeason[q.seasonUUID]
        //       ? indexedSeason[q.seasonUUID]
        //       : {},
        //   };
        // });

        // let queryResult = found;
        // return queryResult.length
      } else {
        let searchQuery = [];
        if (params.filters) {
          searchQuery = JSON.parse(params.filters);
        }

        let filteredFarmAreaId = [];
        let farmerUUIDs = [];
        for (const filtered of searchQuery) {
          if (filtered.id === "FarmerProfile.farmerCompanyName") {
            const farmerProfile = await context.prisma.farmerProfile.findMany({
              where: {
                farmerCompanyName: {
                  contains: filtered.value,
                },
                ...NOT_DELETED_DOCUMENT_QUERY,
              },
            });
            farmerUUIDs.push(...farmerProfile.map((prof) => prof.uuid));
          } else if (filtered.id === "FarmProfile.farmArea") {
            const area = await context.prisma.farmProfile.findMany({
              where: {
                farmArea: {
                  contains: filtered.value,
                },
              },
            });
            filteredFarmAreaId.push(...area.map((ar) => ar.uuid));
          } else if (filtered.id === "FarmerProfile.farmerName") {
            const farmer = await context.prisma.farmerProfile.findMany({
              where: {
                farmerName: {
                  contains: filtered.value,
                },
              },
            });
            farmerUUIDs.push(...farmer.map((prof) => prof.uuid));
          } else if (filtered.id === "FarmProfile.farmId") {
            const farm = await context.prisma.farmProfile.findMany({
              where: {
                farmId: {
                  contains: filtered.value,
                },
              },
            });
            filteredFarmAreaId.push(...farm.map((ar) => ar.uuid));
          }
        }

        if (filteredFarmAreaId.length > 0) {
          filteredFarmAreaId = lodash.uniq(filteredFarmAreaId);

          filterQuery = {
            ...filterQuery,
            farmAreaId: {
              in: filteredFarmAreaId,
            },
          };
        }

        if (farmerUUIDs.length > 0) {
          farmerUUIDs = lodash.uniq(farmerUUIDs);

          filterQuery = {
            ...filterQuery,
            farmerUUID: {
              in: farmerUUIDs,
            },
          };
        }

        let queryResult = await context.prisma.paddySeedProduction.count({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

        return queryResult;

        // let farmerProfile = await context.prisma.farmerProfile.findMany({
        //   where: {
        //     uuid: {
        //       in: queryResult.map((q) => q.farmerUUID),
        //     },
        //     ...NOT_DELETED_DOCUMENT_QUERY,
        //   },
        // });

        // farmerProfile = farmerProfile.map((q) => {
        //   let mobileNo = BigInt(q.mobileNo);
        //   let telephoneNo = BigInt(q.telephoneNo);
        //   return {
        //     ...q,
        //     mobileNo: mobileNo.toString(),
        //     telephoneNo: telephoneNo.toString(),
        //   };
        // });

        // const indexedFarmerProfile = farmerProfile.reduce((all, prof) => {
        //   if (!all[prof.uuid]) {
        //     all[prof.uuid] = {};
        //   }
        //   all[prof.uuid] = {
        //     ...prof,
        //     id: prof.id.toString(),
        //   };
        //   return all;
        // }, {});

        // queryResult = queryResult.map((q) => {
        //   return {
        //     ...q,
        //     FarmerProfile: indexedFarmerProfile[q.farmerUUID]
        //       ? indexedFarmerProfile[q.farmerUUID]
        //       : {},
        //   };
        // });

        // let farmProfile = await context.prisma.farmProfile.findMany({
        //   where: {
        //     uuid: {
        //       in: queryResult.map((q) => q.farmAreaId),
        //     },
        //     ...NOT_DELETED_DOCUMENT_QUERY,
        //   },
        // });

        // const indexedFarmProfile = farmProfile.reduce((all, prof) => {
        //   if (!all[prof.uuid]) {
        //     all[prof.uuid] = {};
        //   }
        //   all[prof.uuid] = {
        //     ...prof,
        //     id: prof.id.toString(),
        //   };
        //   return all;
        // }, {});

        // queryResult = queryResult.map((q) => {
        //   return {
        //     ...q,
        //     FarmProfile: indexedFarmProfile[q.farmAreaId]
        //       ? indexedFarmProfile[q.farmAreaId]
        //       : {},
        //   };
        // });

        // let season = await context.prisma.season.findMany({
        //   where: {
        //     uuid: {
        //       in: queryResult.map((q) => q.seasonUUID),
        //     },
        //     ...NOT_DELETED_DOCUMENT_QUERY,
        //   },
        // });

        // const indexedSeason = season.reduce((all, seas) => {
        //   if (!all[seas.uuid]) {
        //     all[seas.uuid] = {};
        //   }
        //   all[seas.uuid] = {
        //     ...seas,
        //     id: seas.id.toString(),
        //   };
        //   return all;
        // }, {});

        // queryResult = queryResult.map((q) => {
        //   let id = BigInt(q.id);
        //   return {
        //     ...q,
        //     id: id.toString(),
        //     Season: indexedSeason[q.seasonUUID]
        //       ? indexedSeason[q.seasonUUID]
        //       : {},
        //   };
        // });

        // return queryResult.length
      }
    },
  },
  Mutation: {
    createPaddySeedProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      const newData = {
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

      await context.prisma.paddySeedProduction.create({
        data: {
          ...newData,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "paddySeedProduction",
          log: {
            ...newData,
          },
        },
      });
      return newData.uuid;
    },
    updatePaddySeedProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.paddySeedProduction.update({
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
          tableName: "paddySeedProduction",
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
    deletePaddySeedProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData = await context.prisma.paddySeedProduction.findUnique({
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

      await context.prisma.paddySeedProduction.update({
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
          tableName: "paddySeedProduction",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportPaddySeedProduction: async (self, params, context) => {
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
      let farmerUUIDArrays = [];
      if (params.monthYear) {
        filterQuery = {
          plantingMonthYear: params.monthYear,
        };
      }

      if (params.farmerUUID) {
        // filterQuery = {
        //   ...filterQuery,
        //   farmerUUID: params.farmerUUID,
        // };
        // arraysFilter.push({
        //   farmerUUID: {
        //     in: [params.farmerUUID],
        //   },
        // });
        farmerUUIDArrays.push(params.farmerUUID);
      }

      if (params.farmerName) {
        const getFarmerNameFromFarmerProfile =
          await context.prisma.farmerProfile.findMany({
            where: {
              farmerName: {
                in: [params.farmerName],
              },
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
          });
        const ids = getFarmerNameFromFarmerProfile.map((g) => g.uuid);
        farmerUUIDArrays = [...farmerUUIDArrays, ...ids];
      }

      if (farmerUUIDArrays.length > 0) {
        arraysFilter.push({
          farmerUUID: {
            in: farmerUUIDArrays,
          },
        });
      }

      let farmAreaIdArray = [];
      if (params.farmAreaId) {
        const getOneFarmArea = await context.prisma.farmProfile.findUnique({
          where: {
            uuid: params.farmAreaId,
          },
        });

        const getRelatedFarmArea = await context.prisma.farmProfile.findMany({
          where: {
            farmArea: {
              in: [getOneFarmArea.farmArea],
            },
          },
        });
        farmAreaIdArray = getRelatedFarmArea.map((g) => g.uuid);
      }

      if (farmAreaIdArray.length > 0) {
        farmAreaIdArray = lodash.uniq(farmAreaIdArray);
        // filterQuery = {
        //   ...filterQuery,
        //   farmAreaId: {
        //     in: farmAreaIdArray,
        //   },
        // };
        arraysFilter.push({
          farmAreaId: {
            in: farmAreaIdArray,
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
      let farmerProfileQuery = [];
      let productions = [];
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

        const farmerProfile = await context.prisma.farmerProfile.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
            ...profileQuery,
          },
          select: {
            uuid: true,
            id: true,
          },
          orderBy: {
            id: "desc",
          },
        });

        farmerProfileQuery = farmerProfile;
      }

      if (
        farmerProfileQuery &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        productions = await context.prisma.paddySeedProduction.findMany({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
            farmerUUID: {
              in: farmerProfileQuery.map((prof) => prof.uuid),
            },
          },
          orderBy: {
            id: "desc",
          },
        });
      } else {
        productions = await context.prisma.paddySeedProduction.findMany({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      }

      productions = productions.filter(
        (prod) => prod.farmerUUID && prod.farmAreaId && prod.seasonUUID
      );

      let farmerProfile = await context.prisma.farmerProfile.findMany({
        where: {
          uuid: {
            in: lodash.uniq(productions.map((ret) => ret.farmerUUID)),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      const indexedProfile = farmerProfile.reduce((all, profile) => {
        if (!all[profile.uuid]) {
          all[profile.uuid] = {};
        }
        all[profile.uuid] = profile;
        return all;
      }, {});

      let farmProfile = await context.prisma.farmProfile.findMany({
        where: {
          uuid: {
            in: lodash.uniq(productions.map((ret) => ret.farmAreaId)),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      const indexedFarmProfile = farmProfile.reduce((all, profile) => {
        if (!all[profile.uuid]) {
          all[profile.uuid] = {};
        }
        all[profile.uuid] = profile;
        return all;
      }, {});

      let season = await context.prisma.season.findMany({
        where: {
          uuid: {
            in: lodash.uniq(productions.map((ret) => ret.seasonUUID)),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedSeason = season.reduce((all, season) => {
        if (!all[season.uuid]) {
          all[season.uuid] = {};
        }
        all[season.uuid] = season;
        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Paddy Seed Production");

      let columnWidths = [];
      for (let c = 0; c < 10; c++) {
        columnWidths.push(30);
      }

      let headerRow = [
        "PALNTING MONTH & YEAR",
        "FARMER NAME",
        "COMPANY NAME",
        "FARM AREA",
        "TOTAL PADDY SEED CULTIVATED AREA (HA)",
        "TOTAL PADDY SEED HARVESTED AREA (HA)",
        "TOTAL PADDY SEED PRODUCTION (KG)",
        "TOTAL PADDY SEED VALUE ($)",
        "PLANTING SEASON",
      ];

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

      for (const prod of productions) {
        const farmerProfile = indexedProfile[prod.farmerUUID];
        const farmProfile = indexedFarmProfile[prod.farmAreaId];
        const season = indexedSeason[prod.seasonUUID];

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: prod?.plantingMonthYear || "",
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
          value: farmProfile?.farmerCompanyName || "",
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
          value: farmProfile?.farmArea || "",
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
          value: prod?.totalPaddySeedCultivatedArea || 0,
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
          value: prod?.totalPaddySeedHarvestedArea || 0,
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
          value: prod?.totalPaddySeedProduction || 0,
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
          value: prod?.totalPaddySeedValue || 0,
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
          value: season.name || "",
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
      // const filename = `paddySeed_production.xlsx`;
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
    tokenizedCreatePaddySeedProduction: async (self, params, context) => {
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
        farmDistrict,
        farmArea,
        farmVillage,
        farmMukim,
        farmerName,
        farmAddress,
        farmerCompanyName,
        FarmProfile,
        ...payload
      } = tokenized;

      if (!payload.farmerUUID || !payload.farmAreaId) {
        throw new Error("Please fill in the farmer name and farm area fields.");
      }

      const newData = {
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

      await context.prisma.paddySeedProduction.create({
        data: {
          ...newData,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "paddySeedProduction",
          log: {
            ...newData,
          },
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      return newData.uuid;
    },
    tokenizedUpdatePaddySeedProduction: async (self, params, context) => {
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
        FarmProfile,
        FarmerProfile,
        Season,
        paddySeedId,
        farmerCompanyName,
        farmerName,
        farmDistrict,
        farmMukim,
        farmArea,
        ...payload
      } = tokenized;

      if (!payload.farmerUUID || !payload.farmAreaId) {
        throw new Error("Please fill in the farmer name and farm area fields.");
      }

      await context.prisma.paddySeedProduction.update({
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
          tableName: "paddySeedProduction",
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
    tokenizedDeletePaddySeedProduction: async (self, params, context) => {
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

      let getDeletedData = await context.prisma.paddySeedProduction.findUnique({
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

      await context.prisma.paddySeedProduction.update({
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
          tableName: "paddySeedProduction",
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
  PaddySeedProduction: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    FarmerProfile: async (self, params, context) => {
      if (self.farmerUUID) {
        const found = await context.prisma.farmerProfile.findUnique({
          where: {
            uuid: self.farmerUUID,
          },
        });

        if (found) {
          return found;
        }
      }

      return {};
    },
    FarmProfile: async (self, params, context) => {
      if (self.farmAreaId) {
        const found = await context.prisma.farmProfile.findUnique({
          where: {
            uuid: self.farmAreaId,
          },
        });

        if (found) {
          return found;
        }
      }

      return {};
    },
    Season: async (self, params, context) => {
      if (self.seasonUUID) {
        const found = await context.prisma.season.findUnique({
          where: {
            uuid: self.seasonUUID,
          },
        });

        if (found) {
          return found;
        }
      }

      return {};
    },
  },
};
exports.resolvers = resolvers;
