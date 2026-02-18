const FoodSampling = `
   type FoodSampling {
      id: String!
      uuid: String!
      companyUUID: String
      companyName: String
    
      sampleName: String
      netWeight: Float
      
      Condition: Condition
      sampleReferenceNo: String
      typeOfSampling: String
    
      typeOfAnalysisIds: [String]
      testIds: [String]
    
      samplingDate: String
      collectedBy: String
      purpose: String
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [FoodSampling];
exports.rootTypes = `
   type Query {
      allFoodSamplings(
         startDate: String
         endDate: String
      ): [FoodSampling]
      tokenizedAllFoodSamplings(
         startDate: String
         endDate: String
         pageIndex: Int
         pageSize: Int
         filters: String
         ): String!
      countFoodSamplings(
         startDate: String
         endDate: String
         filters: String
      ): Int!
   }

   type Mutation {
      createFoodSampling(
        companyUUID: String
        companyName: String
      
        sampleName: String
        netWeight: Float
      
        conditionUUID: String
        sampleReferenceNo: String
        typeOfSampling: String
      
        typeOfAnalysisIds: [String]
        testIds: [String]
      
        samplingDate: String
        collectedBy: String
        purpose: String
      ): String!

      updateFoodSampling(
        uuid: String!
        companyUUID: String
        companyName: String
      
        sampleName: String
        
        conditionUUID: String
        sampleReferenceNo: String
        typeOfSampling: String
      
        typeOfAnalysisIds: [String]
        testIds: [String]
      
        samplingDate: String
        collectedBy: String
        purpose: String
      ): String!

      deleteFoodSampling(
         uuid: String!
      ): String

      exportFoodSampling(
         startDate: String
         endDate: String
         companyUUID: String
         sampleName: String
         typeOfAnalysisIds: [String]
      ): String

      tokenizedCreateFoodSampling(tokenized: String!): String!
      tokenizedUpdateFoodSampling(tokenized: String!): String!
      tokenizedDeleteFoodSampling(tokenized: String!): String!
   }
`;
