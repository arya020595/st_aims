const FarmLocation = `
   scalar JSON

   type FarmLocation {
      id: String!
      uuid: String!
      farmName: String     
      farmCategory: String
      district: String!
      mukim: String!        
      village: String!
      area: String      

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [FarmLocation];
exports.rootTypes = `
   type Query {
      allFarmLocations: [FarmLocation]
      tokenizedAllFarmLocation: String 
   }

   type Mutation {
      createFarmLocation(
        #district: String!
        #mukim: String!        
        #village: String!      
        #area: String
        tokenized: String!
      ): String!
      updateFarmLocation(
        #uuid: String!
        #district: String
        #mukim: String        
        #village: String      
        #area: String
        tokenized: String!
      ): String!
      deleteFarmLocation(
         #uuid: String!
         tokenized: String!
         ): String!
 
      exportFarmLocation: Buffer
   }
`;
