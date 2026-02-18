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
  query allAwardTypes {
    tokenizedAllAwardTypes
  }
`;

const CREATE_AWARD = gql`
  mutation tokenizedCreateAwardType($tokenized: String!) {
    tokenizedCreateAwardType(tokenized: $tokenized)
  }
`;

const UPDATE_AWARD = gql`
  mutation tokenizedUpdateAwardType($tokenized: String!) {
    tokenizedUpdateAwardType(tokenized: $tokenized)
  }
`;

const DELETE_AWARD = gql`
  mutation tokenizedDeleteAwardType($tokenized: String!) {
    tokenizedDeleteAwardType(tokenized: $tokenized)
  }
`;
const AwardType = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createAwardType] = useMutation(CREATE_AWARD);
  const [updateAwardType] = useMutation(UPDATE_AWARD);
  const [deleteAwardType] = useMutation(DELETE_AWARD);

  const [allAwardTypes, setAllAwardTypes] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedAwardTypes = data?.tokenizedAllAwardTypes || "";
      let allAwardTypes = [];
      if (encryptedAwardTypes) {
        const decrypted = jwt.verify(encryptedAwardTypes, TOKENIZE);
        allAwardTypes = decrypted.queryResult;
        setAllAwardTypes(allAwardTypes);
      }
    }
  }, [data, loading, error]);

  // const encryptedAwardTypes = data?.tokenizedAllAwardTypes || "";
  // let allAwardTypes = [];
  // if (encryptedAwardTypes) {
  //   const decrypted = jwt.verify(encryptedAwardTypes, TOKENIZE);
  //   allAwardTypes = decrypted.queryResult;
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
      Header: "Award Type",
      accessor: "award",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Award</title>
      </Head>

      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Award Type`}
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
              await createAwardType({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateAwardType({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Award saved!`,
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
          <label>Award Type</label>
          <input
            className="form-control"
            value={(formData.award || "").toUpperCase()}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                award: e.target.value.toUpperCase(),
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
          data={allAwardTypes}
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege([
              "Award Type Profiling Livestock:Create",
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
              "Award Type Profiling Livestock:Delete",
            ])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} awards?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteAwardType({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} awards deleted`,
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
              "Award Type Profiling Livestock:Update",
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
export default withApollo({ ssr: true })(AwardType);
