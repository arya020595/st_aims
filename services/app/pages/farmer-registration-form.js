import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../components/App";
import { addNotification, useNotification } from "../components/Notification";
import { handleError } from "../libs/errors";
import AdminArea from "../components/AdminArea";
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
import { useCurrentUser } from "../components/AdminArea";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERIES = gql`
  query listQueries {
    tokenizedAllFarmerRegistrationForms
  }
`;

const SET_STATUS = gql`
  mutation setStatusFarmerRegistration($uuid: String!, $status: String!) {
    setStatusFarmerRegistration(uuid: $uuid, status: $status)
  }
`;

const DELETE_USER = gql`
  mutation deleteFarmerRegistrationForm($uuid: String!) {
    deleteFarmerRegistrationForm(uuid: $uuid)
  }
`;
const Page = () => {
  const router = useRouter();
  const notification = useNotification();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const [status, setStatus] = useState("");
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [registrationId, setRegistrationId] = useState("");

  const [setStatusFarmerRegistration] = useMutation(SET_STATUS);
  const [deleteFarmerRegistrationForm] = useMutation(DELETE_USER);
  const { data, error, loading, refetch } = useQuery(QUERIES, {
    variables: {},
  });

  let allFarmerRegistrationForms = [];
  const encryptedFarmerRegistrationForms =
    data?.tokenizedAllFarmerRegistrationForms || "";
  if (encryptedFarmerRegistrationForms) {
    const decrypted = jwt.verify(encryptedFarmerRegistrationForms, TOKENIZE);
    allFarmerRegistrationForms = decrypted.queryResult;
  }

  const columns = useMemo(() => [
    {
      Header: "Name",
      accessor: "name",
      style: {
        fontSize: 20,
        width: 150,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "IC. No",
      accessor: "icNo",
      style: {
        fontSize: 20,
        width: 150,
      },
    },
    {
      Header: "ROCBN No",
      accessor: "rocbnRegNo",
      style: {
        fontSize: 20,
        width: 150,
      },
    },
    {
      Header: "DOAA Reg. No",
      accessor: "doaaRegNo",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Email",
      accessor: "email",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Phone",
      accessor: "phone",
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
      Cell: (props) =>
        !currentUserDontHavePrivilege(
          ["Farmer Registration:Update"],
          currentUser
        ) ? (
          <button
            className={`w-full py-2 text-white text-md font-bold rounded-md shadow-dm
      ${
        props.value === "WAITING"
          ? "bg-gray-400"
          : props.value === "ACCEPTED"
          ? "bg-mantis-500"
          : "bg-red-500"
      }
      `}
            onClick={openStatus(props.row.original)}
          >
            {props.value === "ACCEPTED"
              ? "ACCEPT"
              : props.value === "REJECTED"
              ? "REJECT"
              : "PENDING"}
          </button>
        ) : null,
    },
  ]);

  const openStatus = (data) => (e) => {
    setRegistrationId(data.uuid);
    setStatusModalVisible(true);
  };

  return (
    <AdminArea urlQuery={router.query}>
      <FormModal
        title={`Set Status Farmer Registration`}
        visible={statusModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setStatusModalVisible(false);
        }}
      >
        <div className="grid grid-cols-3 gap-2">
          <div>
            <button
              className="bg-mantis-500 w-full py-2 rounded-md shadow-md text-white font-bold"
              onClick={async (e) => {
                if (e) e.preventDefault();
                try {
                  if (
                    confirm(
                      "Are you sure to accept this farmer registration ? "
                    )
                  ) {
                    await setStatusFarmerRegistration({
                      variables: {
                        uuid: registrationId,
                        status: "ACCEPTED",
                      },
                    });

                    notification.addNotification({
                      title: "Success",
                      message: "Farmer registration accepted",
                      level: "success",
                    });

                    await refetch();
                  }
                } catch (err) {
                  notification.handleError(err);
                }
              }}
            >
              Accept*
            </button>
          </div>
          <div>
            <button
              className="bg-red-500 w-full py-2 rounded-md shadow-md text-white font-bold"
              onClick={async (e) => {
                if (
                  confirm("Are you sure to reject this farmer registration ? ")
                ) {
                  await setStatusFarmerRegistration({
                    variables: {
                      uuid: registrationId,
                      status: "REJECTED",
                    },
                  });

                  notification.addNotification({
                    title: "Success",
                    message: "Farmer registration rejected",
                    level: "success",
                  });
                  await refetch();
                }
              }}
            >
              Reject
            </button>
          </div>
          <div>
            <button className="bg-gray-500 w-full py-2 rounded-md shadow-md text-white font-bold">
              Pending
            </button>
          </div>
        </div>
        <p className="text-md font-semibold mt-4">
          *If "Accept" is selected, it will automatically create a new active
          user{" "}
        </p>
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        {!currentUserDontHavePrivilege(
          ["Farmer Registration:Read"],
          currentUser
        ) ? (
          <Table
            loading={loading}
            columns={columns}
            data={allFarmerRegistrationForms}
            withoutHeader={true}
            // customUtilities={customUtilities}
            // onAdd={() => {
            //   setFormData({});
            //   setModalVisible(true);
            // }}
            onRemove={
              !currentUserDontHavePrivilege(
                ["Farmer Registration:Delete"],
                currentUser
              )
                ? async ({ rows }) => {
                    showLoadingSpinner();
                    try {
                      for (const row of rows) {
                        await deleteFarmerRegistrationForm({
                          variables: {
                            uuid: row.uuid,
                          },
                        });
                      }

                      notification.addNotification({
                        title: "Success!",
                        message: `User Form deleted!`,
                        level: "success",
                      });
                    } catch (err) {
                      notification.handleError(err);
                    }
                    hideLoadingSpinner();
                    refetch();
                  }
                : null
            }
            // customUtilitiesPosition="left"
          />
        ) : null}
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Page);
