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
    #allUnits {
    #  id
    #  uuid
    #  name
    #  description
    #}
    tokenizedAllUnits
  }
`;

const CREATE_UNIT = gql`
  mutation createUnit(
    #$name: String!
    #$description: String!
    $tokenized: String!
  ) {
    createUnit(
      #name: $name
      #description: $description
      tokenized: $tokenized
    )
  }
`;

const UPDATE_UNIT = gql`
  mutation updateUnit(
    #$uuid: String!
    #$name: String
    #$description: String
    $tokenized: String!
  ) {
    updateUnit(
      #uuid: $uuid
      #name: $name
      #description: $description
      tokenized: $tokenized
    )
  }
`;

const DELETE_UNIT = gql`
  mutation deleteUnit(
    #$uuid: String!
    $tokenized: String!
  ) {
    deleteUnit(
      #uuid: $uuid
      tokenized: $tokenized
    )
  }
`;

const EXPORT_UNIT = gql`
  mutation exportUnit {
    exportUnit
  }
`;

const page = () => {
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createUnit] = useMutation(CREATE_UNIT);
  const [updateUnit] = useMutation(UPDATE_UNIT);
  const [deleteUnit] = useMutation(DELETE_UNIT);
  const [exportUnit] = useMutation(EXPORT_UNIT);
  const [allUnits, setAllUnits] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedUnits = data?.tokenizedAllUnits || "";
      let allUnits = [];
      if (encryptedUnits) {
        const decrypted = jwt.verify(encryptedUnits, TOKENIZE);
        allUnits = decrypted.queryResult;
        setAllUnits(allUnits);
      }
    }
  }, [data, loading, error]);

  // const encryptedUnits = data?.tokenizedAllUnits || "";
  // let allUnits = [];
  // if (encryptedUnits) {
  //   const decrypted = jwt.verify(encryptedUnits, TOKENIZE);
  //   allUnits = decrypted.queryResult;
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
      Header: "Unit Name",
      accessor: "name",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Unit Description",
      accessor: "description",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
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

              await createUnit({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);

              await updateUnit({
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
          <label>Unit Name</label>
          <input
            className="form-control"
            value={(formData.name || "").toUpperCase()}
            onChange={(e) => {
              setFormData({
                ...formData,
                name: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Unit Description</label>
          <textarea
            className="form-control"
            value={(formData.description || "").toUpperCase()}
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
          data={allUnits}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportUnit();

                    downloadExcelFromBuffer(
                      response.data.exportUnit.data,
                      "livestoc-unit-livestock"
                    );
                    // window.open(response.data.exportUnit, "__blank");
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
            !currentUserDontHavePrivilege(["Livestock Unit:Update"])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege(["Livestock Unit:Create"])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Livestock Unit:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} tests?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);

                        await deleteUnit({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} tests deleted`,
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
