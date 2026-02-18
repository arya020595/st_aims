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
import { MultiYearsFilterWithExport } from "../../components/MultiYearsFilterWithExport";
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
    tokenizedAllFarmerProfile
    countAllFertilizedEggs(monthYear: $monthYear, filters: $filters)
  }
`;

const FERILIZED_EEGS_QUERY = gql`
  query fertilizedEggsQuery(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllFertilizedEggs(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllFertilizedEggs(monthYear: $monthYear, filters: $filters)
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

const CREATE_FERTILIZED_EGG = gql`
  mutation tokenizedCreateFertilizedEgg($tokenized: String!) {
    tokenizedCreateFertilizedEgg(tokenized: $tokenized)
  }
`;

const UPDATE_FERTILIZED_EGG = gql`
  mutation tokenizedUpdateFertilizedEgg($tokenized: String!) {
    tokenizedUpdateFertilizedEgg(tokenized: $tokenized)
  }
`;

const DELETE_FERTILIZED_EGG = gql`
  mutation tokenizedDeleteFertilizedEgg($tokenized: String!) {
    tokenizedDeleteFertilizedEgg(tokenized: $tokenized)
  }
`;

const EXPORT_FERTILIZED_EGGS = gql`
  mutation exportFertilizedEgg(
    $monthYear: String!
    $farmerUUID: String
    $farmAreaId: String
  ) {
    exportFertilizedEgg(
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

const FertilizedEggs = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [exportFormData, setExportFormData] = useState({});
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [registerType, setRegisterType] = useState("");

  let [savedCount, setSavedCount] = useState(0);

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

  let [countFertilizedEgg, setCountFertilizedEgg] = useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countFertilizedEgg) return 1;
    return Math.ceil(countFertilizedEgg / pageSize);
  }, [countFertilizedEgg, pageSize]);

  const [
    allFarmProfilesByFarmerForExport,
    setAllFarmProfilesByFarmerForExport,
  ] = useState([]);
  const [createFertilizedEgg] = useMutation(CREATE_FERTILIZED_EGG);
  const [updateFertilizedEgg] = useMutation(UPDATE_FERTILIZED_EGG);
  const [deleteFertilizedEgg] = useMutation(DELETE_FERTILIZED_EGG);
  const [exportFertilizedEgg] = useMutation(EXPORT_FERTILIZED_EGGS);
  const [allFertilizedEggs, setAllFertilizedEggs] = useState([]);
  const [allFarmerProfiles, setAllFarmerProfiles] = useState([]);
  const [allFarmProfilesByFarmer, setAllFarmProfilesByFarmer] = useState([]);
  const client = useApolloClient();

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedFertilizedEggs = data?.tokenizedAllFertilizedEggs || "";
      // let allFertilizedEggs = [];
      // if (encryptedFertilizedEggs) {
      //   const decrypted = jwt.verify(encryptedFertilizedEggs, TOKENIZE);
      //   allFertilizedEggs = decrypted.queryResult;
      //   setAllFertilizedEggs(allFertilizedEggs);
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
      const countData = data?.countAllFertilizedEggs || 0;
      setCountFertilizedEgg(countData);
    }
  }, [data, loading, error]);

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: FERILIZED_EEGS_QUERY,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedFertilizedEggs =
      result.data?.tokenizedAllFertilizedEggs || "";
    let allFertilizedEggs = [];
    if (encryptedFertilizedEggs) {
      const decrypted = jwt.verify(encryptedFertilizedEggs, TOKENIZE);
      allFertilizedEggs = decrypted.queryResult;
      setAllFertilizedEggs(allFertilizedEggs);
    }

    const countData = result.data?.countAllFertilizedEggs || 0;
    setCountFertilizedEgg(countData);
    hideLoadingSpinner();
  }, [savedCount, yearMonth, pageIndex, pageSize, router.query.filters]);

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: FARM_AREA_QUERY,
      variables: {
        tokenizedParams: tokenizedParams,
        onPage: "FERTILIZED EGGS",
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

  // const encryptedFertilizedEggs = data?.tokenizedAllFertilizedEggs || "";
  // let allFertilizedEggs = [];
  // if (encryptedFertilizedEggs) {
  //   const decrypted = jwt.verify(encryptedFertilizedEggs, TOKENIZE);
  //   allFertilizedEggs = decrypted.queryResult;
  // }

  // const allFarmerProfiles = data?.allFarmerProfiles || [];
  // const allFarmProfilesByFarmer = data?.allFarmProfilesByFarmer || [];
  // let allFarmProfilesByFarmerForExport = allFarmProfilesByFarmer || [];
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

  const year = String(router.query.year || dayjs().format("YYYY"));
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
      Header: "Month & Year",
      accessor: "monthYear",
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
      Header: "Farm Area",
      accessor: "farmProfileArea",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "No. of Broiler Breeder Entry",
      accessor: "noOfBreeder",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Total Amount of Fertilized Eggs by Week",
      accessor: "noOfFertilizedEggs",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Fertilized Eggs</title>
      </Head>
      <FormModal
        title={`Export Fertilized Eggs`}
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
            const response = await exportFertilizedEgg({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            window.open(response.data.exportFertilizedEgg, "__blank");
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
            <label>Company Name </label>
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
        title={`${!formData.uuid ? "Add" : "Edit"} Fertilized Eggs`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({});
          setSelectedCompany({});
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          try {
            let { uuid, __typename } = formData;
            delete formData.FarmerProfile;
            if (!uuid) {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await createFertilizedEgg({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateFertilizedEgg({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Fertilized Egg saved!`,
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
              loadOptions={getFarmer}
              value={formData.FarmerProfile}
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
              options={allFarmerProfiles}
              value={formData.FarmerProfile}
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
        </div>

        <div className="form-group">
          <label>No. of Breeder</label>
          <NumberFormat
            className="form-control"
            value={formData.noOfBreeder || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                noOfBreeder: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>No. of Fertilized Eggs Produced</label>
          <NumberFormat
            className="form-control"
            value={formData.noOfFertilizedEggs || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                noOfFertilizedEggs: e.floatValue,
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
                      "Fertilized Eggs Export Excel:Read",
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
          data={allFertilizedEggs}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege(["Fertilized Eggs:Create"])
              ? (e) => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({});
                  setSelectedCompany({});
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Fertilized Eggs:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} data?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteFertilizedEgg({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
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
            !currentUserDontHavePrivilege(["Fertilized Eggs:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(FertilizedEggs);
