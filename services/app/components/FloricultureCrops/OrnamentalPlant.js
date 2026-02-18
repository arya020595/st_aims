import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../../components/App";
import { handleError } from "../../libs/errors";
import { useRouter } from "next/router";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import gql from "graphql-tag";
import {
  useQuery,
  useLazyQuery,
  useMutation,
  useApolloClient,
} from "@apollo/client";
import { useCurrentUser } from "../AdminArea";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query ListOfQUery {
    tokenizedAllCropsOrnamentalPlants
    tokenizedAllCropsCategories
  }
`;

const CREATE_ORNAMENTALPLANTS = gql`
  mutation tokenizedCreateCropsOrnamentalPlant($tokenized: String!) {
    tokenizedCreateCropsOrnamentalPlant(tokenized: $tokenized)
  }
`;

const UPDATE_ORNAMENTALPLANTS = gql`
  mutation tokenizedUpdateCropsOrnamentalPlant($tokenized: String!) {
    tokenizedUpdateCropsOrnamentalPlant(tokenized: $tokenized)
  }
`;

const DELETE_ORNAMENTALPLANTS = gql`
  mutation tokenizedDeleteCropsOrnamentalPlant($tokenized: String!) {
    tokenizedDeleteCropsOrnamentalPlant(tokenized: $tokenized)
  }
`;

const EXPORT_ORNAMENTALPLANT = gql`
  mutation exportCropsOrnamentalPlant {
    exportCropsOrnamentalPlant
  }
`;

const OrnamentalPlant = ({}) => {
  const { data, loading, error, refetch } = useQuery(QUERY, {});
  const [createCropsOrnamentalPlant] = useMutation(CREATE_ORNAMENTALPLANTS);
  const [updateCropsOrnamentalPlant] = useMutation(UPDATE_ORNAMENTALPLANTS);
  const [deleteCropsOrnamentalPlant] = useMutation(DELETE_ORNAMENTALPLANTS);
  const [exportCropsOrnamentalPlant] = useMutation(EXPORT_ORNAMENTALPLANT);
  const client = useApolloClient();
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});

  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const [allCropsOrnamentalPlants, setAllCropsOrnamentalPlants] = useState([]);
  const [allCropsCategories, setAllCropsCategories] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedCropsOrnamentalPlants =
        data?.tokenizedAllCropsOrnamentalPlants || "";
      let allCropsOrnamentalPlants = [];
      if (encryptedCropsOrnamentalPlants) {
        const decrypted = jwt.verify(encryptedCropsOrnamentalPlants, TOKENIZE);
        allCropsOrnamentalPlants = decrypted.queryResult;
        setAllCropsOrnamentalPlants(allCropsOrnamentalPlants);
      }
      const encryptedCropsCategories = data?.tokenizedAllCropsCategories || "";
      let allCropsCategories = [];
      if (encryptedCropsCategories) {
        const decrypted = jwt.verify(encryptedCropsCategories, TOKENIZE);
        allCropsCategories = decrypted.queryResult;
        setAllCropsCategories(allCropsCategories);
      }
    }
  }, [data, loading, error]);

  // const encryptedCropsOrnamentalPlants =
  //   data?.tokenizedAllCropsOrnamentalPlants || "";
  // let allCropsOrnamentalPlants = [];
  // if (encryptedCropsOrnamentalPlants) {
  //   const decrypted = jwt.verify(encryptedCropsOrnamentalPlants, TOKENIZE);
  //   allCropsOrnamentalPlants = decrypted.queryResult;
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
      Header: "Ornamental Plant ID",
      accessor: "ornamentalPlantId",
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
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Malay Name",
      accessor: "localName",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "English Name",
      accessor: "englishName",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Crop Name",
      accessor: "cropName",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <span>{props?.value?.toUpperCase()}</span>,
    },
  ]);

  const columnsComplience = useMemo(() => [
    {
      Header: "Date",
      accessor: "date",
      style: {
        fontSize: 20,
      },
    },
  ]);

  return (
    <div>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Ornamental Plant`}
        visible={modalVisible}
        size={"md"}
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
              await createCropsOrnamentalPlant({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateCropsOrnamentalPlant({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: ` Ornamental Plant saved!`,
              level: "success",
            });
          } catch (error) {
            notification.handleError(error);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="grid grid-cols-1">
          <div>
            <div className="form-group">
              <label>Ornamental Plant ID</label>
              <input
                placeholder="Will generated after saved"
                disabled
                className="form-control"
                value={formData.ornamentalPlantId || ""}
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
              <label>Malay Name</label>
              <input
                className="form-control"
                value={formData.localName}
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
                value={formData.englishName}
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
                value={formData.cropName}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    cropName: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
          </div>
        </div>
      </FormModal>
      <div className="pr-0 py-2 h-full">
        <Table
          columns={columns}
          data={allCropsOrnamentalPlants}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportCropsOrnamentalPlant();
                    downloadExcelFromBuffer(
                      response.data.exportCropsOrnamentalPlant.data,
                      "ornamental-plant-export-excel"
                    );
                    // window.open(response.data.exportCropsOrnamentalPlant, "__blank")
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
            !currentUserDontHavePrivilege([
              "Ornamental Plant Floriculture:Update",
            ])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege([
              "Ornamental Plant Floriculture:Create",
            ])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          customUtilitiesPosition="left"
          onRemove={
            !currentUserDontHavePrivilege([
              "Ornamental Plant Floriculture:Delete",
            ])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} ornamental plants?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteCropsOrnamentalPlant({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} ornamental plants deleted`,
                        level: "success",
                      });
                      await refetch();

                      router.replace({
                        pathname: router.pathname,
                        query: {
                          ...router.query,
                          saveDate: new Date().toISOString(),
                        },
                      });
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
    </div>
  );
};
export default withApollo({ ssr: true })(OrnamentalPlant);
