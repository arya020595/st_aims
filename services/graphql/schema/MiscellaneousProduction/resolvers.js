const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const mime = require("mime");
const shelljs = require("shelljs");
const { filter } = require("shelljs/commands");
const lodash = require("lodash");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;
const resolvers = {
  Query: {
    allMiscellaneousProductions: async (self, params, context) => {
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
        !role.privileges.includes("Production Miscellaneous Crops:Read")
      ) {
        return [];
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

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }

      if (profileQuery.rocbnRegNo) {
        const getCompany = await context.prisma.farmerProfile.findMany({
          where: {
            ...profileQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
        const found = await context.prisma.miscellaneousProduction.findMany({
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
        let queryResult = await context.prisma.miscellaneousProduction.findMany(
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
    tokenizedAllMiscellaneousProductions: async (self, params, context) => {
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
      //   !role.privileges.includes("Production Miscellaneous Crops:Read")
      // ) {
      //   return [];
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

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }

      if (profileQuery.rocbnRegNo) {
        const getCompany = await context.prisma.farmerProfile.findMany({
          where: {
            ...profileQuery,
            // ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

        // let countMiscellaneousProduction = await context.prisma.miscellaneousProduction.findMany({
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

        // countMiscellaneousProduction = countMiscellaneousProduction.length

        // const pages = Math.ceil(countMiscellaneousProduction / params.pageSize)

        let found = await context.prisma.miscellaneousProduction.findMany({
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

        let miscellaneousCropUUIDs = found
          .filter((q) => q.miscellaneousCropUUID)
          .map((q) => q.miscellaneousCropUUID);
        miscellaneousCropUUIDs = lodash.uniq(miscellaneousCropUUIDs);
        const miscellaneousCrops =
          await context.prisma.miscellaneousCrops.findMany({
            where: {
              uuid: {
                in: miscellaneousCropUUIDs,
              },
              // ...NOT_DELETED_DOCUMENT_QUERY,
            },
          });

        const indexedMiscellaneousCrops = miscellaneousCrops.reduce(
          (all, misc) => {
            if (!all[misc.uuid]) {
              all[misc.uuid] = {};
            }
            all[misc.uuid] = {
              ...misc,
              id: misc.id.toString(),
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
            MiscellaneousCrops: indexedMiscellaneousCrops[
              q.miscellaneousCropUUID
            ]
              ? indexedMiscellaneousCrops[q.miscellaneousCropUUID]
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
        // let countMiscellaneousProduction = await context.prisma.miscellaneousProduction.findMany(
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

        // countMiscellaneousProduction = countMiscellaneousProduction.length

        // const pages = Math.ceil(countMiscellaneousProduction / params.pageSize)

        let searchQuery = [];
        if (params.filters) {
          searchQuery = JSON.parse(params.filters);
        }

        let filteredFarmAreaId = [];
        let miscUUIDs = [];
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
            filterQuery = {
              ...filterQuery,
              farmerUUID: {
                in: farmerProfile.map((f) => f.uuid),
              },
            };
          } else if (filtered.id === "FarmProfile.farmArea") {
            const area = await context.prisma.farmProfile.findMany({
              where: {
                farmArea: {
                  contains: filtered.value,
                },
              },
            });
            filteredFarmAreaId.push(...area.map((ar) => ar.uuid));
          } else if (filtered.id === "FarmProfile.farmerName") {
            const farm = await context.prisma.farmProfile.findMany({
              where: {
                farmerName: {
                  contains: filtered.value,
                },
              },
            });
            filteredFarmAreaId.push(...farm.map((ar) => ar.uuid));
          } else if (filtered.id === "MiscellaneousCrops.localName") {
            const misc = await context.prisma.miscellaneousCrops.findMany({
              where: {
                localName: {
                  contains: filtered.value,
                },
              },
            });
            miscUUIDs.push(...misc.map((m) => m.uuid));
          } else if (filtered.id === "MiscellaneousCrops.miscellaneousCropId") {
            const misc = await context.prisma.miscellaneousCrops.findMany({
              where: {
                miscellaneousCropId: {
                  contains: filtered.value,
                },
              },
            });
            miscUUIDs.push(...misc.map((m) => m.uuid));
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

        if (miscUUIDs.length > 0) {
          miscUUIDs = lodash.uniq(miscUUIDs);
          filterQuery = {
            ...filterQuery,
            miscellaneousCropUUID: {
              in: miscUUIDs,
            },
          };
        }

        let queryResult = await context.prisma.miscellaneousProduction.findMany(
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

        let farmerUUIDs = queryResult
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

        let miscellaneousCropUUIDs = queryResult
          .filter((q) => q.miscellaneousCropUUID)
          .map((q) => q.miscellaneousCropUUID);
        miscellaneousCropUUIDs = lodash.uniq(miscellaneousCropUUIDs);
        const miscellaneousCrops =
          await context.prisma.miscellaneousCrops.findMany({
            where: {
              uuid: {
                in: miscellaneousCropUUIDs,
              },
              // ...NOT_DELETED_DOCUMENT_QUERY,
            },
          });

        const indexedMiscellaneousCrops = miscellaneousCrops.reduce(
          (all, misc) => {
            if (!all[misc.uuid]) {
              all[misc.uuid] = {};
            }
            all[misc.uuid] = {
              ...misc,
              id: misc.id.toString(),
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
            MiscellaneousCrops: indexedMiscellaneousCrops[
              q.miscellaneousCropUUID
            ]
              ? indexedMiscellaneousCrops[q.miscellaneousCropUUID]
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
    countAllMiscellaneousProductions: async (self, params, context) => {
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
      //   !role.privileges.includes("Production Miscellaneous Crops:Read")
      // ) {
      //   return [];
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

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }

      if (profileQuery.rocbnRegNo) {
        const getCompany = await context.prisma.farmerProfile.findMany({
          where: {
            ...profileQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
        let found = await context.prisma.miscellaneousProduction.count({
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
        //   // let mobileNo = BigInt(q.mobileNo);
        //   // let telephoneNo = BigInt(q.telephoneNo);
        //   return {
        //     ...q,
        //     // mobileNo: mobileNo.toString(),
        //     // telephoneNo: telephoneNo.toString(),
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

        // const miscellaneousCrops =
        //   await context.prisma.miscellaneousCrops.findMany({
        //     where: {
        //       uuid: {
        //         in: found
        //           .filter((f) => f.miscellaneousCropUUID)
        //           .map((q) => q.miscellaneousCropUUID),
        //       },
        //       ...NOT_DELETED_DOCUMENT_QUERY,
        //     },
        //   });

        // const indexedMiscellaneousCrops = miscellaneousCrops.reduce(
        //   (all, misc) => {
        //     if (!all[misc.uuid]) {
        //       all[misc.uuid] = {};
        //     }
        //     all[misc.uuid] = {
        //       ...misc,
        //       id: misc.id.toString(),
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
        //     MiscellaneousCrops: indexedMiscellaneousCrops[
        //       q.miscellaneousCropUUID
        //     ]
        //       ? indexedMiscellaneousCrops[q.miscellaneousCropUUID]
        //       : {},
        //   };
        // });

        // let queryResult = found;

        // return queryResult.length || 0
      } else {
        let searchQuery = [];
        if (params.filters) {
          searchQuery = JSON.parse(params.filters);
        }

        let filteredFarmAreaId = [];
        let miscUUIDs = [];
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
            filterQuery = {
              ...filterQuery,
              farmerUUID: {
                in: farmerProfile.map((f) => f.uuid),
              },
            };
          } else if (filtered.id === "FarmProfile.farmArea") {
            const area = await context.prisma.farmProfile.findMany({
              where: {
                farmArea: {
                  contains: filtered.value,
                },
              },
            });
            filteredFarmAreaId.push(...area.map((ar) => ar.uuid));
          } else if (filtered.id === "FarmProfile.farmerName") {
            const farm = await context.prisma.farmProfile.findMany({
              where: {
                farmerName: {
                  contains: filtered.value,
                },
              },
            });
            filteredFarmAreaId.push(...farm.map((ar) => ar.uuid));
          } else if (filtered.id === "MiscellaneousCrops.localName") {
            const misc = await context.prisma.miscellaneousCrops.findMany({
              where: {
                localName: {
                  contains: filtered.value,
                },
              },
            });
            miscUUIDs.push(...misc.map((m) => m.uuid));
          } else if (filtered.id === "MiscellaneousCrops.miscellaneousCropId") {
            const misc = await context.prisma.miscellaneousCrops.findMany({
              where: {
                miscellaneousCropId: {
                  contains: filtered.value,
                },
              },
            });
            miscUUIDs.push(...misc.map((m) => m.uuid));
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

        if (miscUUIDs.length > 0) {
          miscUUIDs = lodash.uniq(miscUUIDs);
          filterQuery = {
            ...filterQuery,
            miscellaneousCropUUID: {
              in: miscUUIDs,
            },
          };
        }

        let queryResult = await context.prisma.miscellaneousProduction.count({
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
        //   // let mobileNo = BigInt(q.mobileNo);
        //   // let telephoneNo = BigInt(q.telephoneNo);
        //   return {
        //     ...q,
        //     // mobileNo: mobileNo.toString(),
        //     // telephoneNo: telephoneNo.toString(),
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

        // const miscellaneousCrops =
        //   await context.prisma.miscellaneousCrops.findMany({
        //     where: {
        //       uuid: {
        //         in: queryResult
        //           .filter((qr) => qr.miscellaneousCropUUID)
        //           .map((q) => q.miscellaneousCropUUID),
        //       },
        //       ...NOT_DELETED_DOCUMENT_QUERY,
        //     },
        //   });

        // const indexedMiscellaneousCrops = miscellaneousCrops.reduce(
        //   (all, misc) => {
        //     if (!all[misc.uuid]) {
        //       all[misc.uuid] = {};
        //     }
        //     all[misc.uuid] = {
        //       ...misc,
        //       id: misc.id.toString(),
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
        //     MiscellaneousCrops: indexedMiscellaneousCrops[
        //       q.miscellaneousCropUUID
        //     ]
        //       ? indexedMiscellaneousCrops[q.miscellaneousCropUUID]
        //       : {},
        //   };
        // });
        // return queryResult.length || 0
      }
    },
  },
  Mutation: {
    createMiscellaneousProduction: async (self, params, context) => {
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

      await context.prisma.miscellaneousProduction.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "miscellaneousProduction",
          log: {
            ...createPayload,
          },
        },
      });
      return "success";
    },
    updateMiscellaneousProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.miscellaneousProduction.update({
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
          tableName: "miscellaneousProduction",
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
    deleteMiscellaneousProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData =
        await context.prisma.miscellaneousProduction.findUnique({
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

      await context.prisma.miscellaneousProduction.update({
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
          tableName: "sellingLocation",
          log: {
            ...miscellaneousProduction,
          },
        },
      });
      return "success";
    },
    exportMiscellaneousProduction: async (self, params, context) => {
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

      if (params.miscellaneousCropUUID) {
        // filterQuery = {
        //   ...filterQuery,
        //   miscellaneousCropUUID: params.miscellaneousCropUUID,
        // };
        arraysFilter.push({
          miscellaneousCropUUID: {
            in: [params.miscellaneousCropUUID],
          },
        });
      }

      if (params.farmerName) {
        const getRelatedFarmerName = await context.prisma.farmProfile.findMany({
          where: {
            farmerName: {
              in: [params.farmerName],
            },
          },
        });
        farmAreaIdArray = [
          ...farmAreaIdArray,
          ...getRelatedFarmerName.map((g) => g.uuid),
        ];
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

        const farmerProfile = await context.prisma.farmerProfile.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
            ...profileQuery,
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
        productions = await context.prisma.miscellaneousProduction.findMany({
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
        productions = await context.prisma.miscellaneousProduction.findMany({
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
        (prod) =>
          prod.farmerUUID && prod.miscellaneousCropUUID && prod.farmAreaId
      );

      let miscellaneous = await context.prisma.miscellaneousCrops.findMany({
        where: {
          uuid: {
            in: lodash.uniq(
              productions.map((ret) => ret.miscellaneousCropUUID)
            ),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedMiscellaneous = miscellaneous.reduce((all, misc) => {
        if (!all[misc.uuid]) {
          all[misc.uuid] = {};
        }
        all[misc.uuid] = misc;
        return all;
      }, {});

      const farmerProfile = await context.prisma.farmerProfile.findMany({
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

      const farmProfile = await context.prisma.farmProfile.findMany({
        where: {
          uuid: {
            in: lodash.uniq(productions.map((ret) => ret.farmAreaId)),
          },
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
      let productionSheet = workbook.addWorksheet("Miscellaneous Production");

      let columnWidths = [];
      for (let c = 0; c < 10; c++) {
        columnWidths.push(30);
      }

      let headerRow = [
        "MONTH YEAR",
        "COMPANY NAME",
        "FARM AREA",
        "MISCELLANEOUS LOCAL NAME",
        "FARMER NAME",
        "FARM ADDRESS",
        "MISCELLANEOUS ID",
        "PRODUCTION (KG)",
        "FARM PRICE / KG ($)",
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
        const miscellaneous = indexedMiscellaneous[prod.miscellaneousCropUUID];
        const farmerProfile = indexedProfile[prod.farmerUUID];
        const farmProfile = indexedFarmProfile[prod.farmAreaId];
        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: prod?.monthYear || "",
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
          value: miscellaneous?.localName || "",
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
          value: farmProfile?.farmerName || "",
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
          value: farmProfile?.address || "",
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
          value: miscellaneous?.miscellaneousCropId || "",
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
          value: prod.production || 0,
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
          value: prod.farmPrice || 0,
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
          value: prod.totalFarmValue || 0,
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
      // const filename = `miscellaneous_production.xlsx`;
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
    tokenizedCreateMiscellaneousProduction: async (self, params, context) => {
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

      if (!payload.farmerUUID || !payload.farmAreaId) {
        throw new Error("Please fill the company name and farm area fields");
      }
      if (!payload.miscellaneousCropUUID) {
        throw new Error("Invalid Misc. UUID");
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

      await context.prisma.miscellaneousProduction.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "miscellaneousProduction",
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
    tokenizedUpdateMiscellaneousProduction: async (self, params, context) => {
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
        MiscellaneousCrops,
        FarmProfile,
        FarmerProfile,
        addresses,
        miscellaneousCropId,
        localName,
        englishName,
        farmAddress,
        farmerName,
        ...payload
      } = tokenized;

      if (!payload.farmerUUID || !payload.farmAreaId) {
        throw new Error("Please fill the company name and farm area fields");
      }
      if (!payload.miscellaneousCropUUID) {
        throw new Error("Invalid Misc. UUID");
      }

      await context.prisma.miscellaneousProduction.update({
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
          tableName: "miscellaneousProduction",
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
    tokenizedDeleteMiscellaneousProduction: async (self, params, context) => {
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
        await context.prisma.miscellaneousProduction.findUnique({
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

      await context.prisma.miscellaneousProduction.update({
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
          tableName: "miscellaneousProduction",
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
    tokenizedCreateManyMiscellaneousProduction: async (
      self,
      params,
      context
    ) => {
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
        return {
          uuid: uuidv4(),
          ...data,
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
        if (!payload.farmerUUID || !payload.farmAreaId) {
          throw new Error("Please fill the company name and farm area fields");
        }
        if (!payload.miscellaneousCropUUID) {
          throw new Error("Invalid Misc. UUID");
        }
      }

      await context.prisma.miscellaneousProduction.createMany({
        data: payloads,
        skipDuplicates: false,
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "miscellaneousProduction",
          log: {
            miscellaneousProductionIds: payloads.map((data) => data.uuid),
          },
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      return "success";
    },
  },
  MiscellaneousProduction: {
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
    MiscellaneousCrops: async (self, params, context) => {
      if (self.miscellaneousCropUUID) {
        const found = await context.prisma.miscellaneousCrops.findUnique({
          where: {
            uuid: self.miscellaneousCropUUID,
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
