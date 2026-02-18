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
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";
import { MonthAndYearsFilterWithExport } from "../../components/MonthAndYearsFilterWithExport";
import AsyncSelect from "react-select/async";
import lodash from "lodash";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERIES = gql`
  query listQueries($monthYear: String!, $filters: String) {
    tokenizedAllCropsPaddySeedVarieties

    tokenizedAllSeasons

    countPaddySeedProductions(monthYear: $monthYear, filters: $filters)
  }
`;

const PRODUCTION_QUERY = gql`
  query productionQuery(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllPaddySeedProductions(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countPaddySeedProductions(monthYear: $monthYear, filters: $filters)
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

const GET_SEED_PADDY_PRODUCTION_DETAILS = gql`
  query tokenizedAllPaddySeedProductionDetailsByProductionUUID(
    $tokenizedParams: String!
  ) {
    tokenizedAllPaddySeedProductionDetailsByProductionUUID(
      tokenizedParams: $tokenizedParams
    )
  }
`;

const SEARCH_FARMER_QUERY = gql`
  query searchQuery($name: String!) {
    searchAllFarmerProfilesByFarmerName(name: $name)
  }
`;

const SEARCH_FARMER_QUERY_BY_COMPANY_NAME = gql`
  query searchQuery($name: String!) {
    searchFarmerProfileByCompanyRegNo(name: $name)
  }
`;

const SEARCH_FARM_QUERY = gql`
  query searchFarmProfileByFarmerName($farmerName: String) {
    searchFarmProfileByFarmerName(farmerName: $farmerName)
  }
`;

const CREATE_SEED_PADDY_PRODUCTION = gql`
  mutation tokenizedCreatePaddySeedProduction($tokenized: String!) {
    tokenizedCreatePaddySeedProduction(tokenized: $tokenized)
  }
`;

const UPDATE_SEED_PADDY_PRODUCTION = gql`
  mutation tokenizedUpdatePaddySeedProduction($tokenized: String!) {
    tokenizedUpdatePaddySeedProduction(tokenized: $tokenized)
  }
`;

const DELETE_SEED_PADDY_PRODUCTION = gql`
  mutation tokenizedDeletePaddySeedProduction($tokenized: String!) {
    tokenizedDeletePaddySeedProduction(tokenized: $tokenized)
  }
`;

const CREATE_SEED_PADDY_PRODUCTION_DETAIL = gql`
  mutation tokenizedCreatePaddySeedProductionDetail($tokenized: String!) {
    tokenizedCreatePaddySeedProductionDetail(tokenized: $tokenized)
  }
`;

const UPDATE_SEED_PADDY_PRODUCTION_DETAIL = gql`
  mutation tokenizedUpdatePaddySeedProductionDetail($tokenized: String!) {
    tokenizedUpdatePaddySeedProductionDetail(tokenized: $tokenized)
  }
`;

const DELETE_SEED_PADDY_PRODUCTION_DETAIL = gql`
  mutation tokenizedDeletePaddySeedProductionDetail($tokenized: String!) {
    tokenizedDeletePaddySeedProductionDetail(tokenized: $tokenized)
  }
`;

const EXPORT_SEED_PADDY_PRODUCTION = gql`
  mutation exportPaddySeedProduction(
    $monthYear: String!
    $farmerUUID: String
    $farmAreaId: String
    $farmerName: String
  ) {
    exportPaddySeedProduction(
      monthYear: $monthYear
      farmerUUID: $farmerUUID
      farmAreaId: $farmAreaId
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
  const client = useApolloClient();

  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [listDetails, setListDetails] = useState([]);
  const [existedDetails, setExistedDetails] = useState([]);

  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportFormData, setExportFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [registerType, setRegisterType] = useState("");
  const notification = useNotification();

  const [detailFormData, setDetailFormData] = useState({});
  const [detailVisible, setDetailVisible] = useState(false);

  let farmerUUID = "";
  let tokenizedParams = "";
  if (formData.farmerUUID) {
    farmerUUID = formData.farmerUUID;
    const payload = { farmerUUID };
    tokenizedParams = jwt.sign(payload, TOKENIZE);
  }
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const { data, error, loading, refetch } = useQuery(QUERIES, {
    variables: {
      // tokenizedParams,
      monthYear: yearMonth,
      filters: router.query.filters,
    },
  });

  let [countPaddySeedProduction, setCountPaddySeedProduction] = useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countPaddySeedProduction) return 1;
    return Math.ceil(countPaddySeedProduction / pageSize);
  }, [countPaddySeedProduction, pageSize]);

  const [createPaddySeedProduction] = useMutation(CREATE_SEED_PADDY_PRODUCTION);
  const [updatePaddySeedProduction] = useMutation(UPDATE_SEED_PADDY_PRODUCTION);
  const [deletePaddySeedProduction] = useMutation(DELETE_SEED_PADDY_PRODUCTION);
  const [exportPaddySeedProduction] = useMutation(EXPORT_SEED_PADDY_PRODUCTION);

  const [createPaddySeedProductionDetails] = useMutation(
    CREATE_SEED_PADDY_PRODUCTION_DETAIL
  );
  const [updatePaddySeedProductionDetails] = useMutation(
    UPDATE_SEED_PADDY_PRODUCTION_DETAIL
  );
  const [deletePaddySeedProductionDetails] = useMutation(
    DELETE_SEED_PADDY_PRODUCTION_DETAIL
  );

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

  const [allFarmProfile, setAllFarmProfile] = useState([]);
  const [allFarmerProfilesByCompanyRegNo, setAllFarmerProfilesByCompanyRegNo] =
    useState([]);
  const [allPaddySeedProductions, setAllPaddySeedProductions] = useState([]);
  const [allFarmProfilesByFarmer, setAllFarmProfilesByFarmer] = useState([]);
  const [allCropsPaddySeedVarieties, setAllCropsPaddySeedVarieties] = useState(
    []
  );
  const [allSeasons, setAllSeasons] = useState([]);
  let [savedCount, setSavedCount] = useState(0);
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

      // const encryptedPaddySeedProductions =
      //   data?.tokenizedAllPaddySeedProductions || "";
      // let allPaddySeedProductions = [];
      // if (encryptedPaddySeedProductions) {
      //   const decrypted = jwt.verify(encryptedPaddySeedProductions, TOKENIZE);
      //   allPaddySeedProductions = decrypted.queryResult;
      //   setAllPaddySeedProductions(allPaddySeedProductions);
      // }

      // const encryptedFarmProfilesByFarmer =
      //   data?.tokenizedAllFarmProfilesByFarmer || "";
      // let allFarmProfilesByFarmer = [];
      // if (encryptedFarmProfilesByFarmer) {
      //   const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
      //   allFarmProfilesByFarmer = decrypted.queryResult;
      //   setAllFarmProfilesByFarmer(allFarmProfilesByFarmer);
      // }

      const encryptedCropsPaddySeedVarieties =
        data?.tokenizedAllCropsPaddySeedVarieties || "";
      let allCropsPaddySeedVarieties = [];
      if (encryptedCropsPaddySeedVarieties) {
        const decrypted = jwt.verify(
          encryptedCropsPaddySeedVarieties,
          TOKENIZE
        );
        allCropsPaddySeedVarieties = decrypted.queryResult;
        setAllCropsPaddySeedVarieties(allCropsPaddySeedVarieties);
      }

      const encryptedSeasons = data?.tokenizedAllSeasons || "";
      let allSeasons = [];
      if (encryptedSeasons) {
        const decrypted = jwt.verify(encryptedSeasons, TOKENIZE);
        allSeasons = decrypted.queryResult;
        setAllSeasons(allSeasons);
      }

      const countData = data?.countPaddySeedProductions || 0;
      setCountPaddySeedProduction(countData);
    }
  }, [data, loading, error, savedCount]);

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
    console.log("Called");
    const result = await client.query({
      query: PRODUCTION_QUERY,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedPaddySeedProductions =
      result.data?.tokenizedAllPaddySeedProductions || "";
    let allPaddySeedProductions = [];
    if (encryptedPaddySeedProductions) {
      const decrypted = jwt.verify(encryptedPaddySeedProductions, TOKENIZE);
      allPaddySeedProductions = decrypted.queryResult;
      setAllPaddySeedProductions(allPaddySeedProductions);
    }

    const countData = result.data?.countPaddySeedProductions || 0;
    setCountPaddySeedProduction(countData);
    hideLoadingSpinner();
  }, [yearMonth, savedCount, pageIndex, pageSize, router.query.filters]);

  useEffect(async () => {
    const result = await client.query({
      query: FARM_AREA_QUERY,
      variables: {
        tokenizedParams,
        onPage: "PADDY SEED PRODUCTION",
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

  // const encryptedPaddySeedProductions =
  //   data?.tokenizedAllPaddySeedProductions || "";
  // let allPaddySeedProductions = [];
  // if (encryptedPaddySeedProductions) {
  //   const decrypted = jwt.verify(encryptedPaddySeedProductions, TOKENIZE);
  //   allPaddySeedProductions = decrypted.queryResult;
  // }

  // const encryptedFarmProfilesByFarmer =
  //   data?.tokenizedAllFarmProfilesByFarmer || "";
  // let allFarmProfilesByFarmer = [];
  // if (encryptedFarmProfilesByFarmer) {
  //   const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
  //   allFarmProfilesByFarmer = decrypted.queryResult;
  // }

  // const encryptedCropsPaddySeedVarieties =
  //   data?.tokenizedAllCropsPaddySeedVarieties || "";
  // let allCropsPaddySeedVarieties = [];
  // if (encryptedCropsPaddySeedVarieties) {
  //   const decrypted = jwt.verify(encryptedCropsPaddySeedVarieties, TOKENIZE);
  //   allCropsPaddySeedVarieties = decrypted.queryResult;
  // }

  // const encryptedSeasons = data?.tokenizedAllSeasons || "";
  // let allSeasons = [];
  // if (encryptedSeasons) {
  //   const decrypted = jwt.verify(encryptedSeasons, TOKENIZE);
  //   allSeasons = decrypted.queryResult;
  // }

  // const encryptedFarmProfilesByFarmerForExport =
  //   data?.tokenizedAllFarmProfilesByFarmer || "";
  // let allFarmProfilesByFarmerForExport = [];
  // if (encryptedFarmProfilesByFarmerForExport) {
  //   const decrypted = jwt.verify(
  //     encryptedFarmProfilesByFarmerForExport,
  //     TOKENIZE
  //   );
  //   allFarmProfilesByFarmerForExport = decrypted.queryResult;
  // }

  // let allFarmProfilesByFarmerForExport = allFarmProfilesByFarmer;

  // allFarmProfilesByFarmerForExport = lodash.uniqBy(
  //   allFarmProfilesByFarmerForExport,
  //   (farm) => farm.farmArea
  // );

  useEffect(() => {
    let totalPaddySeedCultivatedArea = 0;
    let totalPaddySeedHarvestedArea = 0;
    let totalPaddySeedProduction = 0;
    let totalPaddySeedValue = 0;

    for (const det of listDetails) {
      totalPaddySeedCultivatedArea += det.cultivatedArea;
      totalPaddySeedHarvestedArea += det.harvestedArea;
      totalPaddySeedProduction += det.production;
      totalPaddySeedValue += det.totalValue;
    }

    setFormData({
      ...formData,
      totalPaddySeedCultivatedArea,
      totalPaddySeedHarvestedArea,
      totalPaddySeedProduction,
      totalPaddySeedValue,
    });
  }, [listDetails]);
  const fetchDetails = async (productionUUID) => {
    if (productionUUID) {
      const tokenizedPayload = {
        paddySeedProductionUUID: productionUUID,
      };
      const tokenizedParams = jwt.sign(tokenizedPayload, TOKENIZE);

      const result = await client.query({
        query: GET_SEED_PADDY_PRODUCTION_DETAILS,
        variables: {
          tokenizedParams,
        },
        fetchPolicy: "no-cache",
      });

      let paddySeedProductionDetails = [];
      const encryptedFruitDetails =
        result.data.tokenizedAllPaddySeedProductionDetailsByProductionUUID ||
        "";
      if (encryptedFruitDetails) {
        const decrypted = jwt.verify(encryptedFruitDetails, TOKENIZE);
        paddySeedProductionDetails = decrypted.queryResult;
      }

      return paddySeedProductionDetails;
    } else {
      return null;
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
                showLoadingSpinner();
                const getDetail = await fetchDetails(props.row.original.uuid);
                setExistedDetails(getDetail);
                setModalVisible(true);
                setFormData({
                  ...props.row.original,
                  seasonUUID: props.row.original?.Season?.uuid || "",

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
                });

                setListDetails(
                  getDetail.map((det) => {
                    return {
                      ...det,
                      paddySeedId: det.PaddySeed?.paddySeedId || "",
                    };
                  })
                );

                setSelectedCompany([
                  {
                    label: props.row.original?.FarmerProfile?.farmerName || "",
                    value: props.row.original?.FarmerProfile?.uuid || "",
                  },
                ]);
                setSelectedFarmArea([
                  {
                    label: props.row.original?.FarmProfile?.farmArea || "",
                    value: props.row.original?.FarmProfile?.uuid || "",
                  },
                ]);
                hideLoadingSpinner();
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
      Header: "Planting Month & Year",
      accessor: "plantingMonthYear",
      style: {
        fontSize: 20,
        width: 250,
      },
      disableFilters: true,
      Cell: (props) => <span>{dayjs(props.value).format("YYYY-MM")}</span>,
    },
    {
      Header: "Farmer Name",
      accessor: "FarmerProfile.farmerName",
      style: {
        fontSize: 20,
        width: 250,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Company Name",
      accessor: "FarmerProfile.farmerCompanyName",
      style: {
        fontSize: 20,
        width: 250,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
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
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Total Paddy Seed Cultivated Area (Ha)",
      accessor: "totalPaddySeedCultivatedArea",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Total Paddy Seed Harvested Area (Ha)",
      accessor: "totalPaddySeedHarvestedArea",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Total Paddy Seed Production (kg)",
      accessor: "totalPaddySeedProduction",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Total Paddy Seed Value ($)",
      accessor: "totalPaddySeedValue",
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
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
  ]);

  const columnsDetail = useMemo(() => [
    {
      Header: "Paddy Variety",
      accessor: "PaddySeed.varietyName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Paddy ID",
      accessor: "PaddySeed.paddySeedId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Cultivated Area (Ha)",
      accessor: "cultivatedArea",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Harvested Area (Ha)",
      accessor: "harvestedArea",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Production (Kg)",
      accessor: "production",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Total Value ($)",
      accessor: "totalValue",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "",
      accessor: "uuid",
      style: {
        fontSize: 20,
      },
      Cell: (props) => (
        <div>
          {/* <button
            className="bg-red-500 px-4 py-2 rounded-md text-white text-md"
            onClick={async (e) => {
              if (e) e.preventDefault();
              const detail = listDetails.filter(
                (list) => list.uuid !== props.value
              );

              setListDetails(
                listDetails.filter((list) => list.uuid !== props.value)
              );

              if (detail.length === 0) {
                setFormData({
                  ...formData,
                  totalPaddySeedCultivatedArea: 0,
                  totalPaddySeedHarvestedArea: 0,
                  totalPaddySeedProduction: 0,
                  totalPaddySeedValue: 0,
                });
              } else {
                let totalPaddySeedCultivatedArea = 0;
                let totalPaddySeedHarvestedArea = 0;
                let totalPaddySeedProduction = 0;
                let totalPaddySeedValue = 0;

                for (const det of detail) {
                  totalPaddySeedCultivatedArea += det.cultivatedArea;
                  totalPaddySeedHarvestedArea += det.harvestedArea;
                  totalPaddySeedProduction += det.production;
                  totalPaddySeedValue += det.totalValue;
                }
                setFormData({
                  ...formData,
                  totalPaddySeedCultivatedArea,
                  totalPaddySeedHarvestedArea,
                  totalPaddySeedProduction,
                  totalPaddySeedValue,
                });
              }
            }}
          >
            <i className="fa fa-times" />
          </button> */}
          <button
            className="bg-yellow-500 px-4 py-2 rounded-md text-white text-md mx-2"
            onClick={(e) => {
              if (e) e.preventDefault();
              setDetailVisible(true);
              setSelectedPaddy([
                {
                  value: props.row.original.PaddySeed.uuid,
                  label: props.row.original.PaddySeed.varietyName,
                },
              ]);
              setDetailFormData({ ...props.row.original, status: "Edit" });
            }}
          >
            <i className="fa fa-edit" />
          </button>
        </div>
      ),
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
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
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
          setSelectedFarmArea([]);
          setSelectedExportFarmerName([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setExportModalVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportPaddySeedProduction({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            // Convert base64 to blob
            const base64Response = response.data.exportPaddySeedProduction;
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
            link.download = "paddy_seed_production.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);

            // window.open(response.data.exportPaddySeedProduction, "__blank");
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
            controlledValue={yearMonth}
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
                    label: found.farmArea || "",
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

          <br />
          <br />
        </div>
      </FormModal>
      <FormModal
        title={`${!formData.uuid ? "Add" : "Edit"} Paddy Seed Production`}
        visible={modalVisible}
        size="xl"
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({});
          setSelectedCompany([]);
          setSelectedFarmArea([]);
          setListDetails([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            if (!formData.uuid) {
              if (detailFormData.length === 0) {
                throw {
                  message: "Details not inserted",
                };
              }

              let totalPaddySeedCultivatedArea = 0;
              let totalPaddySeedHarvestedArea = 0;
              let totalPaddySeedProduction = 0;
              let totalPaddySeedValue = 0;

              for (const det of listDetails) {
                totalPaddySeedCultivatedArea += det.cultivatedArea;
                totalPaddySeedHarvestedArea += det.harvestedArea;
                totalPaddySeedProduction += det.production;
                totalPaddySeedValue += det.totalValue;
              }

              const tokenizedPayload = {
                ...formData,
                totalPaddySeedCultivatedArea,
                totalPaddySeedHarvestedArea,
                totalPaddySeedProduction,
                totalPaddySeedValue,
              };

              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

              const production = await createPaddySeedProduction({
                variables: {
                  tokenized,
                  // ...formData,
                  // totalPaddySeedCultivatedArea,
                  // totalPaddySeedHarvestedArea,
                  // totalPaddySeedProduction,
                  // totalPaddySeedValue,
                },
              });

              for (const detail of listDetails) {
                const tokenizedPayload = {
                  paddySeedProductionUUID:
                    production.data.tokenizedCreatePaddySeedProduction,
                  plantingMonthYear: formData.plantingMonthYear,
                  harvestMonthYear: formData.harvestMonthYear,
                  ...detail,
                };

                const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

                await createPaddySeedProductionDetails({
                  variables: {
                    tokenized,
                    // paddySeedProductionUUID:
                    //   production.data.createPaddySeedProduction,
                    // plantingMonthYear: formData.plantingMonthYear,
                    // harvestMonthYear: formData.harvestMonthYear,
                    // ...detail,
                  },
                });
              }
              notification.addNotification({
                title: "Succeess!",
                message: `Detail Added`,
                level: "success",
              });

              await refetch();
              setListDetails([]);

              setDetailFormData({
                uuid: uuid(),
                cultivatedArea: 0,
                harvestedArea: 0,
                production: 0,
                price: 0,
                totalValue: 0,
              });
              setDetailVisible(true);
              setSelectedPaddy([]);

              setModalVisible(false);
              setFormData({});
              setModalVisible(true);
              setSavedCount((savedCount += 1));
            } else {
              for (const det of listDetails) {
                const found = existedDetails.find(
                  (ext) => ext.uuid === det.uuid
                );

                if (!found) {
                  const tokenizedPayload = {
                    ...det,
                    paddySeedProductionUUID: formData.uuid,
                    plantingMonthYear: formData.plantingMonthYear,
                    harvestMonthYear: formData.harvestMonthYear,
                  };
                  const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

                  await createPaddySeedProductionDetails({
                    variables: {
                      tokenized,
                      // ...det,
                      // paddySeedProductionUUID: formData.uuid,
                      // plantingMonthYear: formData.plantingMonthYear,
                      // harvestMonthYear: formData.harvestMonthYear,
                    },
                  });
                } else {
                  delete det.farmAddress;
                  delete det.farmVillage;
                  const tokenized = jwt.sign(det, TOKENIZE);
                  await updatePaddySeedProductionDetails({
                    variables: {
                      // ...det,
                      tokenized,
                    },
                  });
                }
              }
              delete formData.farmAddress;
              delete formData.farmVillage;
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updatePaddySeedProduction({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });

              notification.addNotification({
                title: "Succeess!",
                message: `Data Saved`,
                level: "success",
              });

              setModalVisible(false);
              setFormData({});
              setSavedCount((savedCount += 1));
            }
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <div>
            {/* <div>
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
                value={formData?.FarmerProfile}
                loadOptions={getFarmer}
                className={`form-control uppercase p-0`}
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
                    FarmProfile: found,
                    farmerUUID: found?.uuid || "",
                    farmerCompanyName: found?.farmerCompanyName || "",
                    farmerName: "",
                    farmDistrict: "",
                    farmMukim: "",
                  });

                  setSelectedCompany([
                    {
                      value: found.uuid,
                      label: found.farmerName,
                    },
                  ]);

                  setSelectedFarmArea([
                    {
                      value: "",
                      label: "",
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
                    const decrypted = jwt.verify(
                      encryptedFarmProfile,
                      TOKENIZE
                    );
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
            <div>
              <label>Farm Area</label>
              {/* <Select
                value={selectedFarmArea}
                options={allFarmProfilesByFarmer.map((prof) => {
                  return {
                    value: prof.uuid,
                    label: prof.farmArea,
                  };
                })}
                className={`form-control uppercase p-0 border-0`}
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
          </div>

          <div>
            <div className="form-group">
              <label>Planting Month & Year*</label>
              <input
                required
                type="month"
                className="form-control uppercase"
                value={formData.plantingMonthYear || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    plantingMonthYear: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Harvest Month & Year*</label>
              <input
                required
                type="month"
                className="form-control uppercase"
                value={formData.harvestMonthYear || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    harvestMonthYear: e.target.value,
                  });
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
            <div className="form-group">
              <label>Planting Season Detail</label>
              <textarea
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
          </div>
        </div>

        <div>
          <div className={detailVisible ? "" : "hidden"}>
            <hr className="bg-gray-200 h-1" />
            <div className="grid grid-cols-9 gap-1">
              <div>
                <label>Paddy Seed Variety</label>
                <Select
                  value={selectedPaddy}
                  options={allCropsPaddySeedVarieties.map((prof) => {
                    return {
                      value: prof.uuid,
                      label: prof.varietyName,
                    };
                  })}
                  className={`form-control uppercase`}
                  classNamePrefix="select"
                  onChange={(selectedValues) => {
                    // console.log({ selectedValues });

                    const found = allCropsPaddySeedVarieties.find(
                      (profile) => profile.uuid === selectedValues.value
                    );
                    setDetailFormData({
                      ...detailFormData,
                      cropsPaddySeedVarietyUUID: found.uuid,
                      paddySeedId: found.paddySeedId,
                      price: found?.price || 0,
                      PaddySeed: {
                        varietyName: found.varietyName,
                        paddySeedId: found.paddySeedId,
                      },
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
                <label>Paddy ID</label>
                <input
                  className="form-control"
                  value={detailFormData.paddySeedId || ""}
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Cultivated Area</label>
                <NumberFormat
                  placeholder="0"
                  className="form-control"
                  value={detailFormData.cultivatedArea || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  fixedDecimalScale={true}
                  decimalScale={3}
                  onValueChange={(e) => {
                    // if (e) e.preventDefault();
                    setDetailFormData({
                      ...detailFormData,
                      cultivatedArea: e.floatValue || 0,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Harvested Area</label>
                <NumberFormat
                  placeholder="0"
                  className="form-control"
                  value={detailFormData.harvestedArea || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  fixedDecimalScale={true}
                  decimalScale={2}
                  onValueChange={(e) => {
                    // if (e) e.preventDefault();
                    setDetailFormData({
                      ...detailFormData,
                      harvestedArea: e.floatValue || 0,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Production</label>
                <NumberFormat
                  placeholder="0"
                  className="form-control"
                  value={detailFormData.production || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  fixedDecimalScale={true}
                  decimalScale={2}
                  onValueChange={(e) => {
                    // if (e) e.preventDefault();
                    setDetailFormData({
                      ...detailFormData,
                      production: e.floatValue || 0,
                      totalValue: e.floatValue * detailFormData.price || 0,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Price</label>
                <NumberFormat
                  placeholder="0"
                  className="form-control"
                  value={detailFormData.price || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  fixedDecimalScale={true}
                  decimalScale={2}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Total Value</label>
                <NumberFormat
                  placeholder="0"
                  className="form-control"
                  value={detailFormData.totalValue || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  fixedDecimalScale={true}
                  decimalScale={2}
                  disabled
                />
              </div>
              <div className="flex items-end py-2">
                <button
                  className="bg-mantis-500 px-4 py-2 w-full rounded-md shadow-md text-white font-bold"
                  onClick={async (e) => {
                    if (e) e.preventDefault();
                    showLoadingSpinner();
                    try {
                      let details = [];
                      if (detailFormData.createdAt) {
                        const tokenized = jwt.sign(detailFormData, TOKENIZE);
                        await updatePaddySeedProductionDetails({
                          variables: {
                            // ...detailFormData,
                            tokenized,
                          },
                        });

                        notification.addNotification({
                          title: "Succeess!",
                          message: `Detail Saved`,
                          level: "success",
                        });

                        details = await fetchDetails(formData.uuid);
                        setListDetails(details);
                      } else {
                        let details = [];

                        if (
                          detailFormData.status === "Edit" &&
                          listDetails.length > 0
                        ) {
                          for (const det of listDetails) {
                            if (det.uuid === detailFormData.uuid) {
                              details.push(detailFormData);
                            } else {
                              details.push(det);
                            }
                          }
                          setListDetails(details);
                        } else {
                          details = [...listDetails, detailFormData];
                          setListDetails(details);
                        }
                      }

                      let totalPaddySeedCultivatedArea = 0;
                      let totalPaddySeedHarvestedArea = 0;
                      let totalPaddySeedProduction = 0;
                      let totalPaddySeedValue = 0;
                      for (const d of details) {
                        totalPaddySeedCultivatedArea += d.cultivatedArea;
                        totalPaddySeedHarvestedArea += d.harvestedArea;
                        totalPaddySeedProduction += d.production;
                        totalPaddySeedValue += d.totalValue;
                      }

                      notification.addNotification({
                        title: "Succeess!",
                        message: `Detail Saved`,
                        level: "success",
                      });

                      setDetailFormData({
                        uuid: uuid(),
                        cultivatedArea: 0,
                        harvestedArea: 0,
                        production: 0,
                        price: 0,
                        totalValue: 0,
                        status: "New",
                      });

                      setDetailVisible(true);
                      setSelectedPaddy([]);
                      setFormData({
                        ...formData,
                        totalPaddySeedCultivatedArea,
                        totalPaddySeedHarvestedArea,
                        totalPaddySeedProduction,
                        totalPaddySeedValue,
                      });
                    } catch (err) {
                      notification.handleError(err);
                    }

                    hideLoadingSpinner();
                  }}
                >
                  <i className="fa fa-plus" /> Save/Add
                </button>
              </div>
              <div className="flex items-end py-2">
                <button
                  className="bg-red-500 px-4 py-2 w-full rounded-md shadow-md text-white font-bold"
                  onClick={async (e) => {
                    if (e) e.preventDefault();

                    setDetailFormData({});
                    setSelectedPaddy([]);
                    setDetailVisible(false);
                  }}
                >
                  <i className="fa fa-plus" /> Cancel
                </button>
              </div>
            </div>
          </div>
          <Table
            loading={false}
            columns={columnsDetail}
            data={listDetails}
            withoutHeader={true}
            customUtilities={null}
            onAdd={
              !detailVisible
                ? (e) => {
                    if (e) e.preventDefault();
                    setDetailFormData({
                      uuid: uuid(),
                      cultivatedArea: 0,
                      harvestedArea: 0,
                      production: 0,
                      price: 0,
                      totalValue: 0,
                      status: "New",
                    });
                    setDetailVisible(true);
                    setSelectedPaddy([]);
                  }
                : null
            }
            onRemove={async ({ rows }) => {
              showLoadingSpinner();
              try {
                let details = [];
                let tmp = [];
                let yes = confirm(
                  `Are you sure to delete ${rows.length} details?`
                );
                if (yes) {
                  for (const row of rows) {
                    const tokenized = jwt.sign(row, TOKENIZE);

                    if (row.createdAt) {
                      await deletePaddySeedProductionDetails({
                        variables: {
                          // uuid: row.uuid,
                          tokenized,
                        },
                      });
                    } else {
                      const found = listDetails.filter(
                        (d) => d.uuid !== row.uuid
                      );
                      tmp = found;
                    }
                  }

                  details = await fetchDetails(formData.uuid);
                  if (!details) {
                    details = tmp;
                  }
                  setListDetails(details);
                  setSavedCount((savedCount += 1));
                  notification.addNotification({
                    title: "Success!",
                    message: `${rows.length} details deleted`,
                    level: "success",
                  });

                  let totalPaddySeedCultivatedArea = 0;
                  let totalPaddySeedHarvestedArea = 0;
                  let totalPaddySeedProduction = 0;
                  let totalPaddySeedValue = 0;

                  if (details.length === 0) {
                    totalPaddySeedCultivatedArea = 0;
                    totalPaddySeedHarvestedArea = 0;
                    totalPaddySeedProduction = 0;
                    totalPaddySeedValue = 0;
                  } else {
                    for (const d of details) {
                      totalPaddySeedCultivatedArea += d.cultivatedArea;
                      totalPaddySeedHarvestedArea += d.harvestedArea;
                      totalPaddySeedProduction += d.production;
                      totalPaddySeedValue += d.totalValue;
                    }
                  }

                  setFormData({
                    ...formData,
                    totalPaddySeedCultivatedArea,
                    totalPaddySeedHarvestedArea,
                    totalPaddySeedProduction,
                    totalPaddySeedValue,
                  });
                }
              } catch (error) {
                notification.handleError(error);
              }
              hideLoadingSpinner();
            }}
          />

          <div className="grid grid-cols-6 mt-4">
            <div className="col-span-2 pt-2">
              <div className="form-group">
                <label>Total Paddy Seed Cultivated Area</label>
              </div>
            </div>
            <div className="col-span-4 pt-2">
              <NumberFormat
                placeholder="0"
                className="form-control"
                value={formData.totalPaddySeedCultivatedArea || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                disabled
              />
            </div>
            <div className="col-span-2 pt-2">
              <div className="form-group">
                <label>Total Paddy Seed Harvested Area</label>
              </div>
            </div>
            <div className="col-span-4 pt-2">
              <NumberFormat
                placeholder="0"
                className="form-control"
                value={formData.totalPaddySeedHarvestedArea || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                disabled
              />
            </div>
            <div className="col-span-2 pt-2">
              <div className="form-group">
                <label>Total Paddy Seed Production</label>
              </div>
            </div>
            <div className="col-span-4 pt-2">
              <NumberFormat
                placeholder="0"
                className="form-control"
                value={formData.totalPaddySeedProduction || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                disabled
              />
            </div>
            <div className="col-span-2 pt-2">
              <div className="form-group">
                <label>Total Paddy Seed Value</label>
              </div>
            </div>
            <div className="col-span-4 pt-2">
              <NumberFormat
                placeholder="0"
                className="form-control"
                value={formData.totalPaddySeedValue || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                disabled
              />
            </div>
          </div>
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
                      "Paddy Seed Production Export Excel:Read",
                    ])
                      ? "block"
                      : "hidden"
                  }`}
                  onClick={async (e) => {
                    if (e) e.preventDefault();
                    setExportModalVisible(true);
                    // showLoadingSpinner();
                    // try {
                    //   const response = await exportVegetableProduction({
                    //     variables: {
                    //       monthYear: yearMonth,
                    //     },
                    //   });

                    //   window.open(
                    //     response.data.exportVegetableProduction,
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
          data={allPaddySeedProductions}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege(["Paddy Seed Production:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege(["Paddy Seed Production:Create"])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Paddy Seed Production:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} productions?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deletePaddySeedProduction({
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
                      setSavedCount((savedCount += 1));
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
