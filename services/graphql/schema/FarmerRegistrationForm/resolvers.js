const { v4: uuidv4 } = require("uuid");
// const { assertValidSession } = require("../../authentication");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const bcrypt = require("bcryptjs");
const {
  assertValidSession,
  DEFAULT_EXPIRIDITY,
  NO_EXPIRIDITY,
} = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;

const resolvers = {
  Query: {
    allFarmerRegistrationForms: async (self, params, context) => {
      let queryResult = await context.prisma.farmerRegisterForm.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      return queryResult;
    },
    tokenizedAllFarmerRegistrationForms: async (self, params, context) => {
      let queryResult = await context.prisma.farmerRegisterForm.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
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
  },
  Mutation: {
    createFarmerRegistrationForm: async (self, params, context) => {
      let foundExisted = await context.prisma.farmerRegisterForm.findMany({
        where: {
          // rocbnRegNo: params.rocbnRegNo,
          doaaRegNo: params.doaaRegNo,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        take: 1,
      });

      if (foundExisted.length > 0) {
        // throw new Error("ROCBN registration already existed!");
        throw new Error("Registration number already exist!");
      }

      // foundExisted = await context.prisma.farmerRegisterForm.findMany({
      //   where: {
      //     icNo: params.icNo,
      //     AND: [
      //       {
      //         ...NOT_DELETED_DOCUMENT_QUERY,
      //       },
      //       {
      //         status: {
      //           not: "REJECTED",
      //         },
      //       },
      //     ],
      //   },
      //   take: 1,
      // });

      // if (foundExisted.length > 0) {
      //   throw new Error("IC No. registration already existed!");
      // }

      // foundExisted = await context.prisma.user.findMany({
      //   where: {
      //     icNo: params.icNo,
      //     status: "Active",
      //     registerType: "FARMER",
      //     ...NOT_DELETED_DOCUMENT_QUERY,
      //   },
      // });

      // if (foundExisted.length > 1) {
      //   throw new Error(
      //     `IC No. registration already existed!, ${params.icNo}, please contact administrator`
      //   );
      // }

      let payload = params;
      payload = {
        ...payload,
        password: params.password ? bcrypt.hashSync(params.password, 10) : "",
        defaultPassword: params.password,
        status: "WAITING",
      };

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
      await context.prisma.farmerRegisterForm.create({
        data: {
          ...createPayload,
        },
      });

      await context.prisma.activityLogs.create({
        data: {
          uuid: uuidv4(),
          type: "CREATE",
          tableName: "farmerRegisterForm",
          log: {
            ...createPayload,
          },
        },
      });

      return "success";
    },
    updateFarmerRegistrationForm: async (self, params, context) => {
      await context.prisma.farmerRegisterForm.update({
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
          tableName: "farmerRegisterForm",
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
    deleteFarmerRegistrationForm: async (self, params, context) => {
      let getDeletedData = await context.prisma.farmerRegisterForm.findUnique({
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

      await context.prisma.farmerRegisterForm.update({
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
          tableName: "farmerRegisterForm",
          log: {
            ...getDeletedData,
          },
        },
      });

      return "success";
    },
    setStatusFarmerRegistration: async (self, params, context) => {
      await context.prisma.farmerRegisterForm.update({
        where: {
          uuid: params.uuid,
        },
        data: {
          status: params.status,
          updatedAt: new Date().toISOString(),
          updatedBy: context.activeSession.User,
        },
      });
      if (params.status === "ACCEPTED") {
        const foundRegisterForm =
          await context.prisma.farmerRegisterForm.findUnique({
            where: {
              uuid: params.uuid,
            },
          });

        let newUser = {
          uuid: uuidv4(),
          status: "Active",
          name: foundRegisterForm.name,
          username: foundRegisterForm.name,

          icNo: foundRegisterForm.icNo,
          email: foundRegisterForm?.email || "",
          phone: foundRegisterForm?.phone || "",

          rocbnRegNo: foundRegisterForm?.rocbnRegNo || "",
          doaaRegNo: foundRegisterForm?.doaaRegNo || "",

          registerType: "FARMER",
          userRoleId: "NOT_SET",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: "",
          createdBy: {},
          updatedBy: {},
          deletedBy: {},
        };

        newUser["password"] = foundRegisterForm.defaultPassword
          ? bcrypt.hashSync(foundRegisterForm.defaultPassword, 10)
          : "";
        newUser["defaultPassword"] = foundRegisterForm.defaultPassword;

        const foundUser = await context.prisma.user.findMany({
          where: {
            icNo: foundRegisterForm.icNo,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          take: 1,
        });
        if (foundUser.length === 0) {
          await context.prisma.user.create({
            data: {
              ...newUser,
            },
          });

          await context.prisma.activityLogs.create({
            data: {
              uuid: uuidv4(),
              type: "CREATE",
              tableName: "user",
              log: {
                ...newUser,
              },
            },
          });
        }
      } else {
        const foundRegisterForm =
          await context.prisma.farmerRegisterForm.findUnique({
            where: {
              uuid: params.uuid,
            },
          });

        const foundUser = await context.prisma.user.findMany({
          where: {
            icNo: foundRegisterForm.icNo,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          take: 1,
        });

        if (foundUser.length > 1) {
          throw new Error(
            `There is multiple user with ${foundRegisterForm.icNo}`
          );
        }

        if (foundUser.length !== 0) {
          await context.prisma.user.update({
            where: {
              uuid: foundUser[0].uuid,
            },
            data: {
              status: "Not Active",
            },
          });

          const logData = {
            ...foundUser[0],
            id: foundUser[0].id.toString(),
          };

          await context.prisma.activityLogs.create({
            data: {
              uuid: uuidv4(),
              type: "UPDATE",
              tableName: "user",
              log: {
                ...logData,
                status: "Not Active",
                updatedAt: new Date().toISOString(),
                updatedBy: {
                  uuid: context.activeSession.User.uuid,
                  username: context.activeSession.User.employeeId,
                },
              },
            },
          });
        }
      }
      return "success";
    },
  },
  FarmerRegistrationForm: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
  },
};
exports.resolvers = resolvers;
