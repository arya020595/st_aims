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
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer"
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query allCropsSellingLocations {
    tokenizedAllCropsSellingLocations
  }
`;

const CREATE_SELINGLOCATION = gql`
  mutation tokenizedCreateCropsSellingLocation($tokenized: String!) {
    tokenizedCreateCropsSellingLocation(tokenized: $tokenized)
  }
`;
const UPDATE_SELINGLOCATION = gql`
  mutation tokenizedUpdateCropsSellingLocation($tokenized: String!) {
    tokenizedUpdateCropsSellingLocation(tokenized: $tokenized)
  }
`;

const DELETE_SELINGLOCATION = gql`
  mutation tokenizedDeleteCropsSellingLocation($tokenized: String!) {
    tokenizedDeleteCropsSellingLocation(tokenized: $tokenized)
  }
`;

const EXPORT_SELLINGLOCATION = gql`
mutation exportsCropsSellingLocation{
  exportsCropsSellingLocation
}
`

const SellingLocation = ({ }) => {
  const { data, loading, error, refetch } = useQuery(QUERY, {});
  const [createCropsSellingLocation] = useMutation(CREATE_SELINGLOCATION);
  const [updateCropsSellingLocation] = useMutation(UPDATE_SELINGLOCATION);
  const [deleteCropsSellingLocation] = useMutation(DELETE_SELINGLOCATION);
  const [exportsCropsSellingLocation] = useMutation(EXPORT_SELLINGLOCATION)
  const client = useApolloClient();
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});

  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const [allCropsSellingLocations, setAllCropsSellingLocations] = useState([])

  useEffect(() => {
    if (!loading && !error) {
      const encryptedCropsSellingLocations = data?.tokenizedAllCropsSellingLocations || "";
      let allCropsSellingLocations = [];
      if (encryptedCropsSellingLocations) {
        const decrypted = jwt.verify(encryptedCropsSellingLocations, TOKENIZE);
        allCropsSellingLocations = decrypted.queryResult;
        setAllCropsSellingLocations(allCropsSellingLocations);
      }
    }
  }, [data, loading, error]);

  // const encryptedCropsSellingLocations =
  //   data?.tokenizedAllCropsSellingLocations || "";
  // let allCropsSellingLocations = [];
  // if (encryptedCropsSellingLocations) {
  //   const decrypted = jwt.verify(encryptedCropsSellingLocations, TOKENIZE);
  //   allCropsSellingLocations = decrypted.queryResult;
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
      Header: "Location ID",
      accessor: "locationId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Location",
      accessor: "name",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
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
        title={`${!formData.uuid ? "New" : "Edit"} Selling Location`}
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
              await createCropsSellingLocation({
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
              await updateCropsSellingLocation({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Selling Location saved!`,
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
              <label>Location ID</label>
              <input
                disabled
                placeholder="Will generated after saved"
                className="form-control"
                value={formData.locationId || ""}
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                className="form-control"
                value={formData.name || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    name: e.target.value.toUpperCase(),
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
          data={allCropsSellingLocations}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportsCropsSellingLocation()
                    downloadExcelFromBuffer(response.data.exportsCropsSellingLocation.data, "selling-location-floriculture")
                    // window.open(response.data.exportsCropsSellingLocation, "__blank")
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
              "Selling Location Floriculture:Update",
            ])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege([
              "Selling Location Floriculture:Create",
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
              "Selling Location Floriculture:Delete",
            ])
              ? async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} selling locations?`
                  );
                  if (yes) {
                    for (const row of rows) {
                      const tokenized = jwt.sign(row, TOKENIZE);
                      await deleteCropsSellingLocation({
                        variables: {
                          // uuid: row.uuid,
                          tokenized,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} selling locations deleted`,
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
export default withApollo({ ssr: true })(SellingLocation);
