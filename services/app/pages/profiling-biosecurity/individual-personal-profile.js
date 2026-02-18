import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../../components/App";
import { useNotification } from "../../components/Notification";
import { handleError } from "../../libs/errors";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
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
import Head from "next/dist/next-server/lib/head";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries {
    tokenizedAllBioSecurityIndividualProfiles
  }
`;

const CREATE_INDIVIDUAL_PROFILE = gql`
  mutation tokenizedCreateBioSecurityIndividualProfile($tokenized: String!) {
    tokenizedCreateBioSecurityIndividualProfile(tokenized: $tokenized)
  }
`;

const UPDATE_INDIVIDUAL_PROFILE = gql`
  mutation tokenizedUpdateBioSecurityIndividualProfile($tokenized: String!) {
    tokenizedUpdateBioSecurityIndividualProfile(tokenized: $tokenized)
  }
`;

const DELETE_INDIVIDUAL_PROFILE = gql`
  mutation tokenizedDeleteBioSecurityIndividualProfile($tokenized: String!) {
    tokenizedDeleteBioSecurityIndividualProfile(tokenized: $tokenized)
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

const EXPORT_INDIVIDUAL_PROFILE = gql`
  mutation exportBioSecurityIndividualProfile {
    exportBioSecurityIndividualProfile
  }
`;

const page = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const client = useApolloClient();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();
  const [getNonComplience, setGetNonComplience] = useState([]);

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createBioSecurityIndividualProfile] = useMutation(
    CREATE_INDIVIDUAL_PROFILE
  );
  const [exportBioSecurityIndividualProfile] = useMutation(
    EXPORT_INDIVIDUAL_PROFILE
  );
  const [updateBioSecurityIndividualProfile] = useMutation(
    UPDATE_INDIVIDUAL_PROFILE
  );
  const [deleteBioSecurityIndividualProfile] = useMutation(
    DELETE_INDIVIDUAL_PROFILE
  );

  const [
    allBioSecurityIndividualProfiles,
    setAllBioSecurityIndividualProfiles,
  ] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedBioSecurityIndividualProfiles =
        data?.tokenizedAllBioSecurityIndividualProfiles || "";
      let allBioSecurityIndividualProfiles = [];
      if (encryptedBioSecurityIndividualProfiles) {
        const decrypted = jwt.verify(
          encryptedBioSecurityIndividualProfiles,
          TOKENIZE
        );
        allBioSecurityIndividualProfiles = decrypted.queryResult;
        setAllBioSecurityIndividualProfiles(allBioSecurityIndividualProfiles);
      }
    }
  }, [data, loading, error]);

  // let allBioSecurityIndividualProfiles = [];
  // const encryptedBioSecurityIndividualProfiles =
  //   data?.tokenizedAllBioSecurityIndividualProfiles || "";
  // if (encryptedBioSecurityIndividualProfiles) {
  //   const decrypted = jwt.verify(
  //     encryptedBioSecurityIndividualProfiles,
  //     TOKENIZE
  //   );
  //   allBioSecurityIndividualProfiles = decrypted.queryResult;
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
                    individualProfileUUID: props.row.original.uuid || "",
                  },
                });

                setModalVisible(true);
                setFormData({
                  ...props.row.original,
                });
                setGetNonComplience(
                  getComplienceList.data.allBioSecurityNonComplienceLists.map(
                    (lists, index) => {
                      return {
                        nc: "NC" + (index + 1),
                        ...lists,
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
      Header: "Name",
      accessor: "name",
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
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Contact Number",
      accessor: "contactNumber",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Address",
      accessor: "address",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
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

  return (
    <AdminArea
      header={{ title: "individual / Personal Profile" }}
      urlQuery={router.query}
    >
      <FormModal
        title={`${
          !formData.uuid ? "New" : "Edit"
        } individual / Personal Profile`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({});
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            const { uuid, __typename } = formData;
            if (!uuid) {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await createBioSecurityIndividualProfile({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateBioSecurityIndividualProfile({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Sub Category saved!`,
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
          <label>Name</label>
          <input
            className="form-control"
            value={formData.name || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                name: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>IC No.</label>
          <input
            className="form-control"
            value={formData.icNo || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                icNo: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Contact Number</label>
          <input
            className="form-control"
            value={formData.contactNumber || ""}
            onChange={(e) => {
              let strRegex = new RegExp(/^[a-z0-9]+$/i);
              let result = strRegex.test(e.target.value);

              if (result) {
                setFormData({
                  ...formData,
                  contactNumber: e.target.value,
                });
              } else {
                setFormData({
                  ...formData,
                  contactNumber: "",
                });
              }
            }}
          />
        </div>
        <div className="form-group">
          <label>Address</label>
          <input
            className="form-control"
            value={formData.address || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                address: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>

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
        <Table
          loading={loading}
          columns={columns}
          data={allBioSecurityIndividualProfiles}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  showLoadingSpinner();
                  try {
                    const response = await exportBioSecurityIndividualProfile();

                    downloadExcelFromBuffer(
                      response.data.exportBioSecurityIndividualProfile.data,
                      "individual-personal-profile"
                    );
                    // window.open(
                    //   response.data.exportBioSecurityIndividualProfile,
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
              "Individual / Personal Profile:Update",
            ])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege([
              "Individual / Personal Profile:Create",
            ])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege([
              "Individual / Personal Profile:Delete",
            ])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} profiles?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteBioSecurityIndividualProfile({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} profiles deleted`,
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
