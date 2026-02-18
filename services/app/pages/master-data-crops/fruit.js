import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../../components/App";
import { useNotification } from "../../components/Notification";
import { handleError } from "../../libs/errors";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Table from "../../components/Table";
import {
  useQuery,
  useLazyQuery,
  useMutation,
  useApolloClient,
} from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { FormModal } from "../../components/Modal";
import { useRouter } from "next/router";
import { create, filter, update } from "lodash";
import { from } from "apollo-link";
import { configure } from "nprogress";
import Head from "next/dist/next-server/lib/head";
import { Leaf } from "slate";
import { v4 as uuidv4 } from "uuid";
import NumberFormat from "react-number-format";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";

const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERIES = gql`
  query listQueries {
    tokenizedAllCropsFruits

    tokenizedAllSeasons

    tokenizedAllCropsCategories
  }
`;

const GET_FRUIT_DETAILS = gql`
  query tokenizedAllCropsFruitDetailByCropFruitId($tokenizedParams: String!) {
    tokenizedAllCropsFruitDetailByCropFruitId(tokenizedParams: $tokenizedParams)
  }
`;

const CREATE_FRUIT = gql`
  mutation tokenizedCreateCropsFruit($tokenized: String!) {
    tokenizedCreateCropsFruit(tokenized: $tokenized)
  }
`;

const UPDATE_FRUIT = gql`
  mutation tokenizedUpdateCropsFruit($tokenized: String!) {
    tokenizedUpdateCropsFruit(tokenized: $tokenized)
  }
`;

const DELETE_FRUIT = gql`
  mutation tokenizedDeleteCropsFruit($tokenized: String!) {
    tokenizedDeleteCropsFruit(tokenized: $tokenized)
  }
`;

const CREATE_FRUIT_DETAIL = gql`
  mutation tokenizedCreateCropsFruitDetail($tokenized: String!) {
    tokenizedCreateCropsFruitDetail(tokenized: $tokenized)
  }
`;

const UPDATE_FRUIT_DETAIL = gql`
  mutation tokenizedUpdateCropsFruitDetail($tokenized: String!) {
    tokenizedUpdateCropsFruitDetail(tokenized: $tokenized)
  }
`;

const DELETE_FRUIT_DETAIL = gql`
  mutation tokenizedDeleteCropsFruitDetail($tokenized: String!) {
    tokenizedDeleteCropsFruitDetail(tokenized: $tokenized)
  }
`;

const EXPORT_FRUIT = gql`
  mutation exportCropsFruit {
    exportCropsFruit
  }
`;

const page = () => {
  const router = useRouter();
  const client = useApolloClient();

  const [fruitDetails, setFruitDetails] = useState({
    cropFruitId: "",
    visible: false,
    list: [],
  });

  const [detailFormData, setDetailFormData] = useState({});

  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const { data, loading, error, refetch } = useQuery(QUERIES, {});
  const [createCropsFruit] = useMutation(CREATE_FRUIT);
  const [updateCropsFruit] = useMutation(UPDATE_FRUIT);
  const [deleteCropsFruit] = useMutation(DELETE_FRUIT);
  const [exportCropsFruit] = useMutation(EXPORT_FRUIT);
  const [createCropsFruitDetail] = useMutation(CREATE_FRUIT_DETAIL);
  const [updateCropsFruitDetail] = useMutation(UPDATE_FRUIT_DETAIL);
  const [deleteCropsFruitDetail] = useMutation(DELETE_FRUIT_DETAIL);

  const [allCropsFruits, setAllCropsFruits] = useState([]);
  const [allSeasons, setAllSeasons] = useState([]);
  const [allCropsCategories, setAllCropsCategories] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedCropsFruits = data?.tokenizedAllCropsFruits || "";
      let allCropsFruits = [];
      if (encryptedCropsFruits) {
        const decrypted = jwt.verify(encryptedCropsFruits, TOKENIZE);
        allCropsFruits = decrypted.queryResult;
        setAllCropsFruits(allCropsFruits);
      }
      const encryptedCropsCategories = data?.tokenizedAllCropsCategories || "";
      let allCropsCategories = [];
      if (encryptedCropsCategories) {
        const decrypted = jwt.verify(encryptedCropsCategories, TOKENIZE);
        allCropsCategories = decrypted.queryResult;
        setAllCropsCategories(allCropsCategories);
      }
      const encryptedSeasons = data?.tokenizedAllSeasons || "";
      let allSeasons = [];
      if (encryptedSeasons) {
        const decrypted = jwt.verify(encryptedSeasons, TOKENIZE);
        allSeasons = decrypted.queryResult;
        setAllSeasons(allSeasons);
      }
    }
  }, [data, loading, error]);

  // const encryptedCropsFruits = data?.tokenizedAllCropsFruits || "";
  // let allCropsFruits = [];
  // if (encryptedCropsFruits) {
  //   const decrypted = jwt.verify(encryptedCropsFruits, TOKENIZE);
  //   allCropsFruits = decrypted.queryResult;
  // }

  // const encryptedSeasons = data?.tokenizedAllSeasons || "";
  // let allSeasons = [];
  // if (encryptedSeasons) {
  //   const decrypted = jwt.verify(encryptedSeasons, TOKENIZE);
  //   allSeasons = decrypted.queryResult;
  // }

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

      render: (props) => {
        return (
          <div className="flex">
            <button
              onClick={async (e) => {
                setModalVisible(true);
                setFormData({
                  ...props.row.original,
                  cropsCategoryUUID: props.row.original?.CropsCategory?.uuid,
                  seasonUUID: props.row.original?.Season?.uuid,
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

  const customUtilitiesDetails = useMemo(() => [
    {
      label: "Edit",
      icon: <i className="fa fa-pencil" />,
      width: 400,

      render: (props) => {
        return (
          <div className="flex">
            <button
              onClick={async (e) => {
                setDetailFormData({
                  ...props.row.original,
                  visible: true,
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
      Header: "Fruit ID",
      accessor: "fruitId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Category",
      accessor: "CropsCategory.name",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Local Name",
      accessor: "localName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "English Name",
      accessor: "englishName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Crop Name",
      accessor: "cropName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => (
        <span>{props.value ? props.value.toUpperCase() : ""}</span>
      ),
    },
    {
      Header: "Fruit Details",
      accessor: "countCropsFruitDetails",
      style: {
        fontSize: 20,
      },
      Cell: (props) => (
        <button
          className="bg-blue-500 w-full py-2 shadow-md rounded-md text-white font-bold"
          onClick={openFruitDetails(props.row.original)}
        >
          {props.value}
        </button>
      ),
    },
  ]);

  const columnDetails = useMemo(() => [
    {
      Header: "Economic Life (Years)",
      accessor: "economicLife",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Estimated Yield / Tree",
      accessor: "estimatedYield",
      style: {
        fontSize: 20,
      },
    },
  ]);

  const openFruitDetails = (data) => async (e) => {
    const tokenized = jwt.sign(data, TOKENIZE);
    const fetch = await fetchingDetails(tokenized);

    setFruitDetails({
      cropFruitId: data.uuid,
      visible: true,
      list: fetch,
    });
  };

  const fetchingDetails = async (tokenizedParams) => {
    let result = [];
    try {
      const res = await client.query({
        query: GET_FRUIT_DETAILS,
        variables: {
          tokenizedParams,
        },
        fetchPolicy: "no-cache",
      });

      const encryptedtokenizedAllCropsFruitDetailByCropFruitId =
        res.data.tokenizedAllCropsFruitDetailByCropFruitId || "";

      if (encryptedtokenizedAllCropsFruitDetailByCropFruitId) {
        const decrypted = jwt.verify(
          encryptedtokenizedAllCropsFruitDetailByCropFruitId,
          TOKENIZE
        );
        result = decrypted.queryResult;
      }
    } catch (err) {
      notification.handleError(err);
    }

    return result;
  };

  return (
    <AdminArea header={{ title: "Fruit" }} urlQuery={router.query}>
      <FormModal
        size="lg"
        title={`Fruit Details`}
        visible={fruitDetails.visible}
        onCustomCloseBackDrop={true}
        onClose={(e) => {
          if (e) e.preventDefault();
          setFruitDetails({
            cropFruitId: "",
            visible: false,
            list: [],
          });
          setDetailFormData({});
        }}
      >
        <div
          className={`grid grid-cols-3 gap-3 ${
            detailFormData.visible ? "" : "hidden"
          }`}
        >
          <div className={`form-group`}>
            <label>Economic Life (Years)</label>
            <NumberFormat
              className="form-control"
              value={detailFormData.economicLife || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setDetailFormData({
                  ...detailFormData,
                  economicLife: e.floatValue || 0,
                });
              }}
            />
          </div>
          <div className={`form-group`}>
            <label>Estimated Yield / Tree</label>
            <NumberFormat
              className="form-control"
              value={detailFormData.estimatedYield || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setDetailFormData({
                  ...detailFormData,
                  estimatedYield: e.floatValue || 0,
                });
              }}
            />
          </div>
          <div className="flex items-end py-2">
            <button
              className="w-1/4 bg-mantis-500 py-2 shadow-md rounded-md text-white font-bold"
              onClick={async (e) => {
                if (e) e.preventDefault();

                showLoadingSpinner();
                try {
                  if (!detailFormData.uuid) {
                    const tokenizedPayload = {
                      ...detailFormData,
                      cropFruitId: fruitDetails.cropFruitId,
                    };

                    const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

                    await createCropsFruitDetail({
                      variables: {
                        tokenized,
                      },
                    });

                    const payloadRefetch = {
                      uuid: fruitDetails.cropFruitId,
                    };

                    const tokenizedFruitDetails = jwt.sign(
                      payloadRefetch,
                      TOKENIZE
                    );

                    const result = await fetchingDetails(tokenizedFruitDetails);

                    setDetailFormData({});
                    setFruitDetails({
                      ...fruitDetails,
                      list: result,
                    });
                  } else {
                    const tokenizedPayload = {
                      ...detailFormData,
                      cropFruitId: fruitDetails.cropFruitId,
                    };
                    const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

                    await updateCropsFruitDetail({
                      variables: {
                        tokenized,
                      },
                    });

                    const payloadRefetch = {
                      uuid: fruitDetails.cropFruitId,
                    };
                    const tokenizedRefetch = jwt.sign(payloadRefetch, TOKENIZE);

                    const result = await fetchingDetails(tokenizedRefetch);
                    setDetailFormData({});
                    setFruitDetails({
                      ...fruitDetails,
                      list: result,
                    });
                  }

                  notification.addNotification({
                    title: "Succeess!",
                    message: `Fruit Detail saved!`,
                    level: "success",
                  });
                } catch (err) {
                  notification.handleError(err);
                }
                hideLoadingSpinner();
              }}
            >
              Save
            </button>
          </div>
        </div>

        <Table
          loading={false}
          columns={columnDetails}
          data={fruitDetails.list}
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege(["Fruit Detail Master Data:Update"])
              ? customUtilitiesDetails
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege(["Fruit Detail Master Data:Create"])
              ? () => {
                  setDetailFormData({
                    visible: true,
                    estimatedYield: 0,
                    economicLife: 0,
                  });
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Fruit Detail Master Data:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} fruit details?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteCropsFruitDetail({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} fruit details deleted`,
                        level: "success",
                      });

                      const payloadRefetch = {
                        uuid: fruitDetails.cropFruitId,
                      };
                      const tokenizedRefetch = jwt.sign(
                        payloadRefetch,
                        TOKENIZE
                      );

                      const result = await fetchingDetails(tokenizedRefetch);

                      setDetailFormData({});
                      setFruitDetails({
                        ...fruitDetails,
                        list: result,
                      });
                    }
                  } catch (error) {
                    handleError(error);
                  }
                  hideLoadingSpinner();
                }
              : null
          }
        />
      </FormModal>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Fruit`}
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
              await createCropsFruit({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
              setModalVisible(false);
              setFormData({});
              setModalVisible(true);
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateCropsFruit({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
              setModalVisible(false);
              setFormData({});
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Fruit saved!`,
              level: "success",
            });
          } catch (error) {
            notification.handleError(error);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Fruit ID</label>
          <input
            disabled
            className="form-control"
            value={formData.fruitId || ""}
            placeholder="Will generate after saved"
          />
        </div>
        <div className="form-group">
          <label>Category</label>
          <select
            className="form-control"
            value={formData.cropsCategoryUUID || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                cropsCategoryUUID: e.target.value,
              });
            }}
          >
            <option value="" disabled>
              Select Category
            </option>
            {allCropsCategories.map((cat) => {
              return (
                <option value={cat.uuid}>
                  {cat.name}-{cat.prefixCode}
                </option>
              );
            })}
          </select>
        </div>
        <div className="form-group">
          <label>Local Name</label>
          <input
            className="form-control"
            value={formData.localName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                localName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>English Name</label>
          <input
            className="form-control"
            value={formData.englishName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                englishName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Crop Name</label>
          <input
            className="form-control"
            value={formData.cropName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                cropName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Season</label>
          <select
            className="form-control"
            value={formData.seasonUUID || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                seasonUUID: e.target.value,
              });
            }}
          >
            <option value="" disabled>
              Select Season
            </option>
            {allSeasons.map((season) => {
              return (
                <option value={season.uuid}>{season.name.toUpperCase()}</option>
              );
            })}
          </select>
        </div>
        <hr />
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allCropsFruits}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportCropsFruit();

                    downloadExcelFromBuffer(
                      response.data.exportCropsFruit.data,
                      "crops-fruit"
                    );
                    // window.open(response.data.exportCropsFruit, "__blank")
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
            !currentUserDontHavePrivilege(["Fruit Master Data:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege(["Fruit Master Data:Create"])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Fruit Master Data:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} fruit?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteCropsFruit({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} fruit deleted`,
                        level: "success",
                      });

                      const payloadRefetch = {
                        uuid: fruitDetails.cropFruitId,
                      };

                      const tokenized = jwt.sign(payloadRefetch, TOKENIZE);

                      const result = await fetchingDetails(tokenized);

                      setDetailFormData({});
                      setFruitDetails({
                        ...fruitDetails,
                        list: result,
                      });
                    }
                    await refetch();
                  } catch (error) {
                    handleError(error);
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
