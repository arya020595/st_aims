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
    tokenizedAllBioSecuritySubCategories

    tokenizedAllBioSecurityCategories
  }
`;

const CREATE_SUB_CATEGORY = gql`
  mutation tokenizedCreateBioSecuritySubCategory($tokenized: String!) {
    tokenizedCreateBioSecuritySubCategory(tokenized: $tokenized)
  }
`;

const UPDATE_SUB_CATEGORY = gql`
  mutation tokenizedUpdateBioSecuritySubCategory($tokenized: String!) {
    tokenizedUpdateBioSecuritySubCategory(tokenized: $tokenized)
  }
`;

const DELETE_SUB_CATEGORY = gql`
  mutation tokenizedDeleteBioSecuritySubCategory($tokenized: String!) {
    tokenizedDeleteBioSecuritySubCategory(tokenized: $tokenized)
  }
`;

const EXPORTS_SUBCATEGORY = gql`
  mutation exportBioSecuritySubCategory {
    exportBioSecuritySubCategory
  }
`;

const BioSecuritySubCategory = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createBioSecuritySubCategory] = useMutation(CREATE_SUB_CATEGORY);
  const [updateBioSecuritySubCategory] = useMutation(UPDATE_SUB_CATEGORY);
  const [deleteBioSecuritySubCategory] = useMutation(DELETE_SUB_CATEGORY);
  const [exportBioSecuritySubCategory] = useMutation(EXPORTS_SUBCATEGORY);
  const [allBioSecuritySubCategories, setAllBioSecuritySubCategories] =
    useState([]);
  const [allBioSecurityCategories, setAllBioSecurityCategories] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedBioSecuritySubCategories =
        data?.tokenizedAllBioSecuritySubCategories || "";
      let allBioSecuritySubCategories = [];
      if (encryptedBioSecuritySubCategories) {
        const decrypted = jwt.verify(
          encryptedBioSecuritySubCategories,
          TOKENIZE
        );
        allBioSecuritySubCategories = decrypted.queryResult;
        setAllBioSecuritySubCategories(allBioSecuritySubCategories);
      }
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

  // const encryptedBioSecuritySubCategories =
  //   data?.tokenizedAllBioSecuritySubCategories || "";
  // let allBioSecuritySubCategories = [];
  // if (encryptedBioSecuritySubCategories) {
  //   const decrypted = jwt.verify(encryptedBioSecuritySubCategories, TOKENIZE);
  //   allBioSecuritySubCategories = decrypted.queryResult;
  // }

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
                  bioSecurityCategoryUUID:
                    props.row.original?.Category?.uuid || "",
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
    {
      Header: "Category",
      accessor: "Category.name",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
  ]);

  return (
    <AdminArea header={{ title: "Sub Category" }} urlQuery={router.query}>
      <Head>
        <title>Sub Category</title>
      </Head>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Sub Category`}
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
              await createBioSecuritySubCategory({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateBioSecuritySubCategory({
                variables: {
                  ...formData,
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
        <div className="form-group">
          <label>Category</label>
          <select
            className="form-control"
            value={formData.bioSecurityCategoryUUID || ""}
            required
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                bioSecurityCategoryUUID: e.target.value,
              });
            }}
          >
            <option value={""} disabled>
              Select Category
            </option>
            {allBioSecurityCategories.map((cat) => (
              <option value={cat.uuid}>{cat.name.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allBioSecuritySubCategories}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportBioSecuritySubCategory();

                    downloadExcelFromBuffer(
                      response.data.exportBioSecuritySubCategory.data,
                      "bios-sub-category"
                    );

                    // window.open(response.data.exportBioSecuritySubCategory, "__blank")
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
            !currentUserDontHavePrivilege(["Sub Category:Update"])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege(["Sub Category:Create"])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Sub Category:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} categories?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteBioSecuritySubCategory({
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

export default withApollo({ ssr: true })(BioSecuritySubCategory);
