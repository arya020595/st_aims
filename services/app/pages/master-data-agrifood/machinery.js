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
import AdminArea from "../../components/AdminArea";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";
import { MultiYearsFilterWithExport } from "../../components/MultiYearsFilterWithExport";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer"
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query allMachineries {
    tokenizedAllMachineries
    countMachineries
  }
`;

const CREATE_MACHINERY = gql`
  mutation tokenizedCreateMachinery($tokenized: String!) {
    tokenizedCreateMachinery(tokenized: $tokenized)
  }
`;

const UPDATE_MACHINERY = gql`
  mutation tokenizedUpdateMachinery($tokenized: String!) {
    tokenizedUpdateMachinery(tokenized: $tokenized)
  }
`;

const DELETE_MACHINERY = gql`
  mutation tokenizedDeleteMachinery($tokenized: String!) {
    tokenizedDeleteMachinery(tokenized: $tokenized)
  }
`;

const EXPORT_MACHINERY = gql`
  mutation exportMachinery {
    exportMachinery
  }
`;

const Livestock = () => {
  const router = useRouter();

  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createMachinery] = useMutation(CREATE_MACHINERY);
  const [updateMachinery] = useMutation(UPDATE_MACHINERY);
  const [deleteMachinery] = useMutation(DELETE_MACHINERY);
  const [exportMachinery] = useMutation(EXPORT_MACHINERY);
  const countMachineries = data?.countMachineries || 0;

  const [allMachineries, setAllMachineries] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedMachineries = data?.tokenizedAllMachineries || "";
      let allMachineries = [];
      if (encryptedMachineries) {
        const decrypted = jwt.verify(encryptedMachineries, TOKENIZE);
        allMachineries = decrypted.queryResult;
        setAllMachineries(allMachineries);
      }
    }
  }, [data, loading, error]);

  // const encryptedMachineries = data?.tokenizedAllMachineries || "";
  // let allMachineries = [];
  // if (encryptedMachineries) {
  //   const decrypted = jwt.verify(encryptedMachineries, TOKENIZE);
  //   allMachineries = decrypted.queryResult;
  // }

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
              <p className="text-white font-bold text-md font-bold">
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
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Machine Name",
      accessor: "machineName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Machine Capacity (kg/hr)",
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
              const tokenized = jwt.sign(formData, TOKENIZE);
              await createMachinery({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateMachinery({
                variables: {
                  ...formData,
                  tokenized,
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
                machineType: e.target.value.toUpperCase(),
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
                machineName: e.target.value.toUpperCase(),
              });
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>Machine Capacity (kg/hr)</label>
          <input
            className="form-control"
            value={formData.machineCapacity || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                machineCapacity: e.target.value.toUpperCase(),
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
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportMachinery();
                    downloadExcelFromBuffer(
                      response.data.exportMachinery.data,
                      "machinery-agrifood"
                    );
                    // window.open(response.data.exportMachinery, "__blank")
                  } catch (error) {
                    notification.handleError(error);
                  }
                }}
              >
                Export Excel
              </button>
            </div>
          }
          onAdd={(e) => {
            if (e) e.preventDefault();

            let PREFIX = "MA000";
            let count = "" + (countMachineries + 1);

            PREFIX = PREFIX.slice(0, count.length * -1) + count;

            setFormData({
              machineId: PREFIX,
            });
            setModalVisible(true);
          }}
          onRemove={async ({ rows }) => {
            showLoadingSpinner();
            try {
              let yes = confirm(
                `Are you sure to delete ${rows.length} machineries?`
              );
              if (yes) {
                for (const row of rows) {
                  const tokenized = jwt.sign(row, TOKENIZE);
                  await deleteMachinery({
                    variables: {
                      // uuid: row.uuid,
                      tokenized,
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
          }}
          customUtilities={customUtilities}
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Livestock);
