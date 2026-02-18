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
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer"
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueris {
    # allAnimalFeeds {
    #   id
    #   uuid
    #   category
    #   code
    #   description

    #   Livestock {
    #     uuid
    #     typeOfLiveStock
    #   }
    #   Supplier {
    #     uuid
    #     code
    #     supplierName
    #   }
    # }

    # allLivestockSuppliers {
    #   uuid
    #   code
    #   supplierName
    # }

    # allLiveStocks {
    #   uuid
    #   LivestockCategory {
    #     uuid
    #     categoryName
    #   }
    #   typeOfLiveStock
    # }

    tokenizedAllAnimalFeeds
    tokenizedAllLiveStock
    tokenizedAllLiveStockSuppliers
  }
`;

const CREATE_ANIMAL_FEED = gql`
  mutation createAnimalFeed(
    #$livestockId: String!
    #$supplierId: String!
    #$category: String
    #$code: String
    #$description: String
    $tokenized: String!
  ) {
    createAnimalFeed(
      #livestockId: $livestockId
      #supplierId: $supplierId
      #category: $category
      #code: $code
      #description: $description
      tokenized: $tokenized
    )
  }
`;

const UPDATE_ANIMAL_FEED = gql`
  mutation updateAnimalFeed(
    #$uuid: String!
    #$livestockId: String
    #$supplierId: String
    #$category: String
    #$code: String
    #$description: String
    $tokenized: String!
  ) {
    updateAnimalFeed(
      #uuid: $uuid
      #livestockId: $livestockId
      #supplierId: $supplierId
      #category: $category
      #code: $code
      #description: $description
      tokenized: $tokenized
    )
  }
`;

const DELETE_ANIMAL_FEED = gql`
  mutation deleteAnimalFeed(
    #$uuid: String!
    $tokenized: String!
  ) {
    deleteAnimalFeed(
      #uuid: $uuid
      tokenized: $tokenized
    )
  }
`;

const EXPORT_ANIMAL_FEED = gql`
  mutation exportAnimalFeed {
    exportAnimalFeed
  }
`;

const AnimalFeed = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createAnimalFeed] = useMutation(CREATE_ANIMAL_FEED);
  const [updateAnimalFeed] = useMutation(UPDATE_ANIMAL_FEED);
  const [deleteAnimalFeed] = useMutation(DELETE_ANIMAL_FEED);
  const [exportAnimalFeed] = useMutation(EXPORT_ANIMAL_FEED);
  const [allLivestockSuppliers, setAllLivestockSuppliers] = useState([]);
  const [allAnimalFeeds, setAllAnimalFeeds] = useState([]);
  const [allLiveStocks, setAllLiveStocks] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedLivestockSuppliers =
        data?.tokenizedAllLiveStockSuppliers || "";
      let allLivestockSuppliers = [];
      if (encryptedLivestockSuppliers) {
        const decrypted = jwt.verify(encryptedLivestockSuppliers, TOKENIZE);
        allLivestockSuppliers = decrypted.queryResult;
        setAllLivestockSuppliers(allLivestockSuppliers);
      }
      const encryptedAnimalFeeds = data?.tokenizedAllAnimalFeeds || "";
      let allAnimalFeeds = [];
      if (encryptedAnimalFeeds) {
        const decrypted = jwt.verify(encryptedAnimalFeeds, TOKENIZE);
        allAnimalFeeds = decrypted.queryResult;
        setAllAnimalFeeds(allAnimalFeeds);
      }
      const encryptedLivestock = data?.tokenizedAllLiveStock || "";
      let allLiveStocks = [];
      if (encryptedLivestock) {
        const decrypted = jwt.verify(encryptedLivestock, TOKENIZE);
        allLiveStocks = decrypted.queryResult;
        setAllLiveStocks(allLiveStocks);
      }
    }
  }, [data, loading, error]);

  // const encryptedLivestockSuppliers =
  //   data?.tokenizedAllLiveStockSuppliers || "";
  // let allLivestockSuppliers = [];
  // if (encryptedLivestockSuppliers) {
  //   const decrypted = jwt.verify(encryptedLivestockSuppliers, TOKENIZE);
  //   allLivestockSuppliers = decrypted.queryResult;
  // }

  // const encryptedAnimalFeeds = data?.tokenizedAllAnimalFeeds || "";
  // let allAnimalFeeds = [];
  // if (encryptedAnimalFeeds) {
  //   const decrypted = jwt.verify(encryptedAnimalFeeds, TOKENIZE);
  //   allAnimalFeeds = decrypted.queryResult;
  // }

  // const encryptedLivestock = data?.tokenizedAllLiveStock || "";
  // let allLiveStocks = [];
  // if (encryptedLivestock) {
  //   const decrypted = jwt.verify(encryptedLivestock, TOKENIZE);
  //   allLiveStocks = decrypted.queryResult;
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
                  livestockId: propsTable.row.original?.Livestock?.uuid || "",
                  supplierId: propsTable.row.original?.Supplier?.uuid || "",
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
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Type of Livestock",
      accessor: "Livestock.typeOfLiveStock",
      style: {
        fontSize: 20,
        width: 250,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Supplier",
      accessor: "Supplier.supplierName",
      style: {
        fontSize: 20,
        width: 250,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Livestock Feed Category",
      accessor: "category",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Live Feed Code And Type",
      accessor: "code",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Description",
      accessor: "description",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Animal Feed</title>
      </Head>

      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Animal Feed`}
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
              await createAnimalFeed({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateAnimalFeed({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Animal Feed saved!`,
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
          <label>Type of Livestock</label>
          <select
            className="form-control"
            value={formData.livestockId || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                livestockId: e.target.value,
              });
            }}
          >
            <option value={""} disabled>
              Select Type Of Livestock
            </option>
            {allLiveStocks.map((stock) => (
              <option value={stock.uuid}>
                {stock.typeOfLiveStock.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Supplier</label>
          <select
            className="form-control"
            value={formData.supplierId || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                supplierId: e.target.value,
              });
            }}
          >
            <option value={""} disabled>
              Select Supplier
            </option>
            {allLivestockSuppliers.map((supplier) => (
              <option value={supplier.uuid}>
                {supplier.supplierName.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Livestock Feed Category</label>
          <select
            className="form-control"
            value={(formData.category || "").toUpperCase()}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                category: e.target.value.toUpperCase(),
              });
            }}
          >
            <option value={""} disabled>
              Select Category
            </option>
            <option value="STARTER">STARTER</option>
            <option value="GROWER">GROWER</option>
            <option value="FINISHER">FINISHER</option>
            <option value="N/A">N/A</option>
          </select>
        </div>
        <div className="form-group">
          <label>Livestock Feed Code and Type</label>
          <input
            className="form-control"
            value={(formData.code || "").toUpperCase()}
            onChange={(e) => {
              setFormData({
                ...formData,
                code: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Description</label>
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
          data={allAnimalFeeds}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportAnimalFeed();
                    downloadExcelFromBuffer(
                      response.data.exportAnimalFeed.data,
                      "animal-feed-livestock"
                    );
                    // window.open(response.data.exportAnimalFeed, "__blank");
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
            !currentUserDontHavePrivilege(["Animal Feed:Create"])
              ? (e) => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({});
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Animal Feed:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} animal feeds?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteAnimalFeed({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} animal feeds deleted`,
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
            !currentUserDontHavePrivilege(["Animal Feed:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(AnimalFeed);
