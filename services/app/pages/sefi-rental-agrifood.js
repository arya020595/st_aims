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
import { create, filter, mergeWith } from "lodash";
import { from } from "apollo-link";
import { configure } from "nprogress";
import Head from "next/dist/next-server/lib/head";
import NumberFormat from "react-number-format";
import dayjs from "dayjs";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries($startDate: String, $endDate: String, $filters: String) {
    tokenizedAllSefiRentalMachineries
    countAllSEFIRentals(
      startDate: $startDate
      endDate: $endDate
      filters: $filters
    )
  }
`;

const SEFI_RENTAL_QUERY = gql`
  query allSefiRental(
    $startDate: String
    $endDate: String
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllSEFIRentals(
      startDate: $startDate
      endDate: $endDate
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllSEFIRentals(
      startDate: $startDate
      endDate: $endDate
      filters: $filters
    )
  }
`;

const SEARCH_COMPANY_PROFILE = gql`
  query agrifoodCompanyProfile($name: String) {
    searchAllAgrifoodCompanyProfiles(name: $name)
  }
`;

const PRODUCT_QUERY = gql`
  query tokenizedAllProductCatalogueDetailsByCompany(
    $tokenizedParams: String!
  ) {
    tokenizedAllProductCatalogueDetailsByCompany(
      tokenizedParams: $tokenizedParams
    )
  }
`;

const CREATE_SEFI = gql`
  mutation tokenizedCreateSEFIRental($tokenized: String!) {
    tokenizedCreateSEFIRental(tokenized: $tokenized)
  }
`;

const UPDATE_SEFI = gql`
  mutation tokenizedUpdateSEFIRental($tokenized: String!) {
    tokenizedUpdateSEFIRental(tokenized: $tokenized)
  }
`;

const DELETE_SEFI = gql`
  mutation tokenizedDeleteSEFIRental($tokenized: String!) {
    tokenizedDeleteSEFIRental(tokenized: $tokenized)
  }
`;

const EXPORT_SEFI_RENTAL = gql`
  mutation exportSEFIRental(
    $startDate: String
    $endDate: String
    $companyUUID: String
    $productName: String
  ) {
    exportSEFIRental(
      startDate: $startDate
      endDate: $endDate
      companyUUID: $companyUUID
      productName: $productName
    )
  }
`;

const IS_CHECK_FARMER = gql`
  query isFarmerCheck {
    isFarmerCheck
  }
`;

const page = () => {
  const router = useRouter();
  const client = useApolloClient();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const [startDate, setStartDate] = useState(
    router.query.startDate || dayjs().startOf("month").format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(
    router.query.endDate || dayjs().endOf("month").format("YYYY-MM-DD")
  );

  const { data, error, loading, refetch } = useQuery(QUERY, {
    variables: {
      startDate: startDate,
      endDate: endDate,
      filters: router.query.filters,
    },
  });

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    sefiMachineryIds: [],
    quantity: 0,
    price: 0,
    totalValueProduced: 0,
  });

  const [priceLists, setPriceList] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();
  const [registerType, setRegisterType] = useState("");
  const [createSEFIRental] = useMutation(CREATE_SEFI);
  const [updateSEFIRental] = useMutation(UPDATE_SEFI);
  const [deleteSEFIRental] = useMutation(DELETE_SEFI);
  const [exportSEFIRental] = useMutation(EXPORT_SEFI_RENTAL);
  const [exportFormData, setExportFormData] = useState({});
  const [modalExportVisible, setModalExportVisible] = useState(false);

  const [selectedCompanyName, setSelectedCompanyName] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const [allSefiRentalMachineries, setAllSefiRentalMachineries] = useState([]);
  const [allAgrifoodCompanyProfiles, setAllAgrifoodCompanyProfiles] = useState(
    []
  );
  const [allSEFIRentals, setAllSEFIRentals] = useState([]);

  let [savedCount, setSavedCount] = useState(0);

  let [countSEFIRentals, setCountSEFIRentals] = useState(0);
  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countSEFIRentals) return 1;
    return Math.ceil(countSEFIRentals / pageSize);
  }, [countSEFIRentals, pageSize]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedSefiRentalMachineries =
        data?.tokenizedAllSefiRentalMachineries || "";
      let allSefiRentalMachineries = [];
      if (encryptedSefiRentalMachineries) {
        const decrypted = jwt.verify(encryptedSefiRentalMachineries, TOKENIZE);
        allSefiRentalMachineries = decrypted.queryResult;
        setAllSefiRentalMachineries(allSefiRentalMachineries);
      }

      // const encryptedAgrifoodCompanyProfiles = data?.tokenizedAllAgrifoodCompanyProfiles || "";
      // let allAgrifoodCompanyProfiles = [];
      // if (encryptedAgrifoodCompanyProfiles) {
      //   const decrypted = jwt.verify(encryptedAgrifoodCompanyProfiles, TOKENIZE);
      //   allAgrifoodCompanyProfiles = decrypted.queryResult;
      //   setAllAgrifoodCompanyProfiles(allAgrifoodCompanyProfiles);
      // }

      // const encryptedSEFIRentals = data?.tokenizedAllSEFIRentals || "";
      // let allSEFIRentals = [];
      // if (encryptedSEFIRentals) {
      //   const decrypted = jwt.verify(encryptedSEFIRentals, TOKENIZE);
      //   allSEFIRentals = decrypted.queryResult;
      //   setAllSEFIRentals(allSEFIRentals);
      // }
      const countData = data?.countAllSEFIRentals || 0;
      setCountSEFIRentals(countData);
    }
  }, [data, loading, error, savedCount]);

  // let allSefiRentalMachineries = [];
  // const encryptedSefiRentalMachineries =
  //   data?.tokenizedAllSefiRentalMachineries || "";
  // if (encryptedSefiRentalMachineries) {
  //   const decrypted = jwt.verify(encryptedSefiRentalMachineries, TOKENIZE);
  //   allSefiRentalMachineries = decrypted.queryResult;
  // }

  // let allAgrifoodCompanyProfiles = [];
  // const encryptedAgrifoodCompanyProfiles =
  //   data?.tokenizedAllAgrifoodCompanyProfiles || "";
  // if (encryptedAgrifoodCompanyProfiles) {
  //   const decrypted = jwt.verify(encryptedAgrifoodCompanyProfiles, TOKENIZE);
  //   allAgrifoodCompanyProfiles = decrypted.queryResult;
  // }

  // let allSEFIRentals = [];
  // const encryptedSEFIRentals = data?.tokenizedAllSEFIRentals || "";
  // if (encryptedSEFIRentals) {
  //   const decrypted = jwt.verify(encryptedSEFIRentals, TOKENIZE);
  //   allSEFIRentals = decrypted.queryResult;
  // }

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: SEFI_RENTAL_QUERY,
      variables: {
        startDate: startDate,
        endDate: endDate,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });
    const encryptedSEFIRentals = result.data?.tokenizedAllSEFIRentals || "";
    let allSefiRental = [];
    if (encryptedSEFIRentals) {
      const decrypted = jwt.verify(encryptedSEFIRentals, TOKENIZE);
      allSefiRental = decrypted.queryResult;
      setAllSEFIRentals(allSefiRental);
    }
    const countData = result.data?.countAllSEFIRentals || 0;
    setCountSEFIRentals(countData);
    hideLoadingSpinner();
  }, [
    savedCount,
    startDate,
    endDate,
    pageSize,
    pageIndex,
    router.query.filters,
  ]);

  const handlePageChange = useCallback(
    async ({ pageIndex, pageSize, filters }) => {
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            startDate: startDate,
            endDate: endDate,
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

  const fethchingCompany = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_COMPANY_PROFILE,
      variables: {
        name: input,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedAgrifoodCompanyProfiles =
      result.data?.searchAllAgrifoodCompanyProfiles || "";
    let allAgrifoodCompanyProfiles = [];
    if (encryptedAgrifoodCompanyProfiles) {
      const decrypted = jwt.verify(encryptedAgrifoodCompanyProfiles, TOKENIZE);
      allAgrifoodCompanyProfiles = decrypted.queryResult;
      setAllAgrifoodCompanyProfiles(allAgrifoodCompanyProfiles);
    }
    callback(allAgrifoodCompanyProfiles);
  };

  const getCompany = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fethchingCompany(input, callback);
    }
  };

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      // const endDate = dayjs(formData.endDate).add(1, "day");
      const diff = dayjs(formData.endDate).diff(formData.startDate, "day") + 1;

      let count = 0;
      for (let i = 0; i < diff; i++) {
        let day = dayjs(formData.startDate).add(i, "day").get("day");
        if (day !== 5 && day !== 0) {
          count++;
        }
      }

      setFormData({
        ...formData,
        durationOfRental: count,
      });
    }
  }, [formData.startDate, formData.endDate]);

  useEffect(() => {
    setFormData({
      ...formData,
      totalValueProduced: formData.quantity * formData.price,
    });
  }, [formData.quantity, formData.price]);

  useEffect(async () => {
    const result = await client.query({
      query: IS_CHECK_FARMER,
      fetchPolicy: "no-cache",
    });

    const farmerCheck = result.data.isFarmerCheck;
    if (farmerCheck) {
      const result = await client.query({
        query: SEARCH_COMPANY_PROFILE,
        variables: {},
        fetchPolicy: "no-cache",
      });

      const encryptedAgrifoodCompanyProfiles =
        result.data?.searchAllAgrifoodCompanyProfiles || "";
      let allAgrifoodCompanyProfiles = [];
      if (encryptedAgrifoodCompanyProfiles) {
        const decrypted = jwt.verify(
          encryptedAgrifoodCompanyProfiles,
          TOKENIZE
        );
        allAgrifoodCompanyProfiles = decrypted.queryResult;
        setAllAgrifoodCompanyProfiles(allAgrifoodCompanyProfiles);
      }
      setRegisterType("FARMER");
    } else {
      setRegisterType("OFFICER");
    }
  }, []);

  const customUtilities = useMemo(() => [
    {
      label: "Edit",
      icon: <i className="fa fa-pencil" />,
      width: 400,

      render: (props) => {
        const formatter = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        });

        const price = formatter.format(props.row?.original?.price);
        return (
          <div className="flex">
            <button
              onClick={async (e) => {
                const tokenizedPayload = {
                  companyUUID: props.row.original.companyUUID,
                };
                const tokenizedParams = jwt.sign(tokenizedPayload, TOKENIZE);
                const products = await client.query({
                  query: PRODUCT_QUERY,
                  variables: {
                    tokenizedParams,
                    // companyUUID: props.row.original.companyUUID,
                  },
                  fetchPolicy: "no-cache",
                });

                let allProduct = [];
                const encryptedProduct =
                  products.data?.tokenizedAllProductCatalogueDetailsByCompany ||
                  "";
                if (encryptedProduct) {
                  const decrypted = jwt.verify(encryptedProduct, TOKENIZE);
                  allProduct = decrypted.queryResult;
                }

                let found = null;
                if (products.data.allProductCatalogueDetailsByCompany) {
                  found =
                    products.data.allProductCatalogueDetailsByCompany.find(
                      (p) =>
                        p.uuid ===
                        props.row.original.productCatalogueDetailsUUID
                    );
                }
                setModalVisible(true);

                setFormData({
                  ...props.row.original,
                  CompanyProfile: {
                    companyName: props.row?.original?.companyName,
                    uuid: props.row?.original?.companyUUID,
                  },
                  PricePerKg: {
                    value: props.row?.original?.price,
                    label: price,
                  },
                });
                setAllProducts(allProduct);
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
      Header: "Start Date Of Rental",
      accessor: "startDate",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "End Date Of Rental",
      accessor: "endDate",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Company Name",
      accessor: "companyName",
      style: {
        fontSize: 20,
        width: 300,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Product Name",
      accessor: "productCatalogueDetailsName",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Duration Of Rental",
      accessor: "durationOfRental",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Quantity Produced (Unit)",
      accessor: "quantity",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Price ($)",
      accessor: "price",
      style: {
        fontSize: 20,
        width: 200,
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
      Header: "Value For Quantity Produced ($)",
      accessor: "totalValueProduced",
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

  return (
    <AdminArea header={{ title: "SEFI Rental" }} urlQuery={router.query}>
      <FormModal
        title={`Non-Compliance & Enforcement`}
        visible={modalExportVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalExportVisible(false);
          setExportFormData({});
          setSelectedCompanyName({});
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setModalExportVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportSEFIRental({
              variables: {
                ...exportFormData,
              },
            });

            const base64Response = response.data.exportSEFIRental;
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
            link.download = "sefi_rental.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);

            // window.open(response.data.exportSEFIRental, "__blank");
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}
      >
        <div>
          {/* <MonthAndYearsFilterWithExport
            label="Month Year Filter"
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
          /> */}
          <div className="form-group">
            <label>Start Date*</label>
            <input
              required
              type="date"
              className="form-control"
              value={exportFormData.startDate || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setExportFormData({
                  ...exportFormData,
                  startDate: e.target.value,
                });
              }}
            />
          </div>

          <div className="form-group">
            <label>End Date*</label>
            <input
              required
              type="date"
              className="form-control"
              value={exportFormData.endDate || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setExportFormData({
                  ...exportFormData,
                  endDate: e.target.value,
                });
              }}
            />
          </div>

          <div className="form-group">
            <label>Company Name</label>
            {/* <Select
              isClearable={true}
              value={selectedCompanyName}
              options={allAgrifoodCompanyProfiles.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.companyName,
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allAgrifoodCompanyProfiles.find((profile) =>
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
            {registerType === "OFFICER" ? (
              <AsyncSelect
                loadOptions={getCompany}
                classNamePrefix="select"
                noOptionsMessage={() => "Type to Search"}
                getOptionLabel={(option) => `${option.companyName}`}
                getOptionValue={(option) => option.uuid}
                autoFocus={true}
                onChange={(selectedValues) => {
                  const found = allAgrifoodCompanyProfiles.find((profile) =>
                    selectedValues ? profile.uuid === selectedValues.uuid : null
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
            ) : (
              <Select
                options={allAgrifoodCompanyProfiles}
                classNamePrefix="select"
                getOptionLabel={(option) => `${option.companyName}`}
                getOptionValue={(option) => option.uuid}
                autoFocus={true}
                onChange={(selectedValues) => {
                  const found = allAgrifoodCompanyProfiles.find((profile) =>
                    selectedValues ? profile.uuid === selectedValues.uuid : null
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
            )}
          </div>
          <div className="form-group">
            <label>Product Name</label>
            <input
              className="form-control"
              value={exportFormData.productName || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setExportFormData({
                  ...exportFormData,
                  productName: e.target.value.toUpperCase(),
                });
              }}
            />
          </div>

          <br />
          <br />
        </div>
      </FormModal>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} SEFI  Rental`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            startDate: "",
            endDate: "",
            sefiMachineryIds: [],
          });
          setAllProducts([]);
          setPriceList([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            const { uuid, __typename } = formData;
            if (!uuid) {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await createSEFIRental({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
              setPriceList([]);
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateSEFIRental({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
              setPriceList([]);
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `SEFI Rental saved!`,
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
          <label>Start Date Of Rental*</label>
          <input
            required
            type="date"
            className="form-control"
            value={formData.startDate || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                startDate: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>End Date Of Rental*</label>
          <input
            required
            type="date"
            className="form-control"
            value={formData.endDate || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                endDate: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Company Name</label>
          {/* <select
            className="form-control"
            value={formData.companyUUID || ""}
            required
            onChange={async (e) => {
              if (e) e.preventDefault();
              const found = allAgrifoodCompanyProfiles.find(
                (company) => company.uuid === e.target.value
              );
              const tokenizedPayload = {
                companyUUID: found.uuid,
              };
              const tokenizedParams = jwt.sign(tokenizedPayload, TOKENIZE);
              const products = await client.query({
                query: PRODUCT_QUERY,
                variables: {
                  // companyUUID: found.uuid,
                  tokenizedParams,
                },
              });

              let allProduct = [];
              const encryptedProduct =
                products.data?.tokenizedAllProductCatalogueDetailsByCompany ||
                "";
              if (encryptedProduct) {
                const decrypted = jwt.verify(encryptedProduct, TOKENIZE);
                allProduct = decrypted.queryResult;
              }

              setFormData({
                ...formData,
                companyUUID: found?.uuid || "",
                companyName: found?.companyName || "",
              });

              setAllProducts(allProduct);
            }}
          >
            <option value="" disabled>
              Select Company Name
            </option>
            {allAgrifoodCompanyProfiles.map((company) => (
              <option value={company.uuid}>{company.companyName}</option>
            ))}
          </select> */}
          {registerType === "OFFICER" ? (
            <AsyncSelect
              loadOptions={getCompany}
              value={formData.CompanyProfile}
              classNamePrefix="select"
              noOptionsMessage={() => "Type to Search"}
              getOptionLabel={(option) => `${option.companyName}`}
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              onChange={async (selectedValues) => {
                const found = allAgrifoodCompanyProfiles.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.uuid : null
                );
                const tokenizedPayload = {
                  companyUUID: found.uuid,
                };
                const tokenizedParams = jwt.sign(tokenizedPayload, TOKENIZE);
                const products = await client.query({
                  query: PRODUCT_QUERY,
                  variables: {
                    // companyUUID: found.uuid,
                    tokenizedParams,
                  },
                });

                let allProduct = [];
                const encryptedProduct =
                  products.data?.tokenizedAllProductCatalogueDetailsByCompany ||
                  "";
                if (encryptedProduct) {
                  const decrypted = jwt.verify(encryptedProduct, TOKENIZE);
                  allProduct = decrypted.queryResult;
                }

                setFormData({
                  ...formData,
                  companyUUID: found?.uuid || "",
                  companyName: found?.companyName || "",
                });

                setAllProducts(allProduct);
              }}
            />
          ) : (
            <Select
              options={allAgrifoodCompanyProfiles}
              value={formData.CompanyProfile}
              classNamePrefix="select"
              getOptionLabel={(option) => `${option.companyName}`}
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              onChange={async (selectedValues) => {
                const found = allAgrifoodCompanyProfiles.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.uuid : null
                );
                const tokenizedPayload = {
                  companyUUID: found.uuid,
                };
                const tokenizedParams = jwt.sign(tokenizedPayload, TOKENIZE);
                const products = await client.query({
                  query: PRODUCT_QUERY,
                  variables: {
                    // companyUUID: found.uuid,
                    tokenizedParams,
                  },
                });

                let allProduct = [];
                const encryptedProduct =
                  products.data?.tokenizedAllProductCatalogueDetailsByCompany ||
                  "";
                if (encryptedProduct) {
                  const decrypted = jwt.verify(encryptedProduct, TOKENIZE);
                  allProduct = decrypted.queryResult;
                }

                setFormData({
                  ...formData,
                  companyUUID: found?.uuid || "",
                  companyName: found?.companyName || "",
                });

                setAllProducts(allProduct);
              }}
            />
          )}
        </div>
        <div className="form-group">
          <label>Product Name</label>
          <select
            className="form-control"
            value={formData.productCatalogueDetailsUUID || ""}
            onChange={(e) => {
              const found = allProducts.find(
                (prod) => prod.uuid === e.target.value
              );

              setFormData({
                ...formData,
                productCatalogueDetailsUUID: found?.uuid || "",
                productCatalogueDetailsName: found?.name || "",
              });

              setPriceList(found?.priceLists || []);
            }}
          >
            <option value="" disabled>
              Select Product Name
            </option>
            {allProducts.map((prod) => (
              <option value={prod.uuid}>{prod.name.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Duration Of Rental (Day(s))</label>
          <NumberFormat
            className="form-control"
            disabled
            placeholder="Auto Calculate"
            value={formData.durationOfRental || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
          />
        </div>
        <div className="form-group">
          <label>Quantity Produced (Kg)</label>
          <NumberFormat
            className="form-control"
            value={formData.quantity || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                quantity: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Price per Kg ($)</label>
          <Select
            // isMulti
            // className="basic-multi-select w-full"
            required
            value={formData.PricePerKg}
            options={priceLists.map((pr) => {
              // Create our number formatter.
              const formatter = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",

                // These options are needed to round to whole numbers if that's what you want.
                //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
                //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
              });

              const price = formatter.format(pr.price);

              return {
                value: pr.price,
                label: price,
              };
            })}
            classNamePrefix="select"
            onChange={(selectedValues) => {
              const found = priceLists.find(
                (price) => price.price === selectedValues.value
              );

              const formatter = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              });

              const price = formatter.format(found.price);
              const PricePerKg = {
                value: found.price,
                label: price,
              };
              setFormData({
                ...formData,
                PricePerKg: PricePerKg,
                price: selectedValues.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Total Value Produced($)</label>
          <NumberFormat
            className="form-control"
            disabled
            placeholder="0"
            value={formData.totalValueProduced || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                totalValueProduced: e.floatValue,
              });
            }}
          />
        </div>
        <label>Machineries Used: </label>
        <div className="grid grid-cols-3 gap-2">
          {allSefiRentalMachineries.map((machinery) => {
            let isChecked = false;

            const foundIndex = formData.sefiMachineryIds.findIndex(
              (idx) => idx === machinery.uuid
            );

            if (foundIndex > -1) {
              isChecked = true;
            } else {
              isChecked = false;
            }
            return (
              <div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  className="mx-2"
                  onChange={(e) => {
                    // if (e) e.preventDefault();

                    if (foundIndex === -1) {
                      setFormData({
                        ...formData,
                        sefiMachineryIds: [
                          ...formData.sefiMachineryIds,
                          machinery.uuid,
                        ],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        sefiMachineryIds: formData.sefiMachineryIds.filter(
                          (p) => p !== machinery.uuid
                        ),
                      });
                    }
                  }}
                />
                <label>{machinery.machineName}</label>
              </div>
            );
          })}
        </div>
        <div className="form-group">
          <label>Payment Receipt No.</label>
          <input
            className="form-control"
            value={formData.paymentReceiptNo || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                paymentReceiptNo: e.target.value,
              });
            }}
          />
        </div>
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <TableAsync
          loading={loading}
          columns={columns}
          data={allSEFIRentals}
          withoutHeader={true}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          customHeaderUtilities={
            <div className="flex">
              <div className="flex mr-2">
                <div className="mr-2">
                  <label>Start Date</label>
                  <input
                    className="form-control"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      if (e) e.preventDefault();
                      setStartDate(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <label>End Date </label>
                  <input
                    className="form-control"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      if (e) e.preventDefault();
                      try {
                        if (startDate > e.target.value) {
                          throw {
                            message: "Invalid Date Range",
                          };
                        }
                        setEndDate(e.target.value);
                      } catch (error) {
                        notification.handleError(error);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button
                  className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                  onClick={async (e) => {
                    if (e) e.preventDefault();
                    setExportFormData({
                      startDate: dayjs(new Date()).format("YYYY-MM-DD"),
                      endDate: dayjs(new Date()).format("YYYY-MM-DD"),
                    });
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
          customUtilities={
            !currentUserDontHavePrivilege(["SEFI Rental:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege(["SEFI Rental:Create"])
              ? () => {
                  setFormData({
                    startDate: "",
                    endDate: "",
                    sefiMachineryIds: [],
                    quantity: 0,
                    price: 0,
                    totalValueProduced: 0,
                  });
                  setModalVisible(true);
                  setAllProducts([]);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["SEFI Rental:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} sefi rentals?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteSEFIRental({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                        setSavedCount((savedCount += 1));
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} sefi rentals deleted`,
                        level: "success",
                      });
                      await refetch();
                    }
                  } catch (err) {
                    handleError(err);
                  }
                  hideLoadingSpinner();
                  refetch();
                }
              : null
          }
        />
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(page);
