import React, { useState, useEffect, useMemo, useCallback } from "react";
import { withApollo } from "../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../components/App";
import { useNotification } from "../components/Notification";
import { handleError } from "../libs/errors";
import AdminArea, { useCurrentUser } from "../components/AdminArea";
import TableAsync from "../components/TableAsync";
import {
  useQuery,
  useLazyQuery,
  useMutation,
  useApolloClient,
} from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { FormModal } from "../components/Modal";
import { useRouter } from "next/router";
import { create, filter, update } from "lodash";
import { from } from "apollo-link";
import { configure } from "nprogress";
import Head from "next/dist/next-server/lib/head";
import { Leaf } from "slate";
import { v4 as uuidv4 } from "uuid";
import AsyncSelect from "react-select/async";
import NumberFormat from "react-number-format";
import lodash from "lodash";
import Select from "react-select";
import RetailPriceLiveStockImport from "../components/RetailPriceLiveStockImport";
import dayjs from "dayjs";
import { MonthAndYearsFilterWithExport } from "../components/MonthAndYearsFilterWithExport";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import { formatCurrency } from "../../app/libs/numbers";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query allRetailPrices($monthYear: String!, $filters: String) {
    countAllRetailPrices(monthYear: $monthYear, filters: $filters)

    tokenizedAllFarmLocation

    tokenizedAllLivestockCommodities
  }
`;

const RETAIL_PRICE_QUERY = gql`
  query retailPriceQuery(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllRetailPrices(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllRetailPrices(monthYear: $monthYear, filters: $filters)
  }
`;

const GET_LIVESTOCK_DETAIL = gql`
  query tokenizedAllLivestockCommodityDetails($tokenizedParams: String!) {
    tokenizedAllLivestockCommodityDetails(tokenizedParams: $tokenizedParams)
  }
`;

const GET_SEARCH_COMMODITIES = gql`
  query searchLiveStockCommodities($name: String) {
    searchLiveStockCommodities(name: $name)
  }
`;

const CREATE_RETAIL_PRICE = gql`
  mutation tokenizedCreateManyRetailPrice($tokenized: String!) {
    tokenizedCreateManyRetailPrice(tokenized: $tokenized)
  }
`;

const UPDATE_RETAIL_PRICE = gql`
  mutation tokenizedUpdateRetailPrice($tokenized: String!) {
    tokenizedUpdateRetailPrice(tokenized: $tokenized)
  }
`;

const DELETE_RETAIL_PRICE = gql`
  mutation deleteRetailPrice($uuid: String!) {
    deleteRetailPrice(uuid: $uuid)
  }
`;

const EXPORT_TO_EXCEL = gql`
  mutation exportLivestockRetailPrice(
    $monthYear: String!
    $livestockCommodityUUID: String
    $livestockCommodityDetailUUID: String
  ) {
    exportLivestockRetailPrice(
      monthYear: $monthYear
      livestockCommodityUUID: $livestockCommodityUUID
      livestockCommodityDetailUUID: $livestockCommodityDetailUUID
    )
  }
`;

const CHECK_DUPLICATE_RETAIL_PRICE = gql`
  mutation tokenizedCheckDuplicateRetailPrice($tokenized: String!) {
    tokenizedCheckDuplicateRetailPrice(tokenized: $tokenized)
  }
`;

const RetailPrice = () => {
  const router = useRouter();
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );

  const client = useApolloClient();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({
    records: [],
    listCommodityDetails: [],
  });
  const [exportFormData, setExportFormData] = useState({});
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const [selectedCommodity, setSelectedCommodity] = useState({});
  const [selectedCommodityDetail, setSelectedCommodityDetail] = useState({});

  const [modalVisible, setModalVisible] = useState(false);
  const [importForm, setImportForm] = useState(false);
  const notification = useNotification();

  const [updateFormData, setUpdateFormData] = useState({
    listCommodityDetails: [],
  });
  const [updateFormDataVisible, setUpdateFormDataVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY, {
    variables: {
      monthYear: yearMonth,
      filters: router.query.filters,
    },
  });
  const [createRetailPrice] = useMutation(CREATE_RETAIL_PRICE);
  const [updateRetailPrice] = useMutation(UPDATE_RETAIL_PRICE);
  const [deleteRetailPrice] = useMutation(DELETE_RETAIL_PRICE);
  const [exportLivestockRetailPrice] = useMutation(EXPORT_TO_EXCEL);
  const [checkDuplicateRetailPrice] = useMutation(CHECK_DUPLICATE_RETAIL_PRICE);

  const [selectedExportCommodity, setSelectedExportCommodity] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const [selectedExportCommodityDetail, setSelectedExportCommodityDetail] =
    useState([
      {
        value: "",
        label: "",
      },
    ]);

  useEffect(async () => {
    if (importForm === false) {
      await refetch();
    }
  }, [importForm]);

  const [allRetailPrices, setAllRetailPrices] = useState([]);
  const [allLivestockCommodities, setAllLivestockCommodities] = useState([]);
  const [allFarmLocation, setAllFarmLocation] = useState([]);
  let [savedCount, setSavedCount] = useState(0);
  const [allLivestockCommoditiesDetail, setAllLivestockCommoditiesDetail] =
    useState([]);
  let [countRetailPrices, setCountRetailPrices] = useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countRetailPrices) return 1;
    return Math.ceil(countRetailPrices / pageSize);
  }, [countRetailPrices, pageSize]);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedRetailPrices = data?.tokenizedAllRetailPrices || "";
      // let allRetailPrices = [];
      // if (encryptedRetailPrices) {
      //   const decrypted = jwt.verify(encryptedRetailPrices, TOKENIZE);
      //   allRetailPrices = decrypted.queryResult;
      //   setAllRetailPrices(allRetailPrices);
      // }
      const encryptedFarmLocations = data?.tokenizedAllFarmLocation || "";
      let allFarmLocation = [];
      if (encryptedFarmLocations) {
        const decrypted = jwt.verify(encryptedFarmLocations, TOKENIZE);
        allFarmLocation = decrypted.queryResult;
        setAllFarmLocation(allFarmLocation);
      }
      const encryptedLivestockCommodities =
        data?.tokenizedAllLivestockCommodities || "";
      let allLivestockCommodities = [];
      if (encryptedLivestockCommodities) {
        const decrypted = jwt.verify(encryptedLivestockCommodities, TOKENIZE);
        allLivestockCommodities = decrypted.queryResult;
        setAllLivestockCommodities(allLivestockCommodities);
      }
      const countData = data?.countAllRetailPrices || 0;
      setCountRetailPrices(countData);
    }
  }, [data, loading, error, savedCount]);

  const [selectedMultipleCommodity, setSelectedMultipleCommodity] = useState(
    []
  );
  // const availableOptions = allLivestockCommodities.filter(
  //   (comm) => !selectedMultipleCommodity.includes(comm.uuid)
  // );
  const availableOptions = allLivestockCommodities;

  useEffect(() => {
    let selectedOption = formData.records
      .filter((commodity) => commodity.livestockCommodityUUID)
      .map((comm) => comm.livestockCommodityUUID);
    setSelectedMultipleCommodity(selectedOption);
  }, [formData.records]);

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

  const getCommodities = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      callback([]);
      // fetchingCommodities(input, callback);
    }
  };

  const fetchingCommodities = async (input, callback) => {
    const result = await client.query({
      query: GET_SEARCH_COMMODITIES,
      variables: {
        name: input,
      },
      fetchPolicy: "no-cache",
    });
    let allCropsCommodityQuery = [];
    const encryptedCommodity = result.data?.searchLiveStockCommodities;
    if (encryptedCommodity) {
      const decrypted = jwt.verify(encryptedCommodity, TOKENIZE);
      allCropsCommodityQuery = decrypted.queryResult;
      // const filterCommodity = allCropsCommodityQuery.filter(
      //   (com) => !selectedMultipleCommodity.includes(com.uuid)
      // );
      const filterCommodity = allCropsCommodityQuery;
      setAllLivestockCommodities(allCropsCommodityQuery);
      callback(filterCommodity);
    }
  };

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
      query: RETAIL_PRICE_QUERY,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedRetailPrices = result.data?.tokenizedAllRetailPrices || "";
    let allRetailPrices = [];
    if (encryptedRetailPrices) {
      const decrypted = jwt.verify(encryptedRetailPrices, TOKENIZE);
      allRetailPrices = decrypted.queryResult;
      setAllRetailPrices(allRetailPrices, router.query.filters);
    }

    const countData = result.data?.countAllRetailPrices || 0;
    setCountRetailPrices(countData);

    hideLoadingSpinner();
  }, [savedCount, yearMonth, pageSize, pageIndex]);

  // const encryptedRetailPrices = data?.tokenizedAllRetailPrices || "";
  // let allRetailPrices = [];
  // if (encryptedRetailPrices) {
  //   const decrypted = jwt.verify(encryptedRetailPrices, TOKENIZE);
  //   allRetailPrices = decrypted.queryResult;
  // }

  let allFarmLocations = allFarmLocation || [];
  allFarmLocations = lodash.uniqBy(allFarmLocations, (loc) => loc.district);

  // const encryptedLivestockCommodities =
  //   data?.tokenizedAllLivestockCommodities || "";
  // let allLivestockCommodities = [];
  // if (encryptedLivestockCommodities) {
  //   const decrypted = jwt.verify(encryptedLivestockCommodities, TOKENIZE);
  //   allLivestockCommodities = decrypted.queryResult;
  // }
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
                if (e) e.preventDefault();
                const tokenizedPayload = {
                  livestockCommodityUUID:
                    props.row.original?.LivestockCommodity?.uuid || "",
                };
                const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
                const commodityResult = await client.query({
                  query: GET_LIVESTOCK_DETAIL,
                  variables: {
                    // livestockCommodityUUID:
                    //   props.row.original?.LivestockCommodity?.uuid || "",
                    tokenizedParams: tokenized,
                  },
                  fetchPolicy: "no-cache",
                });
                const encryptedLivestockCommodityDetails =
                  commodityResult.data.tokenizedAllLivestockCommodityDetails ||
                  "";
                let LivestockCommodityDetails = [];
                if (encryptedLivestockCommodityDetails) {
                  const decrypted = jwt.verify(
                    encryptedLivestockCommodityDetails,
                    TOKENIZE
                  );
                  LivestockCommodityDetails = decrypted.queryResult;
                }

                const foundCommodityDetails = LivestockCommodityDetails.find(
                  (ret) =>
                    ret.uuid === props.row.original.livestockCommodityDetailUUID
                );

                setUpdateFormDataVisible(true);
                setUpdateFormData({
                  ...props.row.original,
                  unit: foundCommodityDetails?.Unit?.name || "",
                  listCommodityDetails: LivestockCommodityDetails,

                  // farmLocationUUID:
                  //   props.row.original?.FarmLocation?.uuid || "",
                });

                setSelectedCommodity([
                  {
                    value: props.row.original?.LivestockCommodity?.uuid || "",
                    label:
                      props.row.original?.LivestockCommodity?.name?.toUpperCase() ||
                      "",
                  },
                ]);
                setSelectedCommodityDetail([
                  {
                    value:
                      props.row.original?.LivestockCommodityDetail?.uuid || "",
                    label:
                      props.row.original?.LivestockCommodityDetail?.name?.toUpperCase() ||
                      "",
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
      Header: "Year",
      accessor: "year",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Month",
      accessor: "month",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Category",
      accessor: "LivestockCommodity.name",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Commodity",
      accessor: "LivestockCommodityDetail.name",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Brunei Muara Price ($)",
      accessor: "bruneiMuaraPrice",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{formatCurrency(props.value, 2, ".", ",")}</span>,
    },
    {
      Header: "Tutong Price ($)",
      accessor: "tutongPrice",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{formatCurrency(props.value, 2, ".", ",")}</span>,
    },

    {
      Header: "Belait Price ($)",
      accessor: "belaitPrice",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{formatCurrency(props.value, 2, ".", ",")}</span>,
    },
    {
      Header: "Temburong Price ($)",
      accessor: "temburongPrice",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{formatCurrency(props.value, 2, ".", ",")}</span>,
    },
  ]);

  return (
    <AdminArea header={{ title: "Retail Price" }} urlQuery={router.query}>
      <Head>
        <title>Retail Price</title>
      </Head>

      <FormModal
        size={"lg"}
        title={`Export Production`}
        visible={exportModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setExportModalVisible(false);
          setExportFormData({});

          setSelectedExportCommodity([]);
          setSelectedExportCommodityDetail([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setExportModalVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportLivestockRetailPrice({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            // Convert base64 to blob
            const base64Response = response.data.exportLivestockRetailPrice;
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
            link.download = "livestock_retail_price.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);

            // window.location.href = response.data.exportLivestockRetailPrice;
            // window.open(response.data.exportLivestockRetailPrice, "__blank");
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}
      >
        <div>
          <MonthAndYearsFilterWithExport
            label="Month Year Filter"
            controlledValue={
              router.query.yearMonth || dayjs().format("YYYY-MM")
            }
            isDisabled={true}
          />

          <div className="form-group">
            <label>Commodity</label>
            {/* <AsyncSelect
              loadOptions={getCommodities}
              classNamePrefix="Select"
              noOptionsMessage={() => "Type To Search"}
              getOptionLabel={(options) => options.name.toUpperCase()}
              getOptionValue={(options) => options.uuid}
              autoFocus={true}
              value={exportFormData.LivestockCommodity || ""}
              onChange={async (selectedValues) => {
                const tokenizedPayload = {
                  livestockCommodityUUID: selectedValues.uuid || "",
                };
                const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
                const commodityResult = await client.query({
                  query: GET_LIVESTOCK_DETAIL,
                  variables: {
                    tokenizedParams: tokenized,
                  },
                  fetchPolicy: "no-cache",
                });
                const encryptedLivestockCommodityDetails =
                  commodityResult.data.tokenizedAllLivestockCommodityDetails ||
                  "";
                let commodities = [];
                if (encryptedLivestockCommodityDetails) {
                  const decrypted = jwt.verify(
                    encryptedLivestockCommodityDetails,
                    TOKENIZE
                  );
                  commodities = decrypted.queryResult;
                }
                setAllLivestockCommoditiesDetail(commodities);
                setExportFormData({
                  ...exportFormData,
                  livestockCommodityUUID: selectedValues.uuid || "",
                  LivestockCommodity: selectedValues,
                });
              }}
            /> */}
            <Select
              isClearable={true}
              value={selectedExportCommodity}
              options={allLivestockCommodities.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.name,
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                const found = allLivestockCommodities.find((com) =>
                  selectedValues ? com.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  livestockCommodityUUID: found?.uuid || "",
                });

                setSelectedExportCommodity([
                  {
                    value: found?.uuid || "",
                    label: found?.name || "",
                  },
                ]);
              }}
            />
          </div>

          <div className="form-group">
            <label>Commodity Detail</label>
            <Select
              isClearable={true}
              value={selectedExportCommodityDetail}
              options={allLivestockCommoditiesDetail.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.name.toUpperCase(),
                };
              })}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                const found = allLivestockCommoditiesDetail.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  livestockCommodityDetailUUID: found?.uuid || "",
                });

                setSelectedExportCommodityDetail([
                  {
                    value: found?.uuid || "",
                    label: found?.name.toUpperCase() || "",
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
        title={`Edit Retail Price`}
        size="lg"
        visible={updateFormDataVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setUpdateFormDataVisible(false);
          setUpdateFormData({
            listCommodityDetails: [],
          });
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          try {
            let { uuid } = updateFormData;

            let tokenizedPayload = {
              uuid,
              ...updateFormData,
              bruneiMuaraPrice: lodash.round(
                updateFormData?.bruneiMuaraPrice || 0,
                2
              ),
              tutongPrice: lodash.round(updateFormData?.tutongPrice || 0, 2),
              belaitPrice: lodash.round(updateFormData?.belaitPrice || 0, 2),
              temburongPrice: lodash.round(
                updateFormData?.temburongPrice || 0,
                2
              ),
            };

            delete tokenizedPayload.LivestockCommodity;
            const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
            await updateRetailPrice({
              variables: {
                // uuid,
                // ...updateFormData,
                // bruneiMuaraPrice: parseFloat(
                //   updateFormData?.bruneiMuaraPrice || 0
                // ),
                // tutongPrice: parseFloat(updateFormData?.tutongPrice || 0),
                // belaitPrice: parseFloat(updateFormData?.belaitPrice || 0),
                // temburongPrice: parseFloat(updateFormData?.temburongPrice || 0),
                tokenized,
              },
            });
            await refetch();
            setSavedCount((savedCount += 1));
            notification.addNotification({
              title: "Succeess!",
              message: `Price saved!`,
              level: "success",
            });
            setUpdateFormDataVisible(false);
            setUpdateFormData({
              listCommodityDetails: [],
            });
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
            value={updateFormData.monthYear || ""}
            onChange={(e) => {
              setUpdateFormData({
                ...updateFormData,
                monthYear: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Commodity</label>
          {/* <AsyncSelect
            loadOptions={getCommodities}
            classNamePrefix="Select"
            noOptionsMessage={() => "Type To Search"}
            getOptionLabel={(options) => options.name.toUpperCase()}
            getOptionValue={(options) => options.uuid}
            autoFocus={true}
            value={updateFormData.LivestockCommodity || ""}
            onChange={async (selectedValues) => {
              const tokenizedPayload = {
                livestockCommodityUUID: selectedValues.uuid,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

              const found = await client.query({
                query: GET_LIVESTOCK_DETAIL,
                variables: {
                  // livestockCommodityUUID: selectedValues.value,
                  tokenizedParams: tokenized,
                },
                fetchPolicy: "no-cache",
              });

              let founds;

              const encryptedLivestockCommodityDetails =
                found.data?.tokenizedAllLivestockCommodityDetails || "";
              if (encryptedLivestockCommodityDetails) {
                const decrypted = jwt.verify(
                  encryptedLivestockCommodityDetails,
                  TOKENIZE
                );
                founds = decrypted.queryResult;
              }
              setUpdateFormData({
                ...updateFormData,
                listCommodityDetails: founds,
                livestockCommodityUUID: selectedValues.uuid,
                unit: "",
                LivestockCommodity: selectedValues,
                livestockCommodityDetailUUID: "",
              });
            }}
          /> */}
          <Select
            value={selectedCommodity}
            required
            options={allLivestockCommodities.map((pr) => {
              return {
                value: pr.uuid,
                label: `${pr.name.toUpperCase()}`,
              };
            })}
            classNamePrefix="select"
            onChange={async (selectedValues) => {
              const tokenizedPayload = {
                livestockCommodityUUID: selectedValues.value,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

              const found = await client.query({
                query: GET_LIVESTOCK_DETAIL,
                variables: {
                  // livestockCommodityUUID: selectedValues.value,
                  tokenizedParams: tokenized,
                },
                fetchPolicy: "no-cache",
              });

              let founds;

              const encryptedLivestockCommodityDetails =
                found.data?.tokenizedAllLivestockCommodityDetails || "";
              if (encryptedLivestockCommodityDetails) {
                const decrypted = jwt.verify(
                  encryptedLivestockCommodityDetails,
                  TOKENIZE
                );
                founds = decrypted.queryResult;
              }
              setUpdateFormData({
                ...updateFormData,
                listCommodityDetails: founds,
                livestockCommodityUUID: selectedValues.value,
                unit: "",

                livestockCommodityDetailUUID: "",
              });
              setSelectedCommodity([
                {
                  label: selectedValues.label.toUpperCase(),
                  value: selectedValues.value,
                },
              ]);
              setSelectedCommodityDetail({
                label: "",
                value: "",
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Code</label>
          <Select
            value={selectedCommodityDetail}
            required
            options={updateFormData.listCommodityDetails.map((pr) => {
              return {
                value: pr.uuid,
                label: `${pr.name.toUpperCase()}`,
              };
            })}
            classNamePrefix="select"
            onChange={async (selectedValues) => {
              const found = updateFormData.listCommodityDetails.find(
                (p) => p.uuid === selectedValues.value
              );

              setUpdateFormData({
                ...updateFormData,
                unit: (found?.Unit?.name || "").toUpperCase(),
                livestockCommodityDetailUUID: selectedValues.value,
              });
              setSelectedCommodityDetail([
                {
                  label: selectedValues.label.toUpperCase(),
                  value: selectedValues.value,
                },
              ]);
            }}
          />
        </div>
        <div className="form-group">
          <label>Unit</label>
          <input
            className="form-control"
            value={(updateFormData.unit || "").toUpperCase()}
            disabled
          />
        </div>

        <div className="form-group">
          <label>Brunei Muara Retail Price ($)</label>
          <NumberFormat
            className="form-control"
            value={updateFormData.bruneiMuaraPrice || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setUpdateFormData({
                ...updateFormData,
                bruneiMuaraPrice: e.floatValue || 0,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Tutong Retail Price ($)</label>
          <NumberFormat
            className="form-control"
            value={updateFormData.tutongPrice || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setUpdateFormData({
                ...updateFormData,
                tutongPrice: e.floatValue || 0,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Belait Retail Price ($)</label>
          <NumberFormat
            className="form-control"
            value={updateFormData.belaitPrice || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setUpdateFormData({
                ...updateFormData,
                belaitPrice: e.floatValue || 0,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Temburong Retail Price ($)</label>
          <NumberFormat
            className="form-control"
            value={updateFormData.temburongPrice || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setUpdateFormData({
                ...updateFormData,
                temburongPrice: e.floatValue || 0,
              });
            }}
          />
        </div>
      </FormModal>

      <FormModal
        size={"xl"}
        title={`New Retail Price`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            records: [],
          });
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { uuid, __typename, __createdAt, __updatedAt, records } =
              formData;

            if (formData.records.length === 0) {
              throw {
                message: "Empty Records!",
              };
            }

            //Double check if contain duplicate
            for (let rec of formData.records) {
              delete rec.LivestockCommodity;
              const foundDuplicate = formData.records.filter(
                (rc) =>
                  rc.livestockCommodityUUID === rec.livestockCommodityUUID &&
                  rc.livestockCommodityDetailUUID ===
                    rec.livestockCommodityDetailUUID
              );

              if (foundDuplicate.length >= 2) {
                throw {
                  message: "Duplicate Record Found!",
                };
              }

              const tokenizedPayload = {
                monthYear: formData.monthYear,
                ...rec,
                bruneiMuaraPrice: rec?.bruneiMuaraPrice || 0,
                tutongPrice: rec?.tutongPrice || 0,
                belaitPrice: rec?.belaitPrice || 0,
                temburongPrice: rec?.temburongPrice || 0,
              };

              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await checkDuplicateRetailPrice({
                variables: {
                  // monthYear: formData.monthYear,
                  // ...record,
                  // bruneiMuaraPrice: parseFloat(record?.bruneiMuaraPrice || 0),
                  // tutongPrice: parseFloat(record?.tutongPrice || 0),
                  // belaitPrice: parseFloat(record?.belaitPrice || 0),
                  // temburongPrice: parseFloat(record?.temburongPrice || 0),
                  tokenized,
                },
              });
            }
            // Insert Data
            const tokenizedPayload = records.map((rec) => {
              return {
                monthYear: formData.monthYear,
                ...rec,
                bruneiMuaraPrice: lodash.round(rec?.bruneiMuaraPrice || 0, 2),
                tutongPrice: lodash.round(rec?.tutongPrice || 0, 2),
                belaitPrice: lodash.round(rec?.belaitPrice || 0, 2),
                temburongPrice: lodash.round(rec?.temburongPrice || 0, 2),
              };
            });

            const tokenized = jwt.sign({ tokenizedPayload }, TOKENIZE);

            await createRetailPrice({
              variables: {
                tokenized,
              },
            });

            // for (const record of formData.records) {
            //   const tokenizedPayload = {
            //     monthYear: formData.monthYear,
            //     ...record,
            //     bruneiMuaraPrice: lodash.round(
            //       record?.bruneiMuaraPrice || 0,
            //       2
            //     ),
            //     tutongPrice: lodash.round(record?.tutongPrice || 0, 2),
            //     belaitPrice: lodash.round(record?.belaitPrice || 0, 2),
            //     temburongPrice: lodash.round(record?.temburongPrice || 0, 2),
            //   };

            //   const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

            // await createRetailPrice({
            //   variables: {
            //     // monthYear: formData.monthYear,
            //     // ...record,
            //     // bruneiMuaraPrice: parseFloat(record?.bruneiMuaraPrice || 0),
            //     // tutongPrice: parseFloat(record?.tutongPrice || 0),
            //     // belaitPrice: parseFloat(record?.belaitPrice || 0),
            //     // temburongPrice: parseFloat(record?.temburongPrice || 0),
            //     tokenized,
            //   },
            // });
            // }

            await refetch();
            setSavedCount((savedCount += 1));
            setModalVisible(false);
            setFormData({
              records: [],
            });
            setModalVisible(true);

            notification.addNotification({
              title: "Success!",
              message: `Retail price saved`,
              level: "success",
            });
          } catch (error) {
            notification.handleError(error);
          }
          hideLoadingSpinner();
        }}
      >
        <div className={formData.records.length < 4 ? "h-[25rem]" : "h-auto"}>
          <div className="form-group">
            <label>Month & Year*</label>
            <input
              required
              type="month"
              className="form-control w-1/4"
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
          <button
            className="bg-mantis-500 px-4 py-2 text-white text-md rounded-md shadow-md mb-4"
            onClick={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                records: [
                  ...formData.records,
                  {
                    uuid: uuidv4(),
                    listCommodityDetails: [],
                  },
                ],
              });
            }}
          >
            <i className="fa fa-plus" /> Add New
          </button>

          <div className="grid grid-cols-8">
            <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
              Commodity
            </div>
            <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
              Sub Commodity
            </div>
            <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
              Unit
            </div>
            <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
              Brunei Muara Retail Price ($)
            </div>
            <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
              Tutong Retail Price ($)
            </div>
            <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
              Belait Retail Price ($)
            </div>
            <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
              Temburong Retail Price ($)
            </div>
            <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
              {}
            </div>
          </div>

          {formData.records.map((rec) => (
            <div className="grid grid-cols-8 gap-2 my-2">
              <div>
                {/* <AsyncSelect
                  loadOptions={getCommodities}
                  classNamePrefix="Select"
                  noOptionsMessage={() => "Type To Search"}
                  getOptionLabel={(options) => options.name.toUpperCase()}
                  getOptionValue={(options) => options.uuid}
                  autoFocus={true}
                  value={rec.LivestockCommodity || ""}
                  onChange={async (selectedValues) => {
                    const tokenizedPayload = {
                      livestockCommodityUUID: selectedValues.uuid,
                    };
                    let founds;
                    const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
                    const found = await client.query({
                      query: GET_LIVESTOCK_DETAIL,
                      variables: {
                        // livestockCommodityUUID: selectedValues.value,
                        tokenizedParams: tokenized,
                      },
                    });
                    const encryptedLivestockCommodityDetails =
                      found.data.tokenizedAllLivestockCommodityDetails || "";
                    if (encryptedLivestockCommodityDetails) {
                      const decrypted = jwt.verify(
                        encryptedLivestockCommodityDetails,
                        TOKENIZE
                      );
                      founds = decrypted.queryResult;
                    }
                    setFormData({
                      ...formData,
                      records: formData.records.map((re) =>
                        re.uuid !== rec.uuid
                          ? re
                          : {
                              ...rec,
                              name: selectedValues.name.toUpperCase(),
                              livestockCommodityUUID: selectedValues.uuid,
                              listCommodityDetails: founds,
                              LivestockCommodity: selectedValues,
                              livestockCommodityDetailUUID: "",
                              detailName: "",
                            }
                      ),
                    });
                  }}
                /> */}
                <Select
                  value={{
                    value: rec.livestockCommodityUUID,
                    label: rec.name,
                  }}
                  required
                  options={availableOptions.map((pr) => {
                    return {
                      value: pr.uuid,
                      label: `${pr.name.toUpperCase()}`,
                    };
                  })}
                  classNamePrefix="select"
                  onChange={async (selectedValues) => {
                    const tokenizedPayload = {
                      livestockCommodityUUID: selectedValues.value,
                    };
                    let founds;
                    const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
                    const found = await client.query({
                      query: GET_LIVESTOCK_DETAIL,
                      variables: {
                        // livestockCommodityUUID: selectedValues.value,
                        tokenizedParams: tokenized,
                      },
                    });
                    const encryptedLivestockCommodityDetails =
                      found.data.tokenizedAllLivestockCommodityDetails || "";
                    if (encryptedLivestockCommodityDetails) {
                      const decrypted = jwt.verify(
                        encryptedLivestockCommodityDetails,
                        TOKENIZE
                      );
                      founds = decrypted.queryResult;
                    }
                    setFormData({
                      ...formData,
                      records: formData.records.map((re) =>
                        re.uuid !== rec.uuid
                          ? re
                          : {
                              ...rec,
                              name: selectedValues.label,
                              livestockCommodityUUID: selectedValues.value,
                              listCommodityDetails: founds,

                              livestockCommodityDetailUUID: "",
                              detailName: "",
                            }
                      ),
                    });
                    setSelectedCommodity({
                      value: selectedValues.value,
                      label: selectedValues.label,
                    });
                  }}
                />
              </div>
              <div>
                <Select
                  value={{
                    value: rec.livestockCommodityDetailUUID,
                    label: rec.detailName,
                  }}
                  required
                  options={rec.listCommodityDetails.map((pr) => {
                    return {
                      value: pr.uuid,
                      label: `${pr.name.toUpperCase()}`,
                    };
                  })}
                  classNamePrefix="select"
                  onChange={async (selectedValues) => {
                    const found = rec.listCommodityDetails.find(
                      (p) => p.uuid === selectedValues.value
                    );

                    setFormData({
                      ...formData,
                      records: formData.records.map((re) =>
                        re.uuid !== rec.uuid
                          ? re
                          : {
                              ...rec,
                              livestockCommodityDetailUUID:
                                selectedValues.value,
                              unit: (found?.Unit?.name || "").toUpperCase(),
                              detailName: selectedValues.label.toUpperCase(),
                            }
                      ),
                    });
                    setSelectedCommodityDetail([
                      {
                        label: selectedValues.label.toUpperCase(),
                        value: selectedValues.value,
                      },
                    ]);
                  }}
                />
              </div>
              <div>
                <input
                  className="form-control"
                  value={(rec.unit || "").toUpperCase()}
                  disabled
                />
              </div>

              <div>
                <NumberFormat
                  className="form-control"
                  value={rec.bruneiMuaraPrice || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  decimalScale={2}
                  fixedDecimalScale={true}
                  onValueChange={(e) => {
                    // if (e) e.preventDefault();
                    setFormData({
                      ...formData,
                      records: formData.records.map((re) =>
                        rec.uuid !== re.uuid
                          ? re
                          : {
                              ...rec,
                              bruneiMuaraPrice: e.floatValue || 0,
                            }
                      ),
                    });
                  }}
                />
              </div>

              <div>
                <NumberFormat
                  className="form-control"
                  value={rec.tutongPrice || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  decimalScale={2}
                  fixedDecimalScale={true}
                  onValueChange={(e) => {
                    // if (e) e.preventDefault();
                    setFormData({
                      ...formData,
                      records: formData.records.map((re) =>
                        rec.uuid !== re.uuid
                          ? re
                          : {
                              ...rec,
                              tutongPrice: e.floatValue || 0,
                            }
                      ),
                    });
                  }}
                />
              </div>

              <div>
                <NumberFormat
                  className="form-control"
                  value={rec.belaitPrice || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  decimalScale={2}
                  fixedDecimalScale={true}
                  onValueChange={(e) => {
                    // if (e) e.preventDefault();
                    setFormData({
                      ...formData,
                      records: formData.records.map((re) =>
                        rec.uuid !== re.uuid
                          ? re
                          : {
                              ...rec,
                              belaitPrice: e.floatValue || 0,
                            }
                      ),
                    });
                  }}
                />
              </div>

              <div>
                <NumberFormat
                  className="form-control"
                  value={rec.temburongPrice || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  decimalScale={2}
                  fixedDecimalScale={true}
                  onValueChange={(e) => {
                    // if (e) e.preventDefault();
                    setFormData({
                      ...formData,
                      records: formData.records.map((re) =>
                        rec.uuid !== re.uuid
                          ? re
                          : {
                              ...rec,
                              temburongPrice: e.floatValue || 0,
                            }
                      ),
                    });
                  }}
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
        </div>
      </FormModal>

      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        {importForm ? (
          <button
            className="bg-blue-500 text-white text-sm px-4 py-2 shadow-md rounded-md"
            onClick={(e) => {
              if (e) e.preventDefault();
              setImportForm(!importForm);
              setSavedCount((savedCount += 1));
            }}
          >
            <i className="fa fa-arrow-left" /> Back
          </button>
        ) : (
          <button
            className="bg-mantis-500 text-white text-sm px-4 py-2 shadow-md rounded-md"
            onClick={(e) => {
              if (e) e.preventDefault();
              setImportForm(!importForm);
            }}
          >
            <i className="fa fa-save" /> Import File
          </button>
        )}

        {importForm ? (
          <RetailPriceLiveStockImport />
        ) : (
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
                    className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
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
            data={allRetailPrices}
            withoutHeader={true}
            controlledFilters={filters}
            controlledPageIndex={pageIndex}
            controlledPageCount={pageCount}
            controlledPageSize={pageSize}
            onPageChange={handlePageChange}
            customUtilitiesPosition="left"
            customUtilities={
              !currentUserDontHavePrivilege(["Retail Price Livestock:Update"])
                ? customUtilities
                : null
            }
            onAdd={
              !currentUserDontHavePrivilege(["Retail Price Livestock:Create"])
                ? () => {
                    setFormData({
                      records: [],
                    });
                    setModalVisible(true);
                  }
                : null
            }
            onRemove={
              !currentUserDontHavePrivilege(["Retail Price Livestock:Delete"])
                ? async ({ rows }) => {
                    showLoadingSpinner();
                    try {
                      let yes = confirm(
                        `Are you sure to delete ${rows.length} retial prices?`
                      );
                      if (yes) {
                        for (const row of rows) {
                          await deleteRetailPrice({
                            variables: {
                              uuid: row.uuid,
                            },
                          });
                        }
                        notification.addNotification({
                          title: "Success!",
                          message: `${rows.length} retial prices deleted`,
                          level: "success",
                        });
                        await refetch();
                        setSavedCount((savedCount += 1));
                      }
                    } catch (err) {
                      handleError(err);
                    }
                    hideLoadingSpinner();
                  }
                : null
            }
          />
        )}
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(RetailPrice);
