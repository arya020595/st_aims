const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const lodash = require("lodash");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;
const resolvers = {
  Query: {
    allPaddySeedlingProductions: async (self, params, context) => {
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
        !role.privileges.includes("Paddy Seedling Production:Read")
      ) {
        return [];
      }

      let profileQuery = {};
      let filterQuery = {};

      if (params.monthYear) {
        let startDate = dayjs(params.monthYear)
          .startOf("month")
          .format("YYYY-MM-DD");

        let endDate = dayjs(params.monthYear)
          .endOf("month")
          .format("YYYY-MM-DD");

        filterQuery = {
          date: {
            gte: startDate,
            lte: endDate,
          },
        };
      }
      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        profileQuery = {
          rocbnRegNo: context.activeSession.User.doaaRegNo,
          icPassportNo: context.activeSession.User.icNo,
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
        const found = await context.prisma.paddySeedlingProduction.findMany({
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
        let queryResult = await context.prisma.paddySeedlingProduction.findMany(
          {
            where: {
              ...filterQuery,
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
            orderBy: {
              id: "desc",
            },
          }
        );
        return queryResult;
      }
    },
    tokenizedAllPaddySeedlingProductions: async (self, params, context) => {
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
      //   !role.privileges.includes("Paddy Seedling Production:Read")
      // ) {
      //   return [];
      // }

      let profileQuery = {};
      let filterQuery = {};

      if (params.monthYear) {
        let startDate = dayjs(params.monthYear)
          .startOf("month")
          .format("YYYY-MM-DD");

        let endDate = dayjs(params.monthYear)
          .endOf("month")
          .format("YYYY-MM-DD");

        filterQuery = {
          date: {
            gte: startDate,
            lte: endDate,
          },
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
            // ...NOT_DELETED_DOCUMENT_QUERY,
          },
          select: {
            uuid: true,
            id: true,
          },
          orderBy: {
            id: "desc",
          },
        });

        // let countSeedlingProduction = await context.prisma.paddySeedlingProduction.findMany({
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
        // });

        // countSeedlingProduction = countSeedlingProduction.length

        // const pages = Math.ceil(countSeedlingProduction / params.pageSize)

        let found = await context.prisma.paddySeedlingProduction.findMany({
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

        farmerProfile = farmerProfile.map((q) => {
          let mobileNo = "" + q.mobileNo;
          let telephoneNo = "" + q.telephoneNo;
          return {
            ...q,
            mobileNo: mobileNo.toString(),
            telephoneNo: telephoneNo.toString(),
          };
        });

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
        const farmProfile = await context.prisma.farmProfile.findMany({
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

        let cropsPaddyVarietyUUIDs = found
          .filter((q) => q.cropsPaddyVarietyUUID)
          .map((q) => q.cropsPaddyVarietyUUID);
        cropsPaddyVarietyUUIDs = lodash.uniq(cropsPaddyVarietyUUIDs);
        const cropsPaddyVariety =
          await context.prisma.cropsPaddyVariety.findMany({
            where: {
              uuid: {
                in: cropsPaddyVarietyUUIDs,
              },
              // ...NOT_DELETED_DOCUMENT_QUERY,
            },
          });

        const indexedCropsPaddyVariety = cropsPaddyVariety.reduce(
          (all, fru) => {
            if (!all[fru.uuid]) {
              all[fru.uuid] = {};
            }
            all[fru.uuid] = {
              ...fru,
              id: fru.id.toString(),
            };
            return all;
          },
          {}
        );

        found = found.map((q) => {
          let id = BigInt(q.id);
          return {
            ...q,
            id: id.toString(),
            Paddy: indexedCropsPaddyVariety[q.cropsPaddyVarietyUUID]
              ? indexedCropsPaddyVariety[q.cropsPaddyVarietyUUID]
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
        // let countSeedlingProduction = await context.prisma.paddySeedlingProduction.findMany(
        //   {
        //     where: {
        //       ...filterQuery,
        //       ...NOT_DELETED_DOCUMENT_QUERY,
        //     },
        //     orderBy: {
        //       id: "desc",
        //     },
        //   }
        // );

        // countSeedlingProduction = countSeedlingProduction.length

        // const pages = Math.ceil(countSeedlingProduction / params.pageSize)
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
          } else if (filtered.id === "Paddy.varietyName") {
            const variety = await context.prisma.cropsPaddyVariety.findMany({
              where: {
                varietyName: {
                  contains: filtered.value,
                },
              },
            });
            filterQuery = {
              ...filterQuery,
              cropsPaddyVarietyUUID: {
                in: variety.map((fr) => fr.uuid),
              },
            };
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

        let queryResult = await context.prisma.paddySeedlingProduction.findMany(
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

        farmerProfile = farmerProfile.map((q) => {
          // let mobileNo = BigInt(q.mobileNo);
          // let telephoneNo = BigInt(q.telephoneNo);
          return {
            ...q,
            // mobileNo: mobileNo.toString(),
            // telephoneNo: telephoneNo.toString(),
          };
        });

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
        const farmProfile = await context.prisma.farmProfile.findMany({
          where: {
            uuid: {
              in: farmAreaIds,
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
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

        let cropsPaddyVarietyUUIDs = queryResult
          .filter((q) => q.cropsPaddyVarietyUUID)
          .map((q) => q.cropsPaddyVarietyUUID);
        cropsPaddyVarietyUUIDs = lodash.uniq(cropsPaddyVarietyUUIDs);
        const cropsPaddyVariety =
          await context.prisma.cropsPaddyVariety.findMany({
            where: {
              uuid: {
                in: cropsPaddyVarietyUUIDs,
              },
              // ...NOT_DELETED_DOCUMENT_QUERY,
            },
          });

        const indexedCropsPaddyVariety = cropsPaddyVariety.reduce(
          (all, fru) => {
            if (!all[fru.uuid]) {
              all[fru.uuid] = {};
            }
            all[fru.uuid] = {
              ...fru,
              id: fru.id.toString(),
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
            Paddy: indexedCropsPaddyVariety[q.cropsPaddyVarietyUUID]
              ? indexedCropsPaddyVariety[q.cropsPaddyVarietyUUID]
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
    countAllPaddySeedlingProductions: async (self, params, context) => {
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
      //   !role.privileges.includes("Paddy Seedling Production:Read")
      // ) {
      //   return [];
      // }

      let profileQuery = {};
      let filterQuery = {};

      if (params.monthYear) {
        let startDate = dayjs(params.monthYear)
          .startOf("month")
          .format("YYYY-MM-DD");

        let endDate = dayjs(params.monthYear)
          .endOf("month")
          .format("YYYY-MM-DD");

        filterQuery = {
          date: {
            gte: startDate,
            lte: endDate,
          },
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
        let found = await context.prisma.paddySeedlingProduction.count({
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

        // const farmProfile = await context.prisma.farmProfile.findMany({
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

        // const cropsPaddyVariety =
        //   await context.prisma.cropsPaddyVariety.findMany({
        //     where: {
        //       uuid: {
        //         in: found.map((q) => q.cropsPaddyVarietyUUID),
        //       },
        //       ...NOT_DELETED_DOCUMENT_QUERY,
        //     },
        //   });

        // const indexedCropsPaddyVariety = cropsPaddyVariety.reduce(
        //   (all, fru) => {
        //     if (!all[fru.uuid]) {
        //       all[fru.uuid] = {};
        //     }
        //     all[fru.uuid] = {
        //       ...fru,
        //       id: fru.id.toString(),
        //     };
        //     return all;
        //   },
        //   {}
        // );

        // found = found.map((q) => {
        //   let id = BigInt(q.id);
        //   return {
        //     ...q,
        //     id: id.toString(),
        //     Paddy: indexedCropsPaddyVariety[q.cropsPaddyVarietyUUID]
        //       ? indexedCropsPaddyVariety[q.cropsPaddyVarietyUUID]
        //       : {},
        //   };
        // });
        // let queryResult = found;
        // return queryResult.length
      } else {
        // const pages = Math.ceil(countSeedlingProduction / params.pageSize)
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
          } else if (filtered.id === "Paddy.varietyName") {
            const variety = await context.prisma.cropsPaddyVariety.findMany({
              where: {
                varietyName: {
                  contains: filtered.value,
                },
              },
            });
            filterQuery = {
              ...filterQuery,
              cropsPaddyVarietyUUID: {
                in: variety.map((fr) => fr.uuid),
              },
            };
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

        let queryResult = await context.prisma.paddySeedlingProduction.count({
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

        // const farmProfile = await context.prisma.farmProfile.findMany({
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

        // const cropsPaddyVariety =
        //   await context.prisma.cropsPaddyVariety.findMany({
        //     where: {
        //       uuid: {
        //         in: queryResult.map((q) => q.cropsPaddyVarietyUUID),
        //       },
        //       ...NOT_DELETED_DOCUMENT_QUERY,
        //     },
        //   });

        // const indexedCropsPaddyVariety = cropsPaddyVariety.reduce(
        //   (all, fru) => {
        //     if (!all[fru.uuid]) {
        //       all[fru.uuid] = {};
        //     }
        //     all[fru.uuid] = {
        //       ...fru,
        //       id: fru.id.toString(),
        //     };
        //     return all;
        //   },
        //   {}
        // );

        // queryResult = queryResult.map((q) => {
        //   let id = BigInt(q.id);
        //   return {
        //     ...q,
        //     id: id.toString(),
        //     Paddy: indexedCropsPaddyVariety[q.cropsPaddyVarietyUUID]
        //       ? indexedCropsPaddyVariety[q.cropsPaddyVarietyUUID]
        //       : {},
        //   };
        // });
        // return queryResult.length
      }
    },
  },
  Mutation: {
    createPaddySeedlingProduction: async (self, params, context) => {
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

      await context.prisma.paddySeedlingProduction.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "paddySeedlingProduction",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updatePaddySeedlingProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.paddySeedlingProduction.update({
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
          tableName: "paddySeedlingProduction",
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
    deletePaddySeedlingProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData =
        await context.prisma.paddySeedlingProduction.findUnique({
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

      await context.prisma.paddySeedlingProduction.update({
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
          tableName: "paddySeedlingProduction",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportPaddySeedlingProduction: async (self, params, context) => {
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
          date: {
            gte: startDate,
            lte: endDate,
          },
        };
      }

      if (params.farmerUUID) {
        // filterQuery = {
        //   ...filterQuery,
        //   farmerUUID: params.farmerUUID,
        // };
        arraysFilter.push({
          farmerUUID: {
            in: [params.farmerUUID],
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

      if (params.cropsPaddyVarietyUUID) {
        // filterQuery = {
        //   ...filterQuery,
        //   cropsPaddyVarietyUUID: params.cropsPaddyVarietyUUID,
        // };
        arraysFilter.push({
          cropsPaddyVarietyUUID: {
            in: [params.cropsPaddyVarietyUUID],
          },
        });
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
        productions = await context.prisma.paddySeedlingProduction.findMany({
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
        productions = await context.prisma.paddySeedlingProduction.findMany({
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
        (p) => p.cropsPaddyVarietyUUID && p.farmerUUID && p.farmAreaId
      );

      let paddyVariety = await context.prisma.cropsPaddyVariety.findMany({
        where: {
          uuid: {
            in: lodash.uniq(
              productions.map((ret) => ret.cropsPaddyVarietyUUID)
            ),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      const indexedPaddy = paddyVariety.reduce((all, pad) => {
        if (!all[pad.uuid]) {
          all[pad.uuid] = {};
        }
        all[pad.uuid] = pad;
        return all;
      }, {});

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

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Paddy Production");

      let columnWidths = [];
      for (let c = 0; c < 10; c++) {
        columnWidths.push(30);
      }

      let headerRow = [
        "SELLING DATE",
        "COMPANY NAME",
        "FARM AREA",
        "PADDY VARIETY",
        "TOTAL NO OF TRAYS PRODUCED",
        "TOTAL NO OF TRAYS SOLD",
        "NO OF SEEDLING EXPORTED FROM CURRENT BATCH (TRAYS)",
        "TOTAL VALUE ($)",
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
        const paddyVariety = indexedPaddy[prod.cropsPaddyVarietyUUID];
        const farmerProfile = indexedProfile[prod.farmerUUID];
        const farmProfile = indexedFarmProfile[prod.farmAreaId];

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: prod?.date || "",
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
          value: paddyVariety?.varietyName || "",
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
          value: prod?.totalTraysProduced || 0,
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
          value: prod?.totalTraysSold || 0,
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
          value: prod.noOfSeedsExported || 0,
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
          value: prod.remindingOfSeedlings || 0,
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
      // const filename = `paddy_seedling_production.xlsx`;
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
    tokenizedCreatePaddySeedlingProduction: async (self, params, context) => {
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

      const { iat, paddyId, companyId, farmerName, FarmerProfile, ...payload } =
        tokenized;

      if (!payload.farmerUUID) {
        throw new Error("Please fill company name fields");
      }

      if (!payload.cropsPaddyVarietyUUID) {
        throw new Error("Please fill paddy variety fields");
      }

      if (!payload.farmAreaId) {
        throw new Error("Please fill farm area fields");
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

      await context.prisma.paddySeedlingProduction.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "paddySeedlingProduction",
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
    tokenizedUpdatePaddySeedlingProduction: async (self, params, context) => {
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
        create,
        createdBy,
        updatedAt,
        deletedBy,
        updatedBy,
        deletedAt,
        Paddy,
        FarmProfile,
        FarmerProfile,
        paddyId,
        varietyName,
        companyId,
        farmerCompanyName,
        farmerName,
        farmDistrict,
        farmMukim,
        farmArea,
        ...payload
      } = tokenized;

      if (!payload.farmerUUID) {
        throw new Error("Please fill company name fields");
      }

      if (!payload.cropsPaddyVarietyUUID) {
        throw new Error("Please fill paddy variety fields");
      }

      if (!payload.farmAreaId) {
        throw new Error("Please fill farm area fields");
      }

      await context.prisma.paddySeedlingProduction.update({
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
          tableName: "paddySeedlingProduction",
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
    tokenizedDeletePaddySeedlingProduction: async (self, params, context) => {
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

      if (!payload.farmerUUID) {
        throw new Error("Please fill company name fields");
      }

      if (!payload.cropsPaddyVarietyUUID) {
        throw new Error("Please fill paddy variety fields");
      }

      if (!payload.farmAreaId) {
        throw new Error("Please fill farm area fields");
      }

      let getDeletedData =
        await context.prisma.paddySeedlingProduction.findUnique({
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

      await context.prisma.paddySeedlingProduction.update({
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
          tableName: "paddySeedlingProduction",
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
  PaddySeedlingProduction: {
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
    Paddy: async (self, params, context) => {
      if (self.cropsPaddyVarietyUUID) {
        const found = await context.prisma.cropsPaddyVariety.findUnique({
          where: {
            uuid: self.cropsPaddyVarietyUUID,
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
