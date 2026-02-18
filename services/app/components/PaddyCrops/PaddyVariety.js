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
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer"
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listOfQuery {
    tokenizedAllCropsPaddyVarieties
    tokenizedAllCropsCategories
  }
`;

const CREATE_PADDYVARIETY = gql`
  mutation tokenizedCreateCropsPaddyVariety($tokenized: String!) {
    tokenizedCreateCropsPaddyVariety(tokenized: $tokenized)
  }
`;

const UPDATE_PADDYVARIETY = gql`
  mutation tokenizedUpdateCropsPaddyVariety($tokenized: String!) {
    tokenizedUpdateCropsPaddyVariety(tokenized: $tokenized)
  }
`;

const DELETE_PADDYVARIETY = gql`
  mutation tokenizedDeleteCropsPaddyVariety($tokenized: String!) {
    tokenizedDeleteCropsPaddyVariety(tokenized: $tokenized)
  }
`;

const EXPORT_PADDYVERIETY = gql`
mutation exportCropsPaddyVariety{
  exportCropsPaddyVariety
}
`

const PaddyVariety = ({ }) => {
  const { data, loading, error, refetch } = useQuery(QUERY, {});
  const [createCropsPaddyVariety] = useMutation(CREATE_PADDYVARIETY);
  const [updateCropsPaddyVariety] = useMutation(UPDATE_PADDYVARIETY);
  const [deleteCropsPaddyVariety] = useMutation(DELETE_PADDYVARIETY);
  const [exportCropsPaddyVariety] = useMutation(EXPORT_PADDYVERIETY)
  const client = useApolloClient();
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({
    schemePrice: 0,
    marketPrice: 0,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const [allCropsPaddyVarieties, setAllCropsPaddyVarieties] = useState([])
  const [allCropsCategories, setAllCropsCategories] = useState([])

  useEffect(() => {
    if (!loading && !error) {
      const encryptedCropsPaddyVarieties = data?.tokenizedAllCropsPaddyVarieties || "";
      let allCropsPaddyVarieties = [];
      if (encryptedCropsPaddyVarieties) {
        const decrypted = jwt.verify(encryptedCropsPaddyVarieties, TOKENIZE);
        allCropsPaddyVarieties = decrypted.queryResult;
        setAllCropsPaddyVarieties(allCropsPaddyVarieties);
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

  // const encryptedCropsPaddyVarieties =
  //   data?.tokenizedAllCropsPaddyVarieties || "";
  // let allCropsPaddyVarieties = [];
  // if (encryptedCropsPaddyVarieties) {
  //   const decrypted = jwt.verify(encryptedCropsPaddyVarieties, TOKENIZE);
  //   allCropsPaddyVarieties = decrypted.queryResult;
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
      Header: "Paddy ID",
      accessor: "paddyId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Paddy Category",
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
    {
      Header: "Scheme Price/Kg",
      accessor: "schemePrice",
      style: {
        fontSize: 20,
        width: 200,
      },
    },
    {
      Header: "Market Price/Kg",
      accessor: "marketPrice",
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
        title={`${!formData.uuid ? "New" : "Edit"} Paddy Variety`}
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
              await createCropsPaddyVariety({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
              setModalVisible(false);
              setFormData({
                varietyName: "",
                schemePrice: 0,
                marketPrice: 0,
              });
              setModalVisible(true);
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateCropsPaddyVariety({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: ` Paddy variety saved!`,
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
              <label>Paddy ID</label>
              <input
                disabled
                placeholder="Will generated after saved"
                className="form-control"
                value={formData.paddyId || ""}
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
                value={formData.varietyName}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    varietyName: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Market Price/Kg</label>
              <NumberFormat
                className="form-control"
                value={formData.schemePrice || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    schemePrice: e.floatValue || 0,
                  });
                }}
              />{" "}
            </div>
            <div className="form-group">
              <label>New Market Price/Kg</label>
              <NumberFormat
                className="form-control"
                value={formData.marketPrice || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    marketPrice: e.floatValue || 0,
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
          data={allCropsPaddyVarieties}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportCropsPaddyVariety()
                    downloadExcelFromBuffer(response.data.exportCropsPaddyVariety.data, "paddy-variety")

                    // window.open(response.data.exportCropsPaddyVariety, "__blank")
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
              "Paddy Variety Paddy Master Data Crops:Update",
            ])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege([
              "Paddy Variety Paddy Master Data Crops:Create",
            ])
              ? () => {
                setFormData({
                  schemePrice: 0,
                  marketPrice: 0,
                });
                setModalVisible(true);
              }
              : null
          }
          customUtilitiesPosition="left"
          onRemove={
            !currentUserDontHavePrivilege([
              "Paddy Variety Paddy Master Data Crops:Delete",
            ])
              ? async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} paddy varietys?`
                  );
                  if (yes) {
                    for (const row of rows) {
                      const tokenized = jwt.sign(row, TOKENIZE);
                      await deleteCropsPaddyVariety({
                        variables: {
                          // uuid: row.uuid,
                          tokenized,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} paddy varietys deleted`,
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
export default withApollo({ ssr: true })(PaddyVariety);
