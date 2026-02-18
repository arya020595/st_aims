import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../../components/App";
import { useNotification } from "../../components/Notification";
import { handleError } from "../../libs/errors";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Table from "../../components/Table";
import { useQuery, useLazyQuery, useMutation } from "@apollo/client";
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
    tokenizedAllBioSecurityCompliances
  }
`;

const CREATE_COMPLIANCE = gql`
  mutation tokenizedCreateBioSecurityCompliance($tokenized: String!) {
    tokenizedCreateBioSecurityCompliance(tokenized: $tokenized)
  }
`;

const UPDATE_COMPLIANCE = gql`
  mutation tokenizedUpdateBioSecurityCompliance($tokenized: String!) {
    tokenizedUpdateBioSecurityCompliance(tokenized: $tokenized)
  }
`;

const DELETE_COMPLIANCE = gql`
  mutation tokenizedDeleteBioSecurityCompliance($tokenized: String!) {
    tokenizedDeleteBioSecurityCompliance(tokenized: $tokenized)
  }
`;

const EXPORT_COMPLIANCE = gql`
  mutation exportBioSecurityCompliance {
    exportBioSecurityCompliance
  }
`;

const BioSecurityCompliance = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createBioSecurityCompliance] = useMutation(CREATE_COMPLIANCE);
  const [updateBioSecurityCompliance] = useMutation(UPDATE_COMPLIANCE);
  const [deleteBioSecurityCompliance] = useMutation(DELETE_COMPLIANCE);
  const [exportBioSecurityCompliance] = useMutation(EXPORT_COMPLIANCE);
  const [allBioSecurityCompliances, setAllBioSecurityCompliances] = useState(
    []
  );

  useEffect(() => {
    if (!loading && !error) {
      const encryptedBioSecurityCompliances =
        data?.tokenizedAllBioSecurityCompliances || "";
      let allBioSecurityCompliances = [];
      if (encryptedBioSecurityCompliances) {
        const decrypted = jwt.verify(encryptedBioSecurityCompliances, TOKENIZE);
        allBioSecurityCompliances = decrypted.queryResult;
        setAllBioSecurityCompliances(allBioSecurityCompliances);
      }
    }
  }, [data, loading, error]);

  // const encryptedBioSecurityCompliances =
  //   data?.tokenizedAllBioSecurityCompliances || "";
  // let allBioSecurityCompliances = [];
  // if (encryptedBioSecurityCompliances) {
  //   const decrypted = jwt.verify(encryptedBioSecurityCompliances, TOKENIZE);
  //   allBioSecurityCompliances = decrypted.queryResult;
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
              onClick={(e) => {
                setModalVisible(true);
                setFormData({
                  ...props.row.original,
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
      Header: "Name",
      accessor: "name",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Description",
      accessor: "description",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
  ]);

  return (
    <AdminArea header={{ title: "Compliance" }} urlQuery={router.query}>
      <Head>
        <title>Compliance</title>
      </Head>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Compliance`}
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
              await createBioSecurityCompliance({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateBioSecurityCompliance({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Compliance saved!`,
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
          <label>Description</label>
          <textarea
            className="form-control"
            value={formData.description || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                description: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allBioSecurityCompliances}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportBioSecurityCompliance();

                    downloadExcelFromBuffer(
                      response.data.exportBioSecurityCompliance.data,
                      "bios-compliance"
                    );
                    // window.open(response.data.exportBioSecurityCompliance, "__blank")
                  } catch (error) {
                    notification.handleError(error);
                  }
                }}
              >
                Export Excel
              </button>
            </div>
          }
          customUtilities={
            !currentUserDontHavePrivilege(["Compliance:Update"])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege(["Compliance:Create"])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Compliance:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} units?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteBioSecurityCompliance({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} units deleted`,
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

export default withApollo({ ssr: true })(BioSecurityCompliance);
