const PoultryHouse = `
  type PoultryHouse {
    id: String!
    uuid: String!
    FarmerProfile: FarmerProfile
    FarmLocation: FarmLocation

    farmerUUID: String!
    farmerCompanyName: String!

    farmAreaId: String!
    farmProfileArea: String
    
    houseNo: String!
    houseType: String!
    houseSystem: String!
    houseCapacity: Int!
    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [PoultryHouse];
exports.rootTypes = `
  type Query {
    allPoultryHouses: [PoultryHouse]
    poultryHouseByFarmerAndLocation(farmerUUID: String!, farmAreaId: String!): [PoultryHouse]
    tokenizedAllPoultryHouses: String
    tokenizedPoultryHouseByFarmerAndLocation(tokenizedParams: String!): String
  }

  type Mutation {
     createPoultryHouse(
      #farmerUUID: String!
      #farmerCompanyName: String!
      #farmAreaId: String!
      #farmProfileArea: String!

      #houseNo: String!
      #houseType: String!
      #houseSystem: String!
      #houseCapacity: Int!
      tokenized: String!
     ): String!
      updatePoultryHouse(
        #uuid: String!, 
        
        #farmerUUID: String
        #farmerCompanyName: String
        #farmAreaId: String
        #farmProfileArea: String

        #houseNo: String
        #houseType: String
        #houseSystem: String
        #houseCapacity: Int
        tokenized: String!
        ): String!
      deletePoultryHouse(
        #uuid: String!
        tokenized: String!
        ): String!

      exportPoultryHouse: Buffer
  }
`;
