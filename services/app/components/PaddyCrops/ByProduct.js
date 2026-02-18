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
  query allCropsPaddyByProducts {
    tokenizedAllCropsPaddyByProducts
  }
`;

const CREATE_BYPRODUCT = gql`
  mutation tokenizedCreateCropsPaddyByProduct($tokenized: String!) {
    tokenizedCreateCropsPaddyByProduct(tokenized: $tokenized)
  }
`;

const UPDATE_BYPRODUCT = gql`
  mutation tokenizedUpdateCropsPaddyByProduct($tokenized: String!) {
    tokenizedUpdateCropsPaddyByProduct(tokenized: $tokenized)
  }
`;

const DELETE_BYPRODUCT = gql`
  mutation tokenizedDeleteCropsPaddyByProduct($tokenized: String!) {
    tokenizedDeleteCropsPaddyByProduct(tokenized: $tokenized)
  }
`;

const EXPORT_BYPRODUCT = gql`
mutation exportsCropsPaddyByProduct{
  exportsCropsPaddyByProduct
}
`
const ByProduct = ({ }) => {
  const { data, loading, error, refetch } = useQuery(QUERY, {});
  const [createCropsPaddyByProduct] = useMutation(CREATE_BYPRODUCT);
  const [updateCropsPaddyByProduct] = useMutation(UPDATE_BYPRODUCT);
  const [deleteCropsPaddyByProduct] = useMutation(DELETE_BYPRODUCT);
  const [exportsCropsPaddyByProduct] = useMutation(EXPORT_BYPRODUCT)
  const client = useApolloClient();
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({
    price: 0,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const [allCropsPaddyByProducts, setAllCropsPaddyByProducts] = useState([])

  useEffect(() => {
    if (!loading && !error) {
      const encryptedCropsPaddyByProducts = data?.tokenizedAllCropsPaddyByProducts || "";
      let allCropsPaddyByProducts = [];
      if (encryptedCropsPaddyByProducts) {
        const decrypted = jwt.verify(encryptedCropsPaddyByProducts, TOKENIZE);
        allCropsPaddyByProducts = decrypted.queryResult;
        setAllCropsPaddyByProducts(allCropsPaddyByProducts);
      }
    }
  }, [data, loading, error]);

  // const encryptedCropsPaddyByProducts =
  //   data?.tokenizedAllCropsPaddyByProducts || "";
  // let allCropsPaddyByProducts = [];
  // if (encryptedCropsPaddyByProducts) {
  //   const decrypted = jwt.verify(encryptedCropsPaddyByProducts, TOKENIZE);
  //   allCropsPaddyByProducts = decrypted.queryResult;
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
      Header: "Type of By-Product",
      accessor: "typeOfByProduct",
      style: {
        fontSize: 20,
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
        title={`${!formData.uuid ? "New" : "Edit"} By-Product`}
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
              await createCropsPaddyByProduct({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
              setModalVisible(false);
              setFormData({
                price: 0,
              });
              setModalVisible(true);
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateCropsPaddyByProduct({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: ` Paddy by product saved!`,
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
              <label>Type of By-Product</label>
              <input
                className="form-control"
                value={formData.typeOfByProduct || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    typeOfByProduct: e.target.value.toUpperCase(),
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
              />
            </div>
          </div>
        </div>
      </FormModal>
      <div className="pr-0 py-2 h-full">
        <Table
          columns={columns}
          data={allCropsPaddyByProducts}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportsCropsPaddyByProduct()

                    downloadExcelFromBuffer(response.data.exportsCropsPaddyByProduct.data, "paddy-by-product")
                    // window.open(response.data.exportsCropsPaddyByProduct, "__blank")
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
              "By Product Paddy Master Data Crops:Update",
            ])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege([
              "By Product Paddy Master Data Crops:Create",
            ])
              ? () => {
                setFormData({
                  typeOfByProduct: "",
                  price: 0,
                });
                setModalVisible(true);
              }
              : null
          }
          customUtilitiesPosition="left"
          onRemove={
            !currentUserDontHavePrivilege([
              "By Product Paddy Master Data Crops:Delete",
            ])
              ? async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} by-product?`
                  );
                  if (yes) {
                    for (const row of rows) {
                      const tokenized = jwt.sign(row, TOKENIZE);
                      await deleteCropsPaddyByProduct({
                        variables: {
                          // uuid: row.uuid,
                          tokenized,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} by-product deleted`,
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
export default withApollo({ ssr: true })(ByProduct);
