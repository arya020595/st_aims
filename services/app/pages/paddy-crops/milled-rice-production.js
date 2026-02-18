import React, { useState, useEffect, useMemo, useCallback } from "react";
import { withApollo } from "../../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../../components/App";
import { useNotification } from "../../components/Notification";
import { handleError } from "../../libs/errors";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import TableAsync from "../../components/TableAsync";
import Table from "../../components/Table";
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
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";
import { MonthAndYearsFilterWithExport } from "../../components/MonthAndYearsFilterWithExport";
import lodash from "lodash";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERIES = gql`
  query listQueries($monthYear: String!, $filters: String) {
    countAllMilledRiceProductions(monthYear: $monthYear, filters: $filters)

    tokenizedAllCropsPaddyByProducts

    tokenizedAllMilledRiceLocations

    tokenizedAllCropsPaddyVarieties
  }
`;

const MILLED_RICE_PRODUCTION_QUERY = gql`
  query productionQuery(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllMilledRiceProductions(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllMilledRiceProductions(monthYear: $monthYear, filters: $filters)
  }
`;

const GET_MILLED_RICE_PRODUCTION_DETAILS = gql`
  query allMilledRiceProductionDetailsByProductionUUID(
    $milledRiceProductionUUID: String!
  ) {
    allMilledRiceProductionDetailsByProductionUUID(
      milledRiceProductionUUID: $milledRiceProductionUUID
    ) {
      uuid
      ByProduct {
        uuid
        typeOfByProduct
        typeOfByProductId
        price
      }
      weight
      price
      totalValue

      createdAt
      updatedAt
    }
  }
`;

const CREATE_MILLED_RICE_PRODUCTION = gql`
  mutation tokenizedCreateMilledRiceProduction($tokenized: String!) {
    tokenizedCreateMilledRiceProduction(tokenized: $tokenized)
  }
`;

const UPDATE_MILLED_RICE_PRODUCTION = gql`
  mutation tokenizedUpdateMilledRiceProduction($tokenized: String!) {
    tokenizedUpdateMilledRiceProduction(tokenized: $tokenized)
  }
`;

const DELETE_MILLED_RICE_PRODUCTION = gql`
  mutation tokenizedDeleteMilledRiceProduction($tokenized: String!) {
    tokenizedDeleteMilledRiceProduction(tokenized: $tokenized)
  }
`;

const CREATE_MILLED_RICE_PRODUCTION_DETAIL = gql`
  mutation createMilledRiceProductionDetail(
    $date: String
    $milledRiceProductionUUID: String!
    $cropsPaddyByProductUUID: String
    $weight: Float
    $price: Float
    $totalValue: Float
  ) {
    createMilledRiceProductionDetail(
      date: $date
      milledRiceProductionUUID: $milledRiceProductionUUID
      cropsPaddyByProductUUID: $cropsPaddyByProductUUID
      weight: $weight
      price: $price
      totalValue: $totalValue
    )
  }
`;

const UPDATE_MILLED_RICE_PRODUCTION_DETAIL = gql`
  mutation updateMilledRiceProductionDetail(
    $uuid: String!
    $date: String
    $milledRiceProductionUUID: String
    $cropsPaddyByProductUUID: String
    $weight: Float
    $price: Float
    $totalValue: Float
  ) {
    updateMilledRiceProductionDetail(
      uuid: $uuid
      date: $date
      milledRiceProductionUUID: $milledRiceProductionUUID
      cropsPaddyByProductUUID: $cropsPaddyByProductUUID
      weight: $weight
      price: $price
      totalValue: $totalValue
    )
  }
`;

const DELETE_MILLED_RICE_PRODUCTION_DETAIL = gql`
  mutation deleteMilledRiceProductionDetail($uuid: String!) {
    deleteMilledRiceProductionDetail(uuid: $uuid)
  }
`;

const EXPORT_MILLED_RICE_PRODUCTION = gql`
  mutation exportMilledRiceProduction(
    $monthYear: String!
    $cropsPaddyVarietyUUID: String
    $store: String
    $millingLocationUUID: String
    $batchNumber: String
  ) {
    exportMilledRiceProduction(
      monthYear: $monthYear
      cropsPaddyVarietyUUID: $cropsPaddyVarietyUUID
      store: $store
      millingLocationUUID: $millingLocationUUID
      batchNumber: $batchNumber
    )
  }
`;

const page = () => {
  const router = useRouter();
  const client = useApolloClient();
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [listDetails, setListDetails] = useState([]);
  const [existedDetails, setExistedDetails] = useState([]);
  const [exportFormData, setExportFormData] = useState({});
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  let [savedCount, setSavedCount] = useState(0);

  const [detailFormData, setDetailFormData] = useState({});
  const [detailVisible, setDetailVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERIES, {
    variables: {
      monthYear: yearMonth,
      filters: router.query.filters,
    },
  });
  const [exportMilledRiceProduction] = useMutation(
    EXPORT_MILLED_RICE_PRODUCTION
  );
  const [createMilledRiceProduction] = useMutation(
    CREATE_MILLED_RICE_PRODUCTION
  );
  const [updateMilledRiceProduction] = useMutation(
    UPDATE_MILLED_RICE_PRODUCTION
  );
  const [deleteMilledRiceProduction] = useMutation(
    DELETE_MILLED_RICE_PRODUCTION
  );

  const [createMilledRiceProductionDetail] = useMutation(
    CREATE_MILLED_RICE_PRODUCTION_DETAIL
  );
  const [updateMilledRiceProductionDetail] = useMutation(
    UPDATE_MILLED_RICE_PRODUCTION_DETAIL
  );
  const [deleteMilledRiceProductionDetail] = useMutation(
    DELETE_MILLED_RICE_PRODUCTION_DETAIL
  );

  const [selectedPaddy, setSelectedPaddy] = useState({});

  const [selectedCompany, setSelectedCompany] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const [selectedMillingLocation, setSelectedMillingLocation] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const [selectedByProduct, setSelectedByProduct] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const [allMilledRiceProductions, setAllMilledRiceProductions] = useState([]);
  const [allCropsPaddyVarieties, setAllCropsPaddyVarieties] = useState([]);
  const [allCropsPaddyByProducts, setAllCropsPaddyByProducts] = useState([]);
  const [allMilledRiceLocations, setAllMilledRiceLocations] = useState([]);
  let [countMilledRiceProductions, setCountMilledRiceProductions] = useState(0);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedMilledRiceProductions = data?.tokenizedAllMilledRiceProductions || "";
      // let allMilledRiceProductions = [];
      // if (encryptedMilledRiceProductions) {
      //   const decrypted = jwt.verify(encryptedMilledRiceProductions, TOKENIZE);
      //   allMilledRiceProductions = decrypted.queryResult;
      //   setAllMilledRiceProductions(allMilledRiceProductions);
      // }

      const encryptedCropsPaddyVarieties =
        data?.tokenizedAllCropsPaddyVarieties || "";
      let allCropsPaddyVarieties = [];
      if (encryptedCropsPaddyVarieties) {
        const decrypted = jwt.verify(encryptedCropsPaddyVarieties, TOKENIZE);
        allCropsPaddyVarieties = decrypted.queryResult;
        setAllCropsPaddyVarieties(allCropsPaddyVarieties);
      }

      const encryptedCropsPaddyByProducts =
        data?.tokenizedAllCropsPaddyByProducts || "";
      let allCropsPaddyByProducts = [];
      if (encryptedCropsPaddyByProducts) {
        const decrypted = jwt.verify(encryptedCropsPaddyByProducts, TOKENIZE);
        allCropsPaddyByProducts = decrypted.queryResult;
        setAllCropsPaddyByProducts(allCropsPaddyByProducts);
      }

      const encryptedMilledRiceLocations =
        data?.tokenizedAllMilledRiceLocations || "";
      let allMilledRiceLocations = [];
      if (encryptedMilledRiceLocations) {
        const decrypted = jwt.verify(encryptedMilledRiceLocations, TOKENIZE);
        allMilledRiceLocations = decrypted.queryResult;
        setAllMilledRiceLocations(allMilledRiceLocations);
      }

      const countData = data?.countAllMilledRiceProductions || 0;
      setCountMilledRiceProductions(countData);
    }
  }, [data, loading, error, savedCount]);

  // const encryptedMilledRiceProductions =
  //   data?.tokenizedAllMilledRiceProductions || "";
  // let allMilledRiceProductions = [];
  // if (encryptedMilledRiceProductions) {
  //   const decrypted = jwt.verify(encryptedMilledRiceProductions, TOKENIZE);
  //   allMilledRiceProductions = decrypted.queryResult;
  // }

  // const encryptedPaddyVarieties = data?.tokenizedAllCropsPaddyVarieties || "";
  // let allCropsPaddyVarieties = [];
  // if (encryptedPaddyVarieties) {
  //   const decrypted = jwt.verify(encryptedPaddyVarieties, TOKENIZE);
  //   allCropsPaddyVarieties = decrypted.queryResult;
  // }

  // const encryptedCropsPaddyByProducts =
  //   data?.tokenizedAllCropsPaddyByProducts || "";
  // let allCropsPaddyByProducts = [];
  // if (encryptedCropsPaddyByProducts) {
  //   const decrypted = jwt.verify(encryptedCropsPaddyByProducts, TOKENIZE);
  //   allCropsPaddyByProducts = decrypted.queryResult;
  // }

  // const encryptedMilledRiceLocations =
  //   data?.tokenizedAllMilledRiceLocations || "";
  // let allMilledRiceLocations = [];
  // if (encryptedMilledRiceLocations) {
  //   const decrypted = jwt.verify(encryptedMilledRiceLocations, TOKENIZE);
  //   allMilledRiceLocations = decrypted.queryResult;
  // }

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countMilledRiceProductions) return 1;
    return Math.ceil(countMilledRiceProductions / pageSize);
  }, [countMilledRiceProductions, pageSize]);

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

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: MILLED_RICE_PRODUCTION_QUERY,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedMilledRiceProductions =
      result.data?.tokenizedAllMilledRiceProductions || "";
    let allMilledRiceProductions = [];
    if (encryptedMilledRiceProductions) {
      const decrypted = jwt.verify(encryptedMilledRiceProductions, TOKENIZE);
      allMilledRiceProductions = decrypted.queryResult;
      setAllMilledRiceProductions(allMilledRiceProductions);
    }

    const countData = result.data?.countAllMilledRiceProductions || 0;
    setCountMilledRiceProductions(countData);

    hideLoadingSpinner();
  }, [savedCount, yearMonth, pageSize, pageIndex]);

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
                const getDetail = await fetchDetails(props.row.original.uuid);

                setExistedDetails(getDetail);
                setModalVisible(true);
                setFormData({
                  ...props.row.original,
                  cropsPaddyVarietyUUID: props.row.original?.Paddy?.uuid || "",
                  millingLocationUUID:
                    props.row.original?.MilledRiceLocation?.uuid || "",
                });

                setSelectedPaddy([
                  {
                    value: props.row.original?.Paddy?.uuid || "",
                    label: props.row.original?.Paddy?.varietyName || "",
                  },
                ]);
                setSelectedMillingLocation([
                  {
                    value: props.row.original?.MilledRiceLocation?.uuid || "",
                    label:
                      props.row.original?.MilledRiceLocation?.location || "",
                  },
                ]);

                setListDetails(
                  getDetail.map((det) => {
                    return {
                      ...det,

                      typeOfByProductId: det.ByProduct?.typeOfByProductId || "",
                    };
                  })
                );
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

  useEffect(() => {
    const totalBrokenRice =
      formData.brokenRiceNoOfSacks * formData.brokenRiceKgSacks;

    const totalHeadRice = formData.headRiceNoOfSacks * formData.headRiceKgSacks;

    setFormData({
      ...formData,
      totalPaddy: formData.paddyKgSacks * formData.paddyNoOfSacks,
      totalBrokenRice,
      brokenRiceTotalValue: formData.brokenRicePricePerKg * totalBrokenRice,
      totalHeadRice,
      headRiceTotalValue: totalHeadRice * formData.headRicePricePerKg,
    });
  }, [
    formData.paddyNoOfSacks,
    formData.paddyKgSacks,

    formData.brokenRiceNoOfSacks,
    formData.brokenRiceKgSacks,
    formData.brokenRicePricePerKg,

    formData.headRiceNoOfSacks,
    formData.headRiceKgSacks,
    formData.headRicePricePerKg,
  ]);

  const columns = useMemo(() => [
    {
      Header: "Planting Month & Year",
      accessor: "date",
      style: {
        fontSize: 20,
        width: 250,
      },
      disableFilters: true,
      Cell: (props) => <span>{dayjs(props.value).format("YYYY-MM")}</span>,
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
      Header: "Store",
      accessor: "store",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Milling Location",
      accessor: "MilledRiceLocation.location",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Batch No.",
      accessor: "batchNumber",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "No. Of Sacks (Paddy)",
      accessor: "paddyNoOfSacks",
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
      Header: "Kg/Sack (Paddy)",
      accessor: "paddyKgSacks",
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
      Header: "Total Paddy (Kg)",
      accessor: "totalPaddy",
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
      Header: "No. of Sacks (Broken Rice)",
      accessor: "brokenRiceNoOfSacks",
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
      Header: "Kg/Sack (Broken Rice)",
      accessor: "brokenRiceKgSacks",
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
      Header: "Total Broken Rice (Kg)",
      accessor: "totalBrokenRice",
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
      Header: "Total Value Broken Rice",
      accessor: "brokenRiceTotalValue",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => (
        <span>
          {Number(props.value)
            .toFixed(2)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "No. of Sacks (Head Rice)",
      accessor: "headRiceNoOfSacks",
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
      Header: "Kg/Sack (Head Rice)",
      accessor: "headRiceKgSacks",
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
      Header: "Total Head Rice (Kg)",
      accessor: "totalHeadRice",
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

  const columnsDetail = useMemo(() => [
    {
      Header: "Type of By Products",
      accessor: "ByProduct.typeOfByProduct",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "By Product ID",
      accessor: "ByProduct.typeOfByProductId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Weight (Kg)",
      accessor: "weight",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Price / Kg",
      accessor: "price",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Total Value ($)",
      accessor: "totalValue",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "",
      accessor: "uuid",
      style: {
        fontSize: 20,
      },
      filterable: false,
      Cell: (props) => (
        <div>
          <button
            className="bg-yellow-500 px-4 py-2 rounded-md text-white text-md mx-2"
            onClick={(e) => {
              if (e) e.preventDefault();

              setDetailVisible(true);
              setSelectedByProduct([
                {
                  value: props.row.original.ByProduct.uuid,
                  label: props.row.original.ByProduct.typeOfByProduct,
                },
              ]);
              setDetailFormData({
                ...props.row.original,
                status: "Edit",
                typeOfByProductId:
                  props.row.original.ByProduct.typeOfByProductId,
              });
            }}
          >
            <i className="fa fa-edit" />
          </button>
        </div>
      ),
    },
  ]);
  const fetchDetails = async (productionUUID) => {
    if (productionUUID) {
      const result = await client.query({
        query: GET_MILLED_RICE_PRODUCTION_DETAILS,
        variables: {
          milledRiceProductionUUID: productionUUID,
        },
        fetchPolicy: "no-cache",
      });

      return result.data.allMilledRiceProductionDetailsByProductionUUID;
    } else {
      return null;
    }
  };

  return (
    <AdminArea
      header={{ title: "Milled Rice Production" }}
      urlQuery={router.query}
    >
      <FormModal
        title={`Export Production`}
        visible={exportModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setExportModalVisible(false);
          setExportFormData({});
          setSelectedMillingLocation([]);
          setSelectedPaddy([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setExportModalVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportMilledRiceProduction({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            // Convert base64 to blob
            const base64Response = response.data.exportMilledRiceProduction;
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
            link.download = "milled_rice_production.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);

            // window.open(response.data.exportMilledRiceProduction, "__blank");
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

          <div className="form-group">
            <label>Store</label>
            <input
              className="form-control"
              value={exportFormData.store || ""}
              onChange={(e) => {
                setExportFormData({
                  ...exportFormData,
                  store: e.target.value,
                });
              }}
            />
          </div>

          <div className="form-group">
            <label>Milling Location</label>
            <Select
              isClearable={true}
              value={selectedMillingLocation}
              options={allMilledRiceLocations.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.location,
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allMilledRiceLocations.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  millingLocationUUID: found?.uuid || "",
                });

                setSelectedMillingLocation([
                  {
                    value: found?.uuid || "",
                    label: found?.location || "",
                  },
                ]);
              }}
            />
          </div>

          <div className="form-group ">
            <label>Batch Number</label>
            <input
              className="form-control"
              value={exportFormData.batchNumber || ""}
              onChange={(e) => {
                setExportFormData({
                  ...exportFormData,
                  batchNumber: e.target.value,
                });
              }}
            />
          </div>

          <br />
          <br />
        </div>
      </FormModal>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Milled Rice Production`}
        size="lg"
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            record: [],
          });
          setSelectedMillingLocation([]);
          setSelectedPaddy([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            if (!formData.uuid) {
              if (detailFormData.length === 0) {
                throw {
                  message: "Details not inserted",
                };
              }

              const formDataPayload = {
                ...formData,
                headRicePricePerKg: parseFloat(formData.headRicePricePerKg),
                brokenRicePricePerKg: parseFloat(formData.brokenRicePricePerKg),
              };

              const tokenized = jwt.sign(formDataPayload, TOKENIZE);
              const production = await createMilledRiceProduction({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });
              for (const detail of listDetails) {
                await createMilledRiceProductionDetail({
                  variables: {
                    date: formData.date,
                    milledRiceProductionUUID:
                      production.data.tokenizedCreateMilledRiceProduction,
                    ...detail,
                  },
                });
              }
              setSavedCount((savedCount += 1));
              notification.addNotification({
                title: "Succeess!",
                message: `Detail Added`,
                level: "success",
              });

              await refetch();
              setListDetails([]);

              setDetailFormData({
                uuid: uuid(),
                weight: 0,
                price: 0,
                totalValue: 0,
              });
              setDetailVisible(true);
              setSelectedByProduct([]);

              setModalVisible(false);
              setFormData({});
              setModalVisible(true);
              setSavedCount((savedCount += 1));
            } else {
              for (const det of listDetails) {
                const found = existedDetails.find(
                  (ext) => ext.uuid === det.uuid
                );

                if (!found) {
                  await createMilledRiceProductionDetail({
                    variables: {
                      ...det,
                      milledRiceProductionUUID: formData.uuid,
                      date: formData.date,
                    },
                  });
                } else {
                  await updateMilledRiceProductionDetail({
                    variables: {
                      ...det,
                      milledRiceProductionUUID: formData.uuid,
                      date: formData.date,
                    },
                  });
                }
              }

              const formDataPayload = {
                ...formData,
                headRicePricePerKg: parseFloat(formData.headRicePricePerKg),
                brokenRicePricePerKg: parseFloat(formData.brokenRicePricePerKg),
              };

              const tokenized = jwt.sign(formDataPayload, TOKENIZE);
              await updateMilledRiceProduction({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
              notification.addNotification({
                title: "Succeess!",
                message: `Data Saved`,
                level: "success",
              });
              setModalVisible(false);
              setFormData({});
            }
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
      >
        {/* <div className="form-group">
          <label>Date*</label>
          <input
            type="date"
            required
            className="form-control w-1/2"
            value={formData.date || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                date: e.target.value,
              });
            }}
          />
        </div> */}
        {/* <div className="grid grid-cols-2 gap-x-5">
          <div>
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
                className={`form-control`}
                classNamePrefix="select"
                onChange={(selectedValues) => {
                  // console.log({ selectedValues });

                  const found = allCropsPaddyVarieties.find(
                    (profile) => profile.uuid === selectedValues.value
                  );
                  setFormData({
                    ...formData,
                    cropsPaddyVarietyUUID: found.uuid,
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
            <div className="form-group mb-2">
              <label>Milling Location</label>
              <Select
                value={selectedMillingLocation}
                options={allMilledRiceLocations.map((prof) => {
                  return {
                    value: prof.uuid,
                    label: prof.location,
                  };
                })}
                className={`form-control`}
                classNamePrefix="select"
                onChange={(selectedValues) => {
                  // console.log({ selectedValues });

                  const found = allMilledRiceLocations.find(
                    (profile) => profile.uuid === selectedValues.value
                  );
                  setFormData({
                    ...formData,
                    millingLocationUUID: found.uuid,
                  });

                  setSelectedMillingLocation([
                    {
                      value: found.uuid,
                      label: found.location,
                    },
                  ]);
                }}
              />
            </div>
          </div>
          <div>
            <div className="form-group">
              <label>Store</label>
              <input
                className="form-control"
                value={formData.store || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    store: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group mb-2">
              <label>Batch Number</label>
              <input
                className="form-control"
                value={formData.batchNumber || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    batchNumber: e.target.value,
                  });
                }}
              />
            </div>
          </div>
        </div> */}
        {/* <div className="grid grid-cols-2 gap-x-5">
          <div>
            <div className="font-bold">
              <label>Paddy</label>
            </div>
            <div className="form-group">
              <label>No. of Sacks</label>
              <NumberFormat
                className="form-control"
                placeholder="0"
                value={formData.paddyNoOfSacks || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    paddyNoOfSacks: e.floatValue || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Kg/Sacks</label>
              <select
                className="form-control"
                value={formData.paddyKgSacks || 0}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    paddyKgSacks: parseInt(e.target.value),
                  });
                }}
              >
                <option value={0} disabled>
                  Select Kg/Sacks
                </option>
                <option value={5}>5 Kg</option>
                <option value={10}>10 Kg</option>
                <option value={25}>25 Kg</option>
                <option value={30}>30 Kg</option>
                <option value={35}>35 Kg</option>
                <option value={50}>50 Kg</option>
              </select>
            </div>
            <div className="form-group">
              <label>Total Paddy (Kg)</label>
              <NumberFormat
                className="form-control"
                disabled
                placeholder="Auto Calculated"
                value={formData.totalPaddy || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
              />
            </div>
          </div>
          <div>
            <div className="font-bold">
              <label>Beras Pecah/Broken Rice</label>
            </div>
            <div className="form-group">
              <label>No. of Sacks</label>
              <NumberFormat
                placeholder="0"
                className="form-control"
                value={formData.brokenRiceNoOfSacks || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    brokenRiceNoOfSacks: e.floatValue || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Kg/Sacks</label>
              <select
                className="form-control"
                value={formData.brokenRiceKgSacks || 0}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    brokenRiceKgSacks: parseInt(e.target.value),
                  });
                }}
              >
                <option value={0} disabled>
                  Select Kg/Sacks
                </option>
                <option value={5}>5 Kg</option>
                <option value={10}>10 Kg</option>
                <option value={25}>25 Kg</option>
                <option value={30}>30 Kg</option>
                <option value={35}>35 Kg</option>
                <option value={50}>50 Kg</option>
              </select>
            </div>
            <div className="form-group">
              <label>Price/Kg</label>
              <NumberFormat
                className="form-control"
                value={formData.brokenRicePricePerKg || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    brokenRicePricePerKg: e.floatValue || 0,
                  });
                }}
              />
            </div>
            <div />
            <div className="form-group">
              <label>Total (Kg)</label>
              <NumberFormat
                className="form-control"
                disabled
                placeholder="Auto Calculated"
                value={formData.totalBrokenRice || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
              />
            </div>
            <div></div>
            <div className="form-group">
              <label>Total Value</label>
              <NumberFormat
                className="form-control"
                disabled
                placeholder="Auto Calculated"
                value={formData.brokenRiceTotalValue || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
              />
            </div>
          </div>
        </div> */}
        {/* <div className="font-bold mt-5 flex items-center">
          <label>Beras Bulat/Head Rice</label>
        </div>
        <div className="form-group w-1/2">
          <label>No. of Sacks</label>
          <NumberFormat
            className="form-control"
            placeholder="0"
            value={formData.headRiceNoOfSacks || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                headRiceNoOfSacks: e.floatValue || 0,
              });
            }}
          />
        </div>
        <div className="form-group  w-1/2">
          <label>kg/Sacks</label>
          <select
            className="form-control"
            value={formData.headRiceKgSacks || 0}
            onChange={(e) => {
              setFormData({
                ...formData,
                headRiceKgSacks: parseInt(e.target.value),
              });
            }}
          >
            <option value={0} disabled>
              Select Kg/Sacks
            </option>
            <option value={5}>5 Kg</option>
            <option value={10}>10 Kg</option>
            <option value={25}>25 Kg</option>
            <option value={30}>30 Kg</option>
            <option value={35}>35 Kg</option>
            <option value={50}>50 Kg</option>
          </select>
        </div>
        <div className="form-group  w-1/2">
          <label>Price/Kg</label>
          <NumberFormat
            className="form-control"
            value={formData.headRicePricePerKg || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            decimalScale={2}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                headRicePricePerKg: e.floatValue || 0,
              });
            }}
          />
        </div>
        <div className="form-group  w-1/2">
          <label>Total (Kg)</label>
          <NumberFormat
            className="form-control"
            disabled
            placeholder="Auto Calculated"
            value={formData.totalHeadRice || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            decimalScale={2}
          />
        </div>
        <div className="form-group  w-1/2">
          <label>Total Value</label>
          <NumberFormat
            className="form-control"
            disabled
            placeholder="Auto Calculated"
            value={formData.headRiceTotalValue || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            decimalScale={2}
          />
        </div> */}

        <div>
          <div className="form-group">
            <label>Date*</label>
            <input
              type="date"
              required
              className="form-control uppercase"
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
            <label>Store</label>
            <input
              className="form-control "
              value={formData.store || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  store: e.target.value.toUpperCase(),
                });
              }}
            />
          </div>
          <div className="form-group mb-2">
            <label>Batch Number</label>
            <input
              className="form-control "
              value={formData.batchNumber || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  batchNumber: e.target.value.toUpperCase(),
                });
              }}
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
          <div className="form-group mb-2">
            <label>Milling Location</label>
            <Select
              value={selectedMillingLocation}
              options={allMilledRiceLocations.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.location,
                };
              })}
              className={`form-control uppercase`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allMilledRiceLocations.find(
                  (profile) => profile.uuid === selectedValues.value
                );
                setFormData({
                  ...formData,
                  millingLocationUUID: found.uuid,
                });

                setSelectedMillingLocation([
                  {
                    value: found.uuid,
                    label: found.location,
                  },
                ]);
              }}
            />
          </div>
          <hr className="bg-gray-200 h-1 mb-2" />
          <div className="font-bold">
            <label>Paddy</label>
          </div>
          <div className="form-group">
            <label>No. of Sacks</label>
            <NumberFormat
              className="form-control"
              placeholder="0"
              value={formData.paddyNoOfSacks || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  paddyNoOfSacks: e.floatValue || 0,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Kg/Sacks</label>
            <select
              className="form-control"
              value={formData.paddyKgSacks || 0}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  paddyKgSacks: parseInt(e.target.value),
                });
              }}
            >
              <option value={0} disabled>
                Select Kg/Sacks
              </option>
              <option value={5}>5 Kg</option>
              <option value={10}>10 Kg</option>
              <option value={25}>25 Kg</option>
              <option value={30}>30 Kg</option>
              <option value={35}>35 Kg</option>
              <option value={50}>50 Kg</option>
            </select>
          </div>
          <div className="form-group">
            <label>Total Paddy (Kg)</label>
            <NumberFormat
              className="form-control"
              disabled
              placeholder="Auto Calculated"
              value={formData.totalPaddy || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              decimalScale={2}
            />
          </div>
          <hr className="bg-gray-200 h-1 mb-2" />
          <div className="font-bold mt-5 flex items-center">
            <label>Beras Bulat/Head Rice</label>
          </div>
          <div className="form-grou">
            <label>No. of Sacks</label>
            <NumberFormat
              className="form-control"
              placeholder="0"
              value={formData.headRiceNoOfSacks || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  headRiceNoOfSacks: e.floatValue || 0,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>kg/Sacks</label>
            <select
              className="form-control"
              value={formData.headRiceKgSacks || 0}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  headRiceKgSacks: parseInt(e.target.value),
                });
              }}
            >
              <option value={0} disabled>
                Select Kg/Sacks
              </option>
              <option value={5}>5 Kg</option>
              <option value={10}>10 Kg</option>
              <option value={25}>25 Kg</option>
              <option value={30}>30 Kg</option>
              <option value={35}>35 Kg</option>
              <option value={50}>50 Kg</option>
            </select>
          </div>
          <div className="form-group">
            <label>Price/Kg</label>
            <NumberFormat
              className="form-control"
              value={formData.headRicePricePerKg || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              decimalScale={2}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  headRicePricePerKg: e.formattedValue || 0,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Total (Kg)</label>
            <NumberFormat
              className="form-control"
              disabled
              placeholder="Auto Calculated"
              value={formData.totalHeadRice || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              decimalScale={2}
            />
          </div>
          <div className="form-group">
            <label>Total Value</label>
            <NumberFormat
              className="form-control"
              disabled
              placeholder="Auto Calculated"
              value={formData.headRiceTotalValue || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              decimalScale={2}
            />
          </div>
          <hr className="bg-gray-200 h-1 mb-2" />
          <div>
            <div className="font-bold">
              <label>Beras Pecah/Broken Rice</label>
            </div>
            <div className="form-group">
              <label>No. of Sacks</label>
              <NumberFormat
                placeholder="0"
                className="form-control"
                value={formData.brokenRiceNoOfSacks || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    brokenRiceNoOfSacks: e.floatValue || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Kg/Sacks</label>
              <select
                className="form-control"
                value={formData.brokenRiceKgSacks || 0}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    brokenRiceKgSacks: parseInt(e.target.value),
                  });
                }}
              >
                <option value={0} disabled>
                  Select Kg/Sacks
                </option>
                <option value={5}>5 Kg</option>
                <option value={10}>10 Kg</option>
                <option value={25}>25 Kg</option>
                <option value={30}>30 Kg</option>
                <option value={35}>35 Kg</option>
                <option value={50}>50 Kg</option>
              </select>
            </div>
            <div className="form-group">
              <label>Price/Kg</label>
              <NumberFormat
                className="form-control"
                value={formData.brokenRicePricePerKg || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    brokenRicePricePerKg: e.formattedValue || 0,
                  });
                }}
              />
            </div>
            <div />
            <div className="form-group">
              <label>Total (Kg)</label>
              <NumberFormat
                className="form-control"
                disabled
                placeholder="Auto Calculated"
                value={formData.totalBrokenRice || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
              />
            </div>
            <div></div>
            <div className="form-group">
              <label>Total Value</label>
              <NumberFormat
                className="form-control"
                disabled
                placeholder="Auto Calculated"
                value={formData.brokenRiceTotalValue || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
              />
            </div>
          </div>
          <div className="hidden">
            <div>
              <div>
                <div className="form-group">
                  <label>Store</label>
                  <input
                    className="form-control"
                    value={formData.store || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        store: e.target.value,
                      });
                    }}
                  />
                </div>
                <div className="form-group mb-2">
                  <label>Batch Number</label>
                  <input
                    className="form-control"
                    value={formData.batchNumber || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        batchNumber: e.target.value,
                      });
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="font-bold">
                  <label>Beras Pecah/Broken Rice</label>
                </div>
                <div className="form-group">
                  <label>No. of Sacks</label>
                  <NumberFormat
                    placeholder="0"
                    className="form-control"
                    value={formData.brokenRiceNoOfSacks || ""}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    fixedDecimalScale={true}
                    onValueChange={(e) => {
                      // if (e) e.preventDefault();
                      setFormData({
                        ...formData,
                        brokenRiceNoOfSacks: e.floatValue || 0,
                      });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Kg/Sacks</label>
                  <select
                    className="form-control"
                    value={formData.brokenRiceKgSacks || 0}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        brokenRiceKgSacks: parseInt(e.target.value),
                      });
                    }}
                  >
                    <option value={0} disabled>
                      Select Kg/Sacks
                    </option>
                    <option value={5}>5 Kg</option>
                    <option value={10}>10 Kg</option>
                    <option value={25}>25 Kg</option>
                    <option value={30}>30 Kg</option>
                    <option value={35}>35 Kg</option>
                    <option value={50}>50 Kg</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price/Kg</label>
                  <NumberFormat
                    className="form-control"
                    value={formData.brokenRicePricePerKg || ""}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    fixedDecimalScale={true}
                    decimalScale={2}
                    onValueChange={(e) => {
                      // if (e) e.preventDefault();
                      setFormData({
                        ...formData,
                        brokenRicePricePerKg: e.formattedValue || 0,
                      });
                    }}
                  />
                </div>
                <div />
                <div className="form-group">
                  <label>Total (Kg)</label>
                  <NumberFormat
                    className="form-control"
                    disabled
                    placeholder="Auto Calculated"
                    value={formData.totalBrokenRice || ""}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    fixedDecimalScale={true}
                    decimalScale={2}
                  />
                </div>
                <div></div>
                <div className="form-group">
                  <label>Total Value</label>
                  <NumberFormat
                    className="form-control"
                    disabled
                    placeholder="Auto Calculated"
                    value={formData.brokenRiceTotalValue || ""}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    fixedDecimalScale={true}
                    decimalScale={2}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className={detailVisible ? "" : "hidden"}>
            <hr className="bg-gray-200 h-1" />
            <div className="grid grid-cols-7 gap-1">
              <div>
                <label>By Product</label>
                <Select
                  value={selectedByProduct}
                  options={allCropsPaddyByProducts.map((prof) => {
                    return {
                      value: prof.uuid,
                      label: prof.typeOfByProduct,
                    };
                  })}
                  className={`form-control uppercase`}
                  classNamePrefix="select"
                  onChange={(selectedValues) => {
                    // console.log({ selectedValues });

                    const found = allCropsPaddyByProducts.find(
                      (profile) => profile.uuid === selectedValues.value
                    );
                    setDetailFormData({
                      ...detailFormData,
                      cropsPaddyByProductUUID: found.uuid,
                      typeOfByProductId: found.typeOfByProductId,
                      price: found?.price || 0,
                      ByProduct: {
                        typeOfByProduct: found.typeOfByProduct,
                        typeOfByProductId: found.typeOfByProductId,
                      },
                    });

                    setSelectedByProduct([
                      {
                        value: found.uuid,
                        label: found.typeOfByProduct,
                      },
                    ]);
                  }}
                />
              </div>
              <div className="form-group">
                <label>By Product ID</label>
                <input
                  className="form-control"
                  value={detailFormData.typeOfByProductId || ""}
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Weight</label>
                <NumberFormat
                  placeholder="0"
                  className="form-control"
                  value={detailFormData.weight || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  fixedDecimalScale={true}
                  decimalScale={2}
                  onValueChange={(e) => {
                    // if (e) e.preventDefault();
                    setDetailFormData({
                      ...detailFormData,
                      weight: e.floatValue || 0,
                      totalValue: e.floatValue * detailFormData.price || 0,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Price</label>
                <NumberFormat
                  disabled
                  placeholder="0"
                  className="form-control"
                  value={detailFormData.price || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  fixedDecimalScale={true}
                  decimalScale={2}
                />
              </div>
              <div className="form-group">
                <label>Total Value</label>
                <NumberFormat
                  placeholder="0"
                  className="form-control"
                  value={detailFormData.totalValue || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  fixedDecimalScale={true}
                  decimalScale={2}
                />
              </div>

              <div className="flex items-end py-2">
                <button
                  className="bg-mantis-500 px-4 py-2 w-full rounded-md shadow-md text-white font-bold"
                  onClick={async (e) => {
                    if (e) e.preventDefault();
                    showLoadingSpinner();
                    try {
                      let details = [];
                      if (detailFormData.createdAt) {
                        await updateMilledRiceProductionDetail({
                          variables: {
                            ...detailFormData,
                            date: formData.date,
                            milledRiceProductionUUID: formData.uuid,
                          },
                        });

                        notification.addNotification({
                          title: "Succeess!",
                          message: `Detail Saved`,
                          level: "success",
                        });

                        details = await fetchDetails(formData.uuid);
                        setListDetails(details);
                      } else {
                        let details = [];

                        if (
                          detailFormData.status === "Edit" &&
                          listDetails.length > 0
                        ) {
                          for (const det of listDetails) {
                            if (det.uuid === detailFormData.uuid) {
                              details.push(detailFormData);
                            } else {
                              details.push(det);
                            }
                          }
                          setListDetails(details);
                        } else {
                          details = [...listDetails, detailFormData];
                          setListDetails(details);
                        }
                      }

                      notification.addNotification({
                        title: "Succeess!",
                        message: `Detail Saved`,
                        level: "success",
                      });

                      setDetailFormData({
                        uuid: uuid(),
                        weight: 0,
                        price: 0,
                        totalValue: 0,
                        status: "New",
                      });

                      setDetailVisible(true);
                      setSelectedByProduct([]);
                      setFormData({
                        ...formData,
                      });
                    } catch (err) {
                      notification.handleError(err);
                    }

                    hideLoadingSpinner();
                  }}
                >
                  <i className="fa fa-plus" /> Save/Add
                </button>
              </div>
              <div className="flex items-end py-2">
                <button
                  className="bg-red-500 px-4 py-2 w-full rounded-md shadow-md text-white font-bold"
                  onClick={async (e) => {
                    if (e) e.preventDefault();

                    setDetailFormData({});
                    setSelectedByProduct([]);
                    setDetailVisible(false);
                  }}
                >
                  <i className="fa fa-plus" /> Cancel
                </button>
              </div>
            </div>
          </div>
          <Table
            loading={false}
            columns={columnsDetail}
            data={listDetails}
            withoutHeader={true}
            customUtilities={null}
            onAdd={
              !detailVisible
                ? (e) => {
                    if (e) e.preventDefault();
                    setDetailFormData({
                      uuid: uuid(),
                      weight: 0,
                      price: 0,
                      totalValue: 0,
                      status: "New",
                    });
                    setDetailVisible(true);
                    setSelectedByProduct([]);
                  }
                : null
            }
            onRemove={async ({ rows }) => {
              showLoadingSpinner();
              try {
                let details = [];
                let tmp = [];
                let yes = confirm(
                  `Are you sure to delete ${rows.length} details?`
                );
                if (yes) {
                  for (const row of rows) {
                    if (row.createdAt) {
                      await deleteMilledRiceProductionDetail({
                        variables: {
                          uuid: row.uuid,
                        },
                      });
                    } else {
                      const found = listDetails.filter(
                        (d) => d.uuid !== row.uuid
                      );
                      tmp = found;
                    }
                  }

                  details = await fetchDetails(formData.uuid);

                  if (!details) {
                    details = tmp;
                  }

                  setListDetails(details);
                  notification.addNotification({
                    title: "Success!",
                    message: `${rows.length} details deleted`,
                    level: "success",
                  });

                  setFormData({
                    ...formData,
                  });
                }
              } catch (error) {
                notification.handleError(error);
              }
              hideLoadingSpinner();
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
                      "Milled Rice Production Export Excel:Read",
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
          data={allMilledRiceProductions}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          customUtilitiesPosition="left"
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege(["Milled Rice Production:Update"])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege(["Milled Rice Production:Create"])
              ? () => {
                  setFormData({
                    record: [],

                    paddyNoOfSacks: 0,
                    paddyKgSacks: 0,
                    totalPaddy: 0,

                    brokenRiceNoOfSacks: 0,
                    brokenRiceKgSacks: 0,
                    brokenRicePricePerKg: 0,
                    totalBrokenRice: 0,
                    brokenRiceTotalValue: 0,

                    headRiceNoOfSacks: 0,
                    headRiceKgSacks: 0,
                    headRicePricePerKg: 0,
                    totalHeadRice: 0,
                    headRiceTotalValue: 0,
                  });
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Milled Rice Production:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} productions?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteMilledRiceProduction({
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
        />
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(page);
