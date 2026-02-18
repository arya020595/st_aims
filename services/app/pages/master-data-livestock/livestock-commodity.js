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
import Head from "next/dist/next-server/lib/head";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";

const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries {
    tokenizedAllLivestockCommodities
    tokenizedAllUnits
  }
`;

const GET_COMMODITY_DETAILS = gql`
  query tokenizedAllLivestockCommodityDetails($tokenizedParams: String!) {
    tokenizedAllLivestockCommodityDetails(tokenizedParams: $tokenizedParams)
  }
`;

const CREATE_COMMODITY = gql`
  mutation createLivestockCommodityTokenized($tokenized: String!) {
    createLivestockCommodityTokenized(tokenized: $tokenized)
  }
`;

const UPDATE_COMMODITY = gql`
  mutation updateLivestockCommodityTokenized($tokenized: String!) {
    updateLivestockCommodityTokenized(tokenized: $tokenized)
  }
`;

const DELETE_COMMODITY = gql`
  mutation deleteLivestockCommodityTokenized($tokenized: String!) {
    deleteLivestockCommodityTokenized(tokenized: $tokenized)
  }
`;

const CREATE_COMMODITY_DETAIL = gql`
  mutation createLivestockCommodityDetailTokenized($tokenized: String!) {
    createLivestockCommodityDetailTokenized(tokenized: $tokenized)
  }
`;

const UPDATE_COMMODITY_DETAIL = gql`
  mutation updateLivestockCommodityDetailTokenized($tokenized: String!) {
    updateLivestockCommodityDetailTokenized(tokenized: $tokenized)
  }
`;

const DELETE_COMMODITY_DETAIL = gql`
  mutation deleteLivestockCommodityDetailTokenized($tokenized: String!) {
    deleteLivestockCommodityDetailTokenized(tokenized: $tokenized)
  }
`;

const EXPORT_COMMODITY = gql`
  mutation exportLivestockCommodity {
    exportLivestockCommodity
  }
`;

const page = () => {
  const router = useRouter();
  const client = useApolloClient();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});

  const [commodityDetails, setDetails] = useState({
    livestockCommodityUUID: "",
    visible: false,
    list: [],
  });
  const [detailFormData, setDetailFormData] = useState({});

  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createLivestockCommodity] = useMutation(CREATE_COMMODITY);
  const [updateLivestockCommodity] = useMutation(UPDATE_COMMODITY);
  const [deleteLivestockCommodity] = useMutation(DELETE_COMMODITY);
  const [exportLivestockCommodity] = useMutation(EXPORT_COMMODITY);
  const [createLivestockCommodityDetail] = useMutation(CREATE_COMMODITY_DETAIL);
  const [updateLivestockCommodityDetail] = useMutation(UPDATE_COMMODITY_DETAIL);
  const [deleteLivestockCommodityDetail] = useMutation(DELETE_COMMODITY_DETAIL);

  const [allLivestockCommodities, setAllLivestockCommodities] = useState([]);
  const [allUnits, setAllUnits] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedLivestockCommodities =
        data?.tokenizedAllLivestockCommodities || "";
      let allLivestockCommodities = [];
      if (encryptedLivestockCommodities) {
        const decrypted = jwt.verify(encryptedLivestockCommodities, TOKENIZE);
        allLivestockCommodities = decrypted.queryResult;
        setAllLivestockCommodities(allLivestockCommodities);
      }
      const encryptedUnits = data?.tokenizedAllUnits || "";
      let allUnits = [];
      if (encryptedUnits) {
        const decrypted = jwt.verify(encryptedUnits, TOKENIZE);
        allUnits = decrypted.queryResult;
        setAllUnits(allUnits);
      }
    }
  }, [data, loading, error]);

  // const encryptedLivestockCommodities =
  //   data?.tokenizedAllLivestockCommodities || "";
  // let allLivestockCommodities = [];
  // if (encryptedLivestockCommodities) {
  //   const decrypted = jwt.verify(encryptedLivestockCommodities, TOKENIZE);
  //   allLivestockCommodities = decrypted.queryResult;
  // }

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
                  unitUUID: props.row.original?.Unit?.uuid || "",
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
      Header: "Name",
      accessor: "name",
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
      },
      Cell: (props) => <p>{(props.value || "").toUpperCase()}</p>,
    },
    {
      Header: "Details",
      accessor: "countCommodityDetails",
      style: {
        fontSize: 20,
      },
      Cell: (props) => (
        <button
          className="bg-blue-500 w-full py-2 shadow-md rounded-md text-white font-bold"
          onClick={openDetails(props.row.original)}
        >
          {props.value}
        </button>
      ),
    },
  ]);

  const columnDetails = useMemo(() => [
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
      Header: "Unit",
      accessor: "Unit.name",
      style: {
        fontSize: 20,
      },
    },
  ]);

  const openDetails = (data) => async (e) => {
    const uuid = data.uuid;
    const tokenized = jwt.sign({ livestockCommodityUUID: uuid }, TOKENIZE);
    const fetch = await fetchingDetails(tokenized);

    setDetails({
      livestockCommodityUUID: data.uuid,
      visible: true,
      list: fetch,
    });
  };

  const fetchingDetails = async (tokenizedParams) => {
    let result = [];
    try {
      const res = await client.query({
        query: GET_COMMODITY_DETAILS,
        variables: {
          tokenizedParams,
        },
        fetchPolicy: "no-cache",
      });

      const encryptedLivestockCommodityDetails =
        res.data.tokenizedAllLivestockCommodityDetails || "";

      if (encryptedLivestockCommodityDetails) {
        const decrypted = jwt.verify(
          encryptedLivestockCommodityDetails,
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
    <AdminArea
      header={{ title: "Livestock Commodity" }}
      urlQuery={router.query}
    >
      <Head>
        <title>Livestock Commodity</title>
      </Head>
      <FormModal
        size={"lg"}
        title={`Commodity Details`}
        visible={commodityDetails.visible}
        onCustomCloseBackDrop={true}
        onClose={(e) => {
          if (e) e.preventDefault();
          setDetails({
            livestockCommodityUUID: "",
            visible: false,
            list: [],
          });
          setDetailFormData({});
        }}
      >
        <div className={`${detailFormData.visible ? "" : "hidden"}`}>
          <div className={`form-group`}>
            <label>Name*</label>
            <input
              className="form-control"
              value={(detailFormData.name || "").toUpperCase()}
              required
              onChange={(e) => {
                if (e) e.preventDefault();
                setDetailFormData({
                  ...detailFormData,
                  name: e.target.value.toUpperCase(),
                });
              }}
            />
          </div>
          <div className={`form-group`}>
            <label>Description</label>
            <textarea
              className="form-control"
              value={(detailFormData.description || "").toUpperCase()}
              onChange={(e) => {
                if (e) e.preventDefault();
                setDetailFormData({
                  ...detailFormData,
                  description: e.target.value.toUpperCase(),
                });
              }}
            />
          </div>
          <div className={`form-group`}>
            <label>Unit*</label>
            <select
              required
              className="form-control"
              value={detailFormData.unitUUID || ""}
              onChange={(e) => {
                if (e) e.preventDefault();
                setDetailFormData({
                  ...detailFormData,
                  unitUUID: e.target.value,
                });
              }}
            >
              <option value={""} disabled>
                Select Unit
              </option>
              {allUnits.map((u) => (
                <option value={u.uuid}>{u.name.toUpperCase()}</option>
              ))}
            </select>
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
                      livestockCommodityUUID:
                        commodityDetails.livestockCommodityUUID,
                    };
                    const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

                    await createLivestockCommodityDetail({
                      variables: {
                        tokenized,
                      },
                    });

                    const tokenizedRefetch = jwt.sign(
                      commodityDetails,
                      TOKENIZE
                    );

                    const result = await fetchingDetails(tokenizedRefetch);
                    await refetch();
                    setDetailFormData({});
                    setDetails({
                      ...commodityDetails,
                      list: result,
                    });
                  } else {
                    const tokenizedPayload = {
                      ...detailFormData,
                      livestockCommodityUUID:
                        commodityDetails.livestockCommodityUUID,
                    };
                    const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

                    await updateLivestockCommodityDetail({
                      variables: {
                        tokenized,
                      },
                    });

                    const tokenizedRefetch = jwt.sign(
                      commodityDetails,
                      TOKENIZE
                    );

                    const result = await fetchingDetails(tokenizedRefetch);
                    await refetch();
                    setDetailFormData({});
                    setDetails({
                      ...commodityDetails,
                      list: result,
                    });
                  }

                  notification.addNotification({
                    title: "Succeess!",
                    message: `Detail saved!`,
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
          data={commodityDetails.list}
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege(["Livestock Commodity:Update"])
              ? customUtilitiesDetails
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege(["Livestock Commodity:Create"])
              ? () => {
                  setDetailFormData({
                    visible: true,
                  });
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Livestock Commodity:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} commodity details?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteLivestockCommodityDetail({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} commodity details deleted`,
                        level: "success",
                      });

                      const payloadRefetch = {
                        livestockCommodityUUID:
                          commodityDetails.livestockCommodityUUID,
                      };
                      const tokenizedRefetch = jwt.sign(
                        payloadRefetch,
                        TOKENIZE
                      );

                      const result = await fetchingDetails(tokenizedRefetch);
                      await refetch();
                      setDetailFormData({});
                      setDetails({
                        ...commodityDetails,
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
        title={`${!formData.uuid ? "New" : "Edit"} Livestock Commodity`}
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
              await createLivestockCommodity({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateLivestockCommodity({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Livestock Commodity saved!`,
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
          <label> Name</label>
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
          <label> Description</label>
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
          data={allLivestockCommodities}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportLivestockCommodity();

                    downloadExcelFromBuffer(
                      response.data.exportLivestockCommodity.data,
                      "livestoc-commodity-livestock"
                    );
                    // window.open(
                    //   response.data.exportLivestockCommodity,
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
          customUtilities={
            !currentUserDontHavePrivilege(["Livestock Commodity:Update"])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege(["Livestock Commodity:Create"])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Livestock Commodity:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} tests?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteLivestockCommodity({
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
                }
              : null
          }
        />
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(page);
