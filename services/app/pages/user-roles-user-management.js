import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../components/App";
import { useNotification } from "../components/Notification";
import { handleError } from "../libs/errors";
import Table from "../components/Table";
import Link from "next/link";
import { useQuery, useLazyQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { FormModal } from "../components/Modal";
import { orderBy } from "lodash";
import PRIVILEGES from "../../graphql/role-privileges.json";
import { useRouter } from "next/router";
import AdminArea from "../components/AdminArea";
import { useCurrentUser } from "../components/AdminArea";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const ADMINISTRATOR_QUERIES = gql`
  query listQueries {
    tokenizedAllUserRoles
  }
`;

const CREATE_ROLES = gql`
  mutation tokenizedCreateUserRole($tokenized: String!) {
    tokenizedCreateUserRole(tokenized: $tokenized)
  }
`;

const UPDATE_ROLE = gql`
  mutation tokenizedUpdateUserRole($tokenized: String!) {
    tokenizedUpdateUserRole(tokenized: $tokenized)
  }
`;

const DELETE_ROLE = gql`
  mutation tokenizedDeleteUserRole($tokenized: String!) {
    tokenizedDeleteUserRole(tokenized: $tokenized)
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
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const { data, loading, error, refetch } = useQuery(ADMINISTRATOR_QUERIES, {});
  const [createUserRole] = useMutation(CREATE_ROLES);
  const [updateUserRole] = useMutation(UPDATE_ROLE);
  const [deleteUserRole] = useMutation(DELETE_ROLE);

  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  let allUserRoles = [];
  const encryptedUserRoles = data?.tokenizedAllUserRoles || "";
  if (encryptedUserRoles) {
    const decrypted = jwt.verify(encryptedUserRoles, TOKENIZE);
    allUserRoles = decrypted.queryResult;
  }

  const notification = useNotification();
  const columns = useMemo(() => [
    {
      Header: "Role",
      accessor: "name",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Permissions",
      accessor: "privileges",
      style: {
        fontSize: 20,
      },
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
          <div
            className={`flex ${
              !currentUserDontHavePrivilege(["User Admin:Update"], currentUser)
                ? ""
                : "hidden"
            }`}
          >
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
    // console.log({ subkey });
    if (!subkey) {
      setFormData({
        ...formData,
        [key]: e.target.value.toUpperCase(),
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

  const indexedPrivileges = PRIVILEGES.reduce((all, priv) => {
    if (!all[priv.app]) {
      all[priv.app] = [];
    }
    all[priv.app].push(priv);
    return all;
  }, []);

  return (
    <AdminArea urlQuery={router.query}>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <FormModal
          title={`${!formData._id ? "New" : "Edit"} Role`}
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
              let { uuid, __typename, _createdAt, _updatedAt } = formData;

              let privileges = [];
              for (const priv in formData.privilegesObj) {
                if (formData.privilegesObj[priv]) {
                  privileges.push(priv);
                }
              }
              if (!uuid) {
                const tokenizedPayload = {
                  name: formData.name,
                  privileges,
                };
                const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
                await createUserRole({
                  variables: {
                    tokenized,
                    // name: formData.name,
                    // privileges,
                  },
                });
              } else {
                const tokenizedPayload = {
                  uuid: formData.uuid,
                  name: formData.name,
                  privileges,
                };
                const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
                await updateUserRole({
                  variables: {
                    tokenized,
                    // uuid: formData._id,
                    // name: formData.name,
                    // privileges,
                  },
                });
              }

              await refetch();

              notification.addNotification({
                title: "Sukses!",
                message: `Adding role succeed!`,
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

          <div className="grid grid-cols-12 gap-0">
            <div className="col-span-3 text-center bg-gray-200 border-2">
              <p className="font-bold text-md">
                <i className="fa fa-info-circle" /> Name
              </p>
            </div>
            <div className="col-span-7 text-center bg-gray-200 border-2">
              <p className="font-bold text-md">
                <i className="fa fa-pencil-alt" /> Permissions
              </p>
            </div>
            <div className="col-span-2 text-center bg-gray-200 border-2">
              <p className="font-bold text-md">
                <i className="fa fa-info-circle" /> Menu
              </p>
            </div>

            {Object.keys(indexedPrivileges).map((priv) => (
              <div className="col-span-12 border border-b-1 uppercase">
                <p className="text-md font-bold mx-2 text-center">{priv}</p>
                <hr className="bg-gray-200 h-1 m-0" />
                {orderBy(
                  indexedPrivileges[priv],
                  ["label", "parentMenu"],
                  ["asc", "asc"]
                ).map((privilege) => (
                  <div className="grid grid-cols-12 gap-1 px-2">
                    <div
                      className="col-span-3 flex items-center text-sm"
                      key={privilege.key}
                    >
                      <b>{privilege.label}</b>
                    </div>
                    <div className="col-span-7" key={privilege.key}>
                      <div className="grid grid-cols-4">
                        {FIXED_PERMISSIONS.map((p) => {
                          return privilege.permissions.indexOf(p) >= 0 ? (
                            <div key={`${privilege.key}:${p}`} className="py-4">
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
                            </div>
                          ) : (
                            <div key={`${privilege.key}:${p}`} className="py-4">
                              <div className="form-check">
                                <label className="form-check-label">
                                  &nbsp;
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <td className="flex justify-center py-4">
                        {privilege.parentMenu}
                      </td>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </FormModal>

        {!currentUserDontHavePrivilege(["User Admin:Read"], currentUser) ? (
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
            onRemove={
              !currentUserDontHavePrivilege(["User Admin:Update"], currentUser)
                ? async ({ rows }) => {
                    showLoadingSpinner();
                    try {
                      let yes = confirm(
                        `Are you sure to delete ${rows.length} role?`
                      );
                      if (yes) {
                        for (const row of rows) {
                          const tokenized = jwt.sign(row, TOKENIZE);
                          deleteUserRole({
                            variables: {
                              // uuid: row._id,
                              tokenized,
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
                  }
                : null
            }
          />
        ) : null}
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(Page);
