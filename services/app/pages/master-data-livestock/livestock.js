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
  query listQueris {
    # allLiveStocks {
    #   id
    #   uuid
    #   LivestockCategory {
    #     uuid
    #     categoryName
    #   }
    #   typeOfLiveStock
    # }

    # allLivestockCategories {
    #   id
    #   uuid
    #   categoryName
    # }
    tokenizedAllLiveStock
    allLivestockCategoriesEncrypted
  }
`;

const CREATE_LIVESTOCK = gql`
  mutation createLiveStock(
    #$livestockCategoryId: String!
    #$typeOfLiveStock: String!
    $tokenized: String!
  ) {
    createLiveStock(
      #livestockCategoryId: $livestockCategoryId
      #typeOfLiveStock: $typeOfLiveStock
      tokenized: $tokenized
    )
  }
`;

const UPDATE_LIVESTOCK = gql`
  mutation updateLiveStock(
    #$uuid: String!
    #$livestockCategoryId: String!
    #$typeOfLiveStock: String!
    $tokenized: String!
  ) {
    updateLiveStock(
      #uuid: $uuid
      #livestockCategoryId: $livestockCategoryId
      #typeOfLiveStock: $typeOfLiveStock
      tokenized: $tokenized
    )
  }
`;

const DELETE_LIVESTOCK = gql`
  mutation deleteLiveStock(
    #$uuid: String!
    $tokenized: String!
  ) {
    deleteLiveStock(
      #uuid: $uuid
      tokenized: $tokenized
    )
  }
`;

const EXPORT_LIVESTOCK = gql`
  mutation exportLivestock {
    exportLivestock
  }
`;

const Livestock = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createLiveStock] = useMutation(CREATE_LIVESTOCK);
  const [updateLiveStock] = useMutation(UPDATE_LIVESTOCK);
  const [deleteLiveStock] = useMutation(DELETE_LIVESTOCK);
  const [exportLivestock] = useMutation(EXPORT_LIVESTOCK);
  const [allLiveStocks, setAllLiveStocks] = useState([]);
  const [allLivestockCategories, setAllLivestockCategories] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedLiveStocks = data?.tokenizedAllLiveStock || "";
      let allLiveStocks = [];
      if (encryptedLiveStocks) {
        const decrypted = jwt.verify(encryptedLiveStocks, TOKENIZE);
        allLiveStocks = decrypted.queryResult;
        setAllLiveStocks(allLiveStocks);
      }
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

  // const encryptedLivestock = data?.tokenizedAllLiveStock || "";
  // let allLiveStocks = [];
  // if (encryptedLivestock) {
  //   const decrypted = jwt.verify(encryptedLivestock, TOKENIZE);
  //   allLiveStocks = decrypted.queryResult;
  // }

  // const encryptedLivestockCategories =
  //   data?.allLivestockCategoriesEncrypted || "";
  // let allLivestockCategories = [];
  // if (encryptedLivestockCategories) {
  //   const decrypted = jwt.verify(encryptedLivestockCategories, TOKENIZE);
  //   allLivestockCategories = decrypted.queryResult;
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
                  livestockCategoryId:
                    propsTable.row.original?.LivestockCategory?.uuid || "",
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
      Header: "Livestock ID",
      accessor: "id",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Livestock Category",
      accessor: "LivestockCategory.categoryName",
      style: {
        fontSize: 20,
        width: 500,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Type of Livestock",
      accessor: "typeOfLiveStock",
      style: {
        fontSize: 20,
        width: 250,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
  ]);
  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Livestock</title>
      </Head>

      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Livestock`}
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
            let { uuid, LivestockCategory } = formData;
            if (!uuid) {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await createLiveStock({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateLiveStock({
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
            setFormData({});
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Livestock Category</label>
          <select
            required
            className="form-control"
            value={formData.livestockCategoryId || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                livestockCategoryId: e.target.value,
              });
            }}
          >
            <option value={""} disabled>
              Select Category
            </option>
            {allLivestockCategories.map((cat) => (
              <option value={cat.uuid}>{cat.categoryName.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Type of Livestock*</label>
          <input
            placeholder="Type of Livestock"
            className="form-control"
            value={(formData.typeOfLiveStock || "").toUpperCase()}
            required
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                typeOfLiveStock: e.target.value.toLocaleUpperCase(),
              });
            }}
          />
        </div>
      </FormModal>

      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allLiveStocks}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportLivestock();

                    downloadExcelFromBuffer(
                      response.data.exportLivestock.data,
                      "livestock"
                    );
                    // window.open(response.data.exportLivestock, "__blank");
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
            !currentUserDontHavePrivilege(["Livestock:Create"])
              ? (e) => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Livestock:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} livestocks?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteLiveStock({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} livestocks deleted`,
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
            !currentUserDontHavePrivilege(["Livestock:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Livestock);
