const { v4: uuidV4 } = require("uuid");
// const { assertValidSession } = require("../../authentication");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const bcrypt = require("bcryptjs");
const {
  assertValidSession,
  DEFAULT_EXPIRIDITY,
  NO_EXPIRIDITY,
} = require("../../authentication");
const jwt = require("jsonwebtoken");
const GraphQLJSON = require("graphql-type-json");
const ActiveDirectory = require("activedirectory");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
let countFailedLoginAttempt = {};
let failedLoginAttemptResolver = {};
const FAILED_LOGIN_ATTEMPT_RESOLVE_TIME = 60 * 1000; // 60 seconds
const MAX_FAILED_LOGIN_ATTEMPT = 3;

const PRIVILEGES = require("../../role-privileges.json");
const dayjs = require("dayjs");
const TOKENIZE = process.env.TOKENIZE;

const AD_IP = process.env.AD_IP;
const AD_PORT = process.env.AD_PORT;

const resolvers = {
  JSON: GraphQLJSON,

  Query: {
    allUsers: async (self, params, context) => {
      assertValidSession(context.activeSession);
      const queryResult = await context.prisma.user.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
          registerType: params.registerType,
        },
        orderBy: {
          id: "desc",
        },
      });
      return queryResult;
    },
    allUserRoles: async (self, params, context) => {
      assertValidSession(context.activeSession);
      const queryResult = await context.prisma.userRoles.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });
      return queryResult;
    },
    currentUser: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (
        !context.activeSession ||
        !context.activeSession.User ||
        !context.activeSession.User.uuid
      ) {
        return null;
      }

      const user = await context.prisma.user.findUnique({
        where: {
          uuid: context.activeSession.User.userId,
        },
      });

      return user;
    },
    checkUserLoginTime: async (self, params, context) => {
      if (context.activeSession && context.activeSession.User) {
        let foundSession = await context.prisma.userSession.findMany({
          where: {
            userId: context.activeSession.User.userId,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        });

        if (foundSession.length > 0) {
          foundSession = foundSession[0];

          if (foundSession.expiresIn === "24h") {
            const shouldExpiredIn = dayjs(foundSession.createdAt)
              .add(24, "hour")
              .format("YYYY-MM-DD HH:mm:ss");

            return shouldExpiredIn;
          } else {
            return "no expired";
          }
        }
      }
      return "ok";
    },

    tokenizedAllUsers: async (self, params, context) => {
      assertValidSession(context.activeSession);

      const tokenized = jwt.verify(params.tokenizedParams, TOKENIZE);
      const { iat, ...payload } = tokenized;

      let queryResult = await context.prisma.user.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
          registerType: payload.registerType,
        },
        orderBy: {
          id: "desc",
        },
      });

      if (
        context.activeSession &&
        context.activeSession.User &&
        context.activeSession.User.registerType &&
        context.activeSession.User.registerType === "FARMER"
      ) {
        queryResult = await context.prisma.user.findMany({
          where: {
            ...NOT_DELETED_DOCUMENT_QUERY,
            icNo: context.activeSession.User.icNo,
            registerType: payload.registerType,
          },
          orderBy: {
            id: "desc",
          },
        });
      }

      const role = await context.prisma.userRoles.findMany({
        where: {
          uuid: {
            in: queryResult.map((q) => q.userRoleId),
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedRole = role.reduce((all, role) => {
        if (!all[role.uuid]) {
          all[role.uuid] = {};
        }
        all[role.uuid] = {
          ...role,
        };
        return all;
      }, {});

      queryResult = queryResult.map((q) => {
        let _id = q.uuid;
        let employeeId = q.username;
        return {
          ...q,
          _id: _id,
          employeeId: employeeId,
          Role: indexedRole[q.userRoleId] ? indexedRole[q.userRoleId] : {},
        };
      });

      const payloads = {
        queryResult,
      };

      let token = jwt.sign(payloads, TOKENIZE);
      return token;
    },

    tokenizedAllUserRoles: async (self, params, context) => {
      assertValidSession(context.activeSession);
      let queryResult = await context.prisma.userRoles.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      // let Users = await context.prisma.user.findMany({
      //   where: {
      //     userRoleId: {
      //       in: queryResult.map((q) => q.uuid),
      //     }
      //   }
      // });

      // const indexedUser = Users.reduce((all, user) => {
      //   if (!all[user.uuid]) {
      //     all[user.uuid] = [];
      //   }
      //   all[user.uuid].push(user);
      //   return all;
      // }, {});

      // queryResult = queryResult.map((q) => {
      //   return {
      //     ...q,
      //     countUsers: indexedUser[q._id] ? indexedUser[q._id].length : 0
      //   }
      // })

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
  },

  Mutation: {
    registerUser: async (self, params, context) => {
      let foundUser = await context.prisma.user.findMany({
        where: {
          username: params.username,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        take: 1,
      });

      if (foundUser.length > 0) {
        foundUser = foundUser[0];
        throw new Error(`Username ${foundUser.username} already use!`);
      }

      let newUser = {
        uuid: uuidV4(),
        username: params.username,
        password: params.password ? bcrypt.hashSync(params.password, 10) : "",
        defaultPassword: params.password,
        status: "Active",
        userRoleId: params.userRoleId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: "",
        createdBy: {},
        updatedBy: {},
        deletedBy: {},
      };

      await context.prisma.user.create({
        data: {
          ...newUser,
        },
      });

      return newUser;

      // const found = await context.collection("Users").findOne({
      //   employeeId: params.employeeId,
      //   ...NOT_DELETED_DOCUMENT_QUERY,
      //   // PREFIX
      // });

      // if (found) {
      //   // throw new Error(`Username ${found.employeeId} telah digunakan!`);
      //   throw new Error(`Username ${found.employeeId} already use!`);
      // }

      // console.log(params);
      // const newUser = {
      //   _id: uuidV4(),
      //   employeeId: (params.employeeId || "").trim(),
      //   roleId: (params.roleId || "").trim(),
      //   email: (params.email || "").trim(),
      //   phone: (params.phone || "").trim(),
      //   status: (params.status || "").trim(),
      //   password: params.password ? bcrypt.hashSync(params.password, 10) : "",
      //   defaultPassword: params.password,
      //   regionIds: params.regionIds,
      //   _createdAt: new Date().toISOString(),
      //   _updatedAt: new Date().toISOString(),
      //   // PREFIX
      // };

      // await context.collection("Users").insertOne(newUser);
      // return newUser;
    },
    registerOfficerUser: async (self, params, context) => {
      let foundUser = await context.prisma.user.findMany({
        where: {
          username: params.username,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        take: 1,
      });

      if (foundUser.length > 0) {
        foundUser = foundUser[0];
        throw new Error(`Username ${foundUser.username} already use!`);
      }

      let newUser = {
        uuid: uuidV4(),
        status: "Not Active",
        ...params,
        userRoleId: "NOT_SET",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: "",
        createdBy: {},
        updatedBy: {},
        deletedBy: {},
      };

      newUser["password"] = params.password
        ? bcrypt.hashSync(params.password, 10)
        : "";
      newUser["defaultPassword"] = params.password;

      await context.prisma.user.create({
        data: {
          ...newUser,
        },
      });

      return newUser;
    },
    deleteUser: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.user.update({
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
      return "success";
    },
    deactivateUser: async (self, params, context) => {
      await context.prisma.user.update({
        where: {
          uuid: params.uuid,
        },
        data: {
          status: "Not Active",
          updatedAt: new Date().toISOString(),
        },
      });
      return "success";
    },
    activateUser: async (self, params, context) => {
      await context.prisma.user.update({
        where: {
          uuid: params.uuid,
        },
        data: {
          status: "Active",
          loginAttemptCount: 0,
          updatedAt: new Date().toISOString(),
        },
      });
      return "success";
    },
    updateUser: async (self, params, context) => {
      const foundUser = await context.prisma.user.findUnique({
        where: {
          uuid: params.uuid,
        },
      });
      // const foundUser = await context.collection("Users").findOne({
      //   _id: params._id,
      // });
      if (!foundUser) {
        // throw new Error(`User tidak valid atau tidak ditemukan!`);
        throw new Error(`User invalid or not found!`);
      }

      // if (!bcrypt.compareSync(params.oldPassword, foundUser.password)) {
      //   // throw new Error(`Password lama tidak cocok!`);
      //   throw new Error(`Old password not match!`);
      // }

      let passwordObj = {};
      if (params.newPassword) {
        passwordObj = {
          password: bcrypt.hashSync(params.newPassword, 10),
          defaultPassword: params.newPassword,
        };
      }
      await context.prisma.user.update({
        where: {
          uuid: foundUser.uuid,
        },
        data: {
          username: params.username,
          email: params.email,
          phone: params.phone,
          district: params.district,
          controlPost: params.controlPost,
          ...passwordObj,
          updatedAt: new Date().toISOString(),
          updatedBy: context.activeSession.User,
        },
      });

      // let update = {
      //   name: (params.name || "").trim(),
      //   roleId: ("" + params.roleId).trim(),
      //   address: (params.address || "").trim(),
      //   employeeId: (params.employeeId || "").trim(),
      //   email: (params.email || "").trim(),
      //   phone: (params.phone || "").trim(),
      //   pictureUrl: (params.pictureUrl || "").trim(),
      //   regionIds: params.regionIds,
      //   deptCode: params.deptCode || "",
      //   _updatedAt: new Date().toISOString(),
      // };
      // if (!update.employeeId) {
      //   delete update.employeeId;
      // } else {
      //   const found = await context.collection("Users").findOne({
      //     _id: {
      //       $ne: params._id,
      //     },
      //     employeeId: params.employeeId,
      //     ...NOT_DELETED_DOCUMENT_QUERY,
      //   });

      //   if (found) {
      //     throw new Error(`Username ${found.employeeId} already use!`);
      //   }
      // }

      // if (!update.name) {
      //   delete update.name;
      // }
      // if (!update.address) {
      //   delete update.address;
      // }
      // if (!update.email) {
      //   delete update.email;
      // }
      // if (!update.phone) {
      //   delete update.phone;
      // }
      // if (!update.pictureUrl) {
      //   delete update.pictureUrl;
      // }
      // // console.log({ update });
      // // throw {};
      // await context.collection("Users").updateOne(
      //   {
      //     _id: params._id,
      //   },
      //   {
      //     $set: {
      //       ...update,
      //     },
      //   }
      // );
      return "SUCCESS";
    },
    updateRoleForUser: async (self, params, context) => {
      await context.prisma.user.update({
        where: {
          uuid: params.uuid,
        },
        data: {
          userRoleId: params.roleId,
        },
      });
      return "SUCCESS";
    },
    updateUserPassword: async (self, params, context) => {
      const foundUser = await context.prisma.user.findUnique({
        where: {
          uuid: params._id,
        },
      });
      // const foundUser = await context.collection("Users").findOne({
      //   _id: params._id,
      // });
      if (!foundUser) {
        // throw new Error(`User tidak valid atau tidak ditemukan!`);
        throw new Error(`User invalid or not found!`);
      }

      // if (!bcrypt.compareSync(params.oldPassword, foundUser.password)) {
      //   // throw new Error(`Password lama tidak cocok!`);
      //   throw new Error(`Old password not match!`);
      // }

      await context.prisma.user.update({
        where: {
          uuid: foundUser.uuid,
        },
        data: {
          password: bcrypt.hashSync(params.newPassword, 10),
          defaultPassword: params.newPassword,
          updatedAt: new Date().toISOString(),
          updatedBy: context.activeSession.User,
        },
      });
      // await context.collection("Users").updateOne(
      //   {
      //     _id: params._id,
      //   },
      //   {
      //     $set: {
      //       password: bcrypt.hashSync(params.newPassword, 10),
      //       _updatedAt: new Date().toISOString(),
      //     },
      //   }
      // );
      return "SUCCESS";
    },
    updateUserFarmer: async (self, params, context) => {
      const foundUser = await context.prisma.user.findUnique({
        where: {
          uuid: params._id,
        },
      });
      // const foundUser = await context.collection("Users").findOne({
      //   _id: params._id,
      // });
      if (!foundUser) {
        // throw new Error(`User tidak valid atau tidak ditemukan!`);
        throw new Error(`User invalid or not found!`);
      }

      // if (!bcrypt.compareSync(params.oldPassword, foundUser.password)) {
      //   // throw new Error(`Password lama tidak cocok!`);
      //   throw new Error(`Old password not match!`);
      // }

      await context.prisma.user.update({
        where: {
          uuid: foundUser.uuid,
        },
        data: {
          email: params.email,
          phone: params.phone,
          password: bcrypt.hashSync(params.newPassword, 10),
          defaultPassword: params.newPassword,
          updatedAt: new Date().toISOString(),
          updatedBy: context.activeSession.User,
        },
      });
    },
    resetUserPassword: async (self, params, context) => {
      // const foundUser = await context.collection("Users").findOne({
      //   _id: params._id,
      // });
      // if (!foundUser) {
      //   // throw new Error(`User tidak valid atau tidak ditemukan!`);
      //   throw new Error(`User invalid or not found!`);
      // }

      // await context.collection("Users").updateOne(
      //   {
      //     _id: params._id,
      //   },
      //   {
      //     $set: {
      //       password: bcrypt.hashSync(params.newPassword, 10),
      //       _updatedAt: new Date().toISOString(),
      //     },
      //   }
      // );
      return "SUCCESS";
    },

    updateTagsForUser: async (self, params, context) => {
      // await context.collection("Users").updateOne(
      //   {
      //     _id: params._id,
      //   },
      //   {
      //     $set: {
      //       tags: [...params.tags],
      //       _updatedAt: new Date().toISOString(),
      //     },
      //   }
      // );
      return "SUCCESS";
    },

    createUserRole: async (self, params, context) => {
      const newRole = {
        _id: uuidV4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
        // PREFIX
      };

      await context.prisma.userRoles.create({
        data: {
          uuid: newRole._id,
          name: params.name,
          privileges: [...params.privileges],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: "",
          createdBy: {},
          updatedBy: {},
          deletedBy: {},
        },
      });

      return "success";
    },
    updateUserRole: async (self, params, context) => {
      await context.prisma.userRoles.update({
        where: {
          uuid: params.uuid,
        },
        data: {
          ...params,
          updatedAt: new Date().toISOString(),
        },
      });
      return "SUCCESS";
    },
    deleteUserRole: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.prisma.userRoles.update({
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

      const foundUsers = await context.prisma.user.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
          userRoleId: params.uuid,
        },
      });

      if (foundUsers.length > 0) {
        await context.prisma.user.updateMany({
          where: {
            uuid: {
              in: foundUsers.map((u) => u.uuid),
            },
          },
          data: {
            status: "Not Active",
            updatedAt: new Date().toISOString(),
          },
        });
      }

      return "SUCCESS";
    },

    logIn: async (self, params, context) => {
      const foundUser = await context.collection("Users").findOne({
        employeeId: params.employeeId,
        // status: "Aktif",
        // roleId: "DEFAULT_GM_ROLE",
        ...NOT_DELETED_DOCUMENT_QUERY,
      });
      // if (!foundUser) {
      //   // throw new Error(`User ${params.employeeId} tidak ditemukan!`);
      //   throw new Error(`User ${params.employeeId} not found!`);
      // }
      if (foundUser.status !== "Active") {
        throw new Error(
          // `User ${params.employeeId} saat ini dalam status Non Aktif!`,
          `User ${params.employeeId} currently Not Active!`
        );
      }

      if (
        process.env.NODE_ENV === "production" &&
        !bcrypt.compareSync(params.password, foundUser.password)
      ) {
        if (countFailedLoginAttempt[foundUser._id]) {
          countFailedLoginAttempt[foundUser._id] += 1;
        } else {
          countFailedLoginAttempt[foundUser._id] = 1;
        }
        //
        if (failedLoginAttemptResolver[foundUser._id]) {
          clearTimeout(failedLoginAttemptResolver[foundUser._id]);
        }
        failedLoginAttemptResolver[foundUser._id] = setTimeout(() => {
          // console.log(
          //   "Resolve login attempt, after 60 seconds, for",
          //   foundUser._id
          // );
          countFailedLoginAttempt[foundUser._id] = 0;
        }, FAILED_LOGIN_ATTEMPT_RESOLVE_TIME);
        //

        if (countFailedLoginAttempt[foundUser._id] < MAX_FAILED_LOGIN_ATTEMPT) {
          throw new Error(
            `Password tidak cocok! (Failed Login Attempt ${
              countFailedLoginAttempt[foundUser._id]
            })`
          );
        } else {
          const foundRole = await context.collection("Users").findOne({
            _id: foundUser.roleId,
          });
          if (foundRole && foundRole.name.toUpperCase().trim() === "PEGAWAI") {
            // do nothing
          } else {
            await context.collection("Users").updateOne(
              {
                _id: foundUser._id,
              },
              {
                $set: {
                  status: "Not Active",
                  failedLoginAttemptAt: new Date().toISOString(),
                  _updatedAt: new Date().toISOString(),
                },
              }
            );
          }
          countFailedLoginAttempt[foundUser._id] = 0;
          if (failedLoginAttemptResolver[foundUser._id]) {
            clearTimeout(failedLoginAttemptResolver[foundUser._id]);
          }
          throw new Error(
            // `Password tidak cocok! Anda telah gagal login hingga ${MAX_FAILED_LOGIN_ATTEMPT} kali!`,
            `Password not match! You failed login until ${MAX_FAILED_LOGIN_ATTEMPT} times!`
          );
        }
      }

      countFailedLoginAttempt[foundUser._id] = 0;
      if (failedLoginAttemptResolver[foundUser._id]) {
        clearTimeout(failedLoginAttemptResolver[foundUser._id]);
      }

      const session = await createSession({
        user: foundUser,
        collection: context.collection,
        expiresIn: params.wontExpired ? NO_EXPIRIDITY : DEFAULT_EXPIRIDITY,
      });
      return session;
    },
    logOut: async (self, params, context) => {
      // if (context.activeSession) {
      //   await context
      //     .collection("UserSessions")
      //     .updateOne(
      //       { _id: context.activeSession._id },
      //       { $set: { _deletedAt: new Date().toISOString() } }
      //     );
      // }
      if (
        context.activeSession &&
        context.activeSession.User &&
        context.activeSession.User.userId
      ) {
        await context.prisma.user.update({
          where: {
            uuid: context.activeSession.User.userId,
          },
          data: {
            loginStatus: "LOGOUT",
          },
        });

        await context.prisma.activityLogs.create({
          data: {
            uuid: uuidV4(),
            type: "LOGOUT",
            tableName: "activitySession",
            log: {
              ...context.activeSession,
            },
            userId: context.activeSession.User.userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      }

      //Double check
      if (context.activeSession && context.activeSession.uuid) {
        const session = await context.prisma.userSession.findUnique({
          where: {
            uuid: context.activeSession.uuid,
          },
        });

        await context.prisma.user.update({
          where: {
            uuid: session.userId,
          },
          data: {
            loginStatus: "LOGOUT",
          },
        });

        await context.prisma.activityLogs.create({
          data: {
            uuid: uuidV4(),
            type: "LOGOUT",
            tableName: "activitySession",
            log: {
              ...session,
            },
            userId: session.userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      }
      return "SUCCESS";
    },

    logInByEmployeeId: async (self, params, context) => {
      if (context.activeSession && context.activeSession.errorPage) {
        throw new Error("Error Invalid Page");
      }

      const jsonToken = jwt.verify(params.employeeId, "SECRET");

      // Check the "exp" claim to see if it has expired
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      if (jsonToken.exp && currentTime > jsonToken.exp) {
        // console.log("JWT has expired.");
        throw new Error("Session Expired!");
      } else {
        // console.log("JWT is still valid.");

        // console.log(jsonToken);
        let foundUser = await context.prisma.user.findMany({
          where: {
            username: jsonToken.username,
            status: "Active",
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          take: 1,
        });
        if (foundUser.length === 0) {
          // console.log(`Unknow user ${jsonToken.username}`);
          throw new Error(`Invalid Login!!`);
        }
        foundUser = foundUser[0];

        // console.log({
        //   params,
        //   foundUser,
        // });
        if (!foundUser) {
          // throw new Error(`User ${params.employeeId} tidak ditemukan!`);
          console.log(`Unknow user ${jsonToken.username} not found!`);

          throw new Error(`Invalid Login!!`);
        }
        if (foundUser.status !== "Active") {
          console.log(`User ${jsonToken.username} currently Not Active!`);
          throw new Error(`Invalid Login!!`);
        }

        if (foundUser && foundUser.loginStatus) {
          if (foundUser.loginStatus === "LOGIN") {
            // throw new Error("Your account is connected to another device!");
            // const checkSession = await checkUserSessionBeforeLogin({
            //   context,
            //   user: foundUser,
            // });
            // if (checkSession !== "expired") {
            //   throw new Error("Your account is connected to another device!");
            // }
          }
        }

        const session = await createSession({
          user: foundUser,
          prisma: context.prisma,
          expiresIn: params.wontExpired ? NO_EXPIRIDITY : DEFAULT_EXPIRIDITY,
        });

        await context.prisma.user.update({
          where: {
            uuid: foundUser.uuid,
          },
          data: {
            loginStatus: "LOGIN",
          },
        });

        await context.prisma.activityLogs.create({
          data: {
            uuid: uuidV4(),
            type: "LOGIN",
            tableName: "activitySession",
            log: {
              ...session,
            },
            userId: foundUser.uuid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });

        return session;
      }
    },

    loginByFarmer: async (self, params, context) => {
      if (context.activeSession && context.activeSession.errorPage) {
        throw new Error("Error Invalid Page");
      }

      const jsonToken = jwt.verify(params.icNo, "SECRET");

      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      if (jsonToken.exp && currentTime > jsonToken.exp) {
        throw new Error("Session Expired!");
      } else {
        let foundUser = await context.prisma.user.findMany({
          where: {
            icNo: jsonToken.username,
            status: "Active",
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          take: 1,
        });

        if (foundUser.length === 0) {
          console.log(`Unknow user ${jsonToken.icNo}`);
          throw new Error(`Invalid Login!`);
        }
        foundUser = await context.prisma.user.findMany({
          where: {
            icNo: jsonToken.username,
            registerType: "FARMER",
            status: "Active",
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

        // if (foundUser.length > 1) {
        //   throw new Error(
        //     `Got IC No. more than 1, ${jsonToken.username}, please contact administrator`
        //   );
        // }

        foundUser = foundUser[0];

        // console.log({
        //   params,
        //   foundUser,
        // });
        if (!foundUser) {
          // throw new Error(`User ${params.icNo} tidak ditemukan!`);
          console.log(`User ${jsonToken.icNo} not found!`);
          throw new Error(`Invalid Login!`);
        }
        if (foundUser.status !== "Active") {
          console.log(`User ${jsonToken.icNo} currently Not Active!`);
          throw new Error(`Invalid Login!`);
        }

        const session = await createSession({
          user: foundUser,
          prisma: context.prisma,
          expiresIn: params.wontExpired ? NO_EXPIRIDITY : DEFAULT_EXPIRIDITY,
        });

        if (foundUser && foundUser.loginStatus) {
          if (foundUser.loginStatus === "LOGIN") {
            // throw new Error("Your account is connected to another device!");
            // const checkSession = await checkUserSessionBeforeLogin({
            //   context,
            //   user: foundUser,
            // });
            // if (checkSession !== "expired") {
            //   throw new Error("Your account is connected to another device!");
            // }
          }
        }

        await context.prisma.user.update({
          where: {
            uuid: foundUser.uuid,
          },
          data: {
            loginStatus: "LOGIN",
          },
        });

        await context.prisma.activityLogs.create({
          data: {
            uuid: uuidV4(),
            type: "LOGIN",
            tableName: "activitySession",
            log: {
              ...session,
            },
            userId: foundUser.uuid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });

        return session;
      }
    },
    checkEmployeeIdAndPassword: async (self, params, context) => {
      let config = {
        // url: "ldap://mprt.eg.gov.bn",
        url: `ldap://${AD_IP}:${AD_PORT}`,
        // baseDN: "dc=mprt,dc=eg,dc=gov,dc=bn", // Replace with your baseDN
        // username: "PRTAUTHPRO1", // Waiting from client
        // password: "DV57*0923!!", // Replace with your password
        // username: "MPRT\\aims.gc",
        // password: "Mirror#0091@", // Replace with your password
        // baseDN: "CN=LG_MPRT_Annisah,OU=System Accounts,DC=MPRT,DC=EG,DC=GOV,DC=BN",
        // username: "LG_MPRT_Annisah",
        // password: "b^O;($1247%y*:};zf|L",
        username: params.employeeId,
        password: params.password,
      };

      if (
        params.employeeId === "root" ||
        params.employeeId === "citra" ||
        params.employeeId === "ifa"
      ) {
        let foundUser = await context.prisma.user.findMany({
          where: {
            username: params.employeeId,
            status: "Active",
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          take: 1,
        });
        if (foundUser.length === 0) {
          throw new Error(`Unknow user ${params.employeeId}`);
        }
        foundUser = foundUser[0];

        let loginAttempt = foundUser.loginAttemptCount || 0;

        if (loginAttempt >= 3) {
          if (foundUser.username !== "root") {
            await context.prisma.user.update({
              where: {
                uuid: foundUser.uuid,
              },
              data: {
                loginAttemptCount: loginAttempt,
                status: "Not Active",
              },
            });
            throw new Error(
              `Failed to attempt 3x login. Your Account now is Not Active. Please contact Administrator`
            );
          }
        }

        if (!bcrypt.compareSync(params.password, foundUser.password)) {
          loginAttempt += 1;
          if (foundUser.username !== "root") {
            await context.prisma.user.update({
              where: {
                uuid: foundUser.uuid,
              },
              data: {
                loginAttemptCount: loginAttempt,
              },
            });
          }

          throw new Error(`Invalid Password`);
        }
        const token = jwt.sign(
          {
            username: params.employeeId,
            password: foundUser.password,
          },
          "SECRET",
          { expiresIn: "30s" }
        );
        // return foundUser.username;
        return token;
      } else {
        let isAuthenticated = false;
        if (process.env.USE_AD && process.env.USE_AD === "false") {
          isAuthenticated = true;
        } else {
          try {
            isAuthenticated = await authenticateUser(config);
          } catch (err) {
            if (err) {
              isAuthenticated = false;
            }
          }
        }
        if (isAuthenticated) {
          console.log("Authentication successful");

          let foundUser = await context.prisma.user.findMany({
            where: {
              username: params.employeeId,
              status: "Active",
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
            take: 1,
          });
          if (foundUser.length === 0) {
            throw new Error(`Couldn't find your account`);
          }
          foundUser = foundUser[0];
          // if (!bcrypt.compareSync(params.password, foundUser.password)) {
          //   throw new Error(`Invalid Password`);
          // }
          const token = jwt.sign(
            {
              username: params.employeeId,
              // password: foundUser.password,
            },
            "SECRET",
            { expiresIn: "30s" }
          );
          // return foundUser.username;

          await context.prisma.user.update({
            where: {
              uuid: foundUser.uuid,
            },
            data: {
              loginAttemptCount: 0,
            },
          });
          return token;
          // You can perform additional Active Directory operations here
        } else {
          let foundUser = await context.prisma.user.findMany({
            where: {
              username: params.employeeId,
              status: "Active",
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
            take: 1,
          });
          if (foundUser.length === 0) {
            throw new Error("User not registered!");
          }

          foundUser = foundUser[0];
          let loginAttemptCount = foundUser.loginAttemptCount || 0;

          loginAttemptCount += 1;

          if (loginAttemptCount >= 3) {
            await context.prisma.user.update({
              where: {
                uuid: foundUser.uuid,
              },
              data: {
                loginAttemptCount: loginAttemptCount,
                status: "Not Active",
              },
            });
            throw new Error(
              `Failed to attempt 3x login. Your Account now is Not Active. Please contact Administrator`
            );
          } else {
            await context.prisma.user.update({
              where: {
                uuid: foundUser.uuid,
              },
              data: {
                loginAttemptCount: loginAttemptCount,
              },
            });
            throw new Error("Invalid AD Account");
          }
        }
      }
    },
    checkFarmerUser: async (self, params, context) => {
      let foundUser = await context.prisma.user.findMany({
        where: {
          icNo: params.icNo,
          status: "Active",
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        take: 1,
      });

      if (foundUser.length === 0) {
        throw new Error(`Couldn't find your account`);
        // throw new Error(`Unknow user ${params.icNo}`);
      }

      foundUser = foundUser[0];
      if (!bcrypt.compareSync(params.password, foundUser.password)) {
        // throw new Error(`Invalid Password`);
        throw new Error(`Couldn't find your account`);
      }

      const token = jwt.sign(
        {
          username: params.icNo,
          password: foundUser.password,
        },
        "SECRET",
        { expiresIn: "30s" }
      );

      return token;

      // return foundUser.username;
    },
    setUserOnlyBioSecurityEnforcement: async (self, params, context) => {
      await context.prisma.user.update({
        where: {
          uuid: params.uuid,
        },
        data: {
          isUserBioSecurityEnforcementOnly:
            params.isUserBioSecurityEnforcementOnly,
        },
      });

      return "success";
    },

    tokenizedCreateUserRole: async (self, params, context) => {
      const tokenized = jwt.verify(params.tokenized, TOKENIZE);

      const { iat, ...payload } = tokenized;

      const newRole = {
        _id: uuidV4(),
        ...payload,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
        // PREFIX
      };

      await context.prisma.userRoles.create({
        data: {
          uuid: newRole._id,
          name: payload.name,
          privileges: [...payload.privileges],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: "",
          createdBy: {},
          updatedBy: {},
          deletedBy: {},
        },
      });

      return "success";
    },

    tokenizedUpdateUserRole: async (self, params, context) => {
      const tokenized = jwt.verify(params.tokenized, TOKENIZE);

      const { iat, ...payload } = tokenized;

      await context.prisma.userRoles.update({
        where: {
          uuid: payload.uuid,
        },
        data: {
          ...payload,
          updatedAt: new Date().toISOString(),
        },
      });
      return "SUCCESS";
    },

    tokenizedDeleteUserRole: async (self, params, context) => {
      let userId = "";

      if (context.activeSession.User && context.activeSession.User.uuid) {
        userId = context.activeSession.User.uuid;
      }

      if (!userId) {
        throw new Error("Invalid Session !!!");
      }

      const tokenized = jwt.verify(params.tokenized, TOKENIZE);

      const { iat, ...payload } = tokenized;

      let getDeletedData = await context.prisma.userRoles.findUnique({
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

      await context.prisma.userRoles.update({
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
          uuid: uuidV4(),
          type: "DELETE",
          tableName: "userRoles",
          log: {
            ...getDeletedData,
          },
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      const foundUsers = await context.prisma.user.findMany({
        where: {
          ...NOT_DELETED_DOCUMENT_QUERY,
          userRoleId: payload.uuid,
        },
      });

      if (foundUsers.length > 0) {
        await context.prisma.user.updateMany({
          where: {
            uuid: {
              in: foundUsers.map((u) => u.uuid),
            },
          },
          data: {
            status: "Not Active",
            updatedAt: new Date().toISOString(),
          },
        });
      }

      return "SUCCESS";
    },

    tokenizedUpdateUser: async (self, params, context) => {
      const tokenized = jwt.verify(params.tokenized, TOKENIZE);

      const { iat, ...payload } = tokenized;

      const foundUser = await context.prisma.user.findUnique({
        where: {
          uuid: payload.uuid,
        },
      });
      // const foundUser = await context.collection("Users").findOne({
      //   _id: params._id,
      // });
      if (!foundUser) {
        // throw new Error(`User tidak valid atau tidak ditemukan!`);
        throw new Error(`User invalid or not found!`);
      }

      // if (!bcrypt.compareSync(params.oldPassword, foundUser.password)) {
      //   // throw new Error(`Password lama tidak cocok!`);
      //   throw new Error(`Old password not match!`);
      // }

      let passwordObj = {};
      if (payload.newPassword) {
        passwordObj = {
          password: bcrypt.hashSync(payload.newPassword, 10),
          defaultPassword: payload.newPassword,
        };
      }
      await context.prisma.user.update({
        where: {
          uuid: foundUser.uuid,
        },
        data: {
          username: payload.username,
          email: payload.email,
          phone: payload.phone,
          district: payload.district,
          controlPost: payload.controlPost,
          ...passwordObj,
          unit: payload?.unit || "",
          updatedAt: new Date().toISOString(),
          updatedBy: context.activeSession.User,
        },
      });

      // let update = {
      //   name: (params.name || "").trim(),
      //   roleId: ("" + params.roleId).trim(),
      //   address: (params.address || "").trim(),
      //   employeeId: (params.employeeId || "").trim(),
      //   email: (params.email || "").trim(),
      //   phone: (params.phone || "").trim(),
      //   pictureUrl: (params.pictureUrl || "").trim(),
      //   regionIds: params.regionIds,
      //   deptCode: params.deptCode || "",
      //   _updatedAt: new Date().toISOString(),
      // };
      // if (!update.employeeId) {
      //   delete update.employeeId;
      // } else {
      //   const found = await context.collection("Users").findOne({
      //     _id: {
      //       $ne: params._id,
      //     },
      //     employeeId: params.employeeId,
      //     ...NOT_DELETED_DOCUMENT_QUERY,
      //   });

      //   if (found) {
      //     throw new Error(`Username ${found.employeeId} already use!`);
      //   }
      // }

      // if (!update.name) {
      //   delete update.name;
      // }
      // if (!update.address) {
      //   delete update.address;
      // }
      // if (!update.email) {
      //   delete update.email;
      // }
      // if (!update.phone) {
      //   delete update.phone;
      // }
      // if (!update.pictureUrl) {
      //   delete update.pictureUrl;
      // }
      // // console.log({ update });
      // // throw {};
      // await context.collection("Users").updateOne(
      //   {
      //     _id: params._id,
      //   },
      //   {
      //     $set: {
      //       ...update,
      //     },
      //   }
      // );
      return "SUCCESS";
    },
    tokenizedDeleteUser: async (self, params, context) => {
      let userId = "";

      if (context.activeSession.User && context.activeSession.User.uuid) {
        userId = context.activeSession.User.uuid;
      }

      if (!userId) {
        throw new Error("Invalid Session !!!");
      }

      const tokenized = jwt.verify(params.tokenized, TOKENIZE);

      const { iat, ...payload } = tokenized;

      let getDeletedData = await context.prisma.user.findUnique({
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

      await context.prisma.user.update({
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
          uuid: uuidV4(),
          type: "DELETE",
          tableName: "users",
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
    tokenizedUpdateUserFarmer: async (self, params, context) => {
      const tokenized = jwt.verify(params.tokenized, TOKENIZE);

      const { iat, ...payload } = tokenized;

      const foundUser = await context.prisma.user.findUnique({
        where: {
          uuid: payload._id,
        },
      });
      // const foundUser = await context.collection("Users").findOne({
      //   _id: params._id,
      // });
      if (!foundUser) {
        // throw new Error(`User tidak valid atau tidak ditemukan!`);
        throw new Error(`User invalid or not found!`);
      }

      // if (!bcrypt.compareSync(params.oldPassword, foundUser.password)) {
      //   // throw new Error(`Password lama tidak cocok!`);
      //   throw new Error(`Old password not match!`);
      // }

      await context.prisma.user.update({
        where: {
          uuid: foundUser.uuid,
        },
        data: {
          email: payload.email,
          phone: payload.phone,
          password: bcrypt.hashSync(payload.newPassword, 10),
          defaultPassword: payload.newPassword,
          updatedAt: new Date().toISOString(),
          updatedBy: context.activeSession.User,
        },
      });

      return "success";
    },
    farmerForgotPassword: async (self, params, context) => {
      if (context.activeSession && context.activeSession.errorPage) {
        throw new Error("Error Invalid Page");
      }

      const tokenized = jwt.verify(params.tokenized, TOKENIZE);

      const { iat, ...payload } = tokenized;

      let foundUser = await context.prisma.user.findMany({
        where: {
          icNo: payload.icNo,
          // rocbnRegNo: payload.rocbnRegNo,
          doaaRegNo: payload.doaaRegNo,
          registerType: "FARMER",
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        take: 1,
      });

      if (foundUser.length === 0) {
        // console.log(`Unknow user ${jsonToken.icNo}`);
        throw new Error(`Invalid Farmer User!`);
      }
      foundUser = foundUser[0];
      await context.prisma.user.update({
        where: {
          uuid: foundUser.uuid,
        },
        data: {
          password: bcrypt.hashSync(payload.newPassword, 10),
          defaultPassword: payload.newPassword,
          updatedAt: new Date().toISOString(),
        },
      });
      return "ok";
    },
    exportAllUsersTypeAdmin: async (self, params, context) => {
      let users = await context.prisma.user.findMany({
        where: {
          registerType: "OFFICER",
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      let role = await context.prisma.userRoles.findMany({
        where: {
          uuid: {
            in: users.map((q) => q.userRoleId),
          },
        },
      });

      const indexedRole = role.reduce((all, role) => {
        if (!all[role.uuid]) {
          all[role.uuid] = {};
        }
        all[role.uuid] = role;
        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("");

      let columnWidths = [];
      for (let c = 0; c < 10; c++) {
        columnWidths.push(30);
      }

      let headerRow = [
        "NAME",
        "IC. NO",
        "USERNAME",
        "EMAIL",
        "PHONE",
        "DISTRICT",
        "CONTROL POST",
        "USER ROLES",
        "STATUS",
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

      for (const user of users) {
        const role = indexedRole[user.userRoleId];
        console.log(indexedRole);
        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: user?.name || "",
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
          value: user?.icNo || "",
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
          value: user?.username || "",
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
          value: user?.email || "",
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
          value: user?.phone || "",
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
          value: user?.district || "",
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
          value: user?.controlPost || "",
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
          value: role?.name || "",
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
          value: user?.status || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

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
      const filename = `User_Officer.xlsx`;
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
    exportAllUsersTypeFarmer: async (self, params, context) => {
      let users = await context.prisma.user.findMany({
        where: {
          registerType: "FARMER",
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        orderBy: {
          id: "desc",
        },
      });

      let role = await context.prisma.userRoles.findMany({
        where: {
          uuid: {
            in: users.map((q) => q.userRoleId),
          },
        },
      });

      const indexedRole = role.reduce((all, role) => {
        if (!all[role.uuid]) {
          all[role.uuid] = {};
        }
        all[role.uuid] = role;
        return all;
      }, {});

      let workbook = new Excel.Workbook();
      workbook.creator = "DoAA";
      let productionSheet = workbook.addWorksheet("");

      let columnWidths = [];
      for (let c = 0; c < 10; c++) {
        columnWidths.push(30);
      }

      let headerRow = [
        "NAME",
        "IC. NO",
        "USERNAME",
        "EMAIL",
        "PHONE",
        "USER ROLES",
        "STATUS",
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

      for (const user of users) {
        const role = indexedRole[user.userRoleId];
        console.log(indexedRole);
        excelHelper.addText({
          sheet: productionSheet,
          row: rowCounter,
          col: ++colCounter,
          value: user?.name || "",
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
          value: user?.icNo || "",
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
          value: user?.username || "",
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
          value: user?.email || "",
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
          value: user?.phone || "",
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
          value: role?.name || "",
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
          value: user?.status || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

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
      const filename = `User_Farmer.xlsx`;
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
    latestTimeConnection: async (self, params, context) => {
      return dayjs().toISOString();
    },
  },

  User: {
    _id: (self) => self.uuid,
    employeeId: (self) => self.username,
    Role: async (self, params, context) => {
      let found = await context.prisma.userRoles.findUnique({
        where: {
          uuid: self.userRoleId,
        },
      });

      if (found) {
        found.id = BigInt(found.id).toString();

        found = {
          ...found,
          _id: found.uuid,
          privileges: found.privileges,
        };

        return found;
      }
    },
    tags: (self) => (self.tags ? self.tags : []),
  },

  UserSession: {
    User: async (self, params, context) => {
      // return await context.collection("Users").findOne({
      //   _id: self.userId,
      // });

      let found = await context.prisma.user.findUnique({
        where: {
          uuid: self.userId,
        },
      });

      if (found) {
        found.id = BigInt(found.id).toString();
        return found;
      }
    },
  },

  UserRole: {
    _id: (self) => {
      return self.uuid;
    },
    countUsers: async (self, params, context) => {
      return await context
        .collection("Users")
        .find({
          roleId: self._id,
        })
        .count();
    },
  },
};

exports.resolvers = resolvers;

const createSession = async ({
  user,
  expiresIn = DEFAULT_EXPIRIDITY,
  prisma,
}) => {
  const sessionId = uuidV4();
  delete user.password;

  const role = await prisma.userRoles.findUnique({
    where: {
      uuid: user.userRoleId,
    },
  });

  if (!role) {
    throw new Error("Role for this user is not set!");
  }
  const indexedPrivileges = PRIVILEGES.reduce((all, priv) => {
    if (!all[priv.key]) {
      all[priv.key] = {};
    }
    all[priv.key] = priv;
    return all;
  }, {});
  const userPrivileges = role.privileges.map((priv) => {
    const split = priv.split(":");
    return split[0];
  });

  let APPS = [];
  for (const priv of userPrivileges) {
    if (indexedPrivileges[priv]) {
      if (indexedPrivileges[priv].app === "") {
        console.log(priv);
      }
      APPS.push(indexedPrivileges[priv].app);
    }
  }

  APPS = [...new Set(APPS)];
  if (APPS.length > 0) {
    APPS = APPS.sort();
  }

  const jwtPayload = {
    sessionId,
    user: {
      _id: user._id,
      uuid: user.uuid,
      employeeId: user.employeeId,
      phone: user.phone,
      email: user.email,
      icNo: user?.icNo || "",
      controlPost: user?.controlPost || "",
      district: user?.district || "",
      registerType: user?.registerType || "",
      isUserBioSecurityEnforcementOnly:
        user?.isUserBioSecurityEnforcementOnly || false,

      rocbnRegNo: user?.rocbnRegNo || "",
      doaaRegNo: user?.doaaRegNo || "",
      roleId: user.roleId,
      roleName: role?.name || "",
      status: user.status,
    },
  };

  let token =
    expiresIn === null
      ? jwt.sign(jwtPayload, "SECRET", {})
      : jwt.sign(jwtPayload, "SECRET", { expiresIn });
  const newSession = {
    _id: sessionId,
    userId: user.uuid,
    employeeId: user.username,
    token: "token-" + token,
    expiresIn,
    appList: APPS,
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
  };
  await prisma.userSession.create({
    data: {
      uuid: newSession._id,
      userId: user.uuid,
      employeeId: user.username,
      expiresIn,
      token: newSession.token,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
  try {
    await prisma.user.update({
      where: {
        uuid: user._id,
      },
      data: {
        lastLoginAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {}
  return newSession;
};

const authenticateUser = async (config) => {
  return new Promise((resolve, reject) => {
    const ad = new ActiveDirectory(config);

    ad.authenticate(config.username, config.password, async (err, auth) => {
      if (err) {
        reject(err);
      } else {
        resolve(auth);
      }
    });
  });
};

const checkUserSessionBeforeLogin = async ({ context, user }) => {
  let latestSession = await context.prisma.userSession.findMany({
    where: {
      userId: user.uuid,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
  });

  if (latestSession.length > 0) {
    latestSession = latestSession[0];

    if (latestSession.expiresIn === "24h") {
      const currentTime = dayjs();
      const sessionTime = dayjs(latestSession.createdAt);

      const diff = currentTime.diff(sessionTime, "minute");
      if (diff >= 60) {
        return "expired";
      } else {
        return "still in time";
      }
    } else {
      return "no expired";
    }
  }
  return "Error Session!";
};
