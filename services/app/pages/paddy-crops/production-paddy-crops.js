import React, { useState, useEffect, useMemo, useCallback } from "react";
import { withApollo } from "../../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../../components/App";
import { useNotification } from "../../components/Notification";
import { handleError } from "../../libs/errors";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import TableAsync from "../../components/TableAsync";
import Table from "../../components/Table";
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
import NumberFormat from "react-number-format";
import Select from "react-select";
import dayjs from "dayjs";
import { MonthAndYearsFilterWithExport } from "../../components/MonthAndYearsFilterWithExport";
import lodash from "lodash";
import AsyncSelect from "react-select/async";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERIES = gql`
  query listQueries($monthYear: String!, $filters: String) {
    tokenizedAllCropsPaddyVarieties

    tokenizedAllSeasons

    countAllPaddyProductions(monthYear: $monthYear, filters: $filters)
  }
`;

const PADDY_PRODUCTION_QUERIES = gql`
  query productionQueries(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllPaddyProductions(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllPaddyProductions(monthYear: $monthYear, filters: $filters)
  }
`;

const FARM_AREA_QUERY = gql`
  query farmAreaQuery($tokenizedParams: String!, $onPage: String) {
    tokenizedAllFarmProfilesByFarmer(
      tokenizedParams: $tokenizedParams
      onPage: $onPage
    )
  }
`;

const SEARCH_FARMER_QUERY = gql`
  query searchQuery($name: String!) {
    searchAllFarmerProfilesByFarmerName(name: $name)
  }
`;

const SEARCH_FARM_QUERY = gql`
  query searchFarmProfileByFarmerName($farmerName: String) {
    searchFarmProfileByFarmerName(farmerName: $farmerName)
  }
`;

const SEARCH_FARMER_QUERY_BY_COMPANY_NAME = gql`
  query searchQuery($name: String!) {
    searchFarmerProfileByCompanyRegNo(name: $name)
  }
`;

const CREATE_PADDY_PRODUCTION = gql`
  mutation tokenizedCreatePaddyProduction($tokenized: String!) {
    tokenizedCreatePaddyProduction(tokenized: $tokenized)
  }
`;

const UPDATE_PADDY_PRODUCTION = gql`
  mutation tokenizedUpdatePaddyProduction($tokenized: String!) {
    tokenizedUpdatePaddyProduction(tokenized: $tokenized)
  }
`;

const DELETE_PADDY_PRODUCTION = gql`
  mutation tokenizedDeletePaddyProduction($tokenized: String!) {
    tokenizedDeletePaddyProduction(tokenized: $tokenized)
  }
`;

const EXPORT_PADDY_PRODUCTION = gql`
  mutation exportPaddyProduction(
    $monthYear: String!
    $farmerUUID: String
    $farmAreaId: String
    $cropsPaddyVarietyUUID: String
    $farmerName: String
  ) {
    exportPaddyProduction(
      monthYear: $monthYear
      farmerUUID: $farmerUUID
      farmAreaId: $farmAreaId
      cropsPaddyVarietyUUID: $cropsPaddyVarietyUUID
      farmerName: $farmerName
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
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [exportFormData, setExportFormData] = useState({});
  const notification = useNotification();
  const [registerType, setRegisterType] = useState("");
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const client = useApolloClient();
  let [savedCount, setSavedCount] = useState(0);

  let [countPaddyProduction, setCountPaddyProduction] = useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countPaddyProduction) return 1;
    return Math.ceil(countPaddyProduction / pageSize);
  }, [countPaddyProduction, pageSize]);

  let farmerUUID = "";
  let tokenizedParams = "";
  if (formData.farmerUUID) {
    farmerUUID = formData.farmerUUID;
    const payload = { farmerUUID };
    tokenizedParams = jwt.sign(payload, TOKENIZE);
  }

  const { data, error, loading, refetch } = useQuery(QUERIES, {
    variables: {
      // tokenizedParams,
      monthYear: yearMonth,
      filters: router.query.filters,
    },
  });
  const [createPaddyProduction] = useMutation(CREATE_PADDY_PRODUCTION);
  const [updatePaddyProduction] = useMutation(UPDATE_PADDY_PRODUCTION);
  const [deletePaddyProduction] = useMutation(DELETE_PADDY_PRODUCTION);
  const [exportPaddyProduction] = useMutation(EXPORT_PADDY_PRODUCTION);
  const [selectedPaddy, setSelectedPaddy] = useState({});

  const [selectedCompany, setSelectedCompany] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const [selectedFarmArea, setSelectedFarmArea] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const [selectedExportFarmerName, setSelectedExportFarmerName] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const [autoCalculate, setAutoCalculated] = useState({
    totalPaddyProduction: 0,
    schemeValue: 0,
    totalValue: 0,
  });

  const [allFarmerProfilesByCompanyRegNo, setAllFarmerProfilesByCompanyRegNo] =
    useState([]);
  const [allPaddyProductions, setAllPaddyProductions] = useState([]);
  const [allFarmProfilesByFarmer, setAllFarmProfilesByFarmer] = useState([]);
  const [allCropsPaddyVarieties, setAllCropsPaddyVarieties] = useState([]);
  const [allSeasons, setAllSeasons] = useState([]);
  const [allFarmProfile, setAllFarmProfile] = useState([]);
  const [
    allFarmProfilesByFarmerForExport,
    setAllFarmProfilesByFarmerForExport,
  ] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedFarmerProfilesByCompanyRegNo = data?.tokenizedAllFarmerProfilesByCompanyRegNo || "";
      // let allFarmerProfilesByCompanyRegNo = [];
      // if (encryptedFarmerProfilesByCompanyRegNo) {
      //   const decrypted = jwt.verify(encryptedFarmerProfilesByCompanyRegNo, TOKENIZE);
      //   allFarmerProfilesByCompanyRegNo = decrypted.queryResult;
      //   setAllFarmerProfilesByCompanyRegNo(allFarmerProfilesByCompanyRegNo);
      // }

      // const encryptedPaddyProductions =
      //   data?.tokenizedAllPaddyProductions || "";
      // let allPaddyProductions = [];
      // if (encryptedPaddyProductions) {
      //   const decrypted = jwt.verify(encryptedPaddyProductions, TOKENIZE);
      //   allPaddyProductions = decrypted.queryResult;
      //   setAllPaddyProductions(allPaddyProductions);
      // }

      // const encryptedFarmProfilesByFarmer =
      //   data?.tokenizedAllFarmProfilesByFarmer || "";
      // let allFarmProfilesByFarmer = [];
      // if (encryptedFarmProfilesByFarmer) {
      //   const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
      //   allFarmProfilesByFarmer = decrypted.queryResult;
      //   setAllFarmProfilesByFarmer(allFarmProfilesByFarmer);
      // }

      const encryptedCropsPaddyVarieties =
        data?.tokenizedAllCropsPaddyVarieties || "";
      let allCropsPaddyVarieties = [];
      if (encryptedCropsPaddyVarieties) {
        const decrypted = jwt.verify(encryptedCropsPaddyVarieties, TOKENIZE);
        allCropsPaddyVarieties = decrypted.queryResult;
        setAllCropsPaddyVarieties(allCropsPaddyVarieties);
      }

      const encryptedSeasons = data?.tokenizedAllSeasons || "";
      let allSeasons = [];
      if (encryptedSeasons) {
        const decrypted = jwt.verify(encryptedSeasons, TOKENIZE);
        allSeasons = decrypted.queryResult;
        setAllSeasons(allSeasons);
      }

      const countData = data?.countAllPaddyProductions || 0;
      setCountPaddyProduction(countData);
    }
  }, [data, loading, error, savedCount]);

  useEffect(async () => {
    const result = await client.query({
      query: PADDY_PRODUCTION_QUERIES,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedPaddyProductions =
      result.data?.tokenizedAllPaddyProductions || "";
    let allPaddyProductions = [];
    if (encryptedPaddyProductions) {
      const decrypted = jwt.verify(encryptedPaddyProductions, TOKENIZE);
      allPaddyProductions = decrypted.queryResult;
      setAllPaddyProductions(allPaddyProductions);
    }

    const countData = result.data?.countAllPaddyProductions || 0;

    setCountPaddyProduction(countData);
  }, [savedCount, yearMonth, pageIndex, pageSize, router.query.filters]);

  useEffect(async () => {
    const result = await client.query({
      query: FARM_AREA_QUERY,
      variables: {
        tokenizedParams,
        onPage: "PADDY PRODUCTION",
      },
      fetchPolicy: "no-cache",
    });

    const encryptedFarmProfilesByFarmer =
      result.data?.tokenizedAllFarmProfilesByFarmer || "";
    let allFarmProfilesByFarmer = [];
    if (encryptedFarmProfilesByFarmer) {
      const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
      allFarmProfilesByFarmer = decrypted.queryResult;
      allFarmProfilesByFarmer = lodash.uniqBy(
        allFarmProfilesByFarmer,
        "farmArea"
      );
      setAllFarmProfilesByFarmer(allFarmProfilesByFarmer);
      setAllFarmProfilesByFarmerForExport(allFarmProfilesByFarmer);
    }
    hideLoadingSpinner();
  }, [tokenizedParams]);

  const fethchingFarmer = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_FARMER_QUERY,
      variables: {
        name: input,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedFarmerProfilesByFarmerName =
      result.data?.searchAllFarmerProfilesByFarmerName || "";
    let allFarmerProfilesByFarmerName = [];
    if (encryptedFarmerProfilesByFarmerName) {
      const decrypted = jwt.verify(
        encryptedFarmerProfilesByFarmerName,
        TOKENIZE
      );
      allFarmerProfilesByFarmerName = decrypted.queryResult;
      setAllFarmerProfilesByCompanyRegNo(allFarmerProfilesByFarmerName);
    }

    callback(allFarmerProfilesByFarmerName);
  };

  const handlePageChange = useCallback(
    async ({ pageIndex, pageSize, filters }) => {
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

  const getFarmer = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fethchingFarmer(input, callback);
    }
  };

  const fethchingFarmerComp = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_FARMER_QUERY_BY_COMPANY_NAME,
      variables: {
        name: input,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedFarmerProfileByCompanyRegNo =
      result.data?.searchFarmerProfileByCompanyRegNo || "";
    let allFarmerProfileByCompanyRegNo = [];
    if (encryptedFarmerProfileByCompanyRegNo) {
      const decrypted = jwt.verify(
        encryptedFarmerProfileByCompanyRegNo,
        TOKENIZE
      );
      allFarmerProfileByCompanyRegNo = decrypted.queryResult;
      setAllFarmerProfilesByCompanyRegNo(allFarmerProfileByCompanyRegNo);
    }

    callback(allFarmerProfileByCompanyRegNo);
  };

  const getFarmerComp = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fethchingFarmerComp(input, callback);
    }
  };

  const fetchFarmProfile = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_FARM_QUERY,
      variables: {
        farmerName: input,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedFarmProfile =
      result.data?.searchFarmProfileByFarmerName || "";
    let allFarmProfile = [];
    if (encryptedFarmProfile) {
      const decrypted = jwt.verify(encryptedFarmProfile, TOKENIZE);
      allFarmProfile = decrypted.queryResult;
      setAllFarmProfile(allFarmProfile);
    }
  };

  const getFarmProfile = (input) => {
    if (!input) {
      setAllFarmProfile([]);
    } else {
      fetchFarmProfile(input);
    }
  };

  // const encryptedFarmerProfilesByCompanyRegNo =
  //   data?.tokenizedAllFarmerProfilesByCompanyRegNo || "";
  // let allFarmerProfilesByCompanyRegNo = [];
  // if (encryptedFarmerProfilesByCompanyRegNo) {
  //   const decrypted = jwt.verify(
  //     encryptedFarmerProfilesByCompanyRegNo,
  //     TOKENIZE
  //   );
  //   allFarmerProfilesByCompanyRegNo = decrypted.queryResult;
  // }

  // const encryptedPaddyProductions = data?.tokenizedAllPaddyProductions || "";
  // let allPaddyProductions = [];
  // if (encryptedPaddyProductions) {
  //   const decrypted = jwt.verify(encryptedPaddyProductions, TOKENIZE);
  //   allPaddyProductions = decrypted.queryResult;
  // }

  // const encryptedFarmProfilesByFarmer =
  //   data?.tokenizedAllFarmProfilesByFarmer || "";
  // let allFarmProfilesByFarmer = [];
  // if (encryptedFarmProfilesByFarmer) {
  //   const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
  //   allFarmProfilesByFarmer = decrypted.queryResult;
  // }

  // const encryptedCropsPaddyVarieties =
  //   data?.tokenizedAllCropsPaddyVarieties || "";
  // let allCropsPaddyVarieties = [];
  // if (encryptedCropsPaddyVarieties) {
  //   const decrypted = jwt.verify(encryptedCropsPaddyVarieties, TOKENIZE);
  //   allCropsPaddyVarieties = decrypted.queryResult;
  // }

  // const encryptedSeasons = data?.tokenizedAllSeasons || "";
  // let allSeasons = [];
  // if (encryptedSeasons) {
  //   const decrypted = jwt.verify(encryptedSeasons, TOKENIZE);
  //   allSeasons = decrypted.queryResult;
  // }

  // let allFarmProfilesByFarmerForExport = allFarmProfilesByFarmer || [];

  // allFarmProfilesByFarmerForExport = lodash.uniqBy(
  //   allFarmProfilesByFarmerForExport,
  //   (farm) => farm.farmArea
  // );

  useEffect(() => {
    // const interval = setInterval(async () => {
    const totalPaddyProduction =
      formData.productionUnderPaddyScheme +
      formData.productionUnderNonPaddyScheme;
    const schemeValue =
      formData.schemePrice * formData.productionUnderPaddyScheme;
    const totalValue = totalPaddyProduction * formData.marketPrice;

    setAutoCalculated({
      totalPaddyProduction,
      schemeValue,
      totalValue,
    });
    //   setFormData({
    //     ...formData,
    //     totalPaddyProduction,
    //     schemeValue,
    //     totalValue,
    //   });
    // }, 1000);
    // // Cleanup function to stop the interval when the component is unmounted
    // return () => {
    //   clearInterval(interval);
    // };
  }, [
    formData.productionUnderNonPaddyScheme,
    formData.productionUnderPaddyScheme,
    formData.schemePrice,
    formData.productionUnderPaddyScheme,
    formData.marketPrice,
  ]);

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
                const totalPaddyProduction =
                  props.row.original.productionUnderPaddyScheme +
                  props.row.original.productionUnderNonPaddyScheme;
                const schemeValue =
                  props.row.original.schemePrice *
                  props.row.original.productionUnderPaddyScheme;
                const totalValue =
                  totalPaddyProduction * props.row.original.marketPrice;

                setModalVisible(true);
                setFormData({
                  ...props.row.original,
                  totalPaddyProduction,
                  schemeValue,
                  totalValue,
                  seasonUUID: props.row.original?.Season?.uuid || "",
                  cropsPaddyVarietyUUID: props.row.original?.Paddy?.uuid || "",

                  farmAreaId: props.row.original?.FarmProfile?.uuid || "",
                  farmArea: props.row.original?.FarmProfile?.farmArea || "",
                  farmMukim: props.row.original?.FarmProfile?.farmMukim || "",
                  farmDistrict:
                    props.row.original?.FarmProfile?.farmDistrict || "",

                  farmerUUID: props.row.original?.FarmerProfile?.uuid || "",
                  farmerName:
                    props.row.original?.FarmerProfile?.farmerName || "",

                  farmerCompanyName:
                    props.row.original?.FarmerProfile?.farmerCompanyName || "",

                  varietyName: props.row.original?.Paddy?.varietyName || "",
                  paddyId: props.row.original?.Paddy?.paddyId || "",
                });
                setAutoCalculated({
                  totalPaddyProduction,
                  schemeValue,
                  totalValue,
                });
                setSelectedCompany([
                  {
                    label:
                      props.row.original?.FarmerProfile?.farmerCompanyName ||
                      "",
                    value: props.row.original?.FarmerProfile?.uuid || "",
                  },
                ]);
                setSelectedFarmArea([
                  {
                    label: props.row.original?.FarmProfile?.farmArea || "",
                    value: props.row.original?.FarmProfile?.uuid || "",
                  },
                ]);

                setSelectedPaddy([
                  {
                    value: props.row.original?.Paddy?.uuid || "",
                    label: props.row.original?.Paddy?.varietyName || "",
                  },
                ]);
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
      Header: "Harvested Month & Year",
      accessor: "harvestedDate",
      style: {
        fontSize: 20,
        width: 250,
      },
      Cell: (props) => <span>{dayjs(props.value).format("YYYY-MM")}</span>,
    },
    {
      Header: "Planting Month & Year",
      accessor: "plantingDate",
      style: {
        fontSize: 20,
        width: 250,
      },
      Cell: (props) => <span>{dayjs(props.value).format("YYYY-MM")}</span>,
      disableFilters: true,
    },
    {
      Header: "Farmer Name",
      accessor: "FarmerProfile.farmerName",
      style: {
        fontSize: 20,
        width: 250,
      },
      // Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Company Name",
      accessor: "FarmerProfile.farmerCompanyName",
      style: {
        fontSize: 20,
        width: 250,
      },
      // Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Farm ID",
      accessor: "FarmProfile.farmId",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Farm Area",
      accessor: "FarmProfile.farmArea",
      style: {
        fontSize: 20,
        width: 250,
      },
      // Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Paddy Variety",
      accessor: "Paddy.varietyName",
      style: {
        fontSize: 20,
        width: 250,
      },
      // Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Production Under Paddy Scheme (Kg)",
      accessor: "productionUnderPaddyScheme",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Production Under Non-Paddy Scheme (Kg)",
      accessor: "productionUnderNonPaddyScheme",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Total Paddy Production (Kg)",
      accessor: "totalPaddyProduction",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Scheme Value ($)",
      accessor: "schemeValue",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Total Value ($)",
      accessor: "totalValue",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Planting Season",
      accessor: "Season.name",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      // Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
  ]);

  const columnsCompany = useMemo(() => [
    {
      Header: "",
      accessor: "select",
      style: {
        fontSize: 20,
        width: 100,
      },
      Cell: (props) => {
        return (
          <button
            className={`bg-mantis-500 hover:bg-mantis-700 text-white font-bold py-2 px-4 rounded`}
            onClick={async (e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                farmerUUID: props.row.original.farmerUUID || "",
                farmerCompanyName: props.row.original.farmerCompanyName || "",
                farmerName: props.row.original.farmerName || "",
                farmAreaId: props.row.original.uuid || "",
                farmAddress: props.row.original.address || "",
                farmMukim: props.row.original.farmMukim || "",
                farmVillage: props.row.original.farmVillage || "",
                farmArea: props.row.original.farmArea || "",
                farmDistrict: props.row.original.farmDistrict || "",
              });
              setCompanyModalVisible(false);
              setModalVisible(true);
            }}
          >
            Select
          </button>
        );
      },
    },
    {
      Header: "Farm ID",
      accessor: "farmId",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Farmer Name",
      accessor: "farmerName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Company Name",
      accessor: "farmerCompanyName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Mukim",
      accessor: "farmMukim",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Farm Area",
      accessor: "farmArea",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Address",
      accessor: "address",
      style: {
        fontSize: 20,
      },
    },
  ]);

  return (
    <AdminArea header={{ title: "Production" }} urlQuery={router.query}>
      {/* Modal Exports */}
      <FormModal
        title={`Export Production`}
        visible={exportModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setExportModalVisible(false);
          setExportFormData({});
          setSelectedCompany([]);
          setSelectedFarmArea([]);
          setSelectedPaddy([]);
          setSelectedExportFarmerName([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setExportModalVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportPaddyProduction({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            // Convert base64 to blob
            const base64Response = response.data.exportPaddyProduction;
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
            link.download = "paddy_production.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);

            // Convert base64 to blob
            // window.open(response.data.exportPaddyProduction, "__blank");
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}
      >
        <div>
          <MonthAndYearsFilterWithExport
            label="Month Year Filter"
            // defaultValue={dayjs().format("YYYY-MM")}
            isDisabled={true}
            controlledValue={yearMonth}
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
            <label>Company Name*</label>
            <Select
              isClearable={true}
              value={selectedCompany}
              options={allFarmerProfilesByCompanyRegNo.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.farmerCompanyName,
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allFarmerProfilesByCompanyRegNo.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  farmerUUID: found?.uuid || "",
                });

                setSelectedCompany([
                  {
                    value: found?.uuid || "",
                    label: found?.farmerCompanyName || "",
                  },
                ]);
              }}
            />
          </div> */}
          <div className="form-group">
            <label>Company Name*</label>
            <AsyncSelect
              loadOptions={getFarmerComp}
              className={`form-control`}
              classNamePrefix="select"
              noOptionsMessage={() => "Type to Search"}
              getOptionLabel={(option) => `${option.farmerCompanyName}`}
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allFarmerProfilesByCompanyRegNo.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.uuid : null
                );
                setFormData({
                  ...formData,
                  FarmerProfile: found,
                  farmerUUID: found?.uuid || "",
                });

                setExportFormData({
                  ...exportFormData,
                  farmerUUID: found?.uuid || "",
                });

                setSelectedCompany([
                  {
                    value: found?.uuid || "",
                    label: found?.farmerCompanyName || "",
                  },
                ]);
              }}
            />
          </div>
          <div className="form-group">
            <label>Farm Area</label>
            <Select
              isClearable={true}
              value={selectedFarmArea}
              options={allFarmProfilesByFarmerForExport.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.farmArea,
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allFarmProfilesByFarmerForExport.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  farmAreaId: found?.uuid || "",
                });

                setSelectedFarmArea([
                  {
                    value: found?.uuid || "",
                    label: found?.farmArea || "",
                  },
                ]);
              }}
            />
          </div>

          <div className="form-group">
            <label>Farmer Name</label>
            <Select
              value={selectedExportFarmerName}
              options={allFarmerProfilesByCompanyRegNo
                .filter((pr) => pr.uuid === exportFormData.farmerUUID)
                .map((prof) => {
                  return {
                    value: prof.uuid,
                    label: prof.farmerName,
                  };
                })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                const found = allFarmerProfilesByCompanyRegNo.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  farmerName: found?.farmerName || "",
                });
                setSelectedExportFarmerName([
                  {
                    value: found?.uuid || "",
                    label: found?.farmerName || "",
                  },
                ]);
              }}
              isClearable={true}
            />
          </div>

          <div className="form-group">
            <label>Paddy Name</label>
            <Select
              className="form-control"
              isClearable={true}
              value={selectedPaddy}
              required
              options={allCropsPaddyVarieties.map((pr) => {
                return {
                  value: pr.uuid,
                  label: `${pr.varietyName}`,
                };
              })}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                const found = allCropsPaddyVarieties.find((p) =>
                  selectedValues ? p.uuid === selectedValues.value : null
                );

                setExportFormData({
                  ...exportFormData,
                  cropsPaddyVarietyUUID: found?.uuid || "",
                });
                setSelectedPaddy([
                  {
                    label: found?.varietyName || "",
                    value: found?.uuid || "",
                  },
                ]);
              }}
            />
          </div>
          <br />
          <br />
        </div>
      </FormModal>
      <FormModal
        title={`${!formData.uuid ? "Add" : "Edit"} Paddy Production`}
        visible={modalVisible}
        size="md"
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            totalArea: 0,
            cultivatedArea: 0,
            productionUnderPaddyScheme: 0,
            productionUnderNonPaddyScheme: 0,
            totalPaddyProduction: 0,

            schemePrice: 0,
            marketPrice: 0,
            schemeValue: 0,
            totalValue: 0,
          });
          setSelectedCompany([]);
          setSelectedFarmArea([]);
          setSelectedPaddy([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { uuid, __typename, __createdAt, __updatedAt } = formData;
            if (!uuid) {
              const newData = {
                ...formData,
                ...autoCalculate,
              };
              const tokenized = jwt.sign(newData, TOKENIZE);
              await createPaddyProduction({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });
              setModalVisible(false);
              setFormData({
                totalArea: 0,
                cultivatedArea: 0,
                productionUnderPaddyScheme: 0,
                productionUnderNonPaddyScheme: 0,
                totalPaddyProduction: 0,

                schemePrice: 0,
                marketPrice: 0,
                schemeValue: 0,
                totalValue: 0,
              });
              setModalVisible(true);
              setSelectedCompany([]);
              setSelectedFarmArea([]);
              setSelectedPaddy([]);
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updatePaddyProduction({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });
            }
            setSavedCount((savedCount += 1));
            await refetch();

            setModalVisible(false);
            setFormData({
              totalArea: 0,
              cultivatedArea: 0,
              productionUnderPaddyScheme: 0,
              productionUnderNonPaddyScheme: 0,
              totalPaddyProduction: 0,

              schemePrice: 0,
              marketPrice: 0,
              schemeValue: 0,
              totalValue: 0,
            });
            setSelectedCompany([]);
            setSelectedFarmArea([]);
            setSelectedPaddy([]);
            notification.addNotification({
              title: "Succeess!",
              message: `Production saved!`,
              level: "success",
            });
          } catch (error) {
            notification.handleError(error);
          }
          hideLoadingSpinner();
        }}
      >
        {/* <div className="form-group">
          <label>Farmer Name*</label>
          <Select
            value={selectedCompany}
            options={allFarmerProfilesByCompanyRegNo.map((prof) => {
              return {
                value: prof.uuid,
                label: prof.farmerName,
              };
            })}
            className={`form-control`}
            classNamePrefix="select"
            onChange={(selectedValues) => {
              // console.log({ selectedValues });

              const found = allFarmerProfilesByCompanyRegNo.find(
                (profile) => profile.uuid === selectedValues.value
              );
              setFormData({
                ...formData,
                farmerUUID: found?.uuid || "",
                farmerCompanyName: found?.farmerCompanyName || "",
              });

              setSelectedCompany([
                {
                  value: found.uuid,
                  label: found.farmerName,
                },
              ]);
            }}
          />
        </div> */}
        <div className="form-group">
          <label>Farmer Name*</label>
          {/* <AsyncSelect
            value={formData?.FarmerProfile || ""}
            loadOptions={getFarmer}
            className={`form-control uppercase`}
            classNamePrefix="select"
            noOptionsMessage={() => "Type to Search"}
            getOptionLabel={(option) => `${option.farmerName}`}
            getOptionValue={(option) => option.uuid}
            autoFocus={true}
            onChange={(selectedValues) => {
              // console.log({ selectedValues });

              const found = allFarmerProfilesByCompanyRegNo.find(
                (profile) => profile.uuid === selectedValues.uuid
              );
              setFormData({
                ...formData,
                FarmerProfile: found,
                farmerUUID: found?.uuid || "",
                farmerCompanyName: found?.farmerCompanyName || "",
              });

              setSelectedCompany([
                {
                  value: found.uuid,
                  label: found.farmerName,
                },
              ]);
            }}
          /> */}
          <input
            className="form-control uppercase"
            value={formData.farmerName || ""}
            disabled
          />
        </div>
        <div className="form-group">
          <label>Company Name</label>
          <input
            disabled
            placeholder="Auto Filled"
            className="form-control uppercase"
            value={formData.farmerCompanyName || ""}
          />
        </div>
        <button
          className="bg-purple-500 rounded-md mt-2 text-white py-2 px-3 shadow-md w-full"
          onClick={async (e) => {
            if (e) e.preventDefault();

            const result = await client.query({
              query: IS_CHECK_FARMER,
              fetchPolicy: "no-cache",
            });

            const farmerCheck = result.data.isFarmerCheck;

            if (farmerCheck) {
              const result = await client.query({
                query: SEARCH_FARM_QUERY,
                variables: {},
                fetchPolicy: "no-cache",
              });

              const encryptedFarmProfile =
                result.data?.searchFarmProfileByFarmerName || "";
              let allFarmProfile = [];
              if (encryptedFarmProfile) {
                const decrypted = jwt.verify(encryptedFarmProfile, TOKENIZE);
                allFarmProfile = decrypted.queryResult;
                setAllFarmProfile(allFarmProfile);
              }

              setRegisterType("FARMER");
            } else {
              setAllFarmProfile([]);
              setRegisterType("OFFICER");
            }

            setCompanyModalVisible(true);
            setModalVisible(false);
          }}
        >
          <i className="fa fa-search" /> Select and Search
        </button>
        <div className="form-group">
          <label>Farm Area</label>
          {/* <Select
            value={selectedFarmArea}
            options={allFarmProfilesByFarmer.map((prof) => {
              return {
                value: prof.uuid,
                label: prof.farmArea,
              };
            })}
            className={`form-control uppercase`}
            classNamePrefix="select"
            onChange={(selectedValues) => {
              // console.log({ selectedValues });

              const found = allFarmProfilesByFarmer.find(
                (profile) => profile.uuid === selectedValues.value
              );
              setFormData({
                ...formData,
                farmAreaId: found?.uuid || "",
                farmAddress: found?.address || "",
                farmerName: found?.farmerName || "",

                farmMukim: found?.farmMukim || "",
                farmVillage: found?.farmVillage || "",
                farmArea: found?.farmArea || "",
                farmDistrict: found?.farmDistrict || "",
              });

              setSelectedFarmArea([
                {
                  value: found.uuid,
                  label: found.farmArea,
                },
              ]);
            }}
          /> */}
          <input
            className="form-control"
            value={formData.farmArea || ""}
            disabled
          />
        </div>
        <div className="form-group">
          <label>District</label>
          <input
            disabled
            placeholder="Auto Filled"
            className="form-control uppercase"
            value={formData.farmDistrict || ""}
          />
        </div>
        <div className="form-group">
          <label>Mukim</label>
          <input
            disabled
            placeholder="Auto Filled"
            className="form-control uppercase"
            value={formData.farmMukim || ""}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-5">
          <div>
            <div className="form-group">
              <label>Planting Month & Year*</label>
              <input
                required
                type="month"
                className="form-control uppercase"
                value={formData.plantingDate || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    plantingDate: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Paddy Variety</label>
              <Select
                value={selectedPaddy}
                options={allCropsPaddyVarieties.map((prof) => {
                  return {
                    value: prof.uuid,
                    label: prof.varietyName,
                  };
                })}
                className={`form-control uppercase p-0`}
                classNamePrefix="select"
                onChange={(selectedValues) => {
                  // console.log({ selectedValues });

                  const found = allCropsPaddyVarieties.find(
                    (profile) => profile.uuid === selectedValues.value
                  );
                  setFormData({
                    ...formData,
                    cropsPaddyVarietyUUID: found.uuid,
                    paddyId: found.paddyId,
                    schemePrice: found?.schemePrice || 0,
                    marketPrice: found?.marketPrice || 0,
                  });

                  setSelectedPaddy([
                    {
                      value: found.uuid,
                      label: found.varietyName,
                    },
                  ]);
                }}
              />
            </div>
            <div className="form-group">
              <label>Total Area</label>
              <NumberFormat
                placeholder="0"
                className="form-control"
                value={formData.totalArea || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={3}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    totalArea: parseFloat(e.value) || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Production Under Paddy Scheme (Kg)</label>
              <NumberFormat
                placeholder="0"
                className="form-control"
                value={formData.productionUnderPaddyScheme || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    productionUnderPaddyScheme: parseFloat(e.value) || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Total Paddy Production (Kg)</label>
              <NumberFormat
                disabled
                placeholder="Auto Calculated"
                className="form-control"
                // value={formData.totalPaddyProduction || ""}
                value={autoCalculate.totalPaddyProduction}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setAutoCalculated({
                    ...autoCalculate,
                    totalPaddyProduction: parseFloat(e.value) || 0,
                  });
                  // setFormData({
                  //   ...formData,
                  //   totalPaddyProduction: parseFloat(e.value) || 0,
                  // });
                }}
              />
            </div>
            <div className="form-group">
              <label>Market Price ($/Kg)</label>
              <NumberFormat
                placeholder="0"
                className="form-control"
                value={formData.marketPrice || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    marketPrice: parseFloat(e.value) || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Total Value ($)</label>
              <NumberFormat
                disabled
                placeholder="Auto Calculated"
                className="form-control"
                // value={formData.totalValue || ""}
                value={autoCalculate.totalValue || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setAutoCalculated({
                    ...autoCalculate,
                    autoCalculate: parseFloat(e.floatValue) || 0,
                  });
                  // setFormData({
                  //   ...formData,
                  //   totalValue: parseFloat(e.value) || 0,
                  // });
                }}
              />
            </div>
          </div>
          <div>
            <div className="form-group">
              <label>Harvested Month & Year*</label>
              <input
                required
                type="month"
                className="form-control uppercase"
                value={formData.harvestedDate || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    harvestedDate: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Paddy ID</label>
              <input
                className="form-control"
                disabled
                placeholder="Auto Filled"
                value={formData.paddyId || ""}
              />
            </div>
            <div className="form-group">
              <label>Cultivated Area (Ha)</label>
              <NumberFormat
                placeholder="0"
                className="form-control"
                value={formData.cultivatedArea || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={3}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    cultivatedArea: parseFloat(e.value) || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Production Under Non-Paddy Scheme (Kg)</label>
              <NumberFormat
                placeholder="0"
                className="form-control"
                value={formData.productionUnderNonPaddyScheme || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    productionUnderNonPaddyScheme: parseFloat(e.value) || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Scheme Price ($/Kg)</label>
              <NumberFormat
                placeholder="0"
                className="form-control"
                value={formData.schemePrice || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    schemePrice: parseFloat(e.value) || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Scheme Value ($)</label>
              <NumberFormat
                disabled
                placeholder="Auto Calculated"
                className="form-control"
                // value={formData.schemeValue || ""}
                value={autoCalculate.schemeValue || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setAutoCalculated({
                    ...autoCalculate,
                    schemeValue: parseFloat(e.value) || 0,
                  });
                  // setFormData({
                  //   ...formData,
                  //   schemeValue: parseFloat(e.value) || 0,
                  // });
                }}
              />
            </div>
            <div className="form-group">
              <label>Planting Season</label>
              <select
                className="form-control uppercase"
                value={formData.seasonUUID || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    seasonUUID: e.target.value,
                  });
                }}
              >
                <option value="" disabled>
                  Select Planting Season
                </option>
                {allSeasons.map((season) => (
                  <option value={season.uuid}>{season.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label>Planting Season Detail</label>
          <input
            className="form-control uppercase"
            value={formData.plantingSeasonDetail || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                plantingSeasonDetail: e.target.value,
              });
            }}
          />
        </div>
      </FormModal>
      {/* Modal Search company*/}
      <FormModal
        title={"Select Company"}
        size={"xl"}
        visible={companyModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setCompanyModalVisible(false);
          setModalVisible(true);
        }}
      >
        <Table
          columns={columnsCompany}
          data={allFarmProfile}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex items-start">
              {registerType === "OFFICER" ? (
                <div className="form-group">
                  <label>Search By Farm ID or Farmer Name</label>
                  <input
                    className="form-control w-full"
                    onChange={(e) => {
                      getFarmProfile(e.target.value);
                    }}
                  />
                </div>
              ) : null}
            </div>
          }
        />
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
                      "Paddy Production Export Excel:Read",
                    ])
                      ? "block"
                      : "hidden"
                  }`}
                  onClick={async (e) => {
                    if (e) e.preventDefault();
                    setExportModalVisible(true);
                    // showLoadingSpinner();
                    // try {
                    //   const response = await exportPaddyProduction({
                    //     variables: {
                    //       monthYear: yearMonth,
                    //     },
                    //   });

                    //   window.open(
                    //     response.data.exportPaddyProduction,
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
          data={allPaddyProductions}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege(["Paddy Production:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege(["Paddy Production:Create"])
              ? () => {
                  setFormData({
                    totalArea: 0,
                    cultivatedArea: 0,
                    productionUnderPaddyScheme: 0,
                    productionUnderNonPaddyScheme: 0,
                    totalPaddyProduction: 0,

                    schemePrice: 0,
                    marketPrice: 0,
                    schemeValue: 0,
                    totalValue: 0,
                  });
                  setSelectedCompany([]);
                  setSelectedFarmArea([]);
                  setSelectedPaddy([]);
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Paddy Production:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} productions?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deletePaddyProduction({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      setSavedCount((savedCount += 1));
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} productions deleted`,
                        level: "success",
                      });
                      await refetch();
                    }
                  } catch (error) {
                    notification.handleError(error);
                  }
                  hideLoadingSpinner();
                }
              : null
          }
        />
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(page);
