import React, { useState, useEffect, useMemo, useCallback } from "react";
import { withApollo } from "../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../components/App";
import { useNotification } from "../components/Notification";
import { handleError } from "../libs/errors";
import AdminArea from "../components/AdminArea";
import TableAsync from "../components/TableAsync";
import {
  useQuery,
  useLazyQuery,
  useMutation,
  useApolloClient,
} from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { FormModal } from "../components/Modal";
import { useRouter } from "next/router";
import { v4 as uuidv4 } from "uuid";
import NumberFormat from "react-number-format";
import { useCurrentUser } from "../components/AdminArea";
import Select from "react-select";
import dayjs from "dayjs";
import AsyncSelect from "react-select/async";
import { MonthAndYearsFilterWithExport } from "../components/MonthAndYearsFilterWithExport";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries(
    $tokenizedParams: String!
    $monthYear: String!
    $filters: String
  ) {
    tokenizedAllAgrifoodProductCategoriesByCompanyId(
      tokenizedParams: $tokenizedParams
    )
    countAllAgrifoodProductions(monthYear: $monthYear, filters: $filters)
  }
`;

const MASTER_DATA_QUERY = gql`
  query msterDataQuery {
    tokenizedAllAgrifoodProductCategories

    tokenizedAllAgrifoodProductSubCategories

    tokenizedAllAgrifoodPremiseProfiles
  }
`;

const AGRIFOOD_PRODUCTION_QUERY = gql`
  query tokenizedAllAgrifoodProductionsPaginated(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllAgrifoodProductionsPaginated(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllAgrifoodProductions(monthYear: $monthYear, filters: $filters)
  }
`;

const AGRIFOOD_PRODUCTION_CATALOGUE_QUERY = gql`
  query tokenizedAllProductCatalogues {
    tokenizedAllProductCatalogues
  }
`;

const SEARCH_COMPANY = gql`
  query searchAllAgrifoodCompanyProfiles($name: String) {
    searchAllAgrifoodCompanyProfiles(name: $name)
  }
`;

const PRODUCT_QUERY = gql`
  query productCatalogueDetailsWithFilters(
    $companyUUID: String
    $productCategoryUUID: String
    $productSubCategoryUUID: String
  ) {
    productCatalogueDetailsWithFilters(
      filter: {
        companyUUID: $companyUUID
        productCategoryUUID: $productCategoryUUID
        productSubCategoryUUID: $productSubCategoryUUID
      }
    ) {
      id
      uuid
      name
      code
      weight

      productCatalogueUUID
      unitUUD
      unit

      priceLists {
        uuid
        price
      }
    }
  }
`;

const CREATE_PRODUCTION = gql`
  mutation tokenizedCreateAgrifoodProduction($tokenized: String!) {
    tokenizedCreateAgrifoodProduction(tokenized: $tokenized)
  }
`;

const UPDATE_PRODUCTION = gql`
  mutation tokenizedUpdateAgrifoodProduction($tokenized: String!) {
    tokenizedUpdateAgrifoodProduction(tokenized: $tokenized)
  }
`;

const DELETE_PRODUCTION = gql`
  mutation tokenizedDeleteAgrifoodProduction($tokenized: String!) {
    tokenizedDeleteAgrifoodProduction(tokenized: $tokenized)
  }
`;

const EXPORT_PRODUCTION = gql`
  mutation exportAgrifoodProduction(
    $monthYear: String!
    $companyUUID: String
    $productCategoryUUID: String
    $productSubCategoryUUID: String
    $productName: String
  ) {
    exportAgrifoodProduction(
      monthYear: $monthYear
      companyUUID: $companyUUID
      productCategoryUUID: $productCategoryUUID
      productSubCategoryUUID: $productSubCategoryUUID
      productName: $productName
    )
  }
`;

const page = () => {
  const router = useRouter();
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const client = useApolloClient();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const [formData, setFormData] = useState({
    records: [],
  });
  const [filterCriteria, setFilterCriteria] = useState({});
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportFormData, setExportFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const [selectedSubCategory, setSelectedSubCategory] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const notification = useNotification();

  const tokenizedPayload = {
    companyUUID: formData.companyUUID || "",
  };
  const tokenizedParams = jwt.sign(tokenizedPayload, TOKENIZE);
  const { data, error, loading, refetch } = useQuery(QUERY, {
    variables: {
      tokenizedParams,
      monthYear: yearMonth,
      filters: router.query.filters,
    },
  });
  const [createAgrifoodProduction] = useMutation(CREATE_PRODUCTION);
  const [updateAgrifoodProduction] = useMutation(UPDATE_PRODUCTION);
  const [deleteAgrifoodProduction] = useMutation(DELETE_PRODUCTION);
  const [exportAgrifoodProduction] = useMutation(EXPORT_PRODUCTION);

  const [allAgrifoodProductions, setAllAgrifoodProductions] = useState([]);
  const [allAgrifoodCompanyProfiles, setAllAgrifoodCompanyProfiles] = useState(
    []
  );
  const [allAgrifoodPremiseProfile, setAllAgrifoodPremiseProfile] = useState(
    []
  );
  const [allAgrifoodProductCategories, setAllAgrifoodProductCategories] =
    useState([]);
  const [allAgrifoodProductSubCategories, setAllAgrifoodProductSubCategories] =
    useState([]);
  const [
    allAgrifoodProductCategoriesByCompanyIds,
    setAllAgrifoodProductCategoriesByCompanyIds,
  ] = useState([]);
  let [savedCount, setSavedCount] = useState(0);

  let [countAllAgrifoodProductions, setCountAllAgrifoodProduction] =
    useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countAllAgrifoodProductions) return 1;
    return Math.ceil(countAllAgrifoodProductions / pageSize);
  }, [countAllAgrifoodProductions, pageSize]);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedAgrifoodProductions =
      //   data?.tokenizedAllAgrifoodProductions || "";
      // let allAgrifoodProductions = [];
      // if (encryptedAgrifoodProductions) {
      //   const decrypted = jwt.verify(encryptedAgrifoodProductions, TOKENIZE);
      //   allAgrifoodProductions = decrypted.queryResult;
      //   setAllAgrifoodProductions(allAgrifoodProductions);
      // }

      // const encryptedAgrifoodCompanyProfiles = data?.tokenizedAllAgrifoodCompanyProfiles || "";
      // let allAgrifoodCompanyProfiles = [];
      // if (encryptedAgrifoodCompanyProfiles) {
      //   const decrypted = jwt.verify(encryptedAgrifoodCompanyProfiles, TOKENIZE);
      //   allAgrifoodCompanyProfiles = decrypted.queryResult;
      //   setAllAgrifoodCompanyProfiles(allAgrifoodCompanyProfiles);
      // }

      // const encryptedAgrifoodPremiseProfiles = data?.tokenizedAllAgrifoodPremiseProfiles || "";
      // let allAgrifoodPremiseProfiles = [];
      // if (encryptedAgrifoodPremiseProfiles) {
      //   const decrypted = jwt.verify(encryptedAgrifoodPremiseProfiles, TOKENIZE);
      //   allAgrifoodPremiseProfiles = decrypted.queryResult;
      //   setAllAgrifoodPremiseProfile(allAgrifoodPremiseProfiles);
      // }

      // const encryptedAgrifoodProductCategories = data?.tokenizedAllAgrifoodProductCategories || "";
      // let allAgrifoodProductCategories = [];
      // if (encryptedAgrifoodProductCategories) {
      //   const decrypted = jwt.verify(encryptedAgrifoodProductCategories, TOKENIZE);
      //   allAgrifoodProductCategories = decrypted.queryResult;
      //   setAllAgrifoodProductCategories(allAgrifoodProductCategories);
      // }

      // const encryptedAgrifoodProductSubCategories = data?.tokenizedAllAgrifoodProductSubCategories || "";
      // let allAgrifoodProductSubCategories = [];
      // if (encryptedAgrifoodProductSubCategories) {
      //   const decrypted = jwt.verify(encryptedAgrifoodProductSubCategories, TOKENIZE);
      //   allAgrifoodProductSubCategories = decrypted.queryResult;
      //   setAllAgrifoodProductSubCategories(allAgrifoodProductSubCategories);
      // }

      const encryptedAgrifoodProductCategoriesByCompanyId =
        data?.tokenizedAllAgrifoodProductCategoriesByCompanyId || "";
      let allAgrifoodProductCategoriesByCompanyId = [];
      if (encryptedAgrifoodProductCategoriesByCompanyId) {
        const decrypted = jwt.verify(
          encryptedAgrifoodProductCategoriesByCompanyId,
          TOKENIZE
        );
        allAgrifoodProductCategoriesByCompanyId = decrypted.foundCategories;
        // console.log(allAgrifoodProductCategoriesByCompanyId);
        setAllAgrifoodProductCategoriesByCompanyIds(
          allAgrifoodProductCategoriesByCompanyId
        );
      }
      const countData = data?.countAllAgrifoodProductions || 0;
      setCountAllAgrifoodProduction(countData);
    }
  }, [data, loading, error, savedCount]);

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: MASTER_DATA_QUERY,
      // variables: {
      // },
      fetchPolicy: "no-cache",
    });

    const encryptedAgrifoodPremiseProfiles =
      result.data?.tokenizedAllAgrifoodPremiseProfiles || "";
    let allAgrifoodPremiseProfiles = [];
    if (encryptedAgrifoodPremiseProfiles) {
      const decrypted = jwt.verify(encryptedAgrifoodPremiseProfiles, TOKENIZE);
      allAgrifoodPremiseProfiles = decrypted.queryResult;
      setAllAgrifoodPremiseProfile(allAgrifoodPremiseProfiles);
    }

    const encryptedAgrifoodProductCategories =
      result.data?.tokenizedAllAgrifoodProductCategories || "";
    let allAgrifoodProductCategories = [];
    if (encryptedAgrifoodProductCategories) {
      const decrypted = jwt.verify(
        encryptedAgrifoodProductCategories,
        TOKENIZE
      );
      allAgrifoodProductCategories = decrypted.queryResult;
      setAllAgrifoodProductCategories(allAgrifoodProductCategories);
    }

    const encryptedAgrifoodProductSubCategories =
      result.data?.tokenizedAllAgrifoodProductSubCategories || "";
    let allAgrifoodProductSubCategories = [];
    if (encryptedAgrifoodProductSubCategories) {
      const decrypted = jwt.verify(
        encryptedAgrifoodProductSubCategories,
        TOKENIZE
      );
      allAgrifoodProductSubCategories = decrypted.queryResult;
      setAllAgrifoodProductSubCategories(allAgrifoodProductSubCategories);
    }

    hideLoadingSpinner();
  }, []);

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: AGRIFOOD_PRODUCTION_QUERY,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedAgrifoodProductions =
      result.data?.tokenizedAllAgrifoodProductionsPaginated || "";
    let allAgrifoodProductions = [];
    if (encryptedAgrifoodProductions) {
      const decrypted = jwt.verify(encryptedAgrifoodProductions, TOKENIZE);
      allAgrifoodProductions = decrypted.queryResult;
      setAllAgrifoodProductions(allAgrifoodProductions);
    }
    const countData = result.data?.countAllAgrifoodProductions || 0;
    setCountAllAgrifoodProduction(countData);
    hideLoadingSpinner();
  }, [savedCount, yearMonth, pageSize, pageIndex, router.query.filters]);

  const handlePageChange = useCallback(
    async ({ pageIndex, pageSize, filters }) => {
      // const ym = router.query.yearMonth || dayjs().format("YYYY-MM");
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            yearMonth,
            pageIndex,
            pageSize,
            filters: JSON.stringify(filters),
          },
        },
        null,
        {
          scroll: false,
        }
      );
    },
    []
  );

  let filters = useMemo(() => {
    if (!router.query.filters) return [];
    try {
      let filters = JSON.parse(router.query.filters);
      // console.log({ filters });
      return filters;
    } catch (err) {
      console.warn(err);
    }
    return [];
  }, [router.query.filters]);

  // let allAgrifoodProductions = [];
  // const encryptedAgrifoodProductions =
  //   data?.tokenizedAllAgrifoodProductions || "";
  // if (encryptedAgrifoodProductions) {
  //   const decrypted = jwt.verify(encryptedAgrifoodProductions, TOKENIZE);
  //   allAgrifoodProductions = decrypted.queryResult;
  // }

  // let allAgrifoodCompanyProfiles = [];
  // const encryptedAgrifoodCompanyProfiles =
  //   data?.tokenizedAllAgrifoodCompanyProfiles || "";
  // if (encryptedAgrifoodCompanyProfiles) {
  //   const decrypted = jwt.verify(encryptedAgrifoodCompanyProfiles, TOKENIZE);
  //   allAgrifoodCompanyProfiles = decrypted.queryResult;
  // }

  // let allAgrifoodPremiseProfiles = [];
  // const encryptedAgrifoodPremiseProfiles =
  //   data?.tokenizedAllAgrifoodPremiseProfiles || "";
  // if (encryptedAgrifoodPremiseProfiles) {
  //   const decrypted = jwt.verify(encryptedAgrifoodPremiseProfiles, TOKENIZE);
  //   allAgrifoodPremiseProfiles = decrypted.queryResult;
  // }

  // let allAgrifoodProductCategories = [];
  // const encryptedAgrifoodProductCategories =
  //   data?.tokenizedAllAgrifoodProductCategories || "";
  // if (encryptedAgrifoodProductCategories) {
  //   const decrypted = jwt.verify(encryptedAgrifoodProductCategories, TOKENIZE);
  //   allAgrifoodProductCategories = decrypted.queryResult;
  // }

  // let allAgrifoodProductSubCategories = [];
  // const encryptedAgrifoodProductSubCategories =
  //   data?.tokenizedAllAgrifoodProductSubCategories || "";
  // if (encryptedAgrifoodProductSubCategories) {
  //   const decrypted = jwt.verify(
  //     encryptedAgrifoodProductSubCategories,
  //     TOKENIZE
  //   );
  //   allAgrifoodProductSubCategories = decrypted.queryResult;
  // }

  // let allAgrifoodProductCategoriesByCompanyId = [];
  // const encryptedAgrifoodProductCategoriesByCompanyId =
  //   data?.tokenizedAllAgrifoodProductCategoriesByCompanyId || "";
  // if (encryptedAgrifoodProductCategoriesByCompanyId) {
  //   const decrypted = jwt.verify(
  //     encryptedAgrifoodProductCategoriesByCompanyId,
  //     TOKENIZE
  //   );
  //   allAgrifoodProductCategoriesByCompanyId = decrypted.foundCategories;
  // }

  let allAgrifoodProductCategoriesByCompanyId =
    allAgrifoodProductCategoriesByCompanyIds;
  let allAgrifoodPremiseProfiles = allAgrifoodPremiseProfile;
  allAgrifoodPremiseProfiles = allAgrifoodPremiseProfiles.filter(
    (premise) => premise.companyUUID === formData.companyUUID
  );

  const fethchingFarmer = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_COMPANY,
      variables: {
        name: input,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedAgrifoodCompanyProfiles =
      result.data?.searchAllAgrifoodCompanyProfiles || "";
    let allAgrifoodCompanyProfiles = [];
    if (encryptedAgrifoodCompanyProfiles) {
      const decrypted = jwt.verify(encryptedAgrifoodCompanyProfiles, TOKENIZE);
      allAgrifoodCompanyProfiles = decrypted.queryResult;
      setAllAgrifoodCompanyProfiles(allAgrifoodCompanyProfiles);
    }

    callback(allAgrifoodCompanyProfiles);
  };

  const getFarmer = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fethchingFarmer(input, callback);
    }
  };

  const customUtilities = useMemo(() => [
    {
      label: "Edit",
      icon: <i className="fa fa-pencil" />,
      width: 400,

      render: (props) => {
        return (
          <div className="flex">
            <button
              onClick={async (e) => {
                if (e) e.preventDefault();

                const tokenizedPayload = {
                  companyUUID: props.row.original.companyUUID,
                };
                const tokenizedParams = jwt.sign(tokenizedPayload, TOKENIZE);
                let found = await client.query({
                  query: QUERY,
                  variables: {
                    tokenizedParams,
                    monthYear: yearMonth,
                    // companyUUID: props.row.original.companyUUID,
                  },
                });

                const encryptedAgrifoodProductCategoriesByCompanyId =
                  found.data
                    ?.tokenizedAllAgrifoodProductCategoriesByCompanyId || "";
                if (encryptedAgrifoodProductCategoriesByCompanyId) {
                  const decrypted = jwt.verify(
                    encryptedAgrifoodProductCategoriesByCompanyId,
                    TOKENIZE
                  );
                  found.data.tokenizedAllAgrifoodProductCategoriesByCompanyId =
                    decrypted.foundCategories;
                }


                // console.log(
                //   found.data.tokenizedAllAgrifoodProductCategoriesByCompanyId
                // );

                // const foundCompanyProfile = allAgrifoodCompanyProfiles.find(
                //   (c) => c.uuid === props.row.original.companyUUID
                // );

                const foundCompanyProfile = {
                  uuid: props.row.original.companyUUID,
                  companyName: props.row.original.companyName,
                };
                setSelectedCompany([
                  {
                    value: foundCompanyProfile.uuid,
                    label: foundCompanyProfile.companyName,
                  },
                ]);

                if (
                  found.data.tokenizedAllAgrifoodProductCategoriesByCompanyId
                ) {
                  const productCategory =
                    found.data.tokenizedAllAgrifoodProductCategoriesByCompanyId.find(
                      (cat) =>
                        cat.uuid === props.row.original.productCategoryUUID
                    );
                  // console.log(productCategory);
                  const resProducts = await client.query({
                    query: PRODUCT_QUERY,
                    variables: {
                      companyUUID: found.companyUUID,
                      productCategoryUUID: found.productCatalogueUUID,
                      productSubCategoryUUID: found.productSubCategoryUUID,
                    },
                    fetchPolicy: "no-cache",
                  });

                  let price =
                    resProducts.data.productCatalogueDetailsWithFilters.find(
                      (p) => p.uuid === props.row.original.productCatalogueUUID
                    );

                  if (!price) {
                    price =
                      resProducts.data.productCatalogueDetailsWithFilters.find(
                        (p) =>
                          p.productCatalogueUUID ===
                            props.row.original.productCatalogueUUID &&
                          p.name === props.row.original.productName
                      );
                  }

                  const { productCatalogueDetailsWithFilters } =
                    resProducts?.data || {};
                  const { productCatalogueUUID, productName } =
                    props.row.original;
                  let productCatalogue =
                    productCatalogueDetailsWithFilters?.find(
                      (p) => p.uuid === productCatalogueUUID
                    ) ||
                    productCatalogueDetailsWithFilters?.find(
                      (p) =>
                        p.productCatalogueUUID === productCatalogueUUID &&
                        p.name === productName
                    );

                  setModalVisible(true);

                  setFormData({
                    ...props.row.original,
                    productCatalogueUUID: productCatalogue.uuid,
                    CompanyProfile: {
                      uuid: props.row.original.companyUUID,
                      companyName: props.row.original.companyName,
                    },

                    listSubCategory:
                      productCategory?.AgrifoodProductSubCategoryFromCatalogueDetail ||
                      [],

                    productLists:
                      resProducts?.data?.productCatalogueDetailsWithFilters ||
                      "",

                    priceLists: price.priceLists,
                  });
                }
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
      Header: "Month & Year",
      accessor: "monthYear",
      style: {
        fontSize: 20,
        width: 200,
      },
      disableFilters: true,
    },
    {
      Header: "Company Name",
      accessor: "companyName",
      style: {
        fontSize: 20,
        width: 200,
      },
    },
    {
      Header: "Product Category",
      accessor: "productCategory",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Sub-Category",
      accessor: "productSubCategory",
      style: {
        fontSize: 20,
        width: 200,
      },
    },
    {
      Header: "Product Name",
      accessor: "productName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Quantity",
      accessor: "actualUnit",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Quantity Produced (Kg)",
      accessor: "quantity",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Value Produced ($)",
      accessor: "valueProduced",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
  ]);

  return (
    <AdminArea header={{ title: "Production" }} urlQuery={router.query}>
      {/* Modal Export */}
      <FormModal
        title={`Export Production`}
        visible={exportModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setExportModalVisible(false);
          setExportFormData({});
          setSelectedCompany([]);
          setSelectedCategory([]);
          setSelectedSubCategory([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setExportModalVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportAgrifoodProduction({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            window.open(response.data.exportAgrifoodProduction, "__blank");
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}
      >
        <div>
          <MonthAndYearsFilterWithExport
            label="Month Year Filter"
            controlledValue={yearMonth}
            // defaultValue={dayjs().format("YYYY-MM")}
            isDisabled={true}
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

          {/* <div className="form-group">
            <label>Company Name</label>
            <Select
              isClearable={true}
              value={selectedCompany}
              options={allAgrifoodCompanyProfiles.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.companyName,
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allAgrifoodCompanyProfiles.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  companyUUID: found?.uuid || "",
                });

                setSelectedCompany([
                  {
                    value: found?.uuid || "",

                    label: found?.companyName || "",
                  },
                ]);
              }}
            />
          </div> */}
          <div className="form-group">
            <label>Company Name</label>
            <AsyncSelect
              loadOptions={getFarmer}
              className={`form-control`}
              classNamePrefix="select"
              noOptionsMessage={() => "Type to Search"}
              getOptionLabel={(option) => `${option.companyName}`}
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allAgrifoodCompanyProfiles.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.uuid : null
                );
                setExportFormData({
                  ...exportFormData,
                  companyUUID: found?.uuid || "",
                });

                setSelectedCompany([
                  {
                    value: found?.uuid || "",

                    label: found?.companyName || "",
                  },
                ]);
              }}
            />
          </div>
          <div className="form-group">
            <label>Product Category</label>
            <Select
              isClearable={true}
              value={selectedCategory}
              options={allAgrifoodProductCategories.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.productNameEnglish,
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allAgrifoodProductCategories.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  productCategoryUUID: found?.uuid || "",
                });

                setSelectedCategory([
                  {
                    value: found?.uuid || "",

                    label: found?.productNameEnglish || "",
                  },
                ]);
              }}
            />
          </div>

          <div className="form-group">
            <label>Product Sub Category</label>
            <Select
              isClearable={true}
              value={selectedSubCategory}
              options={allAgrifoodProductSubCategories.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.subCategoryNameEnglish,
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allAgrifoodProductSubCategories.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  productSubCategoryUUID: found?.uuid || "",
                });

                setSelectedSubCategory([
                  {
                    value: found?.uuid || "",

                    label: found?.subCategoryNameEnglish || "",
                  },
                ]);
              }}
            />
          </div>

          <div className="form-group">
            <label>Product Name</label>
            <input
              className="form-control"
              value={exportFormData.productName || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setExportFormData({
                  ...exportFormData,
                  productName: e.target.value,
                });
              }}
            />
          </div>

          <br />
          <br />
        </div>
      </FormModal>
      <FormModal
        size={!formData.uuid ? "xl" : "md"}
        title={`${!formData.uuid ? "New" : "Edit"} Production`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            records: [],
          });
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            if (!formData.uuid) {
              const { records } = formData;
              for (const record of records) {
                const tokenizedPayload = {
                  ...formData,
                  ...record,
                };
                const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
                await createAgrifoodProduction({
                  variables: {
                    tokenized,
                    // ...formData,
                    // ...record,
                  },
                });
              }
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateAgrifoodProduction({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });
            }

            await refetch();
            setSavedCount((savedCount += 1));
            notification.addNotification({
              title: "Succeess!",
              message: `Agrifood Production saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Date*</label>
          <input
            required
            type="month"
            className={`form-control ${!formData.uuid ? "w-1/5" : ""}`}
            value={formData.monthYear || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                monthYear: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Customer Name</label>
          <AsyncSelect
            value={formData.CompanyProfile}
            loadOptions={getFarmer}
            className={`form-control w-full`}
            classNamePrefix="select"
            noOptionsMessage={() => "Type to Search"}
            getOptionLabel={(option) => `${option.companyName}`}
            getOptionValue={(option) => option.uuid}
            autoFocus={true}
            onChange={(selectedValues) => {
              // console.log({ selectedValues });

              const found = allAgrifoodCompanyProfiles.find(
                (profile) => profile.uuid === selectedValues.uuid
              );
              setFormData({
                ...formData,
                CompanyProfile: found,
                companyUUID: found?.uuid || "",
                companyName: found?.companyName || "",
              });

              setSelectedCompany([
                {
                  value: found.uuid,
                  label: found.companyName,
                },
              ]);
            }}
          />

          {/* <label>Company Name*</label>
          <Select
            value={selectedCompany}
            options={allAgrifoodCompanyProfiles.map((prof) => {
              return {
                value: prof.uuid,
                label: prof.companyName,
              };
            })}
            className={`form-control ${!formData.uuid ? "w-1/5" : ""}`}
            classNamePrefix="select"
            onChange={(selectedValues) => {
              // console.log({ selectedValues });

              const found = allAgrifoodCompanyProfiles.find(
                (profile) => profile.uuid === selectedValues.value
              );
              setFormData({
                ...formData,
                companyUUID: found?.uuid || "",
                companyName: found?.companyName || "",
              });

              setSelectedCompany([
                {
                  value: found.uuid,
                  label: found.companyName,
                },
              ]);
            }}
          /> */}
          {/* <select
            className={`form-control ${!formData.uuid ? "w-1/5" : ""}`}
            required
            value={formData.companyUUID || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allAgrifoodCompanyProfiles.find(
                (c) => c.uuid === e.target.value
              );

              setFormData({
                ...formData,
                companyUUID: found.uuid,
                companyName: found.companyName,
              });

              setFilterCriteria({
                ...filterCriteria,
                companyUUID: found.uuid,
              });
            }}
          >
            <option value="" disabled>
              Select Company Name
            </option>
            {allAgrifoodCompanyProfiles.map((profile) => (
              <option value={profile.uuid}>{profile.companyName}</option>
            ))}
          </select> */}
        </div>
        <div className="form-group">
          <label>Premise Address</label>
          <select
            disabled={!formData.companyUUID}
            className={`form-control ${!formData.uuid ? "w-1/5" : ""}`}
            required
            value={formData.premiseUUID || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allAgrifoodPremiseProfiles.find(
                (c) => c.uuid === e.target.value
              );

              setFormData({
                ...formData,
                premiseUUID: found.uuid,
                premiseAddress: found.premiseAddress,
              });
            }}
          >
            <option value="" disabled>
              Select Company Name
            </option>
            {allAgrifoodPremiseProfiles.map((profile) => (
              <option value={profile.uuid}>{profile.premiseAddress}</option>
            ))}
          </select>
        </div>

        {!formData.uuid ? (
          <div>
            <hr />
            <div className="flex justify-start mb-4">
              <button
                className="bg-mantis-500 text-sm text-white font-bold px-2 py-2 rounded-md shadow-md"
                onClick={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    records: [
                      ...formData.records,
                      {
                        uuid: uuidv4(),
                        listSubCategory: [],
                        productLists: [],
                        priceLists: [],
                        actualUnit: 0,
                        pricePerUnit: 0,
                        netWeight: 0,
                        quantity: 0,
                        percentageExported: 0,
                        valueProduced: 0,
                      },
                    ],
                  });
                }}
              >
                <i className="fa fa-plus" /> Add
              </button>
            </div>
            <div className="grid grid-cols-10">
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md">
                Product Category
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md">
                Product Sub-Category
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md">
                Product Name
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md">
                Price per Unit ($)
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md">
                Net Weight (g)
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md">
                Unit Produced
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md">
                Quantity Produced(Kg)
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md">
                Precentage Exported(%)
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md">
                Value Produced($)
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md" />
            </div>
            {formData.records.map((rec) => (
              <div className="grid grid-cols-10 my-2">
                <div className="pr-2">
                  <select
                    className="form-control"
                    value={rec.productCategoryUUID || ""}
                    onChange={(e) => {
                      if (e) e.preventDefault();

                      const found =
                        allAgrifoodProductCategoriesByCompanyId.find(
                          (cat) => cat.uuid === e.target.value
                        );

                      setFormData({
                        ...formData,
                        records: formData.records.map((re) =>
                          re.uuid !== rec.uuid
                            ? re
                            : {
                                ...rec,
                                productCategoryUUID: found.uuid,
                                productCategory: found.productNameEnglish || "",
                                productSubCategoryUUID: "",
                                productSubCategory: "",

                                // listSubCategory:
                                //   found?.AgrifoodProductSubCategory || [],

                                listSubCategory:
                                  found?.AgrifoodProductSubCategoryFromCatalogueDetail ||
                                  [],

                                productLists: [],
                                priceLists: [],
                                actualUnit: 0,
                                pricePerUnit: 0,
                                netWeight: 0,
                                quantity: 0,
                                percentageExported: 0,
                                valueProduced: 0,

                                productName: "",
                                productCatalogueUUID: "",
                              }
                        ),
                      });
                      setFilterCriteria({
                        ...filterCriteria,
                        companyUUID: formData.companyUUID,
                        productCategoryUUID: found.uuid,
                      });
                    }}
                  >
                    <option value="" disabled>
                      Select Product Category
                    </option>
                    {allAgrifoodProductCategoriesByCompanyId.map((category) => (
                      <option value={category.uuid}>
                        {category.productNameEnglish}
                      </option>
                    ))}
                  </select>
                  <button className="bg-purple-500 w-full rounded-sm text-white py-1 mt-1 shadow-md hidden">
                    <i className="fa fa-search" /> Search
                  </button>
                </div>
                <div className="pr-2">
                  <select
                    className="form-control"
                    value={rec.productSubCategoryUUID || ""}
                    onChange={async (e) => {
                      if (e) e.preventDefault();
                      const found = rec.listSubCategory.find(
                        (cat) => cat.uuid === e.target.value
                      );

                      const resProducts = await client.query({
                        query: PRODUCT_QUERY,
                        variables: {
                          ...filterCriteria,
                          productSubCategoryUUID: found.uuid,
                        },
                        fetchPolicy: "no-cache",
                      });

                      let productLists = [];
                      if (resProducts.data.productCatalogueDetailsWithFilters) {
                        productLists =
                          resProducts.data.productCatalogueDetailsWithFilters;
                      }

                      setFormData({
                        ...formData,
                        records: formData.records.map((re) =>
                          re.uuid !== rec.uuid
                            ? re
                            : {
                                ...rec,
                                productSubCategoryUUID: found.uuid,
                                productSubCategory:
                                  found.subCategoryNameEnglish || "",
                                productLists,
                              }
                        ),
                      });
                    }}
                  >
                    <option value="" disabled>
                      Select Sub Product Category
                    </option>
                    {rec.listSubCategory.map((cat) => (
                      <option value={cat.uuid}>
                        {cat.subCategoryNameEnglish}
                      </option>
                    ))}
                  </select>
                  <button className="bg-purple-500 w-full rounded-sm text-white py-1 mt-1 shadow-md hidden">
                    <i className="fa fa-search" /> Search
                  </button>
                </div>
                <div className="pr-2">
                  <select
                    className="form-control"
                    value={rec.productCatalogueUUID || ""}
                    onChange={(e) => {
                      if (e) e.preventDefault();

                      const product = rec.productLists.find(
                        (p) => p.uuid === e.target.value
                      );

                      setFormData({
                        ...formData,
                        records: formData.records.map((re) =>
                          re.uuid !== rec.uuid
                            ? re
                            : {
                                ...rec,
                                productName: product.name,
                                productCatalogueUUID: product.uuid,
                                priceLists: product?.priceLists || [],
                                pricePerUnit: 0,
                                netWeight: product?.weight || 0,
                              }
                        ),
                      });
                    }}
                  >
                    <option value={""} disabled>
                      Select Product
                    </option>
                    {rec.productLists.map((product) => (
                      <option value={product.uuid}>{product.name}</option>
                    ))}
                  </select>
                  <button className="bg-purple-500 w-full rounded-sm text-white py-1 mt-1 shadow-md hidden">
                    <i className="fa fa-search" /> Search
                  </button>
                </div>
                <div className="pr-2">
                  <select
                    className="form-control"
                    value={rec.pricePerUnit || 0}
                    onChange={(e) => {
                      if (e) e.preventDefault();

                      const product = rec.priceLists.find(
                        (p) => p.price === parseFloat(e.target.value)
                      );

                      const actualUnit = rec.actualUnit;
                      const valueProduced = product.price * actualUnit;

                      setFormData({
                        ...formData,
                        records: formData.records.map((re) =>
                          re.uuid !== rec.uuid
                            ? re
                            : {
                                ...rec,
                                pricePerUnit: product?.price || 0,
                                valueProduced,
                              }
                        ),
                      });
                    }}
                  >
                    <option value={0} disabled>
                      Select Price
                    </option>
                    {rec.priceLists.map((product) => (
                      <option value={product.price}>{product.price}</option>
                    ))}
                  </select>
                </div>
                <div className="pr-2">
                  <NumberFormat
                    disabled
                    placeholder="Auto Filled"
                    className="form-control"
                    value={rec.netWeight || 0}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    fixedDecimalScale={true}
                    onValueChange={(e) => {
                      // if (e) e.preventDefault();

                      const actualUnit = rec.actualUnit;
                      const netWeight = e.value;

                      const quantity = (actualUnit * netWeight) / 1000;
                      setFormData({
                        ...formData,
                        records: formData.records.map((re) =>
                          re.uuid !== rec.uuid
                            ? re
                            : {
                                ...rec,
                                netWeight: e.floatValue,
                                quantity,
                              }
                        ),
                      });
                    }}
                  />
                </div>
                <div className="pr-2">
                  <NumberFormat
                    className="form-control"
                    value={rec.actualUnit || 0}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    fixedDecimalScale={true}
                    onValueChange={(e) => {
                      // if (e) e.preventDefault();

                      const actualUnit = e.floatValue;
                      const netWeight = rec.netWeight;

                      const quantity = (actualUnit * netWeight) / 1000;

                      const valueProduced = rec.pricePerUnit * actualUnit;

                      setFormData({
                        ...formData,
                        records: formData.records.map((re) =>
                          re.uuid !== rec.uuid
                            ? re
                            : {
                                ...rec,
                                actualUnit: e.floatValue,
                                quantity,
                                valueProduced,
                              }
                        ),
                      });
                    }}
                  />
                </div>
                <div className="pr-2">
                  <NumberFormat
                    disabled
                    placeholder="Auto Calculated"
                    className="form-control"
                    value={rec.quantity || 0}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    fixedDecimalScale={true}
                    onValueChange={(e) => {
                      // if (e) e.preventDefault();
                      setFormData({
                        ...formData,
                        records: formData.records.map((re) =>
                          re.uuid !== rec.uuid
                            ? re
                            : {
                                ...rec,
                                quantity: e.floatValue,
                              }
                        ),
                      });
                    }}
                  />
                </div>
                <div className="pr-2">
                  <NumberFormat
                    className="form-control"
                    value={rec.percentageExported || 0}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    fixedDecimalScale={true}
                    onValueChange={(e) => {
                      // if (e) e.preventDefault();
                      setFormData({
                        ...formData,
                        records: formData.records.map((re) =>
                          re.uuid !== rec.uuid
                            ? re
                            : {
                                ...rec,
                                percentageExported: e.floatValue,
                              }
                        ),
                      });
                    }}
                  />
                </div>
                <div className="pr-2">
                  <NumberFormat
                    disabled
                    placeholder="Auto Calculated"
                    className="form-control"
                    value={rec.valueProduced || 0}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    fixedDecimalScale={true}
                    onValueChange={(e) => {
                      // if (e) e.preventDefault();
                      setFormData({
                        ...formData,
                        records: formData.records.map((re) =>
                          re.uuid !== rec.uuid
                            ? re
                            : {
                                ...rec,
                                valueProduced: e.floatValue,
                              }
                        ),
                      });
                    }}
                  />
                </div>
                <div className="flex justify-center items-center">
                  <button
                    className="bg-red-500 text-white font-bold rounded-md shadow-md px-4 py-2"
                    onClick={(e) => {
                      if (e) e.preventDefault();

                      setFormData({
                        ...formData,
                        records: formData.records.filter(
                          (r) => r.uuid !== rec.uuid
                        ),
                      });
                    }}
                  >
                    <i className="fa fa-times" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="form-group">
              <label>Product Category</label>
              <select
                className="form-control"
                value={formData.productCategoryUUID || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();

                  const found = allAgrifoodProductCategoriesByCompanyId.find(
                    (cat) => cat.uuid === e.target.value
                  );

                  setFormData({
                    ...formData,
                    productCategoryUUID: found.uuid,
                    productCategory: found.productNameEnglish || "",
                    listSubCategory:
                      found?.AgrifoodProductSubCategoryFromCatalogueDetail ||
                      [],

                    productSubCategoryUUID: "",
                    productSubCategory: "",
                  });
                }}
              >
                <option value="" disabled>
                  Select Product Category
                </option>
                {allAgrifoodProductCategoriesByCompanyId.map((category) => (
                  <option value={category.uuid}>
                    {category.productNameEnglish}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Product Sub Category</label>
              <select
                className="form-control"
                value={formData.productSubCategoryUUID || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  const found = formData.listSubCategory.find(
                    (cat) => cat.uuid === e.target.value
                  );

                  setFormData({
                    ...formData,
                    productSubCategoryUUID: found.uuid,
                    productSubCategory: found.subCategoryNameEnglish || "",
                  });
                }}
              >
                <option value="" disabled>
                  Select Product Category
                </option>
                {formData.listSubCategory.map((cat) => (
                  <option value={cat.uuid}>{cat.subCategoryNameEnglish}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Product Name</label>
              <select
                className="form-control"
                value={formData.productCatalogueUUID || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  const found = formData.productLists.find(
                    (cat) => cat.uuid === e.target.value
                  );

                  setFormData({
                    ...formData,
                    productCatalogueUUID: found.uuid,
                    productName: found.name || "",
                    priceLists: found.priceLists || [],
                    pricePerUnit: "",
                  });
                }}
              >
                <option value="" disabled>
                  Select Product
                </option>
                {formData.productLists.map((cat) => (
                  <option value={cat.uuid}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Price per Unit ($)</label>
              <select
                className="form-control"
                value={formData.pricePerUnit || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  const found = formData.priceLists.find(
                    (d) => d.price === parseFloat(e.target.value)
                  );

                  const valueProduced = found.price * formData.actualUnit;

                  setFormData({
                    ...formData,
                    pricePerUnit: found?.price || 0,
                    valueProduced,
                  });
                }}
              >
                <option value="" disabled>
                  Select Price
                </option>
                {formData.priceLists.map((p) => (
                  <option value={p.price}>{p.price}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Net Weight</label>
              <NumberFormat
                disabled
                placeholder="Auto Filled"
                className="form-control"
                value={formData.netWeight || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();

                  const actualUnit = formData.actualUnit;
                  const netWeight = e.floatValue || 0;

                  const quantity = (actualUnit * netWeight) / 1000;

                  setFormData({
                    ...formData,
                    netWeight: e.floatValue || 0,
                    quantity,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Actual Unit</label>
              <NumberFormat
                className="form-control"
                value={formData.actualUnit || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();

                  const actualUnit = e.floatValue;
                  const netWeight = formData.netWeight;

                  const quantity = (actualUnit * netWeight) / 1000;

                  const valueProduced = formData.pricePerUnit * actualUnit;
                  setFormData({
                    ...formData,
                    actualUnit: e.floatValue,
                    quantity,
                    valueProduced,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Quantity Produced (Kg)</label>
              <NumberFormat
                disabled
                placeholder="Auto Calculated"
                className="form-control"
                value={formData.quantity || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    quantity: e.floatValue,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Percentage Exported (%)</label>
              <NumberFormat
                className="form-control"
                value={formData.percentageExported || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    percentageExported: e.floatValue,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Value Produced ($)</label>
              <NumberFormat
                disabled
                placeholder="Auto Calculated"
                className="form-control"
                value={formData.valueProduced || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    valueProduced: e.floatValue,
                  });
                }}
              />
            </div>
          </div>
        )}
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <TableAsync
          customHeaderUtilities={
            <div className="flex">
              <MonthAndYearsFilterWithExport
                label="Month Year Filter"
                // defaultValue={dayjs().format("YYYY-MM")}
                controlledValue={yearMonth}
                // options={YEARS}
                onSelect={(yearMonth) => {
                  setYearMonth(yearMonth);
                }}
                // exportConfig={{
                //   title: "Entrepreneur - Production And Sales",
                //   collectionName: "EntrepreneurProductionAndSaleses",
                //   filters: {
                //     yearMonth,
                //   },
                //   columns,
                // }}
              />
              <div className="flex mx-2 items-end">
                <button
                  className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                  onClick={async (e) => {
                    if (e) e.preventDefault();
                    setExportModalVisible(true);
                    // showLoadingSpinner();
                    // try {
                    //   const response = await exportAgrifoodProduction({
                    //     variables: {
                    //       monthYear: yearMonth,
                    //     },
                    //   });

                    //   window.open(
                    //     response.data.exportAgrifoodProduction,
                    //     "__blank"
                    //   );
                    // } catch (err) {
                    //   notification.handleError(err);
                    // }
                    // hideLoadingSpinner();
                  }}
                >
                  Export Excel
                </button>
              </div>
            </div>
          }
          loading={loading}
          columns={columns}
          data={allAgrifoodProductions}
          withoutHeader={true}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          onAdd={
            !currentUserDontHavePrivilege(["Production Agrifood:Create"])
              ? () => {
                  setFormData({
                    records: [],
                  });
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Production Agrifood:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} productions?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteAgrifoodProduction({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} productions deleted`,
                        level: "success",
                      });
                      await refetch();
                      setSavedCount((savedCount += 1));
                    }
                  } catch (err) {
                    handleError(err);
                  }
                  hideLoadingSpinner();
                }
              : null
          }
          customUtilities={
            !currentUserDontHavePrivilege(["Production Agrifood:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(page);
