const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const resolvers = {
  Query: {
    allBioSecurityNonComplienceLists: async (self, params, context) => {
      let filterQuery = {};
      if (params.companyProfileUUID) {
        filterQuery = {
          companyProfileUUID: params.companyProfileUUID,
        };
      } else if (params.individualProfileUUID) {
        filterQuery = {
          individualProfileUUID: params.individualProfileUUID,
        };
      }
      let queryResult =
        await context.prisma.bioSecurityNonComplianceLists.findMany({
          where: {
            ...filterQuery,
            ...NOT_DELETED_DOCUMENT_QUERY,
          },
          orderBy: {
            date: "asc",
          },
        });
      return queryResult;
    },
  },
  BioSecurityNonComplienceList: {
    id: (self) => {
      let id = BigInt(self.id);
      return id.toString();
    },
    officer: async (self, params, context) => {
      if (self.inputByOfficer.uuid) {
        const foundSession = await context.prisma.userSession.findUnique({
          where: {
            uuid: self.inputByOfficer.uuid,
          },
        });

        if (foundSession) {
          const foundUser = await context.prisma.user.findUnique({
            where: {
              uuid: foundSession.userId,
            },
          });

          return foundUser?.name || "";
        }
      }

      return "";
    },
  },
};
exports.resolvers = resolvers;
