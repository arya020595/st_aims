const RuminantProduction = `
  type RuminantProduction {
    id: String!
    uuid: String!
    date: String!
    farmerCompanyName: String!
    farmerUUID: String!

    farmAreaId: String!
    farmProfileArea: String!

    district: String!

    kerbauLocalJual: Int
    kerbauLocalSembelih: Int
    kerbauLocalQurban: Int
    kerbauImportJual: Int
    kerbauImportSembelih: Int
    kerbauImportQurban: Int

    lembuLocalJual: Int
    lembuLocalSembelih: Int
    lembuLocalQurban: Int
    lembuImportJual: Int
    lembuImportSembelih: Int
    lembuImportQurban: Int

    biriLocalJual: Int
    biriLocalSembelih: Int
    biriLocalQurban: Int
    biriImportJual: Int
    biriImportSembelih: Int
    biriImportQurban: Int

    rusaLocalJual: Int
    rusaLocalSembelih: Int
    rusaLocalQurban: Int
    rusaImportJual: Int
    rusaImportSembelih: Int
    rusaImportQurban: Int
    
    kambingLocalJual: Int
    kambingLocalSembelih: Int
    kambingLocalQurban: Int
    kambingImportJual: Int
    kambingImportSembelih: Int
    kambingImportQurban: Int

    total: Int

    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [RuminantProduction];
exports.rootTypes = `
  type Query {
    allRuminantProductions(monthYear: String!): [RuminantProduction]
    tokenizedAllRuminantProductions(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
      ): String!
    countAllRuminantProductions(monthYear: String!, filters: String): Int!
  }

  type Mutation {
    createRuminantProduction(
      date: String!
      farmerCompanyName: String!
      farmerUUID: String!

      farmAreaId: String!
      farmProfileArea: String!
      district: String!

      kerbauLocalJual: Int
      kerbauLocalSembelih: Int
      kerbauLocalQurban: Int
      kerbauImportJual: Int
      kerbauImportSembelih: Int
      kerbauImportQurban: Int

      lembuLocalJual: Int
      lembuLocalSembelih: Int
      lembuLocalQurban: Int
      lembuImportJual: Int
      lembuImportSembelih: Int
      lembuImportQurban: Int

      biriLocalJual: Int
      biriLocalSembelih: Int
      biriLocalQurban: Int
      biriImportJual: Int
      biriImportSembelih: Int
      biriImportQurban: Int

      rusaLocalJual: Int
      rusaLocalSembelih: Int
      rusaLocalQurban: Int
      rusaImportJual: Int
      rusaImportSembelih: Int
      rusaImportQurban: Int

      kambingLocalJual: Int
      kambingLocalSembelih: Int
      kambingLocalQurban: Int
      kambingImportJual: Int
      kambingImportSembelih: Int
      kambingImportQurban: Int
      
      total: Int
    ): String!

    updateRuminantProduction(
      uuid: String!
      date: String
      farmerCompanyName: String
      farmerUUID: String

      farmAreaId: String
      farmProfileArea: String
      district: String

      kerbauLocalJual: Int
      kerbauLocalSembelih: Int
      kerbauLocalQurban: Int
      kerbauImportJual: Int
      kerbauImportSembelih: Int
      kerbauImportQurban: Int

      lembuLocalJual: Int
      lembuLocalSembelih: Int
      lembuLocalQurban: Int
      lembuImportJual: Int
      lembuImportSembelih: Int
      lembuImportQurban: Int

      biriLocalJual: Int
      biriLocalSembelih: Int
      biriLocalQurban: Int
      biriImportJual: Int
      biriImportSembelih: Int
      biriImportQurban: Int

      rusaLocalJual: Int
      rusaLocalSembelih: Int
      rusaLocalQurban: Int
      rusaImportJual: Int
      rusaImportSembelih: Int
      rusaImportQurban: Int
      
      kambingLocalJual: Int
      kambingLocalSembelih: Int
      kambingLocalQurban: Int
      kambingImportJual: Int
      kambingImportSembelih: Int
      kambingImportQurban: Int
      total: Int
    ): String!

    deleteRuminantProduction(
      uuid: String!
    ): String!

    exportRuminantProductionExcel(
      monthYear: String!
      farmerUUID: String
      farmAreaId: String
      district: String
    ): String

    tokenizedCreateRuminantProduction(tokenized: String!): String!
    tokenizedUpdateRuminantProduction(tokenized: String!): String!
    tokenizedDeleteRuminantProduction(tokenized: String!): String!

  }
`;
