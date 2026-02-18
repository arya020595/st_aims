import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../../components/App";
import { handleError } from "../../libs/errors";
import { useRouter } from "next/router";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import gql from "graphql-tag";
import {
  useQuery,
  useLazyQuery,
  useMutation,
  useApolloClient,
} from "@apollo/client";
import { useCurrentUser } from "../AdminArea";
import dayjs from "dayjs";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { MonthAndYearsFilterWithExport } from "../../components/MonthAndYearsFilterWithExport";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERIES = gql`
  query listQueries($monthYear: String) {
    currentUser {
      _id
      name
      controlPost
      district
    }

    tokenizedAllBioSecurityNonCompliancePersonals(monthYear: $monthYear)

    tokenizedAllBioSecurityTakenActions

    #tokenizedAllBioSecurityCountries

    tokenizedAllBioSecurityCompliances
  }
`;

const GET_PROFILE = gql`
  query getBioSecurirtyIndividualProfileByIcNo($icNo: String!) {
    getBioSecurirtyIndividualProfileByIcNo(icNo: $icNo) {
      uuid
      name
      icNo
      contactNumber
      address
    }
  }
`;

const SEARCH_COUNTRY = gql`
  query searchCountry($name: String!) {
    searchCountry(name: $name)
  }
`;

const CREATE_NON_COMPLIANCE = gql`
  mutation tokenizedCreateBioSecurityNonCompliancePersonal(
    $tokenized: String!
  ) {
    tokenizedCreateBioSecurityNonCompliancePersonal(tokenized: $tokenized)
  }
`;

const UPDATE_NON_COMPLIANCE = gql`
  mutation tokenizedUpdateBioSecurityNonCompliancePersonal(
    $tokenized: String!
  ) {
    tokenizedUpdateBioSecurityNonCompliancePersonal(tokenized: $tokenized)
  }
`;

const DELETE_NON_COMPLIANCE = gql`
  mutation tokenizedDeleteBioSecurityNonCompliancePersonal(
    $tokenized: String!
  ) {
    tokenizedDeleteBioSecurityNonCompliancePersonal(tokenized: $tokenized)
  }
`;

const GET_NON_COMPLIENCE_LIST = gql`
  query allBioSecurityNonComplienceLists($individualProfileUUID: String!) {
    allBioSecurityNonComplienceLists(
      individualProfileUUID: $individualProfileUUID
    ) {
      uuid
      date
      officer
    }
  }
`;

const EXPORT_NON_COMPLIANCE_PERSONAL = gql`
  mutation exportBioSecurityNonCompliancePersonal(
    $monthYear: String!
    $pointOfEntry: String
    $personalName: String
    $icNo: String
    $permitNumber: String
    $countryUUID: String
    $takenActionUUID: String
  ) {
    exportBioSecurityNonCompliancePersonal(
      monthYear: $monthYear
      pointOfEntry: $pointOfEntry
      personalName: $personalName
      icNo: $icNo
      permitNumber: $permitNumber
      countryUUID: $countryUUID
      takenActionUUID: $takenActionUUID
    )
  }
`;

const Personal = ({}) => {
  const client = useApolloClient();
  const router = useRouter();
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({
    nonComplienceLists: [],
  });

  const [getNonComplience, setGetNonComplience] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();
  const [exportFormData, setExportFormData] = useState({});
  const [modalExportVisible, setModalExportVisible] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const [selectedAction, setSelectedAction] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const { data, error, loading, refetch } = useQuery(QUERIES, {
    variables: {
      monthYear: yearMonth,
    },
  });
  const [exportBioSecurityNonCompliancePersonal] = useMutation(
    EXPORT_NON_COMPLIANCE_PERSONAL
  );
  const [createBioSecurityNonCompliancePersonal] = useMutation(
    CREATE_NON_COMPLIANCE
  );
  const [updateBioSecurityNonCompliancePersonal] = useMutation(
    UPDATE_NON_COMPLIANCE
  );
  const [deleteBioSecurityNonCompliancePersonal] = useMutation(
    DELETE_NON_COMPLIANCE
  );

  const [allBioSecurityCountries, setAllBioSecurityCountries] = useState([]);
  const [allBioSecurityTakenActions, setAllBioSecurityTakenActions] = useState(
    []
  );
  const [allBioSecurityCompliances, setAllBioSecurityCompliances] = useState(
    []
  );
  const [
    allBioSecurityNonCompliancePersonals,
    setAllBioSecurityNonCompliancePersonals,
  ] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedBioSecurityCountries =
      //   data?.tokenizedAllBioSecurityCountries || "";
      // let allBioSecurityCountries = [];
      // if (encryptedBioSecurityCountries) {
      //   const decrypted = jwt.verify(encryptedBioSecurityCountries, TOKENIZE);
      //   allBioSecurityCountries = decrypted.queryResult;
      //   setAllBioSecurityCountries(allBioSecurityCountries);
      // }

      const encryptedBioSecurityTakenActions =
        data?.tokenizedAllBioSecurityTakenActions || "";
      let allBioSecurityTakenActions = [];
      if (encryptedBioSecurityTakenActions) {
        const decrypted = jwt.verify(
          encryptedBioSecurityTakenActions,
          TOKENIZE
        );
        allBioSecurityTakenActions = decrypted.queryResult;
        setAllBioSecurityTakenActions(allBioSecurityTakenActions);
      }

      const encryptedBioSecurityCompliances =
        data?.tokenizedAllBioSecurityCompliances || "";
      let allBioSecurityCompliances = [];
      if (encryptedBioSecurityCompliances) {
        const decrypted = jwt.verify(encryptedBioSecurityCompliances, TOKENIZE);
        allBioSecurityCompliances = decrypted.queryResult;
        setAllBioSecurityCompliances(allBioSecurityCompliances);
      }

      const encryptedBioSecurityNonCompliancePersonals =
        data?.tokenizedAllBioSecurityNonCompliancePersonals || "";
      let allBioSecurityNonCompliancePersonals = [];
      if (encryptedBioSecurityNonCompliancePersonals) {
        const decrypted = jwt.verify(
          encryptedBioSecurityNonCompliancePersonals,
          TOKENIZE
        );
        allBioSecurityNonCompliancePersonals = decrypted.queryResult;
        setAllBioSecurityNonCompliancePersonals(
          allBioSecurityNonCompliancePersonals
        );
      }
    }
  }, [data, loading, error]);

  const fetchCountry = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_COUNTRY,
      variables: {
        name: input,
      },
      fetchPolicy: "no-cache",
    });
    const encryptCountry = result.data?.searchCountry || "";
    let allCountry = [];
    if (encryptCountry) {
      const decrypted = jwt.verify(encryptCountry, TOKENIZE);
      allCountry = decrypted.queryResult;
    }
    callback(allCountry);
  };

  const getCountry = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fetchCountry(input, callback);
    }
  };

  // let allBioSecurityCountries = [];
  // const encryptedBioSecurityCountries =
  //   data?.tokenizedAllBioSecurityCountries || "";
  // if (encryptedBioSecurityCountries) {
  //   const decrypted = jwt.verify(encryptedBioSecurityCountries, TOKENIZE);
  //   allBioSecurityCountries = decrypted.queryResult;
  // }

  // let allBioSecurityTakenActions = [];
  // const encryptedBioSecurityTakenActions =
  //   data?.tokenizedAllBioSecurityTakenActions || "";
  // if (encryptedBioSecurityTakenActions) {
  //   const decrypted = jwt.verify(encryptedBioSecurityTakenActions, TOKENIZE);
  //   allBioSecurityTakenActions = decrypted.queryResult;
  // }

  // let allBioSecurityCompliances = [];
  // const encryptedBioSecurityCompliances =
  //   data?.tokenizedAllBioSecurityCompliances || "";
  // if (encryptedBioSecurityCompliances) {
  //   const decrypted = jwt.verify(encryptedBioSecurityCompliances, TOKENIZE);
  //   allBioSecurityCompliances = decrypted.queryResult;
  // }

  const currentUser = data?.currentUser || {};

  // let allBioSecurityNonCompliancePersonals = [];
  // const encryptedBioSecurityNonCompliancePersonals =
  //   data?.tokenizedAllBioSecurityNonCompliancePersonals || "";
  // if (encryptedBioSecurityNonCompliancePersonals) {
  //   const decrypted = jwt.verify(
  //     encryptedBioSecurityNonCompliancePersonals,
  //     TOKENIZE
  //   );
  //   allBioSecurityNonCompliancePersonals = decrypted.queryResult;
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
                  const getProfile = await client.query({
                    query: GET_PROFILE,
                    variables: {
                      icNo: props.row.original?.IndividualProfile?.icNo || "",
                    },
                  });

                  const getComplienceList = await client.query({
                    query: GET_NON_COMPLIENCE_LIST,
                    variables: {
                      individualProfileUUID:
                        props.row.original?.IndividualProfile?.uuid || [],
                    },
                  });

                  setModalVisible(true);
                  setFormData({
                    ...getProfile.data.getBioSecurirtyIndividualProfileByIcNo,
                    ...props.row.original,
                    countryUUID: props.row.original?.Country?.uuid || "",
                    takenActionUUID:
                      props.row.original?.TakenAction?.uuid || "",
                    nonComplienceLists:
                      props.row.original.nonComplienceUUID || [],
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
                } catch (error) {
                  notification.handleError(error);
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
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Staff Name",
      accessor: "staffName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Personal Name",
      accessor: "IndividualProfile.name",
      style: {
        fontSize: 20,
      },
      width: 200,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "IC Number",
      accessor: "IndividualProfile.icNo",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Contact Details",
      accessor: "IndividualProfile.contactNumber",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    // {
    //   Header: "Non-Compliance",
    //   accessor: "nonCompliance",
    //   style: {
    //     fontSize: 20,
    //   },
    // },
    {
      Header: "Permit Number",
      accessor: "permitNumber",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Exporting Country",
      accessor: "Country.name",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Action to be Taken",
      accessor: "TakenAction.name",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "NOS Reference Number",
      accessor: "nosReferenceNumber",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Action By Enforcement",
      accessor: "actionByEnforcement",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
  ]);

  const columnsComplience = useMemo(() => [
    {
      Header: "NC",
      accessor: "nc",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Date",
      accessor: "date",
      style: {
        fontSize: 20,
      },
    },
  ]);

  return (
    <div>
      <FormModal
        title={`Non-Compliance & Enforcement`}
        visible={modalExportVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalExportVisible(false);
          setExportFormData({});
          setSelectedAction({});
          setSelectedCountry({});
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setModalExportVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportBioSecurityNonCompliancePersonal({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });
            const base64Response = response.data.exportBioSecurityNonCompliancePersonal;
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
            link.download = "personal_non_compliance.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);
            // window.open(
            //   response.data.exportBioSecurityNonCompliancePersonal,
            //   "__blank"
            // );
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
            <label>Point Of Entry</label>
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
            <label>Personal Name</label>
            <input
              className="form-control"
              value={exportFormData.personalName || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setExportFormData({
                  ...exportFormData,
                  personalName: e.target.value.toUpperCase(),
                });
              }}
            />
          </div>

          <div className="form-group">
            <label>IC Number</label>
            <input
              className="form-control"
              value={exportFormData.icNo || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setExportFormData({
                  ...exportFormData,
                  icNo: e.target.value.toUpperCase(),
                });
              }}
            />
          </div>

          <div className="form-group">
            <label>Permit Number </label>
            <input
              className="form-control"
              value={exportFormData.permitNumber || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setExportFormData({
                  ...exportFormData,
                  permitNumber: e.target.value.toUpperCase(),
                });
              }}
            />
          </div>

          <div className="form-group">
            <label>Export Country</label>
            <AsyncSelect
              loadOptions={getCountry}
              classNamePrefix="select"
              noOptionsMessage={() => "Type to Search"}
              getOptionLabel={(option) => `${option.name.toUpperCase()}`}
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              value={exportFormData.Country || ""}
              onChange={(selectedValues) => {
                setExportFormData({
                  ...exportFormData,
                  countryUUID: selectedValues?.uuid || "",
                  Country: selectedValues,
                });
              }}
            />
            {/* <Select
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
              }} */}
            {/* /> */}
          </div>

          <div className="form-group">
            <label>Action to be Taken</label>
            <Select
              isClearable={true}
              value={selectedAction}
              options={allBioSecurityTakenActions.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof?.name?.toUpperCase() || "",
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allBioSecurityTakenActions.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  takenActionUUID: found?.uuid || "",
                });

                setSelectedAction([
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
        title={`${
          !formData.uuid ? "New" : "Edit"
        } Non-Compliance & Enforcement`}
        visible={modalVisible}
        size={"lg"}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            nonComplienceLists: [],
          });
          setGetNonComplience([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            const { id, uuid, __typename } = formData;
            let payload = {
              ...formData,
            };
            delete payload.Country;
            if (!uuid) {
              const tokenizedPayload = {
                ...payload,
                nonComplienceUUID: payload.nonComplienceLists,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await createBioSecurityNonCompliancePersonal({
                variables: {
                  tokenized,
                  // ...formData,
                  // nonComplienceUUID: formData.nonComplienceLists,
                },
              });
            } else {
              const tokenizedPayload = {
                ...payload,
                nonComplienceUUID: payload.nonComplienceLists,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await updateBioSecurityNonCompliancePersonal({
                variables: {
                  tokenized,
                  // ...formData,
                  // nonComplienceUUID: formData.nonComplienceLists,
                },
              });
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Personal saved!`,
              level: "success",
            });

            router.replace({
              pathname: router.pathname,
              query: {
                ...router.query,
                saveDate: new Date().toISOString(),
              },
            });

            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="form-group">
              <label>Point of Entry</label>
              <input
                disabled
                className="form-control"
                value={formData.pointOfEntry}
              />
            </div>
            <div className="form-group">
              <label>Staff Name</label>
              <input
                className="form-control uppercase"
                value={formData.staffName || ""}
                disabled
              />
            </div>
            <div className="form-group">
              <label>IC Number</label>
              <input
                className="form-control"
                value={formData.icNo || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    icNo: e.target.value.toUpperCase(),
                  });
                }}
                onBlur={async (e) => {
                  if (e) e.preventDefault();
                  showLoadingSpinner();
                  try {
                    const result = await client.query({
                      query: GET_PROFILE,
                      variables: {
                        icNo: formData.icNo || "",
                      },
                    });

                    if (result.data.getBioSecurirtyIndividualProfileByIcNo) {
                      const found =
                        result.data.getBioSecurirtyIndividualProfileByIcNo;

                      const getComplienceList = await client.query({
                        query: GET_NON_COMPLIENCE_LIST,
                        variables: {
                          individualProfileUUID: found.uuid,
                        },
                      });

                      setFormData({
                        ...formData,
                        individualProfileUUID: found?.uuid,
                        name: found.name,
                        icNo: found?.icNo || "",
                        contactNumber: found?.contactNumber || "",
                        address: found?.address || "",
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
                required
              />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                className="form-control"
                value={formData?.name?.toUpperCase() || ""}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Contact Details</label>
              <input
                className="form-control"
                value={formData?.contactNumber?.toUpperCase() || ""}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                className="form-control"
                value={formData?.address?.toUpperCase() || ""}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Date of Entry</label>
              <input
                className="form-control"
                value={formData.entryDate || ""}
                type={"date"}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    entryDate: e.target.value,
                  });
                }}
                required
              />
            </div>
            <div className="form-group">
              <label>Non-Compliance</label>
              <div className="grid grid-cols-3 gap-2">
                {allBioSecurityCompliances.map((comp) => {
                  let isChecked = false;

                  const foundIndex = formData.nonComplienceLists.findIndex(
                    (idx) => idx === comp.uuid
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
                              nonComplienceLists: [
                                ...formData.nonComplienceLists,
                                comp.uuid,
                              ],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              nonComplienceLists:
                                formData.nonComplienceLists.filter(
                                  (p) => p !== comp.uuid
                                ),
                            });
                          }
                        }}
                      />
                      <label>{comp.name.toUpperCase()}</label>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="form-group">
              <label>Permit Number</label>
              <input
                className="form-control"
                value={formData.permitNumber}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    permitNumber: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Health Certificate's Number</label>
              <input
                className="form-control"
                value={formData.healthCertificateNumber}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    healthCertificateNumber: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Exporting Country</label>
              <AsyncSelect
                loadOptions={getCountry}
                classNamePrefix="select"
                noOptionsMessage={() => "Type to Search"}
                getOptionLabel={(option) => `${option.name.toUpperCase()}`}
                getOptionValue={(option) => option.uuid}
                autoFocus={true}
                value={formData.Country || ""}
                onChange={(selectedValues) => {
                  setFormData({
                    ...formData,
                    countryUUID: selectedValues.uuid,
                    Country: selectedValues,
                  });
                }}
              />
              {/* <select
                className="form-control"
                value={formData.countryUUID || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    countryUUID: e.target.value,
                  });
                }}
                required
              >
                <option value={""} disabled>
                  Select Country
                </option>
                {allBioSecurityCountries.map((country) => (
                  <option value={country.uuid}>{country.name}</option>
                ))}
              </select> */}
            </div>
            <div className="form-group">
              <label>Remarks</label>
              <input
                className="form-control"
                value={formData.remarks || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    remarks: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Action to be Taken</label>
              <select
                className="form-control"
                value={formData.takenActionUUID || ""}
                required
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    takenActionUUID: e.target.value,
                  });
                }}
              >
                <option value="" disabled>
                  Select Action to be Taken
                </option>
                {allBioSecurityTakenActions.map((act) => (
                  <option value={act.uuid}>{act.name.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Notice of Seizure Reference Number</label>
              <input
                className="form-control"
                value={formData.nosReferenceNumber || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    nosReferenceNumber: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Action by Enforcement</label>
              <input
                className="form-control"
                value={formData.actionByEnforcement || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    actionByEnforcement: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
          </div>

          <div>
            <p className="text-xl m-0 text-center font-bold">
              Non Compliance Logs
            </p>
            <Table
              columns={columnsComplience}
              data={getNonComplience}
              loading={false}
              withoutHeader={true}
            />
          </div>
        </div>
      </FormModal>
      <div className="mt-4 pr-0 md:pr-10 py-4 h-full">
        <Table
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
          columns={columns}
          data={allBioSecurityNonCompliancePersonals}
          loading={loading}
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege([
              "Personal Non Compliance & Enforcement:Update",
            ])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege([
              "Personal Non Compliance & Enforcement:Create",
            ])
              ? () => {
                  setFormData({
                    pointOfEntry: currentUser?.controlPost || "",
                    district: currentUser?.district || "",
                    staffName: currentUser?.name || "",
                    nonComplienceLists: [],
                  });
                  setModalVisible(true);
                }
              : null
          }
          customUtilitiesPosition="left"
          onRemove={
            !currentUserDontHavePrivilege([
              "Personal Non Compliance & Enforcement:Delete",
            ])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} enformcent?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteBioSecurityNonCompliancePersonal({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} enformcent deleted`,
                        level: "success",
                      });

                      router.replace({
                        pathname: router.pathname,
                        query: {
                          ...router.query,
                          saveDate: new Date().toISOString(),
                        },
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
    </div>
  );
};
export default withApollo({ ssr: true })(Personal);
