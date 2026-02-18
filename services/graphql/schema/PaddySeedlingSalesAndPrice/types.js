const PaddySeedlingSalesAndPrice = `
  type PaddySeedlingSalesAndPrice {
    id: String!
    uuid: String!
    date: String!

    FarmerProfile: FarmerProfile
    FarmProfile: FarmProfile
    Paddy: CropsPaddyVariety
    
    noOfFarmers: Float
    noOfOrders: Float
    totalTraysProduced: Float
    totalTraysSold: Float
    priceTrays: Float    
    totalTraysCompensated: Float
    remindingOfSeedlings: Float
    remarks: String

    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [PaddySeedlingSalesAndPrice];
exports.rootTypes = `
  type Query {
    allPaddySeedlingSalesAndPrices(monthYear: String): [PaddySeedlingSalesAndPrice]
    tokenizedAllPaddySeedlingSalesAndPrices(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
    ): String! 
    countAllPaddySeedlingSalesAndPrices(monthYear: String!, filters: String): Int!
  }

  type Mutation {
    createPaddySeedlingSalesAndPrice(       
      date: String!

      farmerUUID: String!
      farmAreaId: String!

      cropsPaddyVarietyUUID: String
      
      noOfFarmers: Float
      noOfOrders: Float
      totalTraysProduced: Float
      totalTraysSold: Float
      priceTrays: Float    

      totalTraysCompensated: Float
      remindingOfSeedlings: Float
      remarks: String

    ): String!
    updatePaddySeedlingSalesAndPrice(
      uuid: String!
      date: String!

      farmerUUID: String
      farmAreaId: String
      
      cropsPaddyVarietyUUID: String
      
      noOfFarmers: Float
      noOfOrders: Float
      totalTraysProduced: Float
      totalTraysSold: Float
      priceTrays: Float    


      totalTraysCompensated: Float
      remindingOfSeedlings: Float
      remarks: String
      
    ): String!
    deletePaddySeedlingSalesAndPrice(uuid: String!): String!
    exportPaddySeedlingSalesPrice(
      monthYear: String!
      farmerUUID: String
      farmAreaId: String
      cropsPaddyVarietyUUID: String
    ): String

    tokenizedCreatePaddySeedlingSalesAndPrice(tokenized: String!): String!
    tokenizedUpdatePaddySeedlingSalesAndPrice(tokenized: String!): String!
    tokenizedDeletePaddySeedlingSalesAndPrice(tokenized: String!): String!
 }
`;
