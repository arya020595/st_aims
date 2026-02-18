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
  query listQueries {
    tokenizedAllMilledRiceLocations
  }
`;

const CREATE_MILLED_RICE_LOCATION = gql`
  mutation tokenizedCreateMilledRiceLocation($tokenized: String!) {
    tokenizedCreateMilledRiceLocation(tokenized: $tokenized)
  }
`;

const UPDATE_MILLED_RICE_LOCATION = gql`
  mutation tokenizedUpdateMilledRiceLocation($tokenized: String!) {
    tokenizedUpdateMilledRiceLocation(tokenized: $tokenized)
  }
`;

const DELETE_MILLED_RICE_LOCATION = gql`
  mutation tokenizedDeleteMilledRiceLocation($tokenized: String!) {
    tokenizedDeleteMilledRiceLocation(tokenized: $tokenized)
  }
`;

const EXPORT_MILLEDRICELOCATION = gql`
mutation exportMilledRiceLocation{
  exportMilledRiceLocation
}
`

const MilledRiceLocation = ({ }) => {
  const client = useApolloClient();
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});

  const { data, loading, error, refetch } = useQuery(QUERY, {});
  const [createMilledRiceLocation] = useMutation(CREATE_MILLED_RICE_LOCATION);
  const [updateMilledRiceLocation] = useMutation(UPDATE_MILLED_RICE_LOCATION);
  const [deleteMilledRiceLocation] = useMutation(DELETE_MILLED_RICE_LOCATION);
  const [exportMilledRiceLocation] = useMutation(EXPORT_MILLEDRICELOCATION)
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const [allMilledRiceLocations, setAllMilledRiceLocations] = useState([])

  useEffect(() => {
    if (!loading && !error) {
      const encryptedMilledRiceLocations = data?.tokenizedAllMilledRiceLocations || "";
      let allMilledRiceLocations = [];
      if (encryptedMilledRiceLocations) {
        const decrypted = jwt.verify(encryptedMilledRiceLocations, TOKENIZE);
        allMilledRiceLocations = decrypted.queryResult;
        setAllMilledRiceLocations(allMilledRiceLocations);
      }
    }
  }, [data, loading, error]);

  // const encryptedMilledRiceLocations =
  //   data?.tokenizedAllMilledRiceLocations || "";
  // let allMilledRiceLocations = [];
  // if (encryptedMilledRiceLocations) {
  //   const decrypted = jwt.verify(encryptedMilledRiceLocations, TOKENIZE);
  //   allMilledRiceLocations = decrypted.queryResult;
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
      Header: "Location",
      accessor: "location",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Description",
      accessor: "description",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
  ]);

  return (
    <div>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Milled Rice Location`}
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
              await createMilledRiceLocation({
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
              await updateMilledRiceLocation({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: ` Milled rice location saved!`,
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
              <label>Location</label>
              <input
                className="form-control"
                value={formData.location || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    location: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                value={formData.description || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    description: e.target.value.toUpperCase(),
                  });
                }}
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>
      </FormModal>
      <div className="pr-0 py-2 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allMilledRiceLocations}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportMilledRiceLocation()
                    downloadExcelFromBuffer(response.data.exportMilledRiceLocation.data, "milled-rice-locations")
                    // window.open(response.data.exportMilledRiceLocation, "__blank")
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
              "Milled Rice Location Paddy Master Data Crops:Update",
            ])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege([
              "Milled Rice Location Paddy Master Data Crops:Create",
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
              "Milled Rice Location Paddy Master Data Crops:Delete",
            ])
              ? async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} milled location?`
                  );
                  if (yes) {
                    for (const row of rows) {
                      const tokenized = jwt.sign(row, TOKENIZE);
                      await deleteMilledRiceLocation({
                        variables: {
                          // uuid: row.uuid,
                          tokenized,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} milled location deleted`,
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
export default withApollo({ ssr: true })(MilledRiceLocation);
