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
    tokenizedAllBioSecurityCategories
  }
`;

const CREATE_CATEGORY = gql`
  mutation tokenizedCreateBioSecurityCategory($tokenized: String!) {
    tokenizedCreateBioSecurityCategory(tokenized: $tokenized)
  }
`;

const UPDATE_CATEGORY = gql`
  mutation tokenizedUpdateBioSecurityCategory($tokenized: String!) {
    tokenizedUpdateBioSecurityCategory(tokenized: $tokenized)
  }
`;

const DELETE_CATEGORY = gql`
  mutation tokenizedDeleteBioSecurityCategory($tokenized: String!) {
    tokenizedDeleteBioSecurityCategory(tokenized: $tokenized)
  }
`;

const EXPORT_CATEGORY = gql`
  mutation exportBioSecurityCategory {
    exportBioSecurityCategory
  }
`;

const BioSecurityCategory = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createBioSecurityCategory] = useMutation(CREATE_CATEGORY);
  const [updateBioSecurityCategory] = useMutation(UPDATE_CATEGORY);
  const [deleteBioSecurityCategory] = useMutation(DELETE_CATEGORY);
  const [exportBioSecurityCategory] = useMutation(EXPORT_CATEGORY);
  const [allBioSecurityCategories, setAllBioSecurityCategories] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedBioSecurityCategories =
        data?.tokenizedAllBioSecurityCategories || "";
      let allBioSecurityCategories = [];
      if (encryptedBioSecurityCategories) {
        const decrypted = jwt.verify(encryptedBioSecurityCategories, TOKENIZE);
        allBioSecurityCategories = decrypted.queryResult;
        setAllBioSecurityCategories(allBioSecurityCategories);
      }
    }
  }, [data, loading, error]);

  // const encryptedBioSecurityCategories =
  //   data?.tokenizedAllBioSecurityCategories || "";
  // let allBioSecurityCategories = [];
  // if (encryptedBioSecurityCategories) {
  //   const decrypted = jwt.verify(encryptedBioSecurityCategories, TOKENIZE);
  //   allBioSecurityCategories = decrypted.queryResult;
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
    <AdminArea header={{ title: "Category" }} urlQuery={router.query}>
      <Head>
        <title>Category</title>
      </Head>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Category`}
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
              await createBioSecurityCategory({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateBioSecurityCategory({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Category saved!`,
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
          data={allBioSecurityCategories}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportBioSecurityCategory();

                    downloadExcelFromBuffer(
                      response.data.exportBioSecurityCategory.data,
                      "bios-category"
                    );

                    // window.open(response.data.exportBioSecurityCategory, "__blank")
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
            !currentUserDontHavePrivilege(["Category:Update"])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege(["Category:Create"])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Category:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} categories?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteBioSecurityCategory({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} categories deleted`,
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

export default withApollo({ ssr: true })(BioSecurityCategory);
