import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../../components/App";
import { useNotification } from "../../components/Notification";
import { handleError } from "../../libs/errors";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Table from "../../components/Table";
import { useQuery, useLazyQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { FormModal } from "../../components/Modal";
import { useRouter } from "next/router";
import Head from "next/dist/next-server/lib/head";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";

const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries {
    tokenizedAllTypeOfAnalysises
  }
`;

const CREATE_TEST = gql`
  mutation tokenizedCreateTypeOfAnalysis($tokenized: String!) {
    tokenizedCreateTypeOfAnalysis(tokenized: $tokenized)
  }
`;

const UPDATE_TEST = gql`
  mutation tokenizedUpdateTypeOfAnalysis($tokenized: String!) {
    tokenizedUpdateTypeOfAnalysis(tokenized: $tokenized)
  }
`;

const DELETE_TEST = gql`
  mutation tokenizedDeleteTypeOfAnalysis($tokenized: String!) {
    tokenizedDeleteTypeOfAnalysis(tokenized: $tokenized)
  }
`;

const EXPORT_TYPE_OF_ANALYSIS = gql`
  mutation exportTypeOfAnalysis {
    exportTypeOfAnalysis
  }
`;

const page = () => {
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createTypeOfAnalysis] = useMutation(CREATE_TEST);
  const [updateTypeOfAnalysis] = useMutation(UPDATE_TEST);
  const [deleteTypeOfAnalysis] = useMutation(DELETE_TEST);
  const [exportTypeOfAnalysis] = useMutation(EXPORT_TYPE_OF_ANALYSIS);
  const countTypeOfAnalysis = data?.countTypeOfAnalysis || 0;

  const [allTypeOfAnalysises, setAllTypeOfAnalysises] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedTypeOfAnalysises =
        data?.tokenizedAllTypeOfAnalysises || "";
      let allTypeOfAnalysises = [];
      if (encryptedTypeOfAnalysises) {
        const decrypted = jwt.verify(encryptedTypeOfAnalysises, TOKENIZE);
        allTypeOfAnalysises = decrypted.queryResult;
        setAllTypeOfAnalysises(allTypeOfAnalysises);
      }
    }
  }, [data, loading, error]);

  // const encryptedTypeOfAnalysises = data?.tokenizedAllTypeOfAnalysises || "";
  // let allTypeOfAnalysises = [];
  // if (encryptedTypeOfAnalysises) {
  //   const decrypted = jwt.verify(encryptedTypeOfAnalysises, TOKENIZE);
  //   allTypeOfAnalysises = decrypted.queryResult;
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
              onClick={(e) => {
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
      Header: "Type of Analysis Name",
      accessor: "name",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
  ]);

  return (
    <AdminArea header={{ title: "TypeOfAnalysis" }} urlQuery={router.query}>
      <Head>
        <title>TypeOfAnalysis</title>
      </Head>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Type of Analysis`}
        visible={modalVisible}
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
            const { uuid, __typename } = formData;
            if (!uuid) {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await createTypeOfAnalysis({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateTypeOfAnalysis({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Type Of Analysis saved!`,
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
          <label>Name</label>
          <input
            className="form-control"
            value={formData.name || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                name: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allTypeOfAnalysises}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportTypeOfAnalysis();

                    downloadExcelFromBuffer(
                      response.data.exportTypeOfAnalysis.data,
                      "type-of-analysis-agrifood"
                    );
                    // window.open(response.data.exportTypeOfAnalysis, "__blank")
                  } catch (error) {
                    notification.handleError(error);
                  }
                }}
              >
                Export Excel
              </button>
            </div>
          }
          customUtilities={
            !currentUserDontHavePrivilege(["Type Of Analysis:Update"])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege(["Type Of Analysis:Create"])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Type Of Analysis:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} analysis?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteTypeOfAnalysis({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} analysis deleted`,
                        level: "success",
                      });
                      await refetch();
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
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(page);
