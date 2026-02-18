import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../../components/App";
import { handleError } from "../../libs/errors";
import redirect from "../../libs/redirect";
import gql from "graphql-tag";
import {
  useMutation,
  useQuery,
  useApolloClient,
  ApolloProvider,
} from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";
import { MultiYearsFilterWithExport } from "../../components/MultiYearsFilterWithExport";

const QUERY = gql`
  query allMachineries {
    allMachineries {
      id
      uuid
      machineId
      machineType
      machineName
      machineCapacity
    }
    countMachineries
  }
`;

const CREATE_MACHINERY = gql`
  mutation createMachinery(
    $machineId: String
    $machineType: String!
    $machineName: String!
    $machineCapacity: String!
  ) {
    createMachinery(
      machineId: $machineId
      machineType: $machineType
      machineName: $machineName
      machineCapacity: $machineCapacity
    )
  }
`;

const UPDATE_MACHINERY = gql`
  mutation updateMachinery(
    $uuid: String!
    $machineId: String
    $machineType: String!
    $machineName: String!
    $machineCapacity: String!
  ) {
    updateMachinery(
      uuid: $uuid
      machineId: $machineId
      machineType: $machineType
      machineName: $machineName
      machineCapacity: $machineCapacity
    )
  }
`;

const DELETE_MACHINERY = gql`
  mutation deleteMachinery($uuid: String!) {
    deleteMachinery(uuid: $uuid)
  }
`;
const Machinery = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createMachinery] = useMutation(CREATE_MACHINERY);
  const [updateMachinery] = useMutation(UPDATE_MACHINERY);
  const [deleteMachinery] = useMutation(DELETE_MACHINERY);

  const allMachineries = data?.allMachineries || [];
  const countMachineries = data?.countMachineries || 0;

  const customUtilities = useMemo(() => [
    {
      label: "Edit",
      icon: <i className="fa fa-pencil" />,
      width: 400,
      render: (propsTable) => {
        return (
          <div className="flex">
            <button
              onClick={(e) => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                });
              }}
              className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg"
            >
              <p className="text-white text-md font-bold">
                <i className="fa fa-pencil-alt " /> Edit
              </p>
            </button>
          </div>
        );
      },
    },
  ]);

  const columns = useMemo(() => [
    {
      Header: "Machine ID",
      accessor: "machineId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Machine Type",
      accessor: "machineType",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Machine Name",
      accessor: "machineName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Machine Capacity",
      accessor: "machineCapacity",
      style: {
        fontSize: 20,
      },
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Machine</title>
      </Head>

      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Machine`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({});
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          try {
            let { uuid } = formData;
            if (!uuid) {
              await createMachinery({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateMachinery({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Machine saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Machine ID</label>
          <input
            className="form-control"
            value={formData.machineId || ""}
            disabled
          />
        </div>
        <div className="form-group">
          <label>Machine Type</label>
          <input
            className="form-control"
            value={formData.machineType || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                machineType: e.target.value,
              });
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>Machine Name</label>
          <input
            className="form-control"
            value={formData.machineName || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                machineName: e.target.value,
              });
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>Machine Capacity</label>
          <input
            className="form-control"
            value={formData.machineCapacity || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                machineCapacity: e.target.value,
              });
            }}
            required
          />
        </div>
      </FormModal>

      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allMachineries}
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege(["Machinery Livestock:Create"])
              ? (e) => {
                  if (e) e.preventDefault();

                  let PREFIX = "MA000";
                  let count = "" + (countMachineries + 1);

                  PREFIX = PREFIX.slice(0, count.length * -1) + count;

                  setFormData({
                    machineId: PREFIX,
                  });
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Machinery Livestock:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} machineries?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteMachinery({
                          variables: {
                            uuid: row.uuid,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} machineries deleted`,
                        level: "success",
                      });
                      await refetch();
                    }
                  } catch (err) {
                    handleError(err);
                  }
                  hideLoadingSpinner();
                }
              : null
          }
          customUtilities={
            !currentUserDontHavePrivilege(["Machinery Livestock:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Machinery);
