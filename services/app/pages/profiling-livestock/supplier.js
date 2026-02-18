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
  query tokenizedAllLiveStockSuppliers {
    tokenizedAllLiveStockSuppliers
  }
`;

const CREATE_SUPPLIER = gql`
  mutation createLivestockSupplierTokenized($tokenized: String!) {
    createLivestockSupplierTokenized(tokenized: $tokenized)
  }
`;

const UPDATE_SUPPLIER = gql`
  mutation updateLivestockSupplierTokenized($tokenized: String!) {
    updateLivestockSupplierTokenized(tokenized: $tokenized)
  }
`;

const DELETE_SUPPLIER = gql`
  mutation deleteLivestockSupplierTokenized($tokenized: String!) {
    deleteLivestockSupplierTokenized(tokenized: $tokenized)
  }
`;
const Supplier = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createLivestockSupplierTokenized] = useMutation(CREATE_SUPPLIER);
  const [updateLivestockSupplierTokenized] = useMutation(UPDATE_SUPPLIER);
  const [deleteLivestockSupplierTokenized] = useMutation(DELETE_SUPPLIER);
  const [allSuppliers, setAllSuppliers] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedSuppliers = data?.tokenizedAllLiveStockSuppliers || "";
      let allSuppliers = [];
      if (encryptedSuppliers) {
        const decrypted = jwt.verify(encryptedSuppliers, TOKENIZE);
        allSuppliers = decrypted.queryResult;
        setAllSuppliers(allSuppliers);
      }
    }
  }, [data, loading, error]);

  // const encrypted = data?.tokenizedAllLiveStockSuppliers || "";
  // let allSuppliers = [];
  // if (encrypted) {
  //   const decyrpted = jwt.verify(encrypted, TOKENIZE);
  //   allSuppliers = decyrpted.queryResult;
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
      Header: "Supplier ID",
      accessor: "id",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Code",
      accessor: "code",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
    {
      Header: "Supplier Name",
      accessor: "supplierName",
      style: {
        fontSize: 20,
        width: 500,
      },
      Cell: (props) => <p>{props.value.toUpperCase()}</p>,
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Supplier</title>
      </Head>

      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Supplier`}
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

              await createLivestockSupplierTokenized({
                variables: {
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateLivestockSupplierTokenized({
                variables: {
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Supplier saved!`,
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
          <label>Supplier Code</label>
          <input
            className="form-control"
            value={(formData.code || "").toUpperCase()}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                code: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Supplier Name</label>
          <input
            className="form-control"
            value={(formData.supplierName || "").toUpperCase()}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                supplierName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
      </FormModal>

      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allSuppliers}
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege(["Supplier:Create"])
              ? (e) => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({});
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Supplier:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} suppliers?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteLivestockSupplierTokenized({
                          variables: {
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} suppliers deleted`,
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
            !currentUserDontHavePrivilege(["Supplier:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Supplier);
