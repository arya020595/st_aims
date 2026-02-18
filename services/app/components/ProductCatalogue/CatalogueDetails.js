import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../../components/App";
import { handleError } from "../../libs/errors";
import redirect from "../../libs/redirect";
import gql from "graphql-tag";
import {
  useMutation,
  useQuery,
  useApolloClient,
  ApolloProvider,
} from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminArea from "../../components/AdminArea";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import NumberFormat from "react-number-format";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries($tokenizedParamsCat: String!, $tokenizedParams: String!) {
    tokenizedAllProductCatalogueDetails(tokenizedParamsCat: $tokenizedParamsCat)

    tokenizedAllAgrifoodProductSubCategoriesByCategory(
      tokenizedParams: $tokenizedParams
    )

    tokenizedAllUnits
    countProductCatalogueDetails
  }
`;

const CREATE_PRODUCT_CATALOGUE_DETAIL = gql`
  mutation tokenizedCreateProductCatalogueDetails($tokenized: String!) {
    tokenizedCreateProductCatalogueDetails(tokenized: $tokenized)
  }
`;

const UPDATE_PRODUCT_CATALOGUE_DETAIL = gql`
  mutation tokenizedUpdateProductCatalogueDetails($tokenized: String!) {
    tokenizedUpdateProductCatalogueDetails(tokenized: $tokenized)
  }
`;
const DELETE_PRODUCT_CATALOGUE_DETAIL = gql`
  mutation tokenizedDeleteProductCatalogueDetails($tokenized: String!) {
    tokenizedDeleteProductCatalogueDetails(tokenized: $tokenized)
  }
`;

const EXPORT_PRODUCTION_CATALOGUE_DETAILS = gql`
  mutation exportsProductCatalogueDetails($productCatalogueUUID: String!) {
    exportsProductCatalogueDetails(productCatalogueUUID: $productCatalogueUUID)
  }
`;

const RESYNC_CODE = gql`
  mutation resyncProductCodeCatalogueDetails($productCatalogueUUID: String!) {
    resyncProductCodeCatalogueDetails(
      productCatalogueUUID: $productCatalogueUUID
    )
  }
`;

const CatalogueDetails = ({ currentUserDontHavePrivilege, currentUser }) => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    productCatalogueUUID: router.query.productCatalogueUUID,
    companyUUID: router.query.companyUUID,
    companyName: router.query.companyName,

    productCategoryUUID: router.query.productCategoryUUID,
    productCategory: router.query.productCategory,

    priceLists: [],
  });

  const [priceListsData, setPriceList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  // const [exportModalVisible, setExportModalVisible] = useState(false);
  const [showPriceListModalVisibe, setShowPriceListModalVisible] =
    useState(false);
  const notification = useNotification();

  const payloadParamsCat = {
    productCatalogueUUID: formData.productCatalogueUUID,
  };
  const tokenizedParamsCat = jwt.sign(payloadParamsCat, TOKENIZE);

  const payloadParams = {
    productCategoryUUID: formData.productCategoryUUID,
  };

  const tokenizedParams = jwt.sign(payloadParams, TOKENIZE);

  const { data, error, loading, refetch } = useQuery(QUERY, {
    variables: {
      tokenizedParams,
      tokenizedParamsCat,
    },
  });

  const [exportsProductCatalogueDetails] = useMutation(
    EXPORT_PRODUCTION_CATALOGUE_DETAILS
  );
  const [createProductCatalogueDetails] = useMutation(
    CREATE_PRODUCT_CATALOGUE_DETAIL
  );
  const [updateProductCatalogueDetails] = useMutation(
    UPDATE_PRODUCT_CATALOGUE_DETAIL
  );
  const [deleteProductCatalogueDetails] = useMutation(
    DELETE_PRODUCT_CATALOGUE_DETAIL
  );

  const [resyncProductCodeCatalogueDetails] = useMutation(RESYNC_CODE);

  const [allProductCatalogueDetails, setAllProductCatalogueDetails] = useState(
    []
  );
  const [
    allAgrifoodProductSubCategoriesByCategory,
    setAllAgrifoodProductSubCategoriesByCategory,
  ] = useState([]);
  const [allUnits, setAllUnits] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedProductCatalogueDetails =
        data?.tokenizedAllProductCatalogueDetails || "";
      let allProductCatalogueDetails = [];
      if (encryptedProductCatalogueDetails) {
        const decrypted = jwt.verify(
          encryptedProductCatalogueDetails,
          TOKENIZE
        );
        allProductCatalogueDetails = decrypted.queryResult;
        setAllProductCatalogueDetails(allProductCatalogueDetails);
      }

      const encryptedAgrifoodProductSubCategoriesByCategory =
        data?.tokenizedAllAgrifoodProductSubCategoriesByCategory || "";
      let allAgrifoodProductSubCategoriesByCategory = [];
      if (encryptedAgrifoodProductSubCategoriesByCategory) {
        const decrypted = jwt.verify(
          encryptedAgrifoodProductSubCategoriesByCategory,
          TOKENIZE
        );
        allAgrifoodProductSubCategoriesByCategory = decrypted.queryResult;
        setAllAgrifoodProductSubCategoriesByCategory(
          allAgrifoodProductSubCategoriesByCategory
        );
      }

      const encryptedUnits = data?.tokenizedAllUnits || "";
      let allUnits = [];
      if (encryptedUnits) {
        const decrypted = jwt.verify(encryptedUnits, TOKENIZE);
        allUnits = decrypted.queryResult;
        setAllUnits(allUnits);
      }
    }
  }, [data, loading, error]);

  // let allProductCatalogueDetails = [];
  // const encryptedProductCatalogueDetails =
  //   data?.tokenizedAllProductCatalogueDetails || "";
  // if (encryptedProductCatalogueDetails) {
  //   const decrypted = jwt.verify(encryptedProductCatalogueDetails, TOKENIZE);
  //   allProductCatalogueDetails = decrypted.queryResult;
  // }

  // let allAgrifoodProductSubCategoriesByCategory = [];
  // const encryptedAgrifoodProductSubCategoriesByCategory =
  //   data?.tokenizedAllAgrifoodProductSubCategoriesByCategory || "";
  // if (encryptedAgrifoodProductSubCategoriesByCategory) {
  //   const decrypted = jwt.verify(
  //     encryptedAgrifoodProductSubCategoriesByCategory,
  //     TOKENIZE
  //   );
  //   allAgrifoodProductSubCategoriesByCategory = decrypted.queryResult;
  // }

  // let allUnits = [];
  // const encryptedUnits = data?.tokenizedAllUnits || "";
  // if (encryptedUnits) {
  //   const decrypted = jwt.verify(encryptedUnits, TOKENIZE);
  //   allUnits = decrypted.queryResult;
  // }

  const countProductCatalogueDetails = data?.countProductCatalogueDetails || 0;

  const customUtilities = useMemo(() => [
    {
      label: "Edit",
      icon: <i className="fa fa-pencil" />,
      width: 400,

      render: (props) => {
        return (
          <div className="flex">
            <button
              onClick={(e) => {
                if (e) e.preventDefault();
                const found = allUnits.find(
                  (unit) => unit.name === props.row.original.unit
                );
                setModalVisible(true);
                setFormData({
                  productCatalogueUUID: router.query.productCatalogueUUID,
                  ...props.row.original,
                  unitUUID: found?.uuid || "",
                });
              }}
              className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-1 px-2 text-white focus:outline-none rounded-md shadow-lg"
            >
              <i className="fa fa-pencil-alt text-white" /> Edit
            </button>
          </div>
        );
      },
    },
  ]);

  const columns = useMemo(() => [
    {
      Header: "Product Image",
      accessor: "productImageUrl",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => (
        <img
          className="object-center object-contain transition duration-200 hover:opacity-50 h-24 w-auto"
          src={props.cell.value}
        />
      ),
    },
    {
      Header: "Product Code",
      accessor: "code",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Product Name",
      accessor: "name",
      style: {
        fontSize: 20,
        width: 200,
      },
    },
    {
      Header: "Sub-Categoy",
      accessor: "productSubCategory",
      style: {
        fontSize: 20,
        width: 200,
      },
    },
    {
      Header: "Net Weight",
      accessor: "weight",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "Unit",
      accessor: "unit",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Price Lists",
      accessor: "priceLists",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => (
        <div>
          <button
            className="bg-blue-500 w-full shadow-md py-2 text-white font-bold rounded-md"
            onClick={openPriceLists(props.value)}
          >
            {props.value.length}
          </button>
        </div>
      ),
    },
  ]);

  const openPriceLists = (lists) => (e) => {
    setShowPriceListModalVisible(true);
    setPriceList(lists);
  };
  return (
    <div>
      {/* <FormModal
        title={`Export Product Catalogue`}
        visible={exportModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setExportModalVisible(false);
          setFormData({
            priceLists: [],
            productCatalogueUUID: formData.productCatalogueUUID,
            productCategoryUUID: formData.productCategoryUUID,
          });
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setExportModalVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportsProductCatalogueDetails({
              variables: {
                productCatalogueUUID: formData.productCatalogueUUID,
                productSubCategoryUUID: formData.productSubCategoryUUID,
                unit: formData.unit,
              },
            });

            window.open(
              response.data.exportsProductCatalogueDetails,
              "__blank"
            );
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}
      >
        <div>
          <MonthAndYearsFilterWithExport
            label="Month Year Filter"
            defaultValue={dayjs().format("YYYY-MM")}
            disabled={true}
            // options={YEARS}
            // onSelect={(yearMonth) => {
            //   setYearMonth(yearMonth);
            // }}
            // exportConfig={{
            //   title: "Entrepreneur - Production And Sales",
            //   collectionName: "EntrepreneurProductionAndSaleses",
            //   filters: {
            //     yearMonth,
            //   },
            //   columns,
            // }}
          /> 
          <div className="form-group">
            <label>Product Sub Category</label>
            <select
              className="form-control"
              value={formData.productSubCategoryUUID || ""}
              onChange={(e) => {
                if (e) e.preventDefault();
                const found = allAgrifoodProductSubCategoriesByCategory.find(
                  (cat) => cat.uuid === e.target.value
                );
                setFormData({
                  ...formData,
                  productSubCategoryUUID: found?.uuid || "",
                });
              }}
            >
              <option value="" disabled>
                Product Sub Category
              </option>
              {allAgrifoodProductSubCategoriesByCategory.map((cat) => (
                <option value={cat.uuid}>{cat.subCategoryNameEnglish}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Unit</label>
            <select
              className="form-control"
              value={formData.unitUUID || ""}
              onChange={(e) => {
                if (e) e.preventDefault();
                const found = allUnits.find(
                  (cat) => cat.uuid === e.target.value
                );
                setFormData({
                  ...formData,
                  unitUUID: found?.uuid || "",
                  unit: found?.name,
                });
              }}
            >
              <option value="" disabled>
                Select Unit
              </option>
              {allUnits.map((unit) => (
                <option value={unit.uuid}>{unit.name}</option>
              ))}
            </select>
          </div>
        </div>
      </FormModal> */}
      <FormModal
        size={"sm"}
        title={"Price Lists"}
        visible={showPriceListModalVisibe}
        onCustomCloseBackDrop={true}
        onClose={(e) => {
          if (e) e.preventDefault();
          setShowPriceListModalVisible(false);
          setPriceList([]);
        }}
      >
        {priceListsData.map((list, index) => (
          <div className="form-group">
            <label>Price {index + 1}</label>
            <NumberFormat
              className="form-control bg-gray-100"
              placeholder="0"
              value={list.price || 0}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              decimalScale={4}
              disabled
            />
          </div>
        ))}
      </FormModal>
      <FormModal
        size={"xl"}
        title={`${!formData.uuid ? "New" : "Edit"} Product Catalogue`}
        visible={modalVisible}
        onCustomCloseBackDrop={true}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            productCatalogueUUID: formData.productCatalogueUUID,
            productCategoryUUID: formData.productCategoryUUID,

            priceLists: [],
          });
        }}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            const { uuid, __typename } = formData;
            if (!uuid) {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await createProductCatalogueDetails({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });
            } else {
              let { priceLists, ...data } = formData;
              priceLists = priceLists.map((price) => {
                let p = price;
                delete p.__typename;
                return p;
              });

              const tokenizedPayload = {
                ...data,
                priceLists,
              };

              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

              await updateProductCatalogueDetails({
                variables: {
                  tokenized,
                  // ...data,
                  // priceLists,
                },
              });
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Product Catalogue saved!`,
              level: "success",
            });

            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="form-group">
              <label>Product Code</label>
              <input
                className="form-control bg-gray-200"
                value={formData.code || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    code: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Product Name*</label>
              <input
                required
                className="form-control"
                value={formData.name || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Product Sub Category*</label>
              <select
                className="form-control"
                value={formData.productSubCategoryUUID || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  const found = allAgrifoodProductSubCategoriesByCategory.find(
                    (cat) => cat.uuid === e.target.value
                  );
                  setFormData({
                    ...formData,
                    productSubCategoryUUID: found?.uuid || "",
                    productSubCategory: found?.subCategoryNameEnglish || "",
                  });
                }}
                required
              >
                <option value="" disabled>
                  Product Sub Category
                </option>
                {allAgrifoodProductSubCategoriesByCategory.map((cat) => (
                  <option value={cat.uuid}>{cat.subCategoryNameEnglish}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Net Weight*</label>
              <NumberFormat
                className="form-control"
                value={formData.weight || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    weight: e.floatValue,
                  });
                }}
                required
              />
            </div>

            <div className="form-group">
              <label>Unit*</label>
              <select
                className="form-control"
                value={formData.unitUUID || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  const found = allUnits.find(
                    (cat) => cat.uuid === e.target.value
                  );
                  setFormData({
                    ...formData,
                    unitUUID: found?.uuid || "",
                    unit: found?.name || "",
                  });
                }}
                required
              >
                <option value="" disabled>
                  Select Unit
                </option>
                {allUnits.map((unit) => (
                  <option value={unit.uuid}>{unit.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Raw Material</label>
              <input
                className="form-control"
                value={formData.rawMaterial || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    rawMaterial: e.target.value,
                  });
                }}
              />
            </div>
          </div>
          <div>
            <div className="form-group mb-2">
              <label>Product Image</label>
              <input
                className="form-control"
                type="file"
                accept="image/jpg, image/jpeg"
                onChange={(e) => {
                  if (e) e.preventDefault();
                  const file = e.target.files[0];

                  if (file.size > 1024 * (1024 * 2)) {
                    return notification.handleError({
                      message: "Maximum allowed image size is 2MB!",
                    });
                  }

                  let reader = new FileReader();
                  reader.onloadend = async () => {
                    setFormData({
                      ...formData,
                      productImageUrl: reader.result,
                    });
                    // console.log(reader)
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </div>

            <img
              class="object-cover h-auto w-auto"
              src={formData.productImageUrl}
            />

            <div className="form-group">
              <label>SKU</label>
              <input
                className="form-control"
                value={formData.sku || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    sku: e.target.value,
                  });
                }}
              />
            </div>
          </div>
        </div>
        <hr className="bg-gray-200 h-1 mb-2" />
        <div className="grid grid-cols-4 gap-1 mb-2">
          {formData.priceLists.map((list, index) => (
            <div className="grid grid-cols-5 gap-1">
              <div className="col-span-4">
                <div className="form-group">
                  <label>Price {index + 1}</label>
                  <NumberFormat
                    className="form-control"
                    placeholder="0"
                    value={list.price || 0}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    fixedDecimalScale={true}
                    decimalScale={4}
                    onValueChange={(e) => {
                      // if (e) e.preventDefault();
                      setFormData({
                        ...formData,
                        priceLists: formData.priceLists.map((pr) =>
                          pr.uuid !== list.uuid
                            ? pr
                            : {
                                ...pr,
                                price: e.floatValue,
                              }
                        ),
                      });
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-start items-center pt-6 col-span-1">
                <div
                  className="text-xl font-bold text-red-500 cursor-pointer"
                  onClick={(e) => {
                    if (e) e.preventDefault();
                    setFormData({
                      ...formData,
                      priceLists: formData.priceLists.filter(
                        (pr) => pr.uuid !== list.uuid
                      ),
                    });
                  }}
                >
                  <i className="fa fa-times" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="w-full bg-mantis-500 text-sm text-white font-bold px-2 py-2 rounded-md shadow-md"
          onClick={(e) => {
            if (e) e.preventDefault();
            setFormData({
              ...formData,
              priceLists: [
                ...formData.priceLists,
                {
                  uuid: uuidv4(),
                  price: 0,
                },
              ],
            });
          }}
        >
          <i className="fa fa-plus" /> Add Prices
        </button>
      </FormModal>
      <div className="mt-4 pr-0 md:pr-10 py-4 h-full">
        <div className="flex mb-2">
          <p className="text-md">Company Name : </p>
          <p className="text-md font-bold mx-2 text-mantis-600">
            {router.query.companyName}
          </p>
        </div>
        <div className="flex mb-2">
          <p className="text-md">Company Registration : </p>
          <p className="text-md font-bold mx-2 text-mantis-600">
            {router.query.companyRegNo}
          </p>
        </div>
        <div className="flex mb-2">
          <p className="text-md">Product Category : </p>
          <p className="text-md font-bold mx-2 text-mantis-600">
            {router.query.productCategory}
          </p>
        </div>
        <Table
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 mr-5 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  // setExportModalVisible(true);
                  showLoadingSpinner();
                  try {
                    const response = await exportsProductCatalogueDetails({
                      variables: {
                        productCatalogueUUID: formData.productCatalogueUUID,
                      },
                    });
                    const base64Response = response.data.exportsProductCatalogueDetails;
                    const byteCharacters = atob(base64Response);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], {
                      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    });
        
                    // Create download URL and trigger download
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "product_catalogue_details.xlsx";
                    link.click();
                    window.URL.revokeObjectURL(url);
        

                    // window.open(
                    //   response.data.exportsProductCatalogueDetails,
                    //   "__blank"
                    // );
                  } catch (err) {
                    notification.handleError(err);
                  }
                  hideLoadingSpinner();
                }}
              >
                Export Excel
              </button>
              <button
                className="bg-yellow-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  showLoadingSpinner();
                  try {
                    await resyncProductCodeCatalogueDetails({
                      variables: {
                        productCatalogueUUID: formData.productCatalogueUUID,
                      },
                    });

                    await refetch();
                  } catch (err) {
                    notification.handleError(err);
                  }
                  hideLoadingSpinner();
                }}
              >
                Resync Code
              </button>
            </div>
          }
          loading={loading}
          columns={columns}
          data={allProductCatalogueDetails}
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege(["Product Catalogue Details:Create"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege(["Product Catalogue Details:Create"])
              ? () => {
                  let startCode = router.query.catalogueCode + "000";
                  const catalogueDetailsLength = String(
                    allProductCatalogueDetails.length + 1
                  );

                  if (allProductCatalogueDetails.length < 1) {
                    startCode = router.query.catalogueCode + "001";
                  } else {
                    startCode =
                      startCode.slice(0, -catalogueDetailsLength.length) +
                      (allProductCatalogueDetails.length + 1);
                  }

                  setFormData({
                    productCatalogueUUID: router.query.productCatalogueUUID,
                    companyUUID: router.query.companyUUID,
                    companyName: router.query.companyName,

                    productCategoryUUID: router.query.productCategoryUUID,
                    productCategory: router.query.productCategory,

                    code: startCode,
                    priceLists: [],
                  });
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Product Catalogue Details:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} catalogues?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteProductCatalogueDetails({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} catalogues deleted`,
                        level: "success",
                      });
                      await refetch();
                    }
                  } catch (err) {
                    handleError(err);
                  }
                  hideLoadingSpinner();
                  refetch();
                }
              : null
          }
        />
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(CatalogueDetails);
