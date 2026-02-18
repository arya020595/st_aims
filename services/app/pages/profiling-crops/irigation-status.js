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
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query allIrigationStatuses {
    tokenizedAllIrigationStatus
  }
`;

const CREATE_IRIGATION_STATUS = gql`
  mutation tokenizedCreateIrigationStatus($tokenized: String!) {
    tokenizedCreateIrigationStatus(tokenized: $tokenized)
  }
`;

const UPDATE_IRIGATION_STATUS = gql`
  mutation tokenizedUpdateIrigationStatus($tokenized: String!) {
    tokenizedUpdateIrigationStatus(tokenized: $tokenized)
  }
`;

const DELETE_IRIGATION_STATUS = gql`
  mutation tokenizedDeleteIrigationStatus($tokenized: String!) {
    tokenizedDeleteIrigationStatus(tokenized: $tokenized)
  }
`;
const IrigationStatus = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createIrigationStatus] = useMutation(CREATE_IRIGATION_STATUS);
  const [updateIrigationStatus] = useMutation(UPDATE_IRIGATION_STATUS);
  const [deleteIrigationStatus] = useMutation(DELETE_IRIGATION_STATUS);

  const [allIrigationStatuses, setAllIrigationStatuses] = useState([])

  useEffect(() => {
    if (!loading && !error) {
      const encryptedIrigationStatuses = data?.tokenizedAllIrigationStatus || "";
      let allIrigationStatuses = [];
      if (encryptedIrigationStatuses) {
        const decrypted = jwt.verify(encryptedIrigationStatuses, TOKENIZE);
        allIrigationStatuses = decrypted.queryResult;
        setAllIrigationStatuses(allIrigationStatuses);
      }
    }
  }, [data, loading, error]);

  // const encryptedIrigationStatuses = data?.tokenizedAllIrigationStatus || "";
  // let allIrigationStatuses = [];
  // if (encryptedIrigationStatuses) {
  //   const decrypted = jwt.verify(encryptedIrigationStatuses, TOKENIZE);
  //   allIrigationStatuses = decrypted.queryResult;
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
      Header: "ID",
      accessor: "id",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Status",
      accessor: "status",
      style: {
        fontSize: 20,
      },
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Irrigation Status</title>
      </Head>

      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Irrigation Status`}
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
              await createIrigationStatus({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateIrigationStatus({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Irigation Status saved!`,
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
          <label>Irrigation Status</label>
          <input
            className="form-control"
            value={formData.status || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                status: e.target.value.toUpperCase(),
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
          data={allIrigationStatuses}
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege([
              "Irrigation Status Profiling Crops:Create",
            ])
              ? (e) => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({});
              }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege([
              "Irrigation Status Profiling Crops:Delete",
            ])
              ? async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} statuses?`
                  );
                  if (yes) {
                    for (const row of rows) {
                      const tokenized = jwt.sign(row, TOKENIZE);
                      await deleteIrigationStatus({
                        variables: {
                          // uuid: row.uuid,
                          tokenized,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} statuses deleted`,
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
            !currentUserDontHavePrivilege([
              "Irrigation Status Profiling Crops:Update",
            ])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(IrigationStatus);
