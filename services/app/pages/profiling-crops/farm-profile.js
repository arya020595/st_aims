import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import Table from "../../components/TableAsync";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";
import NumberFormat from "react-number-format";
import Tooltip from "../../components/Tooltip";
import lodash from "lodash";
import { v4 as uuidv4 } from "uuid";
import AsyncSelect from "react-select/async";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";

import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query allFarmProfilesByFarmer($filters: String) {
    #tokenizedAllFarmProfilesByFarmer

    #tokenizedAllFarmerProfilesByCompanyRegNo

    tokenizedAllFarmLocation

    tokenizedAllLandOwnerShipStatues

    tokenizedAllIrigationStatus

    tokenizedAllComodityTypes

    tokenizedAllContractStatuses

    tokenizedAllAwardTypes

    tokenizedAllModernTechnologies

    countFarmProfilesByFarmer(filters: $filters)
  }
`;

const FARM_QUERY_EN = gql`
  query tokenizedAllFarmProfilesByFarmer(
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllFarmProfilesByFarmer(
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countFarmProfilesByFarmer(filters: $filters)
  }
`;

const SEARCH_FARMER_PROFILE_BY_COMPANY_REG_NO = gql`
  query searchFarmerProfileByCompanyRegNo($name: String) {
    searchFarmerProfileByCompanyRegNo(name: $name)
  }
`;

const CREATE_FARMER_PROFILE = gql`
  mutation tokenizedCreateFarmProfile($input: JSON) {
    tokenizedCreateFarmProfile(input: $input)
  }
`;

const UPDATE_FARMER_PROFILE = gql`
  mutation tokenizedUpdateFarmProfile($input: JSON) {
    tokenizedUpdateFarmProfile(input: $input)
  }
`;

const DELETE_FARMER_PROFILE = gql`
  mutation tokenizedDeleteFarmProfile($tokenized: String!) {
    tokenizedDeleteFarmProfile(tokenized: $tokenized)
  }
`;

const GET_COUNT_FARM_PROFILE = gql`
  query countFarmProfile {
    countFarmProfile
  }
`;

const EXPORT_FARM_PROFILE = gql`
  mutation exportFarmProfile {
    exportFarmProfile
  }
`;

const FarmProfile = () => {
  const router = useRouter();
  const client = useApolloClient();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const notification = useNotification();
  const [formData, setFormData] = useState({
    typeOfComodityId: [],
    addresses: [],

    unskilledLocal: 0,
    semiSkilledLocal: 0,
    expertLocal: 0,
    skilledLocal: 0,

    unskilledForeigner: 0,
    semiSkilledForeigner: 0,
    expertForeigner: 0,
    skilledForeigner: 0,
  });

  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY, {
    variables: {
      filters: router.query.filters,
    },
  });
  const [createFarmProfile] = useMutation(CREATE_FARMER_PROFILE);
  const [updateFarmProfile] = useMutation(UPDATE_FARMER_PROFILE);
  const [deleteFarmProfile] = useMutation(DELETE_FARMER_PROFILE);
  const [exportFarmProfile] = useMutation(EXPORT_FARM_PROFILE);

  const [allFarmProfilesByFarmer, setAllFarmProfilesByFarmer] = useState([]);
  const [allFarmerProfilesByCompanyRegNo, setAllFarmerProfilesByCompanyRegNo] =
    useState([]);
  const [allFarmLocations, setAllFarmLocations] = useState([]);
  const [allLandOwnershipStatuses, setAllLandOwnershipStatuses] = useState([]);
  const [allIrigationStatuses, setAllIrigationStatuses] = useState([]);
  const [allComodityTypes, setAllComodityTypes] = useState([]);
  const [allContractStatuses, setAllContractStatuses] = useState([]);
  const [allAwardTypes, setAllAwardTypes] = useState([]);
  const [allModernTechnologies, setAllModernTechnologies] = useState([]);
  let [savedCount, setSavedCount] = useState(0);

  let [countFarmProfilesByFarmer, setCountFarmProfileByFarmer] = useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countFarmProfilesByFarmer) return 1;
    return Math.ceil(countFarmProfilesByFarmer / pageSize);
  }, [countFarmProfilesByFarmer, pageSize]);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedFarmProfilesByFarmer = data?.tokenizedAllFarmProfilesByFarmer || "";
      // let allFarmProfilesByFarmer = [];
      // if (encryptedFarmProfilesByFarmer) {
      //   const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
      //   allFarmProfilesByFarmer = decrypted.queryResult;
      //   setAllFarmProfilesByFarmer(allFarmProfilesByFarmer);
      // }
      // const encryptedFarmerProfilesByCompanyRegNo =
      //   data?.tokenizedAllFarmerProfilesByCompanyRegNo || "";
      // let allFarmerProfilesByCompanyRegNo = [];
      // if (encryptedFarmerProfilesByCompanyRegNo) {
      //   const decrypted = jwt.verify(
      //     encryptedFarmerProfilesByCompanyRegNo,
      //     TOKENIZE
      //   );
      //   allFarmerProfilesByCompanyRegNo = decrypted.queryResult;
      //   setAllFarmerProfilesByCompanyRegNo(allFarmerProfilesByCompanyRegNo);
      // }
      const encryptedFarmLocations = data?.tokenizedAllFarmLocation || "";
      let allFarmLocations = [];
      if (encryptedFarmLocations) {
        const decrypted = jwt.verify(encryptedFarmLocations, TOKENIZE);
        allFarmLocations = decrypted.queryResult;
        setAllFarmLocations(allFarmLocations);
      }
      const encryptedLandOwnershipStatuses =
        data?.tokenizedAllLandOwnerShipStatues || "";
      let allLandOwnershipStatuses = [];
      if (encryptedLandOwnershipStatuses) {
        const decrypted = jwt.verify(encryptedLandOwnershipStatuses, TOKENIZE);
        allLandOwnershipStatuses = decrypted.queryResult;
        setAllLandOwnershipStatuses(allLandOwnershipStatuses);
      }
      const encryptedIrigationStatuses =
        data?.tokenizedAllIrigationStatus || "";
      let allIrigationStatuses = [];
      if (encryptedIrigationStatuses) {
        const decrypted = jwt.verify(encryptedIrigationStatuses, TOKENIZE);
        allIrigationStatuses = decrypted.queryResult;
        setAllIrigationStatuses(allIrigationStatuses);
      }
      const encryptedComodityTypes = data?.tokenizedAllComodityTypes || "";
      let allComodityTypes = [];
      if (encryptedComodityTypes) {
        const decrypted = jwt.verify(encryptedComodityTypes, TOKENIZE);
        allComodityTypes = decrypted.queryResult;
        setAllComodityTypes(allComodityTypes);
      }
      const encryptedContractStatuses =
        data?.tokenizedAllContractStatuses || "";
      let allContractStatuses = [];
      if (encryptedContractStatuses) {
        const decrypted = jwt.verify(encryptedContractStatuses, TOKENIZE);
        allContractStatuses = decrypted.queryResult;
        setAllContractStatuses(allContractStatuses);
      }
      const encryptedAwardTypes = data?.tokenizedAllAwardTypes || "";
      let allAwardTypes = [];
      if (encryptedAwardTypes) {
        const decrypted = jwt.verify(encryptedAwardTypes, TOKENIZE);
        allAwardTypes = decrypted.queryResult;
        setAllAwardTypes(allAwardTypes);
      }
      const encryptedModernTechnologies =
        data?.tokenizedAllModernTechnologies || "";
      let allModernTechnologies = [];
      if (encryptedModernTechnologies) {
        const decrypted = jwt.verify(encryptedModernTechnologies, TOKENIZE);
        allModernTechnologies = decrypted.queryResult;
        setAllModernTechnologies(allModernTechnologies);
      }
      const countData = data?.countFarmProfilesByFarmer || 0;
      setCountFarmProfileByFarmer(countData);
    }
  }, [data, loading, error, savedCount]);

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: FARM_QUERY_EN,
      variables: {
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedFarmProfilesByFarmer =
      result.data?.tokenizedAllFarmProfilesByFarmer || "";
    const countData = result.data?.countFarmProfilesByFarmer || 0;
    setCountFarmProfileByFarmer(countData);
    let allFarmProfilesByFarmer = [];
    if (encryptedFarmProfilesByFarmer) {
      const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
      allFarmProfilesByFarmer = decrypted.queryResult;
      setAllFarmProfilesByFarmer(allFarmProfilesByFarmer);
    }
    hideLoadingSpinner();
  }, [savedCount, pageSize, pageIndex, router.query.filters]);

  const fethchingFarmer = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_FARMER_PROFILE_BY_COMPANY_REG_NO,
      variables: {
        name: input,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedFarmerProfilesByCompanyRegNo =
      result.data?.searchFarmerProfileByCompanyRegNo || "";
    let allFarmerProfilesByCompanyRegNo = [];
    if (encryptedFarmerProfilesByCompanyRegNo) {
      const decrypted = jwt.verify(
        encryptedFarmerProfilesByCompanyRegNo,
        TOKENIZE
      );
      allFarmerProfilesByCompanyRegNo = decrypted.queryResult;
      setAllFarmerProfilesByCompanyRegNo(allFarmerProfilesByCompanyRegNo);
    }

    callback(allFarmerProfilesByCompanyRegNo);
  };

  const getFarmer = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fethchingFarmer(input, callback);
    }
  };

  const handlePageChange = useCallback(
    async ({ pageIndex, pageSize, filters }) => {
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
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

  // let allFarmProfilesByFarmer = [];
  // const encryptedFarmProfilesByFarmer =
  //   data?.tokenizedAllFarmProfilesByFarmer || "";
  // if (encryptedFarmProfilesByFarmer) {
  //   const decrypted = jwt.verify(encryptedFarmProfilesByFarmer, TOKENIZE);
  //   allFarmProfilesByFarmer = decrypted.queryResult;
  // }

  // let allFarmerProfilesByCompanyRegNo = [];
  // const encryptedFarmerProfilesByCompanyRegNo =
  //   data?.tokenizedAllFarmerProfilesByCompanyRegNo || "";
  // if (encryptedFarmerProfilesByCompanyRegNo) {
  //   const decrypted = jwt.verify(
  //     encryptedFarmerProfilesByCompanyRegNo,
  //     TOKENIZE
  //   );
  //   allFarmerProfilesByCompanyRegNo = decrypted.queryResult;
  // }

  // let allFarmLocations = [];
  // const encryptedFarmLocations = data?.tokenizedAllFarmLocation || "";
  // if (encryptedFarmLocations) {
  //   const decrypted = jwt.verify(encryptedFarmLocations, TOKENIZE);
  //   allFarmLocations = decrypted.queryResult;
  // }

  // let allLandOwnershipStatuses = [];
  // const encryptedLandOwnershipStatuses =
  //   data?.tokenizedAllLandOwnerShipStatues || "";
  // if (encryptedLandOwnershipStatuses) {
  //   const decrypted = jwt.verify(encryptedLandOwnershipStatuses, TOKENIZE);
  //   allLandOwnershipStatuses = decrypted.queryResult;
  // }

  // let allIrigationStatuses = [];
  // const encryptedIrigationStatuses = data?.tokenizedAllIrigationStatus || "";
  // if (encryptedIrigationStatuses) {
  //   const decrypted = jwt.verify(encryptedIrigationStatuses, TOKENIZE);
  //   allIrigationStatuses = decrypted.queryResult;
  // }

  // let allComodityTypes = [];
  // const encryptedComodityTypes = data?.tokenizedAllComodityTypes || "";
  // if (encryptedComodityTypes) {
  //   const decrypted = jwt.verify(encryptedComodityTypes, TOKENIZE);
  //   allComodityTypes = decrypted.queryResult;
  // }

  // let allContractStatuses = [];
  // const encryptedContractStatuses = data?.tokenizedAllContractStatuses || "";
  // if (encryptedContractStatuses) {
  //   const decrypted = jwt.verify(encryptedContractStatuses, TOKENIZE);
  //   allContractStatuses = decrypted.queryResult;
  // }

  // let allAwardTypes = [];
  // const encryptedAwardTypes = data?.tokenizedAllAwardTypes || "";
  // if (encryptedAwardTypes) {
  //   const decrypted = jwt.verify(encryptedAwardTypes, TOKENIZE);
  //   allAwardTypes = decrypted.queryResult;
  // }

  // let allModernTechnologies = [];
  // const encryptedModernTechnologies =
  //   data?.tokenizedAllModernTechnologies || "";
  // if (encryptedModernTechnologies) {
  //   const decrypted = jwt.verify(encryptedModernTechnologies, TOKENIZE);
  //   allModernTechnologies = decrypted.queryResult;
  // }

  const [allMukims, setAllMukims] = useState([]);
  const [allVillages, setAllVilages] = useState([]);
  const [allAreas, setAllAreas] = useState([]);

  useEffect(() => {
    const noOfLabourTotal =
      formData.unskilledLocal +
      formData.semiSkilledLocal +
      formData.expertLocal +
      formData.skilledLocal;

    setFormData({
      ...formData,
      noOfLabourTotal,
    });
  }, [
    formData.unskilledLocal,
    formData.semiSkilledLocal,
    formData.expertLocal,
    formData.skilledLocal,
  ]);

  useEffect(() => {
    const noOfLabourForeigner =
      formData.unskilledForeigner +
      formData.semiSkilledForeigner +
      formData.expertForeigner +
      formData.skilledForeigner;

    setFormData({
      ...formData,
      noOfLabourForeigner,
    });
  }, [
    formData.unskilledForeigner,
    formData.semiSkilledForeigner,
    formData.expertForeigner,
    formData.skilledForeigner,
  ]);
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
                const found = allFarmLocations.find(
                  (c) =>
                    c.district.toUpperCase() ===
                    propsTable.row.original.farmDistrict.toUpperCase()
                );

                let allMukims = allFarmLocations.filter(
                  (loc) =>
                    loc.district.toUpperCase() === found.district.toUpperCase()
                );
                allMukims = lodash.uniqBy(allMukims, "mukim");

                setAllMukims(allMukims);

                let allVillages = allFarmLocations.filter(
                  (loc) =>
                    loc.district.toUpperCase() ===
                      found.district.toUpperCase() &&
                    loc.mukim.toUpperCase() ===
                      propsTable.row.original.farmMukim.toUpperCase()
                );
                allVillages = lodash.uniqBy(allVillages, "village");
                setAllVilages(allVillages);

                let allAreas = allFarmLocations.filter(
                  (loc) =>
                    loc.district.toUpperCase() ===
                      found.district.toUpperCase() &&
                    loc.mukim.toUpperCase() ===
                      propsTable.row.original.farmMukim.toUpperCase() &&
                    loc.village.toUpperCase() ===
                      propsTable.row.original.farmVillage.toUpperCase()
                );
                // console.log({
                //   district: found.district,
                //   mukim: propsTable.row.original.farmMukim,
                //   village: propsTable.row.original.farmVillage,
                //   allAreas
                // })
                allAreas = lodash.uniqBy(allAreas, "area");

                setAllAreas(allAreas);

                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                  addresses: propsTable.row.original?.addresses || [],
                  FarmerProfile: {
                    farmerCompanyName:
                      propsTable.row.original.farmerCompanyName || "",
                    companyId: propsTable.row.original.farmerCompanyId || "",
                    uuid: propsTable.row.original.farmerUUID || "",
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
      Header: "Farm ID",
      accessor: "farmId",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Company Name",
      accessor: "farmerCompanyName",
      style: {
        fontSize: 20,
        width: 200,
      },
    },
    {
      Header: "Farmer Name",
      accessor: "farmerName",
      style: {
        fontSize: 20,
        width: 200,
      },
    },
    {
      Header: "Farm Area",
      accessor: "farmArea",
      style: {
        fontSize: 20,
        width: 200,
      },
    },
    {
      Header: "Farm Address",
      accessor: "address",
      style: {
        fontSize: 20,
        width: 200,
      },
      disableFilters: true,
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Farm Size (Ha)",
      accessor: "farmSize",
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
      Header: "Mukim",
      accessor: "farmMukim",
      style: {
        fontSize: 20,
        width: 200,
      },
    },

    // {
    //   Header: "Plantable Area",
    //   accessor: "plantableArea",
    //   style: {
    //     fontSize: 20,
    //     width: 200,
    //   },
    //   disableFilters: true,
    //   Cell: (props) => (
    //     <span>
    //       {Number(props.value)
    //         .toLocaleString("en-GB")
    //         .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
    //     </span>
    //   ),
    // },
  ]);

  const locationColumns = useMemo(() => [
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
            onClick={(e) => {
              if (e) e.preventDefault();

              const found = allFarmLocations.find(
                (c) => c.uuid === props.row.original.uuid
              );

              let PREFIX = "";
              if (found.district.toUpperCase() === "BELAIT") {
                PREFIX = "BL0000";
              } else if (found.district.toUpperCase() === "BRUNEI MUARA") {
                PREFIX = "BM0000";
              } else if (found.district.toUpperCase() === "TUTONG") {
                PREFIX = "TT0000";
              } else if (found.district.toUpperCase() === "TEMBURONG") {
                PREFIX = "TM0000";
              }

              setFormData({
                ...formData,
                farmLocationUUID: props.row.original.uuid,
                farmDistrict: props.row.original.district,
                farmMukim: props.row.original.mukim,
                farmVillage: props.row.original.village,
                farmArea: props.row.original.area,
                PREFIX,
              });
              setLocationModalVisible(false);
              setModalVisible(true);
            }}
          >
            Select Location
          </button>
        );
      },
    },
    {
      Header: "ID",
      accessor: "id",
      style: {
        fontSize: 20,
        width: 100,
      },
    },
    {
      Header: "District",
      accessor: "district",
      style: {
        fontSize: 20,
        width: 150,
      },
    },
    {
      Header: "Mukim",
      accessor: "mukim",
      style: {
        fontSize: 20,
        width: 150,
      },
    },
    {
      Header: "Village",
      accessor: "village",
      style: {
        fontSize: 20,
        width: 150,
      },
    },
    {
      Header: "Farm Area",
      accessor: "area",
      style: {
        fontSize: 20,
        width: 150,
      },
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Farm Profiling Crops</title>
      </Head>

      <FormModal
        title={"Select Location"}
        size={"xl"}
        visible={locationModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setLocationModalVisible(false);
          setModalVisible(true);
        }}
      >
        <Table
          columns={locationColumns}
          data={allFarmLocations}
          withoutHeader={true}
        />
      </FormModal>

      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Farm Profiling Crops`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            typeOfComodityId: [],
            addresses: [],

            unskilledLocal: 0,
            semiSkilledLocal: 0,
            expertLocal: 0,
            skilledLocal: 0,

            unskilledForeigner: 0,
            semiSkilledForeigner: 0,
            expertForeigner: 0,
            skilledForeigner: 0,
          });
        }}
        size={"md"}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          try {
            let { uuid, id, __typename, ...data } = formData;
            if (!formData.farmerUUID) {
              throw new Error(
                '"Company Name" is required. Please fill in this field.'
              );
            }
            if (!uuid) {
              const tokenizedPayload = {
                formData,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await createFarmProfile({
                variables: {
                  input: {
                    // ...formData,
                    tokenized,
                  },
                },
              });
            } else {
              const tokenizedPayload = {
                uuid,
                ...data,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await updateFarmProfile({
                variables: {
                  // uuid,
                  input: {
                    // ...data,
                    tokenized,
                  },
                },
              });
            }
            await refetch();
            setSavedCount((savedCount += 1));
            notification.addNotification({
              title: "Succeess!",
              message: `Farm Profiling Crops saved!`,
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
          <label>Farm ID</label>
          <input
            disabled
            placeholder="Will generate after saved"
            className="form-control"
            value={formData.farmId || ""}
          />
        </div>

        <div className="form-group">
          <p>
            <label>Company Name*</label>
          </p>

          <AsyncSelect
            value={formData.FarmerProfile}
            loadOptions={getFarmer}
            className={`form-control  w-full`}
            classNamePrefix="select"
            getOptionLabel={(option) =>
              `${option.farmerCompanyName} - ${option.companyId}`
            }
            getOptionValue={(option) => option.uuid}
            autoFocus={true}
            onChange={async (selectedValues) => {
              const found = allFarmerProfilesByCompanyRegNo.find(
                (profile) => profile.uuid === selectedValues.uuid
              );

              setFormData({
                ...formData,
                farmerCompanyId: found.companyId,
                farmerUUID: found.uuid,
                farmerCompanyName: found.farmerCompanyName,

                FarmerProfile: {
                  companyId: found.companyId,
                  uuid: found.uuid,
                  farmerCompanyName: found.farmerCompanyName,
                },
              });

              // setSelectedCompany([
              //   {
              //     value: found.uuid,
              //     label: found.farmerCompanyName,
              //   },
              // ]);
              // setSelectedFarmArea([{ value: "", label: "" }]);
            }}
          />

          {/* <select
            className="form-control"
            value={formData.farmerUUID || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allFarmerProfilesByCompanyRegNo.find(
                (c) => c.uuid === e.target.value
              );
              setFormData({
                ...formData,
                farmerCompanyId: found.companyId,
                farmerUUID: found.uuid,
                farmerCompanyName: found.farmerCompanyName,
              });
            }}
            
          >
            <option value={""} disabled>
              Select Company Name
            </option>

            {allFarmerProfilesByCompanyRegNo.map((farm) => (
              <option value={farm.uuid}>{farm.farmerCompanyName}</option>
            ))}
          </select> */}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="form-group">
              <label>Company ID</label>
              <input
                className="form-control bg-gray-200"
                value={formData.farmerCompanyId || ""}
                disabled
              />
            </div>
          </div>
          <div>
            <div className="form-group">
              <label>OCBS Reference No*</label>
              <input
                required
                className="form-control"
                value={formData.ocbsRefNo || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    ocbsRefNo: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Partner / Investor*</label>
          <input
            required
            className="form-control"
            value={formData.partnerInvestor || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                partnerInvestor: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Farmer Name*</label>
          <input
            required
            className="form-control"
            value={formData.farmerName || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                farmerName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>

        <div className="form-group">
          <p>
            <label>Other Farmer Name*</label>
          </p>
          <p className="text-xs italic">
            (for more than 1 Farmer Name, use "/" between the Farmer Name)
          </p>
          <textarea
            required
            className="form-control"
            value={formData.otherFarmerName || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                otherFarmerName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="form-group">
              <p>
                <label>District*</label>
              </p>
              <input
                className="form-control"
                value={formData.farmDistrict || ""}
                disabled
              />
            </div>
            <div className="form-group">
              <p>
                <label>Village*</label>
              </p>
              <input
                className="form-control"
                value={formData.farmVillage || ""}
                disabled
              />
            </div>
          </div>
          <div>
            {" "}
            <div className="form-group">
              <p>
                <label>Mukim*</label>
              </p>

              <input
                className="form-control"
                value={formData.farmMukim || ""}
                disabled
              />
            </div>
            <div className="form-group">
              <p>
                <label>Farm Area*</label>
              </p>
              <input
                className="form-control"
                value={formData.farmArea || ""}
                disabled
              />
            </div>
          </div>
        </div>

        <button
          className="bg-purple-500 col-span-3 rounded-md text-white py-2 px-3 shadow-md w-full"
          onClick={async (e) => {
            if (e) e.preventDefault();
            setLocationModalVisible(true);
            setModalVisible(false);
          }}
        >
          <i className="fa fa-search" /> Select and Search
        </button>

        <hr />
        <div className="flex justify-end mb-4">
          <button
            className="bg-mantis-500 text-sm text-white font-bold px-2 py-2 rounded-md shadow-md"
            onClick={(e) => {
              if (e) e.preventDefault();
              try {
                if (formData.addresses.length == 0) {
                  setFormData({
                    ...formData,
                    addresses: [
                      ...formData.addresses,
                      {
                        uuid: uuidv4(),
                        address: "",
                      },
                    ],
                  });
                } else {
                  throw {
                    message: "Only 1 address allowed",
                  };
                }
              } catch (err) {
                notification.handleError(err);
              }
            }}
          >
            <i className="fa fa-plus" /> Add Address
          </button>
        </div>

        {formData.addresses.map((addr, idx) => (
          <div className="grid grid-cols-5 gap-2 mb-2 items-center">
            <div className="col-span-4">
              <label>Address</label>
              <textarea
                className="form-control"
                placeholder={`Address`}
                value={addr.address || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    addresses: formData.addresses.map((ad) =>
                      ad.uuid !== addr.uuid
                        ? ad
                        : {
                            ...addr,
                            address: e.target.value.toUpperCase(),
                          }
                    ),
                    // otherFarmerName: e.target.value,
                  });
                }}
              />
            </div>
            <div>
              <button
                className="bg-red-500 rounded-md px-2.5 py-1 text-white shadow-md"
                onClick={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    addresses: formData.addresses.filter(
                      (re) => re.uuid !== addr.uuid
                    ),
                  });
                }}
              >
                <p className="text-sm">
                  <i className="fa fa-times" />
                </p>
              </button>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            {/* <div className="form-group">
              <label>Farm Address*</label>

              <textarea
                
                className="form-control"
                value={formData.address || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    address: e.target.value,
                  });
                }}
              />
            </div> */}

            <div className="form-group">
              <label>Land Approval Date*</label>

              <input
                required
                className="form-control"
                type="date"
                value={formData.landApprovalDate || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    landApprovalDate: e.target.value,
                  });
                }}
              />
            </div>

            <div className="form-group">
              <p>
                <label>Contract Status*</label>
              </p>

              <select
                required
                className="form-control"
                value={formData.contractStatusUUID || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();

                  const found = allContractStatuses.find(
                    (c) => c.uuid === e.target.value
                  );
                  setFormData({
                    ...formData,
                    contractStatusUUID: found.uuid,
                    contractStatusName: found.status,
                  });
                }}
              >
                <option value={""} disabled>
                  Select Contract Status
                </option>

                {allContractStatuses.map((stat) => (
                  <option value={stat.uuid}>{stat.status.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Farming Start Date*</label>
              <input
                required
                type="date"
                className="form-control"
                value={formData.farmingStartDate || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    farmingStartDate: e.target.value,
                  });
                }}
              />
            </div>

            <div className="form-group">
              <label>Plantable Area (Ha)</label>
              <NumberFormat
                className="form-control"
                value={formData.plantableArea || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    plantableArea: e.floatValue || 0,
                  });
                }}
              />
            </div>
          </div>

          <div>
            <div className="form-group">
              <p>
                <label>Farm Category*</label>
              </p>
              <select
                required
                className="form-control"
                value={formData.farmCategory || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    farmCategory: e.target.value,
                  });
                }}
              >
                <option value={""} disabled>
                  Select Category
                </option>
                <option value={"AGRICULTURAL DEVELOPMENT AREA"}>
                  1. ADA (AGRICULTURAL DEVELOPMENT AREA)
                </option>
                <option value={"RURAL AGRICULTURAL DEVELOPMENT AREA"}>
                  2. RADA (RURAL AGRICULTURAL DEVELOPMENT AREA)
                </option>
                <option value={"EXISTING AREA COMMERCIAL"}>
                  3. EXISTING AREA (COMMERCIAL)
                </option>
                <option value={"EXISTING AREA"}>
                  4. EXISTING AREA (NON-COMMERCIAL)
                </option>
                <option value={"EXISTING AREA UNREGISTERED FARMER"}>
                  5. EXISTING AREA (NON-COMMERCIAL) - UNREGISTERED FARMER
                </option>
                <option value={"YOUNG FARMER AREA"}>
                  6. YOUNG FARMER AREA
                </option>
              </select>
            </div>

            <div className="form-group">
              <p>
                <label>Land Ownership Status*</label>
              </p>

              <select
                required
                className="form-control"
                value={formData.ownerShipStatusUUID || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();

                  const found = allLandOwnershipStatuses.find(
                    (c) => c.uuid === e.target.value
                  );
                  setFormData({
                    ...formData,
                    ownerShipStatusUUID: found.uuid,
                    ownerShipStatusName: found.status,
                  });
                }}
              >
                <option value={""} disabled>
                  Select Land Ownership Status
                </option>

                {allLandOwnershipStatuses.map((owner) => (
                  <option value={owner.uuid}>
                    {owner.status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Land Contract Expiry*</label>
              <input
                required
                type="date"
                className="form-control"
                value={formData.expiryDate || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    expiryDate: e.target.value,
                  });
                }}
              />
            </div>

            <div className="form-group">
              <label>Farm Size (Ha)*</label>
              <NumberFormat
                required
                className="form-control"
                value={formData.farmSize || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    farmSize: e.floatValue || 0,
                  });
                }}
              />
            </div>

            <div className="form-group">
              <p>
                <label>Irrigation Status</label>
              </p>

              <select
                className="form-control"
                value={formData.irigationStatusUUID || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();

                  const found = allIrigationStatuses.find(
                    (c) => c.uuid === e.target.value
                  );
                  setFormData({
                    ...formData,
                    irigationStatusUUID: found.uuid,
                    irigationStatusName: found.status,
                  });
                }}
              >
                <option value={""} disabled>
                  Select Status
                </option>

                {allIrigationStatuses.map((stat) => (
                  <option value={stat.uuid}>{stat.status.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-200 px-4 py-2">
          <b>Type of Commodity</b>{" "}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {allComodityTypes.map((comodity) => {
            let isChecked = false;

            const foundIndex = formData.typeOfComodityId.findIndex(
              (idx) => idx === comodity.uuid
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
                        typeOfComodityId: [
                          ...formData.typeOfComodityId,
                          comodity.uuid,
                        ],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        typeOfComodityId: formData.typeOfComodityId.filter(
                          (p) => p !== comodity.uuid
                        ),
                      });
                    }
                  }}
                />
                <label>{comodity.comodityType.toUpperCase()}</label>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="form-group">
              <label>Type Of Award*</label>
              <select
                required
                className="form-control"
                value={formData.awardTypeId || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  const found = allAwardTypes.find(
                    (c) => c.uuid === e.target.value
                  );
                  setFormData({
                    ...formData,
                    awardTypeId: found.uuid,
                    awardTypeName: found.award,
                  });
                }}
              >
                <option value={""} disabled>
                  Select Type of Award
                </option>
                {allAwardTypes.map((awd) => (
                  <option value={awd.uuid}>{awd.award.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date of Operation*</label>
              <input
                required
                type="date"
                className="form-control"
                value={formData.operationDate || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    operationDate: e.target.value,
                  });
                }}
              />
            </div>
            {/* <div className="form-group">
              <label>Type of Offers*</label>
              <select
                className="form-control"
                value={formData.offersTypes || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    offersTypes: e.target.value,
                  });
                }}
                
              >
                <option value={""} disabled>
                  Select Offer
                </option>

                <option value={"Projek Rintis"}>1. Projek Rintis</option>
                <option value={"Program Pembesaran Kawasan"}>
                  2. Program Pembesaran Kawasan
                </option>
                <option value={"Iklan"}>3. Iklan</option>
                <option value={"RFP"}>4. RFP</option>
                <option value={"LTS"}>5. LTS</option>
                <option value={"KPLB"}>6. KPLB</option>
                <option value={"Tambahan"}>7. Tambahan</option>
                <option value={"Lain-Lain"}>8. Lain-Lain</option>
              </select>
            </div> */}
          </div>

          <div>
            <div className="form-group">
              <label>Modern Technology Usage</label>
              <select
                className="form-control"
                value={formData.modernTechnology || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    modernTechnology: e.target.value,
                  });
                }}
              >
                <option value={""} disabled>
                  Select Modern Technology
                </option>
                {allModernTechnologies.map((tech) => (
                  <option value={tech.uuid}>{tech.name.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Company Terms</label>
              <input
                value={formData.companyTerms || ""}
                className="form-control"
                placeholder="Company Terms"
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    companyTerms: e.target.value.toUpperCase(),
                  });
                }}
              />
              {/* <select
                className="form-control"
                value={formData.companyTerms || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    companyTerms: e.target.value,
                  });
                }}
              >
                <option value={""} disabled>
                  Select Company Terms
                </option>
                <option value={"Crop Fruit"}>1. Crop: Fruit</option>
                <option value={"Crop Vegetable"}>2. Crop: Vegetable</option>
                <option value={"Crop Miscellaneous Crop"}>
                  3. Crop: Miscellaneous Crop
                </option>
                <option value={"Crop Floriculture"}>
                  4. Crop: Floriculture
                </option>
                <option value={"Livestock Broiler"}>
                  5. Livestock: Broiler
                </option>
                <option value={"Livestock Table Eggs"}>
                  6. Livestock: Table Eggs
                </option>
              </select> */}
            </div>
          </div>
        </div>

        <div className="form-group mt-2">
          <label>Marketing Area</label>
          <input
            className="form-control"
            value={formData.marketingAreas || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                marketingAreas: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Remarks</label>
          <textarea
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

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="form-group">
              <div className="flex mb-1">
                <p className="text-md mr-2">Unskilled Local</p>
                <Tooltip
                  content={
                    <ul className="list-disc">
                      <li>•BTEC Level Introductory Certificate</li>
                      <li>•Sijil Kemahiran 1(SC1)</li>
                    </ul>
                  }
                  size={80}
                >
                  <p className="fa fa-info-circle" />
                </Tooltip>
              </div>

              <NumberFormat
                className="form-control"
                value={formData.unskilledLocal || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    unskilledLocal: e.floatValue || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <div className="flex mb-1">
                <p className="text-md mr-2">Semi Skilled Local</p>
                <Tooltip
                  content={
                    <div>
                      <ul className="list-disc mb-2">
                        <li>•GCE "A" Level</li>
                        <li>•IGCSE "A" Level</li>
                        <li>•IB Diploma</li>
                        <li>•STPU Diploma</li>
                        <li>
                          •Sijil Tinggi Pendidikan Teknikal Kebangsaan(HNTEC)
                        </li>
                      </ul>
                      <ul className="list-disc mb-2">
                        <li>•GCE “O” Level (GredA–C)</li>
                        <li>•IGCSE and GCSE “O” Level (GredA* -C)</li>
                        <li>•SPU (GredA-C)</li>
                        <li>•BTEC Level 2 Diploma</li>
                        <li>•Sijil Kemahiran 3 (SC3)</li>
                        <li>•Sijil Pendidikan Teknikal Kebangsaan(NTEC)</li>
                      </ul>
                      <ul className="list-disc mb-2">
                        <li>•GCE “O” Level (GredD-E)</li>
                        <li>•IGCSE “O” Level (GredD-E)</li>
                        <li>•SPU (GredD)</li>
                        <li>•BTEC Level 2 Extended Certificate</li>
                        <li>•Sijil Kemahiran 2 (SC2)</li>
                        <li>•Kelayakan Kemahiran Industri(ISQ)</li>
                      </ul>
                    </div>
                  }
                  size={80}
                >
                  <p className="fa fa-info-circle" />
                </Tooltip>
              </div>
              <NumberFormat
                className="form-control"
                value={formData.semiSkilledLocal || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    semiSkilledLocal: e.floatValue || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <div className="flex mb-1">
                <p className="text-md mr-2">Skilled Local</p>
                <Tooltip
                  content={
                    <div>
                      <ul className="list-disc mb-2">
                        <li>•Ijazah SarjanaMuda</li>
                        <li>•Diploma Lanjutan</li>
                        <li>•Diploma KebangsaanTinggi (HND)</li>
                        <li>•Ijazah Asas</li>
                      </ul>
                    </div>
                  }
                  size={80}
                >
                  <p className="fa fa-info-circle" />
                </Tooltip>
              </div>
              <NumberFormat
                className="form-control"
                value={formData.skilledLocal || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    skilledLocal: e.floatValue || 0,
                  });
                }}
              />
            </div>

            <div className="form-group">
              <div className="flex mb-1">
                <p className="text-md mr-2">Expert Local</p>
                <Tooltip
                  content={
                    <div>
                      <ul className="list-disc mb-2">
                        <li>•Ijazah Kedoktoran</li>
                        <li>•Ijazah Sarjana</li>
                        <li>•Diploma Lepasan Ijazah</li>
                        <li>•Sijil Lepasan Ijazah</li>
                        <li>•Ijazah Sarjana Muda + Kelayakan Profesional</li>
                      </ul>
                    </div>
                  }
                  size={80}
                >
                  <p className="fa fa-info-circle" />
                </Tooltip>
              </div>
              <NumberFormat
                className="form-control"
                value={formData.expertLocal || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    expertLocal: e.floatValue || 0,
                  });
                }}
              />
            </div>

            <div className="form-group">
              <label>Total No. of Local Labour</label>
              <NumberFormat
                className="form-control"
                value={formData.noOfLabourTotal || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    noOfLabourTotal: e.floatValue || 0,
                  });
                }}
              />
            </div>
          </div>
          <div>
            <div className="form-group">
              <label>Unskilled Foreigner</label>
              <NumberFormat
                className="form-control"
                value={formData.unskilledForeigner || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    unskilledForeigner: e.floatValue || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Semi Skilled Foreigner</label>
              <NumberFormat
                className="form-control"
                value={formData.semiSkilledForeigner || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    semiSkilledForeigner: e.floatValue || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Skilled Foreigner</label>
              <NumberFormat
                className="form-control"
                value={formData.skilledForeigner || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    skilledForeigner: e.floatValue || 0,
                  });
                }}
              />
            </div>

            <div className="form-group">
              <label>Expert Foreigner</label>
              <NumberFormat
                className="form-control"
                value={formData.expertForeigner || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    expertForeigner: e.floatValue || 0,
                  });
                }}
              />
            </div>

            <div className="form-group">
              <label>Total No. of Foreigner Labour</label>
              <NumberFormat
                className="form-control"
                value={formData.noOfLabourForeigner || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    noOfLabourForeigner: e.floatValue || 0,
                  });
                }}
              />
            </div>
          </div>
        </div>
      </FormModal>

      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allFarmProfilesByFarmer}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          customHeaderUtilities={
            !currentUserDontHavePrivilege([
              "Farm Profiling Crops Export Excel:Create",
            ]) ? (
              <div className="flex mx-2 items-end">
                <button
                  className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                  onClick={async (e) => {
                    if (e) e.preventDefault();
                    showLoadingSpinner();
                    try {
                      const response = await exportFarmProfile();

                      downloadExcelFromBuffer(
                        response.data.exportFarmProfile.data,
                        "farm-profile-crops"
                      );
                      // window.open(response.data.exportFarmProfile, "__blank");
                    } catch (err) {
                      notification.handleError(err);
                    }
                    hideLoadingSpinner();
                  }}
                >
                  Export Excel
                </button>
              </div>
            ) : (
              <div />
            )
          }
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege(["Farm Profiling Crops:Create"])
              ? async (e) => {
                  if (e) e.preventDefault();
                  showLoadingSpinner();

                  try {
                    // const found = await client.query({
                    //   query: GET_COUNT_FARM_PROFILE,
                    //   variables: {},
                    //   fetchPolicy: "no-cache",
                    // });

                    // const count = found.data.countFarmProfile;

                    // let startCode = "BM0000";

                    // const dataLength = "" + count;
                    // startCode =
                    //   startCode.slice(0, dataLength * -1) + (count + 1);

                    setModalVisible(true);
                    setFormData({
                      typeOfComodityId: [],
                      addresses: [],
                      unskilledLocal: 0,
                      semiSkilledLocal: 0,
                      expertLocal: 0,
                      skilledLocal: 0,

                      unskilledForeigner: 0,
                      semiSkilledForeigner: 0,
                      expertForeigner: 0,
                      skilledForeigner: 0,
                      farmId: "",
                    });
                  } catch (err) {
                    notification.handleError(err);
                  }

                  hideLoadingSpinner();
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Farm Profiling Crops:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} farm locations?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteFarmProfile({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} farm locations deleted`,
                        level: "success",
                      });
                      await refetch();
                      setSavedCount((savedCount += 1));
                    }
                  } catch (err) {
                    handleError(err);
                  }
                  hideLoadingSpinner();
                }
              : null
          }
          customUtilities={
            !currentUserDontHavePrivilege(["Farm Profiling Crops:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(FarmProfile);
