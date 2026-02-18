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
import lodash from "lodash";

import Head from "next/dist/next-server/lib/head";

import NumberFormat from "react-number-format";
import Tooltip from "../../components/Tooltip";
import Select from "react-select";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";

const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query allAgrifoodPremiseProfiles($filters: String) {
    tokenizedAllAgrifoodCompanyProfiles

    tokenizedAllFarmLocation

    tokenizedAllContractStatuses

    tokenizedAllAwardTypes

    tokenizedAllAgrifoodProductSubCategories

    tokenizedAllAgrifoodProductCategories

    tokenizedAllMachineries
    countAgrifoodPremiseProfiles(filters: $filters)
  }
`;

const PAGINATED_QUERY = gql`
  query paginatedQuery($pageIndex: Int, $pageSize: Int, $filters: String) {
    tokenizedAllAgrifoodPremiseProfilesPaginated(
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAgrifoodPremiseProfiles(filters: $filters)
  }
`;

const CREATE_PREMISE_PROFILE = gql`
  mutation tokenizedCreateAgrifoodPremiseProfile($input: JSON) {
    tokenizedCreateAgrifoodPremiseProfile(input: $input)
  }
`;

const UPDATE_PREMISE_PROFILE = gql`
  mutation tokenizedUpdateAgrifoodPremiseProfile($input: JSON) {
    tokenizedUpdateAgrifoodPremiseProfile(input: $input)
  }
`;

const DELETE_PREMISE_PROFILE = gql`
  mutation tokenizedDeleteAgrifoodPremiseProfile($tokenized: String!) {
    tokenizedDeleteAgrifoodPremiseProfile(tokenized: $tokenized)
  }
`;

const EXPORT_PREMISE_PROFILE = gql`
  mutation exportPremiseProfile {
    exportPremiseProfile
  }
`;

const page = () => {
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const client = useApolloClient();
  const defaultState = () => {
    return {
      agrifoodProductCategoryIds: [],
      agrifoodProductSubCategoryIds: [],
      machineryIds: [],

      unskilledLocal: 0,
      semiSkilledLocal: 0,
      expertLocal: 0,
      skilledLocal: 0,

      unskilledForeigner: 0,
      semiSkilledForeigner: 0,
      expertForeigner: 0,
      skilledForeigner: 0,

      landSize: 0,
      factorySize: 0,
    };
  };

  const [formData, setFormData] = useState(defaultState());
  const [selectedCompany, setSelectedCompany] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const [allMukims, setAllMukims] = useState([]);
  const [allVillages, setAllVilages] = useState([]);
  const [allAreas, setAllAreas] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createAgrifoodPremiseProfile] = useMutation(CREATE_PREMISE_PROFILE);
  const [updateAgrifoodPremiseProfile] = useMutation(UPDATE_PREMISE_PROFILE);
  const [deleteAgrifoodPremiseProfile] = useMutation(DELETE_PREMISE_PROFILE);
  const [exportPremiseProfile] = useMutation(EXPORT_PREMISE_PROFILE);

  const [allAgrifoodPremiseProfiles, setAllAgrifoodPremiseProfiles] = useState(
    []
  );
  const [allFarmLocations, setAllFarmLocations] = useState([]);
  const [allContractStatuses, setAllContractStatus] = useState([]);
  const [allAwardTypes, setAllAwardTypes] = useState([]);
  const [allMachineries, setAllMachineries] = useState([]);
  const [allAgrifoodProductSubCategories, setAllAgrifoodProductSubCategories] =
    useState([]);
  const [allAgrifoodProductCategories, setAllAgrifoodProductCategories] =
    useState([]);
  const [allAgrifoodCompanyProfiles, setAllAgrifoodCompanyProfiles] = useState(
    []
  );
  let [savedCount, setSavedCount] = useState(0);

  let [countAgrifoodPremiseProfiles, setCountAgrifoodPremiseProfiles] =
    useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;

  let pageCount = useMemo(() => {
    if (!countAgrifoodPremiseProfiles) return 1;
    return Math.ceil(countAgrifoodPremiseProfiles / pageSize);
  }, [countAgrifoodPremiseProfiles, pageSize]);

  useEffect(() => {
    if (!error && !loading) {
      const encryptedAgrifoodCompanyProfiles =
        data?.tokenizedAllAgrifoodCompanyProfiles || "";
      if (encryptedAgrifoodCompanyProfiles) {
        const decrypted = jwt.verify(
          encryptedAgrifoodCompanyProfiles,
          TOKENIZE
        );
        const allAgrifoodCompanyProfiles = decrypted.queryResult;
        setAllAgrifoodCompanyProfiles(allAgrifoodCompanyProfiles);
      }

      // const encryptedAgrifoodPremiseProfiles =
      //   data?.tokenizedAllAgrifoodPremiseProfiles || "";
      // if (encryptedAgrifoodPremiseProfiles) {
      //   const decrypted = jwt.verify(
      //     encryptedAgrifoodPremiseProfiles,
      //     TOKENIZE
      //   );
      //   const allAgrifoodPremiseProfiles = decrypted.queryResult;
      //   setAllAgrifoodPremiseProfiles(allAgrifoodPremiseProfiles);
      // }

      const encryptedFarmLocations = data?.tokenizedAllFarmLocation || "";
      if (encryptedFarmLocations) {
        const decrypted = jwt.verify(encryptedFarmLocations, TOKENIZE);
        const allFarmLocations = decrypted.queryResult;
        setAllFarmLocations(allFarmLocations);
      }

      const encryptedContractStatuses =
        data?.tokenizedAllContractStatuses || "";
      if (encryptedContractStatuses) {
        const decrypted = jwt.verify(encryptedContractStatuses, TOKENIZE);
        const allContractStatuses = decrypted.queryResult;
        setAllContractStatus(allContractStatuses);
      }

      // let allAwardTypes = [];
      const encryptedAwardTypes = data?.tokenizedAllAwardTypes || "";
      if (encryptedAwardTypes) {
        const decrypted = jwt.verify(encryptedAwardTypes, TOKENIZE);
        const allAwardTypes = decrypted.queryResult;
        setAllAwardTypes(allAwardTypes);
      }

      // let allMachineries = [];
      const encryptedMachineries = data?.tokenizedAllMachineries || "";
      if (encryptedMachineries) {
        const decrypted = jwt.verify(encryptedMachineries, TOKENIZE);
        const allMachineries = decrypted.queryResult;
        setAllMachineries(allMachineries);
      }

      // let allAgrifoodProductSubCategories = [];
      const encryptedAgrifoodProductSubCategories =
        data?.tokenizedAllAgrifoodProductSubCategories || "";
      if (encryptedAgrifoodProductSubCategories) {
        const decrypted = jwt.verify(
          encryptedAgrifoodProductSubCategories,
          TOKENIZE
        );
        const allAgrifoodProductSubCategories = decrypted.queryResult;
        setAllAgrifoodProductSubCategories(allAgrifoodProductSubCategories);
      }

      // let allAgrifoodProductCategories = [];
      const encryptedAgrifoodProductCategories =
        data?.tokenizedAllAgrifoodProductCategories || "";
      if (encryptedAgrifoodProductCategories) {
        const decrypted = jwt.verify(
          encryptedAgrifoodProductCategories,
          TOKENIZE
        );
        const allAgrifoodProductCategories = decrypted.queryResult;
        setAllAgrifoodProductCategories(allAgrifoodProductCategories);
      }

      const countData = data?.countAgrifoodPremiseProfiles || 0;
      setCountAgrifoodPremiseProfiles(countData);
    }
  }, [data, error, loading, savedCount]);

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: PAGINATED_QUERY,
      variables: {
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedAgrifoodPremiseProfiles =
      result.data?.tokenizedAllAgrifoodPremiseProfilesPaginated || "";
    if (encryptedAgrifoodPremiseProfiles) {
      const decrypted = jwt.verify(encryptedAgrifoodPremiseProfiles, TOKENIZE);
      const allAgrifoodPremiseProfiles = decrypted.queryResult;
      setAllAgrifoodPremiseProfiles(allAgrifoodPremiseProfiles);
    }

    const countData = result.data?.countAgrifoodPremiseProfiles || 0;
    setCountAgrifoodPremiseProfiles(countData);
    hideLoadingSpinner();
  }, [savedCount, pageSize, pageIndex, router.query.filters]);

  const handlePageChange = useCallback(
    async ({ pageIndex, pageSize, filters }) => {
      // const ym = router.query.yearMonth || dayjs().format("YYYY-MM");

      // let changedPageIndex = pageIndex;
      // if (filterState !== JSON.stringify(filters)) {
      //   if (filters.length > 0) {
      //     changedPageIndex = 0;
      //   }
      // } else {
      //   changedPageIndex = pageIndex;
      // }

      // console.log({ filterState, filters: JSON.stringify(filters) });

      // setFilterState(JSON.stringify(filters));

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
    if (!router.query.filters) return [];
    try {
      let filters = JSON.parse(router.query.filters);
      return filters;
    } catch (err) {
      console.warn(err);
    }
    return [];
  }, [router.query.filters]);

  // let allAgrifoodPremiseProfiles = [];

  // let allAgrifoodCompanyProfiles = [];
  // const encryptedAgrifoodCompanyProfiles =
  //   data?.tokenizedAllAgrifoodCompanyProfiles || "";
  // if (encryptedAgrifoodCompanyProfiles) {
  //   const decrypted = jwt.verify(encryptedAgrifoodCompanyProfiles, TOKENIZE);
  //   allAgrifoodCompanyProfiles = decrypted.queryResult;
  // }

  // let allFarmLocations = [];
  // const encryptedFarmLocations = data?.tokenizedAllFarmLocation || "";
  // if (encryptedFarmLocations) {
  //   const decrypted = jwt.verify(encryptedFarmLocations, TOKENIZE);
  //   allFarmLocations = decrypted.queryResult;
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

  // let allMachineries = [];
  // const encryptedMachineries = data?.tokenizedAllMachineries || "";
  // if (encryptedMachineries) {
  //   const decrypted = jwt.verify(encryptedMachineries, TOKENIZE);
  //   allMachineries = decrypted.queryResult;
  // }

  // let allAgrifoodProductSubCategories = [];
  // const encryptedAgrifoodProductSubCategories =
  //   data?.tokenizedAllAgrifoodProductSubCategories || "";
  // if (encryptedAgrifoodProductSubCategories) {
  //   const decrypted = jwt.verify(
  //     encryptedAgrifoodProductSubCategories,
  //     TOKENIZE
  //   );
  //   allAgrifoodProductSubCategories = decrypted.queryResult;
  // }

  // let allAgrifoodProductCategories = [];
  // const encryptedAgrifoodProductCategories =
  //   data?.tokenizedAllAgrifoodProductCategories || "";
  // if (encryptedAgrifoodProductCategories) {
  //   const decrypted = jwt.verify(encryptedAgrifoodProductCategories, TOKENIZE);
  //   allAgrifoodProductCategories = decrypted.queryResult;
  // }
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

  useEffect(() => {
    const location = allFarmLocations;

    const allAreas = location.filter(
      (loc) =>
        loc.district === formData.farmDistrict &&
        loc.mukim === formData.farmMukim &&
        loc.village === formData.farmVillage
    );

    setAllAreas(allAreas);

    if (formData.farmArea) {
      const exactLocation = location.filter(
        (loc) =>
          loc.district === formData.farmDistrict &&
          loc.mukim === formData.farmMukim &&
          loc.village === formData.farmVillage &&
          loc.area === formData.farmArea
      );

      setFormData({
        ...formData,
        farmLocationUUID: exactLocation[0].uuid,
      });
    }
  }, [
    formData.farmDistrict,
    formData.farmVillage,
    formData.farmMukim,
    formData.farmArea,
  ]);
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
                if (e) e.preventDefault();

                const foundCompanyProfile = allAgrifoodCompanyProfiles.find(
                  (c) => c.uuid === props.row.original.companyUUID
                );

                let allMukims = allFarmLocations.filter(
                  (loc) => loc.district === props.row.original.farmDistrict
                );
                allMukims = lodash.uniqBy(allMukims, "mukim");

                const allVillages = allFarmLocations.filter(
                  (loc) =>
                    loc.district === props.row.original.farmDistrict &&
                    loc.village === props.row.original.farmVillage
                );
                setAllMukims(allMukims);
                setAllVilages(allVillages);
                setSelectedCompany([
                  {
                    value: foundCompanyProfile.uuid,
                    label: foundCompanyProfile.companyName,
                  },
                ]);
                setModalVisible(true);
                setFormData({
                  ...props.row.original,
                  machineryIds: props.row.original.machineryIds || [],
                  companyId: foundCompanyProfile.companyId,
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
      Header: "Premise ID",
      accessor: "premiseId",
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
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "OCBS Refrence Number",
      accessor: "ocbsRefNo",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Premise Address",
      accessor: "premiseAddress",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Mukim",
      accessor: "farmMukim",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Farm Area",
      accessor: "farmArea",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Farm Category",
      accessor: "farmCategory",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Land Contract Expiry",
      accessor: "expiryDate",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
  ]);

  return (
    <AdminArea header={{ title: "Premise Profile" }} urlQuery={router.query}>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Premise Profile`}
        size="lg"
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData(defaultState);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { uuid, id, __typename, mukim, companyId, ...data } = formData;
            // console.log({
            //   formData,
            // });
            if (!uuid) {
              if (!data.landSize) {
                data.landSize = 0;
              }
              if (!data.factorySize) {
                data.factorySize = 0;
              }

              const tokenizedPayload = {
                data,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await createAgrifoodPremiseProfile({
                variables: {
                  input: {
                    // ...data,
                    tokenized,
                  },
                },
              });
            } else {
              if (!data.landSize) {
                data.landSize = 0;
              }
              if (!data.factorySize) {
                data.factorySize = 0;
              }
              const tokenizedPayload = {
                uuid,
                ...data,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await updateAgrifoodPremiseProfile({
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
              message: `Premise Profile saved!`,
              level: "success",
            });

            setModalVisible(false);
            setFormData(defaultState);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Premise ID</label>
          <input
            placeholder="Auto Generate"
            disabled
            className="form-control"
            value={formData.premiseId || ""}
            // onChange={(e) => {
            //   if (e) e.preventDefault();
            //   setFormData({
            //     ...formData,
            //     premiseId: e.target.value,
            //   });
            // }}
          />
        </div>
        <div className="form-group">
          <label>Company Name*</label>
          <Select
            value={selectedCompany}
            options={allAgrifoodCompanyProfiles.map((prof) => {
              return {
                value: prof.uuid,
                label: prof.companyName.toUpperCase(),
              };
            })}
            className="basic-multi-select w-full"
            classNamePrefix="select"
            onChange={(selectedValues) => {
              // console.log({ selectedValues });

              const found = allAgrifoodCompanyProfiles.find(
                (profile) => profile.uuid === selectedValues.value
              );
              setFormData({
                ...formData,
                companyUUID: found?.uuid || "",
                companyId: found?.companyId || "",
                companyName: found?.companyName || "",
              });

              setSelectedCompany([
                {
                  value: found.uuid,
                  label: found.companyName,
                },
              ]);
            }}
          />
          {/* <select
            className="form-control"
            value={formData.companyUUID || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              const found = allAgrifoodCompanyProfiles.find(
                (profile) => profile.uuid === e.target.value
              );
              setFormData({
                ...formData,
                companyUUID: found?.uuid || "",
                companyId: found?.companyId || "",
                companyName: found?.companyName || "",
                // profile: e.target.value,
              });
            }}
          >
            <option value="" disabled>
              Select Company Name
            </option>
            {allAgrifoodCompanyProfiles.map((profile) => (
              <option value={profile.uuid}>{profile.companyName}</option>
            ))}
          </select> */}
        </div>

        <div className="grid grid-cols-2 gap-10">
          <div className="form-group">
            <label>Company ID</label>
            <input
              disabled
              placeholder="Auto Filled"
              className="form-control"
              value={formData.companyId || ""}
            />
          </div>
          <div className="form-group">
            <label>OCBS Reference No.</label>
            <input
              className="form-control"
              value={formData.ocbsRefNo || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  ocbsRefNo: e.target.value.toUpperCase(),
                });
              }}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Partner/Investor</label>
          <input
            className="form-control"
            value={formData.partnerInvestor || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                partnerInvestor: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Supervisor Name</label>
          <input
            className="form-control"
            value={formData.supervisorName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                supervisorName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>
            Supervisor Name (for more than 1 Supervisor name, use "/" between
            the Supervisor Name)
          </label>
          <textarea
            placeholder="Supervisor 1 / Supervisor 2 / Supervisor 3"
            className="form-control"
            value={formData.otherSupervisorName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                otherSupervisorName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Premise Address*</label>
          <textarea
            required
            className="form-control"
            value={formData.premiseAddress || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                premiseAddress: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-x-10">
          <div className="form-group">
            <label>Premise Structure</label>
            <select
              className="form-control"
              value={formData.premiseStructure || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  premiseStructure: e.target.value.toUpperCase(),
                });
              }}
            >
              <option value="" disabled>
                Select Premise Structure
              </option>
              <option value={"KKP"}>KKP</option>
              <option value={"FACTORY"}>FACTORY</option>
              <option value={"SHOPLOT"}>SHOPLOT</option>
              <option value={"HOME BASED - RESIDENTIAL AREA"}>
                HOME BASED - RESIDENTIAL AREA
              </option>
              <option value={"HOME BASED - HOME KITCHEN"}>
                HOME BASED - HOME KITCHEN
              </option>
              <option value={"COMMUNITY HALL"}>COMMUNITY HALL</option>
              <option value={"SHARED KITCHEN"}>SHARED KITCHEN</option>
            </select>
          </div>
          <div className="form-group">
            <label>Premise Size (sqmt)</label>
            <NumberFormat
              className="form-control"
              value={formData.premiseSize || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  premiseSize: e.floatValue,
                });
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-10 py-5 pt-5">
          <div>
            <div className="form-group">
              <p>
                <label>District*</label>
              </p>
              <select
                required
                className="form-control"
                value={formData.farmDistrict || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();

                  const found = allFarmLocations.find(
                    (c) => c.district === e.target.value
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
                    farmLocationUUID: found.uuid,
                    farmDistrict: found.district,
                    farmMukim: "",
                    farmVillage: "",
                    farmArea: "",
                    PREFIX,
                  });

                  let allMukims = allFarmLocations.filter(
                    (loc) => loc.district === found.district
                  );
                  allMukims = lodash.uniqBy(allMukims, "mukim");

                  setAllMukims(allMukims);
                  setAllVilages([]);
                  setAllAreas([]);
                }}
              >
                <option value={""} disabled>
                  Select District
                </option>

                {lodash.uniqBy(allFarmLocations, "district").map((farm) => (
                  <option value={farm.district}>
                    {farm.district.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Mukim*</label>
              <select
                required
                className="form-control"
                value={formData.farmMukim || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();

                  const found = allMukims.find(
                    (d) => d.mukim === e.target.value
                  );
                  setFormData({
                    ...formData,
                    // farmLocationUUID: found.uuid || "",
                    farmMukim: found.mukim,
                    farmVillage: "",
                    farmArea: "",
                    farmLocationUUID: "",
                  });

                  let allVillages = allFarmLocations.filter(
                    (loc) =>
                      loc.district === found.district &&
                      loc.mukim === found.mukim
                  );
                  allVillages = lodash.uniqBy(allVillages, "village");
                  setAllVilages(allVillages);
                  setAllAreas([]);
                }}
              >
                <option value="" disabled>
                  Select Mukim
                </option>
                {allMukims.map((farm) => (
                  <option value={farm.mukim}>{farm.mukim.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Vilage*</label>
              <select
                required
                className="form-control"
                value={formData.farmVillage || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();

                  // const found = allMukims.find(
                  //   (d) => d.village === e.target.value
                  // );

                  setFormData({
                    ...formData,
                    farmVillage: e.target.value,
                    farmArea: "",
                    farmLocationUUID: "",
                  });

                  // let allAreas = allFarmLocations.filter(
                  //   (loc) =>
                  //     loc.district === found.district &&
                  //     loc.mukim === found.mukim &&
                  //     loc.village === found.village
                  // );
                  // allAreas = lodash.uniqBy(allVillages, "area");

                  // setAllAreas(allAreas);
                }}
              >
                <option value="" disabled>
                  Select Village
                </option>
                {allVillages.map((farm) => (
                  <option value={farm.village}>
                    {farm.village.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Farm Area*</label>
              <select
                required
                className="form-control"
                value={formData.farmArea || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();

                  const found = allAreas.find((d) => d.area === e.target.value);

                  setFormData({
                    ...formData,
                    // farmLocationUUID: found.uuid || "",
                    farmArea: found.area || "",
                  });
                }}
              >
                <option value="" disabled>
                  Select Area
                </option>
                {allAreas.map((farm) => (
                  <option value={farm.area}>{farm.area.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Land Approval Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.landApprovalDate || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    landApprovalDate: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Allow Activites</label>
              <input
                className="form-control"
                value={formData.allowedActivites || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    allowedActivites: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Land Contract Expiry</label>
              <input
                type="date"
                className="form-control"
                value={formData.expiryDate || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    expiryDate: e.target.value,
                  });
                }}
              />
            </div>
          </div>
          <div>
            <div className="form-group">
              <label>Farm Category</label>
              <select
                className="form-control"
                value={formData.farmCategory || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    farmCategory: e.target.value,
                  });
                }}
              >
                <option value="" disabled>
                  Select Farm Category
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
              <label>Type of Award</label>
              <select
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
                <option value="" disabled>
                  Select Type of Award
                </option>
                {allAwardTypes.map((awd) => (
                  <option value={awd.uuid}>{awd.award.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Contract Status</label>
              <select
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
              <label>Commencement Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.commencementDate || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    commencementDate: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Land Size (Ha)</label>
              <NumberFormat
                className="form-control"
                value={formData.landSize || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    landSize: e.floatValue || 0,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Factory Size (sqmt)</label>
              <NumberFormat
                className="form-control"
                value={formData.factorySize || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    factorySize: e.floatValue || 0,
                  });
                }}
              />
            </div>
          </div>
        </div>
        <div className="bg-gray-200 px-4 py-2 text-md">
          <b>Product Category*</b>{" "}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {allAgrifoodProductCategories.map((cat) => {
            let isChecked = false;

            const foundIndex = formData.agrifoodProductCategoryIds.findIndex(
              (idx) => idx === cat.uuid
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
                        agrifoodProductCategoryIds: [
                          ...formData.agrifoodProductCategoryIds,
                          cat.uuid,
                        ],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        agrifoodProductCategoryIds:
                          formData.agrifoodProductCategoryIds.filter(
                            (p) => p !== cat.uuid
                          ),
                      });
                    }
                  }}
                />
                <label>{cat.productNameEnglish.toUpperCase()}</label>
              </div>
            );
          })}
        </div>
        <div className="bg-gray-200 px-4 py-2 text-md">
          <b>Sub-Product Category*</b>{" "}
        </div>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {allAgrifoodProductSubCategories.map((cat) => {
            let isChecked = false;

            const foundIndex = formData.agrifoodProductSubCategoryIds.findIndex(
              (idx) => idx === cat.uuid
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
                        agrifoodProductSubCategoryIds: [
                          ...formData.agrifoodProductSubCategoryIds,
                          cat.uuid,
                        ],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        agrifoodProductSubCategoryIds:
                          formData.agrifoodProductSubCategoryIds.filter(
                            (p) => p !== cat.uuid
                          ),
                      });
                    }
                  }}
                />
                <label>{cat.subCategoryNameEnglish.toUpperCase()}</label>
              </div>
            );
          })}
        </div>
        <div className="bg-gray-200 px-4 py-2 text-md">
          <b>Type of Machinery</b>{" "}
        </div>
        <div className="grid grid-cols-4 gap-3 mb-2">
          {allMachineries.map((machinery) => {
            let isChecked = false;

            const foundIndex = formData.machineryIds.findIndex(
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
                        machineryIds: [
                          ...formData.machineryIds,
                          machinery.uuid,
                        ],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        machineryIds: formData.machineryIds.filter(
                          (p) => p !== machinery.uuid
                        ),
                      });
                    }
                  }}
                />
                <label>{machinery.machineName.toUpperCase()}</label>
              </div>
            );
          })}
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
                value={formData.unskilledLocal || 0}
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
                value={formData.semiSkilledLocal || 0}
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
                value={formData.skilledLocal || 0}
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
                value={formData.expertLocal || 0}
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
                value={formData.noOfLabourTotal || 0}
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
                value={formData.unskilledForeigner || 0}
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
                value={formData.semiSkilledForeigner || 0}
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
                value={formData.skilledForeigner || 0}
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
                value={formData.expertForeigner || 0}
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
                value={formData.noOfLabourForeigner || 0}
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
        <TableAsync
          loading={loading}
          columns={columns}
          data={allAgrifoodPremiseProfiles}
          withoutHeader={true}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          customHeaderUtilities={
            !currentUserDontHavePrivilege([
              "Premise Profile Export Excel:Create",
            ]) ? (
              <div className="flex mx-2 items-end">
                <button
                  className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                  onClick={async (e) => {
                    if (e) e.preventDefault();
                    showLoadingSpinner();
                    try {
                      const response = await exportPremiseProfile();

                      downloadExcelFromBuffer(
                        response.data.exportPremiseProfile.data,
                        "premise-profile"
                      );

                      // window.open(
                      //   response.data.exportPremiseProfile,
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
            ) : null
          }
          customUtilities={
            !currentUserDontHavePrivilege(["Premise Profile:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition={"left"}
          onAdd={
            !currentUserDontHavePrivilege(["Premise Profile:Create"])
              ? async (e) => {
                  if (e) e.preventDefault();
                  showLoadingSpinner();
                  try {
                    const defState = defaultState();

                    setFormData({
                      ...defState,
                      premiseId: "",
                    });
                    setModalVisible(true);
                  } catch (err) {
                    notification.handleError(err);
                  }
                  hideLoadingSpinner();
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Premise Profile:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} premis profiles?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteAgrifoodPremiseProfile({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} premis profiles deleted`,
                        level: "success",
                      });
                      await refetch();
                      setSavedCount((savedCount += 1));
                    }
                  } catch (err) {
                    notification.handleError(err);
                  }
                  hideLoadingSpinner();
                }
              : null
          }
        />
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(page);
