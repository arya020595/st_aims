import React, { useState, useEffect, useMemo, useCallback } from "react";
import { withApollo } from "../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../components/App";
import { useNotification } from "../components/Notification";
import { handleError } from "../libs/errors";
import AdminArea, { useCurrentUser } from "../components/AdminArea";
import Table from "../components/Table";
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
import Head from "next/dist/next-server/lib/head";
import { v4 as uuidv4 } from "uuid";
import NumberFormat from "react-number-format";
import Select from "react-select";
import dayjs from "dayjs";
import { MonthAndYearsFilterWithExport } from "../components/MonthAndYearsFilterWithExport";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import AsyncSelect from "react-select/async";

const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERIES = gql`
  query listQueries($monthYear: String, $filters: String) {
    currentUser {
      _id
      controlPost
      district
    }
    countBioSecurityImportData(monthYear: $monthYear, filters: $filters)
  }
`;

const MASTER_DATA_QUERY = gql`
  query masterData($tokenizedParams: String) {
    tokenizedAllBioSecurityCountries
    tokenizedAllBioSecurityTypeOfComodities
    tokenizedllBioSecurityTypeOfComoditiesByIds(
      tokenizedParams: $tokenizedParams
    )
  }
`;

const SEARCH_COMMODITIES = gql`
  query searchBioSecurityTypeOfComodities($name: String) {
    searchBioSecurityTypeOfComodities(name: $name)
  }
`;

const SEARCH_COMPANY_QUERY = gql`
  query searchCompanyQuery($name: String) {
    searchAllBioSecurityCompanyProfiles(name: $name)
  }
`;

const IMPORT_DATA_QUERY = gql`
  query importDataQuery(
    $monthYear: String
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllBioSecurityImportDataPaginated(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countBioSecurityImportData(monthYear: $monthYear, filters: $filters)
  }
`;

const GET_COMPANY = gql`
  query getBioSecurityCompanyProfilesByCompanyRegNo(
    $companyRegNo: String!
    $type: String!
  ) {
    getBioSecurityCompanyProfilesByCompanyRegNo(
      companyRegNo: $companyRegNo
      type: $type
    ) {
      uuid
      companyName
      companyRegNo
      companyCropRegNo
      companyAnimalRegNo
      registrationNumber
    }
  }
`;

const GET_COMPANY_BY_UUID = gql`
  query getBioSecurityCompanyProfilesByUUID($uuid: String!) {
    getBioSecurityCompanyProfilesByUUID(uuid: $uuid) {
      uuid
      companyName
      companyRegNo
      companyCropRegNo
      companyAnimalRegNo
    }
  }
`;

const CREATE_IMPORT_DATA = gql`
  mutation tokenizedCreateBioSecurityImportData($tokenized: String!) {
    tokenizedCreateBioSecurityImportData(tokenized: $tokenized)
  }
`;

const UPDATE_IMPORT_DATA = gql`
  mutation tokenizedUpdateBioSecurityImportData($tokenized: String!) {
    tokenizedUpdateBioSecurityImportData(tokenized: $tokenized)
  }
`;

const DELETE_IMPORT_DATA = gql`
  mutation tokenizedDeleteBioSecurityImportData($tokenized: String!) {
    tokenizedDeleteBioSecurityImportData(tokenized: $tokenized)
  }
`;

const GET_NON_COMPLIENCE_LIST = gql`
  query allBioSecurityNonComplienceLists($companyProfileUUID: String!) {
    allBioSecurityNonComplienceLists(companyProfileUUID: $companyProfileUUID) {
      uuid
      date
      officer
    }
  }
`;

const EXPORT_IMPORT_DATA = gql`
  mutation exportBioSecurityImportData(
    $monthYear: String!
    $pointOfEntry: String
    $companyRegNo: String
    $companyUUID: String
    $permitNumber: String
    $countryUUID: String
  ) {
    exportBioSecurityImportData(
      monthYear: $monthYear
      pointOfEntry: $pointOfEntry
      companyRegNo: $companyRegNo
      companyUUID: $companyUUID
      permitNumber: $permitNumber
      countryUUID: $countryUUID
    )
  }
`;

const page = () => {
  const client = useApolloClient();
  const router = useRouter();
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const { currentUserPrivilege, currentUserDontHavePrivilege } =
    useCurrentUser();
  const [formData, setFormData] = useState({
    record: [],
  });

  const [formDataUpdate, setFormDataUpdate] = useState({
    productList: [],
  });
  const [getNonComplience, setGetNonComplience] = useState([]);

  const [formDataUpdateVisible, setFormDataUpdateVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState({});
  const [modalExportVisible, setModalExportVisible] = useState(false);
  const [exportFormData, setExportFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [registrationNumberType, setRegistrationNumberType] = useState("");
  const notification = useNotification();

  const { data, error, loading, refetch } = useQuery(QUERIES, {
    variables: {
      monthYear: yearMonth,
      filters: router.query.filters,
    },
  });
  const [createBioSecurityImportData] = useMutation(CREATE_IMPORT_DATA);
  const [updateBioSecurityImportData] = useMutation(UPDATE_IMPORT_DATA);
  const [deleteBioSecurityImportData] = useMutation(DELETE_IMPORT_DATA);
  const [exportBioSecurityImportData] = useMutation(EXPORT_IMPORT_DATA);

  const [selectedCompanyName, setSelectedCompanyName] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const [selectedCountry, setSelectedCountry] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const [companyName, setCompanyName] = useState([]);
  const [allBioSecurityCountries, setAllBioSecurityCountries] = useState([]);
  const [allBioSecurityTypeOfComodities, setAllBioSecurityTypeOfComodities] =
    useState([]);
  const [allBioSecurityImportData, setAllBioSecurityImportData] = useState([]);
  let [savedCount, setSavedCount] = useState(0);
  let [countBioSecurityImportData, setCountBioSecurityImportData] = useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countBioSecurityImportData) return 1;
    return Math.ceil(countBioSecurityImportData / pageSize);
  }, [countBioSecurityImportData, pageSize]);

  const currentUser = data?.currentUser || {};
  useEffect(() => {
    if (!loading && !error) {
      // const encryptedCompanyName =
      //   data?.tokenizedAllBioSecurityCompanyProfiles || "";
      // let companyName = [];
      // if (encryptedCompanyName) {
      //   const decrypted = jwt.verify(encryptedCompanyName, TOKENIZE);
      //   companyName = decrypted.queryResult;
      //   setCompanyName(companyName);
      // }

      // const encryptedBioSecurityCountries =
      //   data?.tokenizedAllBioSecurityCountries || "";
      // let allBioSecurityCountries = [];
      // if (encryptedBioSecurityCountries) {
      //   const decrypted = jwt.verify(encryptedBioSecurityCountries, TOKENIZE);
      //   allBioSecurityCountries = decrypted.queryResult;
      //   setAllBioSecurityCountries(allBioSecurityCountries);
      // }

      // const encryptedBioSecurityTypeOfComodities =
      //   data?.tokenizedAllBioSecurityTypeOfComodities || "";
      // let allBioSecurityTypeOfComodities = [];
      // if (encryptedBioSecurityTypeOfComodities) {
      //   const decrypted = jwt.verify(
      //     encryptedBioSecurityTypeOfComodities,
      //     TOKENIZE
      //   );
      //   allBioSecurityTypeOfComodities = decrypted.queryResult;
      //   setAllBioSecurityTypeOfComodities(allBioSecurityTypeOfComodities);
      // }

      const countData = data?.countBioSecurityImportData || 0;
      setCountBioSecurityImportData(countData);
      // const encryptedBioSecurityImportData =
      //   data?.tokenizedAllBioSecurityImportData || "";
      // let allBioSecurityImportData = [];
      // if (encryptedBioSecurityImportData) {
      //   const decrypted = jwt.verify(encryptedBioSecurityImportData, TOKENIZE);
      //   allBioSecurityImportData = decrypted.queryResult;
      //   setAllBioSecurityImportData(allBioSecurityImportData);
      // }
    }
  }, [data, loading, error, savedCount]);

  useEffect(async () => {
    const result = await client.query({
      query: MASTER_DATA_QUERY,
      fetchPolicy: "no-cache",
    });

    const encryptedBioSecurityCountries =
      result.data?.tokenizedAllBioSecurityCountries || "";
    let allBioSecurityCountries = [];
    if (encryptedBioSecurityCountries) {
      const decrypted = jwt.verify(encryptedBioSecurityCountries, TOKENIZE);
      allBioSecurityCountries = decrypted.queryResult;
      setAllBioSecurityCountries(allBioSecurityCountries);
    }

    // const encryptedBioSecurityTypeOfComodities =
    //   result.data?.tokenizedAllBioSecurityTypeOfComodities || "";
    // let allBioSecurityTypeOfComodities = [];
    // if (encryptedBioSecurityTypeOfComodities) {
    //   const decrypted = jwt.verify(
    //     encryptedBioSecurityTypeOfComodities,
    //     TOKENIZE
    //   );
    //   allBioSecurityTypeOfComodities = decrypted.queryResult;
    //   setAllBioSecurityTypeOfComodities(allBioSecurityTypeOfComodities);
    // }
  }, []);

  useEffect(async () => {
    // showLoadingSpinner();
    const result = await client.query({
      query: IMPORT_DATA_QUERY,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedBioSecurityImportData =
      result.data?.tokenizedAllBioSecurityImportDataPaginated || "";
    let allBioSecurityImportData = [];
    if (encryptedBioSecurityImportData) {
      const decrypted = jwt.verify(encryptedBioSecurityImportData, TOKENIZE);
      allBioSecurityImportData = decrypted.queryResult;
      setAllBioSecurityImportData(allBioSecurityImportData);
    }
    const countData = result.data?.countBioSecurityImportData || 0;
    setCountBioSecurityImportData(countData);
    // hideLoadingSpinner();
  }, [savedCount, yearMonth, pageSize, pageIndex, router.query.filters]);

  // let companyName = [];
  // const encryptedBioSecurityCompanyProfiles =
  //   data?.tokenizedAllBioSecurityCompanyProfiles || "";
  // if (encryptedBioSecurityCompanyProfiles) {
  //   const decrypted = jwt.verify(encryptedBioSecurityCompanyProfiles, TOKENIZE);
  //   companyName = decrypted.queryResult;
  // }

  const handlePageChange = useCallback(
    async ({ pageIndex, pageSize, filters }) => {
      // const ym = router.query.yearMonth || dayjs().format("YYYY-MM");
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

  const fetchingCompany = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_COMPANY_QUERY,
      variables: {
        name: input,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedCompanyName =
      result.data?.searchAllBioSecurityCompanyProfiles || "";
    let companyName = [];
    if (encryptedCompanyName) {
      const decrypted = jwt.verify(encryptedCompanyName, TOKENIZE);
      companyName = decrypted.queryResult;
      setCompanyName(companyName);
    }

    callback(companyName);
  };

  const getCompany = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fetchingCompany(input, callback);
    }
  };

  const fethchingCommodity = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_COMMODITIES,
      variables: {
        name: input,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedCommodity =
      result.data?.searchBioSecurityTypeOfComodities || "";
    let allBioSecurityTypeOfComodities = [];
    if (encryptedCommodity) {
      const decrypted = jwt.verify(encryptedCommodity, TOKENIZE);
      allBioSecurityTypeOfComodities = decrypted.queryResult;
      setAllBioSecurityTypeOfComodities(allBioSecurityTypeOfComodities);
    }
    callback(allBioSecurityTypeOfComodities);
  };

  const getCommodity = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fethchingCommodity(input, callback);
    }
  };

  // let allBioSecurityCountries = [];
  // const encryptedBioSecurityCountries =
  //   data?.tokenizedAllBioSecurityCountries || "";
  // if (encryptedBioSecurityCountries) {
  //   const decrypted = jwt.verify(encryptedBioSecurityCountries, TOKENIZE);
  //   allBioSecurityCountries = decrypted.queryResult;
  // }

  // let allBioSecurityTypeOfComodities = [];
  // const encryptedBioSecurityTypeOfComodities =
  //   data?.tokenizedAllBioSecurityTypeOfComodities || "";
  // if (encryptedBioSecurityTypeOfComodities) {
  //   const decrypted = jwt.verify(
  //     encryptedBioSecurityTypeOfComodities,
  //     TOKENIZE
  //   );
  //   allBioSecurityTypeOfComodities = decrypted.queryResult;
  // }

  // let allBioSecurityImportData = [];
  // const encryptedBioSecurityImportData =
  //   data?.tokenizedAllBioSecurityImportData || "";
  // if (encryptedBioSecurityImportData) {
  //   const decrypted = jwt.verify(encryptedBioSecurityImportData, TOKENIZE);
  //   allBioSecurityImportData = decrypted.queryResult;
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
                try {
                  showLoadingSpinner();
                  const getCompany = await client.query({
                    query: GET_COMPANY_BY_UUID,
                    variables: {
                      uuid: props.row.original.companyUUID,
                    },
                  });

                  const getComplienceList = await client.query({
                    query: GET_NON_COMPLIENCE_LIST,
                    variables: {
                      companyProfileUUID:
                        props.row.original?.Company?.uuid || [],
                    },
                  });

                  const tokenizedCommodity = jwt.sign(
                    {
                      ids: [props.row.original.TypeOfComodity.uuid],
                    },
                    TOKENIZE
                  );

                  const getCommodityMasterDataById = await client.query({
                    query: MASTER_DATA_QUERY,
                    variables: {
                      tokenizedParams: tokenizedCommodity,
                    },
                  });

                  const encryptedCommodity =
                    getCommodityMasterDataById.data
                      ?.tokenizedllBioSecurityTypeOfComoditiesByIds || "";
                  let allBioSecurityTypeOfComodities = [];
                  if (encryptedCommodity) {
                    const decrypted = jwt.verify(encryptedCommodity, TOKENIZE);
                    allBioSecurityTypeOfComodities = decrypted.queryResult;
                  }

                  const foundComodity = allBioSecurityTypeOfComodities.find(
                    (c) => c.uuid === props.row.original.TypeOfComodity.uuid
                  );

                  const foundSelectedProducts =
                    foundComodity.ComodityDetails.find(
                      (c) => c.uuid === props.row.original.ComodityDetail.uuid
                    );
                  // console.log({ foundSelectedProducts });

                  setFormDataUpdateVisible(true);
                  setFormDataUpdate({
                    ...getCompany.data.getBioSecurityCompanyProfilesByUUID,
                    ...props.row.original,
                    countryUUID: props.row.original?.Country?.uuid || "",
                    typeOfComodityUUID:
                      props.row.original?.TypeOfComodity?.uuid || "",
                    productList: foundComodity.ComodityDetails,
                    comodityDetailUUID:
                      props.row.original?.ComodityDetail?.uuid || "",
                  });
                  setSelectedProduct({
                    value: foundSelectedProducts.uuid,
                    label: `${foundSelectedProducts.englishName} - ${foundSelectedProducts.localName}`,
                    ...foundSelectedProducts,
                  });
                  setGetNonComplience(
                    getComplienceList.data.allBioSecurityNonComplienceLists.map(
                      (list, index) => {
                        return {
                          nc: "NC" + (index + 1),
                          ...list,
                        };
                      }
                    )
                  );
                  hideLoadingSpinner();
                } catch (err) {
                  notification.handleError(err);
                }
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
    // {
    //   Header: "UUID",
    //   accessor: "uuid",
    //   style: {
    //     fontSize: 20,
    //   },
    //   disableFilters: true,
    // },
    {
      Header: "Date of Entry",
      accessor: "entryDate",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Point of Entry",
      accessor: "pointOfEntry",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Company Registration Number",
      accessor: "Company.companyRegNo",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Company Name",
      accessor: "Company.companyName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Permit Number",
      accessor: "permitNumber",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Exporting Country",
      accessor: "Country.name",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "English Name",
      accessor: "ComodityDetail.englishName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Local Name",
      accessor: "ComodityDetail.localName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Type of Commodity",
      accessor: "TypeOfComodity.name",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Category",
      accessor: "ComodityDetail.BioSecurityCategory.name",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Product Code",
      accessor: "ComodityDetail.code",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Quantity",
      accessor: "quantity",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
  ]);

  const columnsComplience = useMemo(() => [
    {
      Header: "NC",
      accessor: "nc",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Date",
      accessor: "date",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{dayjs(props.value).format("DD/MM/YYYY")}</span>,
    },
  ]);

  return (
    <AdminArea header={{ title: "Import Data" }} urlQuery={router.query}>
      <FormModal
        title={`Export Import Data BioSecurity`}
        visible={modalExportVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalExportVisible(false);
          setExportFormData({});
          setSelectedCompanyName({});
          setSelectedCountry({});
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setModalExportVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportBioSecurityImportData({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });
            window.open(response.data.exportBioSecurityImportData, "__blank");
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
            <label>Point of Entry</label>
            <input
              className="form-control"
              value={exportFormData.pointOfEntry || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setExportFormData({
                  ...exportFormData,
                  pointOfEntry: e.target.value,
                });
              }}
            />
          </div>

          <div className="form-group">
            <label>Company Name</label>

            {/* <Select
              isClearable={true}
              value={selectedCompanyName}
              options={companyName.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.companyName,
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = companyName.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  companyUUID: found?.uuid || "",
                });

                setSelectedCompanyName([
                  {
                    value: found?.uuid || "",
                    label: found?.companyName || "",
                  },
                ]);
              }}
            /> */}

            <AsyncSelect
              loadOptions={getCompany}
              className={`form-control`}
              classNamePrefix="select"
              getOptionLabel={(option) => `${option.companyName}`}
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              onChange={(selectedValues) => {
                const found = companyName.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  companyUUID: found?.uuid || "",
                });

                setSelectedCompanyName([
                  {
                    value: found?.uuid || "",
                    label: found?.companyName || "",
                  },
                ]);
              }}
            />

            <div className="form-group">
              <label>Company Registration Number</label>
              <input
                className="form-control"
                value={exportFormData.companyRegNo || ""}
                onChange={(e) => {
                  if (e) e.preventDefault;
                  setExportFormData({
                    ...exportFormData,
                    companyRegNo: e.target.value,
                  });
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Permit Number</label>
            <input
              className="form-control"
              value={exportFormData.permitNumber || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setExportFormData({
                  ...exportFormData,
                  permitNumber: e.target.value,
                });
              }}
            />
          </div>

          <div className="form-group">
            <label>Exporting Country</label>
            <Select
              isClearable={true}
              value={selectedCountry}
              options={allBioSecurityCountries.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.name,
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allBioSecurityCountries.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  countryUUID: found?.uuid || "",
                });

                setSelectedCountry([
                  {
                    value: found?.uuid || "",
                    label: found?.name || "",
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
        title={`Edit Import Data`}
        visible={formDataUpdateVisible}
        size="md"
        onClose={(e) => {
          if (e) e.preventDefault();
          setFormDataUpdateVisible(false);
          setFormDataUpdate({
            productList: [],
          });
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            if (!currentUser.controlPost) {
              throw {
                message: "Invalid User. Please Re-Login",
              };
            }
            if (currentUser.controlPost === "All") {
              throw {
                message: "Not Allowed to update!",
              };
            }

            const tokenized = jwt.sign(formDataUpdate, TOKENIZE);
            await updateBioSecurityImportData({
              variables: {
                // ...formDataUpdate,
                tokenized,
              },
            });

            notification.addNotification({
              title: "Succeess!",
              message: `Import Data saved!`,
              level: "success",
            });
            await refetch();
            setSavedCount((savedCount += 1));
            // setFormDataUpdateVisible(false);
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Point of Entry</label>
          <input
            disabled
            placeholder="Auto Filled"
            className="form-control"
            value={formDataUpdate.pointOfEntry || ""}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="form-group">
            <label>Date of Entry*</label>
            <input
              required
              type="date"
              className="form-control"
              value={formDataUpdate.entryDate || ""}
              onChange={(e) => {
                setFormDataUpdate({
                  ...formDataUpdate,
                  entryDate: e.target.value,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Time of Entry</label>
            <input
              type="time"
              className="form-control"
              value={formDataUpdate.timeOfEntry || ""}
              onChange={(e) => {
                setFormDataUpdate({
                  ...formDataUpdate,
                  timeOfEntry: e.target.value,
                });
              }}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Company Registration No. (Animal)</label>
          <input
            className="form-control"
            value={formDataUpdate.companyAnimalRegNo || ""}
            onChange={(e) => {
              setFormDataUpdate({
                ...formDataUpdate,
                companyAnimalRegNo: e.target.value,
              });
            }}
            onBlur={async (e) => {
              if (e) e.preventDefault();
              showLoadingSpinner();
              try {
                const result = await client.query({
                  query: GET_COMPANY,
                  variables: {
                    companyRegNo: formDataUpdate.companyAnimalRegNo || "",
                    type: "ANIMAL",
                  },
                });
                if (result.data.getBioSecurityCompanyProfilesByCompanyRegNo) {
                  const found =
                    result.data.getBioSecurityCompanyProfilesByCompanyRegNo;

                  const getComplienceList = await client.query({
                    query: GET_NON_COMPLIENCE_LIST,
                    variables: {
                      companyProfileUUID: found.uuid,
                    },
                  });

                  setFormDataUpdate({
                    ...formDataUpdate,
                    companyUUID: found.uuid,
                    companyName: found.companyName,
                    companyCropRegNo: found.companyCropRegNo,
                    companyRegNo: found.companyRegNo,
                  });

                  setGetNonComplience(
                    getComplienceList.data.allBioSecurityNonComplienceLists.map(
                      (list, index) => {
                        return {
                          nc: "NC" + (index + 1),
                          ...list,
                        };
                      }
                    )
                  );
                }
              } catch (err) {
                notification.handleError(err);
              }
              hideLoadingSpinner();
            }}
          />
        </div>

        <div className="form-group">
          <label>Company Registration No. (Crop)</label>
          <input
            
            className="form-control"
            value={formDataUpdate.companyCropRegNo || ""}
            onChange={(e) => {
              setFormDataUpdate({
                ...formDataUpdate,
                companyCropRegNo: e.target.value,
              });
            }}
            onBlur={async (e) => {
              if (e) e.preventDefault();
              showLoadingSpinner();
              try {
                const result = await client.query({
                  query: GET_COMPANY,
                  variables: {
                    companyRegNo: formDataUpdate.companyCropRegNo || "",
                    type: "CROPS",
                  },
                });
                if (result.data.getBioSecurityCompanyProfilesByCompanyRegNo) {
                  const found =
                    result.data.getBioSecurityCompanyProfilesByCompanyRegNo;

                  const getComplienceList = await client.query({
                    query: GET_NON_COMPLIENCE_LIST,
                    variables: {
                      companyProfileUUID: found.uuid,
                    },
                  });

                  setFormDataUpdate({
                    ...formDataUpdate,
                    companyUUID: found.uuid,
                    companyName: found.companyName,
                    companyAnimalRegNo: found.companyAnimalRegNo,
                    companyRegNo: found.companyRegNo,
                  });

                  setGetNonComplience(
                    getComplienceList.data.allBioSecurityNonComplienceLists.map(
                      (list, index) => {
                        return {
                          nc: "NC" + (index + 1),
                          ...list,
                        };
                      }
                    )
                  );
                }
              } catch (err) {
                notification.handleError(err);
              }
              hideLoadingSpinner();
            }}
          />
        </div>

        <div className="form-group">
          <label>Company Registration Number</label>
          <input
            disabled
            className="form-control bg-gray-100"
            value={formDataUpdate.companyRegNo || ""}
          />
        </div>
        <div className="form-group">
          <label>Company Name</label>
          <input
            disabled
            placeholder="Auto Filled"
            className="form-control bg-gray-100"
            value={formDataUpdate.companyName || ""}
            onChange={(e) => {
              setFormDataUpdate({
                ...formDataUpdate,
                companyName: e.target.value,
              });
            }}
          />
        </div>
        <p className="text-xl m-0 text-center font-bold">Non Compliance Logs</p>
        <Table
          columns={columnsComplience}
          data={getNonComplience}
          loading={false}
          withoutHeader={true}
        />
        <div className="form-group">
          <label>Permit Number</label>
          <input
            className="form-control"
            value={formDataUpdate.permitNumber || ""}
            onChange={(e) => {
              setFormDataUpdate({
                ...formDataUpdate,
                permitNumber: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Health Certificate Number</label>
          <input
            className="form-control"
            value={formDataUpdate.healthCertificateNumber || ""}
            onChange={(e) => {
              setFormDataUpdate({
                ...formDataUpdate,
                healthCertificateNumber: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Exporting Country</label>
          <select
            className="form-control"
            value={formDataUpdate.countryUUID || ""}
            onChange={(e) => {
              setFormDataUpdate({
                ...formDataUpdate,
                countryUUID: e.target.value,
              });
            }}
          >
            <option value="" disabled>
              Select Country
            </option>
            {allBioSecurityCountries.map((c) => (
              <option value={c.uuid}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Reference Number</label>
          <input
            className="form-control"
            value={formDataUpdate.referenceNumber || ""}
            onChange={(e) => {
              setFormDataUpdate({
                ...formDataUpdate,
                referenceNumber: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Type of Commodity</label>
          <AsyncSelect
            value={formDataUpdate.TypeOfComodity}
            loadOptions={getCommodity}
            classNamePrefix="select"
            getOptionLabel={(option) => `${option.name}`}
            getOptionValue={(option) => option.uuid}
            autoFocus={true}
            onChange={(selectedValues) => {
              const found = allBioSecurityTypeOfComodities.find((profile) =>
                selectedValues ? profile.uuid === selectedValues.uuid : null
              );
              const { uuid, ...d } = found;
              setFormDataUpdate({
                ...formDataUpdate,
                TypeOfComodity: found,
                typeOfComodityUUID: uuid,
                productList: found.ComodityDetails,
              });
              setSelectedProduct({
                englishName: "Please Select First",
                localName: "",
                uuid: "",
              });
            }}
          />
          {/* <select
            className="form-control"
            value={formDataUpdate.typeOfComodityUUID || ""}
            onChange={async (e) => {
              if (e) e.preventDefault();

              const found = allBioSecurityTypeOfComodities.find(
                (t) => t.uuid === e.target.value
              );
              setFormDataUpdate({
                ...formDataUpdate,
                typeOfComodityUUID: found.uuid,
                productList: found.ComodityDetails,
              });
              setSelectedProduct({
                englishName: "Please Select First",
                localName: "",
                uuid: "",
              });
            }}
          >
            <option value="" disabled>
              Select Type of Commodity
            </option>
            {allBioSecurityTypeOfComodities.map((type) => (
              <option value={type.uuid}>{type.name}</option>
            ))}
          </select> */}
        </div>

        <div className="form-group">
          <label>Product List</label>
          <Select
            value={[
              {
                value: selectedProduct.uuid,
                label: `${selectedProduct.englishName} - ${selectedProduct.localName}`,
              },
            ]}
            required
            options={formDataUpdate.productList.map((pr) => {
              return {
                value: pr.uuid,
                label: `${pr.englishName} - ${pr.localName}`,
              };
            })}
            classNamePrefix="select"
            onChange={(selectedValues) => {
              const found = formDataUpdate.productList.find(
                (p) => p.uuid === selectedValues.value
              );

              setFormDataUpdate({
                ...formDataUpdate,
                comodityDetailUUID: selectedValues.value,
                category: found?.BioSecurityCategory.name || "",
                code: found?.code || "",
                unit: found?.BioSecurityUnit?.name || "",
              });
              setSelectedProduct(found);
            }}
          />
        </div>
        <div className="form-group">
          <label>Category</label>
          <input
            disabled
            placeholder="Auto Filled"
            className="form-control"
            value={selectedProduct?.BioSecurityCategory?.name || ""}
          />
        </div>
        <div className="form-group">
          <label>Product Code</label>
          <input
            disabled
            placeholder="Auto Filled"
            className="form-control"
            value={selectedProduct.code || ""}
          />
        </div>
        <div className="form-group">
          <label>Actual Quantity</label>
          <NumberFormat
            className="form-control"
            value={formDataUpdate.actualQuantity || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              const quantity = e.floatValue * formDataUpdate.netWeight;
              setFormDataUpdate({
                ...formDataUpdate,
                actualQuantity: e.floatValue,
                quantity,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Net Weight</label>
          <NumberFormat
            className="form-control"
            value={formDataUpdate.netWeight || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              const quantity = e.floatValue * formDataUpdate.actualQuantity;
              setFormDataUpdate({
                ...formDataUpdate,
                netWeight: e.floatValue,
                quantity,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Quantity</label>
          <NumberFormat
            className="form-control"
            value={formDataUpdate.quantity || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
            disabled
          />
        </div>
        <div className="form-group">
          <label>Unit</label>
          <input
            disabled
            placeholder="Auto Filled"
            className="form-control"
            value={selectedProduct?.BioSecurityUnit?.name || ""}
          />
        </div>
        <div className="form-group">
          <label>CIF ($)</label>
          <NumberFormat
            className="form-control"
            value={formDataUpdate.cif || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setFormDataUpdate({
                ...formDataUpdate,
                cif: e.floatValue,
              });
            }}
          />
        </div>

        <div className="mt-24" />
      </FormModal>
      <FormModal
        title={`New Import Data`}
        visible={modalVisible}
        size="xl"
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            record: [],
          });
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            const { record } = formData;

            for (let rec of record) {
              const typeOfComodityUUID = rec.TypeOfComodity.uuid;
              const tokenizedPayload = {
                ...formData,
                ...rec,
                typeOfComodityUUID,
              };
              if (!currentUser.controlPost || currentUser._id !== "__ROOT__") {
                // throw {
                //   message: "Invalid User. Please Re-Login",
                // };
              }
              if (currentUser.controlPost === "All") {
                throw {
                  message: "Not Allowed to update!",
                };
              }

              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await createBioSecurityImportData({
                variables: {
                  tokenized,
                },
              });
            }
            setModalVisible(false);
            setFormData({
              pointOfEntry: currentUser?.controlPost || "",
              district: currentUser?.district || "",
              record: [],
            });
            setModalVisible(true);

            await refetch();
            setSavedCount((savedCount += 1));
            notification.addNotification({
              title: "Succeess!",
              message: `Import Data saved!`,
              level: "success",
            });
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Point of Entry</label>
          <input
            disabled
            placeholder="Auto Filled"
            className="form-control"
            value={formData.pointOfEntry || ""}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="form-group">
            <label>Date of Entry*</label>
            <input
              required
              type="date"
              className="form-control"
              value={formData.entryDate || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  entryDate: e.target.value,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Time of Entry</label>
            <input
              type="time"
              className="form-control"
              value={formData.timeOfEntry || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  timeOfEntry: e.target.value,
                });
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="form-group">
            <label>Select Registration Number</label>
            <select
              className="form-control"
              onChange={(e) => {
                setRegistrationNumberType(e.target.value);
              }}
              value={registrationNumberType || ""}
            >
              <option disabled value={""}>
                Registration Type
              </option>
              <option value={"CROPS"}>Company Registration No (Crops)</option>
              <option value={"ANIMAL"}>Company Registration No (Animal)</option>
            </select>
          </div>
        </div>

        <div
          className={`grid grid-cols-3 gap-4 ${
            registrationNumberType ? "" : "hidden"
          }`}
        >
          <div className={"form-group"}>
            <label>
              {registrationNumberType === "COMPANY"
                ? "Company Registration No (Company)"
                : registrationNumberType === "CROPS"
                ? "Company Registration No (Crops)"
                : "Company Registration No (Animal)"}
            </label>
            <input
              className="form-control"
              value={formData.registrationNumber || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  registrationNumber: e.target.value,
                });
              }}
              onBlur={async (e) => {
                if (e) e.preventDefault();
                showLoadingSpinner();
                try {
                  const result = await client.query({
                    query: GET_COMPANY,
                    variables: {
                      companyRegNo: formData.registrationNumber || "",
                      type: registrationNumberType,
                    },
                  });
                  // console.log(
                  //   result.data.getBioSecurityCompanyProfilesByCompanyRegNo
                  // );

                  if (result.data.getBioSecurityCompanyProfilesByCompanyRegNo) {
                    const found =
                      result.data.getBioSecurityCompanyProfilesByCompanyRegNo;

                    const getComplienceList = await client.query({
                      query: GET_NON_COMPLIENCE_LIST,
                      variables: {
                        companyProfileUUID: found.uuid,
                      },
                    });

                    setFormData({
                      ...formData,
                      companyUUID: found.uuid,
                      companyName: found.companyName,
                      companyRegNo: found.companyRegNo,
                      companyCropRegNo: found.companyCropRegNo,
                    });

                    setGetNonComplience(
                      getComplienceList.data.allBioSecurityNonComplienceLists.map(
                        (list, index) => {
                          return {
                            nc: "NC" + (index + 1),
                            ...list,
                          };
                        }
                      )
                    );
                  }
                } catch (err) {
                  notification.handleError(err);
                }
                hideLoadingSpinner();
              }}
            />
          </div>
          <div className="form-group">
            <label>Company Registration No.</label>
            <input
              disabled
              placeholder="Auto Filled"
              className="form-control"
              value={formData.companyRegNo || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  companyRegNo: e.target.value,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Company Name</label>
            <input
              disabled
              placeholder="Auto Filled"
              className="form-control"
              value={formData.companyName || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  companyName: e.target.value,
                });
              }}
            />
          </div>
        </div>

        <p className="text-xl m-0 text-center font-bold">Non Compliance Logs</p>
        <Table
          columns={columnsComplience}
          data={getNonComplience}
          loading={false}
          withoutHeader={true}
        />

        <div className="form-group">
          <label>Permit Number</label>
          <input
            className="form-control"
            value={formData.permitNumber || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                permitNumber: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Health Certificate Number</label>
          <input
            className="form-control"
            value={formData.healthCertificateNumber || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                healthCertificateNumber: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Exporting Country</label>
          <select
            className="form-control"
            value={formData.countryUUID || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                countryUUID: e.target.value,
              });
            }}
          >
            <option value="" disabled>
              Select Country
            </option>
            {allBioSecurityCountries.map((c) => (
              <option value={c.uuid}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Reference Number</label>
          <input
            className="form-control"
            value={formData.referenceNumber || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                referenceNumber: e.target.value,
              });
            }}
          />
        </div>

        <hr />
        <div className="flex justify-end mb-4">
          <button
            className="bg-mantis-500 text-sm text-white font-bold px-2 py-2 rounded-md shadow-md"
            onClick={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                record: [
                  ...formData.record,
                  {
                    _id: uuidv4(),
                    productList: [],
                    cif: 0,
                    quantity: 0,
                    netWeight: 0,
                    actualQuantity: 0,
                  },
                ],
              });
            }}
          >
            <i className="fa fa-plus" /> Add
          </button>
        </div>
        <div className="grid grid-cols-10 mr-2">
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-4 px-2">
            Type of Commodity
          </div>
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-4">
            Product Name
          </div>
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-4">
            Category
          </div>

          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-4">
            Product Code
          </div>
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-4">
            Actual Quantity
          </div>
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-4">
            Net Weight(kg/ekor/pcs)
          </div>
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-4">
            Quantity
          </div>
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-4">
            Unit
          </div>
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-4">
            CIF($)
          </div>
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-sm py-4" />
        </div>

        {formData.record.map((rec) => (
          <div className="grid grid-cols-10 my-2">
            <div className="pr-2">
              <AsyncSelect
                value={rec.TypeOfComodity}
                loadOptions={getCommodity}
                classNamePrefix="select"
                getOptionLabel={(option) => `${option.name}`}
                getOptionValue={(option) => option.uuid}
                autoFocus={true}
                onChange={(selectedValues) => {
                  const found = allBioSecurityTypeOfComodities.find((profile) =>
                    selectedValues ? profile.uuid === selectedValues.uuid : null
                  );
                  const { uuid, ...d } = found;
                  setFormData({
                    ...formData,
                    record: formData.record.map((re) =>
                      re._id !== rec._id
                        ? re
                        : {
                            ...rec,
                            ...d,
                            TypeOfComodity: found,
                            typeOfComodityUUID: uuid,
                            productList: found.ComodityDetails,
                          }
                    ),
                  });
                }}
              />
              {/* <select
                className="form-control"
                value={rec.typeOfComodityUUID || ""}
                onChange={async (e) => {
                  if (e) e.preventDefault();

                  const found = allBioSecurityTypeOfComodities.find(
                    (t) => t.uuid === e.target.value
                  );
                  setFormData({
                    ...formData,
                    record: formData.record.map((re) =>
                      re._id !== rec._id
                        ? re
                        : {
                            ...rec,
                            typeOfComodityUUID: found.uuid,
                            productList: found.ComodityDetails,
                          }
                    ),
                  });
                }}
              >
                <option value="" disabled>
                  Select Type of Commodity
                </option>
                {allBioSecurityTypeOfComodities.map((type) => (
                  <option value={type.uuid}>{type.name}</option>
                ))}
              </select> */}
            </div>
            <div className="pr-2">
              <Select
                // isMulti
                // className="basic-multi-select w-full"
                required
                options={rec.productList.map((pr) => {
                  return {
                    value: pr.uuid,
                    label: `${pr.englishName} - ${pr.localName}`,
                  };
                })}
                classNamePrefix="select"
                onChange={(selectedValues) => {
                  const found = rec.productList.find(
                    (p) => p.uuid === selectedValues.value
                  );
                  setFormData({
                    ...formData,
                    record: formData.record.map((re) =>
                      re._id !== rec._id
                        ? re
                        : {
                            ...rec,
                            comodityDetailUUID: selectedValues.value,
                            category: found?.BioSecurityCategory.name || "",
                            code: found?.code || "",
                            unit: found?.BioSecurityUnit?.name || "",
                          }
                    ),
                  });
                }}
              />
            </div>

            <div className="pr-2">
              <input
                disabled
                placeholder="Auto Filled"
                className="form-control"
                value={rec.category || ""}
              />
            </div>
            {/* <div className="pr-2">
              <input
                disabled
                placeholder="Auto Filled"
                className="form-control"
                value={rec.category2 || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    record: formData.record.map((re) =>
                      re._id !== rec._id
                        ? re
                        : {
                            ...rec,
                            category2: e.target.value,
                          }
                    ),
                  });
                }}
              />
            </div> */}
            <div className="pr-2">
              <input
                disabled
                placeholder="Auto Filled"
                className="form-control"
                value={rec.code || ""}
              />
            </div>
            <div className="pr-2">
              <NumberFormat
                className="form-control"
                value={rec.actualQuantity || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  const quantity = e.floatValue * rec.netWeight;
                  setFormData({
                    ...formData,
                    record: formData.record.map((re) =>
                      re._id !== rec._id
                        ? re
                        : {
                            ...rec,
                            actualQuantity: e.floatValue,
                            quantity,
                          }
                    ),
                  });
                }}
              />
            </div>
            <div className="pr-2">
              <NumberFormat
                className="form-control"
                value={rec.netWeight || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  const quantity = e.floatValue * rec.actualQuantity;
                  setFormData({
                    ...formData,
                    record: formData.record.map((re) =>
                      re._id !== rec._id
                        ? re
                        : {
                            ...rec,
                            netWeight: e.floatValue,
                            quantity,
                          }
                    ),
                  });
                }}
              />
            </div>
            <div className="pr-2">
              <NumberFormat
                className="form-control"
                value={rec.quantity || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
                disabled
              />
            </div>
            <div className="pr-2">
              <input
                disabled
                placeholder="Auto Filled"
                className="form-control"
                value={rec.unit || ""}
              />
            </div>
            <div className="pr-2">
              <NumberFormat
                className="form-control"
                value={rec.cif || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    record: formData.record.map((re) =>
                      re._id !== rec._id
                        ? re
                        : {
                            ...rec,
                            cif: e.floatValue,
                          }
                    ),
                  });
                }}
              />
            </div>
            <div>
              <button
                className="bg-red-500 rounded-md px-4 py-2 text-white shadow-md"
                onClick={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    record: formData.record.filter((re) => re._id !== rec._id),
                  });
                }}
              >
                <p className="text-md">
                  <i className="fa fa-times" /> Delete
                </p>
              </button>
            </div>
          </div>
        ))}
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <TableAsync
          customHeaderUtilities={
            <div className="flex">
              <MonthAndYearsFilterWithExport
                label="Month Year Filter"
                controlledValue={yearMonth}
                // defaultValue={dayjs().format("YYYY-MM")}
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
                    setModalExportVisible(true);
                    // showLoadingSpinner();
                    // try {
                    //   const response = await exportBioSecurityImportData({
                    //     variables: {
                    //       monthYear: yearMonth,
                    //     },
                    //   });

                    //   window.open(
                    //     response.data.exportBioSecurityImportData,
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
          data={allBioSecurityImportData}
          withoutHeader={true}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege(["Import Data:Create"])
              ? () => {
                  setFormData({
                    pointOfEntry: currentUser?.controlPost || "",
                    district: currentUser?.district || "",
                    record: [],
                  });
                  setRegistrationNumberType("");
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Import Data:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} imports?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteBioSecurityImportData({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} imports deleted`,
                        level: "success",
                      });
                      await refetch();
                      setSavedCount((savedCount += 1));
                    }
                  } catch (err) {
                    handleError(err);
                  }
                  hideLoadingSpinner();
                  refetch();
                }
              : null
          }
          customUtilities={
            !currentUserDontHavePrivilege(["Import Data:Update"])
              ? customUtilities
              : null
          }
        />
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(page);
