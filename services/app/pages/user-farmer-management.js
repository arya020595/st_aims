import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../components/App";
import { addNotification, useNotification } from "../components/Notification";
import { handleError } from "../libs/errors";
import AdminArea from "../components/AdminArea";
import Table from "../components/Table";
import { useQuery, useLazyQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { FormModal } from "../components/Modal";
import { useRouter } from "next/router";
import { create, filter } from "lodash";
import { from } from "apollo-link";
import { configure } from "nprogress";
import Head from "next/dist/next-server/lib/head";
import { Leaf } from "slate";
import { useCurrentUser } from "../components/AdminArea";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../libs/downloadExcelFromBuffer";

const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERIES = gql`
  query listQueries($tokenizedParams: String!) {
    tokenizedAllUsers(tokenizedParams: $tokenizedParams)

    tokenizedAllUserRoles
  }
`;

const SET_ACTIVE_USERS = gql`
  mutation activateUser($uuid: String!) {
    activateUser(uuid: $uuid)
  }
`;

const DEACTIVATE_USERS = gql`
  mutation deactivateUser($uuid: String!) {
    deactivateUser(uuid: $uuid)
  }
`;

const SET_USER_ROLES = gql`
  mutation updateRoleForUser($uuid: String!, $roleId: String!) {
    updateRoleForUser(uuid: $uuid, roleId: $roleId)
  }
`;

const UPDATE_USER_FARMER = gql`
  mutation tokenizedUpdateUserFarmer($tokenized: String!) {
    tokenizedUpdateUserFarmer(tokenized: $tokenized)
  }
`;

const DELETE_USER = gql`
  mutation tokenizedDeleteUser($tokenized: String!) {
    tokenizedDeleteUser(tokenized: $tokenized)
  }
`;

const SET_ONLY_ENFORCEMENT = gql`
  mutation setUserOnlyBioSecurityEnforcement(
    $uuid: String!
    $isUserBioSecurityEnforcementOnly: Boolean!
  ) {
    setUserOnlyBioSecurityEnforcement(
      uuid: $uuid
      isUserBioSecurityEnforcementOnly: $isUserBioSecurityEnforcementOnly
    )
  }
`;

const EXPORT_USER_FARMER = gql`
  mutation exportAllUserTypeFarmer {
    exportAllUsersTypeFarmer
  }
`;

const page = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [passwordFormData, setPasswordFormData] = useState({});
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [rolesModal, setRolesModal] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const notification = useNotification();

  const tokenizedPayload = {
    registerType: "FARMER",
  };
  const tokenizedParams = jwt.sign(tokenizedPayload, TOKENIZE);
  const { data, error, loading, refetch } = useQuery(QUERIES, {
    variables: {
      tokenizedParams,
    },
  });

  const [activateUser] = useMutation(SET_ACTIVE_USERS);
  const [deactivateUser] = useMutation(DEACTIVATE_USERS);
  const [updateRoleForUser] = useMutation(SET_USER_ROLES);
  const [updateUserFarmer] = useMutation(UPDATE_USER_FARMER);
  const [exportUser] = useMutation(EXPORT_USER_FARMER);
  const [deleteUser] = useMutation(DELETE_USER);
  const [setUserOnlyBioSecurityEnforcement] = useMutation(SET_ONLY_ENFORCEMENT);

  let allUsers = [];
  const encryptedUsers = data?.tokenizedAllUsers || "";
  if (encryptedUsers) {
    const decrypted = jwt.verify(encryptedUsers, TOKENIZE);
    allUsers = decrypted.queryResult;
  }

  let allUserRoles = [];
  const encryptedUserRoles = data?.tokenizedAllUserRoles || "";
  if (encryptedUserRoles) {
    const decrypted = jwt.verify(encryptedUserRoles, TOKENIZE);
    allUserRoles = decrypted.queryResult;
  }

  const customUtilities = useMemo(() => [
    {
      label: "Edit",
      icon: <i className="fa fa-pencil" />,
      width: 400,

      render: (props) => {
        return (
          <div className="flex flex-row">
            <div className="flex flex-col">
              <button
                className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-1 px-2 text-white focus:outline-none rounded-md shadow-lg"
                onClick={(e) => {
                  if (e) e.preventDefault();
                  setPasswordModalVisible(true);
                  setPasswordFormData({
                    ...props.row.original,
                  });
                }}
              >
                <i className="text-white fa fa-edit" /> Edit
              </button>
              <button
                className="mb-1 bg-purple-500 hover:bg-roles-600 mx-1 py-1 px-2 text-white focus:outline-none rounded-md shadow-lg"
                onClick={(e) => {
                  if (e) e.preventDefault();
                  setRolesModal(true);
                  setSelectedUser(props.row.original.uuid);
                  setSelectedRoles(props.row.original.Role?.uuid || "");
                }}
              >
                <i className="text-white fa fa-cogs" /> Roles
              </button>
            </div>
          </div>
        );
      },
    },
  ]);

  const columns = useMemo(() => [
    {
      Header: "",
      accessor: "uuid",
      style: {
        width: 200,
      },
      Cell: (props) => (
        <div
          className={`flex flex-row ${
            !currentUserDontHavePrivilege(["User Role:Update"], currentUser)
              ? ""
              : "hidden"
          }`}
        >
          <div className="flex flex-col">
            <button
              className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-1 px-2 text-white focus:outline-none rounded-md shadow-lg"
              onClick={(e) => {
                if (e) e.preventDefault();
                setPasswordModalVisible(true);
                setPasswordFormData({
                  ...props.row.original,
                });
              }}
            >
              <i className="text-white fa fa-edit" /> Edit
            </button>
            <button
              className="mb-1 bg-purple-500 hover:bg-roles-600 mx-1 py-1 px-2 text-white focus:outline-none rounded-md shadow-lg"
              onClick={(e) => {
                if (e) e.preventDefault();
                setRolesModal(true);
                setSelectedUser(props.row.original.uuid);
                setSelectedRoles(props.row.original.Role?.uuid || "");
              }}
            >
              <i className="text-white fa fa-cogs" /> Roles
            </button>
          </div>
        </div>
      ),
    },
    {
      Header: "Name",
      accessor: "name",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "IC. No",
      accessor: "icNo",
      style: {
        fontSize: 20,
        width: 150,
      },
    },
    {
      Header: "Username",
      accessor: "username",
      style: {
        fontSize: 20,
      },
    },
    // {
    //   Header: "Password",
    //   accessor: "defaultPassword",
    //   style: {
    //     fontSize: 20,
    //   },
    // },
    {
      Header: "Email",
      accessor: "email",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Phone",
      accessor: "phone",
      style: {
        fontSize: 20,
      },
    },

    {
      Header: "User Roles",
      accessor: "Role.name",
      style: {
        fontSize: 20,
        width: 150,
      },
    },
    {
      Header: "Status",
      accessor: "status",
      style: {
        fontSize: 20,
        width: 150,
      },
      Cell: (props) =>
        props.value === "Not Active" ? (
          <button
            className="bg-red-500 text-white font-bold rounded-md text-md py-2 w-full"
            onClick={handleActivateUser(props.row.original)}
          >
            {props.value}
          </button>
        ) : (
          <button
            className="bg-mantis-500 text-white font-bold rounded-md text-md py-2 w-full"
            onClick={handleDeactivateUser(props.row.original)}
          >
            {props.value}
          </button>
        ),
    },
  ]);

  const handleActivateUser = (user) => async (e) => {
    showLoadingSpinner();
    try {
      if (confirm("Are you sure to activate this user ? ")) {
        await activateUser({
          variables: {
            uuid: user.uuid,
          },
        });

        notification.addNotification({
          title: "Success!",
          message: `User activated`,
          level: "success",
        });
        await refetch();
      }
    } catch (err) {
      handleError(err);
    }
    hideLoadingSpinner();
  };

  const handleDeactivateUser = (user) => async (e) => {
    showLoadingSpinner();
    try {
      if (confirm("Are you sure to de-activate this user ? ")) {
        await deactivateUser({
          variables: {
            uuid: user.uuid,
          },
        });

        notification.addNotification({
          title: "Success!",
          message: `User deactivated`,
          level: "success",
        });
        await refetch();
      }
    } catch (err) {
      handleError(err);
    }
    hideLoadingSpinner();
  };

  return (
    <AdminArea urlQuery={router.query}>
      <FormModal
        title={`Update User Password`}
        visible={passwordModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setPasswordModalVisible(false);
          setPasswordFormData({});
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            const tokenizedPayload = {
              _id: passwordFormData.uuid,
              newPassword: passwordFormData.newPassword,
            };
            const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
            await updateUserFarmer({
              variables: {
                tokenized,
              },
            });
            notification.addNotification({
              title: "Success!",
              message: `details update!`,
              level: "success",
            });
            await refetch();
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            value={passwordFormData.email || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setPasswordFormData({
                ...passwordFormData,
                email: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input
            className="form-control"
            value={passwordFormData.phone || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              let strRegex = new RegExp(/^[0-9]+$/i);
              let result = strRegex.test(e.target.value);

              if (result) {
                setPasswordFormData({
                  ...passwordFormData,
                  phone: e.target.value,
                });
              }
            }}
          />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input
            className="form-control"
            value={passwordFormData.newPassword || ""}
            required
            onChange={(e) => {
              if (e) e.preventDefault();
              setPasswordFormData({
                ...passwordFormData,
                newPassword: e.target.value,
              });
            }}
          />
        </div>
      </FormModal>
      <FormModal
        title={`Set User Roles`}
        visible={rolesModal}
        onClose={(e) => {
          if (e) e.preventDefault();
          setRolesModal(false);
        }}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            await updateRoleForUser({
              variables: {
                uuid: selectedUser,
                roleId: selectedRoles,
              },
            });

            await refetch();
            notification.addNotification({
              title: "Success!",
              message: `User Role Updated!`,
              level: "success",
            });

            setRolesModal(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>User Roles</label>
          <select
            className="form-control"
            value={selectedRoles}
            onChange={(e) => {
              if (e) e.preventDefault();
              setSelectedRoles(e.target.value);
            }}
            required
          >
            <option value={""} disabled>
              Select User Roles
            </option>
            {allUserRoles.map((role) => (
              <option value={role.uuid}>{role.name}</option>
            ))}
          </select>
        </div>
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allUsers}
          withoutHeader={true}
          customHeaderUtilities={
            <div>
              <div className="flex mx-2 items-end">
                <button
                  className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                  onClick={async (e) => {
                    if (e) e.preventDefault();
                    showLoadingSpinner();
                    try {
                      const response = await exportUser();

                      // window.open(
                      //   response.data.exportAllUsersTypeFarmer,
                      //   "__blank"
                      // );
                      downloadExcelFromBuffer(
                        response.data.exportAllUsersTypeFarmer.data,
                        "user-management-farmer"
                      );
                    } catch (error) {
                      notification.handleError(error);
                    }
                    hideLoadingSpinner();
                  }}
                >
                  Export Excel
                </button>
              </div>
            </div>
          }
          // customUtilities={customUtilities}
          // onAdd={() => {
          //   setFormData({});
          //   setModalVisible(true);
          // }}
          onRemove={
            !currentUserDontHavePrivilege(["User Role:Delete"], currentUser)
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    if (
                      confirm(`Are you sure to delete ${rows.length} users`)
                    ) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteUser({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }

                      notification.addNotification({
                        title: "Success!",
                        message: `User deleted!`,
                        level: "success",
                      });
                    }
                  } catch (err) {
                    notification.handleError(err);
                  }
                  hideLoadingSpinner();
                  refetch();
                }
              : null
          }
          // customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(page);
