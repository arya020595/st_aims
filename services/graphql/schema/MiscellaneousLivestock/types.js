const MiscellaneousLivestock = `
  type MiscellaneousLivestock {
    id: String!
    uuid: String!
    monthYear: String!
    farmerUUID: String!
    farmerCompanyName: String!

    farmAreaId: String!
    farmProfileArea: String
    district: String!
    mukim: String!

    totalAyamKampungBirds: Int
    totalAyamKampungEggs: Int
    totalItikBirds: Int
    totalItikEggs: Int
    totalPuyuhBirds: Int
    totalPuyuhEggs: Int
    totalPatuBirds: Int
    totalPatuEggs: Int
    totalAngsaBirds: Int
    totalAngsaEggs: Int


    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [MiscellaneousLivestock];
exports.rootTypes = `
  type Query {
    allMiscellaneousLivestocks(monthYear: String): [MiscellaneousLivestock]
    tokenizedAllMiscellaneousLivestocks(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
    ): String!
    countMiscellaneousLivestocks(monthYear: String!, filters: String): Int!
  }

  type Mutation {
     createMiscellaneousLivestock(
      monthYear: String!
      monthYear: String!
      farmerUUID: String!
      farmerCompanyName: String!

      farmAreaId: String!
      farmProfileArea: String
      district: String!
      mukim: String!

      totalAyamKampungBirds: Int
      totalAyamKampungEggs: Int
      totalItikBirds: Int
      totalItikEggs: Int
      totalPuyuhBirds: Int
      totalPuyuhEggs: Int
      totalPatuBirds: Int
      totalPatuEggs: Int
      totalAngsaBirds: Int
      totalAngsaEggs: Int
      

     ): String!
      updateMiscellaneousLivestock(
        uuid: String!,
        monthYear: String
        farmerUUID: String
        farmerCompanyName: String

        farmAreaId: String
        farmProfileArea: String
        district: String
        mukim: String

        totalAyamKampungBirds: Int
        totalAyamKampungEggs: Int
        totalItikBirds: Int
        totalItikEggs: Int
        totalPuyuhBirds: Int
        totalPuyuhEggs: Int
        totalPatuBirds: Int
        totalPatuEggs: Int
        totalAngsaBirds: Int
        totalAngsaEggs: Int

        ): String!
      deleteMiscellaneousLivestock(uuid: String!): String!

      exportMiscellaneousLivestock(
        monthYear: String!
        farmerUUID: String
        farmAreaId: String
        district: String
        mukim: String
      ): String!

      tokenizedCreateMiscellaneousLivestock(tokenized: String!): String!
      tokenizedUpdateMiscellaneousLivestock(tokenized: String!): String!
      tokenizedDeleteMiscellaneousLivestock(tokenized: String!): String!
  }
`;
