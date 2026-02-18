const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const mime = require("mime");
const shelljs = require("shelljs");
const lodash = require("lodash");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;
const resolvers = {
  Query: {
    allCutFlowerProductions: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("Cut Flower Production:Read")) {
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
        const found = await context.prisma.cutFlowerProduction.findMany({
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
        let queryResult = await context.prisma.cutFlowerProduction.findMany({
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
    tokenizedAllCutFlowerProductions: async (self, params, context) => {
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

      // if (!role || !role.privileges.includes("Cut Flower Production:Read")) {
      //   return [];
      // }

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
        let found = await context.prisma.cutFlowerProduction.findMany({
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
            ...NOT_DELETED_DOCUMENT_QUERY,
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

        let cutFlowerUUIDs = found
          .filter((q) => q.cutFlowerUUID)
          .map((q) => q.cutFlowerUUID);
        cutFlowerUUIDs = lodash.uniq(cutFlowerUUIDs);
        const cutFlower = await context.prisma.cutFlower.findMany({
          where: {
            uuid: {
              in: cutFlowerUUIDs,
            },
            // ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        const indexedCutFlower = cutFlower.reduce((all, cut) => {
          if (!all[cut.uuid]) {
            all[cut.uuid] = {};
          }
          all[cut.uuid] = {
            ...cut,
            id: cut.id.toString(),
          };
          return all;
        }, {});

        found = found.map((q) => {
          return {
            ...q,
            CutFlower: indexedCutFlower[q.cutFlowerUUID]
              ? indexedCutFlower[q.cutFlowerUUID]
              : {},
          };
        });

        let sellingLocationUUIDs = found
          .filter((q) => q.sellingLocationUUID)
          .map((q) => q.sellingLocationUUID);
        sellingLocationUUIDs = lodash.uniq(sellingLocationUUIDs);
        const sellingLocation = await context.prisma.sellingLocation.findMany({
          where: {
            uuid: {
              in: sellingLocationUUIDs,
            },
            // ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        const indexedSellingLocation = sellingLocation.reduce((all, sell) => {
          if (!all[sell.uuid]) {
            all[sell.uuid] = {};
          }
          all[sell.uuid] = {
            ...sell,
            id: sell.id.toString(),
          };
          return all;
        }, {});

        found = found.map((q) => {
          let id = BigInt(q.id);
          return {
            ...q,
            id: id.toString(),
            SellingLocation: indexedSellingLocation[q.sellingLocationUUID]
              ? indexedSellingLocation[q.sellingLocationUUID]
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
        let searchQuery = [];
        if (params.filters) {
          searchQuery = JSON.parse(params.filters);
        }

        let filteredFarmAreaId = [];
        let cutFlowerUUIDs = [];
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
          } else if (filtered.id === "CutFlower.localName") {
            const cutFlower = await context.prisma.cutFlower.findMany({
              where: {
                localName: {
                  contains: filtered.value,
                },
              },
            });
            cutFlowerUUIDs.push(...cutFlower.map((ar) => ar.uuid));
          } else if (filtered.id === "CutFlower.cutFlowerId") {
            const cutFlower = await context.prisma.cutFlower.findMany({
              where: {
                cutFlowerId: {
                  contains: filtered.value,
                },
              },
            });
            cutFlowerUUIDs.push(...cutFlower.map((ar) => ar.uuid));
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

        if (cutFlowerUUIDs.length > 0) {
          cutFlowerUUIDs = lodash.uniq(cutFlowerUUIDs);
          filterQuery = {
            ...filterQuery,
            cutFlowerUUID: {
              in: cutFlowerUUIDs,
            },
          };
        }

        let queryResult = await context.prisma.cutFlowerProduction.findMany({
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

        let cutFlowerUUIDQuerys = queryResult
          .filter((q) => q.cutFlowerUUID)
          .map((q) => q.cutFlowerUUID);
        cutFlowerUUIDQuerys = lodash.uniq(cutFlowerUUIDQuerys);
        const cutFlower = await context.prisma.cutFlower.findMany({
          where: {
            uuid: {
              in: cutFlowerUUIDQuerys,
            },
            // ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        const indexedCutFlower = cutFlower.reduce((all, cut) => {
          if (!all[cut.uuid]) {
            all[cut.uuid] = {};
          }
          all[cut.uuid] = {
            ...cut,
            id: cut.id.toString(),
          };
          return all;
        }, {});

        queryResult = queryResult.map((q) => {
          return {
            ...q,
            CutFlower: indexedCutFlower[q.cutFlowerUUID]
              ? indexedCutFlower[q.cutFlowerUUID]
              : {},
          };
        });

        let sellingLocationUUIDs = queryResult
          .filter((q) => q.sellingLocationUUID)
          .map((q) => q.sellingLocationUUID);
        sellingLocationUUIDs = lodash.uniq(sellingLocationUUIDs);

        const sellingLocation = await context.prisma.sellingLocation.findMany({
          where: {
            uuid: {
              in: sellingLocationUUIDs,
            },
            // ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        const indexedSellingLocation = sellingLocation.reduce((all, sell) => {
          if (!all[sell.uuid]) {
            all[sell.uuid] = {};
          }
          all[sell.uuid] = {
            ...sell,
            id: sell.id.toString(),
          };
          return all;
        }, {});

        queryResult = queryResult.map((q) => {
          let id = BigInt(q.id);
          return {
            ...q,
            id: id.toString(),
            SellingLocation: indexedSellingLocation[q.sellingLocationUUID]
              ? indexedSellingLocation[q.sellingLocationUUID]
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
    countAllCutFlowerProductions: async (self, params, context) => {
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
        let found = await context.prisma.cutFlowerProduction.count({
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

        // const cutFlower = await context.prisma.cutFlower.findMany({
        //   where: {
        //     uuid: {
        //       in: found.map((q) => q.cutFlowerUUID),
        //     },
        //     ...NOT_DELETED_DOCUMENT_QUERY,
        //   },
        // });

        // const indexedCutFlower = cutFlower.reduce((all, cut) => {
        //   if (!all[cut.uuid]) {
        //     all[cut.uuid] = {};
        //   }
        //   all[cut.uuid] = {
        //     ...cut,
        //     id: cut.id.toString(),
        //   };
        //   return all;
        // }, {});

        // found = found.map((q) => {
        //   return {
        //     ...q,
        //     CutFlower: indexedCutFlower[q.cutFlowerUUID]
        //       ? indexedCutFlower[q.cutFlowerUUID]
        //       : {},
        //   };
        // });

        // const sellingLocation = await context.prisma.sellingLocation.findMany({
        //   where: {
        //     uuid: {
        //       in: found.map((q) => q.sellingLocationUUID),
        //     },
        //     ...NOT_DELETED_DOCUMENT_QUERY,
        //   },
        // });

        // const indexedSellingLocation = sellingLocation.reduce((all, sell) => {
        //   if (!all[sell.uuid]) {
        //     all[sell.uuid] = {};
        //   }
        //   all[sell.uuid] = {
        //     ...sell,
        //     id: sell.id.toString(),
        //   };
        //   return all;
        // }, {});

        // found = found.map((q) => {
        //   let id = BigInt(q.id);
        //   return {
        //     ...q,
        //     id: id.toString(),
        //     SellingLocation: indexedSellingLocation[q.sellingLocationUUID]
        //       ? indexedSellingLocation[q.sellingLocationUUID]
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
        let cutFlowerUUIDs = [];
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
          } else if (filtered.id === "CutFlower.localName") {
            const cutFlower = await context.prisma.cutFlower.findMany({
              where: {
                localName: {
                  contains: filtered.value,
                },
              },
            });
            cutFlowerUUIDs.push(...cutFlower.map((ar) => ar.uuid));
          } else if (filtered.id === "CutFlower.cutFlowerId") {
            const cutFlower = await context.prisma.cutFlower.findMany({
              where: {
                cutFlowerId: {
                  contains: filtered.value,
                },
              },
            });
            cutFlowerUUIDs.push(...cutFlower.map((ar) => ar.uuid));
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

        if (cutFlowerUUIDs.length > 0) {
          cutFlowerUUIDs = lodash.uniq(cutFlowerUUIDs);
          filterQuery = {
            ...filterQuery,
            cutFlowerUUID: {
              in: cutFlowerUUIDs,
            },
          };
        }

        let queryResult = await context.prisma.cutFlowerProduction.count({
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

        // const cutFlower = await context.prisma.cutFlower.findMany({
        //   where: {
        //     uuid: {
        //       in: queryResult.map((q) => q.cutFlowerUUID),
        //     },
        //     ...NOT_DELETED_DOCUMENT_QUERY,
        //   },
        // });

        // const indexedCutFlower = cutFlower.reduce((all, cut) => {
        //   if (!all[cut.uuid]) {
        //     all[cut.uuid] = {};
        //   }
        //   all[cut.uuid] = {
        //     ...cut,
        //     id: cut.id.toString(),
        //   };
        //   return all;
        // }, {});

        // queryResult = queryResult.map((q) => {
        //   return {
        //     ...q,
        //     CutFlower: indexedCutFlower[q.cutFlowerUUID]
        //       ? indexedCutFlower[q.cutFlowerUUID]
        //       : {},
        //   };
        // });

        // const sellingLocation = await context.prisma.sellingLocation.findMany({
        //   where: {
        //     uuid: {
        //       in: queryResult.map((q) => q.sellingLocationUUID),
        //     },
        //     ...NOT_DELETED_DOCUMENT_QUERY,
        //   },
        // });

        // const indexedSellingLocation = sellingLocation.reduce((all, sell) => {
        //   if (!all[sell.uuid]) {
        //     all[sell.uuid] = {};
        //   }
        //   all[sell.uuid] = {
        //     ...sell,
        //     id: sell.id.toString(),
        //   };
        //   return all;
        // }, {});

        // queryResult = queryResult.map((q) => {
        //   let id = BigInt(q.id);
        //   return {
        //     ...q,
        //     id: id.toString(),
        //     SellingLocation: indexedSellingLocation[q.sellingLocationUUID]
        //       ? indexedSellingLocation[q.sellingLocationUUID]
        //       : {},
        //   };
        // });

        // return queryResult.length
      }
    },
  },
  Mutation: {
    createCutFlowerProduction: async (self, params, context) => {
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

      await context.prisma.cutFlowerProduction.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "cutFlowerProduction",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateCutFlowerProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.cutFlowerProduction.update({
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
          tableName: "cutFlowerProduction",
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
    deleteCutFlowerProduction: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData = await context.prisma.cutFlowerProduction.findUnique({
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
      await context.prisma.cutFlowerProduction.update({
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
          tableName: "cutFlowerProduction",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportCutFlower: async (self, params, context) => {
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

      if (params.cutFlowerUUID) {
        // filterQuery = {
        //   ...filterQuery,
        //   cutFlowerUUID: params.cutFlowerUUID,
        // };

        arraysFilter.push({
          cutFlowerUUID: {
            in: [params.cutFlowerUUID],
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
        productions = await context.prisma.cutFlowerProduction.findMany({
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
        productions = await context.prisma.cutFlowerProduction.findMany({
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
        (p) => p.cutFlowerUUID && p.farmerUUID && p.farmAreaId
      );

      let locationUUID = productions
        .filter((p) => p.sellingLocationUUID)
        .map((pr) => pr.sellingLocationUUID);

      let sellingLocation = await context.prisma.sellingLocation.findMany({
        where: {
          uuid: {
            in: lodash.uniq(locationUUID),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      const indexedLocation = sellingLocation.reduce((all, location) => {
        if (!all[location.uuid]) {
          all[location.uuid] = {};
        }
        all[location.uuid] = location;
        return all;
      }, {});

      let cutFlowers = await context.prisma.cutFlower.findMany({
        where: {
          uuid: {
            in: lodash.uniq(productions.map((ret) => ret.cutFlowerUUID)),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      const indexedCutFlower = cutFlowers.reduce((all, cut) => {
        if (!all[cut.uuid]) {
          all[cut.uuid] = {};
        }
        all[cut.uuid] = cut;
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
      let productionSheet = workbook.addWorksheet("Cut Flower Production");

      let columnWidths = [];
      for (let c = 0; c < 11; c++) {
        columnWidths.push(20);
      }

      let headerRow = [
        "MONTH YEAR",
        "COMPANY NAME",
        "FARM AREA",
        "FARMER NAME",
        "CUT FLOWER CROP NAME",
        "CUT FLOWER CROP ID",
        "SELLING PRICE ($)/CUT",
        "CULTIVATED AREA/CUT (HA)",
        "NO PLANT SOLD",
        "TOTAL SALES ($)",
        "SELLING LOCATION",
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
        const cutFlower = indexedCutFlower[prod.cutFlowerUUID];
        const farmerProfile = indexedProfile[prod.farmerUUID];
        const farmProfile = indexedFarmProfile[prod.farmAreaId];
        const location = indexedLocation[prod.sellingLocationUUID];

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
          value: cutFlower?.localName || "",
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
          value: cutFlower?.cutFlowerId || "",
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
          value: prod?.sellingPrice || 0,
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
          value: prod?.cultivatedArea || 0,
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
          value: prod?.quantity || 0,
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
          value: prod?.totalRevenue || 0,
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
          value: location?.name || "",
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
      // const filename = `cut_flower_production.xlsx`;
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
    tokenizedCreateCutFlowerProduction: async (self, params, context) => {
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
        name,
        locationId,
        cropName,
        englishName,
        localName,
        cutFlowerId,
        ...payload
      } = tokenized;

      if (!payload.farmerUUID || !payload.farmAreaId) {
        throw new Error("Please fill the company name and farm area fields");
      }
      if (!payload.cutFlowerUUID) {
        throw new Error("Invalid Cut Flower UUID");
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

      await context.prisma.cutFlowerProduction.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "cutFlowerProduction",
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
    tokenizedUpdateCutFlowerProduction: async (self, params, context) => {
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
        addresses,
        cutFlowerId,
        localName,
        englishName,
        farmAddress,
        farmerName,
        SellingLocation,
        CutFlower,
        FarmProfile,
        FarmerProfile,
        ...payload
      } = tokenized;

      if (!payload.farmerUUID || !payload.farmAreaId) {
        throw new Error("Please fill the company name and farm area fields");
      }
      if (!payload.cutFlowerUUID) {
        throw new Error("Invalid Cut Flower UUID");
      }

      await context.prisma.cutFlowerProduction.update({
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
          tableName: "cutFlowerProduction",
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
    tokenizedDeleteCutFlowerProduction: async (self, params, context) => {
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

      let getDeletedData = await context.prisma.cutFlowerProduction.findUnique({
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
      await context.prisma.cutFlowerProduction.update({
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
          tableName: "cutFlowerProduction",
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
    tokenizedCreateManyCutFlowerProduction: async (self, params, context) => {
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
          name,
          locationId,
          cropName,
          englishName,
          localName,
          cutFlowerId,
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
        if (!payload.farmerUUID || !payload.farmAreaId) {
          throw new Error("Please fill the company name and farm area fields");
        }
        if (!payload.cutFlowerUUID) {
          throw new Error("Invalid Cut Flower UUID");
        }
      }

      await context.prisma.cutFlowerProduction.createMany({
        data: payloads,
        skipDuplicates: false,
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "cutFlowerProduction",
          log: {
            cutFlowerProductionIds: payloads.map((data) => data.uuid),
          },
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      return "success";
    },
  },
  CutFlowerProduction: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    uuid: (self) => self.uuid || "",
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
    CutFlower: async (self, params, context) => {
      if (self.cutFlowerUUID) {
        const found = await context.prisma.cutFlower.findUnique({
          where: {
            uuid: self.cutFlowerUUID,
          },
        });

        if (found) {
          return found;
        }
      }

      return {};
    },
    SellingLocation: async (self, params, context) => {
      if (self.sellingLocationUUID) {
        const found = await context.prisma.sellingLocation.findUnique({
          where: {
            uuid: self.sellingLocationUUID,
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
