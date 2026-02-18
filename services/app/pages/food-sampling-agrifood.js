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
import { create, filter } from "lodash";
import { from } from "apollo-link";
import { configure } from "nprogress";
import Head from "next/dist/next-server/lib/head";
import { Leaf } from "slate";
import NumberFormat from "react-number-format";
import dayjs from "dayjs";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;
const QUERY = gql`
  query listQueries($startDate: String, $endDate: String, $filters: String) {
    countFoodSamplings(
      startDate: $startDate
      endDate: $endDate
      filters: $filters
    )
  }
`;

const FOOD_SAMPLING_QUERY = gql`
  query foodSamplingQuery(
    $startDate: String
    $endDate: String
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllFoodSamplings(
      startDate: $startDate
      endDate: $endDate
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countFoodSamplings(
      startDate: $startDate
      endDate: $endDate
      filters: $filters
    )
  }
`;

const MASTER_DATA_QUERY = gql`
  query masterData {
    tokenizedAllTests

    tokenizedAllTypeOfAnalysises

    tokenizedAllConditions
  }
`;

const CREATE_SAMPLING = gql`
  mutation tokenizedCreateFoodSampling($tokenized: String!) {
    tokenizedCreateFoodSampling(tokenized: $tokenized)
  }
`;

const UPDATE_SAMPLING = gql`
  mutation tokenizedUpdateFoodSampling($tokenized: String!) {
    tokenizedUpdateFoodSampling(tokenized: $tokenized)
  }
`;

const DELETE_SAMPLING = gql`
  mutation tokenizedDeleteFoodSampling($tokenized: String!) {
    tokenizedDeleteFoodSampling(tokenized: $tokenized)
  }
`;

const EXPORT_FOOD_SAMPLING = gql`
  mutation exportFoodSampling(
    $startDate: String
    $endDate: String
    $companyUUID: String
    $sampleName: String
    $typeOfAnalysisIds: [String]
  ) {
    exportFoodSampling(
      startDate: $startDate
      endDate: $endDate
      companyUUID: $companyUUID
      sampleName: $sampleName
      typeOfAnalysisIds: $typeOfAnalysisIds
    )
  }
`;

const SEARCH_COMPANY = gql`
  query searchAllAgrifoodCompanyProfiles($name: String) {
    searchAllAgrifoodCompanyProfiles(name: $name)
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
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    netWeight: 0,
    typeOfAnalysisIds: [],
    testIds: [],
  });
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();
  const [createFoodSampling] = useMutation(CREATE_SAMPLING);
  const [updateFoodSampling] = useMutation(UPDATE_SAMPLING);
  const [deleteFoodSampling] = useMutation(DELETE_SAMPLING);
  const [exportFoodSampling] = useMutation(EXPORT_FOOD_SAMPLING);
  const [registerType, setRegisterType] = useState("");
  const [exportFormData, setExportFormData] = useState({
    typeOfAnalysisIds: [],
  });
  const [modalExportVisible, setModalExportVisible] = useState(false);
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

  const [selectedCompanyName, setSelectedCompanyName] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  let [savedCount, setSavedCount] = useState(0);
  let [countFoodSamplings, setCountFoodSamplings] = useState(0);
  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;

  let pageCount = useMemo(() => {
    if (!countFoodSamplings) return 1;
    return Math.ceil(countFoodSamplings / pageSize);
  }, [countFoodSamplings, pageSize]);

  const [allFoodSamplings, setAllFoodSamplings] = useState([]);
  const [allAgrifoodCompanyProfiles, setAllAgrifoodCompanyProfiles] = useState(
    []
  );
  const [allTests, setAllTests] = useState([]);
  const [allTypeOfAnalysises, setAllTypeOfAnalysises] = useState([]);
  const [allConditions, setAllConditions] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedFoodSamplings = data?.tokenizedAllFoodSamplings || "";
      // let allFoodSamplings = [];
      // if (encryptedFoodSamplings) {
      //   const decrypted = jwt.verify(encryptedFoodSamplings, TOKENIZE);
      //   allFoodSamplings = decrypted.queryResult;
      //   setAllFoodSamplings(allFoodSamplings);
      // }

      // const encryptedAgrifoodCompanyProfiles = data?.tokenizedAllAgrifoodCompanyProfiles || "";
      // let allAgrifoodCompanyProfiles = [];
      // if (encryptedAgrifoodCompanyProfiles) {
      //   const decrypted = jwt.verify(encryptedAgrifoodCompanyProfiles, TOKENIZE);
      //   allAgrifoodCompanyProfiles = decrypted.queryResult;
      //   setAllAgrifoodCompanyProfiles(allAgrifoodCompanyProfiles);
      // }

      // const encryptedTests = data?.tokenizedAllTests || "";
      // let allTests = [];
      // if (encryptedTests) {
      //   const decrypted = jwt.verify(encryptedTests, TOKENIZE);
      //   allTests = decrypted.queryResult;
      //   setAllTests(allTests);
      // }

      // const encryptedTypeOfAnalysises =
      //   data?.tokenizedAllTypeOfAnalysises || "";
      // let allTypeOfAnalysises = [];
      // if (encryptedTypeOfAnalysises) {
      //   const decrypted = jwt.verify(encryptedTypeOfAnalysises, TOKENIZE);
      //   allTypeOfAnalysises = decrypted.queryResult;
      //   setAllTypeOfAnalysises(allTypeOfAnalysises);
      // }

      // const encryptedConditions = data?.tokenizedAllConditions || "";
      // let allConditions = [];
      // if (encryptedConditions) {
      //   const decrypted = jwt.verify(encryptedConditions, TOKENIZE);
      //   allConditions = decrypted.queryResult;
      //   setAllConditions(allConditions);
      // }

      const countData = data?.countFoodSamplings || 0;
      setCountFoodSamplings(countData);
    }
  }, [data, loading, error, savedCount]);

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: FOOD_SAMPLING_QUERY,
      variables: {
        startDate: startDate,
        endDate: endDate,
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });
    const encryptedFoodSamplings = result.data?.tokenizedAllFoodSamplings;
    let allFoodSamplings = [];
    if (encryptedFoodSamplings) {
      const decrypted = jwt.verify(encryptedFoodSamplings, TOKENIZE);
      allFoodSamplings = decrypted.queryResult;
      setAllFoodSamplings(allFoodSamplings);
    }
    const countData = result.data?.countFoodSamplings;
    setCountFoodSamplings(countData);
    hideLoadingSpinner();
  }, [
    savedCount,
    startDate,
    endDate,
    pageSize,
    pageIndex,
    router.query.filters,
  ]);

  useEffect(async () => {
    const result = await client.query({
      query: MASTER_DATA_QUERY,
      fetchPolicy: "no-cache",
    });

    const encryptedAllTests = result.data?.tokenizedAllTests || "";
    let allAllTests = [];
    if (encryptedAllTests) {
      const decrypted = jwt.verify(encryptedAllTests, TOKENIZE);
      allAllTests = decrypted.queryResult;
      setAllTests(allAllTests);
    }

    const encryptedTypeOfAnalysises =
      result.data?.tokenizedAllTypeOfAnalysises || "";
    let allTypeOfAnalysises = [];
    if (encryptedTypeOfAnalysises) {
      const decrypted = jwt.verify(encryptedTypeOfAnalysises, TOKENIZE);
      allTypeOfAnalysises = decrypted.queryResult;
      setAllTypeOfAnalysises(allTypeOfAnalysises);
    }

    const encryptedConditions = result.data?.tokenizedAllConditions || "";
    let allConditions = [];
    if (encryptedConditions) {
      const decrypted = jwt.verify(encryptedConditions, TOKENIZE);
      allConditions = decrypted.queryResult;
      setAllConditions(allConditions);
    }
  }, []);

  const handlePageChange = useCallback(
    async ({ pageIndex, pageSize, filters }) => {
      // const ym = router.query.yearMonth || dayjs().format("YYYY-MM");
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
      query: SEARCH_COMPANY,
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

  const getFarmer = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fethchingFarmer(input, callback);
    }
  };

  // let allFoodSamplings = [];
  // const encryptedFoodSamplings = data?.tokenizedAllFoodSamplings || "";
  // if (encryptedFoodSamplings) {
  //   const decrypted = jwt.verify(encryptedFoodSamplings, TOKENIZE);
  //   allFoodSamplings = decrypted.queryResult;
  // }

  // let allAgrifoodCompanyProfiles = [];
  // const encryptedAgrifoodCompanyProfiles =
  //   data?.tokenizedAllAgrifoodCompanyProfiles || "";
  // if (encryptedAgrifoodCompanyProfiles) {
  //   const decrypted = jwt.verify(encryptedAgrifoodCompanyProfiles, TOKENIZE);
  //   allAgrifoodCompanyProfiles = decrypted.queryResult;
  // }

  // let allTests = [];
  // const encryptedTests = data?.tokenizedAllTests || "";
  // if (encryptedTests) {
  //   const decrypted = jwt.verify(encryptedTests, TOKENIZE);
  //   allTests = decrypted.queryResult;
  // }

  // let allTypeOfAnalysises = [];
  // const encryptedTypeOfAnalysises = data?.tokenizedAllTypeOfAnalysises || "";
  // if (encryptedTypeOfAnalysises) {
  //   const decrypted = jwt.verify(encryptedTypeOfAnalysises, TOKENIZE);
  //   allTypeOfAnalysises = decrypted.queryResult;
  // }

  // let allConditions = [];
  // const encryptedConditions = data?.tokenizedAllConditions || "";
  // if (encryptedConditions) {
  //   const decrypted = jwt.verify(encryptedConditions, TOKENIZE);
  //   allConditions = decrypted.queryResult;
  // }

  let allTypeOfAnalysis = allTypeOfAnalysises;
  const indexedTypeOfAnalysis = allTypeOfAnalysis.reduce((all, analysis) => {
    if (!all[analysis.uuid]) {
      all[analysis.uuid] = {};
    }
    all[analysis.uuid] = analysis;
    return all;
  }, {});

  useEffect(async () => {
    const result = await client.query({
      query: IS_CHECK_FARMER,
      fetchPolicy: "no-cache",
    });

    const farmerCheck = result.data.isFarmerCheck;
    if (farmerCheck) {
      const result = await client.query({
        query: SEARCH_COMPANY,
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
        return (
          <div className="flex">
            <button
              onClick={(e) => {
                setModalVisible(true);
                setFormData({
                  ...props.row.original,
                  CompanyProfile: {
                    uuid: props.row.original.companyUUID,
                    companyName: props.row.original.companyName,
                  },
                  conditionUUID: props.row.original?.Condition?.uuid || "",
                });
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
      Header: "Sampling Date",
      accessor: "samplingDate",
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
        width: 250,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Name Of Sample",
      accessor: "sampleName",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Sample Reference No.",
      accessor: "sampleReferenceNo",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Analysis Type",
      accessor: "typeOfAnalysisIds",
      style: {
        fontSize: 20,
        width: 200,
      },
      disableFilters: true,
      Cell: (props) => {
        const lists = props.row.original.typeOfAnalysisIds.map((id) => {
          return {
            name: indexedTypeOfAnalysis[id]?.name || "",
          };
        });

        return (
          <span>{lists.map((list) => list.name.toUpperCase()).join(",")}</span>
        );
      },
    },
    {
      Header: "Sample Collected By",
      accessor: "collectedBy",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
  ]);

  return (
    <AdminArea header={{ title: "Food Sample" }} urlQuery={router.query}>
      <FormModal
        title={`Export Food Sample`}
        visible={modalExportVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalExportVisible(false);
          setExportFormData({
            typeOfAnalysisIds: [],
          });
          setSelectedCompanyName({});
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setModalExportVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportFoodSampling({
              variables: {
                ...exportFormData,
              },
            });
            const base64Response = response.data.exportFoodSampling;
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
            link.download = "food_sampling.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);

            // window.open(response.data.exportFoodSampling, "__blank");
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
            <label>Start Date</label>
            <input
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
            <label>End Date</label>
            <input
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
                value={exportFormData.CompanyProfile}
                loadOptions={getFarmer}
                classNamePrefix="select"
                getOptionLabel={(option) =>
                  `${option.companyName.toUpperCase()}`
                }
                getOptionValue={(option) => option.uuid}
                autoFocus={true}
                noOptionsMessage={() => "Type to Search"}
                onChange={(selectedValues) => {
                  // console.log({ selectedValues });

                  const found = allAgrifoodCompanyProfiles.find((profile) =>
                    selectedValues ? profile.uuid === selectedValues.uuid : null
                  );
                  setExportFormData({
                    ...exportFormData,
                    CompanyProfile: found,
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
                value={exportFormData.CompanyProfile}
                options={allAgrifoodCompanyProfiles}
                classNamePrefix="select"
                getOptionLabel={(option) =>
                  `${option.companyName.toUpperCase()}`
                }
                getOptionValue={(option) => option.uuid}
                autoFocus={true}
                onChange={(selectedValues) => {
                  // console.log({ selectedValues });

                  const found = allAgrifoodCompanyProfiles.find((profile) =>
                    selectedValues ? profile.uuid === selectedValues.uuid : null
                  );
                  setExportFormData({
                    ...exportFormData,
                    CompanyProfile: found,
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
            <label>Sample Name</label>
            <input
              className="form-control"
              value={exportFormData.sampleName || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setExportFormData({
                  ...exportFormData,
                  sampleName: e.target.value.toUpperCase(),
                });
              }}
            />
          </div>

          <br />
          <label>Type Of Analysis</label>
          <div className="grid grid-cols-3 gap-2">
            {allTypeOfAnalysises.map((analysis) => {
              let isChecked = false;

              const foundIndex = exportFormData.typeOfAnalysisIds.findIndex(
                (idx) => idx === analysis.uuid
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
                        setExportFormData({
                          ...exportFormData,
                          typeOfAnalysisIds: [
                            ...exportFormData.typeOfAnalysisIds,
                            analysis.uuid,
                          ],
                        });
                      } else {
                        setExportFormData({
                          ...exportFormData,
                          typeOfAnalysisIds:
                            exportFormData.typeOfAnalysisIds.filter(
                              (p) => p !== analysis.uuid
                            ),
                        });
                      }
                    }}
                  />
                  <label>{analysis.name.toUpperCase()}</label>
                </div>
              );
            })}
          </div>

          <br />
          <br />
        </div>
      </FormModal>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Food Sample`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            startDate: "",
            endDate: "",
            netWeight: 0,
            typeOfAnalysisIds: [],
            testIds: [],
          });
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            const { uuid, __typename } = formData;
            if (!uuid) {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await createFoodSampling({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateFoodSampling({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Food Sampling saved!`,
              level: "success",
            });

            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
      >
        {/* <div className="form-group">
          <label>Company Name</label>
          <select
            className="form-control"
            value={formData.companyUUID || ""}
            required
            onChange={async (e) => {
              if (e) e.preventDefault();
              const found = allAgrifoodCompanyProfiles.find(
                (company) => company.uuid === e.target.value
              );

              setFormData({
                ...formData,
                companyUUID: found?.uuid || "",
                companyName: found?.companyName || "",
              });
            }}
          >
            <option value="" disabled>
              Select Company Name
            </option>
            {allAgrifoodCompanyProfiles.map((company) => (
              <option value={company.uuid}>{company.companyName}</option>
            ))}
          </select>
        </div> */}

        <div className="form-group">
          <label>Company Name</label>
          {registerType === "OFFICER" ? (
            <AsyncSelect
              value={formData.CompanyProfile}
              loadOptions={getFarmer}
              classNamePrefix="select"
              getOptionLabel={(option) => `${option.companyName.toUpperCase()}`}
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              noOptionsMessage={() => "Type to Search"}
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allAgrifoodCompanyProfiles.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.uuid : null
                );
                setFormData({
                  ...formData,
                  CompanyProfile: found,
                  companyUUID: found?.uuid || "",
                  companyName: found?.companyName || "",
                });
              }}
            />
          ) : (
            <Select
              value={formData.CompanyProfile}
              options={allAgrifoodCompanyProfiles}
              classNamePrefix="select"
              getOptionLabel={(option) => `${option.companyName.toUpperCase()}`}
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allAgrifoodCompanyProfiles.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.uuid : null
                );
                setFormData({
                  ...formData,
                  CompanyProfile: found,
                  companyUUID: found?.uuid || "",
                  companyName: found?.companyName || "",
                });
              }}
            />
          )}
        </div>
        <div className="form-group">
          <label>Name of Sample*</label>
          <input
            required
            className="form-control"
            value={formData.sampleName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                sampleName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Type of Sampling</label>
          <select
            className="form-control"
            value={formData.typeOfSampling || ""}
            required
            onChange={async (e) => {
              if (e) e.preventDefault();

              setFormData({
                ...formData,
                typeOfSampling: e.target.value,
              });
            }}
          >
            <option value="" disabled>
              Select Type of Sampling
            </option>
            <option value={"GOVERNMENT-TO-GOVERNMENT"}>
              GOVERNMENT-TO-GOVERNMENT
            </option>
            <option value={"PRIVATE"}>PRIVATE</option>
            <option value={"THIRD PARTY"}>THIRD PARTY</option>
          </select>
        </div>
        <div className="form-group">
          <label>Condition</label>
          <select
            className="form-control"
            value={formData.conditionUUID || ""}
            required
            onChange={async (e) => {
              if (e) e.preventDefault();

              setFormData({
                ...formData,
                conditionUUID: e.target.value,
              });
            }}
          >
            <option value="" disabled>
              Select Condition
            </option>
            {allConditions.map((condition) => (
              <option value={condition.uuid}>
                {condition.name?.toUpperCase() || ""}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Sample Reference No.</label>
          <input
            className="form-control"
            value={formData.sampleReferenceNo || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                sampleReferenceNo: e.target.value,
              });
            }}
          />
        </div>

        <label>Type of Analysis: </label>
        <div className="grid grid-cols-3 gap-2">
          {allTypeOfAnalysises.map((analysis) => {
            let isChecked = false;

            const foundIndex = formData.typeOfAnalysisIds.findIndex(
              (idx) => idx === analysis.uuid
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
                        typeOfAnalysisIds: [
                          ...formData.typeOfAnalysisIds,
                          analysis.uuid,
                        ],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        typeOfAnalysisIds: formData.typeOfAnalysisIds.filter(
                          (p) => p !== analysis.uuid
                        ),
                      });
                    }
                  }}
                />
                <label>{analysis.name.toUpperCase()}</label>
              </div>
            );
          })}
        </div>

        <label>List Of Test Request: </label>
        <div className="grid grid-cols-3 gap-2">
          {allTests.map((test) => {
            let isChecked = false;

            const foundIndex = formData.testIds.findIndex(
              (idx) => idx === test.uuid
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
                        testIds: [...formData.testIds, test.uuid],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        testIds: formData.testIds.filter(
                          (p) => p !== test.uuid
                        ),
                      });
                    }
                  }}
                />
                <label>{test.testName.toUpperCase()}</label>
              </div>
            );
          })}
        </div>

        <div className="form-group">
          <label>Date of Sampling</label>
          <input
            required
            type="date"
            className="form-control"
            value={formData.samplingDate || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                samplingDate: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Sample Collected By</label>
          <input
            className="form-control"
            value={formData.collectedBy || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                collectedBy: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Purpose of Food Sampling</label>
          <select
            className="form-control"
            value={formData.purpose || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                purpose: e.target.value,
              });
            }}
          >
            <option value={""} disabled>
              Select Purpose
            </option>
            <option value={"FOOD AND PREMISE HYGIENE PROGRAM"}>
              FOOD AND PREMISE HYGIENE PROGRAM
            </option>
            <option value={"FOOD SAFETY PROGRAM"}>FOOD SAFETY PROGRAM</option>
            <option value={"PRODUCT LABEL DEVELOPMENT"}>
              PRODUCT LABEL DEVELOPMENT
            </option>
          </select>
        </div>
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <TableAsync
          loading={loading}
          columns={columns}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          data={allFoodSamplings}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
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
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  setExportFormData({
                    typeOfAnalysisIds: [],
                    // startDate: dayjs(new Date()).format("YYYY-MM-DD"),
                    // endDate: dayjs(new Date()).format("YYYY-MM-DD"),
                    startDate: startDate,
                    endDate: endDate,
                  });
                  setModalExportVisible(true);

                  // showLoadingSpinner();
                  // try {
                  //   const response = await exportFoodSampling();

                  //   window.open(response.data.exportFoodSampling, "__blank");
                  // } catch (err) {
                  //   notification.handleError(err);
                  // }
                  // hideLoadingSpinner();
                }}
              >
                Export Excel
              </button>
            </div>
          }
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege(["Food Sampling:Delete"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege(["Food Sampling:Create"])
              ? () => {
                  setFormData({
                    startDate: "",
                    endDate: "",
                    netWeight: 0,
                    typeOfAnalysisIds: [],
                    testIds: [],
                  });
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Food Sampling:Update"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} sampling?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteFoodSampling({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                        setSavedCount((savedCount += 1));
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} sampling deleted`,
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
