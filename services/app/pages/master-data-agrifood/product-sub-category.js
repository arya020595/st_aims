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
import Head from "next/head";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries {
    tokenizedAllAgrifoodProductSubCategories
    tokenizedAllAgrifoodProductCategories
  }
`;

const CREATE_SUB_CATEGORY = gql`
  mutation tokenizedCreateAgrifoodProductSubCategory($tokenized: String!) {
    tokenizedCreateAgrifoodProductSubCategory(tokenized: $tokenized)
  }
`;

const UPDATE_SUB_CATEGORY = gql`
  mutation tokenizedUpdateAgrifoodProductSubCategory($tokenized: String!) {
    tokenizedUpdateAgrifoodProductSubCategory(tokenized: $tokenized)
  }
`;

const DELETE_SUB_CATEGORY = gql`
  mutation tokenizedDeleteAgrifoodProductSubCategory($tokenized: String!) {
    tokenizedDeleteAgrifoodProductSubCategory(tokenized: $tokenized)
  }
`;

const EXPORT_SUB_CATEGORY = gql`
  mutation exportSubCategory {
    exportSubCategory
  }
`;

const page = () => {
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const { data, loading, error, refetch } = useQuery(QUERY);
  const [createAgrifoodProductSubCategory] = useMutation(CREATE_SUB_CATEGORY);
  const [updateAgrifoodProductSubCategory] = useMutation(UPDATE_SUB_CATEGORY);
  const [deleteAgrifoodProductSubCategory] = useMutation(DELETE_SUB_CATEGORY);
  const [exportSubCategory] = useMutation(EXPORT_SUB_CATEGORY);
  const [allAgrifoodProductSubCategories, setAllAgrifoodProductSubCategories] =
    useState([]);
  const [allAgrifoodProductCategories, setAllAgrifoodProductCategories] =
    useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedAgrifoodProductSubCategories =
        data?.tokenizedAllAgrifoodProductSubCategories || "";
      let allAgrifoodProductSubCategories = [];
      if (encryptedAgrifoodProductSubCategories) {
        const decrypted = jwt.verify(
          encryptedAgrifoodProductSubCategories,
          TOKENIZE
        );
        allAgrifoodProductSubCategories = decrypted.queryResult;
        setAllAgrifoodProductSubCategories(allAgrifoodProductSubCategories);
      }
      const encryptedAgrifoodProductCategories =
        data?.tokenizedAllAgrifoodProductCategories || "";
      let allAgrifoodProductCategories = [];
      if (encryptedAgrifoodProductCategories) {
        const decrypted = jwt.verify(
          encryptedAgrifoodProductCategories,
          TOKENIZE
        );
        allAgrifoodProductCategories = decrypted.queryResult;
        setAllAgrifoodProductCategories(allAgrifoodProductCategories);
      }
    }
  }, [data, loading, error]);

  // const encryptedAgrifoodProductSubCategories =
  //   data?.tokenizedAllAgrifoodProductSubCategories || "";
  // let allAgrifoodProductSubCategories = [];
  // if (encryptedAgrifoodProductSubCategories) {
  //   const decrypted = jwt.verify(
  //     encryptedAgrifoodProductSubCategories,
  //     TOKENIZE
  //   );
  //   allAgrifoodProductSubCategories = decrypted.queryResult;
  // }

  // const encryptedAgrifoodProductCategories =
  //   data?.tokenizedAllAgrifoodProductCategories || "";
  // let allAgrifoodProductCategories = [];
  // if (encryptedAgrifoodProductCategories) {
  //   const decrypted = jwt.verify(encryptedAgrifoodProductCategories, TOKENIZE);
  //   allAgrifoodProductCategories = decrypted.queryResult;
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
      Header: "ID",
      accessor: "subCategoryId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Category",
      accessor: "productCategoryNameEnglish",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Sub-Category",
      accessor: "subCategoryNameMalay",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Sub-Category Eng",
      accessor: "subCategoryNameEnglish",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
  ]);

  return (
    <AdminArea
      header={{ title: "Sub Product Category" }}
      urlQuery={router.query}
    >
      <Head>
        <title>Sub Product Category</title>
      </Head>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Sub Product Category`}
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
              await createAgrifoodProductSubCategory({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateAgrifoodProductSubCategory({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Sub Product Category saved!`,
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
          <label>ID</label>
          <input
            className="form-control"
            placeholder="Enter ID"
            value={formData.subCategoryId || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                subCategoryId: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Product Category</label>
          <select
            className="form-control"
            value={formData.productCategoryUUID || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              const found = allAgrifoodProductCategories.find(
                (cat) => cat.uuid === e.target.value
              );
              setFormData({
                ...formData,
                productCategoryUUID: found.uuid,
                productCategoryNameEnglish: found.productNameEnglish || "",
                productCategoryNameMalay: found.productNameMalay || "",
              });
            }}
          >
            <option value={""} disabled>
              Select Product Category
            </option>
            {allAgrifoodProductCategories.map((cat) => (
              <option value={cat.uuid}>{cat.productNameEnglish.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Sub Category Name (English)</label>
          <input
            className="form-control"
            placeholder="Enter ID"
            value={formData.subCategoryNameEnglish || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                subCategoryNameEnglish: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Sub Category Name (Malay)</label>
          <input
            className="form-control"
            placeholder="Enter ID"
            value={formData.subCategoryNameMalay || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                subCategoryNameMalay: e.target.value.toUpperCase,
              });
            }}
          />
        </div>
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allAgrifoodProductSubCategories}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportSubCategory();

                    downloadExcelFromBuffer(
                      response.data.exportSubCategory.data,
                      "sub-product-category-agrifood"
                    );
                    // window.open(response.data.exportSubCategory, "__blank");
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
            !currentUserDontHavePrivilege(["Sub Product Category:Update"])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege(["Sub Product Category:Create"])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Sub Product Category:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} sub categories?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteAgrifoodProductSubCategory({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} sub categories deleted`,
                        level: "success",
                      });
                      await refetch();
                    }
                  } catch (err) {
                    handleError(err);
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
