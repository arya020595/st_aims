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
import { create, filter, uniqBy } from "lodash";
import { from } from "apollo-link";
import { configure } from "nprogress";
import Head from "next/dist/next-server/lib/head";
import { Leaf } from "slate";
import { v4 as uuidv4 } from "uuid";
import NumberFormat from "react-number-format";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import dayjs from "dayjs";
import { MonthAndYearsFilterWithExport } from "../../components/MonthAndYearsFilterWithExport";
import lodash from "lodash";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERIES = gql`
  query listQueries($monthYear: String!, $filters: String) {
    tokenizedAllCropsCutFlowers

    tokenizedAllCropsSellingLocations

    countAllCutFlowerProductions(monthYear: $monthYear, filters: $filters)
  }
`;
const PRODUCTION_QUERY = gql`
  query productionQuery(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllCutFlowerProductions(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllCutFlowerProductions(monthYear: $monthYear, filters: $filters)
  }
`;

const SEARCH_FARMER_QUERY = gql`
  query searchQuery($name: String!) {
    searchFarmerProfileByCompanyRegNo(name: $name)
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

const FARM_AREA_QUERY = gql`
  query farmAreaQuery($tokenizedParams: String!, $onPage: String) {
    tokenizedAllFarmProfilesByFarmer(
      tokenizedParams: $tokenizedParams
      onPage: $onPage
    )
  }
`;

const SEARCH_FARM_QUERY = gql`
  query searchFarmProfile($name: String) {
    searchFarmProfile(name: $name)
  }
`;

const CREATE_CUT_FLOWER_PRODUCTION = gql`
  mutation tokenizedCreateManyCutFlowerProduction($tokenized: String!) {
    tokenizedCreateManyCutFlowerProduction(tokenized: $tokenized)
  }
`;

const UPDATE_CUT_FLOWER_PRODUCTION = gql`
  mutation tokenizedUpdateCutFlowerProduction($tokenized: String!) {
    tokenizedUpdateCutFlowerProduction(tokenized: $tokenized)
  }
`;

const DELETE_CUT_FLOWER_PRODUCTION = gql`
  mutation tokenizedDeleteCutFlowerProduction($tokenized: String!) {
    tokenizedDeleteCutFlowerProduction(tokenized: $tokenized)
  }
`;

const EXPORT_PRODUCTION = gql`
  mutation exportCutFlower(
    $monthYear: String!
    $farmerUUID: String
    $farmAreaId: String
    $cutFlowerUUID: String
    $farmerName: String
  ) {
    exportCutFlower(
      monthYear: $monthYear
      farmerUUID: $farmerUUID
      farmAreaId: $farmAreaId
      cutFlowerUUID: $cutFlowerUUID
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
  const [formData, setFormData] = useState({
    records: [],
    addresses: [],
  });

  const [updateFormData, setUpdateFormData] = useState({
    addresses: [],
  });
  const [updateFormDataVisible, setUpdateFormDataVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportFormData, setExportFormData] = useState({});
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [allFarmProfile, setAllFarmProfile] = useState([]);
  const [registerType, setRegisterType] = useState("");
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
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

  let [countCutFlowerProductions, setCountCutFlowerProductions] = useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countCutFlowerProductions) return 1;
    return Math.ceil(countCutFlowerProductions / pageSize);
  }, [countCutFlowerProductions, pageSize]);

  const [createCutFlowerProduction] = useMutation(CREATE_CUT_FLOWER_PRODUCTION);
  const [updateCutFlowerProduction] = useMutation(UPDATE_CUT_FLOWER_PRODUCTION);
  const [deleteCutFlowerProduction] = useMutation(DELETE_CUT_FLOWER_PRODUCTION);
  const [exportCutFlower] = useMutation(EXPORT_PRODUCTION);

  const [allFarmerProfilesByCompanyRegNo, setAllFarmerProfilesByCompanyRegNo] =
    useState([]);
  const [allCutFlowerProductions, setAllCutFlowerProductions] = useState([]);
  const [allFarmProfilesByFarmer, setAllFarmProfilesByFarmer] = useState([]);
  const [allCropsCutFlowers, setAllCropsCutFlowers] = useState([]);
  const [allCropsSellingLocations, setAllCropsSellingLocations] = useState([]);
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

      // const encryptedCutFlowerProductions =
      //   data?.tokenizedAllCutFlowerProductions || "";
      // let allCutFlowerProductions = [];
      // if (encryptedCutFlowerProductions) {
      //   const decrypted = jwt.verify(encryptedCutFlowerProductions, TOKENIZE);
      //   allCutFlowerProductions = decrypted.queryResult;
      //   setAllCutFlowerProductions(allCutFlowerProductions);
      // }

      // const encryptedFarmProfilesByFarmer =
      //   data?.tokenizedAllFarmProfilesByFarmer || "";
      // let allFarmProfilesByFarmer = [];
      // if (encryptedFarmProfilesByFarmer) {
      //   const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
      //   allFarmProfilesByFarmer = decrypted.queryResult;
      //   setAllFarmProfilesByFarmer(allFarmProfilesByFarmer);
      // }

      const encryptedCropsCutFlowers = data?.tokenizedAllCropsCutFlowers || "";
      let allCropsCutFlowers = [];
      if (encryptedCropsCutFlowers) {
        const decrypted = jwt.verify(encryptedCropsCutFlowers, TOKENIZE);
        allCropsCutFlowers = decrypted.queryResult;
        setAllCropsCutFlowers(allCropsCutFlowers);
      }

      const encryptedCropsSellingLocations =
        data?.tokenizedAllCropsSellingLocations || "";
      let allCropsSellingLocations = [];
      if (encryptedCropsSellingLocations) {
        const decrypted = jwt.verify(encryptedCropsSellingLocations, TOKENIZE);
        allCropsSellingLocations = decrypted.queryResult;
        setAllCropsSellingLocations(allCropsSellingLocations);
      }

      const countData = data?.countAllCutFlowerProductions || 0;
      setCountCutFlowerProductions(countData);
    }
  }, [data, loading, error, savedCount]);

  useEffect(async () => {
    const result = await client.query({
      query: FARM_AREA_QUERY,
      variables: {
        tokenizedParams,
        onPage: "CUT FLOWER PRODUCTION",
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
      query: PRODUCTION_QUERY,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedCutFlowerProductions =
      result.data?.tokenizedAllCutFlowerProductions || "";
    let allCutFlowerProductions = [];
    if (encryptedCutFlowerProductions) {
      const decrypted = jwt.verify(encryptedCutFlowerProductions, TOKENIZE);
      allCutFlowerProductions = decrypted.queryResult;
      setAllCutFlowerProductions(allCutFlowerProductions);
    }
    const countData = result.data?.countAllCutFlowerProductions || 0;
    setCountCutFlowerProductions(countData);
    hideLoadingSpinner();
  }, [savedCount, yearMonth, pageSize, pageIndex, router.query.filters]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      countFarmValue();
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [formData, formData.records]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      countFarmValueEdit();
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [updateFormData]);

  // const countFarmValue = () => {
  // OLD
  // setFormData({
  //   ...formData,
  //   records: formData.records.map((rec) => {
  //     let quantity = "" + rec.quantity;
  //     let sellingPrice = "" + rec.sellingPrice;
  //     if (quantity) {
  //       quantity = parseFloat(quantity.replace(/,/g, ""));
  //     } else {
  //       quantity = 0;
  //     }
  //     if (sellingPrice) {
  //       sellingPrice = parseFloat(sellingPrice.replace(/,/g, ""));
  //     } else {
  //       sellingPrice = 0;
  //     }
  //     return {
  //       ...rec,
  //       totalRevenue: quantity * sellingPrice,
  //     };
  //   }),
  // });
  // };

  const countFarmValue = () => {
    setFormData({
      ...formData,
      records: formData.records.map((rec) => {
        let quantity = convertToFloat(rec.quantity || 0);
        let sellingPrice = convertToFloat(rec.sellingPrice || 0);
        let totalRevenue = convertToFloat(rec.totalRevenue || 0);

        if (quantity && sellingPrice) {
          totalRevenue = quantity * sellingPrice;
          // console.log("totalRevenue", totalRevenue);
          return {
            ...rec,
            totalRevenue,
          };
        } else if (quantity && !sellingPrice && totalRevenue) {
          sellingPrice = totalRevenue / quantity;
          // console.log("sellingPrice", sellingPrice);
          return {
            ...rec,
            sellingPrice,
          };
        } else if (!quantity && sellingPrice && totalRevenue) {
          quantity = totalRevenue / sellingPrice;
          // console.log("quantity", quantity);
          return {
            ...rec,
            quantity,
          };
        } else {
          return {
            ...rec,
          };
        }
      }),
    });
  };

  const countFarmValueEdit = async () => {
    let quantity = convertToFloat(updateFormData.quantity || 0);
    let sellingPrice = convertToFloat(updateFormData.sellingPrice || 0);
    let totalRevenue = convertToFloat(updateFormData.totalRevenue || 0);

    if (quantity && sellingPrice) {
      totalRevenue = quantity * sellingPrice;
      // console.log("totalRevenue", totalRevenue);
    } else if (quantity && !sellingPrice && totalRevenue) {
      sellingPrice = totalRevenue / quantity;
      // console.log("sellingPrice", sellingPrice);
    } else if (!quantity && sellingPrice && totalRevenue) {
      quantity = totalRevenue / sellingPrice;
      // console.log("quantity", quantity);
    }
    setUpdateFormData({
      ...updateFormData,
      quantity,
      sellingPrice,
      totalRevenue,
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

  // const encryptedCutFlowerProductions =
  //   data?.tokenizedAllCutFlowerProductions || "";
  // let allCutFlowerProductions = [];
  // if (encryptedCutFlowerProductions) {
  //   const decrypted = jwt.verify(encryptedCutFlowerProductions, TOKENIZE);
  //   allCutFlowerProductions = decrypted.queryResult;
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

  // const encryptedCropsCutFlowers = data?.tokenizedAllCropsCutFlowers || "";
  // let allCropsCutFlowers = [];
  // if (encryptedCropsCutFlowers) {
  //   const decrypted = jwt.verify(encryptedCropsCutFlowers, TOKENIZE);
  //   allCropsCutFlowers = decrypted.queryResult;
  // }

  // const encryptedCropsSellingLocations =
  //   data?.tokenizedAllCropsSellingLocations || "";
  // let allCropsSellingLocations = [];
  // if (encryptedCropsSellingLocations) {
  //   const decrypted = jwt.verify(encryptedCropsSellingLocations, TOKENIZE);
  //   allCropsSellingLocations = decrypted.queryResult;
  // }

  // let allFarmProfilesByFarmerForExport = allFarmProfilesByFarmer;

  // allFarmProfilesByFarmerForExport = lodash.uniqBy(
  //   allFarmProfilesByFarmerForExport,
  //   (farm) => farm.farmArea
  // );

  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const [selectedCutFlower, setSelectedCutFlower] = useState({});

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

  const [selectedSellingLocation, setSelectedSellingLocation] = useState([
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
                  cutFlowerUUID: props.row.original?.CutFlower?.uuid || "",
                  farmAreaId: props.row.original?.FarmProfile?.uuid || "",
                  farmerUUID: props.row.original?.FarmerProfile?.uuid || "",
                  farmerName: props.row.original?.FarmProfile?.farmerName || "",
                  farmAddress: props.row.original?.FarmProfile?.address || "",

                  englishName: props.row.original?.CutFlower?.englishName || "",
                  localName: props.row.original?.CutFlower?.localName || "",
                  cutFlowerId: props.row.original?.CutFlower?.cutFlowerId || "",
                  sellingLocationUUID:
                    props.row.original?.SellingLocation?.uuid || "",
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

                setSelectedCutFlower([
                  {
                    value: props.row.original?.CutFlower?.uuid || "",
                    label: props.row.original?.CutFlower?.localName || "",
                  },
                ]);
                setSelectedSellingLocation([
                  {
                    value: props.row.original?.SellingLocation?.uuid || "",
                    label: props.row.original?.SellingLocation?.name || "",
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
        size: 150,
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
        size: 150,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Farmer Name",
      accessor: "FarmProfile.farmerName",
      style: {
        fontSize: 20,
        size: 150,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Cut Flower Crop Name",
      accessor: "CutFlower.localName",
      style: {
        fontSize: 20,
        size: 150,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Cut Flower Crop ID",
      accessor: "CutFlower.cutFlowerId",
      style: {
        fontSize: 20,
        size: 150,
      },
    },
    {
      Header: "Selling Price($)/Cut",
      accessor: "sellingPrice",
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
      Header: "Cultivated Area/Cut (Ha)",
      accessor: "cultivatedArea",
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
      Header: "No. of Plant Sold",
      accessor: "quantity",
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
      Header: "Total Sales($)",
      accessor: "totalRevenue",
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
      Header: "Selling Location",
      accessor: "SellingLocation.name",
      style: {
        fontSize: 20,
        size: 150,
      },
      disableFilters: true,
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
      header={{ title: "Cut Flower Production" }}
      urlQuery={router.query}
    >
      <FormModal
        title={`Export Production`}
        visible={exportModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setExportModalVisible(false);
          setExportFormData({});
          setSelectedCompany([]);
          setSelectedFarmArea([]);
          setSelectedCutFlower([]);
          setSelectedExportFarmerName([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setExportModalVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportCutFlower({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            // Convert base64 to blob
            const base64Response = response.data.exportCutFlower;
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
            link.download = "cut_flower_production.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);

            // window.open(response.data.exportCutFlower, "__blank");
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
            <label>Cut Flower Crop Name</label>
            <Select
              isClearable={true}
              className="form-control"
              value={selectedCutFlower}
              required
              options={allCropsCutFlowers.map((pr) => {
                return {
                  value: pr.uuid,
                  label: `${pr.localName}`,
                };
              })}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                const found = allCropsCutFlowers.find((p) =>
                  selectedValues ? p.uuid === selectedValues.value : null
                );

                setExportFormData({
                  ...exportFormData,
                  cutFlowerUUID: found?.uuid || "",
                });
                setSelectedCutFlower([
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
        title={`Edit Cut Flower Production`}
        visible={updateFormDataVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setUpdateFormDataVisible(false);
          setSelectedCompany([]);
          setSelectedFarmArea([]);
          setSelectedCutFlower([]);
          setUpdateFormData({
            records: [],
            addresses: [],
          });
          setSelectedCompany([]);
          setSelectedFarmArea([]);
          setSelectedCutFlower([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let quantity = "" + updateFormData.quantity;
            let sellingPrice = "" + updateFormData.sellingPrice;
            let cultivatedArea = "" + updateFormData.cultivatedArea;
            let totalRevenue = "" + updateFormData.totalRevenue;

            if (quantity) {
              quantity = parseFloat(quantity.replace(/,/g, ""));
            } else {
              quantity = 0;
            }
            if (sellingPrice) {
              sellingPrice = parseFloat(sellingPrice.replace(/,/g, ""));
            } else {
              sellingPrice = 0;
            }

            if (cultivatedArea) {
              cultivatedArea = parseFloat(cultivatedArea.replace(/,/g, ""));
            } else {
              cultivatedArea = 0;
            }

            if (totalRevenue) {
              totalRevenue = parseFloat(totalRevenue.replace(/,/g, ""));
            } else {
              totalRevenue = 0;
            }
            delete updateFormData.farmerCompanyName;
            delete updateFormData.farmArea;
            const tokenizedPayload = {
              ...updateFormData,
              address: "" + updateFormData.address,
              quantity: parseFloat(quantity || 0),
              sellingPrice: parseFloat(sellingPrice || 0),
              totalRevenue: parseFloat(totalRevenue || 0),
              cultivatedArea: parseFloat(cultivatedArea || 0),
            };

            const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

            await updateCutFlowerProduction({
              variables: {
                tokenized,
                // ...updateFormData,
                // quantity: parseFloat(updateFormData.quantity || 0),
                // sellingPrice: parseFloat(updateFormData.sellingPrice || 0),
                // totalRevenue: parseFloat(updateFormData.totalRevenue || 0),
                // cultivatedArea: parseFloat(updateFormData.cultivatedArea || 0),
              },
            });
            setSavedCount((savedCount += 1));
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
              if (e) e.preventDefault();
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
            value={updateFormData?.FarmerProfile || ""}
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
              });

              setSelectedCompany([
                {
                  value: found.uuid,
                  label: found.farmerCompanyName,
                },
              ]);
              setSelectedFarmArea([{ value: "", label: "" }]);
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
                  result?.data?.getFarmAddressByCompanyUUIDAndFarmArea || [],
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
            className="form-control"
            placeholder="Auto Filled (From Farmer Profile)"
            value={updateFormData.farmerName || ""}
          />
        </div>

        <div className="form-group">
          <label>Farm Address</label>
          <input
            className="form-control"
            value={updateFormData.address || ""}
            disabled
          />
          {/* <select
            className="form-control"
            onChange={(e) => {
              if (e) e.preventDefault();
              setUpdateFormData({
                ...updateFormData,
                address: e.target.value.toUpperCase(),
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
        <div className="form-group">
          <label>Cut Flower Name</label>
          <Select
            value={selectedCutFlower}
            required
            options={allCropsCutFlowers.map((pr) => {
              return {
                value: pr.uuid,
                label: `${pr.localName.toUpperCase()}`,
              };
            })}
            classNamePrefix="select"
            onChange={(selectedValues) => {
              const found = allCropsCutFlowers.find(
                (p) => p.uuid === selectedValues.value
              );

              setUpdateFormData({
                ...updateFormData,
                localName: found?.localName || "",
                englishName: found?.englishName || "",
                cutFlowerId: found.cutFlowerId,
              });
              setSelectedCutFlower([
                {
                  label: found.localName,
                  value: found.uuid,
                },
              ]);
            }}
          />
        </div>
        <div className="form-group">
          <label>Cut Flower ID</label>
          <input
            disabled
            className="form-control"
            placeholder="Auto Filled"
            value={updateFormData.cutFlowerId || ""}
          />
        </div>
        <div className="form-group">
          <label>Quantity (Cuts)</label>
          <NumberFormat
            className="form-control"
            value={updateFormData.quantity || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            decimalScale={2}
            // onBlur={(e) => {
            //   if (e) e.preventDefault();

            //   let sellingPrice = updateFormData.sellingPrice;
            //   let totalRevenue = updateFormData.totalRevenue;

            //   totalRevenue = sellingPrice * updateFormData.quantity;
            //   setUpdateFormData({
            //     ...updateFormData,
            //     totalRevenue,
            //   });
            // }}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              // let quantity = e.target.value || 0;

              let sellingPrice = updateFormData.sellingPrice;
              let totalRevenue = updateFormData.totalRevenue;
              const val = parseFloat(e.value || 0);
              totalRevenue = sellingPrice * val;

              setUpdateFormData({
                ...updateFormData,
                quantity: e.formattedValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Selling Price / Cut</label>
          <NumberFormat
            className="form-control"
            value={updateFormData.sellingPrice || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            decimalScale={2}
            // onBlur={(e) => {
            //   if (e) e.preventDefault();

            //   let sellingPrice = updateFormData.sellingPrice;
            //   let totalRevenue = updateFormData.totalRevenue;

            //   totalRevenue = sellingPrice * updateFormData.quantity;
            //   setUpdateFormData({
            //     ...updateFormData,
            //     totalRevenue,
            //   });
            // }}
            onValueChange={(e) => {
              // if (e) e.preventDefault();

              let val = parseFloat(e.value || 0);
              let totalRevenue = updateFormData.totalRevenue;

              totalRevenue = val * updateFormData.quantity;

              setUpdateFormData({
                ...updateFormData,
                sellingPrice: e.formattedValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Cultivated Area / Cut (Ha)</label>
          <NumberFormat
            className="form-control"
            value={updateFormData.cultivatedArea || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            decimalScale={3}
            onChange={(e) => {
              if (e) e.preventDefault();
              let cultivatedArea = e.target.value || 0;
              setUpdateFormData({
                ...updateFormData,
                cultivatedArea,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Total Revenue ($)</label>
          <NumberFormat
            className="form-control"
            value={updateFormData.totalRevenue || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            decimalScale={2}
            onBlur={(e) => {
              if (e) e.preventDefault();
              let sellingPrice = updateFormData.sellingPrice;

              if (
                updateFormData.quantity > 0 &&
                updateFormData.totalRevenue > 0
              ) {
                sellingPrice =
                  updateFormData.totalRevenue / updateFormData.quantity;
              } else {
                sellingPrice = 0;
              }
              setUpdateFormData({
                ...updateFormData,
                sellingPrice,
              });
            }}
            onChange={(e) => {
              if (e) e.preventDefault();

              let totalRevenue = e.target.value || 0;

              setUpdateFormData({
                ...updateFormData,
                totalRevenue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Marketing Area</label>
          <Select
            value={selectedSellingLocation}
            required
            options={allCropsSellingLocations.map((pr) => {
              return {
                value: pr.uuid,
                label: `${pr.name}`,
              };
            })}
            classNamePrefix="select"
            onChange={(selectedValues) => {
              const found = allCropsSellingLocations.find(
                (p) => p.uuid === selectedValues.value
              );

              setUpdateFormData({
                ...updateFormData,
                sellingLocationUUID: found.uuid,
              });
              setSelectedSellingLocation([
                {
                  label: found.name,
                  value: found.uuid,
                },
              ]);
            }}
          />
        </div>
      </FormModal>

      <FormModal
        title={`New Cut Flower Production`}
        size="lg"
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setSelectedCompany([]);
          setSelectedFarmArea([]);
          setSelectedCutFlower([]);
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
              delete rec.id;
              let quantity = "" + rec.quantity;
              let sellingPrice = "" + rec.sellingPrice;
              let cultivatedArea = "" + rec.cultivatedArea;
              if (quantity) {
                quantity = parseFloat(quantity.replace(/,/g, ""));
              } else {
                quantity = 0;
              }
              if (sellingPrice) {
                sellingPrice = parseFloat(sellingPrice.replace(/,/g, ""));
              } else {
                sellingPrice = 0;
              }
              if (cultivatedArea) {
                cultivatedArea = parseFloat(cultivatedArea.replace(/,/g, ""));
              } else {
                cultivatedArea = 0;
              }
              return {
                monthYear: formData.monthYear,
                farmerUUID: formData.farmerUUID,
                farmAreaId: formData.farmAreaId,
                address: "" + formData.address,
                ...rec,
                quantity: parseFloat(quantity || 0),
                sellingPrice: parseFloat(sellingPrice || 0),
                totalRevenue: parseFloat(rec.totalRevenue || 0),
                cultivatedArea: parseFloat(cultivatedArea || 0),
              };
            });

            const tokenized = jwt.sign({ tokenizedPayload }, TOKENIZE);

            await createCutFlowerProduction({
              variables: {
                tokenized,
              },
            });

            // for (let rec of formData.records) {
            //   delete rec.id;

            //   let quantity = "" + rec.quantity;
            //   let sellingPrice = "" + rec.sellingPrice;
            //   let cultivatedArea = "" + rec.cultivatedArea;

            //   if (quantity) {
            //     quantity = parseFloat(quantity.replace(/,/g, ""));
            //   } else {
            //     quantity = 0;
            //   }
            //   if (sellingPrice) {
            //     sellingPrice = parseFloat(sellingPrice.replace(/,/g, ""));
            //   } else {
            //     sellingPrice = 0;
            //   }

            //   if (cultivatedArea) {
            //     cultivatedArea = parseFloat(cultivatedArea.replace(/,/g, ""));
            //   } else {
            //     cultivatedArea = 0;
            //   }

            //   const tokenizedPayload = {
            //     monthYear: formData.monthYear,
            //     farmerUUID: formData.farmerUUID,
            //     farmAreaId: formData.farmAreaId,
            //     address: formData.address,
            //     ...rec,
            //     quantity: parseFloat(quantity || 0),
            //     sellingPrice: parseFloat(sellingPrice || 0),
            //     totalRevenue: parseFloat(rec.totalRevenue || 0),
            //     cultivatedArea: parseFloat(cultivatedArea || 0),
            //   };
            //   const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

            //   await createCutFlowerProduction({
            //     variables: {
            //       tokenized,
            //       // monthYear: formData.monthYear,

            //       // farmerUUID: formData.farmerUUID,
            //       // farmAreaId: formData.farmAreaId,

            //       // ...rec,
            //       // quantity: parseFloat(rec.quantity || 0),
            //       // sellingPrice: parseFloat(rec.sellingPrice || 0),
            //       // totalRevenue: parseFloat(rec.totalRevenue || 0),
            //       // cultivatedArea: parseFloat(rec.cultivatedArea || 0),
            //     },
            //   });
            // }

            setSavedCount((savedCount += 1));
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
            setSelectedSellingLocation([]);
            setSelectedCutFlower([]);
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
          <label>Company Name</label>
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
              });

              setSelectedCompany([
                {
                  value: found.uuid,
                  label: found.farmerCompanyName,
                },
              ]);
              setSelectedFarmArea([{ value: "", label: "" }]);
            }}
          /> */}
          <input
            className="form-control w-1/2"
            value={formData.farmerCompanyName || ""}
            disabled
          />
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
            className="form-control"
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                address: e.target.value.toUpperCase(),
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
                        quantity: 0,
                        sellingPrice: 0,
                        totalRevenue: 0,
                      },
                    ],
                  });
                }}
              >
                <i className="fa fa-plus" /> Add
              </button>
            </div>
            <div className="grid grid-cols-8">
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm px-2 py-2">
                Cut Flower Name
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm px-2 py-2">
                Cut Flower ID
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm px-2 py-2">
                Quantity (Cuts)
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm px-2 py-2">
                Selling Price ($)/Cuts
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm px-2 py-2">
                Cultivated Area/Cut (Ha)
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm px-2 py-2">
                Total Revenue ($)
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm px-2 py-2">
                Marketing Area
              </div>
              <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm px-2 py-2">
                {}
              </div>
            </div>
          </div>
        )}

        {formData.records.map((rec) => (
          <div className="grid grid-cols-8 my-2">
            <div className="pr-2">
              <Select
                value={{
                  value: rec.cutFlowerUUID,
                  label: rec.localName,
                }}
                required
                options={allCropsCutFlowers.map((pr) => {
                  return {
                    value: pr.uuid,
                    label: `${pr.localName.toUpperCase()}`,
                  };
                })}
                classNamePrefix="select"
                onChange={(selectedValues) => {
                  const found = allCropsCutFlowers.find(
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
                            cutFlowerUUID: found.uuid,
                          }
                    ),
                  });
                  setSelectedCutFlower(found);
                }}
              />
            </div>
            <div className="pr-2">
              <input
                disabled
                placeholder="Auto Filled"
                className="form-control"
                value={rec.cutFlowerId || ""}
              />
            </div>
            <div className="pr-2">
              <NumberFormat
                className="form-control"
                value={rec.quantity || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                // onBlur={(e) => {
                //   if (e) e.preventDefault();

                //   let sellingPrice = rec.sellingPrice;
                //   let totalRevenue = rec.totalRevenue;

                //   totalRevenue = sellingPrice * rec.quantity;

                //   setFormData({
                //     ...formData,
                //     records: formData.records.map((re) =>
                //       re.uuid !== rec.uuid
                //         ? re
                //         : {
                //             ...rec,
                //             totalRevenue,
                //           }
                //     ),
                //   });
                // }}
                onChange={(e) => {
                  if (e) e.preventDefault();

                  let quantity = e.target.value || 0;

                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
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
                value={rec.sellingPrice || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                // onBlur={(e) => {
                //   if (e) e.preventDefault();
                //   let sellingPrice = rec.sellingPrice;
                //   let totalRevenue = rec.totalRevenue;
                //   totalRevenue = rec.quantity * sellingPrice;
                //   setFormData({
                //     ...formData,
                //     records: formData.records.map((re) =>
                //       re.uuid !== rec.uuid
                //         ? re
                //         : {
                //             ...rec,
                //             totalRevenue,
                //           }
                //     ),
                //   });
                // }}
                onChange={(e) => {
                  if (e) e.preventDefault();

                  let sellingPrice = e.target.value || 0;

                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            sellingPrice,
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
                  let cultivatedArea = e.target.value || 0;
                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            cultivatedArea,
                          }
                    ),
                  });
                }}
              />
            </div>
            <div className="pr-2">
              <NumberFormat
                className="form-control"
                value={rec.totalRevenue || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                // onBlur={(e) => {
                //   if (e) e.preventDefault();
                //   let sellingPrice = rec.sellingPrice;

                //   if (rec.quantity > 0 && rec.totalRevenue > 0) {
                //     sellingPrice = rec.totalRevenue / rec.quantity;
                //   } else {
                //     sellingPrice = 0;
                //   }
                //   setFormData({
                //     ...formData,
                //     records: formData.records.map((re) =>
                //       re.uuid !== rec.uuid
                //         ? re
                //         : {
                //             ...rec,
                //             sellingPrice,
                //           }
                //     ),
                //   });
                // }}
                onChange={(e) => {
                  if (e) e.preventDefault();

                  let totalRevenue = e.target.value || 0;

                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            totalRevenue,
                          }
                    ),
                  });
                }}
              />
            </div>
            <div className="pr-2">
              <Select
                value={{
                  value: rec.sellingLocationUUID,
                  label: rec.name,
                }}
                required
                options={allCropsSellingLocations.map((pr) => {
                  return {
                    value: pr.uuid,
                    label: `${pr.name}`,
                  };
                })}
                classNamePrefix="select"
                onChange={(selectedValues) => {
                  const found = allCropsSellingLocations.find(
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
                            sellingLocationUUID: found.uuid,
                          }
                    ),
                  });
                  setSelectedSellingLocation(found);
                }}
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
                      "Cut Flower Production Export Excel:Read",
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
          data={allCutFlowerProductions}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege(["Cut Flower Production:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege(["Cut Flower Production:Create"])
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
            !currentUserDontHavePrivilege(["Cut Flower Production:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} productions?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteCutFlowerProduction({
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

const convertToFloat = (numberString) => {
  if (numberString && typeof numberString === "string") {
    // Check if the string contains both comma and period
    if (numberString.includes(",") && numberString.includes(".")) {
      // Assume it's using a comma as a thousand separator and a period for decimal
      // Remove commas as thousand separators
      numberString = numberString.replace(/,/g, "");
    } else if (numberString.includes(".")) {
      // Do Nothing
    } else if (numberString.includes(",")) {
      // If the string only has a comma, assume it's European-style with comma for decimal
      // Remove periods used as thousand separators
      numberString = numberString.replace(/,/g, "");
    }

    // Parse the modified string to a float
    const result = parseFloat(numberString);

    return result;
  } else {
    const result = parseFloat(numberString);

    return result;
  }
};
