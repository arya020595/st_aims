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
import NumberFormat from "react-number-format";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query ListOfQuery {
    tokenizedAllCropsPaddySeedVarieties

    tokenizedAllCropsCategories
  }
`;

const CREATE_SEEDVARIETY = gql`
  mutation tokenizedCreateCropsPaddySeedVariety($tokenized: String!) {
    tokenizedCreateCropsPaddySeedVariety(tokenized: $tokenized)
  }
`;

const UPDATE_SEEDVARIETY = gql`
  mutation tokenizedUpdateCropsPaddySeedVariety($tokenized: String!) {
    tokenizedUpdateCropsPaddySeedVariety(tokenized: $tokenized)
  }
`;

const DELETE_SEEDVARIETY = gql`
  mutation tokenizedDeleteCropsPaddySeedVariety($tokenized: String!) {
    tokenizedDeleteCropsPaddySeedVariety(tokenized: $tokenized)
  }
`;

const EXPORT_PADDYSEED = gql`
  mutation exportCropsPaddySeedVariety {
    exportCropsPaddySeedVariety
  }
`;

const PaddySeedVariety = ({}) => {
  const { data, loading, error, refetch } = useQuery(QUERY, {});
  const [createCropsPaddySeedVariety] = useMutation(CREATE_SEEDVARIETY);
  const [updateCropsPaddySeedVariety] = useMutation(UPDATE_SEEDVARIETY);
  const [deleteCropsPaddySeedVariety] = useMutation(DELETE_SEEDVARIETY);
  const [exportCropsPaddySeedVariety] = useMutation(EXPORT_PADDYSEED);
  const client = useApolloClient();
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({
    price: 0,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const [allCropsPaddySeedVarieties, setAllCropsPaddySeedVarieties] = useState(
    []
  );
  const [allCropsCategories, setAllCropsCategories] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedCropsPaddySeedVarieties =
        data?.tokenizedAllCropsPaddySeedVarieties || "";
      let allCropsPaddySeedVarieties = [];
      if (encryptedCropsPaddySeedVarieties) {
        const decrypted = jwt.verify(
          encryptedCropsPaddySeedVarieties,
          TOKENIZE
        );
        allCropsPaddySeedVarieties = decrypted.queryResult;
        setAllCropsPaddySeedVarieties(allCropsPaddySeedVarieties);
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

  // const encryptedCropsPaddySeedVarieties =
  //   data?.tokenizedAllCropsPaddySeedVarieties || "";
  // let allCropsPaddySeedVarieties = [];
  // if (encryptedCropsPaddySeedVarieties) {
  //   const decrypted = jwt.verify(encryptedCropsPaddySeedVarieties, TOKENIZE);
  //   allCropsPaddySeedVarieties = decrypted.queryResult;
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
      Header: "Paddy Seed ID",
      accessor: "paddySeedId",
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
      Header: "Variety Name",
      accessor: "varietyName",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Price/Kg",
      accessor: "price",
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
        title={`${!formData.uuid ? "New" : "Edit"} Paddy Seed Variety`}
        visible={modalVisible}
        size={"md"}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            price: 0,
          });
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { uuid, __typename, __createdAt, __updatedAt } = formData;
            if (!uuid) {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await createCropsPaddySeedVariety({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
              setModalVisible(false);
              setFormData({
                varietyName: "",
                price: 0,
              });
              setModalVisible(true);
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateCropsPaddySeedVariety({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: ` Seed variety saved!`,
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
              <label>Paddy Seed ID</label>
              <input
                disabled
                placeholder="Will generate after saved"
                className="form-control"
                value={formData.paddySeedId || ""}
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
                  if (e)
                    e.preventDefault(),
                      setFormData({
                        ...formData,
                        varietyName: e.target.value.toUpperCase(),
                      });
                }}
              />
            </div>
            <div className="form-group">
              <label>Price/Kg</label>
              <NumberFormat
                className="form-control"
                value={formData.price || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    price: e.floatValue,
                  });
                }}
              />{" "}
            </div>
            <div className="form-group">
              <label>Variety Type</label>
              <select
                className="form-control"
                value={formData.varietyType || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    varietyType: e.target.value,
                  });
                }}
              >
                <option value="" disabled>
                  Select Variety Type
                </option>
                <option value="INBRED">INBRED</option>
                <option value="HYBRID">HYBRID</option>
              </select>
            </div>
            <div className="form-group">
              <label>Type of Seed</label>
              <select
                className="form-control"
                value={formData.typeOfSeed || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    typeOfSeed: e.target.value,
                  });
                }}
              >
                <option value="" disabled>
                  Select type of seed
                </option>
                <option value="FOUNDATION SEED">FOUNDATION SEED</option>
                <option value="BREEDER SEED">BREEDER SEED</option>
                <option value="FARMERS SEED">FARMERS SEED</option>
              </select>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description || ""}
                className="form-control"
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    description: e.target.value.toUpperCase(),
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
          data={allCropsPaddySeedVarieties}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportCropsPaddySeedVariety();

                    downloadExcelFromBuffer(
                      response.data.exportCropsPaddySeedVariety.data,
                      "paddy-seed-variety-crops"
                    );
                    // window.open(
                    //   response.data.exportCropsPaddySeedVariety,
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
            !currentUserDontHavePrivilege([
              "Paddy Seed Variety Paddy Master Data Crops:Update",
            ])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege([
              "Paddy Seed Variety Paddy Master Data Crops:Create",
            ])
              ? () => {
                  setFormData({
                    price: 0,
                  });
                  setModalVisible(true);
                }
              : null
          }
          customUtilitiesPosition="left"
          onRemove={
            !currentUserDontHavePrivilege([
              "Paddy Seed Variety Paddy Master Data Crops:Delete",
            ])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} paddy seed varietys?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteCropsPaddySeedVariety({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} paddy seed varietys deleted`,
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
export default withApollo({ ssr: true })(PaddySeedVariety);
