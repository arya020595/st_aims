import React, { useState, useEffect, useMemo, useCallback } from "react";
import { withApollo } from "../../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../../components/App";
import { useNotification } from "../../components/Notification";
import { handleError } from "../../libs/errors";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import TableAsync from "../../components/TableAsync";
import Table from "../../components/Table";
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
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERIES = gql`
  query listQueries($filters: String) {
    countBioSecurityCompanyProfiles(filters: $filters)
  }
`;

const COMMODITY_QUERIES = gql`
  query commodityMasterData($onPage: String) {
    tokenizedAllBioSecurityTypeOfComodities(onPage: $onPage)
  }
`;

const PROFILE_QUERY = gql`
  query profileQuery($pageIndex: Int, $pageSize: Int, $filters: String) {
    tokenizedAllBioSecurityCompanyProfilesPaginated(
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    )
    countBioSecurityCompanyProfiles(filters: $filters)
  }
`;

const GET_TYPE_OF_COMODITY = gql`
  query allBioSecurityTypeOfComoditiesByIds($tokenizedParams: String!) {
    tokenizedllBioSecurityTypeOfComoditiesByIds(
      tokenizedParams: $tokenizedParams
    )
  }
`;

const CREATE_COMPANY_PROFILE = gql`
  mutation tokenizedCreateBioSecurityCompanyProfile($input: JSON) {
    tokenizedCreateBioSecurityCompanyProfile(input: $input)
  }
`;

const UPDATE_COMPANY_PROFILE = gql`
  mutation tokenizedUpdateBioSecurityCompanyProfile($input: JSON) {
    tokenizedUpdateBioSecurityCompanyProfile(input: $input)
  }
`;

const DELETE_COMPANY_PROFILE = gql`
  mutation tokenizedDeleteBioSecurityCompanyProfile($tokenized: String!) {
    tokenizedDeleteBioSecurityCompanyProfile(tokenized: $tokenized)
  }
`;

const GET_NON_COMPLIENCE_LIST = gql`
  query allBioSecurityNonComplienceLists($companyProfileUUID: String!) {
    allBioSecurityNonComplienceLists(companyProfileUUID: $companyProfileUUID) {
      uuid
      date
      officer
    }
  }
`;

const EXPORT_COMPANY_PROFILE = gql`
  mutation exportBioSecurityCompanyProfile {
    exportBioSecurityCompanyProfile
  }
`;

const page = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const client = useApolloClient();
  const [formData, setFormData] = useState({
    typeOfComodityIds: [],
  });
  const [showListCommodity, setShowListCommodity] = useState({
    list: [],
    visible: false,
  });
  const [getNonComplience, setGetNonComplience] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const { data, error, loading, refetch } = useQuery(QUERIES, {
    variables: {
      filters: router.query.filters,
    },
  });
  const [createBioSecurityCompanyProfile] = useMutation(CREATE_COMPANY_PROFILE);
  const [updateBioSecurityCompanyProfile] = useMutation(UPDATE_COMPANY_PROFILE);
  const [deleteBioSecurityCompanyProfile] = useMutation(DELETE_COMPANY_PROFILE);
  const [exportBioSecurityCompanyProfile] = useMutation(EXPORT_COMPANY_PROFILE);

  const [allBioSecurityTypeOfComodities, setAllBioSecurityTypeOfComodities] =
    useState([]);
  const [allBioSecurityCompanyProfiles, setAllBioSecurityCompanyProfiles] =
    useState([]);
  let [savedCount, setSavedCount] = useState(0);

  let [countBioSecurityCompanyProfiles, setCountBioSecurityCompanyProfiles] =
    useState(0);
  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countBioSecurityCompanyProfiles) return 1;
    return Math.ceil(countBioSecurityCompanyProfiles / pageSize);
  }, [countBioSecurityCompanyProfiles, pageSize]);

  useEffect(() => {
    if (!loading && !error) {
      // const encryptedBioSecurityTypeOfComodities =
      //   data?.tokenizedAllBioSecurityTypeOfComodities || "";
      // let allBioSecurityTypeOfComodities = [];
      // if (encryptedBioSecurityTypeOfComodities) {
      //   const decrypted = jwt.verify(
      //     encryptedBioSecurityTypeOfComodities,
      //     TOKENIZE
      //   );
      //   allBioSecurityTypeOfComodities = decrypted.queryResult;
      //   setAllBioSecurityTypeOfComodities(allBioSecurityTypeOfComodities);
      // }
      // const encryptedBioSecurityCompanyProfiles =
      //   data?.tokenizedAllBioSecurityCompanyProfiles || "";
      // let allBioSecurityCompanyProfiles = [];
      // if (encryptedBioSecurityCompanyProfiles) {
      //   const decrypted = jwt.verify(
      //     encryptedBioSecurityCompanyProfiles,
      //     TOKENIZE
      //   );
      //   allBioSecurityCompanyProfiles = decrypted.queryResult;
      //   setAllBioSecurityCompanyProfiles(allBioSecurityCompanyProfiles);
      // }
      const countData = data?.countBioSecurityCompanyProfiles || 0;
      setCountBioSecurityCompanyProfiles(countData);
    }
  }, [data, loading, error, savedCount]);

  useEffect(async () => {
    if (modalVisible) {
      showLoadingSpinner();
      const result = await client.query({
        query: COMMODITY_QUERIES,
        variables: {
          onPage: "BIOSECURITY IMPORT DATA",
        },
        fetchPolicy: "no-cache",
      });
      const encryptedBioSecurityTypeOfComodities =
        result.data?.tokenizedAllBioSecurityTypeOfComodities || "";
      let allBioSecurityTypeOfComodities = [];
      if (encryptedBioSecurityTypeOfComodities) {
        const decrypted = jwt.verify(
          encryptedBioSecurityTypeOfComodities,
          TOKENIZE
        );
        allBioSecurityTypeOfComodities = decrypted.queryResult;
        setAllBioSecurityTypeOfComodities(allBioSecurityTypeOfComodities);
      }
      hideLoadingSpinner();
    }
  }, [modalVisible]);

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: PROFILE_QUERY,
      variables: {
        pageIndex,
        pageSize,
        filters: router.query.filters,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedBioSecurityCompanyProfiles =
      result.data?.tokenizedAllBioSecurityCompanyProfilesPaginated || "";
    let allBioSecurityCompanyProfiles = [];
    if (encryptedBioSecurityCompanyProfiles) {
      const decrypted = jwt.verify(
        encryptedBioSecurityCompanyProfiles,
        TOKENIZE
      );
      allBioSecurityCompanyProfiles = decrypted.queryResult;
      setAllBioSecurityCompanyProfiles(allBioSecurityCompanyProfiles);
    }

    const countData = result.data?.countBioSecurityCompanyProfiles || 0;
    setCountBioSecurityCompanyProfiles(countData);
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

  // let allBioSecurityTypeOfComodities = [];
  // const encryptedBioSecurityTypeOfComodities =
  //   data?.tokenizedAllBioSecurityTypeOfComodities || "";
  // if (encryptedBioSecurityTypeOfComodities) {
  //   const decrypted = jwt.verify(
  //     encryptedBioSecurityTypeOfComodities,
  //     TOKENIZE
  //   );
  //   allBioSecurityTypeOfComodities = decrypted.queryResult;
  // }

  // let allBioSecurityCompanyProfiles = [];
  // const encryptedBioSecurityCompanyProfiles =
  //   data?.tokenizedAllBioSecurityCompanyProfiles || "";
  // if (encryptedBioSecurityCompanyProfiles) {
  //   const decrypted = jwt.verify(encryptedBioSecurityCompanyProfiles, TOKENIZE);
  //   allBioSecurityCompanyProfiles = decrypted.queryResult;
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
                const getComplienceList = await client.query({
                  query: GET_NON_COMPLIENCE_LIST,
                  variables: {
                    companyProfileUUID: props.row.original.uuid || "",
                  },
                });

                setModalVisible(true);
                setFormData({
                  ...props.row.original,
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
      Header: "Company Status",
      accessor: "status",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Company ID",
      accessor: "companyId",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Business Certificate",
      accessor: "companyRegNo",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
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
      Header: "Company's Owner Name",
      accessor: "companyOwnerName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "IC No.",
      accessor: "icNo",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
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
      Header: "Approved Categories Of Commodities",
      accessor: "typeOfComodityIds",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => (
        <button
          className="w-full bg-blue-500 text-white font-bold rounded-md shadow-md py-2"
          onClick={openComodity(props.value)}
        >
          {props.value.length}
        </button>
      ),
    },

    {
      Header: "Upload File",
      accessor: "uploadFile",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
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

  const commodityListColumn = useMemo(() => [
    {
      Header: "Type of Comodity",
      accessor: "name",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
  ]);

  const openComodity = (ids) => async (e) => {
    showLoadingSpinner();
    let queryResult = [];
    try {
      const payload = {
        ids,
      };

      const tokenizedParams = jwt.sign(payload, TOKENIZE);
      const result = await client.query({
        query: GET_TYPE_OF_COMODITY,
        variables: {
          tokenizedParams,
        },
      });

      const tokenizedllBioSecurityTypeOfComoditiesByIds =
        result.data.tokenizedllBioSecurityTypeOfComoditiesByIds || "";

      if (tokenizedllBioSecurityTypeOfComoditiesByIds) {
        const decrypted = jwt.verify(
          tokenizedllBioSecurityTypeOfComoditiesByIds,
          TOKENIZE
        );
        queryResult = decrypted.queryResult;
      }

      setShowListCommodity({
        visible: true,
        list: queryResult,
      });
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  // console.log(showListCommodity.list);
  return (
    <AdminArea header={{ title: "Company Profile" }} urlQuery={router.query}>
      <FormModal
        title={`Type of Commodity`}
        visible={showListCommodity.visible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setShowListCommodity({
            list: [],
            visible: false,
          });
        }}
      >
        <Table
          columns={commodityListColumn}
          data={showListCommodity.list}
          loading={false}
          withoutHeader={true}
        />
      </FormModal>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Company profile`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            typeOfComodityIds: [],
          });
        }}
        onCustomCloseBackDrop={true}
        size={!formData.uuid ? "md" : "lg"}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { uuid, id, __typename, ...data } = formData;
            // console.log({
            //   formData,
            // });
            if (!uuid) {
              const tokenizedPayload = {
                formData,
              };

              const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
              await createBioSecurityCompanyProfile({
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
              await updateBioSecurityCompanyProfile({
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
            notification.addNotification({
              title: "Succeess!",
              message: `Company Profile saved!`,
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
          <label>Company Status</label>
          <select
            className="form-control"
            value={formData.status || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                status: e.target.value,
              });
            }}
            required
          >
            <option value={""} disabled>
              Select Status
            </option>
            <option value={"Active"}>ACTIVE</option>
            <option value={"Inactive"}>INACTIVE</option>
            <option value={"Terminated"}>TERMINATED</option>
          </select>
        </div>

        <div className="form-group">
          <label>Company ID</label>
          <input
            disabled
            placeholder="Auto Generate"
            className="form-control"
            value={formData.companyId || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                companyId: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Business Certificate.</label>
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
        <div className="grid grid-cols-2 gap-x-5">
          <div className="form-group">
            <label>Importer Registration (MPRT Registration - Corp)</label>
            <input
              className="form-control"
              value={formData.companyCropRegNo || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  companyCropRegNo: e.target.value.toUpperCase(),
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Importer Registration (MPRT Registration - Animal)</label>
            <input
              className="form-control"
              value={formData.companyAnimalRegNo || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  companyAnimalRegNo: e.target.value.toUpperCase(),
                });
              }}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Registered Date</label>
          <input
            type="date"
            className="form-control"
            value={formData.companyRegDate || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                companyRegDate: e.target.value,
              });
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-5">
          <div>
            <div className="form-group">
              <label>Registered Date (Crop)</label>
              <input
                type="date"
                className="form-control"
                value={formData.companyCropRegDate || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    companyCropRegDate: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Renewal Date (Crop)</label>
              <input
                type="date"
                className="form-control"
                value={formData.companyCropRenewalDate || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    companyCropRenewalDate: e.target.value,
                  });
                }}
              />
            </div>
          </div>
          <div>
            <div className="form-group">
              <label>Registered Date (Animal)</label>
              <input
                type="date"
                className="form-control"
                value={formData.companyAnimalRegDate || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    companyAnimalRegDate: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Renewal Date (Animal)</label>
              <input
                type="date"
                className="form-control"
                value={formData.companyAnimalRenewalDate || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    companyAnimalRenewalDate: e.target.value,
                  });
                }}
              />
            </div>
          </div>
        </div>
        <div className="form-group">
          <label>Company Name</label>
          <input
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
          <label>Company's Owner Name</label>
          <input
            className="form-control"
            value={formData.companyOwnerName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                companyOwnerName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>IC No. (Example: 11111111)</label>
          <input
            className="form-control"
            value={formData.icNo || ""}
            onChange={(e) => {
              let strRegex = new RegExp(/^[0-9]+$/i);
              let result = strRegex.test(e.target.value);

              if (result) {
                setFormData({
                  ...formData,
                  icNo: e.target.value,
                });
              } else {
                setFormData({
                  ...formData,
                  icNo: "",
                });
              }
            }}
          />
        </div>
        <div className="form-group">
          <label>Contact Details</label>
          <input
            className="form-control"
            value={formData.contactDetails || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                contactDetails: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Company Address</label>
          <input
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
          <label>
            Field / Premises / Factory Address (for more than 1 address, use "/"
            between the address)
          </label>
          <textarea
            className="form-control w-100 h-48"
            value={formData.otherAddress || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                otherAddress: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <label>Approved Categories Of Commodities</label>
        <div className="grid grid-cols-4 mb-5">
          {allBioSecurityTypeOfComodities.map((com) => {
            let isChecked = false;

            const foundIndex = formData.typeOfComodityIds.findIndex(
              (idx) => idx === com.uuid
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
                        typeOfComodityIds: [
                          ...formData.typeOfComodityIds,
                          com.uuid,
                        ],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        typeOfComodityIds: formData.typeOfComodityIds.filter(
                          (p) => p !== com.uuid
                        ),
                      });
                    }
                  }}
                />
                <label>{com.name.toUpperCase()}</label>
              </div>
            );
          })}
        </div>
        <div className="form-group">
          <label>Approved Suppliers / Exporters</label>
          <textarea
            className="form-control w-100 h-48"
            value={formData.approvedSuppliers || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                approvedSuppliers: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Approved Suppliers / Exporters Address</label>
          <textarea
            className="form-control w-100 h-48"
            value={formData.approvedSupplirersAddress || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                approvedSupplirersAddress: e.target.value.toUpperCase(),
              });
            }}
          />
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

        {formData.uuid ? (
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
        ) : null}
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <TableAsync
          loading={loading}
          columns={columns}
          data={allBioSecurityCompanyProfiles}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  showLoadingSpinner();
                  try {
                    const response = await exportBioSecurityCompanyProfile();

                    downloadExcel(
                      response.data.exportBioSecurityCompanyProfile.data
                    );
                    // window.open(
                    //   response.data.exportBioSecurityCompanyProfile,
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
          }
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege([
              "Company Profile Profiling Bio Security:Update",
            ])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege([
              "Company Profile Profiling Bio Security:Create",
            ])
              ? (e) => {
                  if (e) e.preventDefault();
                  // let startCode = "BSC000";
                  // let count = "" + (countBioSecurityCompanyProfiles + 1);

                  // startCode = startCode.slice(0, count.length * -1) + count;

                  setFormData({
                    typeOfComodityIds: [],
                    companyId: "",
                  });
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege([
              "Company Profile Profiling Bio Security:Delete",
            ])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  if (
                    confirm("Are you sure to delete this company profile ?")
                  ) {
                    try {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteBioSecurityCompanyProfile({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }

                      await refetch();
                      notification.addNotification({
                        title: "Succeess!",
                        message: `Company Profile deleted!`,
                        level: "success",
                      });
                    } catch (err) {
                      notification.handleError(err);
                    }
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

const downloadExcel = async (fileBuffer) => {
  const byteArray = Array.isArray(fileBuffer)
    ? Uint8Array.from(fileBuffer)
    : new Uint8Array(fileBuffer || []);

  const blob = new Blob([byteArray], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "company-profile");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  return {
    success: true,
    error: "",
  };
};
