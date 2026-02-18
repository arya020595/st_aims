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
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";

import jwt from "jsonwebtoken";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries {
    # allPoultryHouses {
    #   id
    #   uuid
    #   farmProfileArea

    #   farmerUUID
    #   farmerCompanyName
    #   farmAreaId

    #   houseNo
    #   houseType
    #   houseSystem
    #   houseCapacity
    # }

    # allFarmerProfiles {
    #   uuid
    #   farmerCompanyName
    # }
    # allFarmProfiles {
    #   uuid
    #   farmerName
    #   farmArea
    # }
    tokenizedAllPoultryHouses
    tokenizedAllFarmerProfile
    tokenizedAllFarmProfile
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

const CREATE_POULTRY_HOUSE = gql`
  mutation createPoultryHouse(
    #$farmerUUID: String!
    #$farmerCompanyName: String!
    #$farmAreaId: String!
    #$farmProfileArea: String!
    #$houseNo: String!
    #$houseType: String!
    #$houseSystem: String!
    #$houseCapacity: Int!
    $tokenized: String!
  ) {
    createPoultryHouse(
      #farmerUUID: $farmerUUID
      #farmerCompanyName: $farmerCompanyName
      #farmAreaId: $farmAreaId
      #farmProfileArea: $farmProfileArea

      #houseNo: $houseNo
      #houseType: $houseType
      #houseSystem: $houseSystem
      #houseCapacity: $houseCapacity
      tokenized: $tokenized
    )
  }
`;

const UPDATE_POULTRY_HOUSE = gql`
  mutation updatePoultryHouse(
    #$uuid: String!
    #$farmerUUID: String
    #$farmerCompanyName: String
    #$farmAreaId: String
    #$farmProfileArea: String
    #$houseNo: String
    #$houseType: String
    #$houseSystem: String
    #$houseCapacity: Int
    $tokenized: String!
  ) {
    updatePoultryHouse(
      #uuid: $uuid
      #farmerUUID: $farmerUUID
      #farmerCompanyName: $farmerCompanyName
      #farmAreaId: $farmAreaId
      #farmProfileArea: $farmProfileArea

      #houseNo: $houseNo
      #houseType: $houseType
      #houseSystem: $houseSystem
      #houseCapacity: $houseCapacity
      tokenized: $tokenized
    )
  }
`;

const DELETE_POULTRY_HOUSE = gql`
  mutation deletePoultryHouse(
    #$uuid: String!
    $tokenized: String!
  ) {
    deletePoultryHouse(
      #uuid: $uuid
      tokenized: $tokenized
    )
  }
`;

const SEARCH_FARMER_QUERY = gql`
  query searchQuery($name: String!) {
    searchFarmerProfileByCompanyRegNo(name: $name)
  }
`;

const EXPORT_POULTRY = gql`
  mutation exportPoultryHouse {
    exportPoultryHouse
  }
`;

const SEARCH_FARM_QUERY = gql`
  query searchFarmProfile($name: String) {
    searchFarmProfile(name: $name)
  }
`;

const IS_CHECK_FARMER = gql`
  query isFarmerCheck {
    isFarmerCheck
  }
`;

const PoultryHouse = () => {
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
  const [createPoultryHouse] = useMutation(CREATE_POULTRY_HOUSE);
  const [updatePoultryHouse] = useMutation(UPDATE_POULTRY_HOUSE);
  const [deletePoultryHouse] = useMutation(DELETE_POULTRY_HOUSE);
  const [exportPoultryHouse] = useMutation(EXPORT_POULTRY);
  const [allPoultryHouses, setAllPoultryHouse] = useState([]);
  const [allFarmerProfiles, setAllFarmerProfiles] = useState([]);
  const [allFarmProfiles, setAllFarmProfiles] = useState([]);
  const [selectedFarmArea, setSelectedFarmArea] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [allFarmProfile, setAllFarmProfile] = useState([]);
  const [mode, setMode] = useState("");
  const [registerType, setRegisterType] = useState("");

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

  const fetchFarmProfile = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_FARM_QUERY,
      variables: {
        name: input,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedFarmProfile = result.data?.searchFarmProfile || "";
    let allFarmProfile = [];
    if (encryptedFarmProfile) {
      const decrypted = jwt.verify(encryptedFarmProfile, TOKENIZE);
      allFarmProfile = decrypted.queryResult;
      setAllFarmProfile(allFarmProfile);
    }
  };

  const getFarmProfile = (input) => {
    if (!input) {
      setAllFarmProfile([]);
    } else {
      fetchFarmProfile(input);
    }
  };

  useEffect(() => {
    if (!loading && !error) {
      const encryptedPoultryHouses = data?.tokenizedAllPoultryHouses || "";
      let allPoultryHouses = [];
      if (encryptedPoultryHouses) {
        const decrypted = jwt.verify(encryptedPoultryHouses, TOKENIZE);
        allPoultryHouses = decrypted.queryResult;
        setAllPoultryHouse(allPoultryHouses);
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
        onPage: "MASTER DATA POULTRY HOUSE",
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
                setMode("edit");
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
      Header: "House No.",
      accessor: "houseNo",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "House Type",
      accessor: "houseType",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "House System",
      accessor: "houseSystem",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "House Capacity",
      accessor: "houseCapacity",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Address",
      accessor: "address",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value}</span>,
    },
  ]);

  const columnsCompany = useMemo(() => [
    {
      Header: "",
      accessor: "select",
      style: {
        fontSize: 20,
        width: 100,
      },
      Cell: (props) => {
        return (
          <button
            className={`bg-mantis-500 hover:bg-mantis-700 text-white font-bold py-2 px-4 rounded`}
            onClick={async (e) => {
              if (e) e.preventDefault();

              if (mode === "create") {
                let address = "";
                if (
                  props.row.original.addresses &&
                  props.row.original.addresses.length > 0
                ) {
                  address = props.row.original.addresses[0].address;
                }
                setFormData({
                  ...formData,
                  farmerUUID: props.row.original.farmerUUID,
                  farmerCompanyName:
                    props.row.original.farmerCompanyName.toUpperCase(),
                  farmAreaId: props.row.original.uuid,
                  farmProfileArea: props.row.original.farmArea.toUpperCase(),
                  address,
                });
                setCompanyModalVisible(false);
                setModalVisible(true);
              } else {
                let address = "";
                if (
                  props.row.original.addresses &&
                  props.row.original.addresses.length > 0
                ) {
                  address = props.row.original.addresses[0].address;
                }

                console.log(props.row.original);
                setEditFormData({
                  ...editFormData,
                  farmerUUID: props.row.original.farmerUUID,
                  farmerCompanyName:
                    props.row.original.farmerCompanyName.toUpperCase(),
                  farmAreaId: props.row.original.uuid,
                  farmProfileArea: props.row.original.farmArea.toUpperCase(),
                  address,
                });
                setCompanyModalVisible(false);
                setEditModalVisible(true);
              }
            }}
          >
            Select
          </button>
        );
      },
    },
    {
      Header: "Company Name",
      accessor: "farmerCompanyName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Farm Area",
      accessor: "farmArea",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Address",
      accessor: "address",
      style: {
        fontSize: 20,
      },
      Cell: (props) => {
        if (
          props.row.original.addresses &&
          props.row.original.addresses.length > 0
        ) {
          return props.row.original.addresses[0].address;
        }
        return "-";
      },
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Poultry House</title>
      </Head>

      <FormModal
        title={`Edit Poultry House`}
        visible={editModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setEditModalVisible(false);
          setEditFormData({});
        }}
        onCustomCloseBackDrop={true}
        size={"md"}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          try {
            const { __typename, FarmerProfile, ...data } = editFormData;

            const tokenized = jwt.sign(data, TOKENIZE);

            await updatePoultryHouse({
              variables: {
                ...editFormData,
                tokenized,
              },
            });

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Poultry House saved!`,
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
          <input
            className="form-control"
            value={editFormData.FarmerProfile?.farmerCompanyName || ""}
            disabled
          />
          {/* <AsyncSelect
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
              // console.log({ selectedValues });

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
          /> */}
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
            disabled
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
        <div className="form-group">
          <label>Address</label>
          <input
            className="form-control"
            value={editFormData?.address || ""}
            disabled
          />
        </div>

        <button
          className="bg-purple-500 rounded-md mt-2 text-white py-2 px-3 shadow-md w-full"
          onClick={async (e) => {
            if (e) e.preventDefault();

            const result = await client.query({
              query: IS_CHECK_FARMER,
              fetchPolicy: "no-cache",
            });

            const farmerCheck = result.data.isFarmerCheck;

            if (farmerCheck) {
              const resultFarmerQuery = await client.query({
                query: SEARCH_FARM_QUERY,
                fetchPolicy: "no-cache",
              });

              const encryptedFarmProfile =
                resultFarmerQuery.data?.searchFarmProfile || "";
              let allFarmProfile = [];

              if (encryptedFarmProfile) {
                const decrypted = jwt.verify(encryptedFarmProfile, TOKENIZE);
                allFarmProfile = decrypted.queryResult;
                setAllFarmProfile(allFarmProfile);
              }
              setRegisterType("FARMER");
            } else {
              setAllFarmProfile([]);
              setRegisterType("OFFICER");
            }

            setCompanyModalVisible(true);
            setModalVisible(false);
          }}
        >
          <i className="fa fa-search" /> Select and Search
        </button>

        <div className="grid grid-cols-4 gap-0 mt-4">
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            House No.
          </div>
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            House Type
          </div>
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            House System
          </div>
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            House Capacity
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1 my-2">
          <div>
            <input
              className="form-control"
              value={(editFormData.houseNo || "").toUpperCase()}
              placeholder="House No."
              onChange={(e) => {
                if (e) e.preventDefault;
                setEditFormData({
                  ...editFormData,
                  houseNo: e.target.value.toUpperCase(),
                });
              }}
            />
          </div>
          <div>
            <select
              className="form-control"
              value={(editFormData.houseType || "").toUpperCase()}
              placeholder="House Type"
              onChange={(e) => {
                if (e) e.preventDefault;
                setEditFormData({
                  ...editFormData,
                  houseType: e.target.value.toUpperCase(),
                });
              }}
            >
              <option value={""} disabled>
                Select House Type
              </option>
              <option value="SLATTED FLOOR">1. SLATTED FLOOR</option>
              <option value="DEEP LITTER">2. DEEP LITTER</option>
              <option value="MULTISTOREY">3. MULTISTOREY</option>
            </select>
          </div>
          <div>
            <select
              className="form-control"
              value={(editFormData.houseSystem || "").toUpperCase()}
              placeholder="House System"
              onChange={(e) => {
                if (e) e.preventDefault;
                setEditFormData({
                  ...editFormData,
                  houseSystem: e.target.value.toUpperCase(),
                });
              }}
            >
              <option value={""} disabled>
                Select House System
              </option>
              <option value="CLOSED HOUSE">1. CLOSED HOUSE</option>
              <option value="CONVENTIONAL">2. CONVENTIONAL</option>
            </select>
          </div>
          <div>
            <NumberFormat
              className="form-control"
              value={editFormData.houseCapacity || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setEditFormData({
                  ...editFormData,
                  houseCapacity: e.floatValue || 0,
                });
              }}
            />
          </div>
        </div>
      </FormModal>

      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Poultry House`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            records: [],
          });
        }}
        onCustomCloseBackDrop={true}
        size="md"
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          try {
            const {
              farmerCompanyName,
              farmerUUID,
              farmAreaId,
              farmProfileArea,
              address,
            } = formData;

            for (const data of formData.records) {
              const tokenizedPayload = {
                farmerCompanyName,
                farmerUUID,
                farmAreaId,
                farmProfileArea,
                address,
                ...data,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

              await createPoultryHouse({
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
              message: `Poultry House saved!`,
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
          <input
            className="form-control"
            value={formData?.farmerCompanyName || ""}
            disabled
          />
          {/* <AsyncSelect
            loadOptions={getFarmer}
            className={`form-control`}
            classNamePrefix="select"
            getOptionLabel={(option) =>
              `${option.farmerCompanyName.toUpperCase()} - ${option.companyId}`
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
          /> */}
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
            disabled
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

        <div className="form-group">
          <label>Address</label>
          <input
            className="form-control"
            value={formData?.address || ""}
            disabled
          />
        </div>

        <button
          className="bg-purple-500 rounded-md mt-2 text-white py-2 px-3 shadow-md w-full"
          onClick={async (e) => {
            if (e) e.preventDefault();

            const result = await client.query({
              query: IS_CHECK_FARMER,
              fetchPolicy: "no-cache",
            });

            const farmerCheck = result.data.isFarmerCheck;

            if (farmerCheck) {
              const resultFarmerQuery = await client.query({
                query: SEARCH_FARM_QUERY,
                fetchPolicy: "no-cache",
              });

              const encryptedFarmProfile =
                resultFarmerQuery.data?.searchFarmProfile || "";
              let allFarmProfile = [];

              if (encryptedFarmProfile) {
                const decrypted = jwt.verify(encryptedFarmProfile, TOKENIZE);
                allFarmProfile = decrypted.queryResult;
                setAllFarmProfile(allFarmProfile);
              }
              setRegisterType("FARMER");
            } else {
              setAllFarmProfile([]);
              setRegisterType("OFFICER");
            }

            setCompanyModalVisible(true);
            setModalVisible(false);
          }}
        >
          <i className="fa fa-search" /> Select and Search
        </button>

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
                    houseNo: "",
                    houseType: "",
                    houseSystem: "",
                    houseCapacity: "",
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
        <div className="grid grid-cols-5 gap-0">
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            House No.{" "}
          </div>
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            House Type
          </div>
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            House System
          </div>
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            House Capacity
          </div>
          <div className="flex justify-center py-2 bg-mantis-500 text-white">
            Utilites
          </div>
        </div>

        {formData.records.map((rec) => (
          <div className="grid grid-cols-5 gap-1 my-2">
            <div>
              <input
                className="form-control"
                value={(rec.houseNo || "").toUpperCase()}
                placeholder="House No."
                onChange={(e) => {
                  if (e) e.preventDefault;
                  setFormData({
                    ...formData,
                    records: formData.records.map((det) =>
                      det._id !== rec._id
                        ? det
                        : {
                            ...rec,
                            houseNo: e.target.value.toUpperCase(),
                          }
                    ),
                  });
                }}
              />
            </div>
            <div>
              <select
                className="form-control"
                value={(rec.houseType || "").toUpperCase()}
                placeholder="House Type"
                onChange={(e) => {
                  if (e) e.preventDefault;
                  setFormData({
                    ...formData,
                    records: formData.records.map((det) =>
                      det._id !== rec._id
                        ? det
                        : {
                            ...rec,
                            houseType: e.target.value.toUpperCase(),
                          }
                    ),
                  });
                }}
              >
                <option value={""} disabled>
                  Select House Type
                </option>
                <option value="SLATTED FLOOR">1. SLATTED FLOOR</option>
                <option value="DEEP LITTER">2. DEEP LITTER</option>
              </select>
            </div>
            <div>
              <select
                className="form-control"
                value={(rec.houseSystem || "").toUpperCase()}
                placeholder="House System"
                onChange={(e) => {
                  if (e) e.preventDefault;
                  setFormData({
                    ...formData,
                    records: formData.records.map((det) =>
                      det._id !== rec._id
                        ? det
                        : {
                            ...rec,
                            houseSystem: e.target.value.toUpperCase(),
                          }
                    ),
                  });
                }}
              >
                <option value={""} disabled>
                  Select House System
                </option>
                <option value="CLOSED HOUSE">1. CLOSED HOUSE</option>
                <option value="CONVENTIONAL">2. CONVENTIONAL</option>
                <option value="MULTISTOREY">3. MULTISTOREY</option>
              </select>
            </div>
            <div>
              <NumberFormat
                className="form-control"
                value={rec.houseCapacity || ""}
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
                            houseCapacity: e.floatValue || 0,
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

      <FormModal
        title={"Select Company"}
        size={"xl"}
        visible={companyModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setCompanyModalVisible(false);
          if (mode === "create") {
            setModalVisible(true);
          } else {
            setEditModalVisible(true);
          }
        }}
      >
        <Table
          columns={columnsCompany}
          data={allFarmProfile}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex items-start">
              {registerType === "OFFICER" ? (
                <div className="form-group">
                  <label>Search</label>
                  <input
                    className="form-control"
                    onChange={(e) => {
                      getFarmProfile(e.target.value);
                    }}
                  />
                </div>
              ) : null}
            </div>
          }
        />
      </FormModal>

      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allPoultryHouses}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportPoultryHouse();

                    downloadExcelFromBuffer(
                      response.data.exportPoultryHouse.data,
                      "poultry-houst-livestock"
                    );
                    // window.open(response.data.exportPoultryHouse, "__blank");
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
            !currentUserDontHavePrivilege(["Poultry House:Create"])
              ? (e) => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({
                    records: [],
                  });
                  setMode("create");
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Poultry House:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} poultry house?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);

                        await deletePoultryHouse({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} poultry house deleted`,
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
            !currentUserDontHavePrivilege(["Poultry House:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(PoultryHouse);
