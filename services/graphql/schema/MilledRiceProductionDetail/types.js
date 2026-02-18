const MilledRiceProductionDetail = `
  type MilledRiceProductionDetail {
    id: String!
    uuid: String!  
    date: String

    ByProduct: CropsPaddyByProduct
    
    weight: Float
    price: Float
    totalValue: Float
  
    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [MilledRiceProductionDetail];
exports.rootTypes = `
  type Query {
    allMilledRiceProductionDetailsByProductionUUID(
      milledRiceProductionUUID: String!
    ): [MilledRiceProductionDetail] 
  }

  type Mutation {
    createMilledRiceProductionDetail(       
      date: String
      milledRiceProductionUUID: String!
      cropsPaddyByProductUUID: String

      weight: Float
      price: Float
      totalValue: Float
      
    ): String!
    updateMilledRiceProductionDetail(
      uuid: String!
      date: String
      milledRiceProductionUUID: String
      cropsPaddyByProductUUID: String
      
      weight: Float
      price: Float
      totalValue: Float
      
    ): String!
    deleteMilledRiceProductionDetail(uuid: String!): String!
 }
`;
