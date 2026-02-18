import React, { useState, useEffect, useMemo, useCallback } from "react";
import { withApollo } from "../../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../../components/App";
import { useNotification } from "../../components/Notification";
import { handleError } from "../../libs/errors";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import TableAsync from "../../components/TableAsync";
import {
  useQuery,
  useLazyQuery,
  useMutation,
  useApolloClient,
} from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { FormModal } from "../../components/Modal";
import { useRouter } from "next/router";
import { create, filter } from "lodash";
import { from } from "apollo-link";
import { configure } from "nprogress";
import Head from "next/dist/next-server/lib/head";
import { Leaf } from "slate";
import { v4 as uuidv4 } from "uuid";
import NumberFormat from "react-number-format";
import dayjs from "dayjs";
import Select from "react-select";
import { MonthAndYearsFilterWithExport } from "../../components/MonthAndYearsFilterWithExport";
import lodash from "lodash";
import AsyncSelect from "react-select/async";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries(
    $monthYear: String!
    $filters: String
    $tokenizedParams: String!
  ) {
    countAllLivestockFeeds(monthYear: $monthYear, filters: $filters)
    tokenizedAllLiveStocksBySupplierOnAnimalFeed(
      tokenizedParams: $tokenizedParams
    )
    tokenizedAllAnimalFeedBySupplierId(tokenizedParams: $tokenizedParams)
  }
`;

// const QUERY_LIVESTOCK_BY_SUPPLIER = gql`
// query livestockBySupplier($tokenizedParams: String!){
//   tokenizedAllLiveStocksBySupplierOnAnimalFeed(
//     tokenizedParams: $tokenizedParams
//   )
// }
// `

// const QUERY_ANIMAL_FEED_BY_SUPPLIER = gql`
// query animalFeedBySupplier(
//   $tokenizedParams: String!
// ){
//   tokenizedAllAnimalFeedBySupplierId(tokenizedParams: $tokenizedParams)
// }
// `

const LIVESTOCK_FEED_QUERY = gql`
  query queryLiveStockFeed(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllLivestockFeeds(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllLivestockFeeds(monthYear: $monthYear, filters: $filters)
  }
`;

const MASTER_DATA_QUERIES = gql`
  query masterDataQueries {
    tokenizedAllLiveStock
    tokenizedAllAnimalFeeds
    tokenizedAllLiveStockSuppliers
  }
`;

const CREATE_LIVESTOCK_FEED = gql`
  mutation tokenizedCreateLivestockFeed($tokenized: String!) {
    tokenizedCreateLivestockFeed(tokenized: $tokenized)
  }
`;

const SEARCH_FARMER_QUERY = gql`
  query searchQuery($name: String) {
    searchAllFarmerProfiles(name: $name)
  }
`;

const UPDATE_LIVESTOCK_FEED = gql`
  mutation tokenizedUpdateLivestockFeed($tokenized: String!) {
    tokenizedUpdateLivestockFeed(tokenized: $tokenized)
  }
`;

const DELETE_LIVESTOCK_FEED = gql`
  mutation tokenizedDeleteLivestockFeed($tokenized: String!) {
    tokenizedDeleteLivestockFeed(tokenized: $tokenized)
  }
`;

const EXPORT_LIVESTOCK_FEED = gql`
  mutation exportLivestockFeed(
    $monthYear: String!
    $livestockUUID: String
    $livestockFeedCategoryUUID: String
    $livestockFeedCode: String
    $customerUUID: String
  ) {
    exportLivestockFeed(
      monthYear: $monthYear
      livestockUUID: $livestockUUID
      livestockFeedCategoryUUID: $livestockFeedCategoryUUID
      livestockFeedCode: $livestockFeedCode
      customerUUID: $customerUUID
    )
  }
`;

const IS_CHECK_FARMER = gql`
  query isFarmerCheck {
    isFarmerCheck
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
    quantityKg: 0,
    quantityMt: 0,
    price50Kg: 0,
    priceKg: 0,
  });
  const [exportFormData, setExportFormData] = useState({});
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [registerType, setRegisterType] = useState("");

  const notification = useNotification();
  let supplierId = "";
  let tokenized = "";

  if (formData.supplierId) {
    supplierId = formData.supplierId;
    const tokenizedPayload = {
      supplierId: supplierId,
    };
    tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
  }

  const { data, error, loading, refetch } = useQuery(QUERY, {
    variables: {
      // supplierId: formData?.supplierUUID || "",
      monthYear: yearMonth,
      tokenizedParams: tokenized,
      filters: router.query.filters,
    },
  });

  let [countLivestockFeed, setCountLivestockFeed] = useState(0);
  let [savedCount, setSavedCount] = useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countLivestockFeed) return 1;
    return Math.ceil(countLivestockFeed / pageSize);
  }, [countLivestockFeed, pageSize]);

  const [createLivestockFeed] = useMutation(CREATE_LIVESTOCK_FEED);
  const [updateLivestockFeed] = useMutation(UPDATE_LIVESTOCK_FEED);
  const [deleteLivestockFeed] = useMutation(DELETE_LIVESTOCK_FEED);
  const [exportLivestockFeed] = useMutation(EXPORT_LIVESTOCK_FEED);

  const [allLivestockFeeds, setAllLivestockFeeds] = useState([]);
  const [allLivestockSuppliers, setAllLivestockSuppliers] = useState([]);
  const [allAnimalFeedBySupplierIds, setAllAnimalFeedBySupplierIds] = useState(
    []
  );
  const [
    allLiveStocksBySupplierOnAnimalFeed,
    setAllLiveStocksBySupplierOnAnimalFeed,
  ] = useState([]);
  const [allFarmerProfiles, setAllFarmerProfiles] = useState([]);
  const [allAnimalFeed, setAllAnimalFeed] = useState([]);
  const [allLiveStocks, setAllLiveStocks] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedLivestockFeeds = data?.tokenizedAllLivestockFeeds || "";
      // let allLivestockFeeds = [];
      // if (encryptedLivestockFeeds) {
      //   const decrypted = jwt.verify(encryptedLivestockFeeds, TOKENIZE);
      //   allLivestockFeeds = decrypted.queryResult;
      //   setAllLivestockFeeds(allLivestockFeeds);
      // }

      // const encryptedLivestockSuppliers = data?.tokenizedAllLiveStockSuppliers || "";
      // let allLivestockSuppliers = [];
      // if (encryptedLivestockSuppliers) {
      //   const decrypted = jwt.verify(encryptedLivestockSuppliers, TOKENIZE);
      //   allLivestockSuppliers = decrypted.queryResult;
      //   setAllLivestockSuppliers(allLivestockSuppliers);
      // }

      const encryptedAnimalFeedBySupplierId =
        data?.tokenizedAllAnimalFeedBySupplierId || "";
      let allAnimalFeedBySupplierIds = [];
      if (encryptedAnimalFeedBySupplierId) {
        const decrypted = jwt.verify(encryptedAnimalFeedBySupplierId, TOKENIZE);
        allAnimalFeedBySupplierIds = decrypted.queryResult;
        setAllAnimalFeedBySupplierIds(allAnimalFeedBySupplierIds);
      }

      const encryptedLiveStocksBySupplierOnAnimalFeed =
        data?.tokenizedAllLiveStocksBySupplierOnAnimalFeed || "";
      let allLiveStocksBySupplierOnAnimalFeed = [];
      if (encryptedLiveStocksBySupplierOnAnimalFeed) {
        const decrypted = jwt.verify(
          encryptedLiveStocksBySupplierOnAnimalFeed,
          TOKENIZE
        );
        allLiveStocksBySupplierOnAnimalFeed = decrypted.result;
        setAllLiveStocksBySupplierOnAnimalFeed(
          allLiveStocksBySupplierOnAnimalFeed
        );
      }

      // const encryptedFarmerProfiles = data?.tokenizedAllFarmerProfile || "";
      // let allFarmerProfiles = [];
      // if (encryptedFarmerProfiles) {
      //   const decrypted = jwt.verify(encryptedFarmerProfiles, TOKENIZE);
      //   allFarmerProfiles = decrypted.queryResult;
      //   setAllFarmerProfiles(allFarmerProfiles);
      // }

      // const encryptedAnimalFeeds = data?.tokenizedAllAnimalFeeds || "";
      // let allAnimalFeed = [];
      // if (encryptedAnimalFeeds) {
      //   const decrypted = jwt.verify(encryptedAnimalFeeds, TOKENIZE);
      //   allAnimalFeed = decrypted.queryResult;
      //   setAllAnimalFeed(allAnimalFeed);
      // }

      // const encryptedLiveStocks = data?.tokenizedAllLiveStock || "";
      // let allLiveStocks = [];
      // if (encryptedLiveStocks) {
      //   const decrypted = jwt.verify(encryptedLiveStocks, TOKENIZE);
      //   allLiveStocks = decrypted.queryResult;
      //   setAllLiveStocks(allLiveStocks);
      // }
      const countData = data?.countAllLivestockFeeds || 0;
      setCountLivestockFeed(countData);
    }
  }, [data, loading, error, savedCount]);

  const handlePageChange = useCallback(
    async ({ pageIndex, pageSize, filters }) => {
      // const ym = router.query.yearMonth;

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
    // console.log("router.query.filters", router.query.filters);
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

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: LIVESTOCK_FEED_QUERY,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedLivestockFeeds =
      result.data?.tokenizedAllLivestockFeeds || "";
    let allLivestockFeeds = [];
    if (encryptedLivestockFeeds) {
      const decrypted = jwt.verify(encryptedLivestockFeeds, TOKENIZE);
      allLivestockFeeds = decrypted.queryResult;
      setAllLivestockFeeds(allLivestockFeeds);
    }
    const countData = result.data?.countAllLivestockFeeds || 0;
    setCountLivestockFeed(countData);
    hideLoadingSpinner();
  }, [savedCount, yearMonth, pageSize, pageIndex, router.query.filters]);

  // useEffect(async () => {
  //   showLoadingSpinner();
  //   const result = await client.query({
  //     query: QUERY_ANIMAL_FEED_BY_SUPPLIER,
  //     variables: {
  //       tokenizedParams: tokenizedParams
  //     },
  //     fetchPolicy: "no-cache",
  //   });

  //   const encryptedLiveStocksBySupplierOnAnimalFeed =
  //     result.data?.tokenizedAllLiveStocksBySupplierOnAnimalFeed || "";
  //   let allLiveStocksBySupplierOnAnimalFeed = [];
  //   if (encryptedLiveStocksBySupplierOnAnimalFeed) {
  //     const decrypted = jwt.verify(encryptedLiveStocksBySupplierOnAnimalFeed, TOKENIZE);
  //     allLiveStocksBySupplierOnAnimalFeed = decrypted.queryResult;
  //     setAllLiveStocksBySupplierOnAnimalFeeds(allLiveStocksBySupplierOnAnimalFeed);
  //   }
  //   hideLoadingSpinner();
  // }, [tokenizedParams]);

  // useEffect(async () => {
  //   showLoadingSpinner();
  //   const result = await client.query({
  //     query: QUERY_LIVESTOCK_BY_SUPPLIER,
  //     variables: {
  //       tokenizedParams: tokenizedParams
  //     },
  //     fetchPolicy: "no-cache",
  //   });

  //   const encryptedAnimalFeedBySupplierId =
  //     result.data?.tokenizedAllAnimalFeedBySupplierId || "";
  //   let allAnimalFeedBySupplierId = [];
  //   if (encryptedAnimalFeedBySupplierId) {
  //     const decrypted = jwt.verify(encryptedAnimalFeedBySupplierId, TOKENIZE);
  //     allAnimalFeedBySupplierId = decrypted.queryResult;
  //     setAllAnimalFeedBySupplierIds(allAnimalFeedBySupplierId);
  //   }
  //   hideLoadingSpinner();
  // }, [tokenizedParams]);

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: MASTER_DATA_QUERIES,
      // variables: {},
      fetchPolicy: "no-cache",
    });

    const encryptedLivestockSuppliers =
      result.data?.tokenizedAllLiveStockSuppliers || "";
    let allLivestockSuppliers = [];
    if (encryptedLivestockSuppliers) {
      const decrypted = jwt.verify(encryptedLivestockSuppliers, TOKENIZE);
      allLivestockSuppliers = decrypted.queryResult;
      setAllLivestockSuppliers(allLivestockSuppliers);
    }
    const encryptedLiveStocks = result.data?.tokenizedAllLiveStock || "";
    let allLiveStocks = [];
    if (encryptedLiveStocks) {
      const decrypted = jwt.verify(encryptedLiveStocks, TOKENIZE);
      allLiveStocks = decrypted.queryResult;
      setAllLiveStocks(allLiveStocks);
    }

    const encryptedAnimalFeeds = result.data?.tokenizedAllAnimalFeeds || "";
    let allAnimalFeeds = [];
    if (encryptedAnimalFeeds) {
      const decrypted = jwt.verify(encryptedAnimalFeeds, TOKENIZE);
      allAnimalFeeds = decrypted.queryResult;
      setAllAnimalFeed(allAnimalFeeds);
    }

    hideLoadingSpinner();
  }, []);

  const fethchingFarmer = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_FARMER_QUERY,
      variables: {
        name: input,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedFarmerProfiles = result.data?.searchAllFarmerProfiles || "";
    let allFarmerProfiles = [];
    if (encryptedFarmerProfiles) {
      const decrypted = jwt.verify(encryptedFarmerProfiles, TOKENIZE);
      allFarmerProfiles = decrypted.queryResult;
      setAllFarmerProfiles(allFarmerProfiles);
    }

    callback(allFarmerProfiles);
  };

  const getFarmer = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fethchingFarmer(input, callback);
    }
  };

  useEffect(async () => {
    const result = await client.query({
      query: IS_CHECK_FARMER,
      fetchPolicy: "no-cache",
    });

    const farmerCheck = result.data.isFarmerCheck;
    if (farmerCheck) {
      const result = await client.query({
        query: SEARCH_FARMER_QUERY,
        fetchPolicy: "no-cache",
      });

      const encryptedFarmerProfiles =
        result.data?.searchAllFarmerProfiles || "";
      let allFarmerProfiles = [];
      if (encryptedFarmerProfiles) {
        const decrypted = jwt.verify(encryptedFarmerProfiles, TOKENIZE);
        allFarmerProfiles = decrypted.queryResult;
        setAllFarmerProfiles(allFarmerProfiles);
      }
      setRegisterType("FARMER");
    } else {
      setRegisterType("OFFICER");
    }
  }, []);

  // const encryptedLivestockFeeds = data?.tokenizedAllLivestockFeeds || "";
  // let allLivestockFeeds = [];
  // if (encryptedLivestockFeeds) {
  //   const decrypted = jwt.verify(encryptedLivestockFeeds, TOKENIZE);
  //   allLivestockFeeds = decrypted.queryResult;
  // }

  // const encryptedLivestockSuppliers =
  //   data?.tokenizedAllLiveStockSuppliers || "";
  // let allLivestockSuppliers = [];
  // if (encryptedLivestockSuppliers) {
  //   const decrypted = jwt.verify(encryptedLivestockSuppliers, TOKENIZE);
  //   allLivestockSuppliers = decrypted.queryResult;
  // }

  // const encryptedAnimalFeedBySupplierId =
  //   data?.tokenizedAllAnimalFeedBySupplierId || "";
  // let allAnimalFeedBySupplierId = [];
  // if (encryptedAnimalFeedBySupplierId) {
  //   const decrypted = jwt.verify(encryptedAnimalFeedBySupplierId, TOKENIZE);
  //   allAnimalFeedBySupplierId = decrypted.queryResult;
  // }

  // const encryptedLiveStocksBySupplierOnAnimalFeed =
  //   data?.tokenizedAllLiveStocksBySupplierOnAnimalFeed || "";
  // let allLiveStocksBySupplierOnAnimalFeed = [];
  // if (encryptedLiveStocksBySupplierOnAnimalFeed) {
  //   const decrypted = jwt.verify(
  //     encryptedLiveStocksBySupplierOnAnimalFeed,
  //     TOKENIZE
  //   );
  //   allLiveStocksBySupplierOnAnimalFeed = decrypted.result;
  // }

  // const allFarmerProfiles = data?.allFarmerProfiles || [];

  // const encryptedAnimalFeeds = data?.tokenizedAllAnimalFeeds || "";
  // let allAnimalFeeds = [];
  // if (encryptedAnimalFeeds) {
  //   const decrypted = jwt.verify(encryptedAnimalFeeds, TOKENIZE);
  //   allAnimalFeeds = decrypted.queryResult;
  // }

  // const encryptedLiveStocks = data?.tokenizedAllLiveStock || "";
  // let allLiveStocks = [];
  // if (encryptedLiveStocks) {
  //   const decrypted = jwt.verify(encryptedLiveStocks, TOKENIZE);
  //   allLiveStocks = decrypted.queryResult;
  // }

  let allAnimalFeedBySupplierId = allAnimalFeedBySupplierIds;
  let allAnimalFeeds = allAnimalFeed;

  allAnimalFeedBySupplierId = allAnimalFeedBySupplierId.filter(
    (feed) =>
      feed.supplierId === formData.supplierUUID &&
      feed.livestockId === formData.livestockUUID
  );

  allAnimalFeeds = lodash.uniqBy(
    allAnimalFeeds,
    (category) => category.category
  );
  const [selectedTypeOfLiveStock, setSelectedTypeOfLiveStock] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const [selectLivestockFeedCategory, setSelectLivestockFeedCategory] =
    useState([
      {
        value: "",
        label: "",
      },
    ]);

  const [selectedCustomerName, setSelectedCustomerName] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  useEffect(() => {
    const totalValue = formData.quantityKg * formData.priceKg;

    setFormData({
      ...formData,
      totalValue,
    });
  }, [formData.quantityKg, formData.priceKg]);
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
                setModalVisible(true);
                setFormData({
                  ...props.row.original,
                  FarmerProfile: {
                    farmerCompanyName: props.row.original.customerName,
                    uuid: props.row.original.customerUUID,
                  },
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
      Header: "Month & Year",
      accessor: "monthYear",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Type of Livestock",
      accessor: "typeOfLiveStock",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Livestock Feed Category",
      accessor: "livestockFeedCategory",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Live Stock Feed Code",
      accessor: "livestockFeedCode",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Customer Name",
      accessor: "customerName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Farm ID",
      accessor: "farmProfileFarmId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Quantity (kg)",
      accessor: "quantityKg",
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
      Header: "Quantity (MT)",
      accessor: "quantityMt",
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
      Header: "Price ($/50kg)",
      accessor: "price50Kg",
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
      Header: "Price ($/kg)",
      accessor: "priceKg",
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
      Header: "Total Value($)",
      accessor: "totalValue",
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
  ]);

  return (
    <AdminArea header={{ title: "Livestock Feed" }} urlQuery={router.query}>
      <Head>
        <title>Livestock Feed</title>
      </Head>
      <FormModal
        title={`Export Livestock Feed`}
        visible={exportModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setExportModalVisible(false);
          setExportFormData({});
          setSelectedTypeOfLiveStock([]);
          setSelectLivestockFeedCategory([]);
          setSelectedCustomerName([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setExportModalVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportLivestockFeed({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            // Convert base64 to blob
            const base64Response = response.data.exportLivestockFeed;
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
            link.download = "livestock_feed.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);

            // window.open(response.data.exportLivestockFeed, "__blank");
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
            defaultValue={dayjs().format("YYYY-MM")}
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

          <div className="form-group">
            <label>Type Of Live Stock</label>
            <Select
              isClearable={true}
              value={selectedTypeOfLiveStock}
              options={allLiveStocks.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.typeOfLiveStock.toUpperCase(),
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allLiveStocks.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  livestockUUID: found?.uuid || "",
                });

                setSelectedTypeOfLiveStock([
                  {
                    value: found?.uuid || "",
                    label: found?.typeOfLiveStock.toUpperCase() || "",
                  },
                ]);
              }}
            />
          </div>

          <div className="form-group">
            <label>LiveStock Feed Category</label>
            <Select
              isClearable={true}
              value={selectLivestockFeedCategory}
              options={allAnimalFeeds.map((prof) => {
                return {
                  value: prof.uuid,
                  label: `${prof.category.toUpperCase()} - ${prof.code}`,
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allAnimalFeeds.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  livestockFeedCategoryUUID: found?.uuid || "",
                });

                setSelectLivestockFeedCategory([
                  {
                    value: found?.uuid || "",
                    label: found?.category.toUpperCase() || "",
                  },
                ]);
              }}
            />
          </div>

          <div className="form-group">
            <label>Live Stock Feed Code</label>
            <input
              className="form-control"
              value={exportFormData.livestockFeedCode || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setExportFormData({
                  ...exportFormData,
                  livestockFeedCode: e.target.value,
                });
              }}
            />
          </div>

          {/* <div className="form-group">
            <label>Customer Name</label>
            <Select
              isClearable={true}
              value={selectedCustomerName}
              options={allFarmerProfiles.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.farmerCompanyName,
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allFarmerProfiles.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  customerUUID: found?.uuid || "",
                });

                setSelectedCustomerName([
                  {
                    value: found?.uuid || "",

                    label: found?.farmerCompanyName || "",
                  },
                ]);
              }}
            />
          </div> */}
          <div className="form-group">
            <label>Customer Name</label>
            {registerType === "OFFICER" ? (
              <AsyncSelect
                loadOptions={getFarmer}
                className={`form-control`}
                classNamePrefix="select"
                getOptionLabel={(option) =>
                  `${option.farmerCompanyName.toUpperCase()}`
                }
                getOptionValue={(option) => option.uuid}
                autoFocus={true}
                noOptionsMessage={() => "Type to Search"}
                onChange={(selectedValues) => {
                  // console.log({ selectedValues });

                  const found = allFarmerProfiles.find((profile) =>
                    selectedValues ? profile.uuid === selectedValues.uuid : null
                  );
                  setExportFormData({
                    ...exportFormData,
                    customerUUID: found?.uuid || "",
                  });

                  setSelectedCustomerName([
                    {
                      value: found?.uuid || "",
                      label: found?.farmerCompanyName || "",
                    },
                  ]);
                }}
              />
            ) : (
              <Select
                options={allFarmerProfiles}
                className={`form-control`}
                classNamePrefix="select"
                getOptionLabel={(option) =>
                  `${option.farmerCompanyName.toUpperCase()}`
                }
                getOptionValue={(option) => option.uuid}
                autoFocus={true}
                onChange={(selectedValues) => {
                  // console.log({ selectedValues });

                  const found = allFarmerProfiles.find((profile) =>
                    selectedValues ? profile.uuid === selectedValues.uuid : null
                  );
                  setExportFormData({
                    ...exportFormData,
                    customerUUID: found?.uuid || "",
                  });

                  setSelectedCustomerName([
                    {
                      value: found?.uuid || "",
                      label: found?.farmerCompanyName || "",
                    },
                  ]);
                }}
              />
            )}
          </div>
          <br />
          <br />
        </div>
      </FormModal>
      <FormModal
        title={`${!formData._id ? "Add" : "Edit"} Livestock Feed`}
        size="md"
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            quantityKg: 0,
            quantityMt: 0,
            price50Kg: 0,
            priceKg: 0,
          });
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            const { uuid, __typename } = formData;
            if (!uuid) {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await createLivestockFeed({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
            } else {
              const tokenizedPayload = {
                uuid,
                ...formData,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

              await updateLivestockFeed({
                variables: {
                  // uuid,
                  // ...formData,
                  tokenized,
                },
              });
            }
            setSavedCount((savedCount += 1));
            // await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Livestock Feed saved!`,
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
          <label>Month & Year*</label>
          <input
            required
            type="month"
            className="form-control"
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
          <p>
            <label>Supplier Name</label>
          </p>
          <select
            className="form-control"
            value={formData.supplierUUID || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allLivestockSuppliers.find(
                (c) => c.uuid === e.target.value
              );
              setFormData({
                ...formData,
                supplierUUID: found.uuid,
                supplierName: found.supplierName.toUpperCase(),
                livestockUUID: "",
                typeOfLiveStock: "",
                livestockFeedCategoryUUID: "",
                livestockFeedCategory: "",
                livestockFeedCode: "",
              });
            }}
            required
          >
            <option value={""} disabled>
              Select Supplier
            </option>

            {allLivestockSuppliers.map((supplier) => (
              <option value={supplier.uuid}>
                {supplier.supplierName.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <p>
            <label>Type of Livestock</label>
          </p>

          <select
            className="form-control"
            value={formData.livestockUUID || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allLiveStocksBySupplierOnAnimalFeed.find(
                (c) => c.uuid === e.target.value
              );
              setFormData({
                ...formData,
                livestockUUID: found.uuid,
                typeOfLiveStock: found.typeOfLiveStock.toUpperCase(),
                livestockFeedCategoryUUID: "",
                livestockFeedCategory: "",
                livestockFeedCode: "",
              });
            }}
            required
          >
            <option value={""} disabled>
              Select Type of Livestock
            </option>

            {allLiveStocksBySupplierOnAnimalFeed.map((livestock) => (
              <option value={livestock.uuid}>
                {livestock.typeOfLiveStock.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <p>
            <label>Livestock Feed Category</label>
          </p>
          <select
            className="form-control"
            value={formData.livestockFeedCategoryUUID || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allAnimalFeedBySupplierId.find(
                (c) => c.uuid === e.target.value
              );
              setFormData({
                ...formData,
                livestockFeedCategoryUUID: found.uuid,
                livestockFeedCategory: found.category.toUpperCase(),
                livestockFeedCode: found?.code || "",
              });
            }}
            required
          >
            <option value={""} disabled>
              Select Livestock Feed Category
            </option>

            {allAnimalFeedBySupplierId.map((feed) => (
              <option value={feed.uuid}>
                {feed.category.toUpperCase()} - {feed.code}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Livestock Feed Code</label>
          <input
            className="form-control"
            value={formData.livestockFeedCode || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                livestockFeedCode: e.target.value,
              });
            }}
          />
        </div>
        {/* <div className="form-group">
          <p>
            <label>Customer Name</label>
          </p>

          <select
            className="form-control"
            value={formData.customerUUID || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allFarmerProfiles.find(
                (c) => c.uuid === e.target.value
              );
              setFormData({
                ...formData,
                customerUUID: found.uuid,
                customerName: found.farmerCompanyName,
              });
            }}
            required
          >
            <option value={""} disabled>
              Select Customer Name
            </option>

            {allFarmerProfiles.map((profile) => (
              <option value={profile.uuid}>{profile.farmerCompanyName}</option>
            ))}
          </select>
        </div> */}
        <div className="form-group">
          <label>Customer Name</label>
          {registerType === "OFFICER" ? (
            <AsyncSelect
              value={formData.FarmerProfile}
              loadOptions={getFarmer}
              className={`form-control`}
              classNamePrefix="select"
              getOptionLabel={(option) =>
                `${option.farmerCompanyName.toUpperCase()}`
              }
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              noOptionsMessage={() => "Type to Search"}
              onChange={(selectedValues) => {
                const found = allFarmerProfiles.find(
                  (c) => c.uuid === selectedValues.uuid
                );
                setFormData({
                  ...formData,
                  customerUUID: found.uuid,
                  customerName: found.farmerCompanyName.toUpperCase(),
                });
              }}
            />
          ) : (
            <Select
              value={formData.FarmerProfile}
              options={allFarmerProfiles}
              className={`form-control`}
              classNamePrefix="select"
              getOptionLabel={(option) =>
                `${option.farmerCompanyName.toUpperCase()}`
              }
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              onChange={(selectedValues) => {
                const found = allFarmerProfiles.find(
                  (c) => c.uuid === selectedValues.uuid
                );
                setFormData({
                  ...formData,
                  customerUUID: found.uuid,
                  customerName: found.farmerCompanyName.toUpperCase(),
                });
              }}
            />
          )}
        </div>
        <div className="form-group">
          <label>Quantity (kg)</label>
          <NumberFormat
            className="form-control"
            placeholder="0"
            value={formData.quantityKg || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              const quantityKg = e.floatValue;
              const quantityMt = quantityKg / 1000;
              setFormData({
                ...formData,
                quantityKg,
                quantityMt,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Quantity (MT)</label>
          <NumberFormat
            className="form-control"
            disabled
            placeholder="Auto Calculated"
            value={formData.quantityMt || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
          />
        </div>
        <div className="form-group">
          <label>Price ($/50kg)</label>
          <NumberFormat
            className="form-control"
            placeholder="0"
            value={formData.price50Kg || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              const price50Kg = e.floatValue;
              const priceKg = price50Kg / 50;
              setFormData({
                ...formData,
                price50Kg,
                priceKg,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Price ($/kg)</label>
          <NumberFormat
            className="form-control"
            disabled
            placeholder="Auto"
            value={formData.priceKg || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
          />
        </div>
        <div className="form-group">
          <label>Total Value ($)</label>
          <NumberFormat
            className="form-control"
            disabled
            placeholder="Auto Calculated"
            value={formData.totalValue || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
          />
        </div>
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <TableAsync
          customHeaderUtilities={
            <div className="flex">
              <MonthAndYearsFilterWithExport
                label="Month Year Filter"
                controlledValue={yearMonth}
                defaultValue={dayjs().format("YYYY-MM")}
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
                  className={`bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md ${
                    !currentUserDontHavePrivilege([
                      "Livestock Feed Export Excel:Read",
                    ])
                      ? "block"
                      : "hidden"
                  }`}
                  onClick={async (e) => {
                    if (e) e.preventDefault();
                    setExportModalVisible(true);
                  }}
                >
                  Export Excel
                </button>
              </div>
            </div>
          }
          loading={loading}
          columns={columns}
          data={allLivestockFeeds}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege(["Livestock Feed:Update"])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege(["Livestock Feed:Create"])
              ? () => {
                  setFormData({
                    quantityKg: 0,
                    quantityMt: 0,
                    price50Kg: 0,
                    priceKg: 0,
                  });
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Livestock Feed:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} livestock feeds?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteLivestockFeed({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      setSavedCount((savedCount += 1));
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} livestock feeds deleted`,
                        level: "success",
                      });
                      // await refetch();
                    }
                  } catch (err) {
                    handleError(err);
                  }
                  hideLoadingSpinner();
                }
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(page);
