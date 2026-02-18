import React, { useState, useEffect, useMemo, useCallback } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
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
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import TableAsync from "../../components/TableAsync";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";
import NumberFormat from "react-number-format";
import Select from "react-select";
import { MonthAndYearsFilterWithExport } from "../../components/MonthAndYearsFilterWithExport";
import AsyncSelect from "react-select/async";
import lodash, { filter } from "lodash";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries($monthYear: String!, $filters: String) {
    countAllDayOldChicks(monthYear: $monthYear, filters: $filters)
  }
`;

const DAY_OLD_CHICK_QUERY = gql`
  query dayOldChickQuery(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllDayOldChicks(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllDayOldChicks(monthYear: $monthYear, filters: $filters)
  }
`;

const FARM_AREA_QUERY = gql`
  query farmAreaQuery($tokenizedParams: String, $onPage: String) {
    tokenizedAllFarmProfilesByFarmer(
      tokenizedParams: $tokenizedParams
      onPage: $onPage
    )
  }
`;

const SEARCH_FARMER_QUERY = gql`
  query searchQuery($name: String) {
    searchAllFarmerProfiles(name: $name)
  }
`;

const CREATE_DAY_OLD_CHICK = gql`
  mutation tokenizedCreateDayOldChick($tokenized: String!) {
    tokenizedCreateDayOldChick(tokenized: $tokenized)
  }
`;

const UPDATE_DAY_OLD_CHICK = gql`
  mutation tokenizedUpdateDayOldChick($tokenized: String!) {
    tokenizedUpdateDayOldChick(tokenized: $tokenized)
  }
`;

const DELETE_DAY_OLD_CHICK = gql`
  mutation tokenizedDeleteDayOldChick($tokenized: String!) {
    tokenizedDeleteDayOldChick(tokenized: $tokenized)
  }
`;

const EXPORT_DAY_OLD_CHICK = gql`
  mutation exportDayOldChick(
    $monthYear: String!
    $farmerUUID: String
    $farmAreaId: String
  ) {
    exportDayOldChick(
      monthYear: $monthYear
      farmerUUID: $farmerUUID
      farmAreaId: $farmAreaId
    )
  }
`;

const IS_CHECK_FARMER = gql`
  query isFarmerCheck {
    isFarmerCheck
  }
`;

const SEARCH_FARM_QUERY = gql`
  query searchFarmProfile($name: String) {
    searchFarmProfile(name: $name)
  }
`;

const DayOldChick = () => {
  const router = useRouter();
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const client = useApolloClient();

  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const notification = useNotification();
  const [formData, setFormData] = useState({
    totalGolden: 0,
    totalIdeal: 0,
    totalImports: 0,
    incubatedFertilizedEgg: 0,
    docProduced: 0,
  });
  const [exportFormData, setExportFormData] = useState({});
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [registerType, setRegisterType] = useState("");

  const [allFarmProfile, setAllFarmProfile] = useState([]);
  const [companyModalVisible, setCompanyModalVisible] = useState(false);

  let farmerUUID = "";
  let tokenizedParams = "";
  if (formData.farmerUUID) {
    farmerUUID = formData.farmerUUID;
    const payload = { farmerUUID };
    tokenizedParams = jwt.sign(payload, TOKENIZE);
  }
  const { data, error, loading, refetch } = useQuery(QUERY, {
    variables: {
      // tokenizedParams: tokenizedParams,
      monthYear: yearMonth,
      filters: router.query.filters,
    },
  });

  let [countDayOldChick, setCountDayOldChick] = useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countDayOldChick) return 1;
    return Math.ceil(countDayOldChick / pageSize);
  }, [countDayOldChick, pageSize]);

  const [
    allFarmProfilesByFarmerForExport,
    setAllFarmProfilesByFarmerForExport,
  ] = useState([]);
  const [createDayOldChick] = useMutation(CREATE_DAY_OLD_CHICK);
  const [updateDayOldChick] = useMutation(UPDATE_DAY_OLD_CHICK);
  const [deleteDayOldChick] = useMutation(DELETE_DAY_OLD_CHICK);
  const [exportDayOldChick] = useMutation(EXPORT_DAY_OLD_CHICK);
  const [allDayOldChicks, setAllDayOldChicks] = useState([]);
  const [allFarmerProfiles, setAllFarmerProfiles] = useState([]);
  const [allFarmProfilesByFarmer, setAllFarmProfilesByFarmer] = useState([]);
  let [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (!loading && !error) {
      //     // const encryptedDayOldChicks = data?.tokenizedAllDayOldChicks || "";
      //     // let allDayOldChicks = [];
      //     // if (encryptedDayOldChicks) {
      //     //   const decrypted = jwt.verify(encryptedDayOldChicks, TOKENIZE);
      //     //   allDayOldChicks = decrypted.queryResult;
      //     //   setAllDayOldChicks(allDayOldChicks);
      //     // }

      //     // const encryptedFarmerProfiles = data?.tokenizedAllFarmerProfile || "";
      //     // let allFarmerProfiles = [];
      //     // if (encryptedFarmerProfiles) {
      //     //   const decrypted = jwt.verify(encryptedFarmerProfiles, TOKENIZE);
      //     //   allFarmerProfiles = decrypted.queryResult;
      //     //   setAllFarmerProfiles(allFarmerProfiles);
      //     // }

      //     const encryptedFarmProfiles = data?.tokenizedAllFarmProfilesByFarmer || "";
      //     let allFarmProfilesByFarmer = [];
      //     if (encryptedFarmProfiles) {
      //       const decrypted = jwt.verify(encryptedFarmProfiles, TOKENIZE);
      //       allFarmProfilesByFarmer = decrypted.queryResult;
      //       setAllFarmProfilesByFarmer(allFarmProfilesByFarmer);
      //     }
      const countData = data?.countAllDayOldChicks || 0;
      setCountDayOldChick(countData);
    }
  }, [data, loading, error, savedCount]);

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

  // const encryptedDayOldChicks = data?.tokenizedAllDayOldChicks || "";
  // let allDayOldChicks = [];
  // if (encryptedDayOldChicks) {
  //   const decrypted = jwt.verify(encryptedDayOldChicks, TOKENIZE);
  //   allDayOldChicks = decrypted.queryResult;
  // }

  // const allFarmerProfiles = data?.allFarmerProfiles || [];
  // const allFarmProfilesByFarmer = data?.allFarmProfilesByFarmer || [];
  // let allFarmProfilesByFarmerForExport = allFarmProfilesByFarmer || [];
  // allFarmProfilesByFarmerForExport = lodash.uniqBy(
  //   allFarmProfilesByFarmerForExport,
  //   (farm) => farm.farmArea
  // );

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
      query: DAY_OLD_CHICK_QUERY,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedDayOldChicks = result.data?.tokenizedAllDayOldChicks || "";
    let allDayOldChicks = [];
    if (encryptedDayOldChicks) {
      const decrypted = jwt.verify(encryptedDayOldChicks, TOKENIZE);
      allDayOldChicks = decrypted.queryResult;
      setAllDayOldChicks(allDayOldChicks);
    }
    const countData = result.data?.countAllDayOldChicks || 0;
    setCountDayOldChick(countData);
    hideLoadingSpinner();
  }, [savedCount, yearMonth, pageSize, pageIndex, router.query.filters]);

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

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: FARM_AREA_QUERY,
      variables: {
        tokenizedParams: tokenizedParams,
        onPage: "DAY OLD CHICK",
      },
      fetchPolicy: "no-cache",
    });

    const encryptedFarmProfiles =
      result.data?.tokenizedAllFarmProfilesByFarmer || "";
    let allFarmProfiles = [];
    if (encryptedFarmProfiles) {
      const decrypted = jwt.verify(encryptedFarmProfiles, TOKENIZE);
      allFarmProfiles = decrypted.queryResult;
      allFarmProfiles = lodash.uniqBy(allFarmProfiles, "farmArea");
      setAllFarmProfilesByFarmer(allFarmProfiles);
      setAllFarmProfilesByFarmerForExport(allFarmProfiles);
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

    const encryptedFarmerProfiles = result.data?.searchAllFarmerProfiles || "";
    let allFarmerProfiles = [];
    if (encryptedFarmerProfiles) {
      const decrypted = jwt.verify(encryptedFarmerProfiles, TOKENIZE);
      allFarmerProfiles = decrypted.queryResult;
      setAllFarmerProfiles(allFarmerProfiles);
    }

    callback(allFarmerProfiles);
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

  const getFarmer = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fethchingFarmer(input, callback);
    }
  };

  const getFarmProfile = (input) => {
    if (!input) {
      setAllFarmProfile([]);
    } else {
      fetchFarmProfile(input);
    }
  };

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
              let address = "";
              if (
                props.row.original.addresses &&
                props.row.original.addresses.length > 0
              ) {
                address = props.row.original.addresses[0].address;
              }
              setFormData({
                ...formData,
                farmerUUID: props.row.original.farmerUUID,
                farmerCompanyName:
                  props.row.original.farmerCompanyName.toUpperCase(),
                farmAreaId: props.row.original.uuid,
                farmProfileArea: props.row.original.farmArea.toUpperCase(),
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
      Header: "FARM ID",
      accessor: "farmId",
      style: {
        fontSize: 20,
      },
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
      Cell: (props) => {
        if (
          props.row.original.addresses &&
          props.row.original.addresses.length > 0
        ) {
          return props.row.original.addresses[0].address;
        }
        return "-";
      },
    },
  ]);

  const customUtilities = useMemo(() => [
    {
      label: "Edit",
      icon: <i className="fa fa-pencil" />,
      width: 400,
      render: (propsTable) => {
        return (
          <div className="flex">
            <button
              onClick={(e) => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                  FarmerProfile: {
                    farmerCompanyName:
                      propsTable.row?.original?.farmerCompanyName,
                    uuid: propsTable.row?.original?.farmerUUID,
                  },
                });

                setSelectedCompany([
                  {
                    label: propsTable.row.original.farmerCompanyName || "",
                    value: propsTable.row.original.farmerUUID || "",
                  },
                ]);
              }}
              className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg"
            >
              <p className="text-white text-md font-bold">
                <i className="fa fa-pencil-alt " /> Edit
              </p>
            </button>
          </div>
        );
      },
    },
  ]);

  useEffect(() => {
    const incubatedFertilizedEgg =
      formData.totalGolden + formData.totalIdeal + formData.totalImports;

    setFormData({
      ...formData,
      incubatedFertilizedEgg,
    });
  }, [formData.totalGolden, formData.totalIdeal, formData.totalImports]);

  const columns = useMemo(() => [
    {
      Header: "Month & Year",
      accessor: "date",
      style: {
        fontSize: 20,
        width: 200,
      },
      disableFilters: true,
    },
    {
      Header: "Company Name",
      accessor: "farmerCompanyName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Farm Area",
      accessor: "farmProfileArea",
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
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "No. of Incubated Fertilized Eggs",
      accessor: "incubatedFertilizedEgg",
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
      Header: "No. of DOC Produced",
      accessor: "docProduced",
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
      Header: "Golden Chick Hatchery & Breeding Farm Sdn. Bhd",
      accessor: "totalGolden",
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
      Header: "Ideal Hatchery (B) Sdn. Bhd",
      accessor: "totalIdeal",
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
      Header: "Imports",
      accessor: "totalImports",
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
    <AdminArea urlQuery={router.query}>
      <Head>
        <title> Day Old Chick</title>
      </Head>
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
      <FormModal
        title={`Export Day Old Chick`}
        visible={exportModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setExportModalVisible(false);
          setExportFormData({});
          setSelectedCompany([]);
          setSelectedFarmArea([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setExportModalVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportDayOldChick({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            // Convert base64 to blob
            const base64Response = response.data.exportDayOldChick;
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
            link.download = "day_old_chick.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);
            // window.open(response.data.exportDayOldChick, "__blank");
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
            <label>Company Name</label>
            {registerType === "OFFICER" ? (
              <AsyncSelect
                loadOptions={getFarmer}
                className={`form-control`}
                classNamePrefix="select"
                getOptionLabel={(option) => `${option.farmerCompanyName}`}
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
                    farmerUUID: found?.uuid || "",
                  });

                  setFormData({
                    ...formData,
                    FarmerProfile: found,
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
            ) : (
              <Select
                options={allFarmerProfiles}
                className={`form-control`}
                classNamePrefix="select"
                getOptionLabel={(option) => `${option.farmerCompanyName}`}
                getOptionValue={(option) => option.uuid}
                autoFocus={true}
                onChange={(selectedValues) => {
                  // console.log({ selectedValues });

                  const found = allFarmerProfiles.find((profile) =>
                    selectedValues ? profile.uuid === selectedValues.uuid : null
                  );
                  setExportFormData({
                    ...exportFormData,
                    farmerUUID: found?.uuid || "",
                  });

                  setFormData({
                    ...formData,
                    FarmerProfile: found,
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
            )}
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

          <br />
          <br />
        </div>
      </FormModal>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Day Old Chick`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            totalGolden: 0,
            totalIdeal: 0,
            totalImports: 0,
            incubatedFertilizedEgg: 0,
            docProduced: 0,
          });
          setSelectedCompany({});
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          try {
            let { uuid, FarmerProfile, __typename} = formData;
            if (!uuid) {
              delete formData.FarmerProfile;
              const tokenized = jwt.sign(formData, TOKENIZE);
              await createDayOldChick({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
            } else {
              let tokenizedPayload = {
                uuid,
                ...formData,
              };
              delete tokenizedPayload.farmProfileFarmId;
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await updateDayOldChick({
                variables: {
                  // uuid,
                  // ...formData,
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Day Old Chick saved!`,
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
            value={formData.date || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                date: e.target.value,
              });
            }}
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
              const resultFarmerQuery = await client.query({
                query: SEARCH_FARM_QUERY,
                fetchPolicy: "no-cache",
              });

              const encryptedFarmProfile =
                resultFarmerQuery.data?.searchFarmProfile || "";
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

        {/* <div className="form-group">
          <label>Company Name</label>
          <Select
            value={selectedCompany}
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

              const found = allFarmerProfiles.find(
                (profile) => profile.uuid === selectedValues.value
              );
              setFormData({
                ...formData,
                farmerUUID: found.uuid,
                farmerCompanyName: found.farmerCompanyName,

                farmAreaId: "",
                farmProfileArea: "",
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
        {/* <div className="form-group">
          <label>Company Name</label>
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
                // console.log({ selectedValues });

                const found = allFarmerProfiles.find(
                  (profile) => profile.uuid === selectedValues.uuid
                );
                setFormData({
                  ...formData,
                  FarmerProfile: found,
                  farmerUUID: found.uuid,
                  farmerCompanyName: found.farmerCompanyName.toUpperCase(),

                  farmAreaId: "",
                  farmProfileArea: "",
                });

                setSelectedCompany([
                  {
                    value: found.uuid,
                    label: found.farmerCompanyName,
                  },
                ]);
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
                // console.log({ selectedValues });

                const found = allFarmerProfiles.find(
                  (profile) => profile.uuid === selectedValues.uuid
                );
                setFormData({
                  ...formData,
                  FarmerProfile: found,
                  farmerUUID: found.uuid,
                  farmerCompanyName: found.farmerCompanyName.toUpperCase(),

                  farmAreaId: "",
                  farmProfileArea: "",
                });

                setSelectedCompany([
                  {
                    value: found.uuid,
                    label: found.farmerCompanyName,
                  },
                ]);
              }}
            />
          )}
        </div>
        <div className="form-group">
          <label>Farm Area</label>
          <select
            className="form-control"
            value={formData.farmAreaId || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allFarmProfilesByFarmer.find(
                (c) => c.uuid === e.target.value
              );
              setFormData({
                ...formData,
                farmAreaId: found.uuid,
                farmProfileArea: found.farmArea.toUpperCase(),
              });
            }}
            required
          >
            <option value={""} disabled>
              Select Farm
            </option>

            {allFarmProfilesByFarmer.map((farm) => (
              <option value={farm.uuid}>{farm.farmArea.toUpperCase()}</option>
            ))}
          </select>
        </div> */}

        <div className="form-group">
          <label>Company Name</label>
          <input
            className="form-control"
            value={formData.farmerCompanyName || ""}
            disabled
          />
          {/* <AsyncSelect
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
                (profile) => profile.uuid === selectedValues.uuid
              );

              setFormData({
                ...formData,
                FarmerProfile: found,
                farmerUUID: found?.uuid,
                farmerCompanyName: found.farmerCompanyName,

                farmAreaId: "",
                farmProfileArea: "",
                poultryHouseId: "",
                poultryHouseNo: "",
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
        <div className="form-group">
          <label>Farm Area</label>
          <input
            className="form-control"
            value={formData.farmProfileArea || ""}
            disabled
          />
          {/* <select
            disabled
            className="form-control"
            value={formData.farmAreaId || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allFarmProfilesByFarmer.find(
                (c) => c.uuid === e.target.value
              );
              setFormData({
                ...formData,
                farmAreaId: found.uuid,
                farmProfileArea: found.farmArea.toUpperCase(),
                poultryHouseId: "",
                poultryHouseNo: "",
              });
            }}
            required
          >
            <option value={""} disabled>
              Select Farm
            </option>

            {allFarmProfilesByFarmer.map((farm) => (
              <option value={farm.uuid}>{farm.farmArea.toUpperCase()}</option>
            ))}
          </select> */}
        </div>
        <br />
        <label>Fertilized Egg Source and Total Count</label>
        <br />

        <div className="grid grid-cols-2 gap-y-2 mb-2">
          <div>
            <div className="py-2 text-center text-white font-bold bg-mantis-500 text-md">
              Source
            </div>
            Golden Chick Hatchery & Breeding Farm Sdn. Bhd
          </div>
          <div>
            <div className="py-2 text-center text-white font-bold bg-mantis-500 text-md">
              Total
            </div>
            <NumberFormat
              className="form-control"
              value={formData.totalGolden || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  totalGolden: e.floatValue || 0,
                });
              }}
            />
          </div>
          <div>Ideal Hatchery (B) Sdn. Bhd</div>
          <div>
            <NumberFormat
              className="form-control"
              value={formData.totalIdeal || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  totalIdeal: e.floatValue || 0,
                });
              }}
            />
          </div>
          <div>Imports</div>
          <div>
            <NumberFormat
              className="form-control"
              value={formData.totalImports || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  totalImports: e.floatValue || 0,
                });
              }}
            />
          </div>
        </div>

        <div className="form-group">
          <label>No. of Incubated Fertilized Eggs</label>
          <NumberFormat
            className="form-control bg-gray-200"
            disabled
            value={formData.incubatedFertilizedEgg || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                incubatedFertilizedEgg: e.floatValue || 0,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>No. of DOC Produced</label>
          <NumberFormat
            className="form-control"
            value={formData.docProduced || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                docProduced: e.floatValue || 0,
              });
            }}
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
                      "Day Old Chick Export Excel:Read",
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
          data={allDayOldChicks}
          withoutHeader={true}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          onAdd={
            !currentUserDontHavePrivilege(["Day Old Chick:Create"])
              ? (e) => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({
                    totalGolden: 0,
                    totalIdeal: 0,
                    totalImports: 0,
                    incubatedFertilizedEgg: 0,
                    docProduced: 0,
                  });
                  setSelectedCompany({});
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Day Old Chick:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} data?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteDayOldChick({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      setSavedCount((savedCount += 1));
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} data deleted`,
                        level: "success",
                      });
                      await refetch();
                    }
                  } catch (err) {
                    handleError(err);
                  }
                  hideLoadingSpinner();
                }
              : null
          }
          customUtilities={
            !currentUserDontHavePrivilege(["Day Old Chick:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(DayOldChick);
