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
  query listQueries {
    tokenizedAllSupport
  }
`;

const CREATE_SUPPORT_TYPE = gql`
  mutation tokenizedCreateSupportType($tokenized: String!) {
    tokenizedCreateSupportType(tokenized: $tokenized)
  }
`;

const UPDATE_SUPPORT_TYPE = gql`
  mutation tokenizedUpdateSupportType($tokenized: String!) {
    tokenizedUpdateSupportType(tokenized: $tokenized)
  }
`;

const DELETE_SUPPORT_TYPE = gql`
  mutation tokenizedDeleteSupportType($tokenized: String!) {
    tokenizedDeleteSupportType(tokenized: $tokenized)
  }
`;
const SupportType = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createSupportType] = useMutation(CREATE_SUPPORT_TYPE);
  const [updateSupportType] = useMutation(UPDATE_SUPPORT_TYPE);
  const [deleteSupportType] = useMutation(DELETE_SUPPORT_TYPE);

  const [allSupportTypes, setAllSupportTypes] = useState([])

  useEffect(() => {
    if (!loading && !error) {
      const encryptedSupportTypes = data?.tokenizedAllSupport || "";
      let allSupportTypes = [];
      if (encryptedSupportTypes) {
        const decrypted = jwt.verify(encryptedSupportTypes, TOKENIZE);
        allSupportTypes = decrypted.queryResult;
        setAllSupportTypes(allSupportTypes);
      }
    }
  }, [data, loading, error]);

  // const encryptedSupportTypes = data?.tokenizedAllSupport || "";
  // let allSupportTypes = [];
  // if (encryptedSupportTypes) {
  //   const decrypted = jwt.verify(encryptedSupportTypes, TOKENIZE);
  //   allSupportTypes = decrypted.queryResult;
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
      Header: "Description",
      accessor: "supports",
      style: {
        fontSize: 20,
      },
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Support Type</title>
      </Head>

      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Support Type`}
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
              await createSupportType({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateSupportType({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Support Type saved!`,
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
          <label>Description</label>
          <input
            className="form-control"
            value={formData.supports || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                supports: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
      </FormModal>

      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allSupportTypes}
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege([
              "Support Type Profiling Crops:Create",
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
              "Support Type Profiling Crops:Delete",
            ])
              ? async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} support types?`
                  );
                  if (yes) {
                    for (const row of rows) {
                      const tokenized = jwt.sign(row, TOKENIZE);
                      await deleteSupportType({
                        variables: {
                          // uuid: row.uuid,
                          tokenized,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} support types deleted`,
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
              "Support Type Profiling Crops:Update",
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
export default withApollo({ ssr: true })(SupportType);
