const AnimalFeed = `
   type AnimalFeed {
      id: String!
      uuid: String!

      supplierId: String!
      livestockId: String!
      
      Livestock: Livestock!
      Supplier: LivestockSupplier
      
      category: String
      code: String
      description: String
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [AnimalFeed];
exports.rootTypes = `
   type Query {
      allAnimalFeeds: [AnimalFeed]
      allAnimalFeedBySupplierId(supplierId: String!): [AnimalFeed]
      tokenizedAllAnimalFeeds: String
      tokenizedAllAnimalFeedBySupplierId(tokenizedParams: String!): String
   }

   type Mutation {
      createAnimalFeed(
         #livestockId: String!
         #supplierId: String!
         #category: String
         #code: String
         #description: String
         tokenized: String!
      ): String!

      updateAnimalFeed(
         #uuid: String!
         #livestockId: String
         #supplierId: String
         #category: String
         #code: String
         #description: String
         tokenized: String!
      ): String!

      deleteAnimalFeed(
         #uuid: String!
         tokenized: String!
      ): String!

      exportAnimalFeed: Buffer
   }
`;
