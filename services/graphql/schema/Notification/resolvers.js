const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const TOKENIZE = process.env.TOKENIZE;
const jwt = require("jsonwebtoken");
const lodash = require("lodash");

const resolvers = {
  Query: {
    allNotifications: async (self, params, context) => {
      let lists = [];
      const getNonComplienceCommercials =
        await context.prisma.bioSecurityNonComplianceCommercial.findMany({
          where: {
            OR: [{ nosReferenceNumber: "" }, { actionByEnforcement: "" }],

            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      // console.log(
      //   "getNonComplienceCommercials",
      //   getNonComplienceCommercials.length
      // );

      const filterCompanyUUID = lodash.uniq(
        getNonComplienceCommercials
          .filter((g) => g.companyUUID)
          .map((c) => c.companyUUID)
      );
      const company = await context.prisma.bioSecurityCompanyProfile.findMany({
        where: {
          uuid: {
            in: filterCompanyUUID,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedCompany = company.reduce((all, comp) => {
        if (!all[comp.uuid]) {
          all[comp.uuid] = {};
        }
        all[comp.uuid] = comp;
        return all;
      }, {});

      for (const commercial of getNonComplienceCommercials) {
        let message = "";
        const foundCompany = indexedCompany[commercial.companyUUID];
        if (foundCompany) {
          if (!commercial.nosReferenceNumber) {
            message = `Non-Compliance for Company Reg ${foundCompany.companyRegNo}`;
          }

          if (!commercial.actionByEnforcement) {
            message = `Non-Compliance for Company Reg ${foundCompany.companyRegNo}`;
          }

          lists.push({
            message,
            date: commercial.entryDate,
            module: "Bio Security - Non Compliance",
            controlPost: commercial?.pointOfEntry || "",
            type: "Commercial",
          });
        }
      }

      const getNonCompliencePersonals =
        await context.prisma.bioSecurityNonCompliancePersonal.findMany({
          where: {
            OR: [{ nosReferenceNumber: "" }, { actionByEnforcement: "" }],
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      const personals =
        await context.prisma.bioSecurityIndividualProfile.findMany({
          where: {
            uuid: {
              in: getNonCompliencePersonals
                .filter((g) => g.individualProfileUUID)
                .map((c) => c.individualProfileUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedPersonal = personals.reduce((all, pr) => {
        if (!all[pr.uuid]) {
          all[pr.uuid] = {};
        }
        all[pr.uuid] = pr;
        return all;
      }, {});

      for (const personal of getNonCompliencePersonals) {
        let message = "";
        const foundPersonal = indexedPersonal[personal.individualProfileUUID];
        if (!personal.nosReferenceNumber) {
          message = `Non-Compliance for Personal IC No ${foundPersonal.icNo}`;
        }

        if (!personal.actionByEnforcement) {
          message = `Non-Compliance for Personal IC No ${foundPersonal.icNo}`;
        }

        lists.push({
          message,
          date: personal.entryDate,
          module: "Bio Security - Non Compliance",
          controlPost: personal?.pointOfEntry || "",
          type: "Personal",
        });
      }

      const getNonCompliencePersonalConcessions =
        await context.prisma.bioSecurityNonCompliancePersonalConcession.findMany(
          {
            where: {
              OR: [{ nosReferenceNumber: "" }, { actionByEnforcement: "" }],
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
            orderBy: {
              id: "desc",
            },
          }
        );

      for (const concession of getNonCompliencePersonalConcessions) {
        let message = "";

        if (!concession.nosReferenceNumber) {
          message = `Non-Compliance for personal concessions name ${concession.name}`;
        }

        if (!concession.actionByEnforcement) {
          message = `Non-Compliance for personal concessions name ${concession.name}`;
        }

        lists.push({
          message,
          date: concession.entryDate,
          module: "Bio Security - Non Compliance",
          controlPost: concession?.pointOfEntry || "",
          type: "Personal Concession",
        });
      }

      return lists;
    },

    tokenizeAllNotification: async (self, params, context) => {
      let lists = [];
      const getNonComplienceCommercials =
        await context.prisma.bioSecurityNonComplianceCommercial.findMany({
          where: {
            OR: [{ nosReferenceNumber: "" }, { actionByEnforcement: "" }],

            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      // console.log(
      //   "getNonComplienceCommercials",
      //   getNonComplienceCommercials.length
      // );

      const filterCompanyUUID = lodash.uniq(
        getNonComplienceCommercials
          .filter((g) => g.companyUUID)
          .map((c) => c.companyUUID)
      );

      const company = await context.prisma.bioSecurityCompanyProfile.findMany({
        where: {
          uuid: {
            in: filterCompanyUUID,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
      });

      const indexedCompany = company.reduce((all, comp) => {
        if (!all[comp.uuid]) {
          all[comp.uuid] = {};
        }
        all[comp.uuid] = comp;
        return all;
      }, {});

      for (const commercial of getNonComplienceCommercials) {
        let message = "";
        const foundCompany = indexedCompany[commercial.companyUUID];

        if (foundCompany) {
          if (!commercial.nosReferenceNumber) {
            message = `Non-Compliance for Company Reg ${foundCompany.companyRegNo}`;
          }

          if (!commercial.actionByEnforcement) {
            message = `Non-Compliance for Company Reg ${foundCompany.companyRegNo}`;
          }

          lists.push({
            message,
            date: commercial.entryDate,
            module: "Bio Security - Non Compliance",
            controlPost: commercial?.pointOfEntry || "",
            type: "Commercial",
          });
        }
      }

      const getNonCompliencePersonals =
        await context.prisma.bioSecurityNonCompliancePersonal.findMany({
          where: {
            OR: [{ nosReferenceNumber: "" }, { actionByEnforcement: "" }],
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            id: "desc",
          },
        });

      const personals =
        await context.prisma.bioSecurityIndividualProfile.findMany({
          where: {
            uuid: {
              in: getNonCompliencePersonals
                .filter((g) => g.individualProfileUUID)
                .map((c) => c.individualProfileUUID),
            },
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
        });

      const indexedPersonal = personals.reduce((all, pr) => {
        if (!all[pr.uuid]) {
          all[pr.uuid] = {};
        }
        all[pr.uuid] = pr;
        return all;
      }, {});

      for (const personal of getNonCompliencePersonals) {
        let message = "";
        const foundPersonal = indexedPersonal[personal.individualProfileUUID];
        if (!personal.nosReferenceNumber) {
          message = `Non-Compliance for Personal IC No ${foundPersonal.icNo}`;
        }

        if (!personal.actionByEnforcement) {
          message = `Non-Compliance for Personal IC No ${foundPersonal.icNo}`;
        }

        lists.push({
          message,
          date: personal.entryDate,
          module: "Bio Security - Non Compliance",
          controlPost: personal?.pointOfEntry || "",
          type: "Personal",
        });
      }

      const getNonCompliencePersonalConcessions =
        await context.prisma.bioSecurityNonCompliancePersonalConcession.findMany(
          {
            where: {
              OR: [{ nosReferenceNumber: "" }, { actionByEnforcement: "" }],
              ...NOT_DELETED_DOCUMENT_QUERY,
            },
            orderBy: {
              id: "desc",
            },
          }
        );

      for (const concession of getNonCompliencePersonalConcessions) {
        let message = "";

        if (!concession.nosReferenceNumber) {
          message = `Non-Compliance for personal concessions name ${concession.name}`;
        }

        if (!concession.actionByEnforcement) {
          message = `Non-Compliance for personal concessions name ${concession.name}`;
        }

        lists.push({
          message,
          date: concession.entryDate,
          module: "Bio Security - Non Compliance",
          controlPost: concession?.pointOfEntry || "",
          type: "Personal Concession",
        });
      }

      const payload = {
        lists,
      };

      let token = jwt.sign(payload, TOKENIZE);

      return token;
    },
  },
};
exports.resolvers = resolvers;
