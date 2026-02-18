const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const { contentType } = require("mime-types");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const FlexSearch = require("flexsearch");

const TOKENIZE = process.env.TOKENIZE;
const lodash = require("lodash");

const resolvers = {
  Query: {
    allFarmProfiles: async (self, params, context) => {
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

      if (!role || !role.privileges.includes("Farm Profile:Read")) {
        return [];
      }

      let queryResult = await context.prisma.farmProfile.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "asc",
        },
      });

      return queryResult;
    },
    countFarmProfile: async (self, params, context) => {
      let filterQuery = {};
      let searchQuery = [];
      if (params.filters) {
        searchQuery = JSON.parse(params.filters);
      }

      let filteredFarmerProfile = [];
      for (const filtered of searchQuery) {
        if (filtered.id === "farmerCompanyName") {
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
              in: farmerProfile.map((far) => far.uuid),
            },
          };
        } else if (filtered.id === "farmerName") {
          filterQuery = {
            ...filterQuery,
            farmerName: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "farmMukim") {
          filterQuery = {
            ...filterQuery,
            farmMukim: {
              contains: filtered.value,
            },
          };
        } else if (filtered.id === "farmArea") {
          filterQuery = {
            ...filterQuery,
            farmArea: {
              contains: filtered.value,
            },
          };
        }
      }

      let queryResult = await context.prisma.farmProfile.count({
        where: {
          ...filterQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });
      return queryResult;
    },
    allFarmProfilesByFarmer: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let profileQuery = {};

      let filter = {};
      if (params.farmerUUID) {
        filter = {
          farmerUUID: params.farmerUUID,
        };
      }

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

        const foundFarmer = await context.prisma.farmProfile.findMany({
          where: {
            farmerUUID: {
              in: getCompany.map((c) => c.uuid),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        return foundFarmer;
      } else {
        let queryResult = await context.prisma.farmProfile.findMany({
          where: {
            ...filter,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

        return queryResult;
      }
    },
    tokenizedAllFarmProfile: async (self, params, context) => {
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

      // if (!role || !role.privileges.includes("Farm Profile:Read")) {
      //   return "";
      // }

      let profileQuery = {};
      let farmerProfileQuery = null;
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

      let queryResult = [];
      if (
        farmerProfileQuery &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        queryResult = await context.prisma.farmProfile.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
            farmerUUID: {
              in: farmerProfileQuery.map((profile) => profile.uuid),
            },
          },
          orderBy: {
            id: "asc",
          },
        });
      } else {
        queryResult = await context.prisma.farmProfile.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "asc",
          },
        });
      }

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        let listAddress = q.addresses.map((addr) => addr.address);
        let address = listAddress.join(", ");
        return {
          ...q,
          address,
          id: id.toString(),
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    tokenizedAllFarmProfilesByFarmer: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let tokenized = {};
      if (params.tokenizedParams) {
        tokenized = jwt.verify(params.tokenizedParams, TOKENIZE);
      }

      const { iat, ...payloadParams } = tokenized;

      let profileQuery = {};

      let filter = {};
      if (payloadParams.farmerUUID) {
        filter = {
          farmerUUID: payloadParams.farmerUUID,
        };
      } else {
        filter = {
          // farmerUUID: "none",
        };
      }

      if (params.onPage) {
        filter = {
          ...filter,
          farmerUUID: "none",
        };

        if (payloadParams.farmerUUID) {
          filter = {
            farmerUUID: payloadParams.farmerUUID,
          };
        }
      }

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

      let paginatedQuery = {};
      if (params.pageIndex || params.pageSize) {
        paginatedQuery = {
          skip: params.pageIndex * params.pageSize,
          take: params.pageSize,
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

        let foundFarmer = await context.prisma.farmProfile.findMany({
          where: {
            farmerUUID: {
              in: getCompany.map((c) => c.uuid),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        foundFarmer = foundFarmer.map((farm) => {
          let id = BigInt(farm.id);
          return {
            ...farm,
            id: id.toString(),
          };
        });

        foundFarmer = foundFarmer.map((farm) => {
          let id = BigInt(farm.id);
          let listAddress = farm.addresses.map((addr) => addr.address);
          let address = listAddress.join(", ");
          return {
            ...farm,
            address,
            id: id.toString(),
          };
        });

        let queryResult = foundFarmer;

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
                in: farmerProfile.map((far) => far.uuid),
              },
            };
          } else if (filtered.id === "farmerName") {
            filterQuery = {
              ...filterQuery,
              farmerName: {
                contains: filtered.value,
              },
            };
          } else if (filtered.id === "farmMukim") {
            filterQuery = {
              ...filterQuery,
              farmMukim: {
                contains: filtered.value,
              },
            };
          } else if (filtered.id === "farmArea") {
            filterQuery = {
              ...filterQuery,
              farmArea: {
                contains: filtered.value,
              },
            };
          }
        }

        let queryResult = await context.prisma.farmProfile.findMany({
          where: {
            // ...filter,
            ...NOT_DELETED_DOCUMENT_QUERY,
            ...filterQuery,
            ...filter,
          },
          orderBy: {
            id: "desc",
          },
          ...paginatedQuery,
        });

        const farmerProfileIds = lodash.uniq(
          queryResult.map((qr) => qr.farmerUUID)
        );

        const farmerProfiles = await context.prisma.farmerProfile.findMany({
          where: {
            uuid: {
              in: farmerProfileIds,
            },
            // ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        let indexedFarmerProfile = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "uuid",
            field: ["uuid"],
          },
        });
        indexedFarmerProfile.add(farmerProfiles);

        queryResult = queryResult.map((farm) => {
          let id = BigInt(farm.id);
          let listAddress = farm.addresses.map((addr) => addr.address);
          let address = listAddress.join(", ");
          let FarmerProfile = indexedFarmerProfile.find({
            uuid: farm.farmerUUID,
          });
          delete FarmerProfile.id;

          return {
            ...farm,
            farmerCompanyName: FarmerProfile.farmerCompanyName,
            address,
            id: id.toString(),
          };
        });

        const payload = {
          queryResult,
        };
        let token = jwt.sign(payload, TOKENIZE);
        return token;
      }
    },
    countFarmProfilesByFarmer: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let tokenized = {};
      if (params.tokenizedParams) {
        tokenized = jwt.verify(params.tokenizedParams, TOKENIZE);
      }

      const { iat, ...payloadParams } = tokenized;

      let profileQuery = {};

      let filter = {};
      if (payloadParams.farmerUUID) {
        filter = {
          farmerUUID: payloadParams.farmerUUID,
        };
      } else {
        filter = {
          // farmerUUID: "none",
        };
      }

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

        let foundFarmer = await context.prisma.farmProfile.count({
          where: {
            farmerUUID: {
              in: getCompany.map((c) => c.uuid),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });
        let queryResult = foundFarmer;

        return queryResult;
      } else {
        let filterQuery = {};
        let searchQuery = [];
        if (params.filters) {
          searchQuery = JSON.parse(params.filters);
        }

        for (const filtered of searchQuery) {
          if (filtered.id === "farmerCompanyName") {
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
                in: farmerProfile.map((far) => far.uuid),
              },
            };
          } else if (filtered.id === "farmerName") {
            filterQuery = {
              ...filterQuery,
              farmerName: {
                contains: filtered.value,
              },
            };
          } else if (filtered.id === "farmMukim") {
            filterQuery = {
              ...filterQuery,
              farmMukim: {
                contains: filtered.value,
              },
            };
          } else if (filtered.id === "farmArea") {
            filterQuery = {
              ...filterQuery,
              farmArea: {
                contains: filtered.value,
              },
            };
          }
        }

        let queryResult = await context.prisma.farmProfile.count({
          where: {
            // ...filter,
            ...NOT_DELETED_DOCUMENT_QUERY,
            ...filterQuery,
          },
          orderBy: {
            id: "desc",
          },
        });

        return queryResult;
      }
    },
    tokenizedAllFarmProfilePaginated: async (self, params, context) => {
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

      // if (!role || !role.privileges.includes("Farm Profile:Read")) {
      //   return "";
      // }

      let profileQuery = {};
      let farmerProfileQuery = null;
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

      let queryResult = [];
      if (
        farmerProfileQuery &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        queryResult = await context.prisma.farmProfile.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
            farmerUUID: {
              in: farmerProfileQuery.map((profile) => profile.uuid),
            },
          },
          orderBy: {
            id: "asc",
          },
          skip: params.pageIndex * params.pageSize,
          take: params.pageSize,
        });
      } else {
        let filterQuery = {};
        let searchQuery = [];
        if (params.filters) {
          searchQuery = JSON.parse(params.filters);
        }

        for (const filtered of searchQuery) {
          if (filtered.id === "farmerCompanyName") {
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
                in: farmerProfile.map((far) => far.uuid),
              },
            };
          } else if (filtered.id === "farmerName") {
            filterQuery = {
              ...filterQuery,
              farmerName: {
                contains: filtered.value,
              },
            };
          } else if (filtered.id === "farmMukim") {
            filterQuery = {
              ...filterQuery,
              farmMukim: {
                contains: filtered.value,
              },
            };
          } else if (filtered.id === "farmArea") {
            filterQuery = {
              ...filterQuery,
              farmArea: {
                contains: filtered.value,
              },
            };
          }
        }
        queryResult = await context.prisma.farmProfile.findMany({
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
      }

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        let listAddress = q.addresses.map((addr) => addr.address);
        let address = listAddress.join(", ");
        return {
          ...q,
          address,
          id: id.toString(),
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    getFarmAddressByCompanyUUIDAndFarmArea: async (self, params, context) => {
      const queryResult = await context.prisma.farmProfile.findMany({
        where: {
          ...params,
        },
        orderBy: {
          id: "desc",
        },
      });
      const addresses = queryResult
        .map((a) => a.addresses[0])
        .map((addr) => addr.address);
      return addresses;
    },
    searchFarmProfile: async (self, params, context) => {
      let profileQuery = {};
      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        const foundFarmerProfile = await context.prisma.farmerProfile.findMany({
          where: {
            icPassportNo: context.activeSession.User.icNo,
          },
          select: {
            uuid: true,
          },
        });
        if (foundFarmerProfile.length !== 0) {
          profileQuery.farmerUUID = foundFarmerProfile[0].uuid;
        } else {
          profileQuery.farmerUUID = "";
        }
      }

      if (params.name) {
        profileQuery = {
          ...profileQuery,
          farmerCompanyName: {
            startsWith: params.name,
          },
        };
      }

      let queryResult = await context.prisma.farmProfile.findMany({
        where: {
          ...profileQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          farmerCompanyName: "asc",
        },
        take: 10,
      });
      if (queryResult.length == 0) {
        delete profileQuery.farmerCompanyName;
        profileQuery = {
          ...profileQuery,
          farmId: {
            startsWith: params.name,
          },
        };
        // console.log(profileQuery);
        queryResult = await context.prisma.farmProfile.findMany({
          where: {
            ...profileQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            farmerCompanyName: "asc",
          },
          take: 10,
        });
      }
      if (queryResult.length == 0) {
        profileQuery = {
          ...profileQuery,
          farmerCompanyName: {
            contains: params.name,
          },
        };
        queryResult = await context.prisma.farmProfile.findMany({
          where: {
            ...profileQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            farmerCompanyName: "asc",
          },
          take: 10,
        });
      }

      queryResult = queryResult.map((q) => {
        let id = BigInt(q.id);
        let address = "";
        if (q.addresses.length > 0) {
          address = q.addresses[0].address;
        }
        if (!address) {
          address = q.address;
        }
        if (!address) {
          address = "-";
        }

        return {
          ...q,
          id: id.toString(),
          address: address,
        };
      });
      const payload = {
        queryResult,
      };
      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    searchFarmProfileByFarmerName: async (self, params, context) => {
      let profileQuery = {};
      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        const foundFarmerProfile = await context.prisma.farmerProfile.findMany({
          where: {
            icPassportNo: context.activeSession.User.icNo,
          },
          select: {
            uuid: true,
          },
        });
        if (foundFarmerProfile.length !== 0) {
          profileQuery.farmerUUID = foundFarmerProfile[0].uuid;
        } else {
          profileQuery.farmerUUID = "";
        }
      }

      if (params.farmerName) {
        profileQuery = {
          ...profileQuery,
          farmerName: {
            startsWith: params.farmerName,
          },
        };
      }
      let queryResult = await context.prisma.farmProfile.findMany({
        where: {
          ...profileQuery,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          farmerCompanyName: "asc",
        },
        take: 10,
      });
      if (queryResult.length == 0) {
        delete profileQuery.farmerName;
        profileQuery = {
          ...profileQuery,
          farmId: {
            startsWith: params.farmerName,
          },
        };
        // console.log(profileQuery);
        queryResult = await context.prisma.farmProfile.findMany({
          where: {
            ...profileQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            farmerCompanyName: "asc",
          },
          take: 10,
        });
      }
      if (queryResult.length == 0) {
        profileQuery = {
          ...profileQuery,
          farmerName: {
            contains: params.farmerName,
          },
        };
        queryResult = await context.prisma.farmProfile.findMany({
          where: {
            ...profileQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
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
    isFarmerCheck: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (
        context.activeSession.User &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        return true;
      }
      return false;
    },
  },
  Mutation: {
    createFarmProfile: async (self, params, context) => {
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
          p === "noOfLabourForeigner"
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

      // const foundExisted = await context.prisma.farmProfile.findMany({
      //   where: {
      //     farmerUUID: payload.farmerUUID,
      //     farmArea: payload.farmArea,
      //   },
      //   take: 1,
      // });

      // if (foundExisted.length > 0) {
      //   throw new Error("Existed Profile!");
      // }

      let latestNumber = await context.prisma.profileIdGenerator.findMany({
        where: {
          menu: "Farm Profile",
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
            menu: "Farm Profile",
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

      let startCode = payload.PREFIX;
      const dataLength = "" + counter;
      const last = dataLength.length * -1;
      startCode = startCode.slice(0, last) + counter;
      payload.farmId = startCode;

      delete payload.PREFIX;

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

      await context.prisma.farmProfile.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "farmProfile",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateFarmProfile: async (self, params, context) => {
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
          p === "noOfLabourForeigner"
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

      const foundPrevious = await context.prisma.farmProfile.findUnique({
        where: {
          uuid: params.uuid,
        },
      });

      if (foundPrevious.farmId !== payload.farmId) {
        throw new Error("Invalid Farm ID");
      }

      // if (foundPrevious.farmerCompanyId !== payload.farmerCompanyId) {
      //   throw new Error("Invalid Company ID");
      // }

      await context.prisma.farmProfile.update({
        where: {
          uuid: params.uuid,
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
          tableName: "farmProfile",
          log: {
            uuid: params.uuid,
            ...payload,
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
    deleteFarmProfile: async (self, params, context) => {
      assertValidSession(context.activeSession);

      let getDeletedData = await context.prisma.farmProfile.findUnique({
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

      await context.prisma.farmProfile.update({
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
          tableName: "farmProfile",
          log: {
            ...getDeletedData,
          },
        },
      });
      return "success";
    },
    exportFarmProfile: async (self, params, context) => {
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

      if (
        context.activeSession.User &&
        // context.activeSession.User.rocbnRegNo &&
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

      let farmProfiles = await context.prisma.farmProfile.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
          ...profileQuery,
        },
        orderBy: {
          id: "desc",
        },
      });

      let farmerProfile = await context.prisma.farmerProfile.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
          ...profileQuery,
        },
        orderBy: {
          id: "desc",
        },
      });

      const indexedFarmerProfile = farmerProfile.reduce((all, company) => {
        if (!all[company.uuid]) {
          all[company.uuid] = {};
        }
        all[company.uuid] = company;
        return all;
      }, {});

      let farmLocation = await context.prisma.farmLocation.findMany({
        where: {
          uuid: {
            in: lodash.uniq(
              farmProfiles
                .filter((f) => f.farmLocationUUID)
                .map((ret) => ret.farmLocationUUID)
            ),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedFarmLocation = farmLocation.reduce((all, district) => {
        if (!all[district.uuid]) {
          all[district.uuid] = {};
        }
        all[district.uuid] = district;
        return all;
      }, {});

      let contractStatus = await context.prisma.contractStatus.findMany({
        where: {
          uuid: {
            in: lodash.uniq(
              farmProfiles
                .filter((f) => f.farmLocationUUID)
                .map((ret) => ret.farmLocationUUID)
            ),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedContractStatus = contractStatus.reduce((all, Contract) => {
        if (!all[Contract.uuid]) {
          all[Contract.uuid] = {};
        }
        all[Contract.uuid] = Contract;
        return all;
      }, {});

      let landOwnershipStatus =
        await context.prisma.landOwnershipStatus.findMany({
          where: {
            uuid: {
              in: lodash.uniq(
                farmProfiles
                  .filter((f) => f.ownerShipStatusUUID)
                  .map((ret) => ret.ownerShipStatusUUID)
              ),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });
      const indexedLandOwnershipStatus = landOwnershipStatus.reduce(
        (all, district) => {
          if (!all[district.uuid]) {
            all[district.uuid] = {};
          }
          all[district.uuid] = district;
          return all;
        },
        {}
      );

      let irigationStatus = await context.prisma.irigationStatus.findMany({
        where: {
          uuid: {
            in: lodash.uniq(
              farmProfiles
                .filter((f) => {
                  f.irigationStatusUUID;
                })
                .map((ret) => ret.irigationStatusUUID)
            ),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedIrigationStatus = irigationStatus.reduce((all, iri) => {
        if (!all[iri.uuid]) {
          all[iri.uuid] = {};
        }
        all[iri.uuid] = iri;
        return all;
      }, {});

      let awardType = await context.prisma.awardType.findMany({
        where: {
          uuid: {
            in: lodash.uniq(
              farmProfiles
                .filter((f) => f.awardTypeId)
                .map((ret) => ret.awardTypeId)
            ),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedAwardType = awardType.reduce((all, award) => {
        if (!all[award.uuid]) {
          all[award.uuid] = {};
        }
        all[award.uuid] = award;
        return all;
      }, {});

      let typeOfComodity = await context.prisma.typeOfComodity.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedTypeOfComodity = typeOfComodity.reduce((all, type) => {
        if (!all[type.uuid]) {
          all[type.uuid] = {};
        }
        all[type.uuid] = type;
        return all;
      }, {});
      let modernTechnology = await context.prisma.modernTechnology.findMany({
        where: {
          uuid: {
            in: lodash.uniq(
              farmProfiles
                .filter((f) => {
                  f.modernTechnology;
                })
                .map((ret) => ret.modernTechnology)
            ),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      const indexedModernTechnology = modernTechnology.reduce((all, tech) => {
        if (!all[tech.uuid]) {
          all[tech.uuid] = {};
        }
        all[tech.uuid] = tech;
        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("Farm Profile");

      let thisLength = [];
      for (const profile of farmProfiles) {
        if (profile.addresses && profile.addresses.length > 0) {
          thisLength.push(profile.addresses.length);
        }
      }

      let maxLength = Math.max(...thisLength);

      let additionals = [];
      for (let i = 0; i < maxLength; i++) {
        additionals.push(`Address ${i + 1}`);
      }

      let headerRow = [
        "FARM ID",
        "COMPANY NAME",
        "COMPANY ID",
        "OCBS REFERENCE NO",
        "PARTNER / INVESTOR",
        "FARMER NAME",
        "OTHER FARMER NAME",
        "DISTRICT",
        "VILLAGE",
        "MUKIM",
        "FARM AREA",
        "LAND APPROVAL DATE",
        "CONTRACT STATUS",
        "FARMING START DATE",
        "PLANTABLE AREA (HA)",
        "FARM CATEGORY",
        "LAND OWNERSHIP STATUS",
        "LAND CONTRACT EXPIRY",
        "FARM SIZE (HA)",
        "IRRIGATION STATUS",
        "TYPE OF COMMODITY",
        "TYPE OF AWARD",
        "DATE OF OPERATION",
        "TYPE OF OFFERS",
        "MODERN TECHNOLOGY USAGE",
        "COMPANY TERMS",
        "MARKETING AREA",
        "REMARKS",
        "UNSKILLED LOCAL",
        "SEMI SKILLED LOCAL",
        "SKILLED LOCAL",
        "EXPERT LOCAL",
        "NO OF LABOUR TOTAL",
        "UNSKILLED FOREIGNER",
        "SEMI SKILLED FOREIGNER",
        "SKILLED FOREIGNER",
        "EXPERT FOREIGNER",
        "NO OF LABOUR FOREIGNER TOTAL",
      ];

      headerRow = [...headerRow, ...additionals];

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

      for (const farmProfile of farmProfiles) {
        const farmerProfile = indexedFarmerProfile[farmProfile.farmerUUID];
        const farmLocation = indexedFarmLocation[farmProfile.farmLocationUUID];
        const contractStatus =
          indexedContractStatus[farmProfile.contractStatusUUID];
        const landOwnershipStatus =
          indexedLandOwnershipStatus[farmProfile.ownerShipStatusUUID];
        const irigationStatus =
          indexedIrigationStatus[farmProfile.irigationStatusUUID];
        const awardType = indexedAwardType[farmProfile.awardTypeId];
        const modernTechnology =
          indexedModernTechnology[farmProfile.modernTechnology];

        let typeOfComodity = "";

        if (
          farmProfile.typeOfComodityId &&
          farmProfile.typeOfComodityId.length > 0
        ) {
          for (let typeOfCommodity of farmProfile.typeOfComodityId) {
            let comm = null;
            if (indexedTypeOfComodity[typeOfCommodity]) {
              comm = indexedTypeOfComodity[typeOfCommodity];
            }
            if (comm) {
              typeOfComodity += `${comm.comodityType}, `;
            }
          }
        }

        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: farmProfile?.farmId || "",
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
          value: farmProfile?.farmerCompanyId || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });
        // console.log(farmProfile);
        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: farmProfile?.ocbsRefNo || "",
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
          value: farmProfile?.partnerInvestor || "",
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
          value: farmProfile?.otherFarmerName || "",
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
          value: farmLocation?.district || "",
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
          value: farmProfile?.farmVillage || "",
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
          value: farmProfile?.farmMukim || "",
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
          value: farmProfile?.landApprovalDate || "",
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
          value: contractStatus?.status || "",
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
          value: farmProfile?.farmingStartDate || "",
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
          value: farmProfile?.plantableArea || "",
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
          value: farmProfile?.farmCategory || "",
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
          value: landOwnershipStatus?.status || "",
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
          value: farmProfile?.expiryDate || "",
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
          value: farmProfile?.farmSize || "",
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
          value: irigationStatus?.status || "",
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
          value: typeOfComodity || "",
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
          value: awardType?.award || "",
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
          value: farmProfile.operationDate || "",
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
          value: farmProfile.offersTypes || "",
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
          value: modernTechnology ? modernTechnology.name : "",
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
          value: farmProfile.companyTerms || "",
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
          value: farmProfile.marketingAreas || "",
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
          value: farmProfile.remarks || "",
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
          value: farmProfile.unskilledLocal || "",
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
          value: farmProfile.semiSkilledLocal || "",
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
          value: farmProfile.skilledLocal || "",
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
          value: farmProfile.expertLocal || "",
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
          value: farmProfile.noOfLabourTotal || "",
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
          value: farmProfile.unskilledForeigner || "",
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
          value: farmProfile.semiSkilledForeigner || "",
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
          value: farmProfile.skilledForeigner || "",
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
          value: farmProfile.expertForeigner || "",
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
          value: farmProfile.noOfLabourForeigner || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        for (let address of farmProfile.addresses || "") {
          excelHelper.addText({
            sheet: productionSheet,
            row: rowCounter,
            col: ++colCounter,
            value: address?.address || "",
            alignment: {
              vertical: "middle",
              horizontal: "left",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });
        }

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
      const filename = `farm_profile.xlsx`;
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
    tokenizedCreateFarmProfile: async (self, params, context) => {
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

      let payload = payloadTokenized.formData;
      if (!payload.farmerUUID) {
        throw new Error("Please fill the company name fields");
      }
      if (payload.FarmerProfile) {
        delete payload.FarmerProfile;
      }

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
          p === "skilledForeigner" ||
          p === "plantableArea"
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

      // const foundExisted = await context.prisma.farmProfile.findMany({
      //   where: {
      //     farmerUUID: payload.farmerUUID,
      //     farmArea: payload.farmArea,
      //   },
      //   take: 1,
      // });

      // if (foundExisted.length > 0) {
      //   throw new Error("Existed Profile!");
      // }

      // let latestNumber = await context.prisma.profileIdGenerator.findMany({
      //   where: {
      //     menu: "Farm Profile",
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
      //       menu: "Farm Profile",
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

      let startCode = payload.PREFIX;

      let counter = 0;
      if (startCode.includes("TM")) {
        let latest = await context.prisma.farmProfile.findMany({
          where: {
            farmId: {
              contains: "TM",
            },
          },
          orderBy: {
            farmId: "desc",
          },
          take: 2,
        });

        let splitted = latest[0].farmId.split("TM")[1];
        counter = parseInt(splitted);
      } else if (startCode.includes("BM")) {
        let latest = await context.prisma.farmProfile.findMany({
          where: {
            farmId: {
              contains: "BM",
            },
          },
          orderBy: {
            farmId: "desc",
          },
          take: 2,
        });

        let splitted = latest[0].farmId.split("BM")[1];
        counter = parseInt(splitted);
      } else if (startCode.includes("TT")) {
        let latest = await context.prisma.farmProfile.findMany({
          where: {
            farmId: {
              contains: "TT",
            },
          },
          orderBy: {
            farmId: "desc",
          },
          take: 2,
        });

        let splitted = latest[0].farmId.split("TT")[1];
        counter = parseInt(splitted);
      } else if (startCode.includes("BL")) {
        let latest = await context.prisma.farmProfile.findMany({
          where: {
            farmId: {
              contains: "BL",
            },
          },
          orderBy: {
            farmId: "desc",
          },
          take: 2,
        });

        let splitted = latest[0].farmId.split("BL")[1];
        counter = parseInt(splitted);
        // counter = latest + 1;
      }
      counter += 1;
      const dataLength = "" + counter;
      const last = dataLength.length * -1;
      startCode = startCode.slice(0, last) + counter;
      payload.farmId = startCode;

      const foundExistingCode = await context.prisma.farmProfile.findMany({
        where: {
          farmId: payload.farmId,
        },
        take: 1,
      });

      if (foundExistingCode.length >= 1) {
        throw new Error("Exisiting Farm Profile Code..!");
      }

      delete payload.PREFIX;

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

      await context.prisma.farmProfile.create({
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
          p === "plantableArea"
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

      const foundFarmLocation = await context.prisma.farmLocation.findUnique({
        where: {
          uuid: createPayload.farmLocationUUID,
        },
      });

      if (!foundFarmLocation) {
        throw new Error("Invalid Farm Location ID, Create");
      }
      createPayload = {
        ...createPayload,
        farmMukim: foundFarmLocation.mukim,
        farmVillage: foundFarmLocation.village,
        farmArea: foundFarmLocation.area,
        farmDistrict: foundFarmLocation.district,
      };

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "farmProfile",
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
    tokenizedUpdateFarmProfile: async (self, params, context) => {
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
        PREFIX,
        farmVillage,
        farmAddress,
        ...payloadTokenized
      } = tokenized;

      if (!payloadTokenized.farmerUUID) {
        throw new Error("Please fill the company name fields");
      }

      let payload = payloadTokenized;

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
          p === "skilledForeigner" ||
          p === "plantableArea"
        ) {
          if (!payload[p] || payload[p] === 0) {
            payload[p] = 0;
          }
        } else if (p === "irigationStatusId") {
          if (!p["irigationStatusId"]) {
            p["irigationStatusId"] = null;
          }
        } else if (p === "agrifoodCompanyProfileId") {
          if (!p["agrifoodCompanyProfileId"]) {
            p["agrifoodCompanyProfileId"] = null;
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

      const foundPrevious = await context.prisma.farmProfile.findUnique({
        where: {
          uuid: payload.uuid,
        },
      });

      if (foundPrevious.farmId !== payload.farmId) {
        throw new Error("Invalid Farm ID");
      }

      if (foundPrevious.farmerCompanyId !== payload.farmerCompanyId) {
        throw new Error("Invalid Company ID");
      }

      // const foundFarmLocation = await context.prisma.farmLocation.findMany({
      //   where: {
      //     mukim: payload.farmMukim,
      //     village: payload.farmVillage,
      //     area: payload.farmArea,
      //     district: payload.farmDistrict,
      //     ...NOT_DELETED_DOCUMENT_QUERY,
      //   },
      // });

      // if (foundFarmLocation.length !== 1) {
      //   throw new Error("Invalid Farm Location ID, Updaate");
      // }

      // payload = {
      //   ...payload,
      //   farmLocationUUID: foundFarmLocation[0].uuid,
      //   farmMukim: foundFarmLocation[0].mukim,
      //   farmVillage: foundFarmLocation[0].village,
      //   farmArea: foundFarmLocation[0].area,
      //   farmDistrict: foundFarmLocation[0].district,
      // };

      await context.prisma.farmProfile.update({
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
          p === "skilledForeigner" ||
          p === "plantableArea"
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
          tableName: "farmProfile",
          log: {
            uuid: params.uuid,
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
    tokenizedDeleteFarmProfile: async (self, params, context) => {
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

      let getDeletedData = await context.prisma.farmProfile.findUnique({
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

      await context.prisma.farmProfile.update({
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
          tableName: "farmProfile",
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
  FarmProfile: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
  },
};
exports.resolvers = resolvers;
