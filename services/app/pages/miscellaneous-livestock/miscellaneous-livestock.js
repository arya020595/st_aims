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
    countMiscellaneousLivestocks(monthYear: $monthYear, filters: $filters)
  }
`;

const MISCELLANEOUS_QUERY = gql`
  query miscellaneousQuery(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllMiscellaneousLivestocks(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countMiscellaneousLivestocks(monthYear: $monthYear, filters: $filters)
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

const CREATE_MISCELLANEOUS_LIVESTOCK = gql`
  mutation tokenizedCreateMiscellaneousLivestock($tokenized: String!) {
    tokenizedCreateMiscellaneousLivestock(tokenized: $tokenized)
  }
`;

const UPDATE_MISCELLANEOUS_LIVESTOCK = gql`
  mutation tokenizedUpdateMiscellaneousLivestock($tokenized: String!) {
    tokenizedUpdateMiscellaneousLivestock(tokenized: $tokenized)
  }
`;

const DELETE_MISCELLANEOUS_LIVESTOCK = gql`
  mutation tokenizedDeleteMiscellaneousLivestock($tokenized: String!) {
    tokenizedDeleteMiscellaneousLivestock(tokenized: $tokenized)
  }
`;

const EXPORT_TO_EXCEL = gql`
  mutation exportMiscellaneousLivestock(
    $monthYear: String!
    $farmerUUID: String
    $farmAreaId: String
    $district: String
    $mukim: String
  ) {
    exportMiscellaneousLivestock(
      monthYear: $monthYear
      farmerUUID: $farmerUUID
      farmAreaId: $farmAreaId
      district: $district
      mukim: $mukim
    )
  }
`;

const IS_CHECK_FARMER = gql`
  query isFarmerCheck {
    isFarmerCheck
  }
`;

const Miscellaneous = () => {
  const router = useRouter();
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [exportFormData, setExportFormData] = useState({});
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [registerType, setRegisterType] = useState("");

  const notification = useNotification();
  const [formData, setFormData] = useState({
    totalAyamKampungBirds: 0,
    totalAyamKampungEggs: 0,
    totalItikBirds: 0,
    totalItikEggs: 0,
    totalPuyuhBirds: 0,
    totalPuyuhEggs: 0,
    totalPatuBirds: 0,
    totalPatuEggs: 0,
    totalAngsaBirds: 0,
    totalAngsaEggs: 0,
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
  let [savedCount, setSavedCount] = useState(0);

  let [countMiscellaneousLivestock, setCountMiscellaneousLivestock] =
    useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countMiscellaneousLivestock) return 1;
    return Math.ceil(countMiscellaneousLivestock / pageSize);
  }, [countMiscellaneousLivestock, pageSize]);

  const [createMiscellaneousLivestock] = useMutation(
    CREATE_MISCELLANEOUS_LIVESTOCK
  );
  const [updateMiscellaneousLivestock] = useMutation(
    UPDATE_MISCELLANEOUS_LIVESTOCK
  );
  const [deleteMiscellaneousLivestock] = useMutation(
    DELETE_MISCELLANEOUS_LIVESTOCK
  );
  const [exportMiscellaneousLivestock] = useMutation(EXPORT_TO_EXCEL);
  const [
    allFarmProfilesByFarmerForExport,
    setAllFarmProfilesByFarmerForExport,
  ] = useState([]);
  const [allMiscellaneousLivestocks, setAllMiscellaneousLivestocks] = useState(
    []
  );
  const [allFarmerProfiles, setAllFarmerProfiles] = useState([]);
  const [allFarmProfilesByFarmer, setAllFarmProfilesByFarmer] = useState([]);
  const [allFarmLocations, setAllFarmLocations] = useState([]);
  const client = useApolloClient();

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedMiscellaneousLivestocks = data?.tokenizedAllMiscellaneousLivestocks || "";
      // let allMiscellaneousLivestocks = [];
      // if (encryptedMiscellaneousLivestocks) {
      //   const decrypted = jwt.verify(encryptedMiscellaneousLivestocks, TOKENIZE);
      //   allMiscellaneousLivestocks = decrypted.queryResult;
      //   setAllMiscellaneousLivestocks(allMiscellaneousLivestocks);
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

      const encryptedFarmLocations = data?.tokenizedAllFarmLocation || "";
      let allFarmLocations = [];
      if (encryptedFarmLocations) {
        const decrypted = jwt.verify(encryptedFarmLocations, TOKENIZE);
        allFarmLocations = decrypted.queryResult;
        setAllFarmLocations(allFarmLocations);
      }
      const countData = data?.countMiscellaneousLivestocks || 0;
      setCountMiscellaneousLivestock(countData);
    }
  }, [data, loading, error, savedCount]);

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

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: MISCELLANEOUS_QUERY,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedMiscellaneousLivestocks =
      result.data?.tokenizedAllMiscellaneousLivestocks || "";
    let allMiscellaneousLivestocks = [];
    if (encryptedMiscellaneousLivestocks) {
      const decrypted = jwt.verify(encryptedMiscellaneousLivestocks, TOKENIZE);
      allMiscellaneousLivestocks = decrypted.queryResult;
      setAllMiscellaneousLivestocks(allMiscellaneousLivestocks);
    }
    const countData = result.data?.countMiscellaneousLivestocks || 0;
    setCountMiscellaneousLivestock(countData);
    hideLoadingSpinner();
  }, [savedCount, yearMonth, pageIndex, pageSize]);

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: FARM_AREA_QUERY,
      variables: {
        tokenizedParams: tokenizedParams,
        onPage: "MISCELLANEOUS LIVESTOCK",
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

  const getFarmer = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fethchingFarmer(input, callback);
    }
  };

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

  const [selectedMukim, setSelectedMukim] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  // const encryptedMiscellaneousLivestocks =
  //   data?.tokenizedAllMiscellaneousLivestocks || "";
  // let allMiscellaneousLivestocks = [];
  // if (encryptedMiscellaneousLivestocks) {
  //   const decrypted = jwt.verify(encryptedMiscellaneousLivestocks, TOKENIZE);
  //   allMiscellaneousLivestocks = decrypted.queryResult;
  // }

  // const allFarmerProfiles = data?.allFarmerProfiles || [];
  // const allFarmProfilesByFarmer = data?.allFarmProfilesByFarmer || [];
  // const allFarmLocations = data?.allFarmLocations || [];
  const year = String(router.query.year || dayjs().format("YYYY"));

  // let allFarmProfilesByFarmerForExport = allFarmProfilesByFarmer || [];

  // allFarmProfilesByFarmerForExport = lodash.uniqBy(
  //   allFarmProfilesByFarmerForExport,
  //   (farm) => farm.farmArea
  // );

  let allDistricts = allFarmLocations || [];
  allDistricts = lodash.uniqBy(allDistricts, (loc) => loc.district);

  let allMukims = allFarmLocations || [];
  allMukims = lodash.uniqBy(allMukims, (loc) => loc.mukim);

  useEffect(() => {
    const total =
      formData.totalAyamKampungBirds +
      formData.totalAyamKampungEggs +
      formData.totalItikBirds +
      formData.totalItikEggs +
      formData.totalPuyuhBirds +
      formData.totalPuyuhEggs +
      formData.totalPatuBirds +
      formData.totalPatuEggs +
      formData.totalAngsaBirds +
      formData.totalAngsaEggs;

    setFormData({
      ...formData,
      total,
    });
  }, [
    formData.totalAyamKampungBirds,
    formData.totalAyamKampungEggs,
    formData.totalItikBirds,
    formData.totalItikEggs,
    formData.totalPuyuhBirds,
    formData.totalPuyuhEggs,
    formData.totalPatuBirds,
    formData.totalPatuEggs,
    formData.totalAngsaBirds,
    formData.totalAngsaEggs,
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
                      propsTable.row.original.farmerCompanyName,
                    uuid: propsTable.row.original.farmerUUID,
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
      Header: "Month & Year",
      accessor: "monthYear",
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
        width: 150,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Mukim",
      accessor: "mukim",
      style: {
        fontSize: 20,
        width: 150,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Miscellaneous Livestock</title>
      </Head>

      <FormModal
        size={"lg"}
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
            const response = await exportMiscellaneousLivestock({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            // Convert base64 to blob
            const base64Response = response.data.exportMiscellaneousLivestock;
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
            link.download = "miscellaneous_livestock.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);


            // // window.location.href = response.data.exportMiscellaneousLivestock;
            // window.open(response.data.exportMiscellaneousLivestock, "__blank");
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

          <div className="form-group">
            <label>Mukim</label>
            <Select
              isClearable={true}
              value={selectedMukim}
              options={allMukims.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.district.toUpperCase(),
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                const found = allMukims.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  mukim: (found?.mukim || "").toUpperCase(),
                });

                setSelectedMukim([
                  {
                    value: found?.uuid || "",
                    label: (found?.mukim || "").toUpperCase(),
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
        title={`${!formData.uuid ? "Add" : "Edit"} Miscellaneous Livestock`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            totalAyamKampungBirds: 0,
            totalAyamKampungEggs: 0,
            totalItikBirds: 0,
            totalItikEggs: 0,
            totalPuyuhBirds: 0,
            totalPuyuhEggs: 0,
            totalPatuBirds: 0,
            totalPatuEggs: 0,
            totalAngsaBirds: 0,
            totalAngsaEggs: 0,
          });
          setSelectedCompany({});
        }}
        onCustomCloseBackDrop={true}
        size="lg"
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          try {
            const { uuid, __typename } = formData;
            if (!uuid) {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await createMiscellaneousLivestock({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
            } else {
              const tokenizedPayload = {
                uuid,
                ...formData,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await updateMiscellaneousLivestock({
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
              message: `Miscellaneous Livestock saved!`,
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
            value={formData.monthYear || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
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
                district: found.farmDistrict.toUpperCase(),
                mukim: found.farmMukim.toUpperCase(),
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
            disabled
            className="form-control"
            placeholder="Auto Filled"
            value={(formData.district || "").toUpperCase()}
            // onChange={(e) => {
            //   if (e) e.preventDefault();

            //   const found = allFarmLocations.find(
            //     (c) => c.district === e.target.value
            //   );
            //   setFormData({
            //     ...formData,
            //     district: found.district,
            //   });
            // }}
            required
          >
            {/* <option value={""} disabled>
              Select District
            </option> */}

            {/* {allFarmLocations.map((farm) => (
              <option value={farm.district}>{farm.district}</option>
            ))} */}
          </input>
        </div>
        <div className="form-group">
          <label>Mukim</label>
          <input
            disabled
            className="form-control"
            placeholder="Auto Filled"
            value={(formData.mukim || "").toUpperCase()}
            // onChange={(e) => {
            //   if (e) e.preventDefault();

            //   const found = allFarmLocations.find(
            //     (c) => c.mukim === e.target.value
            //   );
            //   setFormData({
            //     ...formData,
            //     mukim: found.mukim,
            //   });
            // }}
            required
          >
            {/* <option value={""} disabled>
              Select Mukim
            </option>

            {allFarmLocations.map((farm) => (
              <option value={farm.mukim}>{farm.mukim}</option>
            ))} */}
          </input>
        </div>

        <div className="grid grid-cols-3 gap-y-2 mb-2 border border-1">
          <div>
            <div className="py-2 text-center text-white font-bold bg-mantis-500 text-sm">
              Type of Miscellaneous Livestock
            </div>
          </div>
          <div>
            <div className="py-2 text-center text-white font-bold bg-mantis-500 text-sm">
              Type (Birds)
            </div>
          </div>
          <div>
            <div className="py-2 text-center text-white font-bold bg-mantis-500 text-sm">
              Type (Eggs)
            </div>
          </div>
          <div className="flex items-center justify-center border border-2 border-r-0 border-t-0">
            Ayam Kampung
          </div>
          <div className="px-2 border border-2 border-r-0 border-l-0 border-t-0">
            <NumberFormat
              className="form-control text-center"
              value={formData.totalAyamKampungBirds || 0}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  totalAyamKampungBirds: e.floatValue || 0,
                });
              }}
            />
          </div>
          <div className="px-2 border border-2 border-r-0 border-l-0 border-t-0">
            <NumberFormat
              className="form-control text-center"
              value={formData.totalAyamKampungEggs || 0}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  totalAyamKampungEggs: e.floatValue || 0,
                });
              }}
            />
          </div>
          <div className="flex items-center justify-center border border-2 border-r-0 border-t-0">
            Itik
          </div>
          <div className="px-2 border border-2 border-r-0 border-l-0 border-t-0">
            <NumberFormat
              className="form-control text-center"
              value={formData.totalItikBirds || 0}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  totalItikBirds: e.floatValue || 0,
                });
              }}
            />
          </div>
          <div className="px-2 border border-2 border-r-0 border-l-0 border-t-0">
            <NumberFormat
              className="form-control text-center"
              value={formData.totalItikEggs || 0}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  totalItikEggs: e.floatValue || 0,
                });
              }}
            />
          </div>
          <div className="flex items-center justify-center border border-2 border-r-0 border-t-0">
            Puyuh
          </div>
          <div className="px-2 border border-2 border-r-0 border-l-0 border-t-0">
            <NumberFormat
              className="form-control text-center"
              value={formData.totalPuyuhBirds || 0}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  totalPuyuhBirds: e.floatValue || 0,
                });
              }}
            />
          </div>
          <div className="px-2 border border-2 border-r-0 border-l-0 border-t-0">
            <NumberFormat
              className="form-control text-center"
              value={formData.totalPuyuhEggs || 0}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  totalPuyuhEggs: e.floatValue || 0,
                });
              }}
            />
          </div>
          <div className="flex items-center justify-center border border-2 border-r-0 border-t-0">
            Patu
          </div>
          <div className="px-2 border border-2 border-r-0 border-l-0 border-t-0">
            <NumberFormat
              className="form-control text-center"
              value={formData.totalPatuBirds || 0}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  totalPatuBirds: e.floatValue || 0,
                });
              }}
            />
          </div>
          <div className="px-2 border border-2 border-r-0 border-l-0 border-t-0">
            <NumberFormat
              className="form-control text-center"
              value={formData.totalPatuEggs || 0}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  totalPatuEggs: e.floatValue || 0,
                });
              }}
            />
          </div>
          <div className="flex items-center justify-center border border-2 border-r-0 border-t-0">
            Angsa
          </div>
          <div className="px-2 border border-2 border-r-0 border-l-0 border-t-0">
            <NumberFormat
              className="form-control text-center"
              value={formData.totalAngsaBirds || 0}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  totalAngsaBirds: e.floatValue || 0,
                });
              }}
            />
          </div>
          <div className="px-2 border border-2 border-r-0 border-l-0 border-t-0">
            <NumberFormat
              className="form-control text-center"
              value={formData.totalAngsaEggs || 0}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  totalAngsaEggs: e.floatValue || 0,
                });
              }}
            />
          </div>
        </div>

        <div className="flex justify-end items-center mt-4">
          <p className="text-md mx-2">Total Entry</p>

          <NumberFormat
            className="form-control text-center w-1/4"
            value={formData.total || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
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
                defaultValue={dayjs().format("YYYY-MM")}
                controlledValue={yearMonth}
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
                      "Miscellaneous Livestock Export Excel:Read",
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
          data={allMiscellaneousLivestocks}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege(["Miscellaneous Livestock:Create"])
              ? (e) => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({
                    totalAyamKampungBirds: 0,
                    totalAyamKampungEggs: 0,
                    totalItikBirds: 0,
                    totalItikEggs: 0,
                    totalPuyuhBirds: 0,
                    totalPuyuhEggs: 0,
                    totalPatuBirds: 0,
                    totalPatuEggs: 0,
                    totalAngsaBirds: 0,
                    totalAngsaEggs: 0,
                  });
                  setSelectedCompany({});
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Miscellaneous Livestock:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} productions?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteMiscellaneousLivestock({
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
                  } catch (err) {
                    handleError(err);
                  }
                  hideLoadingSpinner();
                }
              : null
          }
          customUtilities={
            !currentUserDontHavePrivilege(["Miscellaneous Livestock:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Miscellaneous);
