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
import { MultiYearsFilterWithExport } from "../../components/MultiYearsFilterWithExport";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query allCropsCategories {
    tokenizedAllCropsCategories
  }
`;

const CREATE_CROPSCATEGORY = gql`
  mutation tokenizedCreateCropsCategory($tokenized: String!) {
    tokenizedCreateCropsCategory(tokenized: $tokenized)
  }
`;

const UPDATE_CROPSCATEGORY = gql`
  mutation tokenizedUpdateCropsCategory($tokenized: String!) {
    tokenizedUpdateCropsCategory(tokenized: $tokenized)
  }
`;

const DELETE_CROPSCATEGORY = gql`
  mutation tokenizedDeleteCropsCategory($tokenized: String!) {
    tokenizedDeleteCropsCategory(tokenized: $tokenized)
  }
`;

const EXPORT_CATEGORY = gql`
  mutation exportCropsCategory {
    exportCropsCategory
  }
`;

const CropsCategory = () => {
  const router = useRouter();
  const { data, loading, error, refetch } = useQuery(QUERY, {});
  const [createCropsCategory] = useMutation(CREATE_CROPSCATEGORY);
  const [updateCropsCategory] = useMutation(UPDATE_CROPSCATEGORY);
  const [deleteCropsCategory] = useMutation(DELETE_CROPSCATEGORY);
  const [exportCropsCategory] = useMutation(EXPORT_CATEGORY);
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const [allCropsCategories, setAllCropsCategories] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedCropsCategories = data?.tokenizedAllCropsCategories || "";
      let allCropsCategories = [];
      if (encryptedCropsCategories) {
        const decrypted = jwt.verify(encryptedCropsCategories, TOKENIZE);
        allCropsCategories = decrypted.queryResult;
        setAllCropsCategories(allCropsCategories);
      }
    }
  }, [data, loading, error]);

  // const encryptedCropsCategories = data?.tokenizedAllCropsCategories || "";
  // let allCropsCategories = [];
  // if (encryptedCropsCategories) {
  //   const decrypted = jwt.verify(encryptedCropsCategories, TOKENIZE);
  //   allCropsCategories = decrypted.queryResult;
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
      Header: "ID",
      accessor: "id",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Name",
      accessor: "name",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Description",
      accessor: "description",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Prefix Code",
      accessor: "prefixCode",
      style: {
        fontSize: 20,
      },
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
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
            let { uuid, __typename, __createdAt, __updatedAt } = formData;
            if (!uuid) {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await createCropsCategory({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
              setModalVisible(false);
              setFormData({});
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateCropsCategory({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: ` Crops Category saved!`,
              level: "success",
            });
          } catch (error) {
            notification.handleError(error);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Prefix Code</label>
          <input
            placeholder="Ex: ABC000, DEF000 Etc..."
            className="form-control"
            required
            value={formData.prefixCode || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                prefixCode: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Name</label>
          <input
            className="form-control"
            required
            value={formData.name || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                name: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <input
            className="form-control"
            required
            value={formData.description || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
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
          loading={false}
          columns={columns}
          data={allCropsCategories}
          withoutHeader={true}
          customHeaderUtilities={
            <div>
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportCropsCategory();

                    downloadExcelFromBuffer(
                      response.data.exportCropsCategory.data,
                      "crops"
                    );
                    // window.open(response.data.exportCropsCategory, "__blank")
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
            !currentUserDontHavePrivilege(["Category Master Data:Create"])
              ? (e) => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({});
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Category Master Data:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} category?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        deleteCropsCategory({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} Crops Category deleted`,
                        level: "success",
                      });
                      await refetch();
                    }
                  } catch (error) {
                    handleError(error);
                  }
                  hideLoadingSpinner();
                  refetch();
                }
              : null
          }
          customUtilities={
            !currentUserDontHavePrivilege(["Category Master Data:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(CropsCategory);
