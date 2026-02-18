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
    tokenizedAllAgrifoodProductCategories
  }
`;

const CREATE_CATEGORY = gql`
  mutation tokenizedCreateAgrifoodProductCategory($tokenized: String!) {
    tokenizedCreateAgrifoodProductCategory(tokenized: $tokenized)
  }
`;

const UPDATE_CATEGORY = gql`
  mutation tokenizedUpdateAgrifoodProductCategory($tokenized: String!) {
    tokenizedUpdateAgrifoodProductCategory(tokenized: $tokenized)
  }
`;

const DELETE_CATEGORY = gql`
  mutation tokenizedDeleteAgrifoodProductCategory($tokenized: String!) {
    tokenizedDeleteAgrifoodProductCategory(tokenized: $tokenized)
  }
`;

const EXPORT_PRODUCT_CATEGORY = gql`
  mutation exportProductCategory {
    exportProductCategory
  }
`;

const page = () => {
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createAgrifoodProductCategory] = useMutation(CREATE_CATEGORY);
  const [updateAgrifoodProductCategory] = useMutation(UPDATE_CATEGORY);
  const [deleteAgrifoodProductCategory] = useMutation(DELETE_CATEGORY);
  const [exportProductCategory] = useMutation(EXPORT_PRODUCT_CATEGORY);
  const [allAgrifoodProductCategories, setAllAgrifoodProductCategories] =
    useState([]);

  useEffect(() => {
    if (!loading && !error) {
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
      accessor: "id",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Product Name (English)",
      accessor: "productNameEnglish",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Product Name (Malay)",
      accessor: "productNameMalay",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Prefix Code",
      accessor: "codePrefix",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
  ]);

  return (
    <AdminArea
      header={{ title: "Agrifood ProductCategory" }}
      urlQuery={router.query}
    >
      <Head>
        <title>Product Category</title>
      </Head>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Product Category`}
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
              await createAgrifoodProductCategory({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateAgrifoodProductCategory({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Product Category saved!`,
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
          <label>Prefix Code</label>
          <input
            required
            placeholder="Ex. PL000, ABC000, DEF000, etc.."
            className="form-control"
            value={formData.codePrefix || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                codePrefix: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Product Name (English)</label>
          <input
            className="form-control"
            value={formData.productNameEnglish || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                productNameEnglish: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Product Name (Malay)</label>
          <input
            className="form-control"
            value={formData.productNameMalay || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                productNameMalay: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allAgrifoodProductCategories}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportProductCategory();

                    downloadExcelFromBuffer(
                      response.data.exportProductCategory.data,
                      "product-category-agrifood"
                    );
                    // window.open(response.data.exportProductCategory, "__blank")
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
            !currentUserDontHavePrivilege(["Product Category:Update"])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege(["Product Category:Create"])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Product Category:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length}  categories?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteAgrifoodProductCategory({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length}  categories deleted`,
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
