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
    tokenizedAllMiscellaneousCrops

    tokenizedAllCropsCategories
  }
`;

const CREATE_MISCELLANEOUS = gql`
  mutation tokenizedCreateMiscellaneousCrops($tokenized: String!) {
    tokenizedCreateMiscellaneousCrops(tokenized: $tokenized)
  }
`;

const UPDATE_MISCELLANEOUS = gql`
  mutation tokenizedUpdateMiscellaneousCrops($tokenized: String!) {
    tokenizedUpdateMiscellaneousCrops(tokenized: $tokenized)
  }
`;

const DELETE_MISCELLANEOUS = gql`
  mutation tokenizedDeleteMiscellaneousCrops($tokenized: String!) {
    tokenizedDeleteMiscellaneousCrops(tokenized: $tokenized)
  }
`;

const EXPORTS_MISCELLANEOUSCROPS = gql`
mutation exportMiscellaneousCrops{
  exportMiscellaneousCrops
}
`

const page = () => {
  const { data, loading, error, refetch } = useQuery(QUERY, {});
  const [createMiscellaneousCrops] = useMutation(CREATE_MISCELLANEOUS);
  const [updateMiscellaneousCrops] = useMutation(UPDATE_MISCELLANEOUS);
  const [deleteMiscellaneousCrops] = useMutation(DELETE_MISCELLANEOUS);
  const [exportMiscellaneousCrops] = useMutation(EXPORTS_MISCELLANEOUSCROPS)
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const [allMiscellaneousCrops, setAllMiscellaneousCrops] = useState([])
  const [allCropsCategories, setAllCropsCategories] = useState([])

  useEffect(() => {
    if (!loading && !error) {
      const encryptedMiscellaneousCrops = data?.tokenizedAllMiscellaneousCrops || "";
      let allMiscellaneousCrops = [];
      if (encryptedMiscellaneousCrops) {
        const decrypted = jwt.verify(encryptedMiscellaneousCrops, TOKENIZE);
        allMiscellaneousCrops = decrypted.queryResult;
        setAllMiscellaneousCrops(allMiscellaneousCrops);
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

  // const encryptedMiscellaneousCrops =
  //   data?.tokenizedAllMiscellaneousCrops || "";
  // let allMiscellaneousCrops = [];
  // if (encryptedMiscellaneousCrops) {
  //   const decrypted = jwt.verify(encryptedMiscellaneousCrops, TOKENIZE);
  //   allMiscellaneousCrops = decrypted.queryResult;
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
      Header: "ID",
      accessor: "miscellaneousCropId",
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
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
  ]);

  return (
    <AdminArea header={{ title: "Miscellaneous" }} urlQuery={router.query}>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Miscellaneous`}
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
              await createMiscellaneousCrops({
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
              await updateMiscellaneousCrops({
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
              message: ` Misecllaneous saved!`,
              level: "success",
            });
          } catch (error) {
            notification.handleError(error);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>ID</label>
          <input
            placeholder="Will generated after saved"
            disabled
            className="form-control"
            value={formData.miscellaneousCropId || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                miscellaneousCropId: e.target.value,
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
          loading={loading}
          columns={columns}
          data={allMiscellaneousCrops}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportMiscellaneousCrops()

                    downloadExcelFromBuffer(
                      response.data.exportMiscellaneousCrops.data,
                      "miscellaneous-crops"
                    );
                    // window.open(response.data.exportMiscellaneousCrops, "__blank")
                  } catch (error) {
                    notification.handleError(error)
                  }
                }}
              >
                Export Excel
              </button>
            </div>
          }
          customUtilities={
            !currentUserDontHavePrivilege([
              "Miscellaneous Crops Master Data:Update",
            ])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege([
              "Miscellaneous Crops Master Data:Create",
            ])
              ? () => {
                setFormData({});
                setModalVisible(true);
              }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege([
              "Miscellaneous Crops Master Data:Delete",
            ])
              ? async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} miscellaneous?`
                  );
                  if (yes) {
                    for (const row of rows) {
                      const tokenized = jwt.sign(row, TOKENIZE);
                      await deleteMiscellaneousCrops({
                        variables: {
                          // uuid: row.uuid,
                          tokenized,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} miscellaneous deleted`,
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
