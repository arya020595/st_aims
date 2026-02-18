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
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query allSeasons {
    tokenizedAllSeasons
  }
`;

const CREATE_SEASON = gql`
  mutation tokenizedCreateSeason($tokenized: String!) {
    tokenizedCreateSeason(tokenized: $tokenized)
  }
`;

const UPDATE_SEASON = gql`
  mutation tokenizedUpdateSeason($tokenized: String!) {
    tokenizedUpdateSeason(tokenized: $tokenized)
  }
`;

const DELETE_SEASON = gql`
  mutation tokenizedDeleteSeason($tokenized: String!) {
    tokenizedDeleteSeason(tokenized: $tokenized)
  }
`;

const EXPORT_SEASON = gql`
mutation exportSeason {
  exportSeason
}
`

const Season = () => {
  const router = useRouter();
  const { data, loading, error, refetch } = useQuery(QUERY, {});
  const [createSeason] = useMutation(CREATE_SEASON);
  const [updateSeason] = useMutation(UPDATE_SEASON);
  const [deleteSeason] = useMutation(DELETE_SEASON);
  const [exportSeason] = useMutation(EXPORT_SEASON)
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const [allSeasons, setAllSeasons] = useState([])

  useEffect(() => {
    if (!loading && !error) {
      const encryptedSeasons = data?.tokenizedAllSeasons || "";
      let allSeasons = [];
      if (encryptedSeasons) {
        const decrypted = jwt.verify(encryptedSeasons, TOKENIZE);
        allSeasons = decrypted.queryResult;
        setAllSeasons(allSeasons);
      }
    }
  }, [data, loading, error]);

  // const encryptedSeasons = data?.tokenizedAllSeasons || "";
  // let allSeasons = [];
  // if (encryptedSeasons) {
  //   const decrypted = jwt.verify(encryptedSeasons, TOKENIZE);
  //   allSeasons = decrypted.queryResult;
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
      Header: "Name",
      accessor: "name",
      style: {
        fontSize: 20,
      },
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Season</title>
      </Head>

      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Season`}
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
            let { uuid, __typename, __createdAt, __updatedAt } = formData;
            if (!uuid) {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await createSeason({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
              setModalVisible(false);
              setFormData({});
              setModalVisible(true);
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateSeason({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
              setModalVisible(false);
              setFormData({});
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: ` Season saved!`,
              level: "success",
            });
          } catch (error) {
            notification.handleError(error);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Name</label>
          <input
            className="form-control"
            required
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
      </FormModal>

      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={false}
          columns={columns}
          data={allSeasons}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportSeason()

                    downloadExcelFromBuffer(
                      response.data.exportSeason.data,
                      "crops-season"
                    );
                    // window.open(response.data.exportSeason, "__blank")
                  } catch (error) {
                    notification.handleError(error)
                  }
                }}
              >
                Export Excel
              </button>
            </div>
          }
          onAdd={
            !currentUserDontHavePrivilege(["Season:Create"])
              ? (e) => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({});
              }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Season:Delete"])
              ? async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} season?`
                  );
                  if (yes) {
                    for (const row of rows) {
                      const tokenized = jwt.sign(row, TOKENIZE);
                      deleteSeason({
                        variables: {
                          // uuid: row.uuid,
                          tokenized,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} Season deleted`,
                      level: "success",
                    });
                    await refetch();
                  }
                } catch (error) {
                  handleError(error);
                }
                hideLoadingSpinner();
                refetch();
              }
              : null
          }
          customUtilities={
            !currentUserDontHavePrivilege(["Season:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Season);
