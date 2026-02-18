import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../App";
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
import Table from "../Table";
import dayjs from "dayjs";
import { FormModal } from "../Modal";
import Select from "react-select";

const QUERIES = gql`
  query listQueries {
    allUsers {
      _id
      employeeId
      email
      phone
      roleId

      Role {
        _id
        name
      }
      LocalRegion {
        _id
        description
      }

      status

      name
      address
      pictureUrl

      tags
      lastLoginAt
      deptCode
    }

    allLocalRegion {
      _id
      description
    }

    allUserRoles {
      _id
      name
    }
  }
`;

const REGISTER_USER = gql`
  mutation registerUser(
    $employeeId: String!
    $password: String
    $roleId: String
    $email: String
    $phone: String
    $status: String!
    $deptCode: String
    $regionIds: [String]
  ) {
    registerUser(
      employeeId: $employeeId
      password: $password
      roleId: $roleId
      email: $email
      phone: $phone
      status: $status
      deptCode: $deptCode

      regionIds: $regionIds
    ) {
      _id
    }
  }
`;

const UPDATE_USER = gql`
  mutation updateUser(
    $_id: String!
    $employeeId: String
    $email: String
    $phone: String
    $deptCode: String
    $regionIds: [String]
    $roleId: String
  ) {
    updateUser(
      _id: $_id
      employeeId: $employeeId
      email: $email
      phone: $phone

      deptCode: $deptCode
      regionIds: $regionIds
      roleId: $roleId
    )
  }
`;
const DELETE_USER = gql`
  mutation deleteUser($_id: String!) {
    deleteUser(_id: $_id)
  }
`;

const ACTIVATE_USER = gql`
  mutation activateUser($_id: String!) {
    activateUser(_id: $_id)
  }
`;

const DEACTIVATE_USER = gql`
  mutation deactivateUser($_id: String!) {
    deactivateUser(_id: $_id)
  }
`;

const UPDATE_PASSWORD = gql`
  mutation updateUserPassword(
    $_id: String!
    $oldPassword: String!
    $newPassword: String!
  ) {
    updateUserPassword(
      _id: $_id
      oldPassword: $oldPassword
      newPassword: $newPassword
    )
  }
`;

const UserAdmin = props => {
  const router = useRouter();
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordForm, setPasswordForm] = useState({});
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  const [registerUser] = useMutation(REGISTER_USER);
  const [updateUser] = useMutation(UPDATE_USER);
  const [deleteUser] = useMutation(DELETE_USER);
  const [deactivateUser] = useMutation(DEACTIVATE_USER);
  const [activateUser] = useMutation(ACTIVATE_USER);
  const [updateUserPassword] = useMutation(UPDATE_PASSWORD);

  const { data, error, loading, refetch } = useQuery(QUERIES);

  let allUsers = [];
  if (data?.allUsers) {
    allUsers = data.allUsers;
  }
  // console.log({ allUsers });

  let allUserRoles = [];
  if (data?.allUserRoles) {
    allUserRoles = data.allUserRoles;
  }

  let allLocalRegion = [];
  if (data?.allLocalRegion) {
    allLocalRegion = data.allLocalRegion;
    allLocalRegion = allLocalRegion.map(reg => {
      return {
        label: reg.description,
        value: reg._id,
      };
    });
  }

  const customUtilities = useMemo(() => [
    {
      label: "Edit",
      icon: <i className="fa fa-pencil" />,
      width: 400,
      render: propsTable => {
        return (
          <div className="flex">
            <button
              onClick={e => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                  regionIds: propsTable.row.original.LocalRegion.map(reg => {
                    return {
                      label: reg.description,
                      value: reg._id,
                    };
                  }),
                });
              }}
              className="mb-1 bg-blue-500 hover:bg-blue-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg">
              <p className="text-white font-bold text-md font-bold">
                <i className="fa fa-pencil-alt " /> Edit
              </p>
            </button>

            <button
              onClick={e => {
                if (e) e.preventDefault();
                setPasswordModalVisible(true);
                setPasswordForm({
                  _id: propsTable.row.original._id,
                });
              }}
              className="mb-1 bg-yellow-500 hover:bg-yellow-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg">
              <p className="text-white font-bold text-md font-bold">
                <i className="fa fa-lock " /> Update Password
              </p>
            </button>

            <button
              onClick={async e => {
                if (e) e.preventDefault();
                showLoadingSpinner();
                try {
                  await activateUser({
                    variables: {
                      _id: propsTable.row.original._id,
                    },
                  });
                  await refetch();
                } catch (err) {
                  notification.handleError(err);
                }
                hideLoadingSpinner();
              }}
              className="mb-1 bg-mantis-500 hover:bg-mantis-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg">
              <p className="text-white font-bold text-md font-bold">
                <i className="fa fa-check-circle " /> Activate
              </p>
            </button>

            <button
              onClick={async e => {
                if (e) e.preventDefault();
                showLoadingSpinner();
                try {
                  await deactivateUser({
                    variables: {
                      _id: propsTable.row.original._id,
                    },
                  });
                  await refetch();
                } catch (err) {
                  notification.handleError(err);
                }
                hideLoadingSpinner();
              }}
              className="mb-1 bg-red-500 hover:bg-red-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg">
              <p className="text-white font-bold text-md font-bold">
                <i className="fa fa-exclamation-circle " /> Deactivate
              </p>
            </button>
          </div>
        );
      },
    },
  ]);

  const columns = useMemo(() => [
    {
      Header: "Staff ID",
      accessor: "employeeId",
      style: {
        fontSize: 20,
      },
    },
    // {
    //   Header: "Phone",
    //   accessor: "phone",
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
      Header: "Roles",
      accessor: "Role.name",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Status",
      accessor: "status",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Regions",
      accessor: "LocalRegion.description",
      style: {
        fontSize: 20,
        width: 250,
      },
      disableFilters: true,
      Cell: props => {
        return (
          <span>
            {props.row.original.LocalRegion.map(reg => reg.description).join(
              ", ",
            )}
          </span>
        );
      },
    },
  ]);

  return (
    <div className="w-full px-4 mt-4">
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} User Admin`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({});
        }}
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { _id, __typename, _createdAt, _updatedAt } = formData;

            if (!_id) {
              if (formData.password !== formData.confirmPassword) {
                throw {
                  message: "Password not match",
                };
              }

              await registerUser({
                variables: {
                  ...formData,
                },
              });
            } else {
              const regionIds = formData.LocalRegion.map(reg => reg._id);
              await updateUser({
                variables: {
                  ...formData,
                  regionIds,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `User Admin saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Staff ID</label>
          <input
            className="form-control"
            value={formData.employeeId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                employeeId: e.target.value,
              });
            }}
            required
          />
        </div>

        {formData._id ? null : (
          <div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                value={formData.password || ""}
                onChange={e => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  });
                }}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                className="form-control"
                value={formData.confirmPassword || ""}
                onChange={e => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  });
                }}
                required
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <label>User Role</label>
          <select
            className="form-control"
            value={formData.roleId || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                roleId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Role
            </option>
            {allUserRoles.map(role => (
              <option value={role._id}>{role.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            value={formData.email || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                email: e.target.value,
              });
            }}
          />
        </div>
        {/* <div className="form-group">
          <label>Phone</label>
          <input
            className="form-control"
            value={formData.phone || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                phone: e.target.value,
              });
            }}
          />
        </div> */}
        {!formData._id ? (
          <div className="form-group">
            <label>Status</label>
            <select
              required
              className="form-control"
              value={formData.status || ""}
              onChange={e => {
                if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  status: e.target.value,
                });
              }}>
              <option value="" disabled>
                Select Status
              </option>
              <option value="Active">Active</option>
              <option value="Not Active">Not Active</option>
            </select>
          </div>
        ) : null}

        <div className="form-group">
          <label>Department Code</label>
          <select
            required
            className="form-control"
            value={formData.deptCode || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                deptCode: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Dept.Code
            </option>
            <option value="PPE">PPE</option>
            <option value="PKK">PKK</option>
            <option value="UPTM">UPTM</option>
          </select>
          {/* <input
            className="form-control"
            value={formData.deptCode || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                deptCode: e.target.value,
              });
            }}
          /> */}
        </div>

        <div className="form-group mb-24">
          <label>Regions</label>
          <Select
            defaultValue={formData.regionIds || []}
            isMulti
            options={allLocalRegion}
            className="basic-multi-select w-full"
            classNamePrefix="select"
            onChange={data => {
              setFormData({
                ...formData,
                regionIds: data.map(d => d.value),
              });
            }}
          />
        </div>
      </FormModal>

      <FormModal
        title={`Update Password`}
        visible={passwordModalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setPasswordModalVisible(false);
          setPasswordForm({});
        }}
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { _id, __typename, _createdAt, _updatedAt } = passwordForm;

            if (passwordForm.newPassword !== passwordForm.confirmPassword) {
              throw {
                message: "Password not match",
              };
            }

            await updateUserPassword({
              variables: {
                ...passwordForm,
              },
            });

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `User Admin saved!`,
              level: "success",
            });
            setPasswordModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Old Password</label>
          <input
            className="form-control"
            value={passwordForm?.oldPassword || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setPasswordForm({
                ...passwordForm,
                oldPassword: e.target.value,
              });
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input
            className="form-control"
            value={passwordForm?.newPassword || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setPasswordForm({
                ...passwordForm,
                newPassword: e.target.value,
              });
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>Confirm New Password</label>
          <input
            type="password"
            className="form-control"
            value={passwordForm.confirmPassword || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setPasswordForm({
                ...passwordForm,
                confirmPassword: e.target.value,
              });
            }}
            required
          />
        </div>
      </FormModal>

      <Table
        loading={loading}
        columns={columns}
        data={allUsers}
        withoutHeader={true}
        onAdd={e => {
          if (e) e.preventDefault();
          setModalVisible(true);
          setFormData({});
        }}
        onRemove={async ({ rows }) => {
          showLoadingSpinner();
          try {
            let yes = confirm(`Are you sure to delete ${rows.length} users?`);
            if (yes) {
              for (const row of rows) {
                await deleteUser({
                  variables: {
                    _id: row._id,
                  },
                });
              }
              await refetch();
              notification.addNotification({
                title: "Success!",
                message: `${rows.length} users deleted`,
                level: "success",
              });
            }
          } catch (err) {
            handleError(err);
          }
          hideLoadingSpinner();
        }}
        customUtilities={customUtilities}
      />
    </div>
  );
};
export default withApollo({ ssr: true })(UserAdmin);
