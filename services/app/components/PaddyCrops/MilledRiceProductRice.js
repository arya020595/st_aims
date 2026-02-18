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

const QUERY = gql`
  query allCropsMilledRiceProducts {
    allCropsMilledRiceProducts {
      id
      uuid
      typeOfProductId
      typeOfProduct
      price
    }
  }
`;

const CREATE_MILLEDRICEPRODUCT = gql`
  mutation createCropsMilledRiceProduct($typeOfProduct: String, $price: Float) {
    createCropsMilledRiceProduct(typeOfProduct: $typeOfProduct, price: $price)
  }
`;

const UPDATE_MILLEDRICEPRODUCT = gql`
  mutation updateCropsMilledRiceProduct(
    $uuid: String!
    $typeOfProduct: String
    $price: Float
  ) {
    updateCropsMilledRiceProduct(
      uuid: $uuid
      typeOfProduct: $typeOfProduct
      price: $price
    )
  }
`;

const DELETE_MILLEDRICEPRODUCT = gql`
  mutation deleteCropsMilledRiceProduct($uuid: String!) {
    deleteCropsMilledRiceProduct(uuid: $uuid)
  }
`;

const MilledRiceProductRice = ({}) => {
  const { data, loading, eror, refetch } = useQuery(QUERY, {});
  const [createCropsMilledRiceProduct] = useMutation(CREATE_MILLEDRICEPRODUCT);
  const [updateCropsMilledRiceProduct] = useMutation(UPDATE_MILLEDRICEPRODUCT);
  const [deleteCropsMilledRiceProduct] = useMutation(DELETE_MILLEDRICEPRODUCT);
  const client = useApolloClient();
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});

  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  let allCropsMilledRiceProducts = [];
  if (data && data.allCropsMilledRiceProducts) {
    allCropsMilledRiceProducts = data.allCropsMilledRiceProducts;
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
      Header: "Type of Product",
      accessor: "typeOfProduct",
      style: {
        fontSize: 20,
      },
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
        title={`${!formData.uuid ? "New" : "Edit"} Milled Rice`}
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
              await createCropsMilledRiceProduct({
                variables: {
                  ...formData,
                },
              });
              setModalVisible(false);
              setFormData({
                typeOfProduct: "",
                price: 0,
              });
              setModalVisible(true);
            } else {
              await updateCropsMilledRiceProduct({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: ` Milled rice product saved!`,
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
              <label>Type of Product</label>
              <input
                className="form-control"
                value={formData.typeOfProduct || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    typeOfProduct: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Price/Kg</label>
              <NumberFormat
                className="form-control"
                value={formData.price || ""}
                thousandSeparator={","}
                decimalSeparator={"."}
                fixedDecimalScale={true}
                decimalScale={2}
                onValueChange={(e) => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    price: e.floatValue || 0,
                  });
                }}
              />{" "}
            </div>
          </div>
        </div>
      </FormModal>
      <div className="pr-0 py-2 h-full">
        <Table
          columns={columns}
          data={allCropsMilledRiceProducts}
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege([
              "Milled Rice Paddy Master Data Crops:Update",
            ])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege([
              "Milled Rice Paddy Master Data Crops:Create",
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
              "Milled Rice Paddy Master Data Crops:Delete",
            ])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} milled rice?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteCropsMilledRiceProduct({
                          variables: {
                            uuid: row.uuid,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} milled rice deleted`,
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
export default withApollo({ ssr: true })(MilledRiceProductRice);
