const RuminantPens = `
  type RuminantPens {
    id: String!
    uuid: String!
    companyName: String!
    FarmerProfile: FarmerProfile
    FarmLocation: FarmLocation

    farmerUUID: String!
    farmerCompanyName: String!

    farmAreaId: String!

    farmProfileArea: String
    pensNo: String!
    pensSystem: String!
    pensCapacity: Int!
    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [RuminantPens];
exports.rootTypes = `
  type Query {
    allRuminantPenses: [RuminantPens]
    tokenizedAllRuminantPenses: String
  }

  type Mutation {
     createRuminantPens(
      #farmerUUID: String!
      #farmerCompanyName: String!
      #farmAreaId: String!
      #farmProfileArea: String!

      #pensNo: String!
      #pensSystem: String!
      #pensCapacity: Int!
      tokenized: String!
     ): String!
      updateRuminantPens(
        #uuid: String!, 
        #farmerUUID: String
        #farmerCompanyName: String
        #farmAreaId: String
        #farmProfileArea: String

        #pensNo: String
        #pensSystem: String
        #pensCapacity: Int
        tokenized: String!
        ): String!
      deleteRuminantPens(
        #uuid: String!
        tokenized: String!
        ): String!

      exportRuminantPens: Buffer
  }
`;
