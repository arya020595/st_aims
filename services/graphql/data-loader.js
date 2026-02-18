const DataLoader = require("dataloader");
const sort = require("dataloader-sort").default;

const batchCollection = async (
  collection,
  collectionName,
  keys,
  additionalFilter
) => {
  let results = await collection(collectionName)
    .find({ _id: { $in: keys }, ...additionalFilter })
    .toArray();
  return sort(keys, results, "_id");
};

// ############################################################################################################
// ################################################################################################
// ####################################################################################
// ########################################################################

exports.createLoaders = (collection) => ({
  // Cashes: new DataLoader(
  //   keys => batchCollection(collection, "Cashes", keys, {}),
  //   {
  //     // cacheKeyFn: key => key.toString(),
  //     cache: false
  //   }
  // ),
});

// ############################################################################################################
// ################################################################################################
// ####################################################################################
// ########################################################################

// exports.NOT_DELETED_DOCUMENT_QUERY = {
//     $or: [{ _deletedAt: null }, { _deletedAt: { $exists: false } }]
// };
exports.NOT_DELETED_DOCUMENT_QUERY = {
  // _deletedAt: null,
  // _deletedAt: { $exists: false }
  deletedAt: "",
};
