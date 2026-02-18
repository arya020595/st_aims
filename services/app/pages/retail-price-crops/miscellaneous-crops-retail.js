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
import MiscellaneousCrops from "../../components/RetailPriceCropsImport/MiscellaneousCrops";
import dayjs from "dayjs";
import { MonthAndYearsFilterWithExport } from "../../components/MonthAndYearsFilterWithExport";
import { ExecutableDefinitionsRule } from "graphql";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;
const QUERY = gql`
  query allMiscellaneousCropsRetailPrices($monthYear: String!) {
    countAllMiscellaneousCropsRetailPrices(monthYear: $monthYear)

    tokenizedAllFarmLocation

    #tokenizedAllMiscellaneousCrops
  }
`;

const RETAIL_QUERY = gql`
  query retailQuery(
    $monthYear: String!
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllMiscellaneousCropsRetailPrices(
      monthYear: $monthYear
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAllMiscellaneousCropsRetailPrices(monthYear: $monthYear)
  }
`;

const SEARCH_MIST_CROPS = gql`
  query searchMiscCrops($searchTerm: String) {
    searchMiscCrops(searchTerm: $searchTerm)
  }
`;

const CREATE_RETAILPRICE = gql`
  mutation tokenizedCreateManyMiscellaneousCropsRetailPrice(
    $tokenized: String!
  ) {
    tokenizedCreateManyMiscellaneousCropsRetailPrice(tokenized: $tokenized)
  }
`;

const UPDATE_RETAILPRICE = gql`
  mutation tokenizedUpdateMiscellaneousCropsRetailPrice($tokenized: String!) {
    tokenizedUpdateMiscellaneousCropsRetailPrice(tokenized: $tokenized)
  }
`;

const DELETE_RETAILPRICE = gql`
  mutation tokenizedDeleteMiscellaneousCropsRetailPrice($tokenized: String!) {
    tokenizedDeleteMiscellaneousCropsRetailPrice(tokenized: $tokenized)
  }
`;

const EXPORT_MISCELLANEOUS_RETAIL_PRICE = gql`
  mutation exportsMiscellaneousRetailPrice($monthYear: String!) {
    exportsMiscellaneousRetailPrice(monthYear: $monthYear)
  }
`;

const page = () => {
  const router = useRouter();
  const client = useApolloClient();
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      monthYear: yearMonth,
    },
  });
  const [createMiscellaneousCropsRetailPrice] = useMutation(CREATE_RETAILPRICE);
  const [updateMiscellaneousCropsRetailPrice] = useMutation(UPDATE_RETAILPRICE);
  const [deleteMiscellaneousCropsRetailPrice] = useMutation(DELETE_RETAILPRICE);
  const [exportsMiscellaneousRetailPrice] = useMutation(
    EXPORT_MISCELLANEOUS_RETAIL_PRICE
  );

  const [updateFormData, setUpdateFormData] = useState({});
  const [updateFormDataVisible, setUpdateFormDataVisible] = useState(false);
  const [importForm, setImportForm] = useState(false);
  const [selectedMiscellaneousCrops, setSelectedMiscellaneousCrops] = useState(
    {}
  );

  let [
    countMiscellaneousCropsRetailPrice,
    setCountMiscellaneousCropsRetailPrice,
  ] = useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countMiscellaneousCropsRetailPrice) return 1;
    return Math.ceil(countMiscellaneousCropsRetailPrice / pageSize);
  }, [countMiscellaneousCropsRetailPrice, pageSize]);

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

  const [
    allMiscellaneousCropsRetailPrices,
    setAllMiscellaneousCropsRetailPrices,
  ] = useState([]);
  const [allFarmLocation, setAllFarmLocation] = useState([]);
  const [allMiscellaneousCrops, setAllMiscellaneousCrops] = useState([]);
  let [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedMiscellaneousCropsRetailPrices = data?.tokenizedAllMiscellaneousCropsRetailPrices || "";
      // let allMiscellaneousCropsRetailPrices = [];
      // if (encryptedMiscellaneousCropsRetailPrices) {
      //   const decrypted = jwt.verify(encryptedMiscellaneousCropsRetailPrices, TOKENIZE);
      //   allMiscellaneousCropsRetailPrices = decrypted.queryResult;
      //   setAllMiscellaneousCropsRetailPrices(allMiscellaneousCropsRetailPrices);
      // }
      const encryptedFarmLocations = data?.tokenizedAllFarmLocation || "";
      let allFarmLocation = [];
      if (encryptedFarmLocations) {
        const decrypted = jwt.verify(encryptedFarmLocations, TOKENIZE);
        allFarmLocation = decrypted.queryResult;
        setAllFarmLocation(allFarmLocation);
      }
      // const encryptedMiscellaneousCrops =
      //   data?.tokenizedAllMiscellaneousCrops || "";
      // let allMiscellaneousCrops = [];
      // if (encryptedMiscellaneousCrops) {
      //   const decrypted = jwt.verify(encryptedMiscellaneousCrops, TOKENIZE);
      //   allMiscellaneousCrops = decrypted.queryResult;
      //   setAllMiscellaneousCrops(allMiscellaneousCrops);
      // }
      const countData = data?.countAllMiscellaneousCropsRetailPrices || 0;
      setCountMiscellaneousCropsRetailPrice(countData);
    }
  }, [data, loading, error]);

  const [selectedMultipleMiscellaneous, setSelectedMultipleMiscellaneous] =
    useState([]);
  // const availableOptions = allMiscellaneousCrops.filter(
  //   (comm) => !selectedMultipleMiscellaneous.includes(comm.uuid)
  // );

  useEffect(() => {
    let selectedOption = formData.records
      .filter((Miscellaneous) => Miscellaneous.miscellaneousCropUUID)
      .map((veg) => veg.miscellaneousCropUUID);
    setSelectedMultipleMiscellaneous(selectedOption);
  }, [formData.records]);

  // const encryptedMiscellaneousCropsRetailPrices =
  //   data?.tokenizedAllMiscellaneousCropsRetailPrices || "";
  // let allMiscellaneousCropsRetailPrices = [];
  // if (encryptedMiscellaneousCropsRetailPrices) {
  //   const decrypted = jwt.verify(
  //     encryptedMiscellaneousCropsRetailPrices,
  //     TOKENIZE
  //   );
  //   allMiscellaneousCropsRetailPrices = decrypted.queryResult;
  // }

  // const encryptedFarmLocations = data?.tokenizedAllFarmLocation || "";
  // let allFarmLocations = [];
  // if (encryptedFarmLocations) {
  //   const decrypted = jwt.verify(encryptedFarmLocations, TOKENIZE);
  //   allFarmLocations = decrypted.queryResult;
  // }

  let allFarmLocations = allFarmLocation;
  allFarmLocations = lodash.uniqBy(allFarmLocations, (loc) => loc.district);

  // const encryptedMiscellaneousCrops =
  //   data?.tokenizedAllMiscellaneousCrops || "";
  // let allMiscellaneousCrops = [];
  // if (encryptedMiscellaneousCrops) {
  //   const decrypted = jwt.verify(encryptedMiscellaneousCrops, TOKENIZE);
  //   allMiscellaneousCrops = decrypted.queryResult;
  // }

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

  const getMiscellaneous = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fetchMiscellaneous(input, callback);
    }
  };

  const fetchMiscellaneous = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_MIST_CROPS,
      variables: {
        searchTerm: input,
      },
      fetchPolicy: "no-cache",
    });

    let allMiscellaneousCrops = [];
    const encryptedMiscellaneousCrops = result.data?.searchMiscCrops || "";
    if (encryptedMiscellaneousCrops) {
      const decrypted = jwt.verify(encryptedMiscellaneousCrops, TOKENIZE);
      allMiscellaneousCrops = decrypted.queryResult;
    }
    const filterMiscellaneous = allMiscellaneousCrops.filter(
      (misc) => !selectedMultipleMiscellaneous.includes(misc.uuid)
    );
    setAllMiscellaneousCrops(allMiscellaneousCrops);
    callback(filterMiscellaneous);
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
      query: RETAIL_QUERY,
      variables: {
        monthYear: yearMonth,
        pageIndex,
        pageSize,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedMiscellaneousCropsRetailPrices =
      result.data?.tokenizedAllMiscellaneousCropsRetailPrices || "";
    let allMiscellaneousCropsRetailPrices = [];
    if (encryptedMiscellaneousCropsRetailPrices) {
      const decrypted = jwt.verify(
        encryptedMiscellaneousCropsRetailPrices,
        TOKENIZE
      );
      allMiscellaneousCropsRetailPrices = decrypted.queryResult;
      setAllMiscellaneousCropsRetailPrices(allMiscellaneousCropsRetailPrices);
    }
    const countData = result.data?.countAllMiscellaneousCropsRetailPrices || 0;
    setCountMiscellaneousCropsRetailPrice(countData);
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
              onClick={(e) => {
                setUpdateFormDataVisible(true);
                setUpdateFormData({
                  ...props.row.original,
                  // farmLocationUUID:
                  //   props.row.original?.FarmLocation?.uuid || "",
                  miscellaneousCropUUID:
                    props.row.original?.MiscellaneousCrops?.uuid || "",
                  miscellaneousCropId:
                    props.row.original?.MiscellaneousCrops
                      ?.miscellaneousCropId || "",
                });

                setSelectedMiscellaneousCrops([
                  {
                    value: props.row.original?.MiscellaneousCrops?.uuid || "",
                    label:
                      props.row.original?.MiscellaneousCrops?.localName || "",
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
      accessor: "MiscellaneousCrops.miscellaneousCropId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Name",
      accessor: "MiscellaneousCrops.localName",
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
              ...formData,
            };
            delete payload.MiscellaneousCrops;
            const tokenized = jwt.sign(updateFormData, TOKENIZE);
            await updateMiscellaneousCropsRetailPrice({
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
          <label>Month & Year*</label>
          <input
            type="month"
            required
            className="form-control uppercase"
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
          <label>Miscellaneous Crops</label>
          <AsyncSelect
            loadOptions={getMiscellaneous}
            classNamePrefix="Select"
            noOptionsMessage={() => "Type To Search"}
            getOptionLabel={(options) => options.localName}
            getOptionValue={(options) => options.uuid}
            autoFocus={true}
            value={updateFormData.MiscellaneousCrops || ""}
            onChange={(selectedValues) => {
              setUpdateFormData({
                ...updateFormData,
                localName: selectedValues?.localName || "",
                miscellaneousCropUUID: selectedValues.uuid,
                miscellaneousCropId: selectedValues?.miscellaneousCropId || "",
                MiscellaneousCrops: selectedValues,
              });
            }}
          />
          {/* <Select
            value={selectedMiscellaneousCrops}
            required
            options={allMiscellaneousCrops.map((pr) => {
              return {
                value: pr.uuid,
                label: `${pr.localName}`,
              };
            })}
            classNamePrefix="select"
            onChange={(selectedValues) => {
              const found = allMiscellaneousCrops.find(
                (p) => p.uuid === selectedValues.value
              );

              setUpdateFormData({
                ...updateFormData,
                localName: found?.localName || "",
                miscellaneousCropUUID: found.uuid,
                miscellaneousCropId: found?.miscellaneousCropId || "",
              });
              setSelectedMiscellaneousCrops([
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
            value={updateFormData.miscellaneousCropId || ""}
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

            const tokenizedPayload = records.map((record) => {
              const { MiscellaneousCrops, ...payload } = record;
              return {
                monthYear: formData.monthYear,
                ...payload,
              };
            });

            for (const payload of tokenizedPayload) {
              if (!payload.miscellaneousCropUUID) {
                throw {
                  message: "Invalid Misc. Crops Name",
                };
              }
              if (!payload.miscellaneousCropId) {
                throw {
                  message: "Invalid Misc. Crops ID",
                };
              }
            }

            const tokenized = jwt.sign({ tokenizedPayload }, TOKENIZE);

            await createMiscellaneousCropsRetailPrice({
              variables: {
                tokenized,
              },
            });

            // for (let record of formData.records) {
            //   delete record.MiscellaneousCrops;
            //   const tokenizedPayload = {
            //     monthYear: formData.monthYear,
            //     ...record,
            //   };

            //   if (!tokenizedPayload.miscellaneousCropUUID) {
            //     throw {
            //       message: "Invalid Misc. Crops Name",
            //     };
            //   }
            //   if (!tokenizedPayload.miscellaneousCropId) {
            //     throw {
            //       message: "Invalid Misc. Crops ID",
            //     };
            //   }
            // }

            // for (const record of formData.records) {
            //   const tokenizedPayload = {
            //     monthYear: formData.monthYear,
            //     ...record,
            //   };
            //   const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
            //   await createMiscellaneousCropsRetailPrice({
            //     variables: {
            //       tokenized,
            //       // monthYear: formData.monthYear,
            //       // ...record,
            //     },
            //   });
            //   setSavedCount((savedCount += 1));
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
            Miscellaneous Crops
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
                loadOptions={getMiscellaneous}
                classNamePrefix="Select"
                noOptionsMessage={() => "Type To Search"}
                getOptionLabel={(options) => options.localName}
                getOptionValue={(options) => options.uuid}
                autoFocus={true}
                value={rec.MiscellaneousCrops || ""}
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
                            miscellaneousCropUUID: selectedValues.uuid,
                            MiscellaneousCrops: selectedValues,
                          }
                    ),
                  });
                  setSelectedMiscellaneousCrops(selectedValues);
                }}
              />
              {/* <Select
                value={{
                  value: rec.miscellaneousCropUUID,
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
                  const found = allMiscellaneousCrops.find(
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
                            miscellaneousCropUUID: found.uuid,
                          }
                    ),
                  });
                  setSelectedMiscellaneousCrops(found);
                }}
              /> */}
            </div>
            <div>
              <input
                disabled
                placeholder="Auto Filled"
                className="form-control"
                value={rec.miscellaneousCropId || ""}
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
          <MiscellaneousCrops />
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
                        const response = await exportsMiscellaneousRetailPrice({
                          variables: {
                            monthYear: yearMonth,
                          },
                        });

                        // Convert base64 to blob
                        const base64Response =
                          response.data.exportsMiscellaneousRetailPrice;
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
                        link.download = "misc_retail_price_template.xlsx";
                        link.click();
                        window.URL.revokeObjectURL(url);

                        // window.open(
                        //   response.data.exportsMiscellaneousRetailPrice,
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
            data={allMiscellaneousCropsRetailPrices}
            controlledFilters={filters}
            controlledPageIndex={pageIndex}
            controlledPageCount={pageCount}
            controlledPageSize={pageSize}
            onPageChange={handlePageChange}
            withoutHeader={true}
            customUtilities={
              !currentUserDontHavePrivilege([
                "Miscellaneous Crops Retail Price:Update",
              ])
                ? customUtilities
                : null
            }
            customUtilitiesPosition="left"
            onAdd={
              !currentUserDontHavePrivilege([
                "Miscellaneous Crops Retail Price:Create",
              ])
                ? () => {
                    setFormData({
                      records: [],
                    });
                    setModalVisible(true);
                  }
                : null
            }
            onRemove={
              !currentUserDontHavePrivilege([
                "Miscellaneous Crops Retail Price:Delete",
              ])
                ? async ({ rows }) => {
                    showLoadingSpinner();
                    try {
                      let yes = confirm(
                        `Are you sure to delete ${rows.length} Miscellaneous Crops Retail Price?`
                      );
                      if (yes) {
                        for (const row of rows) {
                          const tokenized = jwt.sign(row, TOKENIZE);
                          deleteMiscellaneousCropsRetailPrice({
                            variables: {
                              // uuid: row.uuid,
                              tokenized,
                            },
                          });
                        }
                        notification.addNotification({
                          title: "Success!",
                          message: `${rows.length} Miscellaneous Crops Retail Price deleted`,
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
