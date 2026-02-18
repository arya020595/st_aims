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
import lodash from "lodash";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries($monthYear: String!, $filters: String) {
    countAllBroilers(monthYear: $monthYear, filters: $filters)
  }
`;

const BROILER_QUERY = gql`
  query broilerQuery(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllBroilers(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllBroilers(monthYear: $monthYear, filters: $filters)
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

const SEARCH_FARMER_QUERY = gql`
  query searchQuery($name: String!) {
    searchAllFarmerProfiles(name: $name)
  }
`;

const POULTRY_HOUSE_QUERY = gql`
  query tokenizedPoultryHouseByFarmerAndLocation($tokenizedParams: String!) {
    tokenizedPoultryHouseByFarmerAndLocation(tokenizedParams: $tokenizedParams)
  }
`;

const CREATE_BROILER = gql`
  mutation tokenizedCreateBroiler($tokenized: String!) {
    tokenizedCreateBroiler(tokenized: $tokenized)
  }
`;

const UPDATE_BROILER = gql`
  mutation tokenizedUpdateBroiler($tokenized: String!) {
    tokenizedUpdateBroiler(tokenized: $tokenized)
  }
`;

const DELETE_BROILER = gql`
  mutation tokenizedDeleteBroiler($tokenized: String!) {
    tokenizedDeleteBroiler(tokenized: $tokenized)
  }
`;

const EXPORT_TO_EXCEL = gql`
  mutation exportBroilerExcel(
    $monthYear: String!
    $farmerUUID: String
    $farmAreaId: String
  ) {
    exportBroilerExcel(
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

const Broiler = () => {
  const router = useRouter();
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const notification = useNotification();
  const client = useApolloClient();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const [formData, setFormData] = useState({
    mortalityObject: generateMortalityAgeTable(),
  });

  const [createBroiler] = useMutation(CREATE_BROILER);
  const [updateBroiler] = useMutation(UPDATE_BROILER);
  const [deleteBroiler] = useMutation(DELETE_BROILER);
  const [exportBroilerExcel] = useMutation(EXPORT_TO_EXCEL);

  const [allPoultryHouses, setAllPoultryHouse] = useState([]);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [exportFormData, setExportFormData] = useState({});
  const [allBroilers, setAllBroilers] = useState([]);
  const [allFarmerProfiles, setAllFarmerProfiles] = useState([]);
  const [allFarmProfilesByFarmer, setAllFarmProfilesByFarmer] = useState([]);
  const [allFarmProfile, setAllFarmProfile] = useState([]);
  const [
    allFarmProfilesByFarmerForExport,
    setAllFarmProfilesByFarmerForExports,
  ] = useState([]);
  const [registerType, setRegisterType] = useState("");

  let [savedCount, setSavedCount] = useState(0);
  let [countBroilers, setCountBroilers] = useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countBroilers) return 1;
    return Math.ceil(countBroilers / pageSize);
  }, [countBroilers, pageSize]);

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

  const [modalVisible, setModalVisible] = useState(false);
  useEffect(() => {
    showLoadingSpinner();
    if (!loading && !error) {
      // const encryptedBroilers = data?.tokenizedAllBroilers || "";
      // let allBroilers = [];
      // if (encryptedBroilers) {
      //   const decrypted = jwt.verify(encryptedBroilers, TOKENIZE);
      //   allBroilers = decrypted.queryResult;
      //   setAllBroilers(allBroilers);
      // }

      // const encryptedFarmerProfiles = data?.tokenizedAllFarmerProfile || "";
      // let allFarmerProfiles = [];
      // if (encryptedFarmerProfiles) {
      //   const decrypted = jwt.verify(encryptedFarmerProfiles, TOKENIZE);
      //   allFarmerProfiles = decrypted.queryResult;
      //   setAllFarmerProfiles(allFarmerProfiles);
      // }

      // const encryptedFarmProfiles = data?.tokenizedAllFarmProfilesByFarmer || "";
      // let allFarmProfilesByFarmer = [];
      // if (encryptedFarmProfiles) {
      //   const decrypted = jwt.verify(encryptedFarmProfiles, TOKENIZE);
      //   allFarmProfilesByFarmer = decrypted.queryResult;
      //   // setAllFarmProfilesByFarmer(allFarmProfilesByFarmer);
      //   setAllFarmProfilesByFarmerForExports(allFarmProfilesByFarmer)
      // }

      const countData = data?.countAllBroilers || 0;
      setCountBroilers(countData);
    }
    hideLoadingSpinner();
  }, [data, loading, error, savedCount]);

  // const allFarmerProfiles = data?.allFarmerProfiles || [];
  // const allFarmProfilesByFarmer = data?.allFarmProfilesByFarmer || [];

  // const encryptedBroilers = data?.tokenizedAllBroilers || "";
  // let allBroilers = [];
  // if (encryptedBroilers) {
  //   const decrypted = jwt.verify(encryptedBroilers, TOKENIZE);
  //   allBroilers = decrypted.queryResult;
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
    if (!router.query.filters) return [];
    try {
      let filters = JSON.parse(router.query.filters);
      return filters;
    } catch (err) {
      console.warn(err);
    }
    return [];
  }, [router.query.filters]);

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: BROILER_QUERY,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedBroilers = result.data?.tokenizedAllBroilers || "";
    let allBroilers = [];
    if (encryptedBroilers) {
      const decrypted = jwt.verify(encryptedBroilers, TOKENIZE);
      allBroilers = decrypted.queryResult;
      setAllBroilers(allBroilers);
    }
    const countData = result.data?.countAllBroilers || 0;
    setCountBroilers(countData);
    hideLoadingSpinner();
  }, [savedCount, yearMonth, pageSize, pageIndex, router.query.filters]);

  useEffect(async () => {
    const result = await client.query({
      query: FARM_AREA_QUERY,
      variables: {
        tokenizedParams,
        onPage: "BROILER",
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
      setAllFarmProfilesByFarmerForExports(allFarmProfilesByFarmer);
    }
  }, [tokenizedParams]);

  // let allFarmProfilesByFarmerForExport = allFarmProfilesByFarmerForExports || [];

  // allFarmProfilesByFarmerForExport = lodash.uniqBy(
  //   allFarmProfilesByFarmerForExport,
  //   (farm) => farm.farmArea
  // );

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

  useEffect(async () => {
    try {
      const payloadParams = {
        farmerUUID: formData.farmerUUID || "",
        farmAreaId: formData.farmAreaId || "",
      };
      const tokenizedParams = jwt.sign(payloadParams, TOKENIZE);

      const result = await client.query({
        query: POULTRY_HOUSE_QUERY,
        variables: {
          tokenizedParams,
        },
        fetchPolicy: "no-cache",
      });

      const encryptedPoultryHouseByFarmerAndLocation =
        result.data.tokenizedPoultryHouseByFarmerAndLocation || "";
      if (encryptedPoultryHouseByFarmerAndLocation) {
        const decrypted = jwt.verify(
          encryptedPoultryHouseByFarmerAndLocation,
          TOKENIZE
        );
        let poultryHouse = decrypted.queryResult;
        poultryHouse = poultryHouse.filter(
          (p) => p.farmProfileArea === formData.farmProfileArea
        );
        if (poultryHouse.length > 0) {
          setAllPoultryHouse(poultryHouse);
        } else {
          poultryHouse = poultryHouse.filter(
            (p) => p.farmAreaId === formData.farmAreaId
          );

          if (poultryHouse.length > 0) {
            setAllPoultryHouse(poultryHouse);
          } else {
            setAllPoultryHouse([]);
          }
        }
      }
    } catch (err) {
      notification.handleError(err);
    }
  }, [formData.farmerUUID, formData.farmAreaId]);

  useEffect(() => {
    let arrayTotal = formData.mortalityObject.map((m) => parseInt(m.total));
    const grandTotal = arrayTotal.reduce((acc, curr) => acc + curr, 0);

    let doc = 0;
    if (formData.noDocEntry) {
      doc = parseInt(formData.noDocEntry.replace(/,/g, ""));
    }
    const production = doc - grandTotal;
    setFormData({
      ...formData,
      total: grandTotal,
      production,
    });
  }, [formData.mortalityObject, formData.noDocEntry]);

  const customUtilities = useMemo(() => [
    {
      label: "Edit",
      icon: <i className="fa fa-pencil" />,
      width: 400,
      render: (propsTable) => {
        let mortality = [];
        if (propsTable.row.original.Mortality) {
          mortality = propsTable.row.original.Mortality;
        }
        return (
          <div className="flex">
            <button
              onClick={(e) => {
                if (e) e.preventDefault();
                const num = parseFloat(propsTable.row.original.noDocEntry);
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                  mortalityObject: mortality,
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

  const columns = useMemo(() => [
    {
      Header: "Date Entry",
      accessor: "dateEntry",
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
    {
      Header: "House No.",
      accessor: "poultryHouseNo",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Cycle No.",
      accessor: "cycleNo",
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
                address,
                poultryHouseId: "",
                poultryHouseNo: "",
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
        <title>Master Data | Broiler</title>
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
        title={`Export Production`}
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
            const response = await exportBroilerExcel({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            downloadExcel(
              response.data.exportBroilerExcel.data,
              `${router.query.sidebarSubMenu}-export`
            );

            // Convert base64 to blob
            // const base64Response = response.data.exportBroilerExcel;
            // const byteCharacters = atob(base64Response);
            // const byteNumbers = new Array(byteCharacters.length);
            // for (let i = 0; i < byteCharacters.length; i++) {
            //   byteNumbers[i] = byteCharacters.charCodeAt(i);
            // }
            // const byteArray = new Uint8Array(byteNumbers);
            // const blob = new Blob([byteArray], {
            //   type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            // });

            // // Create download URL and trigger download
            // const url = window.URL.createObjectURL(blob);
            // const link = document.createElement("a");
            // link.href = url;
            // link.download = "broiler_production.xlsx";
            // link.click();
            // window.URL.revokeObjectURL(url);

            // window.location.href = response.data.exportBroilerExcel;
            // window.open(response.data.exportBroilerExcel, "__blank");
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
          />

          {/* <div className="form-group">
            <label>Company Name</label>
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
              getOptionLabel={(option) =>
                `${option.farmerCompanyName.toUpperCase()}`
              }
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              noOptionsMessage={() => "Type to Search"}
              onChange={(selectedValues) => {
                const found = allFarmerProfiles.find((profile) =>
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
                  label: prof.farmArea.toUpperCase(),
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
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
                    label: found?.farmArea.toUpperCase() || "",
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
        title={`${!formData.uuid ? "New" : "Edit"} Broiler`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            mortalityObject: generateMortalityAgeTable(),
          });
          setSelectedCompany({});
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          try {
            let {
              __typename,
              mortalityObject,
              Mortality,
              FarmerProfile,
              uuid,
              ...data
            } = formData;

            let tmp = [];
            for (let m of mortalityObject) {
              tmp.push({
                day: m.day,
                total: parseInt(m.total),
              });
            }

            if (!uuid) {
              const tokenizedPayload = {
                ...data,
                mortalityObject: tmp,
                // mortalityObject: {
                //   listMortalities: tmp,
                // },
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await createBroiler({
                variables: {
                  // ...data,
                  // mortalityObject: {
                  //   listMortalities: tmp,
                  // },
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
            } else {
              let tokenizedPayload = {
                uuid,
                ...data,
                mortalityObject: tmp,
                // mortalityObject: {
                //   listMortalities: tmp,
                // },
              };
              delete tokenizedPayload.farmProfileFarmId;
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await updateBroiler({
                variables: {
                  // uuid,
                  // ...data,
                  // mortalityObject: {
                  //   listMortalities: tmp,
                  // },
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Broiler saved!`,
              level: "success",
            });
            setFormData({
              mortalityObject: generateMortalityAgeTable(),
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
        size="md"
      >
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
        {/* <select
            className="form-control"
            value={formData.farmerUUID || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allFarmerProfiles.find(
                (c) => c.uuid === e.target.value
              );
              setFormData({
                ...formData,
                farmerUUID: found.uuid,
                farmerCompanyName: found.farmerCompanyName,
              });
            }}
            required
          >
            <option value={""} disabled>
              Select Company Name
            </option>

            {allFarmerProfiles.map((farm) => (
              <option value={farm.uuid}>{farm.farmerCompanyName}</option>
            ))}
          </select> */}
        {/* </div> */}
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
          <label>House No.</label>
          <select
            className="form-control"
            value={formData.poultryHouseId || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allPoultryHouses.find(
                (c) => c.uuid === e.target.value
              );
              setFormData({
                ...formData,
                poultryHouseId: found.uuid,
                poultryHouseNo: found.houseNo,
                // address: found.address || "",
              });
            }}
            required
          >
            <option value={""} disabled>
              Select House
            </option>

            {allPoultryHouses
              // .filter((hs) => hs.farmAreaId === formData.farmAreaId)
              .map((house) => (
                <option value={house.uuid}>{house.houseNo}</option>
              ))}
          </select>
        </div>

        <div className="form-group">
          <label>Address</label>
          <input
            className="form-control"
            value={formData.address || ""}
            disabled
          />
        </div>

        <div className="form-group">
          <label>Cycle No.</label>
          <input
            className="form-control"
            value={formData.cycleNo || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                cycleNo: parseInt(e.target.value),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Date of Entry</label>
          <input
            className="form-control"
            type="date"
            required
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                dateEntry: e.target.value,
              });
            }}
            value={formData.dateEntry || ""}
          />
        </div>
        <div className="form-group">
          <label>No. of DOC Entry</label>
          <input
            className="form-control"
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                noDocEntry: e.target.value,
              });
            }}
            value={formData.noDocEntry || ""}
          />
        </div>
        <div className="form-group">
          <label>DOC Source</label>
          <select
            className="form-control"
            value={(formData.docSource || "").toUpperCase()}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                docSource: e.target.value,
              });
            }}
          >
            <option value={""} disabled>
              Select DOC Source
            </option>
            <option value={"GOLDEN CHICK HATCHERY AND BREEDING FARM SDN BHD"}>
              1. GOLDEN CHICK HATCHERY AND BREEDING FARM SDN BHD
            </option>
            <option value={"IDEAL HATCHERY (B) SDN BHD"}>
              2. IDEAL HATCHERY (B) SDN BHD
            </option>
            <option value={"IMPORT"}>3. IMPORT</option>
          </select>
        </div>
        <div className="form-group">
          <label>Chicken Breed</label>
          <select
            className="form-control"
            value={(formData.chickenBreed || "").toUpperCase()}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                chickenBreed: e.target.value,
              });
            }}
          >
            <option value={""} disabled>
              Select Chicken Breed
            </option>
            <option value="COBB 500">1. COBB 500</option>
            <option value="ROSS">2. ROSS</option>
            <option value="ABOR ACRES">3. ABOR ACRES</option>
          </select>
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
                feedSource: e.target.value,
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

        <p className="text-md my-2">Mortality by Age (Day)</p>
        <div className="grid grid-cols-6">
          {formData.mortalityObject.map((mortality) => (
            <div>
              <div className="bg-mantis-500 text-center py-2 text-white font-bold">
                {mortality.day}
              </div>
              <div className="bg-white w-auto">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={mortality.total || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      mortalityObject: formData.mortalityObject.map((det) =>
                        det.day !== mortality.day
                          ? det
                          : {
                              ...mortality,
                              total: e.floatValue || 0,
                            }
                      ),
                    });
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div />

          <div />

          <div>
            <div className="form-group">
              <label>Mortality Total</label>
              <NumberFormat
                className="form-control"
                thousandSeparator={","}
                decimalSeparator={"."}
                value={formData.total || 0}
                disabled
              />
            </div>
          </div>
        </div>
        <div className="form-group">
          <label>Broiler Production</label>
          <NumberFormat
            className="form-control"
            thousandSeparator={","}
            decimalSeparator={"."}
            value={formData.production || 0}
            disabled
          />
        </div>
        <div className="form-group">
          <label>Production Date</label>
          <input
            className="form-control"
            type="date"
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                productionDate: e.target.value,
              });
            }}
            value={formData.productionDate || ""}
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
                    !currentUserDontHavePrivilege(["Broiler Export Excel:Read"])
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
          data={allBroilers}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege(["Broiler:Create"])
              ? (e) => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({
                    mortalityObject: generateMortalityAgeTable(),
                  });
                  setSelectedCompany({});
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Broiler:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} broilers?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteBroiler({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      setSavedCount((savedCount += 1));
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} broilers deleted`,
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
            !currentUserDontHavePrivilege(["Broiler:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Broiler);

const generateMortalityAgeTable = () => {
  let results = [];
  for (let i = 1; i <= 60; i++) {
    results.push({
      day: i,
      total: 0,
    });
  }
  return results;
};

const downloadExcel = async (fileBuffer, filename) => {
  const byteArray = Array.isArray(fileBuffer)
    ? Uint8Array.from(fileBuffer)
    : new Uint8Array(fileBuffer || []);

  const blob = new Blob([byteArray], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  return {
    success: true,
    error: "",
  };
};
