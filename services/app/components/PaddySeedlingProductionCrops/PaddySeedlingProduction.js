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
import gql from "graphql-tag";
import {
  useQuery,
  useLazyQuery,
  useMutation,
  useApolloClient,
} from "@apollo/client";
import { MonthAndYearsFilterWithExport } from "../../components/MonthAndYearsFilterWithExport";
import dayjs from "dayjs";
import AsyncSelect from "react-select/async";
import lodash from "lodash";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERIES = gql`
  query listQueries($monthYear: String!, $filters: String) {
    countAllPaddySeedlingProductions(monthYear: $monthYear, filters: $filters)
    tokenizedAllCropsPaddyVarieties
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

const PRODUCTION_QUERY = gql`
  query productionQuery(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllPaddySeedlingProductions(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllPaddySeedlingProductions(monthYear: $monthYear, filters: $filters)
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

const CREATE_PADDY_SEEDLING_PRODUCTION = gql`
  mutation tokenizedCreatePaddySeedlingProduction($tokenized: String!) {
    tokenizedCreatePaddySeedlingProduction(tokenized: $tokenized)
  }
`;

const UPDATE_PADDY_SEEDLING_PRODUCTION = gql`
  mutation tokenizedUpdatePaddySeedlingProduction($tokenized: String!) {
    tokenizedUpdatePaddySeedlingProduction(tokenized: $tokenized)
  }
`;

const DELETE_PADDY_SEEDLING_PRODUCTION = gql`
  mutation tokenizedDeletePaddySeedlingProduction($tokenized: String!) {
    tokenizedDeletePaddySeedlingProduction(tokenized: $tokenized)
  }
`;

const EXPORT_PADDY_SEEDLING_PRODCUTION = gql`
  mutation exportPaddySeedlingProduction(
    $monthYear: String!
    $farmerUUID: String
    $farmAreaId: String
    $cropsPaddyVarietyUUID: String
  ) {
    exportPaddySeedlingProduction(
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
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const client = useApolloClient();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({
    noOfSeeds: 0,
    noOfSeedsExported: 0,
    totalTraysProduced: 0,
    totalTraysSold: 0,

    seedlingReminder: 0,
    totalTraysCompensated: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [allFarmProfile, setAllFarmProfile] = useState([]);
  const [exportFormData, setExportFormData] = useState({});
  const [registerType, setRegisterType] = useState("");
  const notification = useNotification();
  let [savedCount, setSavedCount] = useState(0);
  const [
    allFarmProfilesByFarmerForExport,
    setAllFarmProfilesByFarmerForExport,
  ] = useState([]);

  let [countPaddySeedlingProduction, setCountPaddySeedlingProduction] =
    useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countPaddySeedlingProduction) return 1;
    return Math.ceil(countPaddySeedlingProduction / pageSize);
  }, [countPaddySeedlingProduction, pageSize]);

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
  const [exportPaddySeedlingProduction] = useMutation(
    EXPORT_PADDY_SEEDLING_PRODCUTION
  );
  const [createPaddySeedlingProduction] = useMutation(
    CREATE_PADDY_SEEDLING_PRODUCTION
  );
  const [updatePaddySeedlingProduction] = useMutation(
    UPDATE_PADDY_SEEDLING_PRODUCTION
  );
  const [deletePaddySeedlingProduction] = useMutation(
    DELETE_PADDY_SEEDLING_PRODUCTION
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

  const [allFarmerProfilesByCompanyRegNo, setAllFarmerProfilesByCompanyRegNo] =
    useState([]);
  const [allPaddySeedlingProductions, setAllPaddySeedlingProductions] =
    useState([]);
  const [allFarmProfilesByFarmer, setAllFarmProfilesByFarmer] = useState([]);
  const [allCropsPaddyVarieties, setAllCropsPaddyVarieties] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedFarmerProfilesByCompanyRegNo = data?.tokenizedAllFarmerProfilesByCompanyRegNo || "";
      // let allFarmerProfilesByCompanyRegNo = [];
      // if (encryptedFarmerProfilesByCompanyRegNo) {
      //   const decrypted = jwt.verify(encryptedFarmerProfilesByCompanyRegNo, TOKENIZE);
      //   allFarmerProfilesByCompanyRegNo = decrypted.queryResult;
      //   setAllFarmerProfilesByCompanyRegNo(allFarmerProfilesByCompanyRegNo);
      // }

      // const encryptedPaddySeedlingProductions = data?.tokenizedAllPaddySeedlingProductions || "";
      // let allPaddySeedlingProductions = [];
      // if (encryptedPaddySeedlingProductions) {
      //   const decrypted = jwt.verify(encryptedPaddySeedlingProductions, TOKENIZE);
      //   allPaddySeedlingProductions = decrypted.queryResult;
      //   setAllPaddySeedlingProductions(allPaddySeedlingProductions);
      // }

      // const encryptedFarmProfilesByFarmer = data?.tokenizedAllFarmProfilesByFarmer || "";
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

      const countData = data?.countAllPaddySeedlingProductions || 0;
      setCountPaddySeedlingProduction(countData);
    }
  }, [data, loading, error]);

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

    const encryptedPaddySeedlingProductions =
      result.data?.tokenizedAllPaddySeedlingProductions || "";
    let allPaddySeedlingProductions = [];
    if (encryptedPaddySeedlingProductions) {
      const decrypted = jwt.verify(encryptedPaddySeedlingProductions, TOKENIZE);
      allPaddySeedlingProductions = decrypted.queryResult;
      setAllPaddySeedlingProductions(allPaddySeedlingProductions);
    }
    const countData = result.data?.countAllPaddySeedlingProductions || 0;
    setCountPaddySeedlingProduction(countData);
    hideLoadingSpinner();
  }, [yearMonth, savedCount, pageSize, pageIndex, router.query.filters]);

  useEffect(async () => {
    const result = await client.query({
      query: FARM_AREA_QUERY,
      variables: {
        tokenizedParams,
        onPage: "PADDY SEEDLING PRODUCTION",
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

  // const encryptedPaddySeedlingProductions =
  //   data?.tokenizedAllPaddySeedlingProductions || "";
  // let allPaddySeedlingProductions = [];
  // if (encryptedPaddySeedlingProductions) {
  //   const decrypted = jwt.verify(encryptedPaddySeedlingProductions, TOKENIZE);
  //   allPaddySeedlingProductions = decrypted.queryResult;
  // }

  // const encryptedFarmProfilesByFarmer =
  //   data?.tokenizedAllFarmProfilesByFarmer || "";
  // let allFarmProfilesByFarmer = [];
  // let allFarmProfilesByFarmerForExport = [];
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
  // let allFarmProfilesByFarmerForExport = allFarmProfilesByFarmer;

  // allFarmProfilesByFarmerForExport = lodash.uniqBy(
  //   allFarmProfilesByFarmerForExport,
  //   (farm) => farm.farmArea
  // );

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
        width: 150,
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
      Header: "No. of seedling exported from current batch (Trays)",
      accessor: "noOfSeedsExported",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Total Value ($)",
      accessor: "totalTraysCompensated",
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

  return (
    <div>
      <FormModal
        title={`Export Paddy Seedling Production`}
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
            const response = await exportPaddySeedlingProduction({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            // Convert base64 to blob
            const base64Response = response.data.exportPaddySeedlingProduction;
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
            link.download = "paddy_seedling_production.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);

            // window.open(response.data.exportPaddySeedlingProduction, "__blank");
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

                setFormData({
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
        title={`${!formData.uuid ? "New" : "Edit"} Paddy Seedling Production`}
        size="md"
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            noOfSeeds: 0,
            noOfSeedsExported: 0,
            totalTraysProduced: 0,
            totalTraysSold: 0,

            seedlingReminder: 0,
            totalTraysCompensated: 0,
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
            let { uuid, __typename, __createdAt, __updatedAt, FarmerProfile } =
              formData;
            delete formData.farmerCompanyName;
            delete formData.farmArea;
            if (!uuid) {
              const tokenized = jwt.sign(formData, TOKENIZE);

              await createPaddySeedlingProduction({
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

                totalTraysCompensated: 0,
                remindingOfSeedlings: 0,
              });
              setModalVisible(true);
              setSelectedCompany([]);
              setSelectedFarmArea([]);
              setSelectedPaddy([]);
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updatePaddySeedlingProduction({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            setModalVisible(false);
            setFormData({
              noOfSeeds: 0,
              noOfSeedsExported: 0,
              totalTraysProduced: 0,
              totalTraysSold: 0,

              seedlingReminder: 0,
              totalTraysCompensated: 0,
            });
            setSelectedCompany([]);
            setSelectedFarmArea([]);
            setSelectedPaddy([]);
            setSavedCount((savedCount += 1));
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
          />
        </div> */}
        <div className="form-group">
          <label>Company Name</label>
          {/* <AsyncSelect
            value={formData.FarmerProfile}
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
              setFormData({
                ...formData,
                FarmerProfile: found,
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
          <input
            className="form-control"
            value={formData.farmerCompanyName || ""}
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
        <div className="grid grid-cols-2 gap-x-5">
          <div className="form-group">
            <label>Company ID</label>
            <input
              className="form-control"
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
              <label>Selling Date*</label>
              <input
                required
                type="date"
                className="form-control"
                value={formData.date || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    date: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Total Number of Trays Produced</label>
              <NumberFormat
                className="form-control"
                placeholder="0"
                value={formData.totalTraysProduced || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();

                  const seedlingReminder =
                    e.floatValue - formData.totalTraysSold;
                  setFormData({
                    ...formData,
                    totalTraysProduced: e.floatValue || 0,
                    seedlingReminder,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>No. of Seedling Exported from current batch (Trays)</label>
              <NumberFormat
                placeholder="0"
                className="form-control"
                value={formData.noOfSeedsExported || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    noOfSeedsExported: e.floatValue || 0,
                  });
                }}
              />
            </div>
          </div>
          <div>
            <div className="form-group">
              <label>Number of Seeds (Kg)</label>
              <NumberFormat
                className="form-control"
                placeholder="0"
                value={formData.noOfSeeds || ""}
                decimalScale={2}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    noOfSeeds: e.floatValue || 0,
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
                decimalScale={2}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  const seedlingReminder =
                    formData.totalTraysProduced - e.floatValue;
                  setFormData({
                    ...formData,
                    totalTraysSold: e.floatValue || 0,
                    seedlingReminder,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Remainder Of Seedlings</label>
              <NumberFormat
                disabled
                placeholder="Auto Calculated"
                className="form-control"
                value={formData.seedlingReminder || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    seedlingReminder: e.floatValue || 0,
                  });
                }}
              />
            </div>
          </div>
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
                      "Paddy Seedling Production Export Excel:Read",
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
          data={allPaddySeedlingProductions}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege(["Paddy Seedling Production:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege(["Paddy Seedling Production:Create"])
              ? () => {
                  setFormData({
                    noOfSeeds: 0,
                    noOfSeedsExported: 0,
                    totalTraysProduced: 0,
                    totalTraysSold: 0,

                    seedlingReminder: 0,
                    totalTraysCompensated: 0,
                  });
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Paddy Seedling Production:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} production?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deletePaddySeedlingProduction({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }

                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} production deleted`,
                        level: "success",
                      });
                      await refetch();
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
    </div>
  );
};

export default withApollo({ ssr: true })(page);
