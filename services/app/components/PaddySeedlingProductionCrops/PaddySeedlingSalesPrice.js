import React, { useState, useEffect, useMemo, useCallback } from "react";
import { withApollo } from "../../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../App";
import { useNotification } from "../Notification";
import { handleError } from "../../libs/errors";
import TableAsync from "../TableAsync";
import Table from "../Table";
import { FormModal } from "../Modal";
import { useRouter } from "next/router";
import NumberFormat from "react-number-format";
import { useCurrentUser } from "../AdminArea";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import gql from "graphql-tag";
import {
  useQuery,
  useLazyQuery,
  useMutation,
  rewriteURIForGET,
  useApolloClient,
} from "@apollo/client";
import { MonthAndYearsFilterWithExport } from "../../components/MonthAndYearsFilterWithExport";
import dayjs from "dayjs";
import { useMountedLayoutEffect } from "react-table/dist/react-table.development";
import lodash from "lodash";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERIES = gql`
  query listQueries($monthYear: String!, $filters: String) {
    tokenizedAllCropsPaddyVarieties

    countAllPaddySeedlingSalesAndPrices(
      monthYear: $monthYear
      filters: $filters
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
    tokenizedAllPaddySeedlingSalesAndPrices(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllPaddySeedlingSalesAndPrices(
      monthYear: $monthYear
      filters: $filters
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

const CREATE_PADDY_SEEDLING_SALES_AND_PRICE = gql`
  mutation tokenizedCreatePaddySeedlingSalesAndPrice($tokenized: String!) {
    tokenizedCreatePaddySeedlingSalesAndPrice(tokenized: $tokenized)
  }
`;

const UPDATE_PADDY_SEEDLING_SALES_AND_PRICE = gql`
  mutation tokenizedUpdatePaddySeedlingSalesAndPrice($tokenized: String!) {
    tokenizedUpdatePaddySeedlingSalesAndPrice(tokenized: $tokenized)
  }
`;

const DELETE_PADDY_SEEDLING_SALES_AND_PRICE = gql`
  mutation tokenizedDeletePaddySeedlingSalesAndPrice($tokenized: String!) {
    tokenizedDeletePaddySeedlingSalesAndPrice(tokenized: $tokenized)
  }
`;

const EXPORT_PADDY_SEEDLING_SALES_AND_PRICE = gql`
  mutation exportPaddySeedlingSalesPrice(
    $monthYear: String!
    $farmerUUID: String
    $farmAreaId: String
    $cropsPaddyVarietyUUID: String
  ) {
    exportPaddySeedlingSalesPrice(
      monthYear: $monthYear
      farmerUUID: $farmerUUID
      farmAreaId: $farmAreaId
      cropsPaddyVarietyUUID: $cropsPaddyVarietyUUID
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
  const [formData, setFormData] = useState({
    noOfFarmers: 0,
    noOfOrders: 0,
    totalTraysProduced: 0,
    totalTraysSold: 0,
    priceTrays: 0,
    totalTraysCompensated: 0,
    // remindingOfSeedlings: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const notification = useNotification();
  const [registerType, setRegisterType] = useState("");
  const [exportFormData, setExportFormData] = useState({});

  let [countPaddySeedlingSalesPrice, setCountPaddySeedlingSalesPrice] =
    useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countPaddySeedlingSalesPrice) return 1;
    return Math.ceil(countPaddySeedlingSalesPrice / pageSize);
  }, [countPaddySeedlingSalesPrice, pageSize]);

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

  const [exportPaddySeedlingSalesPrice] = useMutation(
    EXPORT_PADDY_SEEDLING_SALES_AND_PRICE
  );
  const [tokenizedCreatePaddySeedlingSalesAndPrice] = useMutation(
    CREATE_PADDY_SEEDLING_SALES_AND_PRICE
  );
  const [tokenizedUpdatePaddySeedlingSalesAndPrice] = useMutation(
    UPDATE_PADDY_SEEDLING_SALES_AND_PRICE
  );
  const [tokenizedDeletePaddySeedlingSalesAndPrice] = useMutation(
    DELETE_PADDY_SEEDLING_SALES_AND_PRICE
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

  const [remindingOfSeedlings, setRemindingOfSeedling] = useState(0);
  const [allFarmProfile, setAllFarmProfile] = useState([]);
  const [allFarmerProfilesByCompanyRegNo, setAllFarmerProfilesByCompanyRegNo] =
    useState([]);
  const [allPaddySeedlingSalesAndPrices, setAllPaddySeedlingSalesAndPrices] =
    useState([]);
  const [allFarmProfilesByFarmer, setAllFarmProfilesByFarmer] = useState([]);
  const [allCropsPaddyVarieties, setAllCropsPaddyVarieties] = useState([]);
  let [savedCount, setSavedCount] = useState(0);
  const [
    allFarmProfilesByFarmerForExport,
    setAllFarmProfilesByFarmerForExport,
  ] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedFarmerProfilesByCompanyRegNo =
      //   data?.tokenizedAllFarmerProfilesByCompanyRegNo || "";
      // let allFarmerProfilesByCompanyRegNo = [];
      // if (encryptedFarmerProfilesByCompanyRegNo) {
      //   const decrypted = jwt.verify(
      //     encryptedFarmerProfilesByCompanyRegNo,
      //     TOKENIZE
      //   );
      //   allFarmerProfilesByCompanyRegNo = decrypted.queryResult;
      //   setAllFarmerProfilesByCompanyRegNo(allFarmerProfilesByCompanyRegNo);
      // }

      // const encryptedPaddySeedlingSalesAndPrices =
      //   data?.tokenizedAllPaddySeedlingSalesAndPrices || "";
      // let allPaddySeedlingSalesAndPrices = [];
      // if (encryptedPaddySeedlingSalesAndPrices) {
      //   const decrypted = jwt.verify(
      //     encryptedPaddySeedlingSalesAndPrices,
      //     TOKENIZE
      //   );
      //   allPaddySeedlingSalesAndPrices = decrypted.queryResult;
      //   setAllPaddySeedlingSalesAndPrices(allPaddySeedlingSalesAndPrices);
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

      const countData = data?.countAllPaddySeedlingSalesAndPrices || 0;
      setCountPaddySeedlingSalesPrice(countData);
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

    const encryptedPaddySeedlingSalesAndPrices =
      result.data?.tokenizedAllPaddySeedlingSalesAndPrices || "";
    let allPaddySeedlingSalesAndPrices = [];
    if (encryptedPaddySeedlingSalesAndPrices) {
      const decrypted = jwt.verify(
        encryptedPaddySeedlingSalesAndPrices,
        TOKENIZE
      );
      allPaddySeedlingSalesAndPrices = decrypted.queryResult;
      setAllPaddySeedlingSalesAndPrices(allPaddySeedlingSalesAndPrices);
    }

    const countData = result.data?.countAllPaddySeedlingSalesAndPrices || 0;
    setCountPaddySeedlingSalesPrice(countData);

    hideLoadingSpinner();
  }, [yearMonth, savedCount, pageIndex, pageSize, router.query.filters]);

  useEffect(async () => {
    const result = await client.query({
      query: FARM_AREA_QUERY,
      variables: {
        tokenizedParams,
        onPage: "PADDY SEEDLING SALES AND PRICE",
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

  // const encryptedPaddySeedlingSalesAndPrices =
  //   data?.tokenizedAllPaddySeedlingSalesAndPrices || "";
  // let allPaddySeedlingSalesAndPrices = [];
  // if (encryptedPaddySeedlingSalesAndPrices) {
  //   const decrypted = jwt.verify(
  //     encryptedPaddySeedlingSalesAndPrices,
  //     TOKENIZE
  //   );
  //   allPaddySeedlingSalesAndPrices = decrypted.queryResult;
  // }

  // const encryptedFarmProfilesByFarmer =
  //   data?.tokenizedAllFarmProfilesByFarmer || "";
  // let allFarmProfilesByFarmer = [];
  // if (encryptedFarmProfilesByFarmer) {
  //   const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
  //   allFarmProfilesByFarmer = decrypted.queryResult;
  //   allFarmProfilesByFarmerForExport = decrypted.queryResult;
  // }

  // const encryptedCropsPaddyVarieties =
  //   data?.tokenizedAllCropsPaddyVarieties || "";
  // let allCropsPaddyVarieties = [];
  // if (encryptedCropsPaddyVarieties) {
  //   const decrypted = jwt.verify(encryptedCropsPaddyVarieties, TOKENIZE);
  //   allCropsPaddyVarieties = decrypted.queryResult;
  // }

  // let allFarmProfilesByFarmerForExport = [];

  // allFarmProfilesByFarmerForExport = lodash.uniqBy(
  //   allFarmProfilesByFarmerForExport,
  //   (farm) => farm.farmArea
  // );

  useEffect(() => {
    const remindingOfSeedlings =
      formData.totalTraysProduced -
      (formData.totalTraysSold + formData.totalTraysCompensated);

    setRemindingOfSeedling(remindingOfSeedlings);
    // const interval = setInterval(() => {
    //   const remindingOfSeedlings =
    //     formData.totalTraysProduced -
    //     (formData.totalTraysSold + formData.totalTraysCompensated);

    //   // console.log({
    //   //   remindingOfSeedlings,
    //   //   totalTraysProduced: formData.totalTraysProduced,
    //   //   totalTraysSold: formData.totalTraysSold,
    //   //   totalTraysCompensated: formData.totalTraysCompensated,
    //   // });
    //   setRemindingOfSeedling(remindingOfSeedlings);
    //   // setFormData({
    //   //   ...formData,
    //   //   remindingOfSeedlings,
    //   // });
    //   // console.log({ remindingOfSeedlings });
    //   // setRemindingOfSeedling(remindingOfSeedlings);
    // }, 150);
    // Cleanup function to stop the interval when the component is unmounted
    // return () => {
    //   clearInterval(interval);
    // };
  }, [
    formData.totalTraysProduced,
    formData.totalTraysSold,
    formData.totalTraysCompensated,
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
                console.log(props.row.original);
                setModalVisible(true);
                setFormData({
                  ...props.row.original,
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
                  companyId: props.row.original?.FarmerProfile?.companyId || "",

                  varietyName: props.row.original?.Paddy?.varietyName || "",
                  paddyId: props.row.original?.Paddy?.paddyId || "",
                });
                // setRemindingOfSeedling(props.row.original.remindingOfSeedlings);
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
      Header: "Selling Date",
      accessor: "date",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
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
      Header: "Paddy Variety",
      accessor: "Paddy.varietyName",
      style: {
        fontSize: 20,
        width: 250,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Total No. of Trays Produced",
      accessor: "totalTraysProduced",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Total No. of Trays Sold",
      accessor: "totalTraysSold",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Price/Tray ($)",
      accessor: "priceTrays",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Total Value ($)",
      accessor: "remindingOfSeedlings",
      style: {
        fontSize: 20,
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
              setFormData({
                ...formData,
                farmerUUID: props.row.original.farmerUUID,
                farmerCompanyName: props.row.original.farmerCompanyName,
                farmAreaId: props.row.original.uuid,
                farmArea: props.row.original.farmArea,
                companyId: props.row.original.farmerCompanyId,
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

  // console.log({ formData });
  return (
    <div>
      <FormModal
        title={`Export Paddy Seedling Sales and Price`}
        visible={exportModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setExportModalVisible(false);
          setExportFormData({});
          setSelectedCompany([]);
          setSelectedFarmArea([]);
          setSelectedPaddy([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setExportModalVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportPaddySeedlingSalesPrice({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            // Convert base64 to blob
            const base64Response = response.data.exportPaddySeedlingSalesPrice;
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
            link.download = "paddy_seedling_sales_price.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);


            // window.open(response.data.exportPaddySeedlingSalesPrice, "__blank");
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

          <div className="form-group">
            <label>Company Name*</label>
            <AsyncSelect
              value={exportFormData?.FarmerProfile || ""}
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
                  FarmerProfile: found,
                  farmerUUID: found?.uuid || "",
                });

                setSelectedCompany([
                  {
                    value: found?.uuid || "",

                    label: found?.farmerCompanyName || "",
                  },
                ]);

                setSelectedFarmArea([
                  {
                    value: "",
                    label: "",
                  },
                ]);
              }}
            />

            {/* <AsyncSelect
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
            /> */}
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
            <label>Paddy Variety Name</label>
            <Select
              isClearable={true}
              className="form-control"
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
        title={`${
          !formData.uuid ? "New" : "Edit"
        } Paddy Seedling Sales and Price`}
        size="md"
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            noOfFarmers: 0,
            noOfOrders: 0,
            totalTraysProduced: 0,
            totalTraysSold: 0,
            priceTrays: 0,
            totalTraysCompensated: 0,
            // remindingOfSeedlings: 0,
          });
          setExportFormData({});
          setSelectedCompany([]);
          setSelectedFarmArea([]);
          setSelectedPaddy([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { uuid, __typename, __createdAt, __updatedAt, FarmerProfile } =
              formData;
            delete formData.farmerCompanyName;
            delete formData.farmArea;
            if (!uuid) {
              const tokenized = jwt.sign(
                { ...formData, remindingOfSeedlings },
                TOKENIZE
              );
              await tokenizedCreatePaddySeedlingSalesAndPrice({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });
              setModalVisible(false);
              setFormData({
                noOfFarmers: 0,
                noOfOrders: 0,
                totalTraysProduced: 0,
                totalTraysSold: 0,
                priceTrays: 0,
                totalTraysCompensated: 0,
                // remindingOfSeedlings: 0,
              });
              setModalVisible(true);
              setSelectedCompany([]);
              setSelectedFarmArea([]);
              setSelectedPaddy([]);
              // setSavedCount((savedCount += 1));
            } else {
              const tokenized = jwt.sign(
                { ...formData, remindingOfSeedlings },
                TOKENIZE
              );
              await tokenizedUpdatePaddySeedlingSalesAndPrice({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });
            }
            await refetch();

            setModalVisible(false);
            setFormData({
              noOfFarmers: 0,
              noOfOrders: 0,
              totalTraysProduced: 0,
              totalTraysSold: 0,
              priceTrays: 0,
              totalTraysCompensated: 0,
              // remindingOfSeedlings: 0,
            });
            setSelectedCompany([]);
            setSelectedFarmArea([]);
            setSelectedPaddy([]);
            setSavedCount((savedCount += 1));
            notification.addNotification({
              title: "Succeess!",
              message: `Sales and price saved!`,
              level: "success",
            });
          } catch (error) {
            notification.handleError(error);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Date*</label>
          <input
            required
            className="form-control uppercase"
            value={formData.date || ""}
            type="date"
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                date: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Company Name</label>
          {/* <AsyncSelect
            value={formData?.FarmerProfile || ""}
            loadOptions={getFarmer}
            className={`form-control uppercase`}
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
                farmerName: found?.farmerName || "",
                companyId: found?.companyId || "",
              });

              setSelectedCompany([
                {
                  value: found?.uuid || "",

                  label: found?.farmerCompanyName || "",
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
            className="form-control"
            value={formData.farmerCompanyName || ""}
            disabled
          />
          {/* <Select
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
              setFormData({
                ...formData,

                farmerUUID: found?.uuid || "",
                farmerName: found?.farmerName || "",
                companyId: found?.companyId || "",
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
        <div className="grid grid-cols-2 gap-x-5">
          <div className="form-group">
            <label>Company ID</label>
            <input
              className="form-control uppercase"
              value={formData.companyId || ""}
              disabled
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
              className={`form-control uppercase`}
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
        </div>
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
        <div className="grid grid-cols-2 gap-x-5">
          <div>
            <div className="form-group">
              <label>No. Of Farmers</label>
              <NumberFormat
                placeholder="0"
                className="form-control"
                value={formData.noOfFarmers || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    noOfFarmers: e.floatValue || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Total Number of Trays Produced</label>
              <NumberFormat
                placeholder="0"
                className="form-control"
                value={formData.totalTraysProduced || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    totalTraysProduced: e.floatValue || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Price/Tray ($)</label>
              <NumberFormat
                className="form-control"
                placeholder="0"
                value={formData.priceTrays || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    priceTrays: e.floatValue || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Reminder Of Seedlings</label>
              <NumberFormat
                disabled
                placeholder="Auto Calculated"
                className="form-control"
                // value={formData.remindingOfSeedlings || ""}
                value={remindingOfSeedlings}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
              />
            </div>
          </div>
          <div>
            <div className="form-group">
              <label>No. of Orders</label>
              <NumberFormat
                className="form-control"
                placeholder="0"
                value={formData.noOfOrders || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    noOfOrders: e.floatValue || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Total Number of Trays Sold</label>
              <NumberFormat
                className="form-control"
                placeholder="0"
                value={formData.totalTraysSold || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    totalTraysSold: e.floatValue || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Total Number of Trays Compensated</label>
              <NumberFormat
                className="form-control"
                value={formData.totalTraysCompensated || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    totalTraysCompensated: e.floatValue || 0,
                  });
                }}
              />
            </div>
          </div>
        </div>
        <div className="form-group">
          <label>Remarks</label>
          <textarea
            className="form-control w-100 h-24 uppercase"
            value={formData.remarks || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                remarks: e.target.value.toUpperCase(),
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
      <div className="pr-0 py-4 h-full">
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
                      "Paddy Seedling Sales Price Export Excel:Read",
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
          data={allPaddySeedlingSalesAndPrices}
          withoutHeader={true}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          customUtilities={
            !currentUserDontHavePrivilege(["Paddy Seedling Sales Price:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege(["Paddy Seedling Sales Price:Create"])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Paddy Seedling Sales Price:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} sales and price?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await tokenizedDeletePaddySeedlingSalesAndPrice({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      setSavedCount((savedCount += 1));
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} sales and price deleted`,
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
    </div>
  );
};

export default withApollo({ ssr: true })(page);
