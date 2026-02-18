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
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";
import NumberFormat from "react-number-format";
import Select from "react-select";
import { MonthAndYearsFilterWithExport } from "../../components/MonthAndYearsFilterWithExport";
import lodash from "lodash";
import AsyncSelect from "react-select/async";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries($monthYear: String!, $filters: String) {
    tokenizedAllFarmLocation
    countAllRuminantProductions(monthYear: $monthYear, filters: $filters)
  }
`;

const PRODUCTION_QUERY = gql`
  query productionQuery(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllRuminantProductions(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllRuminantProductions(monthYear: $monthYear, filters: $filters)
  }
`;
const FARM_AREA_QUERY = gql`
  query farmAreaQUery($tokenizedParams: String, $onPage: String!) {
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

const CREATE_RUMINANT_PRODUCTION = gql`
  mutation tokenizedCreateRuminantProduction($tokenized: String!) {
    tokenizedCreateRuminantProduction(tokenized: $tokenized)
  }
`;

const UPDATE_RUMINANT_PRODUCTION = gql`
  mutation tokenizedUpdateRuminantProduction($tokenized: String!) {
    tokenizedUpdateRuminantProduction(tokenized: $tokenized)
  }
`;

const DELETE_RUMINANT_PRODUCTION = gql`
  mutation tokenizedDeleteRuminantProduction($tokenized: String!) {
    tokenizedDeleteRuminantProduction(tokenized: $tokenized)
  }
`;

const EXPORT_TO_EXCEL = gql`
  mutation exportRuminantProductionExcel(
    $monthYear: String!
    $farmerUUID: String
    $farmAreaId: String
    $district: String
  ) {
    exportRuminantProductionExcel(
      monthYear: $monthYear
      farmerUUID: $farmerUUID
      farmAreaId: $farmAreaId
      district: $district
    )
  }
`;

const IS_CHECK_FARMER = gql`
  query isFarmerCheck {
    isFarmerCheck
  }
`;

const Production = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const notification = useNotification();
  const [exportFormData, setExportFormData] = useState({});
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [registerType, setRegisterType] = useState("");

  const client = useApolloClient();

  const [formData, setFormData] = useState({
    production: {
      kerbauLocalJual: 0,
      kerbauLocalSembelih: 0,
      kerbauLocalQurban: 0,
      kerbauImportJual: 0,
      kerbauImportSembelih: 0,
      kerbauImportQurban: 0,

      lembuLocalJual: 0,
      lembuLocalSembelih: 0,
      lembuLocalQurban: 0,
      lembuImportJual: 0,
      lembuImportSembelih: 0,
      lembuImportQurban: 0,

      biriLocalJual: 0,
      biriLocalSembelih: 0,
      biriLocalQurban: 0,
      biriImportJual: 0,
      biriImportSembelih: 0,
      biriImportQurban: 0,

      rusaLocalJual: 0,
      rusaLocalSembelih: 0,
      rusaLocalQurban: 0,
      rusaImportJual: 0,
      rusaImportSembelih: 0,
      rusaImportQurban: 0,

      kambingLocalJual: 0,
      kambingLocalSembelih: 0,
      kambingLocalQurban: 0,
      kambingImportJual: 0,
      kambingImportSembelih: 0,
      kambingImportQurban: 0,
    },

    total: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);

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
  const [createRuminantProduction] = useMutation(CREATE_RUMINANT_PRODUCTION);
  const [updateRuminantProduction] = useMutation(UPDATE_RUMINANT_PRODUCTION);
  const [deleteRuminantProduction] = useMutation(DELETE_RUMINANT_PRODUCTION);
  const [exportRuminantProductionExcel] = useMutation(EXPORT_TO_EXCEL);
  let [savedCount, setSavedCount] = useState(0);
  const [
    allFarmProfilesByFarmerForExport,
    setAllFarmProfilesByFarmerForExport,
  ] = useState([]);
  const [allRuminantProductions, setAllRuminantProductions] = useState([]);
  const [allFarmerProfiles, setAllFarmerProfiles] = useState([]);
  const [allFarmProfilesByFarmer, setAllFarmProfilesByFarmer] = useState([]);
  const [allDistrict, setAllDistrict] = useState([]);

  let [countRuminantProduction, setCountRuminantProduction] = useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countRuminantProduction) return 1;
    return Math.ceil(countRuminantProduction / pageSize);
  }, [countRuminantProduction, pageSize]);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedRuminantProductions = data?.tokenizedAllRuminantProductions || "";
      // let allRuminantProductions = [];
      // if (encryptedRuminantProductions) {
      //   const decrypted = jwt.verify(encryptedRuminantProductions, TOKENIZE);
      //   allRuminantProductions = decrypted.queryResult;
      //   setAllRuminantProductions(allRuminantProductions);
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
      //   setAllFarmProfilesByFarmer(allFarmProfilesByFarmer);
      // }

      const encryptedDistricts = data?.tokenizedAllFarmLocation || "";
      let allDistrict = [];
      if (encryptedDistricts) {
        const decrypted = jwt.verify(encryptedDistricts, TOKENIZE);
        allDistrict = decrypted.queryResult;
        setAllDistrict(allDistrict);
      }
      const countData = data?.countAllRuminantProductions || 0;
      setCountRuminantProduction(countData);
    }
  }, [data, loading, error, savedCount]);

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

  const [selectedDistrict, setSelectedDistrict] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  // const encryptedRuminantProductions =
  //   data?.tokenizedAllRuminantProductions || "";
  // let allRuminantProductions = [];
  // if (encryptedRuminantProductions) {
  //   const decrypted = jwt.verify(encryptedRuminantProductions, TOKENIZE);
  //   allRuminantProductions = decrypted.queryResult;
  // }

  // const allFarmerProfiles = data?.allFarmerProfiles || [];
  // const allFarmProfilesByFarmer = data?.allFarmProfilesByFarmer || [];

  // let allFarmProfilesByFarmerForExport = allFarmProfilesByFarmer || [];

  // allFarmProfilesByFarmerForExport = lodash.uniqBy(
  //   allFarmProfilesByFarmerForExport,
  //   (farm) => farm.farmArea
  // );

  let allDistricts = allDistrict || [];
  allDistricts = lodash.uniqBy(allDistricts, (loc) => loc.district);

  useEffect(() => {
    calculate();
  }, [formData.production]);

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

    const encryptedRuminantProductions =
      result.data?.tokenizedAllRuminantProductions || "";
    let allRuminantProductions = [];
    if (encryptedRuminantProductions) {
      const decrypted = jwt.verify(encryptedRuminantProductions, TOKENIZE);
      allRuminantProductions = decrypted.queryResult;
      setAllRuminantProductions(allRuminantProductions);
    }
    const countData = result.data?.countAllRuminantProductions || 0;
    setCountRuminantProduction(countData);
    hideLoadingSpinner();
  }, [savedCount, yearMonth, pageIndex, pageSize, router.query.filters]);

  useEffect(async () => {
    const result = await client.query({
      query: FARM_AREA_QUERY,
      variables: {
        tokenizedParams: tokenizedParams,
        onPage: "RUMINANT PRODUCTION",
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

  // const year = String(router.query.year || dayjs().format("YYYY"));
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

                let data = {
                  production: {},
                };

                for (const key of Object.keys(propsTable.row.original)) {
                  if (!key.includes("Local") && !key.includes("Import")) {
                    data[key] = propsTable.row.original[key];
                  } else {
                    data.production[key] = propsTable.row.original[key];
                  }
                }

                setModalVisible(true);
                setFormData({
                  ...data,
                  FarmerProfile: {
                    farmerCompanyName:
                      propsTable.row.original.farmerCompanyName || "",
                    uuid: propsTable.row.original.farmerUUID || "",
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
      Header: "ID",
      accessor: "id",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
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
      Header: "District",
      accessor: "district",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
  ]);

  const calculate = () => {
    let total = 0;
    for (const key of Object.keys(formData.production)) {
      total += formData.production[key];
    }

    setFormData({
      ...formData,
      total,
    });
  };

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Ruminant Production</title>
      </Head>

      <FormModal
        title={`Export Production`}
        visible={exportModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setExportModalVisible(false);
          setExportFormData({});
          setSelectedCompany([]);
          setSelectedFarmArea([]);
          setSelectedDistrict([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setExportModalVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportRuminantProductionExcel({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            // Convert base64 to blob
            const base64Response = response.data.exportRuminantProductionExcel;
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
            link.download = "ruminant_production.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);


            

            // window.location.href = response.data.exportRuminantProductionExcel;
            // window.open(response.data.exportRuminantProductionExcel, "__blank");
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
                getOptionLabel={(option) =>
                  `${option.farmerCompanyName.toUpperCase()}`
                }
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

                      label: found?.farmerCompanyName.toUpperCase() || "",
                    },
                  ]);
                }}
              />
            ) : (
              <Select
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

                      label: found?.farmerCompanyName.toUpperCase() || "",
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

          <div className="form-group">
            <label>District</label>
            <Select
              isClearable={true}
              value={selectedDistrict}
              options={allDistricts.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.district.toUpperCase(),
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                const found = allDistricts.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  district: found?.district || "",
                });

                setSelectedDistrict([
                  {
                    value: found?.uuid || "",
                    label: found?.district.toUpperCase() || "",
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
        title={`${!formData.uuid ? "New" : "Edit"} Ruminant Production`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            production: {
              kerbauLocalJual: 0,
              kerbauLocalSembelih: 0,
              kerbauLocalQurban: 0,
              kerbauImportJual: 0,
              kerbauImportSembelih: 0,
              kerbauImportQurban: 0,

              lembuLocalJual: 0,
              lembuLocalSembelih: 0,
              lembuLocalQurban: 0,
              lembuImportJual: 0,
              lembuImportSembelih: 0,
              lembuImportQurban: 0,

              biriLocalJual: 0,
              biriLocalSembelih: 0,
              biriLocalQurban: 0,
              biriImportJual: 0,
              biriImportSembelih: 0,
              biriImportQurban: 0,

              rusaLocalJual: 0,
              rusaLocalSembelih: 0,
              rusaLocalQurban: 0,
              rusaImportJual: 0,
              rusaImportSembelih: 0,
              rusaImportQurban: 0,

              kambingLocalJual: 0,
              kambingLocalSembelih: 0,
              kambingLocalQurban: 0,
              kambingImportJual: 0,
              kambingImportSembelih: 0,
              kambingImportQurban: 0,
            },

            total: 0,
          });
          setSelectedCompany({});
        }}
        onCustomCloseBackDrop={true}
        size="lg"
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          try {
            let { uuid, production, total, ...f } = formData;
            if (!uuid) {
              const tokenizedPayload = {
                ...production,
                total,
                ...f,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await createRuminantProduction({
                variables: {
                  // ...production,
                  // total,
                  // ...f,
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
            } else {
              const tokenizedPayload = {
                uuid,
                total,
                date: f.date,
                farmerCompanyName: f.farmerCompanyName,
                farmerUUID: f.farmerUUID,
                farmAreaId: f.farmAreaId,
                farmProfileArea: f.farmProfileArea,
                district: f.district,

                ...production,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await updateRuminantProduction({
                variables: {
                  // uuid,
                  // total,
                  // date: f.date,
                  // farmerCompanyName: f.farmerCompanyName,
                  // farmerUUID: f.farmerUUID,
                  // farmAreaId: f.farmAreaId,
                  // farmProfileArea: f.farmProfileArea,
                  // district: f.district,

                  // ...production,
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Ruminant Stock saved!`,
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
            className="form-control w-1/5"
            type="month"
            required
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
                district: (found?.farmDistrict || "").toUpperCase(),
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
        </div>

        <div className="form-group">
          <label>District</label>
          <input
            placeholder="District"
            className="form-control"
            value={(formData.district || "").toUpperCase()}
            required
            disabled
          />
        </div>

        <label>Production: </label>
        <div className="grid grid-cols-3 gap-0 font-bold">
          <div className="bg-mantis-500 text-white py-2">
            <div className="flex justify-center  ">Ternakan</div>
          </div>

          <div className="bg-mantis-500 text-white border">
            <div className="flex border-b-2 justify-center">
              <p className="text-md">Local</p>
            </div>

            <div className="grid grid-cols-3 bg-mantis-500 text-white">
              <div className="border flex justify-center text-md">Jual</div>
              <div className="border flex justify-center text-md">Sembelih</div>
              <div className="border flex justify-center text-md">Kurban</div>
            </div>
          </div>
          <div className="bg-mantis-500 text-white border">
            <div className="flex border-b-2 justify-center">
              <p className="text-md">Import</p>
            </div>

            <div className="grid grid-cols-3 bg-mantis-500 text-white">
              <div className="border flex justify-center text-md">Jual</div>
              <div className="border flex justify-center text-md">Sembelih</div>
              <div className="border flex justify-center text-md">Kurban</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-0 border">
          <div className="flex justify-center items-center border">
            <div className="flex justify-center py-2 items-center">Kerbau</div>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-0 border">
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.kerbauLocalJual || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        kerbauLocalJual: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.kerbauLocalSembelih || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        kerbauLocalSembelih: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.kerbauLocalQurban || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        kerbauLocalQurban: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-0 border">
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.kerbauImportJual || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        kerbauImportJual: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.kerbauImportSembelih || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        kerbauImportSembelih: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.kerbauImportQurban || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        kerbauImportQurban: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center border">
            <div className="flex justify-center py-2 items-center">Lembu</div>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-0 border">
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.lembuLocalJual || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        lembuLocalJual: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.lembuLocalSembelih || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        lembuLocalSembelih: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.lembuLocalQurban || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        lembuLocalQurban: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-0 border">
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.lembuImportJual || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        lembuImportJual: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.lembuImportSembelih || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        lembuImportSembelih: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.lembuImportQurban || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        lembuImportQurban: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center border">
            <div className="flex justify-center py-2 items-center">
              Biri-Biri
            </div>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-0 border">
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.biriLocalJual || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        biriLocalJual: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.biriLocalSembelih || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        biriLocalSembelih: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.biriLocalQurban || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        biriLocalQurban: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-0 border">
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.biriImportJual || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        biriImportJual: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.biriImportSembelih || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        biriImportSembelih: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.biriImportQurban || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        biriImportQurban: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center border">
            <div className="flex justify-center py-2 items-center">Kambing</div>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-0 border">
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.kambingLocalJual || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        kambingLocalJual: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.kambingLocalSembelih || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        kambingLocalSembelih: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.kambingLocalQurban || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        kambingLocalQurban: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-0 border">
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.kambingImportJual || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        kambingImportJual: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.kambingImportSembelih || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        kambingImportSembelih: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.kambingImportQurban || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        kambingImportQurban: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center border">
            <div className="flex justify-center py-2 items-center">Rusa</div>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-0 border">
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.rusaLocalJual || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        rusaLocalJual: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.rusaLocalSembelih || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        rusaLocalSembelih: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.rusaLocalQurban || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        rusaLocalQurban: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-0 border">
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.rusaImportJual || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        rusaImportJual: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.rusaImportSembelih || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        rusaImportSembelih: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
              <div className="flex justify-center py-2 px-2">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={formData.production.rusaImportQurban || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      production: {
                        ...formData.production,
                        rusaImportQurban: e.floatValue || 0,
                      },
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end items-center mt-4">
          <p className="text-md mx-2">Total</p>
          <NumberFormat
            className="form-control w-1/4"
            thousandSeparator={","}
            decimalSeparator={"."}
            value={formData.total || 0}
            disabled
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
                      "Production Export Excel:Read",
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
          data={allRuminantProductions}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege(["Production:Create"])
              ? (e) => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setModalVisible({
                    production: {
                      kerbauLocalJual: 0,
                      kerbauLocalSembelih: 0,
                      kerbauLocalQurban: 0,
                      kerbauImportJual: 0,
                      kerbauImportSembelih: 0,
                      kerbauImportQurban: 0,

                      lembuLocalJual: 0,
                      lembuLocalSembelih: 0,
                      lembuLocalQurban: 0,
                      lembuImportJual: 0,
                      lembuImportSembelih: 0,
                      lembuImportQurban: 0,

                      biriLocalJual: 0,
                      biriLocalSembelih: 0,
                      biriLocalQurban: 0,
                      biriImportJual: 0,
                      biriImportSembelih: 0,
                      biriImportQurban: 0,

                      rusaLocalJual: 0,
                      rusaLocalSembelih: 0,
                      rusaLocalQurban: 0,
                      rusaImportJual: 0,
                      rusaImportSembelih: 0,
                      rusaImportQurban: 0,

                      kambingLocalJual: 0,
                      kambingLocalSembelih: 0,
                      kambingLocalQurban: 0,
                      kambingImportJual: 0,
                      kambingImportSembelih: 0,
                      kambingImportQurban: 0,
                    },

                    total: 0,
                  });
                  setSelectedCompany({});
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Production:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} ruminant?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteRuminantProduction({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} ruminant deleted`,
                        level: "success",
                      });
                      setSavedCount((savedCount += 1));
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
            !currentUserDontHavePrivilege(["Production:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Production);
