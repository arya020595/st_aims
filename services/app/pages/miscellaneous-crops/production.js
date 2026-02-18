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
import { v4 as uuidv4 } from "uuid";
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
    tokenizedAllMiscellaneousCrops

    countAllMiscellaneousProductions(monthYear: $monthYear, filters: $filters)
  }
`;

const PRODUCTION_QUERY = gql`
  query productionQuery(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllMiscellaneousProductions(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllMiscellaneousProductions(monthYear: $monthYear, filters: $filters)
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

const CREATE_MISCELLANEOUS_PRODUCTION = gql`
  mutation tokenizedCreateManyMiscellaneousProduction($tokenized: String!) {
    tokenizedCreateManyMiscellaneousProduction(tokenized: $tokenized)
  }
`;

const SEARCH_FARMER_QUERY = gql`
  query searchQuery($name: String!) {
    searchFarmerProfileByCompanyRegNo(name: $name)
  }
`;

const SEARCH_FARM_QUERY = gql`
  query searchFarmProfile($name: String) {
    searchFarmProfile(name: $name)
  }
`;

const UPDATE_MISCELLANEOUS_PRODUCTION = gql`
  mutation tokenizedUpdateMiscellaneousProduction($tokenized: String!) {
    tokenizedUpdateMiscellaneousProduction(tokenized: $tokenized)
  }
`;

const DELETE_MISCELLANEOUS_PRODUCTION = gql`
  mutation tokenizedDeleteMiscellaneousProduction($tokenized: String!) {
    tokenizedDeleteMiscellaneousProduction(tokenized: $tokenized)
  }
`;

const EXPORTS_MISCELLANEOUS_PRODUCTION = gql`
  mutation exportMiscellaneousProduction(
    $monthYear: String!
    $farmerUUID: String
    $farmAreaId: String
    $miscellaneousCropUUID: String
    $farmerName: String
  ) {
    exportMiscellaneousProduction(
      monthYear: $monthYear
      farmerUUID: $farmerUUID
      farmAreaId: $farmAreaId
      miscellaneousCropUUID: $miscellaneousCropUUID
      farmerName: $farmerName
    )
  }
`;

const SEARCH_MISC_CROPS = gql`
  query searchMiscCrops($searchTerm: String) {
    searchMiscCrops(searchTerm: $searchTerm)
  }
`;

const GET_FARM_AREA_BY_COMPANYID_AND_FARM_AREA = gql`
  query getFarmAddressByCompanyUUIDAndFarmArea(
    $farmerUUID: String!
    $farmArea: String!
  ) {
    getFarmAddressByCompanyUUIDAndFarmArea(
      farmerUUID: $farmerUUID
      farmArea: $farmArea
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
  const [formData, setFormData] = useState({
    records: [],
    addresses: [],
  });
  const client = useApolloClient();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [exportFormData, setExportFormData] = useState({});
  const notification = useNotification();
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [allFarmProfile, setAllFarmProfile] = useState([]);
  const [registerType, setRegisterType] = useState("");

  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const [updateFormData, setUpdateFormData] = useState({
    addresses: [],
  });
  const [updateFormDataVisible, setUpdateFormDataVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  let [countMiscellaneousProduction, setCountMiscellaneousProduction] =
    useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countMiscellaneousProduction) return 1;
    return Math.ceil(countMiscellaneousProduction / pageSize);
  }, [countMiscellaneousProduction, pageSize]);

  let farmerUUID = "";
  let tokenizedParams = "";
  if (formData.farmerUUID) {
    farmerUUID = formData.farmerUUID;
    const payload = { farmerUUID };
    tokenizedParams = jwt.sign(payload, TOKENIZE);
  } else if (updateFormData.farmerUUID) {
    farmerUUID = updateFormData.farmerUUID;
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

  const [exportMiscellaneousProduction] = useMutation(
    EXPORTS_MISCELLANEOUS_PRODUCTION
  );
  const [createMiscellaneousProduction] = useMutation(
    CREATE_MISCELLANEOUS_PRODUCTION
  );
  const [updateMiscellaneousProduction] = useMutation(
    UPDATE_MISCELLANEOUS_PRODUCTION
  );
  const [deleteMiscellaneousProduction] = useMutation(
    DELETE_MISCELLANEOUS_PRODUCTION
  );
  let [savedCount, setSavedCount] = useState(0);

  const [allFarmerProfilesByCompanyRegNo, setAllFarmerProfilesByCompanyRegNo] =
    useState([]);
  const [allMiscellaneousProductions, setAllMiscellaneousProductions] =
    useState([]);
  const [allFarmProfilesByFarmer, setAllFarmProfilesByFarmer] = useState([]);
  const [allMiscellaneousCrops, setAllMiscellaneousCrops] = useState([]);

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

      // const encryptedMiscellaneousProductions =
      //   data?.tokenizedAllMiscellaneousProductions || "";
      // let allMiscellaneousProductions = [];
      // if (encryptedMiscellaneousProductions) {
      //   const decrypted = jwt.verify(
      //     encryptedMiscellaneousProductions,
      //     TOKENIZE
      //   );
      //   allMiscellaneousProductions = decrypted.queryResult;
      //   setAllMiscellaneousProductions(allMiscellaneousProductions);
      // }

      // const encryptedFarmProfilesByFarmer =
      //   data?.tokenizedAllFarmProfilesByFarmer || "";
      // let allFarmProfilesByFarmer = [];
      // if (encryptedFarmProfilesByFarmer) {
      //   const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
      //   allFarmProfilesByFarmer = decrypted.queryResult;
      //   setAllFarmProfilesByFarmer(allFarmProfilesByFarmer);
      // }

      // const encryptedMiscellaneousCrops =
      //   data?.tokenizedAllMiscellaneousCrops || "";
      // let allMiscellaneousCrops = [];
      // if (encryptedMiscellaneousCrops) {
      //   const decrypted = jwt.verify(encryptedMiscellaneousCrops, TOKENIZE);
      //   allMiscellaneousCrops = decrypted.queryResult;
      //   setAllMiscellaneousCrops(allMiscellaneousCrops);
      // }

      const countData = data?.countAllMiscellaneousProductions || 0;
      setCountMiscellaneousProduction(countData);
    }
  }, [data, loading, error, savedCount]);

  const handlePageChange = useCallback(
    async ({ pageIndex, pageSize, filters }) => {
      // const ym = router.query.yearMonth;

      // console.log({ ym, router, yearMonth });
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
      query: PRODUCTION_QUERY,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedMiscellaneousProductions =
      result.data?.tokenizedAllMiscellaneousProductions || "";
    let allMiscellaneousProductions = [];
    if (encryptedMiscellaneousProductions) {
      const decrypted = jwt.verify(encryptedMiscellaneousProductions, TOKENIZE);
      allMiscellaneousProductions = decrypted.queryResult;
      setAllMiscellaneousProductions(allMiscellaneousProductions);
    }

    const countData = result.data?.countAllMiscellaneousProductions || 0;
    setCountMiscellaneousProduction(countData);
    hideLoadingSpinner();
  }, [yearMonth, savedCount, pageSize, pageIndex, router.query.filters]);

  useEffect(async () => {
    const result = await client.query({
      query: FARM_AREA_QUERY,
      variables: {
        tokenizedParams,
        onPage: "MISCELLANOUS CROPS",
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

  useEffect(() => {
    const intervalId = setInterval(() => {
      countFarmValue();
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [formData, formData.records]);

  const countFarmValue = () => {
    setFormData({
      ...formData,
      records: formData.records.map((rec) => {
        let production = "" + rec.production;
        let farmPrice = "" + rec.farmPrice;

        if (production) {
          production = parseFloat(production.replace(/,/g, ""));
        } else {
          production = 0;
        }
        if (farmPrice) {
          farmPrice = parseFloat(farmPrice.replace(/,/g, ""));
        } else {
          farmPrice = 0;
        }
        return {
          ...rec,
          totalFarmValue: production * farmPrice,
        };
      }),
    });
  };

  const fethchingFarmer = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_FARMER_QUERY,
      variables: {
        name: input,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedFarmerProfilesByCompanyRegNo =
      result.data?.searchFarmerProfileByCompanyRegNo || "";
    let allFarmerProfilesByCompanyRegNo = [];
    if (encryptedFarmerProfilesByCompanyRegNo) {
      const decrypted = jwt.verify(
        encryptedFarmerProfilesByCompanyRegNo,
        TOKENIZE
      );
      allFarmerProfilesByCompanyRegNo = decrypted.queryResult;
      setAllFarmerProfilesByCompanyRegNo(allFarmerProfilesByCompanyRegNo);
    }

    callback(allFarmerProfilesByCompanyRegNo);
  };

  const getFarmer = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fethchingFarmer(input, callback);
    }
  };

  const fethchingCrops = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_MISC_CROPS,
      variables: {
        searchTerm: input,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedMiscellaneousCrops = result.data?.searchMiscCrops || "";
    let allMiscellaneousCrops = [];
    if (encryptedMiscellaneousCrops) {
      const decrypted = jwt.verify(encryptedMiscellaneousCrops, TOKENIZE);
      allMiscellaneousCrops = decrypted.queryResult;
      setAllMiscellaneousCrops(allMiscellaneousCrops);
    }

    callback(allMiscellaneousCrops);
  };

  const getCrops = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fethchingCrops(input, callback);
    }
  };

  const fetchFarmProfile = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_FARM_QUERY,
      variables: {
        name: input,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedFarmProfile = result.data?.searchFarmProfile || "";
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

  // const encryptedMiscellaneousProductions =
  //   data?.tokenizedAllMiscellaneousProductions || "";
  // let allMiscellaneousProductions = [];
  // if (encryptedMiscellaneousProductions) {
  //   const decrypted = jwt.verify(encryptedMiscellaneousProductions, TOKENIZE);
  //   allMiscellaneousProductions = decrypted.queryResult;
  // }

  // const encryptedFarmProfilesByFarmer =
  //   data?.tokenizedAllFarmProfilesByFarmer || "";
  // let allFarmProfilesByFarmerForExport = [];
  // let allFarmProfilesByFarmer = [];
  // if (encryptedFarmProfilesByFarmer) {
  //   const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
  //   allFarmProfilesByFarmer = decrypted.queryResult;
  //   allFarmProfilesByFarmerForExport = decrypted.queryResult;
  // }

  // const encryptedMiscellaneousCrops =
  //   data?.tokenizedAllMiscellaneousCrops || "";
  // let allMiscellaneousCrops = [];
  // if (encryptedMiscellaneousCrops) {
  //   const decrypted = jwt.verify(encryptedMiscellaneousCrops, TOKENIZE);
  //   allMiscellaneousCrops = decrypted.queryResult;
  // }

  // let allFarmProfilesByFarmerForExport = allFarmProfilesByFarmer;

  // allFarmProfilesByFarmerForExport = lodash.uniqBy(
  //   allFarmProfilesByFarmerForExport,
  //   (farm) => farm.farmArea
  // );

  const [selectedMiscellaneous, setSelectedMiscellaneous] = useState({});

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
                // const result = await client.query({
                //   query: GET_FARM_AREA_BY_COMPANYID_AND_FARM_AREA,
                //   variables: {
                //     farmerUUID: props.row.original?.FarmerProfile?.uuid,
                //     farmArea: props.row.original?.FarmProfile?.farmArea,
                //   },
                //   fetchPolicy: "no-cache",
                // });

                setUpdateFormDataVisible(true);
                setUpdateFormData({
                  ...props.row.original,
                  miscellaneousCropUUID:
                    props.row.original?.MiscellaneousCrops?.uuid || "",
                  farmAreaId: props.row.original?.FarmProfile?.uuid || "",
                  farmerUUID: props.row.original?.FarmerProfile?.uuid || "",
                  farmerName: props.row.original?.FarmProfile?.farmerName || "",
                  farmAddress: props.row.original?.FarmProfile?.address || "",

                  englishName:
                    props.row.original?.MiscellaneousCrops?.englishName || "",
                  localName:
                    props.row.original?.MiscellaneousCrops?.localName || "",
                  miscellaneousCropId:
                    props.row.original?.MiscellaneousCrops
                      ?.miscellaneousCropId || "",
                  farmerCompanyName:
                    props.row.original?.FarmProfile?.farmerCompanyName || "",
                  farmArea: props.row.original?.FarmProfile?.farmArea || "",
                  // addresses:
                  //   result.data?.getFarmAddressByCompanyUUIDAndFarmArea || [],
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

                setSelectedMiscellaneous([
                  {
                    value: props.row.original?.MiscellaneousCrops?.uuid || "",
                    label:
                      props.row.original?.MiscellaneousCrops?.localName || "",
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
      Header: "Month & Year",
      accessor: "monthYear",
      style: {
        fontSize: 20,
        width: 200,
      },
      disableFilters: true,
      Cell: (props) => <span>{dayjs(props.value).format("YYYY-MM")}</span>,
    },
    {
      Header: "Company Name",
      accessor: "FarmerProfile.farmerCompanyName",
      style: {
        fontSize: 20,
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
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Farmer Name",
      accessor: "FarmProfile.farmerName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    // {
    //   Header: "Farm Address",
    //   accessor: "address",
    //   style: {
    //     fontSize: 20,
    //   },
    // },
    {
      Header: "Miscellaneous Crop Name",
      accessor: "MiscellaneousCrops.localName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Miscellaneous Crop ID",
      accessor: "MiscellaneousCrops.miscellaneousCropId",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Production (Kg)",
      accessor: "production",
      style: {
        fontSize: 20,
        width: 200,
      },
      disableFilters: true,
      Cell: (props) => {
        return (
          <NumberFormat
            disabled
            className="form-control bg-none border-0 text-lg"
            value={props.value || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
          />
        );
      },
    },
    {
      Header: "Farm Price/Kg ($)",
      accessor: "farmPrice",
      style: {
        fontSize: 20,
        width: 200,
      },
      disableFilters: true,
      Cell: (props) => {
        return (
          <NumberFormat
            disabled
            className="form-control bg-none border-0 text-lg"
            value={props.value || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
          />
        );
      },
    },
    {
      Header: "Total Farm Value ($)",
      accessor: "totalFarmValue",
      style: {
        fontSize: 20,
        width: 200,
      },
      disableFilters: true,
      Cell: (props) => {
        return (
          <NumberFormat
            disabled
            className="form-control bg-none border-0 text-lg"
            value={props.value || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
          />
        );
      },
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

              if (!updateFormData.uuid) {
                setFormData({
                  ...formData,
                  farmerUUID: props.row.original.farmerUUID,
                  farmerCompanyName: props.row.original.farmerCompanyName,
                  farmAreaId: props.row.original.uuid,
                  farmArea: props.row.original.farmArea,
                  farmAddress: props.row.original.address,
                  farmerName: props.row.original.farmerName,
                  address: props.row.original.address,
                });
                setCompanyModalVisible(false);
                setModalVisible(true);
              } else {
                setUpdateFormData({
                  ...updateFormData,
                  farmerUUID: props.row.original.farmerUUID,
                  farmerCompanyName: props.row.original.farmerCompanyName,
                  farmAreaId: props.row.original.uuid,
                  farmArea: props.row.original.farmArea,
                  farmAddress: props.row.original.address,
                  farmerName: props.row.original.farmerName,
                  address: props.row.original.address,
                });
                setCompanyModalVisible(false);
                setUpdateFormDataVisible(true);
              }
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
      Header: "Company Name",
      accessor: "farmerCompanyName",
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
    <AdminArea
      header={{ title: "Miscellaneous Crops Production" }}
      urlQuery={router.query}
    >
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
          setSelectedMiscellaneous([]);
          setSelectedExportFarmerName([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setExportModalVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportMiscellaneousProduction({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            // Convert base64 to blob
            const base64Response = response.data.exportMiscellaneousProduction;
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
            link.download = "miscellaneous_production.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);

            // window.open(response.data.exportMiscellaneousProduction, "__blank");
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
              loadOptions={getFarmer}
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
              options={allFarmProfilesByFarmer.map((prof) => {
                return {
                  value: prof.uuid,
                  label: `${prof.farmerName} (${prof.farmId})`,
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                const found = allFarmProfilesByFarmer.find((profile) =>
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
            <label>Miscellaneous Crop Name</label>
            <Select
              className="form-control"
              isClearable={true}
              value={selectedMiscellaneous}
              required
              options={allMiscellaneousCrops.map((pr) => {
                return {
                  value: pr.uuid,
                  label: `${pr.localName}`,
                };
              })}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                const found = allMiscellaneousCrops.find((p) =>
                  selectedValues ? p.uuid === selectedValues.value : null
                );

                setExportFormData({
                  ...exportFormData,
                  miscellaneousCropUUID: found?.uuid || "",
                });
                setSelectedMiscellaneous([
                  {
                    label: found?.localName || "",
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
      {/* Modal Update */}
      <FormModal
        size={"md"}
        title={`Edit Miscellaneous Production`}
        visible={updateFormDataVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setUpdateFormDataVisible(false);
          setSelectedCompany([]);
          setSelectedFarmArea([]);
          setSelectedMiscellaneous([]);
          setUpdateFormData({
            records: [],
            addresses: [],
          });
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let production = "" + updateFormData.production;
            let farmPrice = "" + updateFormData.farmPrice;
            let cultivatedArea = "" + updateFormData.cultivatedArea;

            if (production) {
              production = parseFloat(production.replace(/,/g, ""));
            } else {
              production = 0;
            }
            if (farmPrice) {
              farmPrice = parseFloat(farmPrice.replace(/,/g, ""));
            } else {
              farmPrice = 0;
            }

            if (cultivatedArea) {
              cultivatedArea = parseFloat(cultivatedArea.replace(/,/g, ""));
            } else {
              cultivatedArea = 0;
            }
            delete updateFormData.farmerCompanyName;
            delete updateFormData.farmArea;
            const tokenizedPayload = {
              ...updateFormData,
              production: parseFloat(production || 0),
              cultivatedArea: parseFloat(cultivatedArea || 0),
              farmPrice: parseFloat(farmPrice || 0),
              totalFarmValue: parseFloat(updateFormData.totalFarmValue || 0),
            };
            const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

            await updateMiscellaneousProduction({
              variables: {
                tokenized,
                // ...updateFormData,
                // production: parseFloat(updateFormData.production || 0),
                // cultivatedArea: parseFloat(updateFormData.cultivatedArea || 0),
                // farmPrice: parseFloat(updateFormData.farmPrice || 0),
                // totalFarmValue: parseFloat(updateFormData.totalFarmValue || 0),
              },
            });
            notification.addNotification({
              title: "Succeess!",
              message: `Production saved!`,
              level: "success",
            });

            await refetch();
            setUpdateFormDataVisible(false);
            setUpdateFormData({
              records: [],
              addresses: [],
            });
            setSavedCount((savedCount += 1));
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
            className="form-control uppercase"
            value={updateFormData.monthYear || ""}
            onChange={(e) => {
              setUpdateFormData({
                ...updateFormData,
                monthYear: e.target.value,
              });
            }}
          />
        </div>
        {/* <div className="form-group">
          <label>Company Name</label>
          <Select
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

              const found = allFarmerProfilesByCompanyRegNo.find(
                (profile) => profile.uuid === selectedValues.value
              );
              setUpdateFormData({
                ...updateFormData,
                farmerUUID: found?.uuid || "",
              });

              setSelectedCompany([
                {
                  value: found.uuid,
                  label: found.farmerCompanyName,
                },
              ]);
            }}
          />
        </div> */}
        <div className="form-group">
          <label>Company Name*</label>
          {/* <AsyncSelect
            value={updateFormData.FarmerProfile}
            loadOptions={getFarmer}
            className={`form-control uppercase`}
            classNamePrefix="select"
            noOptionsMessage={() => "Type to Search"}
            getOptionLabel={(option) => `${option.farmerCompanyName}`}
            getOptionValue={(option) => option.uuid}
            autoFocus={true}
            onChange={(selectedValues) => {
              // console.log({ selectedValues });

              const found = allFarmerProfilesByCompanyRegNo.find(
                (profile) => profile.uuid === selectedValues.uuid
              );
              setUpdateFormData({
                ...updateFormData,
                FarmerProfile: found,
                farmerUUID: found?.uuid || "",
                farmerName: "",
                addresses: [],
                address: "",
              });

              setSelectedCompany([
                {
                  value: found.uuid,
                  label: found.farmerCompanyName,
                },
              ]);
              setSelectedFarmArea({
                value: "",
                label: "",
              });
            }}
          /> */}
          <input
            className="form-control"
            value={updateFormData.farmerCompanyName || ""}
            disabled
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

              const encryptedFarmProfile = result.data?.searchFarmProfile || "";
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
            onChange={async (selectedValues) => {
              // console.log({ selectedValues });

              const found = allFarmProfilesByFarmer.find(
                (profile) => profile.uuid === selectedValues.value
              );
              const result = await client.query({
                query: GET_FARM_AREA_BY_COMPANYID_AND_FARM_AREA,
                variables: {
                  farmerUUID: updateFormData.farmerUUID,
                  farmArea: found.farmArea,
                },
                fetchPolicy: "no-cache",
              });

              setUpdateFormData({
                ...updateFormData,
                farmAreaId: found?.uuid || "",
                farmAddress: found?.address || "",
                farmerName: found?.farmerName || "",
                addresses:
                  result.data?.getFarmAddressByCompanyUUIDAndFarmArea || [],
                address: "",
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
            value={updateFormData.farmArea || ""}
            disabled
          />
        </div>
        <div className="form-group">
          <label>Farmer Name</label>
          <input
            disabled
            className="form-control uppercase"
            placeholder="Auto Filled (From Farmer Profile)"
            value={updateFormData.farmerName || ""}
          />
        </div>
        <div className="form-group">
          <div className="form-group ">
            <label>Farm Address</label>
            <input
              className="form-control"
              value={updateFormData.address || ""}
              disabled
            />
            {/* <select
              className="form-control uppercase"
              onChange={(e) => {
                if (e) e.preventDefault();
                setUpdateFormData({
                  ...updateFormData,
                  address: e.target.value,
                });
              }}
              value={updateFormData.address || ""}
            >
              <option value={""} disabled>
                Select Address
              </option>
              {updateFormData.addresses.map((addr) => (
                <option value={addr}>{addr}</option>
              ))}
            </select> */}
          </div>
        </div>
        <div className="form-group">
          <label>Miscellaneous Crop Name</label>
          {/* <Select
            value={selectedMiscellaneous}
            required
            options={allMiscellaneousCrops.map((pr) => {
              return {
                value: pr.uuid,
                label: `${pr.localName}`,
              };
            })}
            classNamePrefix="select"
            onChange={(selectedValues) => {
              const found = allMiscellaneousCrops.find(
                (p) => p.uuid === selectedValues.value
              );

              setUpdateFormData({
                ...updateFormData,
                localName: found?.localName || "",
                englishName: found?.englishName || "",
                miscellaneousCropUUID: found.uuid,
              });
              setSelectedMiscellaneous([
                {
                  label: found.localName,
                  value: found.uuid,
                },
              ]);
            }}
          /> */}
          <AsyncSelect
            value={updateFormData.MiscellaneousCrops}
            loadOptions={getCrops}
            className={`form-control uppercase`}
            classNamePrefix="select"
            noOptionsMessage={() => "Type to Search"}
            getOptionLabel={(option) => `${option.localName}`}
            getOptionValue={(option) => option.uuid}
            autoFocus={true}
            onChange={(selectedValues) => {
              // console.log({ selectedValues });

              const found = allMiscellaneousCrops.find(
                (profile) => profile.uuid === selectedValues.uuid
              );

              let { uuid, ...d } = found;
              setUpdateFormData({
                ...updateFormData,
                localName: found?.localName || "",
                englishName: found?.englishName || "",
                miscellaneousCropUUID: found.uuid,
                MiscellaneousCrops: found,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Miscellaneous Crop ID</label>
          <input
            disabled
            className="form-control uppercase"
            placeholder="Auto Filled"
            value={updateFormData.miscellaneousCropId || ""}
          />
        </div>
        <div className="form-group">
          <label>Production (Kg)</label>
          <NumberFormat
            className="form-control"
            value={updateFormData.production || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();

              const totalFarmValue = e.value * updateFormData.farmPrice;
              setUpdateFormData({
                ...updateFormData,
                production: e.formattedValue,
                totalFarmValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Cultivated Area / Veg.(Ha)</label>
          <NumberFormat
            displayType="text"
            className="form-control"
            value={updateFormData.cultivatedArea}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={3}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setUpdateFormData({
                ...updateFormData,
                cultivatedArea: e.floatValue || 0,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Farm Price / Kg ($)</label>
          <NumberFormat
            className="form-control"
            value={updateFormData.farmPrice || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              const totalFarmValue = e.value * updateFormData.production;
              setUpdateFormData({
                ...updateFormData,
                farmPrice: e.formattedValue || 0,
                totalFarmValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Total Form Value ($)</label>
          <NumberFormat
            disabled
            className="form-control"
            value={updateFormData.totalFarmValue || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
          />
        </div>
      </FormModal>

      <FormModal
        title={"New Miscellaneous Crops Production"}
        size="lg"
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setSelectedCompany([]);
          setSelectedFarmArea([]);
          setSelectedMiscellaneous([]);
          setFormData({
            records: [],
            addresses: [],
          });
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            const tokenizedPayload = formData.records.map((rec) => {
              let production = "" + rec.production;
              let farmPrice = "" + rec.farmPrice;
              let cultivatedArea = "" + rec.cultivatedArea;
              if (production) {
                production = parseFloat(production.replace(/,/g, ""));
              } else {
                production = 0;
              }
              if (farmPrice) {
                farmPrice = parseFloat(farmPrice.replace(/,/g, ""));
              } else {
                farmPrice = 0;
              }
              if (cultivatedArea) {
                cultivatedArea = parseFloat(cultivatedArea.replace(/,/g, ""));
              } else {
                cultivatedArea = 0;
              }

              return {
                monthYear: formData.monthYear,
                address: "" + formData.address,
                farmerUUID: formData.farmerUUID,
                farmAreaId: formData.farmAreaId,
                miscellaneousCropUUID: rec.miscellaneousCropUUID,
                production: parseFloat(production || 0),
                cultivatedArea: parseFloat(cultivatedArea || 0),
                farmPrice: parseFloat(farmPrice || 0),
                totalFarmValue: parseFloat(rec?.totalFarmValue || 0),
              };
            });

            const tokenized = jwt.sign({ tokenizedPayload }, TOKENIZE);

            await createMiscellaneousProduction({
              variables: {
                tokenized,
              },
            });

            // for (const rec of formData.records) {
            //   let production = "" + rec.production;
            //   let farmPrice = "" + rec.farmPrice;
            //   let cultivatedArea = "" + rec.cultivatedArea;

            //   if (production) {
            //     production = parseFloat(production.replace(/,/g, ""));
            //   } else {
            //     production = 0;
            //   }
            //   if (farmPrice) {
            //     farmPrice = parseFloat(farmPrice.replace(/,/g, ""));
            //   } else {
            //     farmPrice = 0;
            //   }

            //   if (cultivatedArea) {
            //     cultivatedArea = parseFloat(cultivatedArea.replace(/,/g, ""));
            //   } else {
            //     cultivatedArea = 0;
            //   }

            //   const tokenizedPayload = {
            //     monthYear: formData.monthYear,
            //     address: formData.address,
            //     farmerUUID: formData.farmerUUID,
            //     farmAreaId: formData.farmAreaId,

            //     miscellaneousCropUUID: rec.miscellaneousCropUUID,

            //     production: parseFloat(production || 0),
            //     cultivatedArea: parseFloat(cultivatedArea || 0),
            //     farmPrice: parseFloat(farmPrice || 0),
            //     totalFarmValue: parseFloat(rec?.totalFarmValue || 0),
            //   };
            //   const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

            //   await createMiscellaneousProduction({
            //     variables: {
            //       tokenized,
            //       // monthYear: formData.monthYear,

            //       // farmerUUID: formData.farmerUUID,
            //       // farmAreaId: formData.farmAreaId,

            //       // miscellaneousCropUUID: rec.miscellaneousCropUUID,

            //       // production: parseFloat(rec?.production || 0),
            //       // cultivatedArea: parseFloat(rec?.cultivatedArea || 0),
            //       // farmPrice: parseFloat(rec?.farmPrice || 0),
            //       // totalFarmValue: parseFloat(rec?.totalFarmValue || 0),
            //     },
            //   });
            // }

            notification.addNotification({
              title: "Succeess!",
              message: `Production saved!`,
              level: "success",
            });

            await refetch();
            setFormData({
              records: [],
              addresses: [],
            });
            setSelectedCompany([]);
            setSelectedFarmArea([]);
            setSelectedMiscellaneous([]);
            setSavedCount((savedCount += 1));
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Month & Year*</label>
          <input
            type="month"
            required
            className="form-control w-1/2 uppercase"
            value={formData.monthYear || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                monthYear: e.target.value,
              });
            }}
          />
        </div>
        {/* <div className="form-group">
          <label>Company Name*</label>
          <Select
            value={selectedCompany}
            options={allFarmerProfilesByCompanyRegNo.map((prof) => {
              return {
                value: prof.uuid,
                label: prof.farmerCompanyName,
              };
            })}
            className={`form-control  w-1/2`}
            classNamePrefix="select"
            onChange={(selectedValues) => {
              // console.log({ selectedValues });

              const found = allFarmerProfilesByCompanyRegNo.find(
                (profile) => profile.uuid === selectedValues.value
              );
              setFormData({
                ...formData,
                farmerUUID: found?.uuid || "",
              });

              setSelectedCompany([
                {
                  value: found.uuid,
                  label: found.farmerCompanyName,
                },
              ]);
            }}
          />
        </div> */}
        <div className="form-group">
          <label>Company Name*</label>
          {/* <AsyncSelect
            loadOptions={getFarmer}
            className={`form-control w-1/2 uppercase`}
            classNamePrefix="select"
            noOptionsMessage={() => "Type to Search"}
            getOptionLabel={(option) => `${option.farmerCompanyName}`}
            getOptionValue={(option) => option.uuid}
            autoFocus={true}
            onChange={(selectedValues) => {
              // console.log({ selectedValues });

              const found = allFarmerProfilesByCompanyRegNo.find(
                (profile) => profile.uuid === selectedValues.uuid
              );
              setFormData({
                ...formData,
                farmerUUID: found?.uuid || "",
                farmerName: "",
                addresses: [],
                address: "",
              });

              setSelectedCompany([
                {
                  value: found.uuid,
                  label: found.farmerCompanyName,
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
            className="form-control w-1/2"
            value={formData.farmerCompanyName || ""}
            disabled
          />
        </div>
        <button
          className="bg-purple-500 rounded-md w-1/2 mt-2 text-white py-2 px-3 shadow-md w-full"
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

              const encryptedFarmProfile = result.data?.searchFarmProfile || "";
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
        {formData.farmerUUID && (
          <div>
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
            className={`form-control  w-1/2 uppercase`}
            classNamePrefix="select"
            onChange={async (selectedValues) => {
              // console.log({ selectedValues });

              const found = allFarmProfilesByFarmer.find(
                (profile) => profile.uuid === selectedValues.value
              );

              const result = await client.query({
                query: GET_FARM_AREA_BY_COMPANYID_AND_FARM_AREA,
                variables: {
                  farmerUUID: formData.farmerUUID,
                  farmArea: found.farmArea,
                },
                fetchPolicy: "no-cache",
              });

              setFormData({
                ...formData,
                farmAreaId: found?.uuid || "",
                farmAddress: found?.address || "",
                farmerName: found?.farmerName || "",
                addresses:
                  result.data?.getFarmAddressByCompanyUUIDAndFarmArea || [],
                address: "",
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
                className="form-control w-1/2"
                value={formData.farmArea || ""}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Farmer Name</label>
              <input
                disabled
                placeholder="Auto Filled"
                className="form-control  w-1/2 uppercase"
                value={formData.farmerName || ""}
              />
            </div>
            <div className="form-group w-1/2">
              <label>Farm Address</label>
              <input
                className="form-control"
                value={formData.address || ""}
                disabled
              />
              {/* <select
            className="form-control uppercase"
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                address: e.target.value,
              });
            }}
            value={formData.address || ""}
          >
            <option value={""} disabled>
              Select Address
            </option>
            {formData.addresses.map((addr) => (
              <option value={addr}>{addr}</option>
            ))}
          </select> */}
            </div>
            <hr />
            <div className="flex justify-end mb-4">
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
                        production: 0,
                        cultivatedArea: 0,
                        farmPrice: 0,
                        totalFarmValue: 0,
                      },
                    ],
                  });
                }}
              >
                <i className="fa fa-plus" /> Add
              </button>
            </div>
            <div className="grid grid-cols-7 uppercase">
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md">
                Miscellaneous Crops Name
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md">
                Miscellaneous Crops ID
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md">
                Production (Kg)
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md">
                Farm Price/Kg ($)
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md">
                Cultivated Area/Miscellaneous Crops(Ha)
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md">
                Total Farm Value ($)
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md">
                {}
              </div>
            </div>
          </div>
        )}

        {formData.records.map((rec) => (
          <div className="grid grid-cols-7 my-2">
            <div className="pr-2">
              {/* <Select
                value={{
                  value: rec.miscellaneousCropUUID,
                  label: rec.localName,
                }}
                required
                options={allMiscellaneousCrops.map((pr) => {
                  return {
                    value: pr.uuid,
                    label: `${pr.localName}`,
                  };
                })}
                classNamePrefix="select"
                onChange={(selectedValues) => {
                  const found = allMiscellaneousCrops.find(
                    (p) => p.uuid === selectedValues.value
                  );

                  let { uuid, ...d } = found;

                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            ...d,
                            miscellaneousCropUUID: found.uuid,
                          }
                    ),
                  });
                  setSelectedMiscellaneous(found);
                }}
              /> */}
              <AsyncSelect
                value={rec.MiscCrops}
                loadOptions={getCrops}
                className={`uppercase`}
                classNamePrefix="select"
                noOptionsMessage={() => "Type to Search"}
                getOptionLabel={(option) => `${option.localName}`}
                getOptionValue={(option) => option.uuid}
                autoFocus={true}
                onChange={(selectedValues) => {
                  // console.log({ selectedValues });

                  const found = allMiscellaneousCrops.find(
                    (profile) => profile.uuid === selectedValues.uuid
                  );

                  let { uuid, ...d } = found;
                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            ...d,
                            MiscCrops: found,
                            miscellaneousCropUUID: uuid,
                          }
                    ),
                  });
                }}
              />
            </div>
            <div className="pr-2">
              <input
                disabled
                placeholder="Auto Filled"
                className="form-control"
                value={rec.miscellaneousCropId || ""}
              />
            </div>
            <div className="pr-2">
              <NumberFormat
                className="form-control"
                value={rec.production || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();

                  const totalFarmValue = e.value * rec.farmPrice;
                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            production: e.formattedValue || 0,
                            // totalFarmValue,
                          }
                    ),
                  });
                }}
              />
            </div>
            <div className="pr-2">
              <NumberFormat
                className="form-control"
                value={rec.farmPrice || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  const totalFarmValue = rec.production * e.value;
                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            farmPrice: e.formattedValue || 0,
                            // totalFarmValue,
                          }
                    ),
                  });
                }}
              />
            </div>
            <div className="pr-2">
              <NumberFormat
                className="form-control"
                value={rec.cultivatedArea || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={3}
                fixedDecimalScale={true}
                onChange={(e) => {
                  if (e) e.preventDefault();

                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            cultivatedArea: e.target.value,
                          }
                    ),
                  });
                }}
              />
            </div>
            <div className="pr-2">
              <NumberFormat
                disabled
                placeholder="Auto Calculate"
                className="form-control"
                value={rec.totalFarmValue || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
              />
            </div>
            <div>
              <button
                className="bg-red-500 px-4 py-2 rounded-md shadow-md text-white"
                onClick={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    records: formData.records.filter(
                      (re) => re.uuid !== rec.uuid
                    ),
                  });
                }}
              >
                <i className="fa fa-times" />
              </button>
            </div>
          </div>
        ))}
      </FormModal>
      <FormModal
        title={"Select Company"}
        size={"xl"}
        visible={companyModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setCompanyModalVisible(false);
          if (!updateFormData.uuid) {
            setModalVisible(true);
          } else {
            setUpdateFormDataVisible(true);
          }
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
                  <label>Search By Farm ID or Company Name</label>
                  <input
                    className="form-control"
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
                      "Production Miscellaneous Crops Export Excel:Read",
                    ])
                      ? "block"
                      : "hidden"
                  }`}
                  onClick={async (e) => {
                    if (e) e.preventDefault();
                    setExportModalVisible(true);
                    // showLoadingSpinner();
                    // try {
                    //   const response = await exportMiscellaneousProduction({
                    //     variables: {
                    //       monthYear: yearMonth,
                    //     },
                    //   });

                    //   window.open(
                    //     response.data.exportMiscellaneousProduction,
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
          data={allMiscellaneousProductions}
          withoutHeader={true}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          customUtilities={
            !currentUserDontHavePrivilege([
              "Production Miscellaneous Crops:Update",
            ])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege([
              "Production Miscellaneous Crops:Create",
            ])
              ? () => {
                  setFormData({
                    records: [],
                    addresses: [],
                  });
                  setModalVisible(true);
                  setSelectedCompany([]);
                  setSelectedFarmArea([]);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege([
              "Production Miscellaneous Crops:Delete",
            ])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} productions?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteMiscellaneousProduction({
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
