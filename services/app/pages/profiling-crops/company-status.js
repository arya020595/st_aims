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
  query allCompanyStatuses {
    tokenizedAllCompanyStatus
  }
`;

const CREATE_COMPANY_STATUS = gql`
  mutation createCompanyStatusTokenized($tokenized: String!) {
    createCompanyStatusTokenized(tokenized: $tokenized)
  }
`;

const UPDATE_COMPANY_STATUS = gql`
  mutation updateCompanyStatusTokenized($tokenized: String!) {
    updateCompanyStatusTokenized(tokenized: $tokenized)
  }
`;

const DELETE_COMPANY_STATUS = gql`
  mutation deleteCompanyStatusTokenized($tokenized: String!) {
    deleteCompanyStatusTokenized(tokenized: $tokenized)
  }
`;
const CompanyStatus = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createCompanyStatus] = useMutation(CREATE_COMPANY_STATUS);
  const [updateCompanyStatus] = useMutation(UPDATE_COMPANY_STATUS);
  const [deleteCompanyStatus] = useMutation(DELETE_COMPANY_STATUS);

  const [allCompanyStatuses, setAllCompanyStatuses] = useState([])

  useEffect(() => {
    if (!loading && !error) {
      const encryptedCompanyStatuses = data?.tokenizedAllCompanyStatus || "";
      let allCompanyStatuses = [];
      if (encryptedCompanyStatuses) {
        const decrypted = jwt.verify(encryptedCompanyStatuses, TOKENIZE);
        allCompanyStatuses = decrypted.queryResult;
        setAllCompanyStatuses(allCompanyStatuses);
      }
    }
  }, [data, loading, error]);

  // const encryptedCompanyStatuses = data?.tokenizedAllCompanyStatus || "";
  // let allCompanyStatuses = [];
  // if (encryptedCompanyStatuses) {
  //   const decrypted = jwt.verify(encryptedCompanyStatuses, TOKENIZE);
  //   allCompanyStatuses = decrypted.queryResult;
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
      accessor: "description",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Description Malay",
      accessor: "descriptionMalay",
      style: {
        fontSize: 20,
      },
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Company Status</title>
      </Head>

      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Company Status`}
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
              await createCompanyStatus({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateCompanyStatus({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Company Status saved!`,
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
            required
          />
        </div>
        <div className="form-group">
          <label>Description Malay</label>
          <textarea
            className="form-control"
            value={formData.descriptionMalay || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                descriptionMalay: e.target.value.toUpperCase(),
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
          data={allCompanyStatuses}
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege([
              "Company Status Profiling Crops:Create",
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
              "Company Status Profiling Crops:Delete",
            ])
              ? async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} company statuses?`
                  );
                  if (yes) {
                    for (const row of rows) {
                      const tokenized = jwt.sign(row, TOKENIZE);
                      await deleteCompanyStatus({
                        variables: {
                          // uuid: row.uuid,
                          tokenized,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} company statuses deleted`,
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
              "Company Status Profiling Crops:Update",
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
export default withApollo({ ssr: true })(CompanyStatus);
