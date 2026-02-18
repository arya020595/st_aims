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

const QUERY = gql`
  query listQueries($monthYear: String!, $filters: String) {
    tokenizedAllFarmerProfile
    countAllTableEggs(monthYear: $monthYear, filters: $filters)
  }
`;

const TABLE_EEGS_QUERY = gql`
  query tokenizedAllTableEggs(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllTableEggs(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllTableEggs(monthYear: $monthYear, filters: $filters)
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
    searchAllFarmerProfiles(name: $name)
  }
`;

const SEARCH_FARM_QUERY = gql`
  query searchFarmProfile($name: String) {
    searchFarmProfile(name: $name)
  }
`;

const CREATE_TABLE_EGG = gql`
  mutation tokenizedCreateTableEgg($tokenized: String!) {
    tokenizedCreateTableEgg(tokenized: $tokenized)
  }
`;

const UPDATE_TABLE_EGG = gql`
  mutation tokenizedUpdateTableEgg($tokenized: String!) {
    tokenizedUpdateTableEgg(tokenized: $tokenized)
  }
`;

const DELETE_TABLE_EGG = gql`
  mutation tokenizedDeleteTableEgg($tokenized: String!) {
    tokenizedDeleteTableEgg(tokenized: $tokenized)
  }
`;

const EXPORT_TABLE_EGGS = gql`
  mutation exportTableEgg(
    $monthYear: String!
    $farmerUUID: String
    $farmAreaId: String
  ) {
    exportTableEgg(
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

const TableEggs = () => {
  const router = useRouter();
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const client = useApolloClient();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const notification = useNotification();
  const [formData, setFormData] = useState({
    totalNoOfLayer: 0,
    totalEggs: 0,

    typeOfBreed: [],
  });
  const [exportFormData, setExportFormData] = useState({});
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [allFarmProfile, setAllFarmProfile] = useState([]);
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [registerType, setRegisterType] = useState("");

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

  const [createTableEgg] = useMutation(CREATE_TABLE_EGG);
  const [updateTableEgg] = useMutation(UPDATE_TABLE_EGG);
  const [deleteTableEgg] = useMutation(DELETE_TABLE_EGG);
  const [exportTableEgg] = useMutation(EXPORT_TABLE_EGGS);
  const [
    allFarmProfilesByFarmerForExport,
    setAllFarmProfilesByFarmerForExport,
  ] = useState([]);
  const [allTableEggs, setAllTableEggs] = useState([]);
  const [allFarmerProfiles, setAllFarmerProfiles] = useState([]);
  const [allFarmProfilesByFarmer, setAllFarmProfilesByFarmer] = useState([]);
  let [savedCount, setSavedCount] = useState(0);

  let [countTableEggs, setCountTableEggs] = useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countTableEggs) return 1;
    return Math.ceil(countTableEggs / pageSize);
  }, [countTableEggs, pageSize]);
  useEffect(() => {
    if (!loading && !error) {
      //     // const encryptedTableEggs = data?.tokenizedAllTableEggs || "";
      //     // let allTableEggs = [];
      //     // if (encryptedTableEggs) {
      //     //   const decrypted = jwt.verify(encryptedTableEggs, TOKENIZE);
      //     //   allTableEggs = decrypted.queryResult;
      //     //   setAllTableEggs(allTableEggs);
      //     // }

      //     // const encryptedFarmerProfiles = data?.tokenizedAllFarmerProfile || "";
      //     // let allFarmerProfiles = [];
      //     // if (encryptedFarmerProfiles) {
      //     //   const decrypted = jwt.verify(encryptedFarmerProfiles, TOKENIZE);
      //     //   allFarmerProfiles = decrypted.queryResult;
      //     //   setAllFarmerProfiles(allFarmerProfiles);
      //     // }

      //     // const encryptedFarmProfilesByFarmer = data?.tokenizedAllFarmProfilesByFarmer || "";
      //     // let allFarmProfilesByFarmer = [];
      //     // if (encryptedFarmProfilesByFarmer) {
      //     //   const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
      //     //   allFarmProfilesByFarmer = decrypted.queryResult;
      //     //   setAllFarmProfilesByFarmer(allFarmProfilesByFarmer);
      //     // }
      const countData = data?.countAllTableEggs || 0;
      setCountTableEggs(countData);
    }
  }, [data, loading, error, savedCount]);
  // const allFarmerProfiles = data?.allFarmerProfiles || [];
  // const allFarmProfilesByFarmer = data?.allFarmProfilesByFarmer || [];

  // let allFarmProfilesByFarmerForExport = allFarmProfilesByFarmer;
  // allFarmProfilesByFarmerForExport = lodash.uniqBy(
  //   allFarmProfilesByFarmerForExport,
  //   (farm) => farm.farmArea
  // );

  // const encryptedTableEggs = data?.tokenizedAllTableEggs || "";
  // let allTableEggs = [];
  // if (encryptedTableEggs) {
  //   const decrypted = jwt.verify(encryptedTableEggs, TOKENIZE);
  //   allTableEggs = decrypted.queryResult;
  // }

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
      query: TABLE_EEGS_QUERY,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedTableEggs = result.data?.tokenizedAllTableEggs || "";
    let allTableEggs = [];
    if (encryptedTableEggs) {
      const decrypted = jwt.verify(encryptedTableEggs, TOKENIZE);
      allTableEggs = decrypted.queryResult;
      setAllTableEggs(allTableEggs);
    }
    const countData = result.data?.countAllTableEggs || 0;
    setCountTableEggs(countData);
    hideLoadingSpinner();
  }, [savedCount, yearMonth, pageSize, pageIndex, router.query.filters]);

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: FARM_AREA_QUERY,
      variables: {
        tokenizedParams: tokenizedParams,
        onPage: "TABLE EGGS",
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
  // console.log(formData)
  const columns = useMemo(() => [
    {
      Header: "Month & Year",
      accessor: "date",
      style: {
        fontSize: 20,
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
      Header: "Farm ID",
      accessor: "farmProfileFarmId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Farm Area",
      accessor: "farmProfileArea",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
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

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Table Eggs</title>
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
        title={`Export Table Eggs`}
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
            const response = await exportTableEgg({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            // Convert base64 to blob
            const base64Response = response.data.exportTableEgg;
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
            link.download = "table_eggs_production.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);


            // window.open(response.data.exportTableEgg, "__blank");
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
        title={`${!formData.uuid ? "New" : "Edit"} Table Eggs`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            totalEggs: 0,
            totalNoOfLayer: 0,
            typeOfBreed: [],
          });
          setSelectedCompany({});
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          try {
            const {
              farmerName,
              farmerUUID,
              farmLocationId,
              farmName,
              uuid,
              FarmerProfile,
              __typename,
              ...data
            } = formData;

            if (!uuid) {
              const tokenizedPayload = {
                farmerName,
                farmerUUID,
                farmLocationId,
                farmName,
                ...data,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await createTableEgg({
                variables: {
                  tokenized,
                  // farmerName,
                  // farmerUUID,
                  // farmLocationId,
                  // farmName,
                  // ...data,
                },
              });
              setSavedCount((savedCount += 1));
            } else {
              const tokenizedPayload = {
                uuid,
                farmerName,
                farmerUUID,
                farmLocationId,
                farmName,
                ...data,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await updateTableEgg({
                variables: {
                  // uuid,
                  // farmerName,
                  // farmerUUID,
                  // farmLocationId,
                  // farmName,
                  // ...data,
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Table Egg saved!`,
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
        <div className="form-group">
          <label>Company Name</label>
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
              // console.log({ selectedValues });

              const found = allFarmerProfiles.find(
                (profile) => profile.uuid === selectedValues.uuid
              );
              setFormData({
                ...formData,
                FarmerProfile: found,
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
          /> */}
          <input
            className="form-control"
            value={formData.farmerCompanyName || ""}
            disabled
          />
        </div>
        <div className="form-group">
          <label>Farm Area</label>
          <input
            className="form-control"
            value={formData.farmProfileArea || ""}
            disabled
          />
          {/* <select
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
          </select> */}
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
        <div className="form-group">
          <label>Type of Breed</label>

          <div className="grid grid-cols-2 gap-1">
            <div>
              <input
                type="checkbox"
                className="mx-2"
                checked={formData.typeOfBreed
                  .map((breed) => breed.toUpperCase())
                  .includes("ISA BROWN")}
                onChange={(e) => {
                  const foundIndex = formData.typeOfBreed.findIndex(
                    (type) => type === e.target.value
                  );

                  if (foundIndex === -1) {
                    setFormData({
                      ...formData,
                      typeOfBreed: [...formData.typeOfBreed, e.target.value],
                    });
                  } else {
                    setFormData({
                      ...formData,
                      typeOfBreed: formData.typeOfBreed.filter(
                        (breed) => breed !== e.target.value
                      ),
                    });
                  }
                }}
                value={"ISA BROWN"}
              />
              <label>ISA BROWN</label>
            </div>
            <div>
              <input
                type="checkbox"
                className="mx-2"
                checked={formData.typeOfBreed
                  .map((breed) => breed.toUpperCase())
                  .includes("LOHMANN BROWN")}
                onChange={(e) => {
                  const foundIndex = formData.typeOfBreed.findIndex(
                    (type) => type === e.target.value
                  );

                  if (foundIndex === -1) {
                    setFormData({
                      ...formData,
                      typeOfBreed: [...formData.typeOfBreed, e.target.value],
                    });
                  } else {
                    setFormData({
                      ...formData,
                      typeOfBreed: formData.typeOfBreed.filter(
                        (breed) => breed !== e.target.value
                      ),
                    });
                  }
                }}
                value={"LOHMANN BROWN"}
              />
              <label>LOHMANN BROWN</label>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Feed Source</label>
          <select
            className="form-control"
            value={(formData.feedSource || "").toUpperCase()}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                feedSource: e.target.value.toUpperCase(),
              });
            }}
          >
            <option value={""} disabled>
              Select Feed Source
            </option>
            <option value="GOLD COIN FEEDMILL (B) SDN BHD">
              1. GOLD COIN FEEDMILL (B) SDN BHD
            </option>
            <option value="IDEAL FEED MILLS SDN BHD">
              2. IDEAL FEED MILLS SDN BHD
            </option>
            <option value="IMPORT">3. IMPORT</option>
          </select>
        </div>

        <div className="form-group">
          <label>Total No. of Layer</label>
          <NumberFormat
            className="form-control"
            value={formData.totalNoOfLayer || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                totalNoOfLayer: e.floatValue,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Total Eggs</label>
          <NumberFormat
            className="form-control"
            value={formData.totalEggs || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                totalEggs: e.floatValue,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Remark</label>
          <input
            className="form-control"
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                remark: e.target.value.toUpperCase(),
              });
            }}
            value={(formData.remark || "").toUpperCase()}
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
                      "Table Eggs Export Excel:Read",
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
          data={allTableEggs}
          withoutHeader={true}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          onAdd={
            !currentUserDontHavePrivilege(["Table Eggs:Create"])
              ? (e) => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({
                    totalNoOfLayer: 0,
                    totalEggs: 0,
                    typeOfBreed: [],
                  });
                  setSelectedCompany({});
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Table Eggs:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} data?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteTableEgg({
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
            !currentUserDontHavePrivilege(["Table Eggs:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(TableEggs);
