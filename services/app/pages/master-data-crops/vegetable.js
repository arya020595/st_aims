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
import { create, filter } from "lodash";
import { from } from "apollo-link";
import { configure } from "nprogress";
import Head from "next/dist/next-server/lib/head";
import { Leaf } from "slate";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";

const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query ListOfQuery {
    tokenizedAllCropVegetables

    tokenizedAllCropsCategories
  }
`;

const CREATE_VEGETABLE = gql`
  mutation tokenizedCreateCropsVegetable($tokenized: String!) {
    tokenizedCreateCropsVegetable(tokenized: $tokenized)
  }
`;

const UPDATE_VEGETABLE = gql`
  mutation tokenizedUpdateCropsVegetable($tokenized: String!) {
    tokenizedUpdateCropsVegetable(tokenized: $tokenized)
  }
`;

const DELETE_VEGETABLE = gql`
  mutation tokenizedDeleteCropsVegetable($tokenized: String!) {
    tokenizedDeleteCropsVegetable(tokenized: $tokenized)
  }
`;

const EXPORT_VEGETABLE = gql`
  mutation exportCropsVegetable {
    exportCropsVegetable
  }
`;

const page = () => {
  const { data, loading, error, refetch } = useQuery(QUERY, {});
  const [createCropsVegetable] = useMutation(CREATE_VEGETABLE);
  const [updateCropsVegetable] = useMutation(UPDATE_VEGETABLE);
  const [deleteCropsVegetable] = useMutation(DELETE_VEGETABLE);
  const [exportCropsVegetable] = useMutation(EXPORT_VEGETABLE);

  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const [allCropVegetables, setAllCropVegetables] = useState([]);
  const [allCropsCategories, setAllCropsCategories] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedCropVegetables = data?.tokenizedAllCropVegetables || "";
      let allCropVegetables = [];
      if (encryptedCropVegetables) {
        const decrypted = jwt.verify(encryptedCropVegetables, TOKENIZE);
        allCropVegetables = decrypted.queryResult;
        setAllCropVegetables(allCropVegetables);
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

  // const encryptedCropVegetables = data?.tokenizedAllCropVegetables || "";
  // let allCropVegetables = [];
  // if (encryptedCropVegetables) {
  //   const decrypted = jwt.verify(encryptedCropVegetables, TOKENIZE);
  //   allCropVegetables = decrypted.queryResult;
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
              onClick={(e) => {
                setModalVisible(true);
                setFormData({
                  ...props.row.original,
                  cropsCategoryUUID: props.row.original?.CropsCategory?.uuid,
                });
              }}
              className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg"
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
      Header: "Vegetable ID",
      accessor: "vegetableId",
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
    },
    {
      Header: "English Name",
      accessor: "englishName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Crop Name",
      accessor: "cropName",
      style: {
        fontSize: 20,
      },
    },
  ]);

  return (
    <AdminArea header={{ title: "Vegetable" }} urlQuery={router.query}>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Vegetable`}
        size="sm"
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
              await createCropsVegetable({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
              setModalVisible(false);
              setFormData({});
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateCropsVegetable({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: ` Crops Vegetable saved!`,
              level: "success",
            });
          } catch (error) {
            notification.handleError(error);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Vegetable ID</label>
          <input
            placeholder="Will generated after saved"
            disabled
            className="form-control"
            value={formData.vegetableId || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                vegetableId: e.target.value,
              });
            }}
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
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={false}
          columns={columns}
          data={allCropVegetables}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportCropsVegetable();
                    downloadExcelFromBuffer(
                      response.data.exportCropsVegetable.data,
                      "crops-vegetable-master-data"
                    );
                    // window.open(response.data.exportCropsVegetable, "__blank")
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
            !currentUserDontHavePrivilege(["Vegetable Master Data:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege(["Vegetable Master Data:Create"])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Vegetable Master Data:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} Crops Vegetable?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteCropsVegetable({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} Crops Vegetable deleted`,
                        level: "success",
                      });
                      await refetch();
                    }
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
