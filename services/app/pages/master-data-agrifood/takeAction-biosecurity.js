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

const QUERY = gql`
  query listQueries {
    allBioSecurityTakenActions {
      id
      uuid
      name
      description
    }
  }
`;

const CREATE_TAKEN_ACTION = gql`
  mutation createBioSecurityTakenAction($name: String!, $description: String!) {
    createBioSecurityTakenAction(name: $name, description: $description)
  }
`;

const UPDATE_TAKEN_ACTION = gql`
  mutation updateBioSecurityTakenAction(
    $uuid: String!
    $name: String
    $description: String
  ) {
    updateBioSecurityTakenAction(
      uuid: $uuid
      name: $name
      description: $description
    )
  }
`;

const DELETE_TAKEN_ACTION = gql`
  mutation deleteBioSecurityTakenAction($uuid: String!) {
    deleteBioSecurityTakenAction(uuid: $uuid)
  }
`;

const BioSecurityTakenAction = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createBioSecurityTakenAction] = useMutation(CREATE_TAKEN_ACTION);
  const [updateBioSecurityTakenAction] = useMutation(UPDATE_TAKEN_ACTION);
  const [deleteBioSecurityTakenAction] = useMutation(DELETE_TAKEN_ACTION);

  const allBioSecurityTakenActions = data?.allBioSecurityTakenActions || [];

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
      Header: "Name",
      accessor: "name",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Description",
      accessor: "description",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
  ]);

  return (
    <AdminArea header={{ title: "TakenAction" }} urlQuery={router.query}>
      <Head>
        <title>TakenAction</title>
      </Head>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} TakenAction`}
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
              await createBioSecurityTakenAction({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateBioSecurityTakenAction({
                variables: {
                  ...formData,
                },
              });
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `TakenAction saved!`,
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
        <div className="form-group">
          <label>Description</label>
          <textarea
            className="form-control"
            value={formData.description || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                description: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allBioSecurityTakenActions}
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege(["Taken Action:Update"])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege(["Taken Action:Create"])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Taken Action:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} units?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteBioSecurityTakenAction({
                          variables: {
                            uuid: row.uuid,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} units deleted`,
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

export default withApollo({ ssr: true })(BioSecurityTakenAction);
