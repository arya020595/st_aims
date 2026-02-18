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
    tokenizedAllTests
    countTest
  }
`;

const CREATE_TEST = gql`
  mutation tokenizedCreateTest($tokenized: String!) {
    tokenizedCreateTest(tokenized: $tokenized)
  }
`;

const UPDATE_TEST = gql`
  mutation tokenizedUpdateTest($tokenized: String!) {
    tokenizedUpdateTest(tokenized: $tokenized)
  }
`;

const DELETE_TEST = gql`
  mutation tokenizedDeleteTest($tokenized: String!) {
    tokenizedDeleteTest(tokenized: $tokenized)
  }
`;

const EXPORT_TEST = gql`
  mutation exportsTest {
    exportsTest
  }
`;

const page = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createTest] = useMutation(CREATE_TEST);
  const [updateTest] = useMutation(UPDATE_TEST);
  const [deleteTest] = useMutation(DELETE_TEST);
  const [exportsTest] = useMutation(EXPORT_TEST);
  const countTest = data?.countTest || 0;

  const [allTests, setAllTests] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedTests = data?.tokenizedAllTests || "";
      let allTests = [];
      if (encryptedTests) {
        const decrypted = jwt.verify(encryptedTests, TOKENIZE);
        allTests = decrypted.queryResult;
        setAllTests(allTests);
      }
    }
  }, [data, loading, error]);

  // const encryptedTests = data?.tokenizedAllTests || "";
  // let allTests = [];
  // if (encryptedTests) {
  //   const decrypted = jwt.verify(encryptedTests, TOKENIZE);
  //   allTests = decrypted.queryResult;
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
      Header: "Test ID",
      accessor: "testId",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Test Name",
      accessor: "testName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
  ]);

  return (
    <AdminArea header={{ title: "Test" }} urlQuery={router.query}>
      <Head>
        <title>Test</title>
      </Head>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Test`}
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
              await createTest({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateTest({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Test saved!`,
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
          <label>Test ID</label>
          <input
            className="form-control"
            value={formData.testId || ""}
            disabled
          />
        </div>
        <div className="form-group">
          <label>Test Name</label>
          <input
            className="form-control"
            value={formData.testName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                testName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allTests}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportsTest();

                    downloadExcelFromBuffer(
                      response.data.exportsTest.data,
                      "test-agrifood"
                    );
                    // window.open(response.data.exportsTest, "__blank")
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
            !currentUserDontHavePrivilege(["Test Agrifood:Delete"])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege(["Test Agrifood:Create"])
              ? () => {
                  let PREFIX = "TA000";
                  let count = "" + (countTest + 1);

                  PREFIX = PREFIX.slice(0, count.length * -1) + count;

                  setFormData({
                    testId: PREFIX,
                  });
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Test Agrifood:Update"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} tests?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteTest({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} tests deleted`,
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
