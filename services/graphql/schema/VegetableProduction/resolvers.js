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
    allVegetableProductions: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("Production Vegetable:Read")) {
        return [];
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
          select: {
            uuid: true,
            id: true,
          },
          orderBy: {
            id: "desc",
          },
        });
        const found = await context.prisma.vegetableProduction.findMany({
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
        let queryResult = await context.prisma.vegetableProduction.findMany({
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
    tokenizedAllVegetableProductions: async (self, params, context) => {
      assertValidSession(context.activeSession);
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

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }

      if (profileQuery.rocbnRegNo) {
        let getCompany = await context.prisma.farmerProfile.findMany({
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

        // let countVegetableProduction = await context.prisma.vegetableProduction.findMany({
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

        // countVegetableProduction = countVegetableProduction.length

        // const pages = Math.ceil(countVegetableProduction / params.pageSize)

        let found = await context.prisma.vegetableProduction.findMany({
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

        found = found.map((q) => {
          let id = BigInt(q.id);
          return {
            ...q,
            id: id.toString(),
          };
        });

        let farmerProfile = await context.prisma.farmerProfile.findMany({
          where: {
            uuid: {
              in: found.map((q) => q.farmerUUID),
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

        const farmProfile = await context.prisma.farmProfile.findMany({
          where: {
            uuid: {
              in: found.map((q) => q.farmAreaId),
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

        const cropsVegetable = await context.prisma.cropsVegetable.findMany({
          where: {
            uuid: {
              in: found
                .filter((f) => f.vegetableUUID)
                .map((q) => q.vegetableUUID),
            },
            // ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        const indexedCropsVegetable = cropsVegetable.reduce((all, cat) => {
          if (!all[cat.uuid]) {
            all[cat.uuid] = {};
          }
          all[cat.uuid] = {
            ...cat,
            id: cat.id.toString(),
          };
          return all;
        }, {});

        found = found.map((q) => {
          return {
            ...q,
            Vegetable: indexedCropsVegetable[q.vegetableUUID]
              ? indexedCropsVegetable[q.vegetableUUID]
              : {},
          };
        });

        const queryResult = found;

        const payload = {
          queryResult,
        };
        let token = jwt.sign(payload, TOKENIZE);
        return token;
      } else {
        // let countVegetableProduction = await context.prisma.vegetableProduction.findMany({
        //   where: {
        //     ...filterQuery,
        //     ...NOT_DELETED_DOCUMENT_QUERY,
        //   },
        //   orderBy: {
        //     id: "desc",
        //   },
        // });

        // countVegetableProduction = countVegetableProduction.length

        // const pages = Math.ceil(countVegetableProduction / params.pageSize)

        let searchQuery = [];
        if (params.filters) {
          searchQuery = JSON.parse(params.filters);
        }

        let filteredFarmAreaId = [];
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
          } else if (filtered.id === "Vegetable.localName") {
            const vegetable = await context.prisma.cropsVegetable.findMany({
              where: {
                localName: {
                  contains: filtered.value,
                },
              },
            });
            filterQuery = {
              ...filterQuery,
              vegetableUUID: {
                in: vegetable.map((veg) => veg.uuid),
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
          }
        }

        // console.log("before", filteredFarmAreaId.length);

        if (filteredFarmAreaId.length > 0) {
          filteredFarmAreaId = lodash.uniq(filteredFarmAreaId);

          filterQuery = {
            ...filterQuery,
            farmAreaId: {
              in: filteredFarmAreaId,
            },
          };
        }
        // console.log("after", filteredFarmAreaId.length);

        let queryResult = await context.prisma.vegetableProduction.findMany({
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

        let farmerProfile = await context.prisma.farmerProfile.findMany({
          where: {
            uuid: {
              in: queryResult.map((q) => q.farmerUUID),
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
          .filter((qr) => qr.farmAreaId)
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

        let vegetableUUIDs = queryResult
          .filter((qr) => qr.vegetableUUID)
          .map((q) => q.vegetableUUID);
        vegetableUUIDs = lodash.uniq(vegetableUUIDs);

        const cropsVegetable = await context.prisma.cropsVegetable.findMany({
          where: {
            uuid: {
              in: vegetableUUIDs,
            },
            // ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        const indexedCropsVegetable = cropsVegetable.reduce((all, veg) => {
          if (!all[veg.uuid]) {
            all[veg.uuid] = {};
          }
          all[veg.uuid] = {
            ...veg,
            id: veg.id.toString(),
          };
          return all;
        }, {});

        queryResult = queryResult.map((q) => {
          return {
            ...q,
            Vegetable: indexedCropsVegetable[q.vegetableUUID]
              ? indexedCropsVegetable[q.vegetableUUID]
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
    countVegetableProduction: async (self, params, context) => {
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

      let filterQuery = {};
      if (params.monthYear) {
        filterQuery = {
          monthYear: params.monthYear,
        };
      }

      if (profileQuery.rocbnRegNo) {
        let getCompany = await context.prisma.farmerProfile.findMany({
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

        let found = await context.prisma.vegetableProduction.count({
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

        // found = found.map((q) => {
        //   let id = BigInt(q.id);
        //   return {
        //     ...q,
        //     id: id.toString(),
        //   };
        // });

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

        // const cropsVegetable = await context.prisma.cropsVegetable.findMany({
        //   where: {
        //     uuid: {
        //       in: found
        //         .filter((f) => f.vegetableUUID)
        //         .map((q) => q.vegetableUUID),
        //     },
        //     ...NOT_DELETED_DOCUMENT_QUERY,
        //   },
        // });

        // const indexedCropsVegetable = cropsVegetable.reduce((all, cat) => {
        //   if (!all[cat.uuid]) {
        //     all[cat.uuid] = {};
        //   }
        //   all[cat.uuid] = {
        //     ...cat,
        //     id: cat.id.toString(),
        //   };
        //   return all;
        // }, {});

        // found = found.map((q) => {
        //   return {
        //     ...q,
        //     Vegetable: indexedCropsVegetable[q.livestockCategoryId]
        //       ? indexedCropsVegetable[q.livestockCategoryId]
        //       : {},
        //   };
        // });

        // const queryResult = found;
        // return queryResult.length;
        return found;
      } else {
        let searchQuery = [];
        if (params.filters) {
          searchQuery = JSON.parse(params.filters);
        }

        let filteredFarmAreaId = [];
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
          } else if (filtered.id === "Vegetable.localName") {
            const vegetable = await context.prisma.cropsVegetable.findMany({
              where: {
                localName: {
                  contains: filtered.value,
                },
              },
            });
            filterQuery = {
              ...filterQuery,
              vegetableUUID: {
                in: vegetable.map((veg) => veg.uuid),
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
          }
        }

        // console.log("before", filteredFarmAreaId.length);

        if (filteredFarmAreaId.length > 0) {
          filteredFarmAreaId = lodash.uniq(filteredFarmAreaId);

          filterQuery = {
            ...filterQuery,
            farmAreaId: {
              in: filteredFarmAreaId,
            },
          };
        }

        let queryResult = await context.prisma.vegetableProduction.count({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
        return queryResult;

        // queryResult = queryResult.map((q) => {
        //   let id = BigInt(q.id);
        //   return {
        //     ...q,
        //     id: id.toString(),
        //   };
        // });

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

        // const cropsVegetable = await context.prisma.cropsVegetable.findMany({
        //   where: {
        //     uuid: {
        //       in: queryResult
        //         .filter((qr) => qr.vegetableUUID)
        //         .map((q) => q.vegetableUUID),
        //     },
        //     ...NOT_DELETED_DOCUMENT_QUERY,
        //   },
        // });

        // const indexedCropsVegetable = cropsVegetable.reduce((all, veg) => {
        //   if (!all[veg.uuid]) {
        //     all[veg.uuid] = {};
        //   }
        //   all[veg.uuid] = {
        //     ...veg,
        //     id: veg.id.toString(),
        //   };
        //   return all;
        // }, {});

        // queryResult = queryResult.map((q) => {
        //   return {
        //     ...q,
        //     Vegetable: indexedCropsVegetable[q.vegetableUUID]
        //       ? indexedCropsVegetable[q.vegetableUUID]
        //       : {},
        //   };
        // });

        // return queryResult.length;
      }
    },
  },
  Mutation: {
    createVegetableProduction: async (self, params, context) => {
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

      await context.prisma.vegetableProduction.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "vegetableProduction",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateVegetableProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.vegetableProduction.update({
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
          tableName: "vegetableProduction",
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
    deleteVegetableProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData = await context.prisma.vegetableProduction.findUnique({
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

      await context.prisma.vegetableProduction.update({
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
          tableName: "vegetableProduction",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportVegetableProduction: async (self, params, context) => {
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
        // arraysFilter.push({ monthYear: params.monthYear });
      }

      if (params.farmerUUID) {
        // filterQuery = {
        //   ...filterQuery,
        //   farmerUUID: {
        //     in: [params.farmerUUID],
        //   },
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

      if (params.vegetableUUID) {
        // filterQuery = {
        //   ...filterQuery,
        //   vegetableUUID: {
        //     in: [params.vegetableUUID],
        //   },
        // };

        arraysFilter.push({
          vegetableUUID: {
            in: [params.vegetableUUID],
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

        const getCompany = await context.prisma.farmerProfile.findMany({
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

        farmerProfileQuery = getCompany;
      }

      if (
        farmerProfileQuery &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        productions = await context.prisma.vegetableProduction.findMany({
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
        productions = await context.prisma.vegetableProduction.findMany({
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
        (p) => p.vegetableUUID && p.farmerUUID && p.farmAreaId
      );

      let vegetables = await context.prisma.cropsVegetable.findMany({
        where: {
          uuid: {
            in: lodash.uniq(productions.map((ret) => ret.vegetableUUID)),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      const indexedVegetable = vegetables.reduce((all, veg) => {
        if (!all[veg.uuid]) {
          all[veg.uuid] = {};
        }
        all[veg.uuid] = veg;
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
      let productionSheet = workbook.addWorksheet("Vegetable Production");

      let columnWidths = [];
      for (let c = 0; c < 10; c++) {
        columnWidths.push(30);
      }

      let headerRow = [
        "MONTH YEAR",
        "COMPANY NAME",
        "FARM AREA",
        "VEGETABLE LOCAL NAME",
        "FARMER NAME",
        "FARM ADDRESS",
        "VEGETABLE ID",
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
        const vegetable = indexedVegetable[prod.vegetableUUID];
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
          value: vegetable?.localName || "",
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
          value: prod?.address || "",
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
          value: vegetable?.vegetableId || "",
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
      // const filename = `vegetable_production.xlsx`;
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
    tokenizedCreateVegetableProduction: async (self, params, context) => {
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
        throw new Error(
          "Please fill in the company name and farm area fields."
        );
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

      if (!createPayload.farmerUUID) {
        throw new Error("Invalid Farmer UUID");
      }

      if (!createPayload.farmAreaId) {
        throw new Error("Invalid Farmer Area UUID");
      }

      if (!createPayload.vegetableUUID) {
        throw new Error("Vegetable UUID");
      }

      await context.prisma.vegetableProduction.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "vegetableProduction",
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
    tokenizedUpdateVegetableProduction: async (self, params, context) => {
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
        Vegetable,
        farmerProfileId,
        farmerName,
        farmAddress,
        englishName,
        localName,
        vegetableId,
        addresses,
        ...payload
      } = tokenized;

      if (!payload.farmerUUID || !payload.farmAreaId) {
        throw new Error(
          "Please fill in the company name and farm area fields."
        );
      }

      if (!payload.vegetableUUID) {
        throw new Error("Vegetable UUID");
      }

      await context.prisma.vegetableProduction.update({
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
          tableName: "vegetableProduction",
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
    tokenizedDeleteVegetableProduction: async (self, params, context) => {
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

      let getDeletedData = await context.prisma.vegetableProduction.findUnique({
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

      await context.prisma.vegetableProduction.update({
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
          tableName: "vegetableProduction",
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
    tokenizedCreateManyVegetableProduction: async (self, params, context) => {
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
          throw new Error(
            "Please fill in the company name and farm area fields."
          );
        }
        if (!payload.farmerUUID) {
          throw new Error("Invalid Farmer UUID");
        }

        if (!payload.farmAreaId) {
          throw new Error("Invalid Farmer Area UUID");
        }

        if (!payload.vegetableUUID) {
          throw new Error("Vegetable UUID");
        }
      }

      await context.prisma.vegetableProduction.createMany({
        data: payloads,
        skipDuplicates: false,
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "vegetableProduction",
          log: {
            vegetableProductionId: payloads.map((pay) => pay.uuid),
          },
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      return "success";
    },
  },
  VegetableProduction: {
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
    Vegetable: async (self, params, context) => {
      if (self.vegetableUUID) {
        const found = await context.prisma.cropsVegetable.findUnique({
          where: {
            uuid: self.vegetableUUID,
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
