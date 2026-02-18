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
import NumberFormat from "react-number-format";
import lodash from "lodash";
import { v4 as uuidv4 } from "uuid";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import Vegetable from "../../components/RetailPriceCropsImport/Vegetables";
import dayjs from "dayjs";
import { MonthAndYearsFilterWithExport } from "../../components/MonthAndYearsFilterWithExport";
import FileSaver from "file-saver";
import { base64toBlob } from "../../libs/base64";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query allVegetableRetailPrices($monthYear: String!) {
    countAllVegetableRetailPrices(monthYear: $monthYear)
    tokenizedAllFarmLocation
    #tokenizedAllCropVegetables
  }
`;

const SEARCH_VEGETABLE = gql`
  query searchAllCropVegetables($name: String) {
    searchAllCropVegetables(name: $name)
  }
`;

const RETAIL_QUERY = gql`
  query retailQuery(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllVegetableRetailPrices(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllVegetableRetailPrices(monthYear: $monthYear)
  }
`;

const CREATE_RETAILPRICE = gql`
  mutation tokenizedCreateManyVegetableRetailPrice($tokenized: String!) {
    tokenizedCreateManyVegetableRetailPrice(tokenized: $tokenized)
  }
`;

const UPDATE_RETAILPRICE = gql`
  mutation tokenizedUpdateVegetableRetailPrice($tokenized: String!) {
    tokenizedUpdateVegetableRetailPrice(tokenized: $tokenized)
  }
`;

const DELETE_RETAILPRICE = gql`
  mutation tokenizedDeleteVegetableRetailPrice($tokenized: String!) {
    tokenizedDeleteVegetableRetailPrice(tokenized: $tokenized)
  }
`;

const EXPORT_RETAIL_PRICE = gql`
  mutation exportVegetableRetailPrice($monthYear: String!) {
    exportVegetableRetailPrice(monthYear: $monthYear)
  }
`;

const page = () => {
  const [createVegetableRetailPrice] = useMutation(CREATE_RETAILPRICE);
  const [updateVegetableRetailPrice] = useMutation(UPDATE_RETAILPRICE);
  const [deleteVegetableRetailPrice] = useMutation(DELETE_RETAILPRICE);
  const [exportVegetableRetailPrice] = useMutation(EXPORT_RETAIL_PRICE);
  const client = useApolloClient();
  const [updateFormData, setUpdateFormData] = useState({});
  const [importForm, setImportForm] = useState(false);
  const router = useRouter();

  const [updateFormDataVisible, setUpdateFormDataVisible] = useState(false);
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const [selectedVegetable, setSelectedVegetable] = useState({});
  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      monthYear: yearMonth,
    },
  });
  const { currentUserDontHavePrivilege } = useCurrentUser();

  const [formData, setFormData] = useState({
    records: [],
  });
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  useEffect(async () => {
    if (importForm === false) {
      await refetch();
    }
  }, [importForm]);

  const [allVegetableRetailPrices, setAllVegetableRetailPrices] = useState([]);
  const [allFarmLocation, setAllFarmLocation] = useState([]);
  const [allCropVegetables, setAllCropVegetables] = useState([]);
  let [savedCount, setSavedCount] = useState(0);

  let [countVegetableRetailPrices, setCountVegetableRetailPrices] = useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countVegetableRetailPrices) return 1;
    return Math.ceil(countVegetableRetailPrices / pageSize);
  }, [countVegetableRetailPrices, pageSize]);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedVegetableRetailPrices = data?.tokenizedAllVegetableRetailPrices || "";
      // let allVegetableRetailPrices = [];
      // if (encryptedVegetableRetailPrices) {
      //   const decrypted = jwt.verify(encryptedVegetableRetailPrices, TOKENIZE);
      //   allVegetableRetailPrices = decrypted.queryResult;
      //   setAllVegetableRetailPrices(allVegetableRetailPrices);
      // }
      const encryptedFarmLocations = data?.tokenizedAllFarmLocation || "";
      let allFarmLocation = [];
      if (encryptedFarmLocations) {
        const decrypted = jwt.verify(encryptedFarmLocations, TOKENIZE);
        allFarmLocation = decrypted.queryResult;
        setAllFarmLocation(allFarmLocation);
      }
      // const encryptedCropVegetables = data?.tokenizedAllCropVegetables || "";
      // let allCropVegetables = [];
      // if (encryptedCropVegetables) {
      //   const decrypted = jwt.verify(encryptedCropVegetables, TOKENIZE);
      //   allCropVegetables = decrypted.queryResult;
      //   setAllCropVegetables(allCropVegetables);
      // }
      const countData = data?.countAllVegetableRetailPrices || 0;
      setCountVegetableRetailPrices(countData);
    }
  }, [data, loading, error, savedCount]);

  const [selectedMultipleVegetable, setSelectedMultipleVegetable] = useState(
    []
  );
  // const availableOptions = allCropVegetables.filter(
  //   (comm) => !selectedMultipleVegetable.includes(comm.uuid)
  // );
  // const [availableOptions, setAvailableOption] = useState([]);
  useEffect(() => {
    let selectedOption = formData.records
      .filter((vegetable) => vegetable.vegetableUUID)
      .map((veg) => veg.vegetableUUID);
    setSelectedMultipleVegetable(selectedOption);
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

  const getVegetable = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fetchingVegetable(input, callback);
    }
  };

  const fetchingVegetable = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_VEGETABLE,
      variables: {
        name: input,
      },
      fetchPolicy: "no-cache",
    });
    let allCropVegetablesQuery = [];
    const encryptedVegetable = result.data?.searchAllCropVegetables;
    if (encryptedVegetable) {
      const decrypted = jwt.verify(encryptedVegetable, TOKENIZE);
      allCropVegetablesQuery = decrypted.queryResult;
    }
    const filterVegetable = allCropVegetablesQuery.filter(
      (veg) => !selectedMultipleVegetable.includes(veg.uuid)
    );
    setAllCropVegetables(allCropVegetablesQuery);
    callback(filterVegetable);
  };

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: RETAIL_QUERY,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedVegetableRetailPrices =
      result.data?.tokenizedAllVegetableRetailPrices || "";
    let allVegetableRetailPrices = [];
    if (encryptedVegetableRetailPrices) {
      const decrypted = jwt.verify(encryptedVegetableRetailPrices, TOKENIZE);
      allVegetableRetailPrices = decrypted.queryResult;
      setAllVegetableRetailPrices(allVegetableRetailPrices);
    }
    const countData = result.data?.countAllVegetableRetailPrices || 0;
    setCountVegetableRetailPrices(countData);
    hideLoadingSpinner();
  }, [savedCount, yearMonth, pageSize, pageIndex, router.query.filters]);

  // const encryptedVegetableRetailPrices =
  //   data?.tokenizedAllVegetableRetailPrices || "";
  // let allVegetableRetailPrices = [];
  // if (encryptedVegetableRetailPrices) {
  //   const decrypted = jwt.verify(encryptedVegetableRetailPrices, TOKENIZE);
  //   allVegetableRetailPrices = decrypted.queryResult;
  // }

  // const encryptedFarmLocations = data?.tokenizedAllFarmLocation || "";
  // let allFarmLocations = [];
  // if (encryptedFarmLocations) {
  //   const decrypted = jwt.verify(encryptedFarmLocations, TOKENIZE);
  //   allFarmLocations = decrypted.queryResult;
  // }

  // const encryptedCropVegetables = data?.tokenizedAllCropVegetables || "";
  // let allCropVegetables = [];
  // if (encryptedCropVegetables) {
  //   const decrypted = jwt.verify(encryptedCropVegetables, TOKENIZE);
  //   allCropVegetables = decrypted.queryResult;
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
              onClick={(e) => {
                setUpdateFormDataVisible(true);
                setUpdateFormData({
                  ...props.row.original,
                  vegetableUUID: props.row.original?.Vegetable?.uuid || "",
                  vegetableId: props.row.original?.Vegetable?.vegetableId || "",
                });

                setSelectedVegetable([
                  {
                    value: props.row.original?.Vegetable?.uuid || "",
                    label: props.row.original?.Vegetable?.localName || "",
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
      Header: "Month & Year",
      accessor: "monthYear",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{dayjs(props.value).format("YYYY-MM")}</span>,
    },
    {
      Header: "Code",
      accessor: "Vegetable.vegetableId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Name",
      accessor: "Vegetable.localName",
      style: {
        fontSize: 20,
        width: 300,
      },
    },
    {
      Header: "Decription",
      accessor: "description",
      style: {
        fontSize: 20,
      },
    },
    // {
    //   Header: "District",
    //   accessor: "district",
    //   style: {
    //     fontSize: 20,
    //   },
    // },
    {
      Header: "Brunei Muara Price ($)",
      accessor: "bruneiMuaraPrice",
      style: {
        fontSize: 20,
      },
      Cell: (props) => (
        <NumberFormat
          className="form-control bg-none border-0 text-lg"
          value={props.value || 0}
          thousandSeparator={","}
          decimalSeparator={"."}
          fixedDecimalScale={true}
          disabled={true}
          decimalScale={2}
        />
      ),
    },
    {
      Header: "Tutong Price ($)",
      accessor: "tutongPrice",
      style: {
        fontSize: 20,
      },
      Cell: (props) => (
        <NumberFormat
          className="form-control bg-none border-0 text-lg"
          value={props.value || 0}
          thousandSeparator={","}
          decimalSeparator={"."}
          fixedDecimalScale={true}
          disabled={true}
          decimalScale={2}
        />
      ),
    },
    {
      Header: "Belait Price ($)",
      accessor: "belaitPrice",
      style: {
        fontSize: 20,
      },
      Cell: (props) => (
        <NumberFormat
          className="form-control bg-none border-0 text-lg"
          value={props.value || 0}
          thousandSeparator={","}
          decimalSeparator={"."}
          fixedDecimalScale={true}
          disabled={true}
          decimalScale={2}
        />
      ),
    },
    {
      Header: "Temburong Price ($)",
      accessor: "temburongPrice",
      style: {
        fontSize: 20,
      },
      Cell: (props) => (
        <NumberFormat
          className="form-control bg-none border-0 text-lg"
          value={props.value || 0}
          thousandSeparator={","}
          decimalSeparator={"."}
          fixedDecimalScale={true}
          disabled={true}
          decimalScale={2}
        />
      ),
    },
  ]);

  return (
    <AdminArea header={{ title: "Retail Price" }} urlQuery={router.query}>
      <FormModal
        title={`Edit Retail Price`}
        visible={updateFormDataVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setUpdateFormDataVisible(false);
          setUpdateFormData({});
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { uuid, __typename, __createdAt, __updatedAt } = updateFormData;
            let payload = {
              ...updateFormData,
            };
            delete payload.Vegetable;
            const tokenized = jwt.sign(payload, TOKENIZE);

            await updateVegetableRetailPrice({
              variables: {
                // ...updateFormData,
                tokenized,
              },
            });
            setSavedCount((savedCount += 1));
            setUpdateFormDataVisible(false);
            setUpdateFormData({});

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: ` Retail Price saved!`,
              level: "success",
            });
          } catch (error) {
            notification.handleError(error);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Month & Year* </label>
          <input
            required
            type="month"
            className="form-control"
            value={updateFormData.monthYear || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setUpdateFormData({
                ...updateFormData,
                monthYear: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Vegetable</label>
          <AsyncSelect
            loadOptions={getVegetable}
            classNamePrefix="Select"
            noOptionsMessage={() => "Type To Search"}
            getOptionLabel={(options) => options.localName}
            getOptionValue={(options) => options.uuid}
            autoFocus={true}
            value={updateFormData.Vegetable || ""}
            onChange={(selectedValues) => {
              setUpdateFormData({
                ...updateFormData,
                localName: selectedValues?.localName || "",
                vegetableUUID: selectedValues.uuid,
                vegetableId: selectedValues?.vegetableId || "",
                Vegetable: selectedValues,
              });
            }}
          />
          {/* <Select
            value={selectedVegetable}
            required
            options={allCropVegetables.map((pr) => {
              return {
                value: pr.uuid,
                label: `${pr.localName}`,
              };
            })}
            classNamePrefix="select"
            onChange={(selectedValues) => {
              const found = allCropVegetables.find(
                (p) => p.uuid === selectedValues.value
              );

              setUpdateFormData({
                ...updateFormData,
                localName: found?.localName || "",
                vegetableUUID: found.uuid,
                vegetableId: found?.vegetableId || "",
              });
              setSelectedVegetable([
                {
                  label: found.localName,
                  value: found.uuid,
                },
              ]);
            }}
          /> */}
        </div>
        <div className="form-group">
          <label>Code</label>
          <input
            className="form-control"
            value={updateFormData.vegetableId || ""}
            disabled
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <input
            className="form-control"
            value={updateFormData.description || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setUpdateFormData({
                ...updateFormData,
                description: e.target.value.toUpperCase(),
              });
            }}
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

            const tokenizedPayload = records.map((rec) => {
              const { Vegetable, ...records } = rec;
              return {
                monthYear: formData.monthYear,
                ...records,
              };
            });

            for (const payload of tokenizedPayload) {
              if (!payload.vegetableUUID) {
                throw {
                  message: "Invalid Vegetable Name",
                };
              }
              if (!payload.vegetableId) {
                throw {
                  message: "Invalid Vegetable ID",
                };
              }
            }

            const tokenized = jwt.sign({ tokenizedPayload }, TOKENIZE);

            await createVegetableRetailPrice({
              variables: {
                tokenized,
              },
            });

            // for (let record of formData.records) {
            //   delete record.Vegetable;
            //   const tokenizedPayload = {
            //     monthYear: formData.monthYear,
            //     ...record,
            //   };

            //   if (!tokenizedPayload.vegetableUUID) {
            //     throw {
            //       message: "Invalid Vegetable Name",
            //     };
            //   }
            //   if (!tokenizedPayload.vegetableId) {
            //     throw {
            //       message: "Invalid Vegetable ID",
            //     };
            //   }
            // }

            // for (const record of formData.records) {
            //   const tokenizedPayload = {
            //     monthYear: formData.monthYear,
            //     ...record,
            //   };
            //   const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
            //   await createVegetableRetailPrice({
            //     variables: {
            //       // monthYear: formData.monthYear,
            //       // ...record,
            //       tokenized,
            //     },
            //   });
            // }

            setSavedCount((savedCount += 1));
            await refetch();
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
        <div className="form-group">
          <label>Month & Year*</label>
          <input
            required
            type="month"
            className="form-control w-1/4 uppercase"
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
                },
              ],
            });
          }}
        >
          <i className="fa fa-plus" /> Add New
        </button>

        <div className="grid grid-cols-8">
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
            Vegetable
          </div>
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
            Code
          </div>
          <div className="flex items-center justify-center bg-mantis-500 text-white font-bold text-center text-md py-3">
            Description
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
              <AsyncSelect
                loadOptions={getVegetable}
                classNamePrefix="Select"
                noOptionsMessage={() => "Type To Search"}
                getOptionLabel={(options) => options.localName}
                getOptionValue={(options) => options.uuid}
                autoFocus={true}
                value={rec.Vegetable || ""}
                onChange={(selectedValues) => {
                  let { uuid, ...d } = selectedValues;

                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            ...d,
                            vegetableUUID: selectedValues.uuid,
                            Vegetable: selectedValues,
                          }
                    ),
                  });
                }}
              />
              {/* <Select
                value={{
                  value: rec.vegetableUUID,
                  label: rec.localName,
                }}
                required
                options={availableOptions.map((pr) => {
                  return {
                    value: pr.uuid,
                    label: `${pr.localName}`,
                  };
                })}
                classNamePrefix="select"
                onChange={(selectedValues) => {
                  const found = allCropVegetables.find(
                    (p) => p.uuid === selectedValues.value
                  );

                  let { uuid, ...d } = found;

                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      re.uuid !== rec.uuid
                        ? re
                        : {
                            ...rec,
                            ...d,
                            vegetableUUID: found.uuid,
                          }
                    ),
                  });
                  setSelectedVegetable(found);
                }}
              /> */}
            </div>
            <div>
              <input
                disabled
                placeholder="Auto Filled"
                className="form-control"
                value={rec.vegetableId || ""}
              />
            </div>
            <div>
              <input
                className="form-control"
                value={rec.description || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    records: formData.records.map((re) =>
                      rec.uuid !== re.uuid
                        ? re
                        : {
                            ...rec,
                            description: e.target.value.toUpperCase(),
                          }
                    ),
                  });
                }}
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
          <Vegetable />
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
                      showLoadingSpinner();
                      try {
                        const response = await exportVegetableRetailPrice({
                          variables: {
                            monthYear: yearMonth,
                          },
                        });

                        // Convert base64 to blob
                        const base64Response =
                          response.data.exportVegetableRetailPrice;
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
                        link.download = "vegetable_retail_price.xlsx";
                        link.click();
                        window.URL.revokeObjectURL(url);


                        // window.open(
                        //   response.data.exportVegetableRetailPrice,
                        //   "__blank"
                        // );
                      } catch (err) {
                        notification.handleError(err);
                      }
                      hideLoadingSpinner();
                    }}
                  >
                    Export Excel
                  </button>
                </div>
              </div>
            }
            loading={false}
            columns={columns}
            data={allVegetableRetailPrices}
            controlledFilters={filters}
            controlledPageIndex={pageIndex}
            controlledPageCount={pageCount}
            controlledPageSize={pageSize}
            onPageChange={handlePageChange}
            withoutHeader={true}
            customUtilities={
              !currentUserDontHavePrivilege(["Vegetable Retail Price:Update"])
                ? customUtilities
                : null
            }
            customUtilitiesPosition="left"
            onAdd={
              !currentUserDontHavePrivilege(["Vegetable Retail Price:Create"])
                ? () => {
                    setFormData({
                      records: [],
                    });
                    setModalVisible(true);
                  }
                : null
            }
            onRemove={
              !currentUserDontHavePrivilege(["Vegetable Retail Price:Delete"])
                ? async ({ rows }) => {
                    showLoadingSpinner();
                    try {
                      let yes = confirm(
                        `Are you sure to delete ${rows.length} Crops Retail Price?`
                      );
                      if (yes) {
                        for (const row of rows) {
                          const tokenized = jwt.sign(row, TOKENIZE);
                          deleteVegetableRetailPrice({
                            variables: {
                              // uuid: row.uuid,
                              tokenized,
                            },
                          });
                        }
                        setSavedCount((savedCount += 1));
                        notification.addNotification({
                          title: "Success!",
                          message: `${rows.length} Crops Retail Price deleted`,
                          level: "success",
                        });
                        await refetch();
                        setSavedCount((savedCount += 1));
                      }
                    } catch (error) {
                      handleError(error);
                    }
                    hideLoadingSpinner();
                    refetch();
                  }
                : null
            }
          />
        )}
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(page);
