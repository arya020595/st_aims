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
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";

const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query allFarmerProfiles($filters: String) {
    tokenizeAllPlantingSystems

    tokenizedAllFarmingSystem

    tokenizedAllSupport

    tokenizedAllRace

    tokenizedAllCompanyStatus

    tokenizedAllCurrentStatuses

    tokenizedAllTypeCompanyRegs

    tokenizedAllPositions
    getCountFarmerProfiles(filters: $filters)
  }
`;
const QUERY_PAGINATED = gql`
  query tokenizedAllFarmerProfile(
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllFarmerProfile(
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    getCountFarmerProfiles(filters: $filters)
  }
`;

const GET_COUNT_FARMER_PROFILE = gql`
  query getCountFarmerProfiles {
    getCountFarmerProfiles
  }
`;
const CREATE_FARMER_PROFILE = gql`
  mutation tokenizedCreateFarmerProfile($input: JSON) {
    tokenizedCreateFarmerProfile(input: $input)
  }
`;

const UPDATE_FARMER_PROFILE = gql`
  mutation tokenizedUpdateFarmerProfile($input: JSON) {
    tokenizedUpdateFarmerProfile(input: $input)
  }
`;

const DELETE_FARMER_PROFILE = gql`
  mutation tokenizedDeleteFarmerProfile($tokenized: String!) {
    tokenizedDeleteFarmerProfile(tokenized: $tokenized)
  }
`;

const EXPORT_FARMER_PROFILE = gql`
  mutation exportFarmerProfile {
    exportFarmerProfile
  }
`;

const FarmerProfile = () => {
  const router = useRouter();
  const client = useApolloClient();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const notification = useNotification();

  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY, {
    variables: {
      filters: router.query.filters,
    },
  });
  const [createFarmerProfile] = useMutation(CREATE_FARMER_PROFILE);
  const [updateFarmerProfile] = useMutation(UPDATE_FARMER_PROFILE);
  const [deleteFarmerProfile] = useMutation(DELETE_FARMER_PROFILE);
  const [exportFarmerProfile] = useMutation(EXPORT_FARMER_PROFILE);

  const [allFarmerProfiles, setAllFarmerProfiles] = useState([]);
  const [allPlantingSystems, setAllPlantingSystems] = useState([]);
  const [allCompanyStatuses, setAllCompanyStatuses] = useState([]);
  const [allCurrentStatuses, setAllCurrentStatuses] = useState([]);
  const [allFarmingSystems, setAllFarmingSystems] = useState([]);
  const [allSupportTypes, setAllSupportTypes] = useState([]);
  const [allRaces, setAllRaces] = useState([]);
  const [allTypeCompanyRegs, setAllTypeCompanyRegs] = useState([]);
  const [allPositions, setAllPositions] = useState([]);

  let [getCountFarmerProfiles, setGetCountFarmerProfile] = useState(0);
  let [savedCount, setSavedCount] = useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!getCountFarmerProfiles) return 1;
    return Math.ceil(getCountFarmerProfiles / pageSize);
  }, [getCountFarmerProfiles, pageSize]);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedFarmerProfiles = data?.tokenizedAllFarmerProfile || "";
      // let allFarmerProfiles = [];
      // if (encryptedFarmerProfiles) {
      //   const decrypted = jwt.verify(encryptedFarmerProfiles, TOKENIZE);
      //   allFarmerProfiles = decrypted.queryResult;
      //   setAllFarmerProfiles(allFarmerProfiles);
      // }
      const encryptedPlantingSystems = data?.tokenizeAllPlantingSystems || "";
      let allPlantingSystems = [];
      if (encryptedPlantingSystems) {
        const decrypted = jwt.verify(encryptedPlantingSystems, TOKENIZE);
        allPlantingSystems = decrypted.queryResult;
        setAllPlantingSystems(allPlantingSystems);
      }
      const encryptedCompanyStatuses = data?.tokenizedAllCompanyStatus || "";
      let allCompanyStatuses = [];
      if (encryptedCompanyStatuses) {
        const decrypted = jwt.verify(encryptedCompanyStatuses, TOKENIZE);
        allCompanyStatuses = decrypted.queryResult;
        setAllCompanyStatuses(allCompanyStatuses);
      }
      const encryptedCurrentStatuses = data?.tokenizedAllCurrentStatuses || "";
      let allCurrentStatuses = [];
      if (encryptedCurrentStatuses) {
        const decrypted = jwt.verify(encryptedCurrentStatuses, TOKENIZE);
        allCurrentStatuses = decrypted.queryResult;
        setAllCurrentStatuses(allCurrentStatuses);
      }
      const encryptedFarmingSystems = data?.tokenizedAllFarmingSystem || "";
      let allFarmingSystems = [];
      if (encryptedFarmingSystems) {
        const decrypted = jwt.verify(encryptedFarmingSystems, TOKENIZE);
        allFarmingSystems = decrypted.queryResult;
        setAllFarmingSystems(allFarmingSystems);
      }
      const encryptedSupportTypes = data?.tokenizedAllSupport || "";
      let allSupportTypes = [];
      if (encryptedSupportTypes) {
        const decrypted = jwt.verify(encryptedSupportTypes, TOKENIZE);
        allSupportTypes = decrypted.queryResult;
        setAllSupportTypes(allSupportTypes);
      }
      const encryptedRaces = data?.tokenizedAllRace || "";
      let allRaces = [];
      if (encryptedRaces) {
        const decrypted = jwt.verify(encryptedRaces, TOKENIZE);
        allRaces = decrypted.queryResult;
        setAllRaces(allRaces);
      }
      const encryptedTypeCompanyRegs = data?.tokenizedAllTypeCompanyRegs || "";
      let allTypeCompanyRegs = [];
      if (encryptedTypeCompanyRegs) {
        const decrypted = jwt.verify(encryptedTypeCompanyRegs, TOKENIZE);
        allTypeCompanyRegs = decrypted.queryResult;
        setAllTypeCompanyRegs(allTypeCompanyRegs);
      }
      const encryptedPositions = data?.tokenizedAllPositions || "";
      let allPositions = [];
      if (encryptedPositions) {
        const decrypted = jwt.verify(encryptedPositions, TOKENIZE);
        allPositions = decrypted.queryResult;
        setAllPositions(allPositions);
      }

      setGetCountFarmerProfile(data?.getCountFarmerProfiles || 0);

      const countData = data?.getCountFarmerProfiles || 0;
      setGetCountFarmerProfile(countData);
    }
  }, [data, loading, error, savedCount]);

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: QUERY_PAGINATED,
      variables: {
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedFarmerProfiles =
      result.data?.tokenizedAllFarmerProfile || "";
    let allFarmerProfiles = [];
    if (encryptedFarmerProfiles) {
      const decrypted = jwt.verify(encryptedFarmerProfiles, TOKENIZE);
      allFarmerProfiles = decrypted.queryResult;
      setAllFarmerProfiles(allFarmerProfiles);
    }
    const countData = result.data?.getCountFarmerProfiles || 0;
    setGetCountFarmerProfile(countData);
    hideLoadingSpinner();
  }, [savedCount, pageSize, pageIndex, router.query.filters]);

  const handlePageChange = useCallback(
    async ({ pageIndex, pageSize, filters }) => {
      // const ym = router.query.yearMonth || dayjs().format("YYYY-MM");
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

  // const allFarmerProfiles = data?.allFarmerProfiles || [];
  // let allFarmerProfiles = [];
  // const encrypted = data?.tokenizedAllFarmerProfile || "";
  // if (encrypted) {
  //   const decrypted = jwt.verify(encrypted, TOKENIZE);
  //   allFarmerProfiles = decrypted.queryResult;
  // }

  // let allPlantingSystems = [];
  // const encryptedPlantingSystems = data?.tokenizeAllPlantingSystems || "";
  // if (encryptedPlantingSystems) {
  //   const decrypted = jwt.verify(encryptedPlantingSystems, TOKENIZE);
  //   allPlantingSystems = decrypted.queryResult;
  // }

  // let allCompanyStatuses = [];
  // const encryptedCompanyStatuses = data?.tokenizedAllCompanyStatus || "";
  // if (encryptedCompanyStatuses) {
  //   const decrypted = jwt.verify(encryptedCompanyStatuses, TOKENIZE);
  //   allCompanyStatuses = decrypted.queryResult;
  // }

  // let allCurrentStatuses = [];
  // const encryptedCurrentStatuses = data?.tokenizedAllCurrentStatuses || "";
  // if (encryptedCurrentStatuses) {
  //   const decrypted = jwt.verify(encryptedCurrentStatuses, TOKENIZE);
  //   allCurrentStatuses = decrypted.queryResult;
  // }

  // let allFarmingSystems = [];
  // const encryptedFarmingSystems = data?.tokenizedAllFarmingSystem || "";
  // if (encryptedFarmingSystems) {
  //   const decrypted = jwt.verify(encryptedFarmingSystems, TOKENIZE);
  //   allFarmingSystems = decrypted.queryResult;
  // }

  // let allSupportTypes = [];
  // const encryptedSupportTypes = data?.tokenizedAllSupport || "";
  // if (encryptedSupportTypes) {
  //   const decrypted = jwt.verify(encryptedSupportTypes, TOKENIZE);
  //   allSupportTypes = decrypted.queryResult;
  // }

  // let allRaces = [];
  // const encryptedRaces = data?.tokenizedAllRace || "";
  // if (encryptedRaces) {
  //   const decrypted = jwt.verify(encryptedRaces, TOKENIZE);
  //   allRaces = decrypted.queryResult;
  // }

  // let allTypeCompanyRegs = [];
  // const encryptedTypeCompanyRegs = data?.tokenizedAllTypeCompanyRegs || "";
  // if (encryptedTypeCompanyRegs) {
  //   const decrypted = jwt.verify(encryptedTypeCompanyRegs, TOKENIZE);
  //   allTypeCompanyRegs = decrypted.queryResult;
  // }

  // let allPositions = [];
  // const encryptedPositions = data?.tokenizedAllPositions || "";
  // if (encryptedPositions) {
  //   const decrypted = jwt.verify(encryptedPositions, TOKENIZE);
  //   allPositions = decrypted.queryResult;
  // }

  const [allMukims, setAllMukims] = useState([]);
  const [allVillages, setAllVilages] = useState([]);
  const [allAreas, setAllAreas] = useState([]);

  const plantingSystemDefault = generatePlantingSystem(allPlantingSystems);
  const farmingSystemDefault = generateFarmingSystem(allFarmingSystems);
  const [formData, setFormData] = useState({
    plantingSystem: [],
    farmingSystem: [],

    unskilledLocal: 0,
    semiSkilledLocal: 0,
    expertLocal: 0,
    skilledLocal: 0,

    unskilledForeigner: 0,
    semiSkilledForeigner: 0,
    expertForeigner: 0,
    skilledForeigner: 0,
    totalAssets: 0,
    totalAnnualRevenue: 0,
  });

  // useEffect(() => {
  //   const noOfLabourTotal =
  //     formData.unskilledLocal +
  //     formData.semiSkilledLocal +
  //     formData.expertLocal +
  //     formData.skilledLocal;

  //   const noOfLabourForeigner = formData?.noOfLabourForeigner || 0;

  //   const tmpSMECategory = noOfLabourForeigner + noOfLabourTotal;

  //   let smeCategory = "";
  //   if (tmpSMECategory >= 1 && tmpSMECategory <= 5) {
  //     smeCategory = "Micro";
  //   } else if (tmpSMECategory >= 6 && tmpSMECategory <= 50) {
  //     smeCategory = "Small";
  //   } else if (tmpSMECategory >= 51 && tmpSMECategory <= 100) {
  //     smeCategory = "Medium";
  //   } else {
  //     smeCategory = "Large";
  //   }

  //   setFormData({
  //     ...formData,
  //     noOfLabourTotal,
  //     smeCategory,
  //   });
  // }, [
  //   formData.unskilledLocal,
  //   formData.semiSkilledLocal,
  //   formData.expertLocal,
  //   formData.skilledLocal,
  // ]);

  // useEffect(() => {
  //   const noOfLabourForeigner =
  //     formData.unskilledForeigner +
  //     formData.semiSkilledForeigner +
  //     formData.expertForeigner +
  //     formData.skilledForeigner;

  //   const noOfLabourTotal = formData?.noOfLabourTotal || 0;

  //   const tmpSMECategory = noOfLabourForeigner + noOfLabourTotal;

  //   let smeCategory = "";
  //   if (tmpSMECategory >= 1 && tmpSMECategory <= 5) {
  //     smeCategory = "Micro";
  //   } else if (tmpSMECategory >= 6 && tmpSMECategory <= 50) {
  //     smeCategory = "Small";
  //   } else if (tmpSMECategory >= 51 && tmpSMECategory <= 100) {
  //     smeCategory = "Medium";
  //   } else {
  //     smeCategory = "Large";
  //   }
  //   setFormData({
  //     ...formData,
  //     noOfLabourForeigner,
  //     smeCategory,
  //   });
  // }, [
  //   formData.unskilledForeigner,
  //   formData.semiSkilledForeigner,
  //   formData.expertForeigner,
  //   formData.skilledForeigner,
  // ]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const noOfLabourForeigner =
        formData.unskilledForeigner +
        formData.semiSkilledForeigner +
        formData.expertForeigner +
        formData.skilledForeigner;

      const noOfLabourTotal =
        formData.unskilledLocal +
        formData.semiSkilledLocal +
        formData.expertLocal +
        formData.skilledLocal;

      const totalLabour = noOfLabourTotal + noOfLabourForeigner;

      let micro = 0,
        small = 0,
        medium = 0,
        large = 0;

      let revenueCategory = "";

      if (totalLabour >= 1 && totalLabour <= 9) {
        micro += 1;
      } else if (totalLabour >= 10 && totalLabour <= 29) {
        small += 1;
      } else if (totalLabour >= 30 && totalLabour <= 99) {
        medium += 1;
      } else if (totalLabour >= 100) {
        large += 1;
      }

      if (formData.totalAnnualRevenue < 100000) {
        micro += 1;
        revenueCategory = "Micro";
      } else if (
        formData.totalAnnualRevenue >= 100000 &&
        formData.totalAnnualRevenue < 1000000
      ) {
        small += 1;
        revenueCategory = "Small";
      } else if (
        formData.totalAnnualRevenue >= 1000000 &&
        formData.totalAnnualRevenue < 5000000
      ) {
        medium += 1;
        revenueCategory = "Medium";
      } else if (formData.totalAnnualRevenue >= 5000000) {
        large += 1;
        revenueCategory = "Large";
      }

      if (formData.totalAssets < 60000) {
        micro += 1;
      } else if (
        formData.totalAssets >= 60000 &&
        formData.totalAssets < 600000
      ) {
        small += 1;
      } else if (
        formData.totalAssets >= 600000 &&
        formData.totalAssets < 3000000
      ) {
        medium += 1;
      } else if (formData.totalAssets >= 3000000) {
        large += 1;
      }

      let smeCategory = "";
      //###### First Condition
      if (micro >= 2) {
        smeCategory = "Micro";
      } else if (small >= 2) {
        smeCategory = "Small";
      } else if (medium >= 2) {
        smeCategory = "Medium";
      } else if (large >= 2) {
        smeCategory = "Large";
      }
      // console.log({
      //   micro,
      //   small,
      //   medium,
      //   large,
      //   smeCategory
      // });
      if (smeCategory) {
        // Set SME Category Here
        setFormData({
          ...formData,
          smeCategory,
        });
      } else {
        setFormData({
          ...formData,
          smeCategory: revenueCategory,
        });
      }
    }, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, [formData]);

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
                // console.log(propsTable.row.original);
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
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
      Header: "Company ID",
      accessor: "companyId",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Name",
      accessor: "farmerCompanyName",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Company Reg. No",
      accessor: "companyRegNo",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Company Reg Date",
      accessor: "companyRegDate",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Company Address",
      accessor: "companyAddress",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Company Status",
      accessor: "companyStatusName",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <p>{(props.value || "").toUpperCase()}</p>,
    },
  ]);
  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Farmer Profile</title>
      </Head>

      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Farmer Profile`}
        visible={modalVisible}
        size="lg"
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            plantingSystem: [],
            farmingSystem: [],

            unskilledLocal: 0,
            semiSkilledLocal: 0,
            expertLocal: 0,
            skilledLocal: 0,

            unskilledForeigner: 0,
            semiSkilledForeigner: 0,
            expertForeigner: 0,
            skilledForeigner: 0,
            totalAssets: 0,
            totalAnnualRevenue: 0,
          });
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          try {
            let { uuid, id, __typename, ...data } = formData;
            if (!uuid) {
              const tokenizedPayload = {
                formData,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await createFarmerProfile({
                variables: {
                  input: {
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
              await updateFarmerProfile({
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
              message: `Farmer Profile saved!`,
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
          <label>Company Name*</label>
          <input
            required
            className="form-control"
            value={(formData.farmerCompanyName || "").toUpperCase()}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                farmerCompanyName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="form-group">
              <label>Company ID</label>
              <input
                className="form-control"
                value={(formData.companyId || "").toUpperCase()}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    companyId: e.target.value.toUpperCase(),
                  });
                }}
                disabled
              />
            </div>

            <div>
              <div className="form-group">
                <label>Company Reg. No*</label>
                <input
                  required
                  className="form-control"
                  value={(formData.companyRegNo || "").toUpperCase()}
                  onChange={(e) => {
                    if (e) e.preventDefault();
                    setFormData({
                      ...formData,
                      companyRegNo: e.target.value.toUpperCase(),
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="form-group">
              <label>Type of Company Reg*</label>
              <select
                className="form-control"
                value={formData.typeCompanyRegId || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  const found = allTypeCompanyRegs.find(
                    (c) => c.uuid === e.target.value
                  );

                  setFormData({
                    ...formData,
                    typeCompanyRegId: found.uuid,
                    typeCompanyRegName: found.typesOfCompany.toUpperCase(),
                  });
                }}
                required
              >
                <option value={""} disabled>
                  Select Type of Company Reg
                </option>
                {allTypeCompanyRegs.map((status) => (
                  <option value={status.uuid}>
                    {status.typesOfCompany.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Company Reg. Date*</label>
              <input
                type={"date"}
                className="form-control"
                value={formData.companyRegDate || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    companyRegDate: e.target.value,
                  });
                }}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>ROCBN Reg. No*</label>
          <input
            required
            className="form-control"
            value={(formData.rocbnRegNo || "").toUpperCase()}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                rocbnRegNo: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Company Address*</label>
          <textarea
            required
            className="form-control"
            value={(formData.companyAddress || "").toUpperCase()}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                companyAddress: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Mailing Addres</label>
          <input
            className="form-control"
            value={(formData.mailingAddress || "").toUpperCase()}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                mailingAddress: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Farmer Name*</label>
          <input
            required
            className="form-control"
            value={(formData.farmerName || "").toUpperCase()}
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
            <label>Other Stakeholders</label>
          </p>
          <p className="text-md italic">If more than one, use / between name</p>
          <textarea
            className="form-control"
            value={(formData.otherName || "").toUpperCase()}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                otherName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Manager Name*</label>
          <input
            required
            className="form-control"
            value={(formData.managerName || "").toUpperCase()}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                managerName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="form-group">
              <label>Position*</label>
              <select
                className="form-control"
                value={formData.positionUUID || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  const found = allPositions.find(
                    (c) => c.uuid === e.target.value
                  );

                  setFormData({
                    ...formData,
                    positionUUID: found.uuid,
                    positionName: found.name.toUpperCase(),
                  });
                }}
                required
              >
                <option value={""} disabled>
                  Select Position
                </option>
                {allPositions.map((position) => (
                  <option value={position.uuid}>
                    {position.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date Of Birth*</label>
              <input
                type={"date"}
                className="form-control"
                value={formData.dateOfBirth || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    dateOfBirth: e.target.value,
                  });
                }}
                required
              />
            </div>

            <div className="form-group">
              <label>Mobile Number*</label>
              <input
                required
                className="form-control"
                value={formData.mobileNo || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    mobileNo: e.target.value,
                  });
                }}
              />
            </div>

            <div className="form-group">
              <label>SME Category</label>
              <input
                disabled
                className="form-control"
                value={(formData.smeCategory || "").toUpperCase()}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    smeCategory: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>

            <div className="form-group">
              <label>Telephone No</label>
              <input
                className="form-control"
                value={formData.telephoneNo || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    telephoneNo: e.target.value,
                  });
                }}
              />
            </div>

            <div className="form-group">
              <label>Gender*</label>
              <select
                required
                className="form-control"
                value={(formData.gender || "").toUpperCase()}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    gender: e.target.value.toUpperCase(),
                  });
                }}
              >
                <option value={""} disabled>
                  Select Gender
                </option>
                <option value={"N/A"}>N/A</option>
                <option value={"MALE"}>MALE</option>
                <option value={"FEMALE"}>FEMALE</option>
              </select>
            </div>
          </div>
          <div>
            <div className="form-group">
              <label>IC. No / Passport No.*</label>
              <input
                required
                className="form-control"
                value={formData.icPassportNo || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();

                  let strRegex = new RegExp(/^[a-z0-9]+$/i);
                  let result = strRegex.test(e.target.value);

                  if (result || !e.target.value) {
                    setFormData({
                      ...formData,
                      icPassportNo: e.target.value.toUpperCase(),
                    });
                  }
                }}
              />
            </div>
            <div className="form-group">
              <label>IC. Colour*</label>
              <select
                className="form-control"
                value={(formData.icColour || "").toUpperCase()}
                onChange={(e) => {
                  if (e) e.preventDefault();

                  setFormData({
                    ...formData,
                    icColour: e.target.value.toUpperCase(),
                  });
                }}
                required
              >
                <option value={""} disabled>
                  Select IC Colour
                </option>
                <option value="YELLOW">YELLOW</option>
                <option value="PURPLE">PURPLE</option>
                <option value="GREEN">GREEN</option>
                <option value="N/A">N/A</option>
              </select>
            </div>
            <div className="form-group">
              <label>Social Media Acc</label>
              <input
                className="form-control"
                value={(formData.socialMediaAcc || "").toUpperCase()}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    socialMediaAcc: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type={"email"}
                className="form-control"
                value={(formData.emailAddress || "").toUpperCase()}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    emailAddress: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Race</label>
              <select
                className="form-control"
                value={formData.raceId || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  const found = allRaces.find((c) => c.uuid === e.target.value);

                  setFormData({
                    ...formData,
                    raceId: found.uuid,
                    raceName: found.race.toUpperCase(),
                  });
                }}
              >
                <option value={""} disabled>
                  Select Race
                </option>
                {allRaces.map((stat) => (
                  <option value={stat.uuid}>{stat.race.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Company Status</label>
              <select
                className="form-control"
                value={formData.companyStatusId || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  const found = allCompanyStatuses.find(
                    (c) => c.uuid === e.target.value
                  );

                  setFormData({
                    ...formData,
                    companyStatusId: found.uuid,
                    companyStatusName: found.description.toUpperCase(),
                  });
                }}
              >
                <option value={""} disabled>
                  Select Company Status
                </option>
                {allCompanyStatuses.map((status) => (
                  <option value={status.uuid}>
                    {status.description.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
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

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div>
            <div className="form-group">
              <div className="flex mb-1">
                <p className="text-md mr-2">Total Assets</p>
              </div>
              <NumberFormat
                className="form-control"
                value={formData.totalAssets || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    totalAssets: e.floatValue || 0,
                  });
                }}
              />
            </div>
          </div>
          <div>
            <div className="form-group">
              <div className="flex mb-1">
                <p className="text-md mr-2">Total Annual Revenue</p>
              </div>
              <NumberFormat
                className="form-control"
                value={formData.totalAnnualRevenue || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    totalAnnualRevenue: e.floatValue || 0,
                  });
                }}
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Upload File</label>
          <input
            type="file"
            accept="*"
            className="form-control"
            // value={documentData.url}
            onChange={(e) => {
              if (e) e.preventDefault();
              const file = e.target.files[0];

              let reader = new FileReader();
              reader.onloadend = async () => {
                setFormData({
                  ...formData,
                  uploadFile: reader.result,
                });
                // console.log(reader)
              };
              reader.readAsDataURL(file);
            }}
          />
        </div>

        {formData.uploadFile ? (
          <a
            onClick={(e) => {
              if (e) e.preventDefault();
              window.open(formData.uploadFile, "__blank");
            }}
            className="mt-4"
          >
            <button className="bg-mantis-500 px-4 py-2 text-white font-bold text-md rounded-md shadow-md">
              <i className="fa fa-download" /> Download
            </button>
          </a>
        ) : null}

        <div className="my-2">
          <div className="bg-gray-200 px-4 py-2">
            <label>
              <b>Planting System</b>
            </label>{" "}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {allPlantingSystems.map((system) => {
              let isChecked = false;

              const foundIndex = formData.plantingSystem.findIndex(
                (idx) => idx === system.uuid
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
                          plantingSystem: [
                            ...formData.plantingSystem,
                            system.uuid,
                          ],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          plantingSystem: formData.plantingSystem.filter(
                            (p) => p !== system.uuid
                          ),
                        });
                      }
                    }}
                  />
                  <label>{system.description.toUpperCase()}</label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-2">
          <div className="bg-gray-200 px-4 py-2">
            <label>
              <b>Farming System</b>
            </label>{" "}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {allFarmingSystems.map((system) => {
              let isChecked = false;

              const foundIndex = formData.farmingSystem.findIndex(
                (idx) => idx === system.uuid
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
                          farmingSystem: [
                            ...formData.farmingSystem,
                            system.uuid,
                          ],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          farmingSystem: formData.farmingSystem.filter(
                            (p) => p !== system.uuid
                          ),
                        });
                      }
                    }}
                  />
                  <label>{system.description.toUpperCase()}</label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="form-group">
          <label>Current Status</label>
          <select
            className="form-control"
            value={formData.currStatusId || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              const found = allCurrentStatuses.find(
                (c) => c.uuid === e.target.value
              );

              setFormData({
                ...formData,
                currStatusId: found.uuid,
                currStatusName: found.status.toUpperCase(),
              });
            }}
          >
            <option value={""} disabled>
              Select Current Status
            </option>
            {allCurrentStatuses.map((stat) => (
              <option value={stat.uuid}>{stat.status.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Remarks</label>
          <textarea
            className="form-control"
            value={(formData.remarks || "").toUpperCase()}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                remarks: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
      </FormModal>

      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allFarmerProfiles}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          customHeaderUtilities={
            !currentUserDontHavePrivilege([
              "Farmer Profile Livestock Export Excel:Create",
            ]) ? (
              <div className="flex mx-2 items-end">
                <button
                  className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                  onClick={async (e) => {
                    if (e) e.preventDefault();
                    showLoadingSpinner();
                    try {
                      const response = await exportFarmerProfile();

                      downloadExcelFromBuffer(
                        response.data.exportFarmerProfile.data,
                        "farmer-profile-livestock"
                      );
                      // window.open(response.data.exportFarmerProfile, "__blank");
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
            !currentUserDontHavePrivilege(["Farmer Profile Livestock:Create"])
              ? async (e) => {
                  if (e) e.preventDefault();

                  // let getCount = await client.query({
                  //   query: GET_COUNT_FARMER_PROFILE,
                  //   variables: {},
                  //   fetchPolicy: "no-cache",
                  // });

                  // const count = getCount.data.getCountFarmerProfiles;

                  // let startCode = "CM0000";

                  // const dataLength = "" + count;
                  // startCode = startCode.slice(0, dataLength * -1) + (count + 1);

                  setModalVisible(true);
                  setFormData({
                    plantingSystem: [],
                    farmingSystem: [],

                    unskilledLocal: 0,
                    semiSkilledLocal: 0,
                    expertLocal: 0,
                    skilledLocal: 0,

                    unskilledForeigner: 0,
                    semiSkilledForeigner: 0,
                    expertForeigner: 0,
                    skilledForeigner: 0,
                    companyId: "",
                    totalAnnualRevenue: 0,
                    totalAssets: 0,
                  });
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Farmer Profile Livestock:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} farm locations?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteFarmerProfile({
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
            !currentUserDontHavePrivilege(["Farmer Profile Livestock:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(FarmerProfile);

const generatePlantingSystem = (data) => {
  let result = data.map((d) => {
    return {
      ...d,
      isChecked: false,
    };
  });

  return result;
};

const generateFarmingSystem = (data) => {
  let result = data.map((d) => {
    return {
      ...d,
      isChecked: false,
    };
  });

  return result;
};
