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
import Tooltip from "../../components/Tooltip";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";

const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query allAgrifoodCompanyProfiles($filters: String) {
    countAgrifoodCompanyProfiles(filters: $filters)
    tokenizedAllRace

    tokenizedAllCompanyStatus

    tokenizedAllCurrentStatuses

    tokenizedAllTypeCompanyRegs

    tokenizedAllMachineries

    tokenizedAllAwardTypes

    tokenizedAllPositions
  }
`;

const AGRIFOO_QUERY_PAGINATED = gql`
  query agrifooodPaginatedQuery(
    $pageIndex: Int
    $pageSize: Int
    $filters: String
  ) {
    tokenizedAllAgrifoodCompanyProfiles(
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countAgrifoodCompanyProfiles(filters: $filters)
  }
`;

const COUNT_COMPANY_PROFILE = gql`
  query countAgrifoodCompanyProfiles {
    countAgrifoodCompanyProfiles
  }
`;

const CREATE_COMPANY_PROFILE = gql`
  mutation tokenizedCreateAgrifoodCompanyProfile($input: JSON) {
    tokenizedCreateAgrifoodCompanyProfile(input: $input)
  }
`;

const UPDATE_COMPANY_PROFILE = gql`
  mutation tokenizedUpdateAgrifoodCompanyProfile($input: JSON) {
    tokenizedUpdateAgrifoodCompanyProfile(input: $input)
  }
`;

const DELETE_COMPANY_PROFILE = gql`
  mutation tokenizedDeleteAgrifoodCompanyProfile($tokenized: String!) {
    tokenizedDeleteAgrifoodCompanyProfile(tokenized: $tokenized)
  }
`;

const EXPORT_COMPANY_PROFILE = gql`
  mutation exportAgrifoodCompanyProfile {
    exportAgrifoodCompanyProfile
  }
`;

const page = () => {
  const router = useRouter();
  const client = useApolloClient();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({
    machineryIds: [],
    typeOfAwardIds: [],

    unskilledLocal: 0,
    semiSkilledLocal: 0,
    expertLocal: 0,
    skilledLocal: 0,
    noOfLabourTotal: 0,

    unskilledForeigner: 0,
    semiSkilledForeigner: 0,
    expertForeigner: 0,
    skilledForeigner: 0,
    noOfLabourForeigner: 0,
    fileName: "",

    totalAssets: 0,
    totalAnnualRevenue: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const { data, error, loading, refetch } = useQuery(QUERY, {
    variables: {
      filters: router.query.filters,
    },
  });
  const [createAgrifoodCompanyProfile] = useMutation(CREATE_COMPANY_PROFILE);
  const [updateAgrifoodCompanyProfile] = useMutation(UPDATE_COMPANY_PROFILE);
  const [deleteAgrifoodCompanyProfile] = useMutation(DELETE_COMPANY_PROFILE);
  const [exportAgrifoodCompanyProfile] = useMutation(EXPORT_COMPANY_PROFILE);

  const [allAgrifoodCompanyProfiles, setAllAgrifoodCompanyProfiles] = useState(
    []
  );
  const [allCompanyStatuses, setAllCompanyStatuses] = useState([]);
  const [allCurrentStatuses, setAllCurrentStatuses] = useState([]);
  const [allMachineries, setAllMachineries] = useState([]);
  const [allRaces, setAllRaces] = useState([]);
  const [allTypeCompanyRegs, setAllTypeCompanyRegs] = useState([]);
  const [allPositions, setAllPositions] = useState([]);
  const [allAwardTypes, setAllAwardTypes] = useState([]);

  let [savedCount, setSavedCount] = useState(0);

  let [countAgrifoodCompanyProfiles, setCountAgrifoodCompanyProfile] =
    useState(0);

  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countAgrifoodCompanyProfiles) return 1;
    return Math.ceil(countAgrifoodCompanyProfiles / pageSize);
  }, [countAgrifoodCompanyProfiles, pageSize]);

  useEffect(() => {
    if (!error && !loading) {
      // let allAgrifoodCompanyProfiles = [];
      // const encrypted = data?.tokenizedAllAgrifoodCompanyProfiles || "";
      // if (encrypted) {
      //   const decrypted = jwt.verify(encrypted, TOKENIZE);
      //   allAgrifoodCompanyProfiles = decrypted.queryResult;
      //   setAllAgrifoodCompanyProfiles(allAgrifoodCompanyProfiles);
      // }

      let allCompanyStatuses = [];
      const encryptedCompanyStatuses = data?.tokenizedAllCompanyStatus || "";
      if (encryptedCompanyStatuses) {
        const decrypted = jwt.verify(encryptedCompanyStatuses, TOKENIZE);
        allCompanyStatuses = decrypted.queryResult;
        setAllCompanyStatuses(allCompanyStatuses);
      }

      let allCurrentStatuses = [];
      const encryptedCurrentStatuses = data?.tokenizedAllCurrentStatuses || "";
      if (encryptedCurrentStatuses) {
        const decrypted = jwt.verify(encryptedCurrentStatuses, TOKENIZE);
        allCurrentStatuses = decrypted.queryResult;
        setAllCurrentStatuses(allCurrentStatuses);
      }

      let allMachineries = [];
      const encryptedMachineries = data?.tokenizedAllMachineries || "";
      if (encryptedMachineries) {
        const decrypted = jwt.verify(encryptedMachineries, TOKENIZE);
        allMachineries = decrypted.queryResult;
        setAllMachineries(allMachineries);
      }

      let allRaces = [];
      const encryptedRaces = data?.tokenizedAllRace || "";
      if (encryptedRaces) {
        const decrypted = jwt.verify(encryptedRaces, TOKENIZE);
        allRaces = decrypted.queryResult;
        setAllRaces(allRaces);
      }

      let allTypeCompanyRegs = [];
      const encryptedTypeCompanyRegs = data?.tokenizedAllTypeCompanyRegs || "";
      if (encryptedTypeCompanyRegs) {
        const decrypted = jwt.verify(encryptedTypeCompanyRegs, TOKENIZE);
        allTypeCompanyRegs = decrypted.queryResult;
        setAllTypeCompanyRegs(allTypeCompanyRegs);
      }
      let allPositions = [];
      const encryptedPositions = data?.tokenizedAllPositions || "";
      if (encryptedPositions) {
        const decrypted = jwt.verify(encryptedPositions, TOKENIZE);
        allPositions = decrypted.queryResult;
        setAllPositions(allPositions);
      }

      let allAwardTypes = [];
      const encryptedAwardTypes = data?.tokenizedAllAwardTypes || "";
      if (encryptedAwardTypes) {
        const decrypted = jwt.verify(encryptedAwardTypes, TOKENIZE);
        allAwardTypes = decrypted.queryResult;
        setAllAwardTypes(allAwardTypes);
      }

      const countData = data?.countAgrifoodCompanyProfiles || 0;
      setCountAgrifoodCompanyProfile(countData);
    }
  }, [data, error, loading, savedCount]);

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: AGRIFOO_QUERY_PAGINATED,
      variables: {
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    let allAgrifoodCompanyProfiles = [];
    const encrypted = result.data?.tokenizedAllAgrifoodCompanyProfiles || "";
    if (encrypted) {
      const decrypted = jwt.verify(encrypted, TOKENIZE);
      allAgrifoodCompanyProfiles = decrypted.queryResult;
      setAllAgrifoodCompanyProfiles(allAgrifoodCompanyProfiles);
    }

    const countData = result.data?.countAgrifoodCompanyProfiles || 0;
    setCountAgrifoodCompanyProfile(countData);
    hideLoadingSpinner();
  }, [router.query.filters, pageIndex, pageSize, savedCount]);

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
    if (!router.query.filters) return [];
    try {
      let filters = JSON.parse(router.query.filters);
      return filters;
    } catch (err) {
      console.warn(err);
    }
    return [];
  }, [router.query.filters]);

  // let allAgrifoodCompanyProfiles = [];
  // const encrypted = data?.tokenizedAllAgrifoodCompanyProfiles || "";
  // if (encrypted) {
  //   const decrypted = jwt.verify(encrypted, TOKENIZE);
  //   allAgrifoodCompanyProfiles = decrypted.queryResult;
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

  // let allMachineries = [];
  // const encryptedMachineries = data?.tokenizedAllMachineries || "";
  // if (encryptedMachineries) {
  //   const decrypted = jwt.verify(encryptedMachineries, TOKENIZE);
  //   allMachineries = decrypted.queryResult;
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

  // let allAwardTypes = [];
  // const encryptedAwardTypes = data?.tokenizedAllAwardTypes || "";
  // if (encryptedAwardTypes) {
  //   const decrypted = jwt.verify(encryptedAwardTypes, TOKENIZE);
  //   allAwardTypes = decrypted.queryResult;
  // }

  useEffect(() => {
    const noOfLabourTotal =
      formData.unskilledLocal +
      formData.semiSkilledLocal +
      formData.expertLocal +
      formData.skilledLocal;

    const noOfLabourForeigner = formData?.noOfLabourForeigner || 0;

    const tmpSMECategory = noOfLabourForeigner + noOfLabourTotal;

    // let smeCategory = "";
    // if (tmpSMECategory >= 1 && tmpSMECategory <= 5) {
    //   smeCategory = "Micro";
    // } else if (tmpSMECategory >= 6 && tmpSMECategory <= 50) {
    //   smeCategory = "Small";
    // } else if (tmpSMECategory >= 51 && tmpSMECategory <= 100) {
    //   smeCategory = "Medium";
    // } else {
    //   smeCategory = "Large";
    // }

    setFormData({
      ...formData,
      noOfLabourTotal,
      // smeCategory,
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

    const noOfLabourTotal = formData?.noOfLabourTotal || 0;

    // const tmpSMECategory = noOfLabourForeigner + noOfLabourTotal;

    // let smeCategory = "";
    // if (tmpSMECategory >= 1 && tmpSMECategory <= 5) {
    //   smeCategory = "Micro";
    // } else if (tmpSMECategory >= 6 && tmpSMECategory <= 50) {
    //   smeCategory = "Small";
    // } else if (tmpSMECategory >= 51 && tmpSMECategory <= 100) {
    //   smeCategory = "Medium";
    // } else {
    //   smeCategory = "Large";
    // }
    setFormData({
      ...formData,
      noOfLabourForeigner,
      // smeCategory,
    });
  }, [
    formData.unskilledForeigner,
    formData.semiSkilledForeigner,
    formData.expertForeigner,
    formData.skilledForeigner,
  ]);

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

      render: (props) => {
        return (
          <div className="flex">
            <button
              onClick={(e) => {
                setModalVisible(true);
                setFormData({
                  ...props.row.original,
                  typeOfAwardIds: props.row.original?.typeOfAwardIds || [],
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
      Header: "Company Name",
      accessor: "companyName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Company ID",
      accessor: "companyId",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Type of Company Registration",
      accessor: "typeCompanyRegName",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Company Registration No.",
      accessor: "companyRegNo",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Company Address",
      accessor: "companyAddress",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Company Status",
      accessor: "companyStatusName",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    // {
    //   Header: "Type Of Machinery",
    //   accessor: "machineryNames",
    //   style: {
    //     fontSize: 20,
    //   },
    // },
    {
      Header: "Current Status",
      accessor: "currStatusName",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
  ]);

  return (
    <AdminArea header={{ title: "Company Profile" }} urlQuery={router.query}>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Company profile`}
        size="md"
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            machineryIds: [],
            typeOfAwardIds: [],

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
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { uuid, id, __typename, machineryNames, fileName, ...data } =
              formData;
            // console.log({
            //   formData,
            // });
            if (!uuid) {
              const tokenizedPayload = {
                formData,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await createAgrifoodCompanyProfile({
                variables: {
                  input: {
                    // ...formData,
                    tokenized,
                  },
                },
              });
              setSavedCount((savedCount += 1));
            } else {
              const tokenizedPayload = {
                uuid,
                ...data,
              };
              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await updateAgrifoodCompanyProfile({
                variables: {
                  // uuid,
                  input: {
                    // ...data,
                    tokenized,
                  },
                },
              });
              setSavedCount((savedCount += 1));
            }
            await refetch();
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
            value={formData.companyName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                companyName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Company ID</label>
          <input
            placeholder="Auto Generate"
            disabled
            className="form-control"
            value={formData.companyId || ""}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-5">
          <div>
            <div className="form-group">
              <label>Type of Company Reg</label>
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
                    typeCompanyRegName: found.typesOfCompany,
                  });
                }}
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
              <label>Company Registration Date</label>
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
              />
            </div>
          </div>
          <div>
            <div className="form-group">
              <label>Company Registration Number</label>
              <input
                className="form-control"
                value={formData.companyRegNo || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    companyRegNo: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>ROCBN Registration NO.*</label>
              <input
                required
                className="form-control"
                value={formData.rocbnRegNo || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    rocbnRegNo: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
          </div>
        </div>
        <div className="form-group">
          <label>Company Address*</label>
          <input
            required
            className="form-control"
            value={formData.companyAddress || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                companyAddress: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Mailing Address</label>
          <input
            className="form-control"
            value={formData.mailingAddress || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                mailingAddress: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-5 hidden">
          <div className="form-group">
            <label>Premise Structure</label>
            <select
              className="form-control"
              value={formData.premiseStructure || ""}
              onChange={(e) => {
                if (e) e.preventDefault();

                setFormData({
                  ...formData,
                  premiseStructure: e.target.value,
                });
              }}
            >
              <option value={""} disabled>
                Select Premise Structure
              </option>
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
        </div>
        <div className="form-group">
          <label>Social Media Account</label>
          <input
            className="form-control"
            value={formData.socialMediaAcc || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                socialMediaAcc: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>SME Category</label>
          <input
            disabled
            placeholder="Auto Filled"
            className="form-control"
            value={formData.smeCategory || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                smeCategory: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Manager Name*</label>
          <input
            required
            className="form-control"
            value={formData.managerName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                managerName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-5">
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
                    positionName: found.name,
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
              <label>IC No./Passport No.*</label>
              <input
                required
                className="form-control"
                value={formData.icPassportNo || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    icPassportNo: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Mobile No.*</label>
              <input
                required
                type="text"
                className="form-control"
                value={formData.mobileNo || ""}
                onChange={(e) => {
                  let strRegex = new RegExp(/^[0-9]+$/i);
                  let result = strRegex.test(e.target.value);

                  if (result) {
                    setFormData({
                      ...formData,
                      mobileNo: e.target.value,
                    });
                  }
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
                    raceName: found.race,
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
              <label>Email Address</label>
              <input
                className="form-control"
                value={formData.emailAddress || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    emailAddress: e.target.value,
                  });
                }}
              />
            </div>
          </div>
          <div>
            <div className="form-group">
              <label>Date Of Birth*</label>
              <input
                required
                type="date"
                className="form-control"
                value={formData.dateOfBirth || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    dateOfBirth: e.target.value,
                  });
                }}
              />
            </div>
            <div>
              <div className="form-group">
                <label>IC Colour*</label>
                <select
                  className="form-control"
                  value={formData.icColour || ""}
                  onChange={(e) => {
                    if (e) e.preventDefault();

                    setFormData({
                      ...formData,

                      icColour: e.target.value,
                    });
                  }}
                  required
                >
                  <option value={""} disabled>
                    Select IC Colour
                  </option>
                  <option value={"YELLOW"}>YELLOW</option>
                  <option value={"PURPLE"}>PURPLE</option>
                  <option value={"GREEN"}>GREEN</option>
                  <option value={"N/A"}>N/A</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Telephone No</label>
              <input
                pattern="[0-9]+"
                className="form-control"
                value={formData.telephoneNo || ""}
                onChange={(e) => {
                  let strRegex = new RegExp(/^[0-9]+$/i);
                  let result = strRegex.test(e.target.value);

                  if (result) {
                    setFormData({
                      ...formData,
                      telephoneNo: e.target.value,
                    });
                  }
                }}
              />
            </div>
            <div className="form-group">
              <label>Gender*</label>
              <select
                required
                className="form-control"
                value={formData.gender || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    gender: e.target.value,
                  });
                }}
              >
                <option value={""} disabled>
                  Select Gender
                </option>
                <option value={"MALE"}>MALE</option>
                <option value={"FEMALE"}>FEMALE</option>
              </select>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label>
            Director/Shareholder/Board Member/Official Member (for more than 1,
            please use “/” in between the names)
          </label>
          <textarea
            className="form-control w-100 h-48"
            value={formData.otherMembers || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                otherMembers: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="grid grid-cols-2">
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
                  companyStatusName: found.description,
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

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div>
            <div className="form-group">
              <div className="flex mb-1">
                <p className="text-md mr-2">Total Assets*</p>
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
                <p className="text-md mr-2">Total Annual Revenue*</p>
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

        {/* <p className="text-md">Type Of Machinery:</p>
        <div className="grid grid-cols-4 gap-3">
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
                <label>{machinery.machineName}</label>
              </div>
            );
          })}
        </div> */}

        <p className="text-md hidden">Type Of Awards:</p>
        <div className="grid grid-cols-4 gap-3 hidden">
          {allAwardTypes.map((award) => {
            let isChecked = false;

            const foundIndex = formData.typeOfAwardIds.findIndex(
              (idx) => idx === award.uuid
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
                        typeOfAwardIds: [
                          ...formData.typeOfAwardIds,
                          award.uuid,
                        ],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        typeOfAwardIds: formData.typeOfAwardIds.filter(
                          (p) => p !== award.uuid
                        ),
                      });
                    }
                  }}
                />
                <label>{award.award.toUpperCase()}</label>
              </div>
            );
          })}
        </div>

        <div className="form-group">
          <label>Support/Programme/Training</label>
          <textarea
            className="form-control w-100 h-48"
            value={formData.supportMembers || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                supportMembers: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-5">
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
                  currStatusName: found.status,
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
            <label>Upload File (zip)</label>
            <input
              type="file"
              accept="application/zip"
              className="form-control"
              // value={documentData.url}
              onChange={(e) => {
                if (e) e.preventDefault();

                const file = e.target.files[0];
                let fileName = file.name;
                let reader = new FileReader();
                reader.onloadend = async () => {
                  setFormData({
                    ...formData,
                    fileName,
                    uploadFile: reader.result,
                  });
                  // console.log(reader)
                };
                reader.readAsDataURL(file);
              }}
            />
            {formData.uuid &&
            formData.uploadFile &&
            formData.uploadFile !== "-" ? (
              <div className="mt-2">
                <a
                  className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                  href={formData.uploadFile}
                  target="__blank"
                >
                  Download
                </a>
              </div>
            ) : null}
          </div>
        </div>
        <div className="form-group">
          <label>Remarks</label>
          <textarea
            className="form-control w-100 h-24"
            value={formData.remarks || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                remarks: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <TableAsync
          loading={loading}
          columns={columns}
          data={allAgrifoodCompanyProfiles}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          withoutHeader={true}
          customHeaderUtilities={
            !currentUserDontHavePrivilege([
              "Company Profile Profiling Agrifood Export Excel:Create",
            ]) ? (
              <div className="flex mx-2 items-end">
                <button
                  className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                  onClick={async (e) => {
                    if (e) e.preventDefault();
                    showLoadingSpinner();
                    try {
                      const response = await exportAgrifoodCompanyProfile();

                      downloadExcelFromBuffer(
                        response.data.exportAgrifoodCompanyProfile.data,
                        "company-profile-agrifood"
                      );
                      // window.open(
                      //   response.data.exportAgrifoodCompanyProfile,
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
            !currentUserDontHavePrivilege([
              "Company Profile Profiling Agrifood:Update",
            ])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege([
              "Company Profile Profiling Agrifood:Create",
            ])
              ? async (e) => {
                  if (e) e.preventDefault();
                  showLoadingSpinner();
                  try {
                    // const getCount = await client.query({
                    //   query: COUNT_COMPANY_PROFILE,
                    //   variables: {},
                    //   fetchPolicy: "no-cache",
                    // });
                    // let count = getCount.data.countAgrifoodCompanyProfiles;

                    // let startCode = "AG000";
                    // count = "" + (count + 1);

                    // startCode = startCode.slice(0, count.length * -1) + count;

                    setFormData({
                      typeOfAwardIds: [],
                      unskilledLocal: 0,
                      semiSkilledLocal: 0,
                      expertLocal: 0,
                      skilledLocal: 0,
                      noOfLabourTotal: 0,

                      unskilledForeigner: 0,
                      semiSkilledForeigner: 0,
                      expertForeigner: 0,
                      skilledForeigner: 0,
                      noOfLabourForeigner: 0,
                      companyId: "",
                      fileName: "",
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
            !currentUserDontHavePrivilege([
              "Company Profile Profiling Agrifood:Delete",
            ])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} company profiles?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteAgrifoodCompanyProfile({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                        setSavedCount((savedCount += 1));
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} company profiles deleted`,
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
