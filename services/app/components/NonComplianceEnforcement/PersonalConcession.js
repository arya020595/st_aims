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
  query listQueries($monthYear: String!) {
    currentUser {
      _id
      name
      controlPost
      district
    }

    tokenizedAllBioSecurityNonCompliancePersonalConcessions(
      monthYear: $monthYear
    )

    tokenizedAllBioSecurityTakenActions

    #tokenizedAllBioSecurityCountries

    tokenizedAllBioSecurityCompliances
  }
`;

const SEARCH_COUNTRY = gql`
  query searchCountry($name: String!) {
    searchCountry(name: $name)
  }
`;

const CREATE_NON_COMPLIANCE = gql`
  mutation tokenizedCreateBioSecurityNonCompliancePersonalConcession(
    $tokenized: String!
  ) {
    tokenizedCreateBioSecurityNonCompliancePersonalConcession(
      tokenized: $tokenized
    )
  }
`;

const UPDATE_NON_COMPLIANCE = gql`
  mutation tokenizedUpdateBioSecurityNonCompliancePersonalConcession(
    $tokenized: String!
  ) {
    tokenizedUpdateBioSecurityNonCompliancePersonalConcession(
      tokenized: $tokenized
    )
  }
`;

const DELETE_NON_COMPLIANCE = gql`
  mutation tokenizedDeleteBioSecurityNonCompliancePersonalConcession(
    $tokenized: String!
  ) {
    tokenizedDeleteBioSecurityNonCompliancePersonalConcession(
      tokenized: $tokenized
    )
  }
`;

const EXPORT_NON_COMPLIANCE_CONCESSION = gql`
  mutation exportBioSecurityNonCompliancePersonalConcession(
    $monthYear: String!
    $pointOfEntry: String
    $name: String
    $icNo: String
    $permitNumber: String
    $countryUUID: String
    $takenActionUUID: String
  ) {
    exportBioSecurityNonCompliancePersonalConcession(
      monthYear: $monthYear
      pointOfEntry: $pointOfEntry
      name: $name
      icNo: $icNo
      permitNumber: $permitNumber
      countryUUID: $countryUUID
      takenActionUUID: $takenActionUUID
    )
  }
`;

const PersonalConcession = ({}) => {
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
  const [exportFormData, setExportFormData] = useState({});
  const [modalExportVisible, setModalExportVisible] = useState(false);
  const notification = useNotification();

  const { data, error, loading, refetch } = useQuery(QUERIES, {
    variables: {
      monthYear: yearMonth,
    },
  });

  const [exportBioSecurityNonCompliancePersonalConcession] = useMutation(
    EXPORT_NON_COMPLIANCE_CONCESSION
  );
  const [createBioSecurityNonCompliancePersonalConcession] = useMutation(
    CREATE_NON_COMPLIANCE
  );
  const [updateBioSecurityNonCompliancePersonalConcession] = useMutation(
    UPDATE_NON_COMPLIANCE
  );
  const [deleteBioSecurityNonCompliancePersonalConcession] = useMutation(
    DELETE_NON_COMPLIANCE
  );

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

  const [allBioSecurityCountries, setAllBioSecurityCountries] = useState([]);
  const [allBioSecurityTakenActions, setAllBioSecurityTakenActions] = useState(
    []
  );
  const [allBioSecurityCompliances, setAllBioSecurityCompliances] = useState(
    []
  );
  const [
    allBioSecurityNonCompliancePersonalConcessions,
    setAllBioSecurityNonCompliancePersonalConcessions,
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

      const encryptedBioSecurityNonCompliancePersonalConcessions =
        data?.tokenizedAllBioSecurityNonCompliancePersonalConcessions || "";
      let allBioSecurityNonCompliancePersonalConcessions = [];
      if (encryptedBioSecurityNonCompliancePersonalConcessions) {
        const decrypted = jwt.verify(
          encryptedBioSecurityNonCompliancePersonalConcessions,
          TOKENIZE
        );
        allBioSecurityNonCompliancePersonalConcessions = decrypted.queryResult;
        setAllBioSecurityNonCompliancePersonalConcessions(
          allBioSecurityNonCompliancePersonalConcessions
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

  // let allBioSecurityNonCompliancePersonalConcessions = [];
  // const encryptedBioSecurityNonCompliancePersonalConcessions =
  //   data?.tokenizedAllBioSecurityNonCompliancePersonalConcessions || "";
  // if (encryptedBioSecurityNonCompliancePersonalConcessions) {
  //   const decrypted = jwt.verify(
  //     encryptedBioSecurityNonCompliancePersonalConcessions,
  //     TOKENIZE
  //   );
  //   allBioSecurityNonCompliancePersonalConcessions = decrypted.queryResult;
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
                  setModalVisible(true);
                  setFormData({
                    ...props.row.original,
                    countryUUID: props.row.original?.Country?.uuid || "",
                    takenActionUUID:
                      props.row.original?.TakenAction?.uuid || "",
                    nonComplienceLists:
                      props.row.original.nonComplienceUUID || [],
                  });
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
      Header: "Name",
      accessor: "name",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "IC Number",
      accessor: "icNo",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Contact Details",
      accessor: "contactDetails",
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
          setSelectedCountry({});
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setModalExportVisible(true);
          showLoadingSpinner();
          try {
            const response =
              await exportBioSecurityNonCompliancePersonalConcession({
                variables: {
                  monthYear: yearMonth,
                  ...exportFormData,
                },
              });
            const base64Response =
              response.data.exportBioSecurityNonCompliancePersonalConcession;
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
            link.download = "personal_concession_non_compliance.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);
            // window.open(
            //   response.data.exportBioSecurityNonCompliancePersonalConcession,
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
            <label>Name</label>
            <input
              className="form-control"
              value={exportFormData.name || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setExportFormData({
                  ...exportFormData,
                  name: e.target.value.toUpperCase(),
                });
              }}
            />
          </div>

          <div className="form-group">
            <label>Ic Number</label>
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
            <label>Permit Number</label>
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
              }}
            /> */}
          </div>

          <div className="form-group">
            <label>Action to be Taken</label>
            <Select
              isClearable={true}
              value={selectedAction}
              options={allBioSecurityTakenActions.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof?.name?.toUpperCase(),
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
              await createBioSecurityNonCompliancePersonalConcession({
                variables: {
                  tokenized,
                },
              });
            } else {
              const tokenizedPayload = {
                ...payload,
                nonComplienceUUID: payload.nonComplienceLists,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await updateBioSecurityNonCompliancePersonalConcession({
                variables: {
                  tokenized,
                  // ...formData,
                  // nonComplienceUUID: formData.nonComplienceLists,
                },
              });
            }

            await refetch();

            router.replace({
              pathname: router.pathname,
              query: {
                ...router.query,
                saveDate: new Date().toISOString(),
              },
            });

            notification.addNotification({
              title: "Succeess!",
              message: `PersonalConcession saved!`,
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
          <label>Point of Entry</label>
          <input
            disabled
            className="form-control"
            value={formData?.pointOfEntry?.toUpperCase() || ""}
          />
        </div>
        <div className="form-group">
          <label>Staff Name</label>
          <input
            className="form-control"
            value={formData?.staffName?.toUpperCase() || ""}
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
            required
          />
        </div>
        <div className="form-group">
          <label>Name</label>
          <input
            className="form-control"
            value={formData.name || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                name: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Contact Details</label>
          <input
            className="form-control"
            value={formData.contactDetails || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                contactDetails: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Address</label>
          <input
            className="form-control"
            value={formData.address}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                address: e.target.value.toUpperCase(),
              });
            }}
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
                countryUUID: selectedValues?.uuid || "",
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
                takenActionUUID: e.target.value.toUpperCase(),
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
          data={allBioSecurityNonCompliancePersonalConcessions}
          loading={loading}
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege([
              "Personal Concession Non Compliance & Enforcement:Update",
            ])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege([
              "Personal Concession Non Compliance & Enforcement:Create",
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
              "Personal Concession Non Compliance & Enforcement:Delete",
            ])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} enforcement?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteBioSecurityNonCompliancePersonalConcession({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} enforcement deleted`,
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
export default withApollo({ ssr: true })(PersonalConcession);
