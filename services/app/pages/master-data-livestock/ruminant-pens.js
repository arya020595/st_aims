import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../../components/App";
import { handleError } from "../../libs/errors";
import redirect from "../../libs/redirect";
import gql from "graphql-tag";
import {
  useMutation,
  useQuery,
  useApolloClient,
  ApolloProvider,
} from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";
import { MultiYearsFilterWithExport } from "../../components/MultiYearsFilterWithExport";
import { v4 as uuidv4 } from "uuid";
import NumberFormat from "react-number-format";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";

const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries {
    # allRuminantPenses {
    #   id
    #   uuid
    #   farmProfileArea

    #   farmerUUID
    #   farmerCompanyName
    #   farmAreaId

    #   pensNo
    #   pensSystem
    #   pensCapacity
    # }

    # allFarmerProfiles {
    #   uuid
    #   farmerCompanyName
    # }
    # allFarmProfiles {
    #   uuid
    #   farmArea
    # }
    tokenizedAllRuminantPenses
    tokenizedAllFarmerProfile
    tokenizedAllFarmProfile
  }
`;

const CREATE_RUMINANT_PENS = gql`
  mutation createRuminantPens(
    #$farmerUUID: String!
    #$farmerCompanyName: String!
    #$farmAreaId: String!
    #$farmProfileArea: String!
    #$pensNo: String!
    #$pensSystem: String!
    #$pensCapacity: Int!
    $tokenized: String!
  ) {
    createRuminantPens(
      #farmerUUID: $farmerUUID
      #farmerCompanyName: $farmerCompanyName
      #farmAreaId: $farmAreaId
      #farmProfileArea: $farmProfileArea

      #pensNo: $pensNo
      #pensSystem: $pensSystem
      #pensCapacity: $pensCapacity
      tokenized: $tokenized
    )
  }
`;

const UPDATE_RUMINANT_PENS = gql`
  mutation updateRuminantPens(
    #$uuid: String!
    #$farmerUUID: String
    #$farmerCompanyName: String
    #$farmAreaId: String
    #$farmProfileArea: String
    #$pensNo: String
    #$pensSystem: String
    #$pensCapacity: Int
    $tokenized: String!
  ) {
    updateRuminantPens(
      #uuid: $uuid
      #farmerUUID: $farmerUUID
      #farmerCompanyName: $farmerCompanyName
      #farmAreaId: $farmAreaId
      #farmProfileArea: $farmProfileArea

      #pensNo: $pensNo
      #pensSystem: $pensSystem
      #pensCapacity: $pensCapacity
      tokenized: $tokenized
    )
  }
`;

const DELETE_RUMINANT_PENS = gql`
  mutation deleteRuminantPens(
    #$uuid: String!
    $tokenized: String!
  ) {
    deleteRuminantPens(
      #uuid: $uuid
      tokenized: $tokenized
    )
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

const SEARCH_FARMER_QUERY = gql`
  query searchQuery($name: String) {
    searchFarmerProfileByCompanyRegNo(name: $name)
  }
`;

const EXPORT_RUMINANT_PENS = gql`
  mutation exportRuminantPens {
    exportRuminantPens
  }
`;

const IS_CHECK_FARMER = gql`
  query isFarmerCheck {
    isFarmerCheck
  }
`;

const RuminantPens = () => {
  const router = useRouter();
  const client = useApolloClient();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const notification = useNotification();
  const [formData, setFormData] = useState({
    records: [],
  });
  const [editFormData, setEditFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createRuminantPens] = useMutation(CREATE_RUMINANT_PENS);
  const [updateRuminantPens] = useMutation(UPDATE_RUMINANT_PENS);
  const [deleteRuminantPens] = useMutation(DELETE_RUMINANT_PENS);
  const [exportRuminantPens] = useMutation(EXPORT_RUMINANT_PENS);
  const [allRuminantPenses, setAllRuminantPenses] = useState([]);
  const [allFarmerProfiles, setAllFarmerProfiles] = useState([]);
  const [allFarmProfiles, setAllFarmProfiles] = useState([]);
  const [registerType, setRegisterType] = useState("");

  useEffect(() => {
    if (!loading && !error) {
      const encryptedRuminantPenses = data?.tokenizedAllRuminantPenses || "";
      let allRuminantPenses = [];
      if (encryptedRuminantPenses) {
        const decrypted = jwt.verify(encryptedRuminantPenses, TOKENIZE);
        allRuminantPenses = decrypted.queryResult;
        setAllRuminantPenses(allRuminantPenses);
      }

      // const encryptedFarmerProfiles = data?.tokenizedAllFarmerProfile || "";
      // let allFarmerProfiles = [];
      // if (encryptedFarmerProfiles) {
      //   const decrypted = jwt.verify(encryptedFarmerProfiles, TOKENIZE);
      //   allFarmerProfiles = decrypted.queryResult;
      //   setAllFarmerProfiles(allFarmerProfiles);
      // }

      // const encryptedFarmProfiles = data?.tokenizedAllFarmProfile || "";
      // let allFarmProfiles = [];
      // if (encryptedFarmProfiles) {
      //   const decrypted = jwt.verify(encryptedFarmProfiles, TOKENIZE);
      //   allFarmProfiles = decrypted.queryResult;
      //   setAllFarmProfiles(allFarmProfiles);
      // }
    }
  }, [data, loading, error]);

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
    let allFarmerProfiles = [];
    if (encryptedFarmerProfilesByCompanyRegNo) {
      const decrypted = jwt.verify(
        encryptedFarmerProfilesByCompanyRegNo,
        TOKENIZE
      );
      allFarmerProfiles = decrypted.queryResult;
      setAllFarmerProfiles(allFarmerProfiles);
    }
    callback(allFarmerProfiles);
  };

  const getFarmer = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fethchingFarmer(input, callback);
    }
  };

  useEffect(async () => {
    let tokenizedParams = "";
    if (formData.farmerUUID) {
      const farmerUUID = formData.farmerUUID;
      const payload = { farmerUUID };
      tokenizedParams = jwt.sign(payload, TOKENIZE);
    }
    if (editFormData.farmerUUID) {
      const farmerUUID = editFormData.farmerUUID;
      const payload = { farmerUUID };
      tokenizedParams = jwt.sign(payload, TOKENIZE);
    }
    const result = await client.query({
      query: FARM_AREA_QUERY,
      variables: {
        tokenizedParams,
        onPage: "MASTER DATA RUMINANT PENS",
      },
      fetchPolicy: "no-cache",
    });

    const encryptedFarmProfilesByFarmer =
      result.data?.tokenizedAllFarmProfilesByFarmer || "";
    let allFarmProfilesByFarmer = [];
    if (encryptedFarmProfilesByFarmer) {
      const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
      allFarmProfilesByFarmer = decrypted.queryResult;
      setAllFarmProfiles(allFarmProfilesByFarmer);
    }
    hideLoadingSpinner();
  }, [formData.farmerUUID, editFormData.farmerUUID]);

  useEffect(async () => {
    const result = await client.query({
      query: SEARCH_FARMER_QUERY,
      variables: {},
      fetchPolicy: "no-cache",
    });

    const encryptedFarmerProfilesByCompanyRegNo =
      result.data?.searchFarmerProfileByCompanyRegNo || "";
    let allFarmerProfiles = [];
    if (encryptedFarmerProfilesByCompanyRegNo) {
      const decrypted = jwt.verify(
        encryptedFarmerProfilesByCompanyRegNo,
        TOKENIZE
      );
      allFarmerProfiles = decrypted.queryResult;
      setAllFarmerProfiles(allFarmerProfiles);
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
      render: (propsTable) => {
        return (
          <div className="flex">
            <button
              onClick={(e) => {
                if (e) e.preventDefault();
                setEditModalVisible(true);
                setEditFormData({
                  ...propsTable.row.original,
                  FarmerProfile: {
                    uuid: propsTable.row.original.farmerUUID,
                    farmerCompanyName:
                      propsTable.row.original.farmerCompanyName,
                  },
                });
              }}
              className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg"
            >
              <p className="text-white text-md font-bold">
                <i className="fa fa-pencil-alt " /> Edit
              </p>
            </button>
          </div>
        );
      },
    },
  ]);

  const columns = useMemo(() => [
    {
      Header: "ID",
      accessor: "id",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Company Name",
      accessor: "farmerCompanyName",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Farm Area",
      accessor: "farmProfileArea",
      style: {
        fontSize: 20,
        width: 150,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Pens No.",
      accessor: "pensNo",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Pens System",
      accessor: "pensSystem",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Pens Capacity",
      accessor: "pensCapacity",
      style: {
        fontSize: 20,
      },
    },
  ]);
  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Ruminant Pens</title>
      </Head>

      <FormModal
        title={`Edit Ruminant Pens`}
        visible={editModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setEditModalVisible(false);
          setEditFormData({
            records: [],
          });
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          try {
            const { __typename, FarmerProfile, ...data } = editFormData;
            const tokenized = jwt.sign(data, TOKENIZE);

            await updateRuminantPens({
              variables: {
                ...editFormData,
                tokenized,
              },
            });

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Ruminant Pens saved!`,
              level: "success",
            });
            setEditModalVisible(false);
            setEditFormData({});
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Company Name</label>
          {registerType === "OFFICER" ? (
            <AsyncSelect
              value={editFormData.FarmerProfile}
              loadOptions={getFarmer}
              className={`form-control`}
              classNamePrefix="select"
              getOptionLabel={(option) =>
                `${option.farmerCompanyName.toUpperCase()}`
              }
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              noOptionsMessage={() => "Type to Search"}
              onChange={(selectedValues) => {
                const found = allFarmerProfiles.find(
                  (profile) => profile.uuid === selectedValues.uuid
                );

                setEditFormData({
                  ...editFormData,
                  FarmerProfile: found,
                  farmerUUID: found.uuid,
                  farmerCompanyName: found.farmerCompanyName.toUpperCase(),
                });
              }}
            />
          ) : (
            <Select
              value={editFormData.FarmerProfile}
              options={allFarmerProfiles}
              className={`form-control`}
              classNamePrefix="select"
              getOptionLabel={(option) =>
                `${option.farmerCompanyName.toUpperCase()}`
              }
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              onChange={(selectedValues) => {
                const found = allFarmerProfiles.find(
                  (profile) => profile.uuid === selectedValues.uuid
                );

                setEditFormData({
                  ...editFormData,
                  FarmerProfile: found,
                  farmerUUID: found.uuid,
                  farmerCompanyName: found.farmerCompanyName.toUpperCase(),
                });
              }}
            />
          )}
        </div>

        {/* <div className="form-group">
          <label>Company Name</label>
          <select
            className="form-control"
            value={editFormData.farmerUUID || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allFarmerProfiles.find(
                (c) => c.uuid === e.target.value
              );
              setEditFormData({
                ...editFormData,
                farmerUUID: found.uuid,
                farmerCompanyName: found.farmerCompanyName,
              });
            }}
            required
          >
            <option value={""} disabled>
              Select Company Name
            </option>

            {allFarmerProfiles.map((farm) => (
              <option value={farm.uuid}>{farm.farmerCompanyName}</option>
            ))}
          </select>
        </div> */}

        <div className="form-group">
          <label>Farm Area</label>
          <select
            className="form-control"
            value={editFormData.farmAreaId || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allFarmProfiles.find(
                (c) => c.uuid === e.target.value
              );
              setEditFormData({
                ...editFormData,
                farmAreaId: found.uuid,
                farmProfileArea: found.farmArea.toUpperCase(),
              });
            }}
            required
          >
            <option value={""} disabled>
              Select Farm Profile
            </option>

            {allFarmProfiles.map((farm) => (
              <option value={farm.uuid}>{farm.farmArea.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-0">
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            Pens No.
          </div>
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            Pens System
          </div>
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            Pens Capacity
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 my-2">
          <div>
            <input
              className="form-control"
              value={(editFormData.pensNo || "").toUpperCase()}
              placeholder="Pens No."
              onChange={(e) => {
                if (e) e.preventDefault;
                setEditFormData({
                  ...editFormData,
                  pensNo: e.target.value.toUpperCase(),
                });
              }}
            />
          </div>
          <div>
            <select
              className="form-control"
              value={(editFormData.pensSystem || "").toUpperCase()}
              placeholder="Pens System"
              onChange={(e) => {
                if (e) e.preventDefault;
                setEditFormData({
                  ...editFormData,
                  pensSystem: e.target.value.toUpperCase(),
                });
              }}
            >
              <option value={""} disabled>
                Select System
              </option>
              <option value="INTENSIVE">1. INTENSIVE</option>
              <option value="SEMI-INTENSIVE">2. SEMI-INTENSIVE</option>
              <option value="FREE GRAZING">3. FREE GRAZING</option>
            </select>
          </div>
          <div>
            <NumberFormat
              className="form-control"
              value={editFormData.pensCapacity || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setEditFormData({
                  ...editFormData,
                  pensCapacity: e.floatValue || 0,
                });
              }}
            />
          </div>
        </div>
      </FormModal>

      <FormModal
        title={`New Ruminant Pens`}
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
          try {
            const {
              farmerCompanyName,
              farmerUUID,
              farmAreaId,
              farmProfileArea,
            } = formData;

            for (const data of formData.records) {
              const tokenizedPayload = {
                farmerCompanyName,
                farmerUUID,
                farmAreaId,
                farmProfileArea,
                ...data,
              };

              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

              await createRuminantPens({
                variables: {
                  // farmerCompanyName,
                  // farmerUUID,
                  // farmAreaId,
                  // farmProfileArea,
                  // ...data,
                  tokenized,
                },
              });
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Ruminant Pens saved!`,
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
          <label>Company Name</label>
          {registerType === "OFFICIAL" ? (
            <AsyncSelect
              loadOptions={getFarmer}
              className={`form-control`}
              classNamePrefix="select"
              getOptionLabel={(option) =>
                `${option.farmerCompanyName.toUpperCase()} - ${
                  option.companyId
                }`
              }
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              noOptionsMessage={() => "Type to Search"}
              onChange={async (selectedValues) => {
                const found = allFarmerProfiles.find(
                  (profile) => profile.uuid === selectedValues.uuid
                );

                setFormData({
                  ...formData,
                  farmerUUID: found.uuid,
                  farmerCompanyName: found.farmerCompanyName.toUpperCase(),
                });
              }}
            />
          ) : (
            <Select
              options={allFarmerProfiles}
              className={`form-control`}
              classNamePrefix="select"
              getOptionLabel={(option) =>
                `${option.farmerCompanyName.toUpperCase()} - ${
                  option.companyId
                }`
              }
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              onChange={async (selectedValues) => {
                const found = allFarmerProfiles.find(
                  (profile) => profile.uuid === selectedValues.uuid
                );
                setFormData({
                  ...formData,
                  farmerUUID: found.uuid,
                  farmerCompanyName: found.farmerCompanyName.toUpperCase(),
                });
              }}
            />
          )}
        </div>

        {/* <div className="form-group">
          <label>Company Name</label>
          <select
            className="form-control"
            value={formData.farmerUUID || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allFarmerProfiles.find(
                (c) => c.uuid === e.target.value
              );
              setFormData({
                ...formData,
                farmerUUID: found.uuid,
                farmerCompanyName: found.farmerCompanyName,
              });
            }}
            required
          >
            <option value={""} disabled>
              Select Company Name
            </option>

            {allFarmerProfiles.map((farm) => (
              <option value={farm.uuid}>{farm.farmerCompanyName}</option>
            ))}
          </select>
        </div> */}

        <div className="form-group">
          <label>Farm Area</label>
          <select
            className="form-control"
            value={formData.farmAreaId || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allFarmProfiles.find(
                (c) => c.uuid === e.target.value
              );
              setFormData({
                ...formData,
                farmAreaId: found.uuid,
                farmProfileArea: found.farmArea.toUpperCase(),
              });
            }}
            required
          >
            <option value={""} disabled>
              Select Farm
            </option>

            {allFarmProfiles.map((farm) => (
              <option value={farm.uuid}>{farm.farmArea.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end my-2">
          <button
            className="bg-mantis-500 text-white font-bold text-md px-4 py-2 rounded shadow-md"
            onClick={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                records: [
                  ...formData.records,
                  {
                    _id: uuidv4(),
                    pensNo: "",
                    pensSystem: "",
                    pensCapacity: 0,
                  },
                ],
              });
            }}
          >
            <p>
              <i className="fa fa-plus" /> Add Data
            </p>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-0">
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            Pens No.
          </div>
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            Pens System
          </div>
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            Pens Capacity
          </div>
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            Utilites
          </div>
        </div>

        {formData.records.map((rec) => (
          <div className="grid grid-cols-4 gap-1 my-2">
            <div>
              <input
                className="form-control"
                value={(rec.pensNo || "").toUpperCase()}
                placeholder="Pens No."
                onChange={(e) => {
                  if (e) e.preventDefault;
                  setFormData({
                    ...formData,
                    records: formData.records.map((det) =>
                      det._id !== rec._id
                        ? det
                        : {
                            ...rec,
                            pensNo: e.target.value.toUpperCase(),
                          }
                    ),
                  });
                }}
              />
            </div>
            <div>
              <select
                className="form-control"
                value={(rec.pensSystem || "").toUpperCase()}
                placeholder="Pens System"
                onChange={(e) => {
                  if (e) e.preventDefault;
                  setFormData({
                    ...formData,
                    records: formData.records.map((det) =>
                      det._id !== rec._id
                        ? det
                        : {
                            ...rec,
                            pensSystem: e.target.value.toUpperCase(),
                          }
                    ),
                  });
                }}
              >
                <option value={""} disabled>
                  Select System
                </option>
                <option value="INTENSIVE">1. INTENSIVE</option>
                <option value="SEMI-INTENSIVE">2. SEMI-INTENSIVE</option>
                <option value="FREE GRAZING">3. FREE GRAZING</option>
              </select>
            </div>
            <div>
              <NumberFormat
                className="form-control"
                value={rec.pensCapacity || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    records: formData.records.map((det) =>
                      det._id !== rec._id
                        ? det
                        : {
                            ...rec,
                            pensCapacity: e.floatValue || 0,
                          }
                    ),
                  });
                }}
              />
            </div>
            <div className="flex justify-center">
              <button
                className="bg-red-500 px-4 py-2 rounded-md shadow-md text-white font-bold"
                onClick={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    records: formData.records.filter((r) => r._id !== rec._id),
                  });
                }}
              >
                <p>
                  <i className="fa fa-times" />
                </p>
              </button>
            </div>
          </div>
        ))}
      </FormModal>

      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allRuminantPenses}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportRuminantPens();
                    downloadExcelFromBuffer(
                      response.data.exportRuminantPens.data,
                      "ruminant-pens-livestock"
                    );

                    // window.open(response.data.exportRuminantPens, "__blank");
                  } catch (error) {
                    notification.handleError(error);
                  }
                }}
              >
                Export Excel
              </button>
            </div>
          }
          onAdd={
            !currentUserDontHavePrivilege(["Ruminant Pens:Create"])
              ? (e) => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({
                    records: [],
                  });
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Ruminant Pens:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} ruminant pens?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);

                        await deleteRuminantPens({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} ruminant pens deleted`,
                        level: "success",
                      });
                      await refetch();
                    }
                  } catch (err) {
                    handleError(err);
                  }
                  hideLoadingSpinner();
                }
              : null
          }
          customUtilities={
            !currentUserDontHavePrivilege(["Ruminant Pens:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(RuminantPens);
