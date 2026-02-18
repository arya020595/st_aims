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
    countAllFruitProductionEstimateds(monthYear: $monthYear, filters: $filters)
  }
`;

const SEARCH_FRUIT_QUERY = gql`
  query searchAllCropsFruits($name: String) {
    searchAllCropsFruits(name: $name)
  }
`;

const SEARCH_FARMER_QUERY = gql`
  query searchQuery($name: String) {
    searchFarmerProfileByCompanyRegNo(name: $name)
  }
`;

const SEARCH_FARM_QUERY = gql`
  query searchFarmProfile($name: String) {
    searchFarmProfile(name: $name)
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

const PRODUCTION_QUERY = gql`
  query productionQuery(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllFruitProductionEstimateds(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
  }
`;

const GET_FRUIT_DETAIL = gql`
  query tokenizedAllCropsFruitDetailByCropFruitId($tokenizedParams: String!) {
    tokenizedAllCropsFruitDetailByCropFruitId(tokenizedParams: $tokenizedParams)
  }
`;

const CREATE_FRUIT_PRODUCTION_ESTIMATED = gql`
  mutation tokenizedCreateFruitProductionEstimated($tokenized: String!) {
    tokenizedCreateFruitProductionEstimated(tokenized: $tokenized)
  }
`;

const UPDATE_FRUIT_PRODUCTION_ESTIMATED = gql`
  mutation tokenizedUpdateFruitProductionEstimated($tokenized: String!) {
    tokenizedUpdateFruitProductionEstimated(tokenized: $tokenized)
  }
`;

const DELETE_FRUIT_PRODUCTION_ESTIMATED = gql`
  mutation tokenizedDeleteFruitProductionEstimated($tokenized: String!) {
    tokenizedDeleteFruitProductionEstimated(tokenized: $tokenized)
  }
`;

const EXPORT_FRUIT_PRODUCTION_ESTIMATED = gql`
  mutation exportFruitProductionEstimated(
    $monthYear: String!
    $farmerUUID: String
    $farmAreaId: String
    $fruitUUID: String
    $farmerName: String
  ) {
    exportFruitProductionEstimated(
      monthYear: $monthYear
      farmerUUID: $farmerUUID
      farmAreaId: $farmAreaId
      fruitUUID: $fruitUUID
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
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({
    records: [],
    addresses: [],
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportFormData, setExportFormData] = useState({});
  const notification = useNotification();
  const [registerType, setRegisterType] = useState("");
  const [updateFormData, setUpdateFormData] = useState({
    fruitDetails: [],
    addresses: [],
  });
  const [updateFormDataVisible, setUpdateFormDataVisible] = useState(false);

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
  const [exportFruitProductionEstimated] = useMutation(
    EXPORT_FRUIT_PRODUCTION_ESTIMATED
  );
  const [createFruitProductionEstimated] = useMutation(
    CREATE_FRUIT_PRODUCTION_ESTIMATED
  );
  const [updateFruitProductionEstimated] = useMutation(
    UPDATE_FRUIT_PRODUCTION_ESTIMATED
  );
  const [deleteFruitProductionEstimated] = useMutation(
    DELETE_FRUIT_PRODUCTION_ESTIMATED
  );

  const [allFarmerProfilesByCompanyRegNo, setAllFarmerProfilesByCompanyRegNo] =
    useState([]);
  const [allFruitProductionEstimateds, setAllFruitProductionEstimateds] =
    useState([]);
  const [allFarmProfilesByFarmer, setAllFarmProfilesByFarmer] = useState([]);
  const [allCropsFruits, setAllCropsFruits] = useState([]);
  const [allFarmProfile, setAllFarmProfile] = useState([]);
  let [savedCount, setSavedCount] = useState(0);
  const [companyModalVisible, setCompanyModalVisible] = useState(false);

  const [
    allFarmProfilesByFarmerForExport,
    setAllFarmProfilesByFarmerForExport,
  ] = useState([]);

  let [countFruitProductionEstimateds, setCountFruitProductionEstimateds] =
    useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countFruitProductionEstimateds) return 1;
    return Math.ceil(countFruitProductionEstimateds / pageSize);
  }, [countFruitProductionEstimateds, pageSize]);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedFarmerProfilesByCompanyRegNo = data?.tokenizedAllFarmerProfilesByCompanyRegNo || "";
      // let allFarmerProfilesByCompanyRegNo = [];
      // if (encryptedFarmerProfilesByCompanyRegNo) {
      //   const decrypted = jwt.verify(encryptedFarmerProfilesByCompanyRegNo, TOKENIZE);
      //   allFarmerProfilesByCompanyRegNo = decrypted.queryResult;
      //   setAllFarmerProfilesByCompanyRegNo(allFarmerProfilesByCompanyRegNo);
      // }

      // const encryptedFruitProductionEstimateds =
      //   data?.tokenizedAllFruitProductionEstimateds || "";
      // let allFruitProductionEstimateds = [];
      // if (encryptedFruitProductionEstimateds) {
      //   const decrypted = jwt.verify(
      //     encryptedFruitProductionEstimateds,
      //     TOKENIZE
      //   );
      //   allFruitProductionEstimateds = decrypted.queryResult;
      //   setAllFruitProductionEstimateds(allFruitProductionEstimateds);
      // }

      // const encryptedFarmProfilesByFarmer =
      //   data?.tokenizedAllFarmProfilesByFarmer || "";
      // let allFarmProfilesByFarmer = [];
      // if (encryptedFarmProfilesByFarmer) {
      //   const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
      //   allFarmProfilesByFarmer = decrypted.queryResult;
      //   setAllFarmProfilesByFarmer(allFarmProfilesByFarmer);
      // }

      const encryptedCropsFruits = data?.tokenizedAllCropsFruits || "";
      let allCropsFruits = [];
      if (encryptedCropsFruits) {
        const decrypted = jwt.verify(encryptedCropsFruits, TOKENIZE);
        allCropsFruits = decrypted.queryResult;
        setAllCropsFruits(allCropsFruits);
      }

      const countData = data?.countAllFruitProductionEstimateds || 0;
      setCountFruitProductionEstimateds(countData);
    }
  }, [data, loading, error, savedCount]);

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

    const encryptedFruitProductionEstimateds =
      result.data?.tokenizedAllFruitProductionEstimateds || "";
    let allFruitProductionEstimateds = [];
    if (encryptedFruitProductionEstimateds) {
      const decrypted = jwt.verify(
        encryptedFruitProductionEstimateds,
        TOKENIZE
      );
      allFruitProductionEstimateds = decrypted.queryResult;
      setAllFruitProductionEstimateds(allFruitProductionEstimateds);
    }

    const countData = result.data?.countAllFruitProductionEstimateds || 0;
    setCountFruitProductionEstimateds(countData);

    hideLoadingSpinner();
  }, [yearMonth, savedCount, pageIndex, pageSize, router.query.filters]);

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
    const result = await client.query({
      query: FARM_AREA_QUERY,
      variables: {
        tokenizedParams,
        onPage: "FRUIT ESTIMATED",
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

  const handlePageChange = useCallback(
    async ({ pageIndex, pageSize, filters }) => {
      // const ym = router.query.yearMonth || dayjs().format("YYYY-MM-DD");
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

  const fethchingFruit = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_FRUIT_QUERY,
      variables: {
        name: input,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedCropsFruits = result.data?.searchAllCropsFruits || "";
    let allCropsFruits = [];
    if (encryptedCropsFruits) {
      const decrypted = jwt.verify(encryptedCropsFruits, TOKENIZE);
      allCropsFruits = decrypted.queryResult;
      setAllCropsFruits(allCropsFruits);
    }
    callback(allCropsFruits);
  };

  const getFruit = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fethchingFruit(input, callback);
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

  //   const encryptedFarmerProfilesByCompanyRegNo =
  //     data?.tokenizedAllFarmerProfilesByCompanyRegNo || "";
  //   let allFarmerProfilesByCompanyRegNo = [];
  //   if (encryptedFarmerProfilesByCompanyRegNo) {
  //     const decrypted = jwt.verify(
  //       encryptedFarmerProfilesByCompanyRegNo,
  //       TOKENIZE
  //     );
  //     allFarmerProfilesByCompanyRegNo = decrypted.queryResult;
  //   }

  //   const encryptedFruitProductionEstimateds =
  //     data?.tokenizedAllFruitProductionEstimateds || "";
  //   let allFruitProductionEstimateds = [];
  //   if (encryptedFruitProductionEstimateds) {
  //     const decrypted = jwt.verify(encryptedFruitProductionEstimateds, TOKENIZE);
  //     allFruitProductionEstimateds = decrypted.queryResult;
  //   }

  //   const encryptedFarmProfilesByFarmer =
  //     data?.tokenizedAllFarmProfilesByFarmer || "";
  //   let allFarmProfilesByFarmer = [];
  //   if (encryptedFarmProfilesByFarmer) {
  //     const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
  //     allFarmProfilesByFarmer = decrypted.queryResult;
  //   }

  // const encryptedCropsFruits = data?.tokenizedAllCropsFruits || "";
  //   let allCropsFruits = [];
  //   if (encryptedCropsFruits) {
  //     const decrypted = jwt.verify(encryptedCropsFruits, TOKENIZE);
  //     allCropsFruits = decrypted.queryResult;
  //   }

  //   const encryptedFarmProfilesByFarmerForExport =
  //     data?.tokenizedAllFarmProfilesByFarmer || "";
  //   let allFarmProfilesByFarmerForExport = [];
  //   if (encryptedFarmProfilesByFarmerForExport) {
  //     const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
  //     allFarmProfilesByFarmerForExport = decrypted.queryResult;
  //   }

  // let allFarmProfilesByFarmerForExport = allFarmProfilesByFarmer;

  // allFarmProfilesByFarmerForExport = lodash.uniqBy(
  //   allFarmProfilesByFarmerForExport,
  //   (farm) => farm.farmArea
  // );
  const [selectedFruit, setSelectedFruit] = useState({});

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
                showLoadingSpinner();
                try {
                  // const farmArea = await client.query({
                  //   query: GET_FARM_AREA_BY_COMPANYID_AND_FARM_AREA,
                  //   variables: {
                  //     farmerUUID: props.row.original?.FarmerProfile?.uuid,
                  //     farmArea: props.row.original?.FarmProfile?.farmArea,
                  //   },
                  //   fetchPolicy: "no-cache",
                  // });
                  const tokenizedPayload = {
                    cropFruitId: props.row.original?.Fruit?.uuid || "",
                  };
                  const tokenizedParams = jwt.sign(tokenizedPayload, TOKENIZE);
                  let fruitDetails = await client.query({
                    query: GET_FRUIT_DETAIL,
                    variables: {
                      tokenizedParams,
                    },
                    fetchPolicy: "no-cache",
                  });

                  const encryptedFruitDetails =
                    fruitDetails.data
                      .tokenizedAllCropsFruitDetailByCropFruitId || "";
                  if (encryptedFruitDetails) {
                    const decrypted = jwt.verify(
                      encryptedFruitDetails,
                      TOKENIZE
                    );
                    fruitDetails = decrypted.queryResult;
                  }

                  setUpdateFormDataVisible(true);
                  setUpdateFormData({
                    ...props.row.original,
                    Fruit: props.row.original.Fruit || {},
                    fruitUUID: props.row.original?.Fruit?.uuid || "",
                    farmAreaId: props.row.original?.FarmProfile?.uuid || "",
                    farmerUUID: props.row.original?.FarmerProfile?.uuid || "",
                    farmerName:
                      props.row.original?.FarmProfile?.farmerName || "",
                    farmAddress: props.row.original?.FarmProfile?.address || "",
                    farmerCompanyName:
                      props.row.original?.FarmProfile?.farmerCompanyName || "",
                    farmArea: props.row.original?.FarmProfile?.farmArea || "",

                    englishName: props.row.original?.Fruit?.englishName || "",
                    localName: props.row.original?.Fruit?.localName || "",
                    fruitId: props.row.original?.Fruit?.fruitId || "",
                    // addresses:
                    //   farmArea.data.getFarmAddressByCompanyUUIDAndFarmArea ||
                    //   [],

                    fruitDetails,
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

                  setSelectedFruit([
                    {
                      value: props.row.original?.Fruit?.uuid || "",
                      label: props.row.original?.Fruit?.localName || "",
                    },
                  ]);
                } catch (err) {
                  notification.handleError(err);
                }
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
      Header: "Month & Year",
      accessor: "monthYear",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <span>{dayjs(props.value).format("YYYY-MM")}</span>,
      disableFilters: true,
    },
    {
      Header: "Company Name",
      accessor: "FarmerProfile.farmerCompanyName",
      style: {
        fontSize: 20,
      },
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
    },
    {
      Header: "Farmer Name",
      accessor: "FarmProfile.farmerName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Farm Address",
      accessor: "address",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Fruit Name",
      accessor: "Fruit.localName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Fruit ID",
      accessor: "Fruit.fruitId",
      style: {
        fontSize: 20,
      },
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
      Header: "Estimated Total Farm Value ($)",
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
    <div>
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
          setSelectedFruit([]);
          setSelectedExportFarmerName([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setExportModalVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportFruitProductionEstimated({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            // Convert base64 to blob
            const base64Response = response.data.exportFruitProductionEstimated;
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
            link.download = "fruit_production_estimated.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);

            // window.open(
            //   response.data.exportFruitProductionEstimated,
            //   "__blank"
            // );
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
                    label: `${found.farmId}-${found.farmArea}` || "",
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
            <label>Fruit Name</label>
            {/* <Select
              isClearable={true}
              className="form-control"
              value={selectedFruit}
              required
              options={allCropsFruits.map((pr) => {
                return {
                  value: pr.uuid,
                  label: `${pr.localName}`,
                };
              })}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                const found = allCropsFruits.find((p) =>
                  selectedValues ? p.uuid === selectedValues.value : null
                );

                setExportFormData({
                  ...exportFormData,
                  fruitUUID: found?.uuid || "",
                });
                setSelectedFruit([
                  {
                    label: found?.localName || "",
                    value: found?.uuid || "",
                  },
                ]);
              }}
            /> */}
            <AsyncSelect
              value={exportFormData.Fruit}
              loadOptions={getFruit}
              className={`form-control`}
              classNamePrefix="select"
              noOptionsMessage={() => "Type to Search"}
              getOptionLabel={(option) => `${option.localName}`}
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              onChange={async (selectedValues) => {
                // console.log({ selectedValues });

                const found = allCropsFruits.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.uuid : null
                );

                setExportFormData({
                  ...exportFormData,
                  fruitUUID: found?.uuid || "",
                });
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
        title={`Edit Fruit Production`}
        visible={updateFormDataVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setUpdateFormDataVisible(false);
          setSelectedCompany([]);
          setSelectedFarmArea([]);
          setSelectedFruit([]);
          setUpdateFormData({
            fruitDetails: [],
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
            delete updateFormData.farmArea;
            delete updateFormData.farmerCompanyName;
            const tokenizedPayload = {
              ...updateFormData,
              address: "" + updateFormData.address,
              noOfFruitTrees: parseFloat(updateFormData.noOfFruitTrees || 0),
              economicLifeYear: parseFloat(
                updateFormData.economicLifeYear || 0
              ),
              estimatedYield: parseFloat(updateFormData.estimatedYield || 0),

              production: parseFloat(production || 0),
              cultivatedArea: parseFloat(cultivatedArea || 0),
              farmPrice: parseFloat(farmPrice || 0),
              totalFarmValue: parseFloat(updateFormData.totalFarmValue || 0),
            };
            const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

            await updateFruitProductionEstimated({
              variables: {
                tokenized,
                // ...updateFormData,
                // noOfFruitTrees: parseFloat(updateFormData.noOfFruitTrees || 0),
                // economicLifeYear: parseFloat(
                //   updateFormData.economicLifeYear || 0
                // ),
                // estimatedYield: parseFloat(updateFormData.estimatedYield || 0),

                // production: parseFloat(updateFormData.production || 0),
                // cultivatedArea: parseFloat(updateFormData.cultivatedArea || 0),
                // farmPrice: parseFloat(updateFormData.farmPrice || 0),
                // totalFarmValue: parseFloat(updateFormData.totalFarmValue || 0),
              },
            });
            notification.addNotification({
              title: "Succeess!",
              message: `Estimated saved!`,
              level: "success",
            });

            await refetch();
            setUpdateFormDataVisible(false);
            setUpdateFormData({
              fruitDetails: [],
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
            className="form-control"
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
          <label>Company Name</label>
          {/* <AsyncSelect
            value={updateFormData.FarmerProfile}
            loadOptions={getFarmer}
            className={`form-control`}
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
              });

              setSelectedCompany([
                {
                  value: found.uuid,
                  label: found.farmerCompanyName,
                },
              ]);

              setSelectedFarmArea([
                {
                  label: "",
                  value: "",
                },
              ]);
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
            className={`form-control`}
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
            disabled
            value={updateFormData.farmArea}
          />
        </div>
        <div className="form-group">
          <label>Farmer Name</label>
          <input
            disabled
            className="form-control"
            placeholder="Auto Filled (From Farmer Profile)"
            value={updateFormData.farmerName || ""}
          />
        </div>
        <div className="form-group">
          <div className="form-group">
            <label>Farm Address</label>
            <input
              className="form-control"
              value={updateFormData.address}
              disabled
            />
            {/* <select
              className="form-control"
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
          <label>Fruit Name</label>
          <AsyncSelect
            value={updateFormData.Fruit}
            loadOptions={getFruit}
            className={`form-control`}
            classNamePrefix="select"
            noOptionsMessage={() => "Type to Search"}
            getOptionLabel={(option) => `${option.localName}`}
            getOptionValue={(option) => option.uuid}
            autoFocus={true}
            onChange={async (selectedValues) => {
              // console.log({ selectedValues });

              const found = allCropsFruits.find((profile) =>
                selectedValues ? profile.uuid === selectedValues.uuid : null
              );

              const tokenizedPayload = {
                uuid: found.uuid,
              };

              const tokenizedParams = jwt.sign(tokenizedPayload, TOKENIZE);

              let fruitDetails = await client.query({
                query: GET_FRUIT_DETAIL,
                variables: {
                  tokenizedParams,
                },
                fetchPolicy: "no-cache",
              });

              const encryptedFruitDetails =
                fruitDetails.data.tokenizedAllCropsFruitDetailByCropFruitId ||
                "";
              if (encryptedFruitDetails) {
                const decrypted = jwt.verify(encryptedFruitDetails, TOKENIZE);
                fruitDetails = decrypted.queryResult;
              }

              setUpdateFormData({
                ...updateFormData,
                economicLifeYear: 0,
                estimatedYield: 0,
                localName: found?.localName || "",
                englishName: found?.englishName || "",
                fruitUUID: found.uuid,
                fruitId: found.fruitId,
                Fruit: found,
                fruitDetails,
              });
            }}
          />
          {/* <Select
            value={selectedFruit}
            required
            options={allCropsFruits.map((pr) => {
              return {
                value: pr.uuid,
                label: `${pr.localName}`,
              };
            })}
            classNamePrefix="select"
            onChange={async (selectedValues) => {
              const found = allCropsFruits.find(
                (p) => p.uuid === selectedValues.value
              );

              const tokenizedPayload = {
                cropFruitId: found.uuid,
              };

              const tokenizedParams = jwt.sign(tokenizedPayload, TOKENIZE);

              let fruitDetails = await client.query({
                query: GET_FRUIT_DETAIL,
                variables: {
                  tokenizedParams,
                },
                fetchPolicy: "no-cache",
              });

              const encryptedFruitDetails =
                fruitDetails.data.tokenizedAllCropsFruitDetailByCropFruitId ||
                "";
              if (encryptedFruitDetails) {
                const decrypted = jwt.verify(encryptedFruitDetails, TOKENIZE);
                fruitDetails = decrypted.queryResult;
              }

              setUpdateFormData({
                ...updateFormData,
                localName: found?.localName || "",
                englishName: found?.englishName || "",
                fruitUUID: found.uuid,
                fruitDetails,
              });
              setSelectedFruit([
                {
                  label: found.localName,
                  value: found.uuid,
                },
              ]);
            }}
          /> */}
        </div>
        <div className="form-group">
          <label>Fruit ID</label>
          <input
            disabled
            className="form-control"
            placeholder="Auto Filled"
            value={updateFormData.fruitId || ""}
          />
        </div>
        <div className="form-group">
          <label>No of Fruiting Trees (Based on Age)</label>
          <NumberFormat
            className="form-control"
            value={updateFormData.noOfFruitTrees || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();

              setUpdateFormData({
                ...updateFormData,
                noOfFruitTrees: e.floatValue,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Economic Life Year</label>
          <select
            className="form-control"
            value={updateFormData.economicLifeYear}
            onChange={(e) => {
              if (e) e.preventDefault();
              setUpdateFormData({
                ...updateFormData,
                economicLifeYear: parseFloat(e.target.value),
              });
            }}
          >
            <option value={0} disabled>
              Select Economic Life
            </option>
            {updateFormData.fruitDetails.map((det) => (
              <option value={det.economicLife}>{det.economicLife}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Estimated Yield (Kg)</label>
          <select
            className="form-control"
            value={updateFormData.estimatedYield}
            onChange={(e) => {
              if (e) e.preventDefault();
              setUpdateFormData({
                ...updateFormData,
                estimatedYield: parseFloat(e.target.value),
              });
            }}
          >
            <option value={0} disabled>
              Select Estimated Yield
            </option>
            {updateFormData.fruitDetails.map((det) => (
              <option value={det.estimatedYield}>{det.estimatedYield}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Production / Tree (Kg)</label>
          <NumberFormat
            className="form-control"
            value={updateFormData.production || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();

              const val = parseFloat(e.value || 0);
              const totalFarmValue =
                val * updateFormData.farmPrice * updateFormData.noOfFruitTrees;
              setUpdateFormData({
                ...updateFormData,
                production: e.formattedValue,
                totalFarmValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Farm Price per Kg ($)</label>
          <NumberFormat
            className="form-control"
            value={updateFormData.farmPrice || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              const val = parseFloat(e.value || 0);
              const totalFarmValue =
                val * updateFormData.production * updateFormData.noOfFruitTrees;
              setUpdateFormData({
                ...updateFormData,
                farmPrice: e.formattedValue,
                totalFarmValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Cultivated Area/Fruit (Ha)</label>
          <NumberFormat
            className="form-control"
            value={updateFormData.cultivatedArea || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={3}
            fixedDecimalScale={true}
            onChange={(e) => {
              if (e) e.preventDefault();
              setUpdateFormData({
                ...updateFormData,
                cultivatedArea: e.target.value,
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
        size={"xl"}
        title={`${!formData.uuid ? "New" : "Edit"} Production`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setSelectedCompany([]);
          setSelectedFarmArea([]);
          setSelectedFruit([]);
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
            const fruitUUIDNotExist = formData.records.some(
              (rec) => !rec.hasOwnProperty("fruitUUID")
            );

            if (fruitUUIDNotExist) {
              throw new Error("Filed Cannot Be Empty");
            }

            for (const rec of formData.records) {
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

              const tokenizedPayload = {
                monthYear: formData.monthYear,
                address: "" + formData.address,
                farmerUUID: formData.farmerUUID,
                farmAreaId: formData.farmAreaId,

                fruitUUID: rec.fruitUUID,

                noOfFruitTrees: parseFloat(rec?.noOfFruitTrees || 0),
                economicLifeYear: parseFloat(rec?.economicLifeYear || 0),
                estimatedYield: parseFloat(rec?.estimatedYield || 0),

                production: parseFloat(production || 0),
                cultivatedArea: parseFloat(cultivatedArea || 0),
                farmPrice: parseFloat(farmPrice || 0),
                totalFarmValue: parseFloat(rec?.totalFarmValue || 0),
              };

              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await createFruitProductionEstimated({
                variables: {
                  tokenized,
                  // monthYear: formData.monthYear,

                  // farmerUUID: formData.farmerUUID,
                  // farmAreaId: formData.farmAreaId,

                  // fruitUUID: rec.fruitUUID,

                  // noOfFruitTrees: parseFloat(rec?.noOfFruitTrees || 0),
                  // economicLifeYear: parseFloat(rec?.economicLifeYear || 0),
                  // estimatedYield: parseFloat(rec?.estimatedYield || 0),

                  // production: parseFloat(rec?.production || 0),
                  // cultivatedArea: parseFloat(rec?.cultivatedArea || 0),
                  // farmPrice: parseFloat(rec?.farmPrice || 0),
                  // totalFarmValue: parseFloat(rec?.totalFarmValue || 0),
                },
              });
            }
            notification.addNotification({
              title: "Succeess!",
              message: `Estimated saved!`,
              level: "success",
            });

            await refetch();
            setFormData({
              records: [],
              addresses: [],
            });
            setSelectedCompany([{ value: "", label: "" }]);
            setSelectedFarmArea([{ value: "", label: "" }]);
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
          <input
            className="form-control w-1/2"
            value={formData.farmerCompanyName || ""}
            disabled
          />
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
              });

              setSelectedCompany([
                {
                  value: found.uuid,
                  label: found.farmerCompanyName,
                },
              ]);
            }}
          /> */}
        </div>
        <button
          className="bg-purple-500 rounded-md mt-2 w-1/2 text-white py-2 px-3 shadow-md w-full"
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
                        noOfFruitTrees: 0,
                        economicLifeYear: 0,
                        estimatedYield: 0,

                        production: 0,
                        cultivatedArea: 0,
                        farmPrice: 0,
                        totalFarmValue: 0,
                        fruitDetails: [],
                      },
                    ],
                  });
                }}
              >
                <i className="fa fa-plus" /> Add
              </button>
            </div>

            <div className="grid grid-cols-10 uppercase">
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-3">
                Fruit Name
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-3">
                Fruit ID
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-3">
                No Of Fruiting Trees (Based on Age)
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-3">
                Economic Life Year
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-3">
                Estimated Yield (Kg)
              </div>

              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-3">
                Production / Tree (Kg)
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-3">
                Farm Price/Kg ($)
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-3">
                Cultivated Area/Fruit (Ha)
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-3">
                Estimated Total Farm Value ($)
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-3">
                {}
              </div>
            </div>
          </div>
        )}

        {formData.records.map((rec) => (
          <div className="grid grid-cols-10 my-2">
            <div className="pr-2">
              <AsyncSelect
                value={rec.Fruit}
                loadOptions={getFruit}
                className={`form-control uppercase`}
                classNamePrefix="select"
                noOptionsMessage={() => "Type to Search"}
                getOptionLabel={(option) => `${option.localName}`}
                getOptionValue={(option) => option.uuid}
                autoFocus={true}
                onChange={async (selectedValues) => {
                  // console.log({ selectedValues });

                  const found = allCropsFruits.find((profile) =>
                    selectedValues ? profile.uuid === selectedValues.uuid : null
                  );

                  const { uuid, ...d } = found;
                  const tokenizedPayload = {
                    uuid: uuid,
                  };
                  const tokenizedParams = jwt.sign(tokenizedPayload, TOKENIZE);

                  let fruitDetails = await client.query({
                    query: GET_FRUIT_DETAIL,
                    variables: {
                      tokenizedParams,
                    },
                    fetchPolicy: "no-cache",
                  });

                  const encryptedFruitDetails =
                    fruitDetails.data
                      .tokenizedAllCropsFruitDetailByCropFruitId || "";
                  if (encryptedFruitDetails) {
                    const decrypted = jwt.verify(
                      encryptedFruitDetails,
                      TOKENIZE
                    );
                    fruitDetails = decrypted.queryResult;
                  }
                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            ...d,
                            Fruit: found,
                            fruitUUID: uuid,
                            fruitDetails,
                            estimatedYield: 0,
                            economicLifeYear: 0,
                            cultivatedArea: 0,
                          }
                    ),
                  });
                }}
              />
              {/* <Select
                value={{
                  value: rec.fruitUUID,
                  label: rec.localName,
                }}
                required
                options={allCropsFruits.map((pr) => {
                  return {
                    value: pr.uuid,
                    label: `${pr.localName}`,
                  };
                })}
                classNamePrefix="select"
                onChange={async (selectedValues) => {
                  const found = allCropsFruits.find(
                    (p) => p.uuid === selectedValues.value
                  );
                  const { uuid, ...d } = found;
                  const tokenizedPayload = {
                    cropFruitId: uuid,
                  };
                  const tokenizedParams = jwt.sign(tokenizedPayload, TOKENIZE);

                  let fruitDetails = await client.query({
                    query: GET_FRUIT_DETAIL,
                    variables: {
                      tokenizedParams,
                    },
                    fetchPolicy: "no-cache",
                  });

                  const encryptedFruitDetails =
                    fruitDetails.data
                      .tokenizedAllCropsFruitDetailByCropFruitId || "";
                  if (encryptedFruitDetails) {
                    const decrypted = jwt.verify(
                      encryptedFruitDetails,
                      TOKENIZE
                    );
                    fruitDetails = decrypted.queryResult;
                  }

                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                          ...rec,
                          ...d,
                          fruitUUID: found.uuid,
                          fruitDetails,
                          estimatedYield: 0,
                          economicLifeYear: 0,
                          cultivatedArea: 0,
                        }
                    ),
                  });
                  setSelectedFruit(found);
                }}
              /> */}
            </div>
            <div className="pr-2">
              <input
                disabled
                placeholder="Auto Filled"
                className="form-control"
                value={rec.fruitId || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            fruitId: e.target.value,
                          }
                    ),
                  });
                }}
              />
            </div>
            <div className="pr-2">
              <NumberFormat
                className="form-control"
                value={rec.noOfFruitTrees || ""}
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
                            noOfFruitTrees: e.floatValue,
                          }
                    ),
                  });
                }}
              />
            </div>

            <div className="pr-2">
              <select
                className="form-control"
                value={rec.economicLifeYear}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            economicLifeYear: parseFloat(e.target.value),
                          }
                    ),
                  });
                }}
              >
                <option value={0} disabled>
                  Select Economic Life
                </option>
                {rec.fruitDetails
                  .filter((fd) => fd.cropFruitId === rec.fruitUUID)
                  .map((det) => (
                    <option value={det.economicLife}>{det.economicLife}</option>
                  ))}
              </select>
            </div>
            <div className="pr-2">
              <select
                className="form-control"
                value={rec.estimatedYield}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            estimatedYield: parseFloat(e.target.value),
                          }
                    ),
                  });
                }}
              >
                <option value={0} disabled>
                  Select Estimated Yield
                </option>
                {rec.fruitDetails
                  .filter((fd) => fd.cropFruitId === rec.fruitUUID)
                  .map((det) => (
                    <option value={det.estimatedYield}>
                      {det.estimatedYield}
                    </option>
                  ))}
              </select>
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
                  const val = parseFloat(e.value || 0);
                  const totalFarmValue =
                    val * rec.farmPrice * rec.noOfFruitTrees;
                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            production: e.formattedValue,
                            totalFarmValue,
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
                  const val = parseFloat(e.value || 0);
                  const totalFarmValue =
                    rec.production * val * rec.noOfFruitTrees;
                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            farmPrice: e.formattedValue,
                            totalFarmValue,
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
                fixedDecimalScale={true}
                decimalScale={3}
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
      {/* Modal Search company*/}
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
      <div className="pr-0 md:pr-10 py-4 h-full">
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
                      "Estimate Production Fruit Export Excel:Read",
                    ])
                      ? "block"
                      : "hidden"
                  }`}
                  onClick={async (e) => {
                    if (e) e.preventDefault();
                    setExportModalVisible(true);
                    // showLoadingSpinner();
                    // try {
                    //   const response = await exportFruitProductionEstimated({
                    //     variables: {
                    //       monthYear: yearMonth,
                    //     },
                    //   });

                    //   window.open(
                    //     response.data.exportFruitProductionEstimated,
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
          data={allFruitProductionEstimateds}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege(["Estimate Production Fruit:Create"])
              ? () => {
                  setFormData({
                    records: [],
                    addresses: [],
                  });
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Estimate Production Fruit:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} estimated?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteFruitProductionEstimated({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      setSavedCount((savedCount += 1));
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} estimated deleted`,
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
          customUtilities={
            !currentUserDontHavePrivilege(["Estimate Production Fruit:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </div>
  );
};

export default withApollo({ ssr: true })(page);
