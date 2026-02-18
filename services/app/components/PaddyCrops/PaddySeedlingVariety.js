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

const QUERY = gql`
  query ListOfQuery {
    allCropsPaddySeedlingVarieties {
      id
      uuid
      paddySeedlingId
      varietyName
      CropsCategory {
        
        uuid
        name
        prefixCode
      }
    }

    allCropsCategories {
      id
      uuid
      name
      prefixCode
    }
  }
`;

const CREATE_SEEDLINGVARIETY = gql`
  mutation createCropsPaddySeedlingVariety(
    $varietyName: String
    $cropsCategoryUUID: String!
  ) {
    createCropsPaddySeedlingVariety(
      varietyName: $varietyName
      cropsCategoryUUID: $cropsCategoryUUID
    )
  }
`;

const UPDATE_SEEDLINGVARIETY = gql`
  mutation updateCropsPaddySeedlingVariety(
    $uuid: String!
    $varietyName: String
    $cropsCategoryUUID: String!
  ) {
    updateCropsPaddySeedlingVariety(
      uuid: $uuid
      varietyName: $varietyName
      cropsCategoryUUID: $cropsCategoryUUID
    )
  }
`;

const DELETE_SEEDLINGVARIETY = gql`
  mutation deleteCropsPaddySeedlingVariety($uuid: String!) {
    deleteCropsPaddySeedlingVariety(uuid: $uuid)
  }
`;

const PaddySeedlingVariety = ({}) => {
  const { data, loading, eror, refetch } = useQuery(QUERY, {});
  const [createCropsPaddySeedlingVariety] = useMutation(CREATE_SEEDLINGVARIETY);
  const [updateCropsPaddySeedlingVariety] = useMutation(UPDATE_SEEDLINGVARIETY);
  const [deleteCropsPaddySeedlingVariety] = useMutation(DELETE_SEEDLINGVARIETY);
  const client = useApolloClient();
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});

  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  let allCropsPaddySeedlingVarieties = [];
  if (data && data.allCropsPaddySeedlingVarieties) {
    allCropsPaddySeedlingVarieties = data.allCropsPaddySeedlingVarieties;
  }

  let allCropsCategories = [];
  if (data && data.allCropsCategories) {
    allCropsCategories = data.allCropsCategories;
  }

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
      Header: "Paddy Seedling ID",
      accessor: "paddySeedlingId",
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
      Header: "Variety Name",
      accessor: "varietyName",
      style: {
        fontSize: 20,
        width: 200,
      },
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
        title={`${!formData.uuid ? "New" : "Edit"} Paddy Seedling Variety`}
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
              await createCropsPaddySeedlingVariety({
                variables: {
                  ...formData,
                },
              });
              setModalVisible(false);
              setFormData({});
              setModalVisible(true);
            } else {
              await updateCropsPaddySeedlingVariety({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: ` Seedling Variety saved!`,
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
              <label>Paddy Seedling ID</label>
              <input
                disabled
                placeholder="Will generated after saved"
                className="form-control"
                value={formData.paddySeedlingId || ""}
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                className="form-control"
                value={formData.cropsCategoryUUID || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    cropsCategoryUUID: e.target.value,
                  });
                }}
                required
              >
                <option value={""}>Select Category</option>
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
              <label>Variety Name</label>
              <input
                className="form-control"
                value={formData.varietyName || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    varietyName: e.target.value,
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
          data={allCropsPaddySeedlingVarieties}
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege([
              "Paddy Seedling Variety Paddy Master Data Crops:Update",
            ])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege([
              "Paddy Seedling Variety Paddy Master Data Crops:Create",
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
              "Paddy Seedling Variety Paddy Master Data Crops:Delete",
            ])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} paddy seedling varietys?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteCropsPaddySeedlingVariety({
                          variables: {
                            uuid: row.uuid,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} paddy seedling varietys deleted`,
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
export default withApollo({ ssr: true })(PaddySeedlingVariety);
