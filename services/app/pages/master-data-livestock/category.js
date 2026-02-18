import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../../components/App";
import { handleError } from "../../libs/errors";
import redirect from "../../libs/redirect";
import gql from "graphql-tag";
import {
  useMutation,
  useQuery,
  useApolloClient,
  ApolloProvider,
} from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query allLivestockCategories {
    # allLivestockCategories {
    #   id
    #   uuid
    #   code
    #   categoryName
    # }
    allLivestockCategoriesEncrypted
  }
`;

const CREATE_CATEGORY = gql`
  mutation createLivestockCategory(
    #$categoryName: String!
    #$code: String
    $tokenized: String!
  ) {
    createLivestockCategory(
      #code: $code
      #categoryName: $categoryName
      tokenized: $tokenized
    )
  }
`;

const UPDATE_CATEGORY = gql`
  mutation updateLivestockCategory(
    #$uuid: String!
    #$code: String
    #$categoryName: String!
    $tokenized: String!
  ) {
    updateLivestockCategory(
      #uuid: $uuid
      #code: $code
      #categoryName: $categoryName
      tokenized: $tokenized
    )
  }
`;

const DELETE_CATEGORY = gql`
  mutation deleteLivestockCategory(
    #$uuid: String!
    $tokenized: String!
  ) {
    deleteLivestockCategory(
      #uuid: $uuid
      tokenized: $tokenized
    )
  }
`;

const EXPORT_CATEGORY = gql`
  mutation exportLivestockCategory {
    exportLivestockCategory
  }
`;

const Category = () => {
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const router = useRouter();

  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createLivestockCategory] = useMutation(CREATE_CATEGORY);
  const [updateLivestockCategory] = useMutation(UPDATE_CATEGORY);
  const [deleteLivestockCategory] = useMutation(DELETE_CATEGORY);
  const [exportLivestockCategory] = useMutation(EXPORT_CATEGORY);
  const [allLivestockCategories, setAllLivestockCategories] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedLivestockCategories =
        data?.allLivestockCategoriesEncrypted || "";
      let allLivestockCategories = [];
      if (encryptedLivestockCategories) {
        const decrypted = jwt.verify(encryptedLivestockCategories, TOKENIZE);
        allLivestockCategories = decrypted.queryResult;
        setAllLivestockCategories(allLivestockCategories);
      }
    }
  }, [data, loading, error]);

  // const allLivestockCategories = data?.allLivestockCategories || [];

  // const encrypted = data?.allLivestockCategoriesEncrypted || "";
  // let allLivestockCategories = [];
  // if (encrypted) {
  //   const decyrpted = jwt.verify(encrypted, TOKENIZE);
  //   allLivestockCategories = decyrpted.queryResult;
  // }

  const customUtilities = useMemo(() => [
    {
      label: "Edit",
      icon: <i className="fa fa-pencil" />,
      width: 400,
      render: (propsTable) => {
        return (
          <div className="flex">
            <button
              onClick={(e) => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                });
              }}
              className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg"
            >
              <p className="text-white text-md font-bold">
                <i className="fa fa-pencil-alt " /> Edit
              </p>
            </button>
          </div>
        );
      },
    },
  ]);

  const columns = useMemo(() => [
    {
      Header: "Code",
      accessor: "code",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Category Name",
      accessor: "categoryName",
      style: {
        fontSize: 20,
        width: 500,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Category</title>
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
          try {
            let { uuid } = formData;
            if (!uuid) {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await createLivestockCategory({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateLivestockCategory({
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
          <label>Category Code</label>
          <input
            className="form-control"
            value={(formData.code || "").toUpperCase()}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                code: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Category Name</label>
          <input
            className="form-control"
            value={(formData.categoryName || "").toUpperCase()}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                categoryName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
      </FormModal>

      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allLivestockCategories}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportLivestockCategory();

                    downloadExcelFromBuffer(
                      response.data.exportLivestockCategory.data,
                      "category-livestock"
                    );
                    // window.open(
                    //   response.data.exportLivestockCategory,
                    //   "__blank"
                    // );
                  } catch (error) {
                    notification.handleError(error);
                  }
                }}
              >
                Export Excel
              </button>
            </div>
          }
          onAdd={
            !currentUserDontHavePrivilege(["Category Livestock:Create"])
              ? (e) => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({});
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Category Livestock:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} categories?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteLivestockCategory({
                          variables: {
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
                }
              : null
          }
          customUtilities={
            !currentUserDontHavePrivilege(["Category Livestock:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Category);
