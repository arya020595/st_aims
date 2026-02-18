import React, { useState, useEffect, useMemo, useCallback } from "react";
import { withApollo } from "../../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../../components/App";
import { useNotification } from "../../components/Notification";
import { handleError } from "../../libs/errors";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import TableAsync from "../../components/TableAsync";
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
import { create, filter } from "lodash";
import { from } from "apollo-link";
import { configure } from "nprogress";
import Head from "next/dist/next-server/lib/head";
import { Leaf } from "slate";
import { v4 as uuidv4 } from "uuid";
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

const QUERIES = gql`
  query listQueries($monthYear: String!, $filters: String) {
    countAllFruitProductionActual(monthYear: $monthYear, filters: $filters)
  }
`;

const PRODUCTION_QUERY = gql`
  query productionQuery(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllFruitProductionActuals(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllFruitProductionActual(monthYear: $monthYear, filters: $filters)
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

const SEARCH_FARMER_QUERY = gql`
  query searchQuery($name: String) {
    searchFarmerProfileByCompanyRegNo(name: $name)
  }
`;

const SEARCH_FRUIT_QUERY = gql`
  query searchAllCropsFruits($name: String) {
    searchAllCropsFruits(name: $name)
  }
`;

const CREATE_FRUIT_PRODUCTION_ACTUAL = gql`
  mutation tokenizedCreateFruitProductionActual($tokenized: String!) {
    tokenizedCreateFruitProductionActual(tokenized: $tokenized)
  }
`;

const UPDATE_FRUIT_PRODUCTION_ACTUAL = gql`
  mutation tokenizedUpdateFruitProductionActual($tokenized: String!) {
    tokenizedUpdateFruitProductionActual(tokenized: $tokenized)
  }
`;

const DELETE_FRUIT_PRODUCTION_ACTUAL = gql`
  mutation tokenizedDeleteFruitProductionActual($tokenized: String!) {
    tokenizedDeleteFruitProductionActual(tokenized: $tokenized)
  }
`;

const EXPORT_FRUIT_PRODUCTION_ACTUAL = gql`
  mutation exportFruitProductionActual(
    $monthYear: String!
    $farmerUUID: String
    $farmAreaId: String
    $fruitUUID: String
    $farmerName: String
  ) {
    exportFruitProductionActual(
      monthYear: $monthYear
      farmerUUID: $farmerUUID
      farmAreaId: $farmAreaId
      fruitUUID: $fruitUUID
      farmerName: $farmerName
    )
  }
`;

const page = () => {
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({
    records: [],
    addresses: [],
  });
  const client = useApolloClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportFormData, setExportFormData] = useState({});
  const notification = useNotification();
  const [updateFormData, setUpdateFormData] = useState({
    addresses: [],
  });
  const [updateFormDataVisible, setUpdateFormDataVisible] = useState(false);
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );

  let [countActual, setCountActual] = useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countActual) return 1;
    return Math.ceil(countActual / pageSize);
  }, [countActual, pageSize]);

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
  const [exportFruitProductionActual] = useMutation(
    EXPORT_FRUIT_PRODUCTION_ACTUAL
  );
  const [createFruitProductionActual] = useMutation(
    CREATE_FRUIT_PRODUCTION_ACTUAL
  );
  const [updateFruitProductionActual] = useMutation(
    UPDATE_FRUIT_PRODUCTION_ACTUAL
  );
  const [deleteFruitProductionActual] = useMutation(
    DELETE_FRUIT_PRODUCTION_ACTUAL
  );
  let [savedCount, setSavedCount] = useState(0);
  const [
    allFarmProfilesByFarmerForExport,
    setAllFarmProfilesByFarmerForExport,
  ] = useState([]);

  const [allFarmerProfilesByCompanyRegNo, setAllFarmerProfilesByCompanyRegNo] =
    useState([]);
  const [allFruitProductionActuals, setAllFruitProductionActuals] = useState(
    []
  );
  const [allFarmProfilesByFarmer, setAllFarmProfilesByFarmer] = useState([]);
  const [allCropsFruits, setAllCropsFruits] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedFarmerProfilesByCompanyRegNo = data?.tokenizedAllFarmerProfilesByCompanyRegNo || "";
      // let allFarmerProfilesByCompanyRegNo = [];
      // if (encryptedFarmerProfilesByCompanyRegNo) {
      //   const decrypted = jwt.verify(encryptedFarmerProfilesByCompanyRegNo, TOKENIZE);
      //   allFarmerProfilesByCompanyRegNo = decrypted.queryResult;
      //   setAllFarmerProfilesByCompanyRegNo(allFarmerProfilesByCompanyRegNo);
      // }

      // const encryptedFruitProductionActuals =
      //   data?.tokenizedAllFruitProductionActuals || "";
      // let allFruitProductionActuals = [];
      // if (encryptedFruitProductionActuals) {
      //   const decrypted = jwt.verify(encryptedFruitProductionActuals, TOKENIZE);
      //   allFruitProductionActuals = decrypted.queryResult;
      //   setAllFruitProductionActuals(allFruitProductionActuals);
      // }

      // const encryptedFarmProfilesByFarmer =
      //   data?.tokenizedAllFarmProfilesByFarmer || "";
      // let allFarmProfilesByFarmer = [];
      // if (encryptedFarmProfilesByFarmer) {
      //   const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
      //   allFarmProfilesByFarmer = decrypted.queryResult;
      //   setAllFarmProfilesByFarmer(allFarmProfilesByFarmer);
      // }

      // const encryptedCropsFruits = data?.tokenizedAllCropsFruits || "";
      // let allCropsFruits = [];
      // if (encryptedCropsFruits) {
      //   const decrypted = jwt.verify(encryptedCropsFruits, TOKENIZE);
      //   allCropsFruits = decrypted.queryResult;
      //   setAllCropsFruits(allCropsFruits);
      // }
      const countData = data?.countAllFruitProductionActual || 0;
      setCountActual(countData);
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
      query: PRODUCTION_QUERY,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedFruitProductionActuals =
      result.data?.tokenizedAllFruitProductionActuals || "";
    // const countData = result.data?.countAllFruitProductionActual || 0;
    // setCountActual(countData);
    let allFruitProductionActuals = [];
    if (encryptedFruitProductionActuals) {
      const decrypted = jwt.verify(encryptedFruitProductionActuals, TOKENIZE);
      allFruitProductionActuals = decrypted.queryResult;
      setAllFruitProductionActuals(allFruitProductionActuals);
    }

    const countData = result.data?.countAllFruitProductionActual || 0;
    setCountActual(countData);
    hideLoadingSpinner();
  }, [savedCount, yearMonth, pageSize, pageIndex, router.query.filters]);

  useEffect(async () => {
    const result = await client.query({
      query: FARM_AREA_QUERY,
      variables: {
        tokenizedParams,
        onPage: "FRUIT ACTUAL PRODUCTION",
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

  useEffect(() => {
    const intervalId = setInterval(() => {
      countFarmValue();
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [formData, formData.records]);

  const countFarmValue = () => {
    setFormData({
      ...formData,
      records: formData.records.map((rec) => {
        let production = "" + rec.production;
        let farmPrice = "" + rec.farmPrice;

        if (production) {
          production = parseFloat(production.replace(/,/g, ""));
        } else {
          production = 0;
        }
        if (farmPrice) {
          farmPrice = parseFloat(farmPrice.replace(/,/g, ""));
        } else {
          farmPrice = 0;
        }
        return {
          ...rec,
          totalFarmValue: production * farmPrice,
        };
      }),
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

  const fethchingFruit = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_FRUIT_QUERY,
      variables: {
        name: input,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedCropsFruits = result.data?.searchAllCropsFruits || "";
    let allCropsFruits = [];
    if (encryptedCropsFruits) {
      const decrypted = jwt.verify(encryptedCropsFruits, TOKENIZE);
      allCropsFruits = decrypted.queryResult;
      setAllCropsFruits(allCropsFruits);
    }
    callback(allCropsFruits);
  };

  const getFruit = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fethchingFruit(input, callback);
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

  // const encryptedFruitProductionActuals =
  //   data?.tokenizedAllFruitProductionActuals || "";
  // let allFruitProductionActuals = [];
  // if (encryptedFruitProductionActuals) {
  //   const decrypted = jwt.verify(encryptedFruitProductionActuals, TOKENIZE);
  //   allFruitProductionActuals = decrypted.queryResult;
  // }

  // const encryptedFarmProfilesByFarmer =
  //   data?.tokenizedAllFarmProfilesByFarmer || "";
  // let allFarmProfilesByFarmer = [];
  // if (encryptedFarmProfilesByFarmer) {
  //   const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
  //   allFarmProfilesByFarmer = decrypted.queryResult;
  // }

  // const encryptedCropsFruits = data?.tokenizedAllCropsFruits || "";
  // let allCropsFruits = [];
  // if (encryptedCropsFruits) {
  //   const decrypted = jwt.verify(encryptedCropsFruits, TOKENIZE);
  //   allCropsFruits = decrypted.queryResult;
  // }

  // const encryptedFarmProfilesByFarmerForExport =
  //   data?.tokenizedAllFarmProfilesByFarmer || "";
  // let allFarmProfilesByFarmerForExport = [];
  // if (encryptedFarmProfilesByFarmerForExport) {
  //   const decrypted = jwt.verify(
  //     encryptedFarmProfilesByFarmerForExport,
  //     TOKENIZE
  //   );
  //   allFarmProfilesByFarmerForExport = decrypted.queryResult;
  // }

  // let allFarmProfilesByFarmerForExport = allFarmProfilesByFarmer;

  // allFarmProfilesByFarmerForExport = lodash.uniqBy(
  //   allFarmProfilesByFarmerForExport,
  //   (farm) => farm.farmArea
  // );

  const [selectedFruit, setSelectedFruit] = useState({});

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

  const [selectedExportFarmerName, setSelectedExportFarmeName] = useState([
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
                showLoadingSpinner();
                const result = await client.query({
                  query: GET_FARM_AREA_BY_COMPANYID_AND_FARM_AREA,
                  variables: {
                    farmerUUID: props.row.original?.FarmerProfile?.uuid,
                    farmArea: props.row.original?.FarmProfile?.farmArea,
                  },
                  fetchPolicy: "no-cache",
                });

                setUpdateFormDataVisible(true);
                setUpdateFormData({
                  ...props.row.original,
                  Fruit: props.row.original.Fruit || {},
                  fruitUUID: props.row.original?.Fruit?.uuid || "",
                  farmAreaId: props.row.original?.FarmProfile?.uuid || "",
                  farmerUUID: props.row.original?.FarmerProfile?.uuid || "",
                  farmerName: props.row.original?.FarmProfile?.farmerName || "",
                  farmAddress: props.row.original?.FarmProfile?.address || "",

                  englishName: props.row.original?.Fruit?.englishName || "",
                  localName: props.row.original?.Fruit?.localName || "",
                  fruitId: props.row.original?.Fruit?.fruitId || "",
                  addresses:
                    result.data?.getFarmAddressByCompanyUUIDAndFarmArea || [],
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

                setSelectedFruit([
                  {
                    value: props.row.original?.Fruit?.uuid || "",
                    label:
                      props.row.original?.Fruit?.localName?.toUpperCase() || "",
                  },
                ]);
                hideLoadingSpinner();
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
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
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
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Farmer Name",
      accessor: "FarmProfile.farmerName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Farm Address",
      accessor: "address",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Fruit Local Name",
      accessor: "Fruit.localName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Fruit ID",
      accessor: "Fruit.fruitId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Production (Kg)",
      accessor: "production",
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
      Header: "Farm Price/Kg ($)",
      accessor: "farmPrice",
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
      Header: "Total Farm Value ($)",
      accessor: "totalFarmValue",
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
  ]);
  return (
    <div>
      {/* Modal Export*/}
      <FormModal
        title={`Export Production`}
        visible={exportModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setExportModalVisible(false);
          setExportFormData({});
          setSelectedCompany([]);
          setSelectedFarmArea([]);
          setSelectedExportFarmeName([]);
          setSelectedFruit([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setExportModalVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportFruitProductionActual({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            // Convert base64 to blob
            const base64Response = response.data.exportFruitProductionActual;
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
            link.download = "fruit_production_actual.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);

            // window.open(response.data.exportFruitProductionActual, "__blank");
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}
      >
        <div>
          <MonthAndYearsFilterWithExport
            label="Month Year Filter"
            // defaultValue={yearMonth}
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
            <label>Customer Name</label>
            <AsyncSelect
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
              className={`form-control uppercase`}
              classNamePrefix="select"
              onChange={async (selectedValues) => {
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
              className={`form-control uppercase`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                const found = allFarmProfilesByFarmer.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  farmerName: found?.farmerName || "",
                });
                setSelectedExportFarmeName([
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
            <label>Fruit Name</label>
            {/* 
            <Select
              className="form-control"
              isClearable={true}
              value={selectedFruit}
              required
              options={allCropsFruits.map((pr) => {
                return {
                  value: pr.uuid,
                  label: `${pr.localName}`,
                };
              })}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                const found = allCropsFruits.find((p) =>
                  selectedValues ? p.uuid === selectedValues.value : null
                );

                setExportFormData({
                  ...exportFormData,
                  fruitUUID: found?.uuid || "",
                });
                setSelectedFruit([
                  {
                    label: found?.localName.toUpperCase() || "",
                    value: found?.uuid || "",
                  },
                ]);
              }}
            /> */}
            <AsyncSelect
              value={exportFormData.Fruit}
              loadOptions={getFruit}
              className={`form-control uppercase`}
              classNamePrefix="select"
              noOptionsMessage={() => "Type to Search"}
              getOptionLabel={(option) => `${option.localName}`}
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allCropsFruits.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.uuid : null
                );
                setExportFormData({
                  ...exportFormData,
                  fruitUUID: found?.uuid || "",
                });
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
        title={`Edit Fruit Production`}
        visible={updateFormDataVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setUpdateFormDataVisible(false);
          setSelectedCompany([]);
          setSelectedFarmArea([]);
          setSelectedFruit([]);
          setUpdateFormData({
            records: [],
            addresses: [],
          });
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let production = "" + updateFormData.production;
            let farmPrice = "" + updateFormData.farmPrice;
            let cultivatedArea = "" + updateFormData.cultivatedArea;

            if (production) {
              production = parseFloat(production.replace(/,/g, ""));
            } else {
              production = 0;
            }
            if (farmPrice) {
              farmPrice = parseFloat(farmPrice.replace(/,/g, ""));
            } else {
              farmPrice = 0;
            }

            if (cultivatedArea) {
              cultivatedArea = parseFloat(cultivatedArea.replace(/,/g, ""));
            } else {
              cultivatedArea = 0;
            }

            const tokenizedPayload = {
              ...updateFormData,
              production: parseFloat(production || 0),
              cultivatedArea: parseFloat(cultivatedArea || 0),
              farmPrice: parseFloat(farmPrice || 0),
              totalFarmValue: parseFloat(updateFormData.totalFarmValue || 0),
            };
            const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
            await updateFruitProductionActual({
              variables: {
                tokenized,
                // ...updateFormData,
                // production: parseFloat(updateFormData.production || 0),
                // cultivatedArea: parseFloat(updateFormData.cultivatedArea || 0),
                // farmPrice: parseFloat(updateFormData.farmPrice || 0),
                // totalFarmValue: parseFloat(updateFormData.totalFarmValue || 0),
              },
            });
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
            setSavedCount((savedCount += 1));
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
          <AsyncSelect
            value={updateFormData.FarmerProfile}
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
              setSelectedFarmArea([
                {
                  label: "",
                  value: "",
                },
              ]);
            }}
          />
        </div>
        <div className="form-group">
          <label>Farm Area</label>
          <Select
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
                  result.data?.getFarmAddressByCompanyUUIDAndFarmArea || [],
              });

              setSelectedFarmArea([
                {
                  value: found.uuid,
                  label: found.farmArea,
                },
              ]);
            }}
          />
        </div>
        <div className="form-group">
          <label>Farmer Name</label>
          <input
            disabled
            className="form-control uppercase"
            placeholder="Auto Filled (From Farmer Profile)"
            value={updateFormData.farmerName || ""}
          />
        </div>

        <div className="form-group w-1/2">
          <label>Farm Address</label>

          <select
            className="form-control uppercase"
            value={updateFormData.address || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setUpdateFormData({
                ...updateFormData,
                address: e.target.value,
              });
            }}
          >
            <option value={""} disabled>
              Select Address
            </option>
            {updateFormData.addresses.map((addr) => (
              <option value={addr}>{addr}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Fruit Name</label>
          <AsyncSelect
            value={updateFormData.Fruit}
            loadOptions={getFruit}
            className={`form-control uppercase`}
            classNamePrefix="select"
            noOptionsMessage={() => "Type to Search"}
            getOptionLabel={(option) => `${option.localName}`}
            getOptionValue={(option) => option.uuid}
            autoFocus={true}
            onChange={(selectedValues) => {
              // console.log({ selectedValues });

              const found = allCropsFruits.find((profile) =>
                selectedValues ? profile.uuid === selectedValues.uuid : null
              );
              setUpdateFormData({
                ...updateFormData,
                Fruit: found,
                localName: found?.localName || "",
                englishName: found?.englishName || "",
                fruitId: found?.fruitId || "",
                fruitUUID: found?.uuid || "",
              });
            }}
          />
          {/* <Select
            value={selectedFruit}
            required
            options={allCropsFruits.map((pr) => {
              return {
                value: pr.uuid,
                label: `${pr.localName}`,
              };
            })}
            classNamePrefix="select"
            onChange={(selectedValues) => {
              const found = allCropsFruits.find(
                (p) => p.uuid === selectedValues.value
              );

              setUpdateFormData({
                ...updateFormData,
                localName: found?.localName || "",
                englishName: found?.englishName || "",
                fruitUUID: found.uuid,
              });
              setSelectedFruit([
                {
                  label: found.localName.toUpperCase(),
                  value: found.uuid,
                },
              ]);
            }}
          /> */}
        </div>
        <div className="form-group">
          <label>Fruit ID</label>
          <input
            disabled
            className="form-control"
            placeholder="Auto Filled"
            value={updateFormData.fruitId || ""}
          />
        </div>
        <div className="form-group">
          <label>Production (Kg)</label>
          <NumberFormat
            className="form-control"
            value={updateFormData.production || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              const val = parseFloat(e.value || 0);
              const totalFarmValue = val * updateFormData.farmPrice;
              setUpdateFormData({
                ...updateFormData,
                production: e.formattedValue,
                totalFarmValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Farm Price per Kg ($)</label>
          <NumberFormat
            className="form-control"
            value={updateFormData.farmPrice || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              const val = parseFloat(e.value || 0);
              const totalFarmValue = val * updateFormData.production;
              setUpdateFormData({
                ...updateFormData,
                farmPrice: e.formattedValue,
                totalFarmValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Cultivated Area/Fruit (Ha)</label>
          <NumberFormat
            className="form-control"
            value={updateFormData.cultivatedArea || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={3}
            fixedDecimalScale={true}
            onChange={(e) => {
              if (e) e.preventDefault();
              setUpdateFormData({
                ...updateFormData,
                cultivatedArea: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Total Form Value ($)</label>
          <NumberFormat
            disabled
            className="form-control"
            value={updateFormData.totalFarmValue || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
          />
        </div>
      </FormModal>
      <FormModal
        size={"lg"}
        title={`New Fruit Production`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
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
            const fruitUUIDNotExist = formData.records.some(
              (rec) => !rec.hasOwnProperty("fruitUUID")
            );

            if (fruitUUIDNotExist) {
              throw new Error("Filed Cannot Be Empty");
            }

            const tokenizedPayload = formData.records.map((rec) => {
              let production = "" + rec.production;
              let farmPrice = "" + rec.farmPrice;
              let cultivatedArea = "" + rec.cultivatedArea;
              if (production) {
                production = parseFloat(production.replace(/,/g, ""));
              } else {
                production = 0;
              }
              if (farmPrice) {
                farmPrice = parseFloat(farmPrice.replace(/,/g, ""));
              } else {
                farmPrice = 0;
              }
              if (cultivatedArea) {
                cultivatedArea = parseFloat(cultivatedArea.replace(/,/g, ""));
              } else {
                cultivatedArea = 0;
              }
              return {
                monthYear: formData.monthYear,
                address: ""+formData.address,
                farmerUUID: formData.farmerUUID,
                farmAreaId: formData.farmAreaId,
                fruitUUID: rec.fruitUUID,
                production: parseFloat(production || 0),
                cultivatedArea: parseFloat(cultivatedArea || 0),
                farmPrice: parseFloat(farmPrice || 0),
                totalFarmValue: parseFloat(rec?.totalFarmValue || 0),
              };
            });

            const tokenized = jwt.sign({ tokenizedPayload }, TOKENIZE);

            await createFruitProductionActual({
              variables: {
                tokenized,
              },
            });

            // for (const rec of formData.records) {
            //   let production = "" + rec.production;
            //   let farmPrice = "" + rec.farmPrice;
            //   let cultivatedArea = "" + rec.cultivatedArea;

            //   if (production) {
            //     production = parseFloat(production.replace(/,/g, ""));
            //   } else {
            //     production = 0;
            //   }
            //   if (farmPrice) {
            //     farmPrice = parseFloat(farmPrice.replace(/,/g, ""));
            //   } else {
            //     farmPrice = 0;
            //   }

            //   if (cultivatedArea) {
            //     cultivatedArea = parseFloat(cultivatedArea.replace(/,/g, ""));
            //   } else {
            //     cultivatedArea = 0;
            //   }

            //   const tokenizedPayload = {
            //     monthYear: formData.monthYear,
            //     address: formData.address,
            //     farmerUUID: formData.farmerUUID,
            //     farmAreaId: formData.farmAreaId,

            //     fruitUUID: rec.fruitUUID,

            //     production: parseFloat(production || 0),
            //     cultivatedArea: parseFloat(cultivatedArea || 0),
            //     farmPrice: parseFloat(farmPrice || 0),
            //     totalFarmValue: parseFloat(rec?.totalFarmValue || 0),
            //   };

            //   const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

            //   await createFruitProductionActual({
            //     variables: {
            //       tokenized,
            //       // monthYear: formData.monthYear,

            //       // farmerUUID: formData.farmerUUID,
            //       // farmAreaId: formData.farmAreaId,

            //       // fruitUUID: rec.fruitUUID,

            //       // production: parseFloat(rec?.production || 0),
            //       // cultivatedArea: parseFloat(rec?.cultivatedArea || 0),
            //       // farmPrice: parseFloat(rec?.farmPrice || 0),
            //       // totalFarmValue: parseFloat(rec?.totalFarmValue || 0),
            //     },
            //   });
            // }

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
            setSelectedCompany([{ value: "", label: "" }]);
            setSelectedFarmArea([{ value: "", label: "" }]);
            setSavedCount((savedCount += 1));
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
          <label>Company Name*</label>
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
          <AsyncSelect
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
              setSelectedFarmArea([
                {
                  label: "",
                  value: "",
                },
              ]);
            }}
          />
        </div>
        <div className="form-group">
          <label>Farm Area</label>
          <Select
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

          <select
            className="form-control uppercase"
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                address: e.target.value,
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
          </select>
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
                    production: 0,
                    cultivatedArea: 0,
                    farmPrice: 0,
                    totalFarmValue: 0,
                  },
                ],
              });
            }}
          >
            <i className="fa fa-plus" /> Add
          </button>
        </div>

        <div className="grid grid-cols-7 uppercase">
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
            Fruit Name
          </div>
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
            Fruit ID
          </div>
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
            Production (Kg)
          </div>
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
            Farm Price/Kg ($)
          </div>
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
            Cultivated Area/Fruit (Ha)
          </div>
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
            Total Farm Value ($)
          </div>
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
            {}
          </div>
        </div>

        {formData.records.map((rec) => (
          <div className="grid grid-cols-7 my-2 uppercase">
            <div className="pr-2">
              <AsyncSelect
                value={rec.Fruit}
                loadOptions={getFruit}
                // className={`form-control`}
                classNamePrefix="select"
                noOptionsMessage={() => "Type to Search"}
                getOptionLabel={(option) => `${option.localName}`}
                getOptionValue={(option) => option.uuid}
                autoFocus={true}
                onChange={(selectedValues) => {
                  // console.log({ selectedValues });

                  const found = allCropsFruits.find((profile) =>
                    selectedValues ? profile.uuid === selectedValues.uuid : null
                  );
                  const { uuid, ...d } = found;
                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            ...d,
                            Fruit: found,
                            fruitUUID: uuid,
                          }
                    ),
                  });
                }}
              />
              {/* <Select
                value={{
                  value: rec.fruitUUID,
                  label: rec.localName,
                }}
                required
                options={allCropsFruits.map((pr) => {
                  return {
                    value: pr.uuid,
                    label: `${pr.localName}`,
                  };
                })}
                classNamePrefix="select"
                onChange={(selectedValues) => {
                  let found = allCropsFruits.find(
                    (p) => p.uuid === selectedValues.value
                  );
                  const { uuid, ...d } = found;
                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                          ...rec,
                          ...d,
                          fruitUUID: found.uuid,
                        }
                    ),
                  });
                  setSelectedFruit(found);
                }}
              />
               */}
            </div>
            <div className="pr-2">
              <input
                disabled
                placeholder="Auto Filled"
                className="form-control"
                value={rec.fruitId || ""}
              />
            </div>
            <div className="pr-2">
              <NumberFormat
                className="form-control"
                value={rec.production || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();

                  const val = parseFloat(e.value || 0);
                  const totalFarmValue = val * rec.farmPrice;
                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            production: e.formattedValue,
                            // totalFarmValue,
                          }
                    ),
                  });
                }}
              />
            </div>
            <div className="pr-2">
              <NumberFormat
                className="form-control"
                value={rec.farmPrice || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  const val = parseFloat(e.value || 0);
                  const totalFarmValue = rec.production * val;
                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            farmPrice: e.formattedValue,
                            // totalFarmValue,
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
                decimalScale={3}
                fixedDecimalScale={true}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            cultivatedArea: e.target.value,
                          }
                    ),
                  });
                }}
              />
            </div>
            <div className="pr-2">
              <NumberFormat
                disabled
                placeholder="Auto Calculate"
                className="form-control"
                value={rec.totalFarmValue || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
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
      <div className="pr-0 md:pr-10 py-4 h-full">
        <TableAsync
          customHeaderUtilities={
            <div className="flex">
              <MonthAndYearsFilterWithExport
                label="Month Year Filter"
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
                      "Actual Production Fruit Export Excel:Read",
                    ])
                      ? "block"
                      : "hidden"
                  }`}
                  onClick={async (e) => {
                    if (e) e.preventDefault();
                    setExportModalVisible(true);
                    // showLoadingSpinner();
                    // try {
                    //   const response = await exportFruitProductionActual({
                    //     variables: {
                    //       monthYear: yearMonth,
                    //     },
                    //   });

                    //   window.open(
                    //     response.data.exportFruitProductionActual,
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
          data={allFruitProductionActuals}
          withoutHeader={true}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          onAdd={
            !currentUserDontHavePrivilege(["Actual Production Fruit:Create"])
              ? () => {
                  setFormData({
                    records: [],
                    addresses: [],
                  });
                  setModalVisible(true);
                  setSelectedCompany([]);
                  setSelectedFarmArea([]);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Actual Production Fruit:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} productions?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteFruitProductionActual({
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
          customUtilities={
            !currentUserDontHavePrivilege(["Actual Production Fruit:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </div>
  );
};

export default withApollo({ ssr: true })(page);
