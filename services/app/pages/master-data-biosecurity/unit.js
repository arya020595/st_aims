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
    tokenizedAllBioSecurityUnits
  }
`;

const CREATE_UNIT = gql`
  mutation tokenizedCreateBioSecurityUnit($tokenized: String!) {
    tokenizedCreateBioSecurityUnit(tokenized: $tokenized)
  }
`;

const UPDATE_UNIT = gql`
  mutation tokenizedUpdateBioSecurityUnit($tokenized: String!) {
    tokenizedUpdateBioSecurityUnit(tokenized: $tokenized)
  }
`;

const DELETE_UNIT = gql`
  mutation tokenizedDeleteBioSecurityUnit($tokenized: String!) {
    tokenizedDeleteBioSecurityUnit(tokenized: $tokenized)
  }
`;

const EXPORT_UNIT = gql`
  mutation exportBioSecurityUnit {
    exportBioSecurityUnit
  }
`;

const BioSecurityUnit = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createBioSecurityUnit] = useMutation(CREATE_UNIT);
  const [updateBioSecurityUnit] = useMutation(UPDATE_UNIT);
  const [deleteBioSecurityUnit] = useMutation(DELETE_UNIT);
  const [exportBioSecurityUnit] = useMutation(EXPORT_UNIT);
  const [allBioSecurityUnits, setAllBioSecurityUnits] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedBioSecurityUnits =
        data?.tokenizedAllBioSecurityUnits || "";
      let allBioSecurityUnits = [];
      if (encryptedBioSecurityUnits) {
        const decrypted = jwt.verify(encryptedBioSecurityUnits, TOKENIZE);
        allBioSecurityUnits = decrypted.queryResult;
        setAllBioSecurityUnits(allBioSecurityUnits);
      }
    }
  }, [data, loading, error]);

  // const encryptedBioSecurityUnits = data?.tokenizedAllBioSecurityUnits || "";
  // let allBioSecurityUnits = [];
  // if (encryptedBioSecurityUnits) {
  //   const decrypted = jwt.verify(encryptedBioSecurityUnits, TOKENIZE);
  //   allBioSecurityUnits = decrypted.queryResult;
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
    <AdminArea header={{ title: "Unit" }} urlQuery={router.query}>
      <Head>
        <title>Unit</title>
      </Head>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Unit`}
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
              await createBioSecurityUnit({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateBioSecurityUnit({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Unit saved!`,
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
          data={allBioSecurityUnits}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportBioSecurityUnit();

                    downloadExcelFromBuffer(
                      response.data.exportBioSecurityUnit.data,
                      "bios-unit"
                    );
                    // window.open(response.data.exportBioSecurityUnit, "__blank")
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
            !currentUserDontHavePrivilege(["Unit Bio Security:Update"])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege(["Unit Bio Security:Create"])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Unit Bio Security:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} units?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteBioSecurityUnit({
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

export default withApollo({ ssr: true })(BioSecurityUnit);
