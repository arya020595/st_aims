import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../App";
import { useNotification } from "../Notification";
import { handleError } from "../../libs/errors";
import Table from "../Table";
import Link from "next/link";
import { useQuery, useLazyQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { FormModal } from "../Modal";
import { orderBy } from "lodash";
import PRIVILEGES from "../../../graphql/role-privileges.json";
import { useCurrentUser } from "../../components/AdminArea";

const ADMINISTRATOR_QUERIES = gql`
  query listQueries {
    allUserRoles {
      _id
      name
      privileges
    }
  }
`;

const CREATE_ROLES = gql`
  mutation createUserRole($name: String!, $privileges: [String!]!) {
    createUserRole(name: $name, privileges: $privileges) {
      _id
    }
  }
`;

const UPDATE_ROLE = gql`
  mutation updateUserRole(
    $_id: String!
    $name: String!
    $privileges: [String!]!
  ) {
    updateUserRole(_id: $_id, name: $name, privileges: $privileges)
  }
`;

const DELETE_ROLE = gql`
  mutation deleteUserRole($_id: String!) {
    deleteUserRole(_id: $_id)
  }
`;
// const PRIVILEGES = [
//   {
//     key: "Dashboard",
//     label: "Dashboard",
//     permissions: ["Read"],
//     parentMenu: "DASHBOARD",
//   },
//   // ###########################################################
//   // KEPEGAWAIAN ###############################################
//   {
//     key: "Data Pegawai",
//     label: "Data Pegawai",
//     permissions: ["Read", "Create", "Update", "Delete"],
//     parentMenu: "KEPEGAWAIAN",
//   },
//   {
//     key: "Data Siswa",
//     label: "Data Siswa",
//     permissions: ["Read", "Create", "Update", "Delete"],
//     parentMenu: "KESISWAAN",
//   },
//   {
//     key: "Data Pembayaran",
//     label: "Data Pembayaran",
//     permissions: ["Read", "Create", "Update", "Delete"],
//     parentMenu: "PEMBAYARAN",
//   },
//   {
//     key: "Pengaturan",
//     label: "Pengaturan",
//     permissions: ["Read", "Create", "Update", "Delete"],
//     parentMenu: "PENGATURAN",
//   },
// ];
const FIXED_PERMISSIONS = ["Read", "Create", "Update", "Delete"];

const Page = (props) => {
  const { data, loading, error, refetch } = useQuery(ADMINISTRATOR_QUERIES, {});
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [createUserRole] = useMutation(CREATE_ROLES);
  const [updateUserRole] = useMutation(UPDATE_ROLE);
  const [deleteUserRole] = useMutation(DELETE_ROLE);

  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  let allUserRoles = [];
  if (data?.allUserRoles) {
    allUserRoles = data.allUserRoles;
  }

  const notification = useNotification();
  const columns = useMemo(() => [
    {
      Header: "Role",
      accessor: "name",
    },
    {
      Header: "Permissions",
      accessor: "privileges",
      Cell: (props) => (
        <div className="btn-sm bg-blue-400 rounded-sm" disabled>
          <p className="text-sm text-white font-bold">
            &nbsp;&nbsp;&nbsp;
            {props.value ? props.value.length : 0} permissions&nbsp;&nbsp;&nbsp;
          </p>
        </div>
      ),
    },
  ]);

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
                openEdit(props.row.original);
                // setFormData({
                //   ...props.row.original,
                // });
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

  const handleInput = (key, subkey) => (e) => {
    if (!subkey) {
      setFormData({
        ...formData,
        [key]: e.target.value,
      });
    } else {
      setFormData({
        ...formData,
        privilegesObj: {
          ...formData.privilegesObj,
          [subkey]: e.target.checked,
        },
      });
    }
  };

  const handleSelectAll = (e) => {
    if (e) e.preventDefault();
    setFormData({
      ...formData,
      privilegesObj: PRIVILEGES.reduce((all, priv) => {
        priv.permissions.forEach((p) => {
          all[`${priv.key}:${p}`] = true;
        });
        return all;
      }, {}),
    });
  };

  const handleDeselectAllPrivilege = (e) => {
    if (e) e.preventDefault();
    setFormData({
      ...formData,
      privilegesObj: PRIVILEGES.reduce((all, priv) => {
        priv.permissions.forEach((p) => {
          all[`${priv.key}:${p}`] = false;
        });
        return all;
      }, {}),
    });
  };

  const handleSelectReadOnly = (e) => {
    if (e) e.preventDefault();
    setFormData({
      ...formData,
      privilegesObj: PRIVILEGES.reduce((all, priv) => {
        priv.permissions.forEach((p) => {
          if (p === "Read") all[`${priv.key}:${p}`] = true;
        });
        return all;
      }, {}),
    });
  };

  const openEdit = (data) => {
    setFormData({
      ...data,
      privilegesObj: !data.privileges
        ? {}
        : data.privileges.reduce((all, p) => {
            all[p] = true;
            return all;
          }, {}),
    });
  };
  return (
    <div className="w-full px-4 mt-4">
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Role`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({});
        }}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { _id, __typename, _createdAt, _updatedAt } = formData;

            let privileges = [];
            for (const priv in formData.privilegesObj) {
              if (formData.privilegesObj[priv]) {
                privileges.push(priv);
              }
            }
            // console.log({
            //   variables: {
            //     name: formData.name,
            //     privileges,
            //   },
            // });

            // console.log(privileges);

            // throw {
            //   message: "ERRR",
            // };
            if (!_id) {
              await createUserRole({
                variables: {
                  name: formData.name,
                  privileges,
                },
              });
            } else {
              await updateUserRole({
                variables: {
                  _id: formData._id,
                  name: formData.name,
                  privileges,
                },
              });
            }

            await refetch();

            notification.addNotification({
              title: "Sukses!",
              message: `Berhasil menambahkan role!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }

          hideLoadingSpinner();
        }}
        size="lg"
      >
        <div className="form-group">
          <label>
            <p className="font-bold">Role*</p>
          </label>
          <input
            className="form-control"
            required
            value={formData.name}
            onChange={handleInput("name")}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="form-group">
            <label>
              <p className="font-bold">Permissions</p>
            </label>
          </div>

          <div className="flex justify-end mt-2">
            <button
              className="btn btn-md bg-blue-400 rounded-full py-2 px-6 mx-2"
              onClick={handleSelectAll}
            >
              <p className={"font-white font-semibold text-sm"}>
                <i className="fa fa-check-circle" /> Select All
              </p>
            </button>
            <button
              className="btn btn-md bg-yellow-400 rounded-full py-2 px-6 mx-2"
              onClick={handleDeselectAllPrivilege}
            >
              <p className={"font-white font-semibold text-sm"}>
                <i className="fa fa-circle" /> Deselect All
              </p>
            </button>
            <button
              className="btn btn-md bg-purple-400 rounded-full py-2 px-6 mx-2"
              onClick={handleSelectReadOnly}
            >
              <p className={"font-white font-semibold text-sm"}>
                <i className="fa fa-check" /> Read Only
              </p>
            </button>
          </div>
        </div>

        <div className="clearfix pb-2" />
        <div className="flex justify-center">
          <table className="table-fixed">
            <thead className="bg-gray-200 border-2 py-10">
              <tr>
                <th className="w-full md:w-1/4">
                  <p className="font-bold text-md">
                    <i className="fa fa-info-circle" /> Name
                  </p>
                </th>
                <th
                  colSpan={FIXED_PERMISSIONS.length}
                  style={{
                    width: "55rem",
                  }}
                >
                  <i className="fa fa-pencil-alt" /> Permissions
                </th>
                <th className="w-full md:w-1/4">
                  <p className="font-bold text-md">
                    <i className="fa fa-info-circle" /> Menu
                  </p>
                </th>
              </tr>
            </thead>
            <tbody>
              {orderBy(PRIVILEGES, ["parentMenu", "label"], ["asc", "asc"]).map(
                (privilege) => (
                  <tr key={privilege.key}>
                    <td>
                      <b>{privilege.label}</b>
                    </td>
                    {FIXED_PERMISSIONS.map((p) => {
                      return privilege.permissions.indexOf(p) >= 0 ? (
                        <td key={`${privilege.key}:${p}`} className="py-4">
                          <div className="form-check">
                            <label className="form-check-label">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={
                                  formData.privilegesObj &&
                                  !!formData.privilegesObj[
                                    `${privilege.key}:${p}`
                                  ]
                                }
                                onChange={handleInput(
                                  "privileges",
                                  `${privilege.key}:${p}`
                                )}
                              />{" "}
                              {p}
                            </label>
                          </div>
                        </td>
                      ) : (
                        <td key={`${privilege.key}:${p}`} className="py-4">
                          <div className="form-check">
                            <label className="form-check-label">&nbsp;</label>
                          </div>
                        </td>
                      );
                    })}
                    <td className="flex justify-center py-4">
                      {privilege.parentMenu}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </FormModal>

      {!currentUserDontHavePrivilege(
        ["User Roles:Read"],
        currentUser
      ) ? null : (
        <Table
          loading={loading}
          columns={columns}
          data={allUserRoles}
          withoutHeader={true}
          customUtilities={customUtilities}
          onAdd={() => {
            setFormData({});
            setModalVisible(true);
          }}
          onRemove={async ({ rows }) => {
            showLoadingSpinner();
            try {
              let yes = confirm(`Are you sure to delete ${rows.length} role?`);
              if (yes) {
                for (const row of rows) {
                  deleteUserRole({
                    variables: {
                      _id: row._id,
                    },
                  });
                }
                notification.addNotification({
                  title: "Succsess!",
                  message: `Deleted ${rows.length} role`,
                  level: "success",
                });
              }
              await refetch();
            } catch (err) {
              handleError(err);
            }
            hideLoadingSpinner();
          }}
        />
      )}
    </div>
  );
};

export default withApollo({ ssr: true })(Page);
