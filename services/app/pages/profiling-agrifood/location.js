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
import NumberFormat from "react-number-format";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query allFarmLocations {
    tokenizedAllFarmLocation
  }
`;

const CREATE_CURRENT_STATUS = gql`
  mutation createFarmLocation($tokenized: String!) {
    createFarmLocation(tokenized: $tokenized)
  }
`;

const UPDATE_CURRENT_STATUS = gql`
  mutation updateFarmLocation($tokenized: String!) {
    updateFarmLocation(tokenized: $tokenized)
  }
`;

const DELETE_CURRENT_STATUS = gql`
  mutation deleteFarmLocation($tokenized: String!) {
    deleteFarmLocation(tokenized: $tokenized)
  }
`;
const Livestock = () => {
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();

  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createFarmLocation] = useMutation(CREATE_CURRENT_STATUS);
  const [updateFarmLocation] = useMutation(UPDATE_CURRENT_STATUS);
  const [deleteFarmLocation] = useMutation(DELETE_CURRENT_STATUS);

  const [allFarmLocations, setAllFarmLocations] = useState([])

  useEffect(() => {
    if (!loading && !error) {
      const encryptedFarmLocations = data?.tokenizedAllFarmLocation || "";
      let allFarmLocations = [];
      if (encryptedFarmLocations) {
        const decrypted = jwt.verify(encryptedFarmLocations, TOKENIZE);
        allFarmLocations = decrypted.queryResult;
        setAllFarmLocations(allFarmLocations);
      }
    }
  }, [data, loading, error]);

  // const encryptedFarmLocations = data?.tokenizedAllFarmLocation || "";
  // let allFarmLocations = [];
  // if (encryptedFarmLocations) {
  //   const decrypted = jwt.verify(encryptedFarmLocations, TOKENIZE);
  //   allFarmLocations = decrypted.queryResult;
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
              <p className="text-white font-bold text-md font-bold">
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
        width: 100,
      },
    },
    {
      Header: "District",
      accessor: "district",
      style: {
        fontSize: 20,
        width: 150,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>
    },
    {
      Header: "Mukim",
      accessor: "mukim",
      style: {
        fontSize: 20,
        width: 150,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>
    },
    {
      Header: "Village",
      accessor: "village",
      style: {
        fontSize: 20,
        width: 150,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>
    },
    {
      Header: "Area",
      accessor: "area",
      style: {
        fontSize: 20,
        width: 150,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Farm Location</title>
      </Head>

      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Farm Location`}
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
              await createFarmLocation({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateFarmLocation({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Farm Location saved!`,
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
          <label>District</label>
          <select
            className="form-control"
            value={formData.district || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                district: e.target.value,
              });
            }}
            required
          >
            <option value={""} disabled>
              Select District
            </option>
            <option value={"BRUNEI MUARA"}>BRUNEI MUARA</option>
            <option value={"TUTONG"}>TUTONG</option>
            <option value={"BELAIT"}>BELAIT</option>
            <option value={"TEMBURONG"}>TEMBURONG</option>
          </select>
        </div>
        <div className="form-group">
          <label>Mukim</label>
          <input
            className="form-control"
            value={formData.mukim || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                mukim: e.target.value.toUpperCase(),
              });
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>Village</label>
          <input
            className="form-control"
            value={formData.village || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                village: e.target.value.toUpperCase(),
              });
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>Area</label>
          <input
            className="form-control"
            value={formData.area || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                area: e.target.value.toUpperCase(),
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
          data={allFarmLocations}
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege(["Location:Create"])
              ? (e) => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({});
              }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Location:Delete"])
              ? async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} farm locations?`
                  );
                  if (yes) {
                    for (const row of rows) {
                      const tokenized = jwt.sign(row, TOKENIZE);
                      await deleteFarmLocation({
                        variables: {
                          // uuid: row.uuid,
                          tokenized,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} farm locations deleted`,
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
            !currentUserDontHavePrivilege(["Location:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Livestock);
