const FertilizedEgg = `
  type FertilizedEgg {
    id: String!
    uuid: String!
    monthYear: String!
    farmerUUID: String!
    farmerCompanyName: String!

    farmAreaId: String!
    farmProfileArea: String
    noOfBreeder: Int!
    noOfFertilizedEggs: Int!

    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [FertilizedEgg];
exports.rootTypes = `
  type Query {
    allFertilizedEggs(monthYear: String): [FertilizedEgg]
    tokenizedAllFertilizedEggs(
      monthYear: String!
      pageIndex: Int
      pageSize: Int 
      filters: String
    ): String!
    countAllFertilizedEggs(monthYear: String!, filters: String): Int!
  }

  type Mutation {
     createFertilizedEgg(
      monthYear: String!
      monthYear: String!
      farmerUUID: String!
      farmerCompanyName: String!

      farmAreaId: String!
      farmProfileArea: String
      noOfBreeder: Int!
      noOfFertilizedEggs: Int!
      

     ): String!
      updateFertilizedEgg(
        uuid: String!,
        monthYear: String
        farmerUUID: String
        farmerCompanyName: String

        farmAreaId: String
        farmProfileArea: String
        noOfBreeder: Int
        noOfFertilizedEggs: Int
        

        ): String!
      deleteFertilizedEgg(uuid: String!): String!
      exportFertilizedEgg(
        monthYear: String!
        farmerUUID: String
        farmAreaId: String
        ): String!
      
      tokenizedCreateFertilizedEgg(tokenized: String!): String!
      tokenizedUpdateFertilizedEgg(tokenized: String!): String!
      tokenizedDeleteFertilizedEgg(tokenized: String!): String!
  }
`;
