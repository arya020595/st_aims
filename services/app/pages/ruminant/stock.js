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
    countAllRuminantStock(monthYear: $monthYear, filters: $filters)
  }
`;

const RUMINANT_STOCK_QUERY = gql`
  query ruminantStockQuery(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllRuminantStocks(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllRuminantStock(monthYear: $monthYear, filters: $filters)
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
    searchAllFarmerProfiles(name: $name)
  }
`;

const CREATE_RUMINANT_STOCK = gql`
  mutation tokenizedCreateRuminantStock($tokenized: String!) {
    tokenizedCreateRuminantStock(tokenized: $tokenized)
  }
`;

const UPDATE_RUMINANT_STOCK = gql`
  mutation tokenizedUpdateRuminantStock($tokenized: String!) {
    tokenizedUpdateRuminantStock(tokenized: $tokenized)
  }
`;

const DELETE_RUMINANT_STOCK = gql`
  mutation tokenizedDeleteRuminantStock($tokenized: String!) {
    tokenizedDeleteRuminantStock(tokenized: $tokenized)
  }
`;

const EXPORT_TO_EXCEL = gql`
  mutation exportRuminantStockExcel(
    $monthYear: String!
    $farmerUUID: String
    $farmAreaId: String
    $district: String
  ) {
    exportRuminantStockExcel(
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

const Stock = () => {
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const router = useRouter();
  const [exportFormData, setExportFormData] = useState({});
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const notification = useNotification();
  const [formData, setFormData] = useState({
    stock: {
      stockMaleKerbau: 0,
      stockMaleLembu: 0,
      stockMaleRusa: 0,
      stockMaleBiri: 0,
      stockMaleKambing: 0,

      stockFemaleKerbau: 0,
      stockFemaleLembu: 0,
      stockFemaleRusa: 0,
      stockFemaleBiri: 0,
      stockFemaleKambing: 0,
    },
    total: 0,
  });

  let [countRuminantStock, setCountRuminantStock] = useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countRuminantStock) return 1;
    return Math.ceil(countRuminantStock / pageSize);
  }, [countRuminantStock, pageSize]);

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
  const [
    allFarmProfilesByFarmerForExport,
    setAllFarmProfilesByFarmerForExport,
  ] = useState([]);
  const [createRuminantStock] = useMutation(CREATE_RUMINANT_STOCK);
  const [updateRuminantStock] = useMutation(UPDATE_RUMINANT_STOCK);
  const [deleteRuminantStock] = useMutation(DELETE_RUMINANT_STOCK);
  const [exportRuminantStockExcel] = useMutation(EXPORT_TO_EXCEL);
  const [allRuminantStocks, setAllRuminantStocks] = useState([]);
  const [allFarmerProfiles, setAllFarmerProfiles] = useState([]);
  const [allFarmProfilesByFarmer, setAllFarmProfilesByFarmer] = useState([]);
  const [allDistrict, setAllDistrict] = useState([]);
  const [registerType, setRegisterType] = useState("");

  const client = useApolloClient();
  let [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedRuminantStocks = data?.tokenizedAllRuminantStocks || "";
      // let allRuminantStocks = [];
      // if (encryptedRuminantStocks) {
      //   const decrypted = jwt.verify(encryptedRuminantStocks, TOKENIZE);
      //   allRuminantStocks = decrypted.queryResult;
      //   setAllRuminantStocks(allRuminantStocks);
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
      const countData = data?.countAllRuminantStock || 0;
      setCountRuminantStock(countData);
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

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: RUMINANT_STOCK_QUERY,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedRuminantStocks =
      result.data?.tokenizedAllRuminantStocks || "";
    let allRuminantStocks = [];
    if (encryptedRuminantStocks) {
      const decrypted = jwt.verify(encryptedRuminantStocks, TOKENIZE);
      allRuminantStocks = decrypted.queryResult;
      setAllRuminantStocks(allRuminantStocks);
    }
    const countData = result.data?.countAllRuminantStock || 0;
    setCountRuminantStock(countData);
    hideLoadingSpinner();
  }, [savedCount, yearMonth, pageSize, pageIndex, router.query.filters]);

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: FARM_AREA_QUERY,
      variables: {
        tokenizedParams: tokenizedParams,
        onPage: "RUMINANT STOCK",
      },
      fetchPolicy: "no-cache",
    });

    const encryptedFarmProfilesByFarmer =
      result.data?.tokenizedAllFarmProfilesByFarmer || "";
    let allFarmProfiles = [];
    if (encryptedFarmProfilesByFarmer) {
      const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
      allFarmProfiles = decrypted.queryResult;
      allFarmProfiles = lodash.uniqBy(allFarmProfiles, "farmArea");
      setAllFarmProfilesByFarmer(allFarmProfiles);
      setAllFarmProfilesByFarmerForExport(allFarmProfiles);
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

  // const encryptedRuminantStocks = data?.tokenizedAllRuminantStocks || "";
  // let allRuminantStocks = [];
  // if (encryptedRuminantStocks) {
  //   const decrypted = jwt.verify(encryptedRuminantStocks, TOKENIZE);
  //   allRuminantStocks = decrypted.queryResult;
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
  }, [formData.stock]);

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
                  stock: {
                    stockMaleKerbau: propsTable.row.original.stockMaleKerbau,
                    stockMaleLembu: propsTable.row.original.stockMaleLembu,
                    stockMaleRusa: propsTable.row.original.stockMaleRusa,
                    stockMaleBiri: propsTable.row.original.stockMaleBiri,
                    stockMaleKambing: propsTable.row.original.stockMaleKambing,

                    stockFemaleKerbau:
                      propsTable.row.original.stockFemaleKerbau,
                    stockFemaleLembu: propsTable.row.original.stockFemaleLembu,
                    stockFemaleRusa: propsTable.row.original.stockFemaleRusa,
                    stockFemaleBiri: propsTable.row.original.stockFemaleBiri,
                    stockFemaleKambing:
                      propsTable.row.original.stockFemaleKambing,
                  },
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
    for (const key of Object.keys(formData.stock)) {
      total += formData.stock[key];
    }
    setFormData({
      ...formData,
      total,
    });
  };

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Ruminant Stock</title>
      </Head>

      <FormModal
        title={`Export Ruminant Stock`}
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
            const response = await exportRuminantStockExcel({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });
            // Convert base64 to blob
            const base64Response = response.data.exportRuminantStockExcel;
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
            link.download = "ruminant_stock.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);

            // window.location.href = response.data.exportRuminantStockExcel;
            // window.open(response.data.exportRuminantStockExcel, "__blank");
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
        title={`${!formData.uuid ? "New" : "Edit"} Ruminant Stock`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            stock: {
              stockMaleKerbau: 0,
              stockMaleLembu: 0,
              stockMaleRusa: 0,
              stockMaleBiri: 0,
              stockMaleKambing: 0,

              stockFemaleKerbau: 0,
              stockFemaleLembu: 0,
              stockFemaleRusa: 0,
              stockFemaleBiri: 0,
              stockFemaleKambing: 0,
            },
            total: 0,
          });
          setSelectedCompany({});
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          try {
            let { uuid, stock, total, ...f } = formData;
            if (!uuid) {
              const tokenizedPayload = {
                ...stock,
                total,
                ...f,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await createRuminantStock({
                variables: {
                  // ...stock,
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

                ...stock,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await updateRuminantStock({
                variables: {
                  // uuid,
                  // total,
                  // date: f.date,
                  // farmerCompanyName: f.farmerCompanyName,
                  // farmerUUID: f.farmerUUID,
                  // farmAreaId: f.farmAreaId,
                  // farmProfileArea: f.farmProfileArea,
                  // district: f.district,

                  // ...stock,
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `RuminantStock saved!`,
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
            className="form-control"
            type="month"
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
        <label>Stock: </label>
        <div className="grid grid-cols-3 gap-0 font-bold">
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            Ternakan
          </div>
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            Male
          </div>
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            Female
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 border">
          <div className="flex justify-center py-2 items-center">Kerbau</div>
          <div className="flex justify-center py-2">
            <NumberFormat
              className="form-control"
              thousandSeparator={","}
              decimalSeparator={"."}
              value={formData.stock.stockMaleKerbau || 0}
              onValueChange={(e) => {
                setFormData({
                  ...formData,
                  stock: {
                    ...formData.stock,
                    stockMaleKerbau: e.floatValue || 0,
                  },
                });
              }}
            />
          </div>
          <div className="flex justify-center py-2">
            <NumberFormat
              className="form-control"
              thousandSeparator={","}
              decimalSeparator={"."}
              value={formData.stock.stockFemaleKerbau || 0}
              onValueChange={(e) => {
                setFormData({
                  ...formData,
                  stock: {
                    ...formData.stock,
                    stockFemaleKerbau: e.floatValue || 0,
                  },
                });
              }}
            />
          </div>
          <div className="flex justify-center py-2 items-center">Lembu</div>
          <div className="flex justify-center py-2">
            <NumberFormat
              className="form-control"
              thousandSeparator={","}
              decimalSeparator={"."}
              value={formData.stock.stockMaleLembu || 0}
              onValueChange={(e) => {
                setFormData({
                  ...formData,
                  stock: {
                    ...formData.stock,
                    stockMaleLembu: e.floatValue || 0,
                  },
                });
              }}
            />
          </div>
          <div className="flex justify-center py-2">
            <NumberFormat
              className="form-control"
              thousandSeparator={","}
              decimalSeparator={"."}
              value={formData.stock.stockFemaleLembu || 0}
              onValueChange={(e) => {
                setFormData({
                  ...formData,
                  stock: {
                    ...formData.stock,
                    stockFemaleLembu: e.floatValue || 0,
                  },
                });
              }}
            />
          </div>
          <div className="flex justify-center py-2 items-center">Biri-biri</div>
          <div className="flex justify-center py-2">
            <NumberFormat
              className="form-control"
              thousandSeparator={","}
              decimalSeparator={"."}
              value={formData.stock.stockMaleBiri || 0}
              onValueChange={(e) => {
                setFormData({
                  ...formData,
                  stock: {
                    ...formData.stock,
                    stockMaleBiri: e.floatValue || 0,
                  },
                });
              }}
            />
          </div>
          <div className="flex justify-center py-2">
            <NumberFormat
              className="form-control"
              thousandSeparator={","}
              decimalSeparator={"."}
              value={formData.stock.stockFemaleBiri || 0}
              onValueChange={(e) => {
                setFormData({
                  ...formData,
                  stock: {
                    ...formData.stock,
                    stockFemaleBiri: e.floatValue || 0,
                  },
                });
              }}
            />
          </div>
          <div className="flex justify-center py-2 items-center">Kambing</div>
          <div className="flex justify-center py-2">
            <NumberFormat
              className="form-control"
              thousandSeparator={","}
              decimalSeparator={"."}
              value={formData.stock.stockMaleKambing || 0}
              onValueChange={(e) => {
                setFormData({
                  ...formData,
                  stock: {
                    ...formData.stock,
                    stockMaleKambing: e.floatValue || 0,
                  },
                });
              }}
            />
          </div>
          <div className="flex justify-center py-2">
            <NumberFormat
              className="form-control"
              thousandSeparator={","}
              decimalSeparator={"."}
              value={formData.stock.stockFemaleKambing || 0}
              onValueChange={(e) => {
                setFormData({
                  ...formData,
                  stock: {
                    ...formData.stock,
                    stockFemaleKambing: e.floatValue || 0,
                  },
                });
              }}
            />
          </div>
          <div className="flex justify-center py-2 items-center">Rusa</div>
          <div className="flex justify-center py-2">
            <NumberFormat
              className="form-control"
              thousandSeparator={","}
              decimalSeparator={"."}
              value={formData.stock.stockMaleRusa || 0}
              onValueChange={(e) => {
                setFormData({
                  ...formData,
                  stock: {
                    ...formData.stock,
                    stockMaleRusa: e.floatValue || 0,
                  },
                });
              }}
            />
          </div>
          <div className="flex justify-center py-2">
            <NumberFormat
              className="form-control"
              thousandSeparator={","}
              decimalSeparator={"."}
              value={formData.stock.stockFemaleRusa || 0}
              onValueChange={(e) => {
                setFormData({
                  ...formData,
                  stock: {
                    ...formData.stock,
                    stockFemaleRusa: e.floatValue || 0,
                  },
                });
              }}
            />
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
                    !currentUserDontHavePrivilege(["Stock Export Excel:Read"])
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
          data={allRuminantStocks}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege(["Stock:Create"])
              ? (e) => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({
                    stock: {
                      stockMaleKerbau: 0,
                      stockMaleLembu: 0,
                      stockMaleRusa: 0,
                      stockMaleBiri: 0,
                      stockMaleKambing: 0,

                      stockFemaleKerbau: 0,
                      stockFemaleLembu: 0,
                      stockFemaleRusa: 0,
                      stockFemaleBiri: 0,
                      stockFemaleKambing: 0,
                    },
                    total: 0,
                  });
                  setSelectedCompany({});
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Stock:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} stock?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteRuminantStock({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} stock deleted`,
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
            !currentUserDontHavePrivilege(["Stock:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Stock);
