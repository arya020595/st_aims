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
    tokenizedAllTypeCompanyRegs
  }
`;

const CREATE_TYPE_COMPANY_REG = gql`
  mutation tokenizedCreateTypeCompanyReg($tokenized: String!) {
    tokenizedCreateTypeCompanyReg(tokenized: $tokenized)
  }
`;

const UPDATE_TYPE_COMPANY_REG = gql`
  mutation tokenizedUpdateTypeCompanyReg($tokenized: String!) {
    tokenizedUpdateTypeCompanyReg(tokenized: $tokenized)
  }
`;

const DELETE_TYPE_COMPANY_REG = gql`
  mutation tokenizedDeleteTypeCompanyReg($tokenized: String!) {
    tokenizedDeleteTypeCompanyReg(tokenized: $tokenized)
  }
`;
const TypeCompanyReg = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createTypeCompanyReg] = useMutation(CREATE_TYPE_COMPANY_REG);
  const [updateTypeCompanyReg] = useMutation(UPDATE_TYPE_COMPANY_REG);
  const [deleteTypeCompanyReg] = useMutation(DELETE_TYPE_COMPANY_REG);

  const [allTypeCompanyRegs, setAllTypeCompanyRegs] = useState([])

  useEffect(() => {
    if (!loading && !error) {
      const encryptedTypeCompanyRegs = data?.tokenizedAllTypeCompanyRegs || "";
      let allTypeCompanyRegs = [];
      if (encryptedTypeCompanyRegs) {
        const decrypted = jwt.verify(encryptedTypeCompanyRegs, TOKENIZE);
        allTypeCompanyRegs = decrypted.queryResult;
        setAllTypeCompanyRegs(allTypeCompanyRegs);
      }
    }
  }, [data, loading, error]);

  // const encryptedTypeCompanyRegs = data?.tokenizedAllTypeCompanyRegs || "";
  // let allTypeCompanyRegs = [];
  // if (encryptedTypeCompanyRegs) {
  //   const decrypted = jwt.verify(encryptedTypeCompanyRegs, TOKENIZE);
  //   allTypeCompanyRegs = decrypted.queryResult;
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
      Header: "Type of Company Reg",
      accessor: "typesOfCompany",
      style: {
        fontSize: 20,
      },
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Type of Company Reg</title>
      </Head>

      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Type of Company Reg`}
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
              await createTypeCompanyReg({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateTypeCompanyReg({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Success!",
              message: `Type Of Company Reg saved!`,
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
            value={formData.typesOfCompany || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                typesOfCompany: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
      </FormModal>

      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allTypeCompanyRegs}
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege([
              "Type Company Reg Profiling Crops:Create",
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
              "Type Company Reg Profiling Crops:Delete",
            ])
              ? async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} type of company reg?`
                  );
                  if (yes) {
                    for (const row of rows) {
                      const tokenized = jwt.sign(row, TOKENIZE);
                      await deleteTypeCompanyReg({
                        variables: {
                          // uuid: row.uuid,
                          tokenized,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} type of company reg deleted`,
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
              "Type Company Reg Profiling Crops:Update",
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
export default withApollo({ ssr: true })(TypeCompanyReg);
