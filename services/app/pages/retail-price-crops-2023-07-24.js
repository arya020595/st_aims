import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../components/App";
import { useNotification } from "../components/Notification";
import { handleError } from "../libs/errors";
import AdminArea, { useCurrentUser } from "../components/AdminArea";
import Table from "../components/Table";
import { useQuery, useLazyQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { FormModal } from "../components/Modal";
import { useRouter } from "next/router";
import { create, filter } from "lodash";
import { from } from "apollo-link";
import { configure } from "nprogress";
import Head from "next/dist/next-server/lib/head";
import { Leaf } from "slate";
import NumberFormat from "react-number-format";
import lodash from "lodash";

const QUERY = gql`
  query allCropRetailPrices {
    allCropRetailPrices {
      id
      uuid
      monthYear
      code
      description
      retailPrice

      FarmLocation {
        uuid
        district
      }
    }

    allFarmLocations {
      uuid
      district
    }
  }
`;

const CREATE_RETAILPRICE = gql`
  mutation createCropRetailPrice(
    $monthYear: String!
    $code: String
    $description: String
    $retailPrice: Float!
    $farmLocationUUID: String!
  ) {
    createCropRetailPrice(
      monthYear: $monthYear
      code: $code
      description: $description
      retailPrice: $retailPrice
      farmLocationUUID: $farmLocationUUID
    )
  }
`;

const UPDATE_RETAILPRICE = gql`
  mutation updateCropRetailPrice(
    $uuid: String!
    $monthYear: String!
    $code: String
    $description: String
    $retailPrice: Float!
    $farmLocationUUID: String!
  ) {
    updateCropRetailPrice(
      uuid: $uuid
      monthYear: $monthYear
      code: $code
      description: $description
      retailPrice: $retailPrice
      farmLocationUUID: $farmLocationUUID
    )
  }
`;

const DELETE_RETAILPRICE = gql`
  mutation deleteCropRetailPrice($uuid: String!) {
    deleteCropRetailPrice(uuid: $uuid)
  }
`;

const page = () => {
  const { data, loading, eror, refetch } = useQuery(QUERY, {});
  const [createCropRetailPrice] = useMutation(CREATE_RETAILPRICE);
  const [updateCropRetailPrice] = useMutation(UPDATE_RETAILPRICE);
  const [deleteCropRetailPrice] = useMutation(DELETE_RETAILPRICE);

  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();

  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  let allCropRetailPrices = [];
  if (data && data.allCropRetailPrices) {
    allCropRetailPrices = data.allCropRetailPrices;
  }

  let allFarmLocations = data?.allFarmLocations || [];
  allFarmLocations = lodash.uniqBy(allFarmLocations, (loc) => loc.district);

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
                  farmLocationUUID:
                    props.row.original?.FarmLocation?.uuid || "",
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
      Header: "Year and Month",
      accessor: "monthYear",
      style: {
        fontSize: 20,
      },
    },

    {
      Header: "Code",
      accessor: "code",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Decription",
      accessor: "description",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Retail Price",
      accessor: "retailPrice",
      style: {
        fontSize: 20,
      },
      Cell: (props) => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "District",
      accessor: "FarmLocation.district",
      style: {
        fontSize: 20,
      },
    },
  ]);

  return (
    <AdminArea header={{ title: "Retail Price" }} urlQuery={router.query}>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Retail Price`}
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
              await createCropRetailPrice({
                variables: {
                  ...formData,
                },
              });
              setModalVisible(false);
              setFormData({});
              setModalVisible(true);
            } else {
              await updateCropRetailPrice({
                variables: {
                  ...formData,
                },
              });
            }
            setModalVisible(false);
            setFormData({});
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: ` Retail Price saved!`,
              level: "success",
            });
          } catch (error) {
            notification.handleError(error);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Month & Year</label>
          <input
            type="month"
            className="form-control"
            value={formData.monthYear || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                monthYear: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>District</label>
          <select
            className="form-control"
            value={formData.farmLocationUUID || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                farmLocationUUID: e.target.value,
              });
            }}
          >
            <option value={""} disabled>
              Select District
            </option>
            {allFarmLocations.map((loc) => (
              <option value={loc.uuid}>{loc.district}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Code</label>
          <input
            className="form-control"
            value={formData.code || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                code: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <input
            className="form-control"
            value={formData.description || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                description: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Retail Price ($)</label>
          <NumberFormat
            className="form-control"
            value={formData.retailPrice || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                retailPrice: e.floatValue || 0,
              });
            }}
          />
        </div>
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={false}
          columns={columns}
          data={allCropRetailPrices}
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege(["Retail Price Crops:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege(["Retail Price Crops:Create"])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Retail Price Crops:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} Crops Retail Price?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        deleteCropRetailPrice({
                          variables: {
                            uuid: row.uuid,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} Crops Retail Price deleted`,
                        level: "success",
                      });
                      await refetch();
                    }
                  } catch (error) {
                    handleError(error);
                  }
                  hideLoadingSpinner();
                  refetch();
                }
              : null
          }
        />
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(page);
