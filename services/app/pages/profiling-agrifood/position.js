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
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query allPositions {
    # allPositions {
    #   id
    #   uuid
    #   name
    #   description
    # }
    tokenizedAllPositions
  }
`;

const CREATE_POSITION = gql`
  mutation createPosition(
    #$name: String!
    #$description: String
    $tokenized: String!
  ) {
    createPosition(
      #name: $name
      #description: $description
      tokenized: $tokenized
    )
  }
`;

const UPDATE_POSITION = gql`
  mutation updatePosition(
    #$uuid: String!
    #$name: String
    #$description: String
    $tokenized: String!
  ) {
    updatePosition(
      #uuid: $uuid
      #name: $name
      #description: $description
      tokenized: $tokenized
    )
  }
`;

const DELETE_POSITION = gql`
  mutation deletePosition(
    #$uuid: String!
    $tokenized: String!
  ) {
    deletePosition(
      #uuid: $uuid
      tokenized: $tokenized
    )
  }
`;
const Position = () => {
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const router = useRouter();

  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createPosition] = useMutation(CREATE_POSITION);
  const [updatePosition] = useMutation(UPDATE_POSITION);
  const [deletePosition] = useMutation(DELETE_POSITION);

  const [allPositions, setAllPositions] = useState([])

  useEffect(() => {
    if (!loading && !error) {
      const encryptedPositions = data?.tokenizedAllPositions || "";
      let allPositions = [];
      if (encryptedPositions) {
        const decrypted = jwt.verify(encryptedPositions, TOKENIZE);
        allPositions = decrypted.queryResult;
        setAllPositions(allPositions);
      }
    }
  }, [data, loading, error]);

  // const encrypted = data?.tokenizedAllPositions || "";

  // let allPositions = [];
  // if (encrypted) {
  //   const decrypted = jwt.verify(encrypted, TOKENIZE);
  //   allPositions = decrypted.queryResult;
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
      Header: "Name",
      accessor: "name",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>
    },
    {
      Header: "Description",
      accessor: "description",
      style: {
        fontSize: 20,
        width: 500,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Position</title>
      </Head>

      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Position`}
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
              await createPosition({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updatePosition({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Position saved!`,
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
          <label>Position</label>
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
          />
        </div>
      </FormModal>

      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allPositions}
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege([
              "Position Profiling Agrifood:Create",
            ])
              ? (e) => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({});
              }
              : null
            // currentUserDontHavePrivilege(["Position:Create"])
            //   ? null
            //   : (e) => {
            //       if (e) e.preventDefault();
            //       setModalVisible(true);
            //       setFormData({});
            //     }
          }
          onRemove={
            !currentUserDontHavePrivilege([
              "Position Profiling Agrifood:Delete",
            ])
              ? async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} positions?`
                  );
                  if (yes) {
                    for (const row of rows) {
                      const tokenized = jwt.sign(row, TOKENIZE);
                      await deletePosition({
                        variables: {
                          // uuid: row.uuid,
                          tokenized,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} positions deleted`,
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
              "Position Profiling Agrifood:Update",
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
export default withApollo({ ssr: true })(Position);
