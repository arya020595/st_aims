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
  query allComodityTypes {
    tokenizedAllComodityTypes
  }
`;

const CREATE_COMODITY_TYPE = gql`
  mutation tokenizedCreateComodityType($tokenized: String!) {
    tokenizedCreateComodityType(tokenized: $tokenized)
  }
`;

const UPDATE_COMODITY_TYPE = gql`
  mutation tokenizedUpdateComodityType($tokenized: String!) {
    tokenizedUpdateComodityType(tokenized: $tokenized)
  }
`;

const DELETE_COMODITY_TYPE = gql`
  mutation tokenizedDeleteComodityType($tokenized: String!) {
    tokenizedDeleteComodityType(tokenized: $tokenized)
  }
`;
const ComodityType = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createComodityType] = useMutation(CREATE_COMODITY_TYPE);
  const [updateComodityType] = useMutation(UPDATE_COMODITY_TYPE);
  const [deleteComodityType] = useMutation(DELETE_COMODITY_TYPE);

  const [allComodityTypes, setAllComodityTypes] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedComodityTypes = data?.tokenizedAllComodityTypes || "";
      let allComodityTypes = [];
      if (encryptedComodityTypes) {
        const decrypted = jwt.verify(encryptedComodityTypes, TOKENIZE);
        allComodityTypes = decrypted.queryResult;
        setAllComodityTypes(allComodityTypes);
      }
    }
  }, [data, loading, error]);

  // const encryptedComodityTypes = data?.tokenizedAllComodityTypes || "";
  // let allComodityTypes = [];
  // if (encryptedComodityTypes) {
  //   const decrypted = jwt.verify(encryptedComodityTypes, TOKENIZE);
  //   allComodityTypes = decrypted.queryResult;
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
      Header: "Commodity Type",
      accessor: "comodityType",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Commodity Type</title>
      </Head>

      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Commodity Type`}
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
              await createComodityType({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateComodityType({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Comodity Type saved!`,
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
          <label>Commodity Type</label>
          <input
            className="form-control"
            value={(formData.comodityType || "").toUpperCase()}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                comodityType: e.target.value.toUpperCase(),
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
          data={allComodityTypes}
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege(["Commodity Type:Create"])
              ? (e) => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({});
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Commodity Type:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} comodity types?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteComodityType({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} comodity types deleted`,
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
            !currentUserDontHavePrivilege(["Commodity Type:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(ComodityType);
