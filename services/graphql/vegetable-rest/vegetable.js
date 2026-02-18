const { NOT_DELETED_DOCUMENT_QUERY } = require("../data-loader");
const lodash = require("lodash");
const vegetableMasterData = async ({ context, request }) => {
  let queryResult = await context.prisma.cropsVegetable.findMany({
    where: {
      ...NOT_DELETED_DOCUMENT_QUERY,
    },
    orderBy: {
      id: "desc",
    },
  });

  queryResult = queryResult.map((q) => {
    let id = BigInt(q.id);
    return {
      ...q,
      id: id.toString(),
    };
  });

  let cropsCategoryUUIDs = queryResult
    .filter((q) => q.cropsCategoryUUID)
    .map((q) => q.cropsCategoryUUID);
  cropsCategoryUUIDs = lodash.uniq(cropsCategoryUUIDs);

  const cropsCategory = await context.prisma.cropsCategory.findMany({
    where: {
      uuid: {
        in: cropsCategoryUUIDs,
      },
      ...NOT_DELETED_DOCUMENT_QUERY,
    },
  });
  const indexedLCropsCategory = cropsCategory.reduce((all, cat) => {
    if (!all[cat.uuid]) {
      all[cat.uuid] = {};
    }
    all[cat.uuid] = {
      ...cat,
      id: cat.id.toString(),
    };
    return all;
  }, {});

  queryResult = queryResult.map((q) => {
    return {
      ...q,
      CropsCategory: indexedLCropsCategory[q.cropsCategoryUUID]
        ? indexedLCropsCategory[q.cropsCategoryUUID]
        : {},
    };
  });

  return queryResult;
};
exports.vegetableMasterData = vegetableMasterData;
