import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../components/App";
import { addNotification, useNotification } from "../components/Notification";
import { handleError } from "../libs/errors";
import AdminArea from "../components/AdminArea";
import Table from "../components/Table";
import {
  useQuery,
  useLazyQuery,
  useMutation,
  useApolloClient,
} from "@apollo/client";
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
import Select from "react-select";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import lodash from "lodash";
import downloadExcelFromBuffer from "../libs/downloadExcelFromBuffer";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

let UNIT_OFFICER = [
  {
    label: "Bahagian Dasar, Pengurusan & Kewangan",
    value: "Bahagian Dasar, Pengurusan & Kewangan",
  },
  {
    label: "Seksyen Pengurusan Statistik dan SIPA",
    value: "Seksyen Pengurusan Statistik dan SIPA",
  },
  { label: "Unit Pengurusan Statistik", value: "Unit Pengurusan Statistik" },
  {
    label: "Unit Pengurusan Maklumat dan SIPA",
    value: "Unit Pengurusan Maklumat dan SIPA",
  },
  { label: "Bahagian Industri Tanaman", value: "Bahagian Industri Tanaman" },
  {
    label: "Seksyen Kemajuan Industri Buah dan Kemajuan Pertanian Luar Bandar",
    value: "Seksyen Kemajuan Industri Buah dan Kemajuan Pertanian Luar Bandar",
  },
  {
    label: "Unit Kemajuan Industri Pelbagai Tanaman",
    value: "Unit Kemajuan Industri Pelbagai Tanaman",
  },
  {
    label: "Unit Kemajuan Industri Buah",
    value: "Unit Kemajuan Industri Buah",
  },
  {
    label: "Unit Kemajuan Pertanian Luar Bandar",
    value: "Unit Kemajuan Pertanian Luar Bandar",
  },
  {
    label: "Unit Kemajuan Industri Sayur",
    value: "Unit Kemajuan Industri Sayur",
  },
  {
    label: "Unit Kemajuan Industri Florikultur",
    value: "Unit Kemajuan Industri Florikultur",
  },
  { label: "Seksyen Industri Padi", value: "Seksyen Industri Padi" },
  {
    label: "Unit Kemajuan Industri Padi",
    value: "Unit Kemajuan Industri Padi",
  },
  { label: "Unit Biji Benih Padi", value: "Unit Biji Benih Padi" },
  {
    label: "Unit  Pengurusan Tapak Pertanian",
    value: "Unit  Pengurusan Tapak Pertanian",
  },
  {
    label: "Bahagian Industri Ternakan dan Perkhidmatan Veterinar",
    value: "Bahagian Industri Ternakan dan Perkhidmatan Veterinar",
  },
  {
    label: "Seksyen Pembangunan Industri Ternakan",
    value: "Seksyen Pembangunan Industri Ternakan",
  },
  {
    label: "Unit Kemajuan Industri Ternakan",
    value: "Unit Kemajuan Industri Ternakan",
  },
  {
    label: "Unit Regulatori dan Penguatkuasaan Veterinar",
    value: "Unit Regulatori dan Penguatkuasaan Veterinar",
  },
  {
    label: "Bahagian Industri Agrimakanan dan Perkidmatan-Perkhidmatan",
    value: "Bahagian Industri Agrimakanan dan Perkidmatan-Perkhidmatan",
  },
  {
    label: "Seksyen Industri Agrimakanan",
    value: "Seksyen Industri Agrimakanan",
  },
  {
    label: "Unit Pasaran dan Pengembangan Industri Agrimakanan",
    value: "Unit Pasaran dan Pengembangan Industri Agrimakanan",
  },
  {
    label: "Unit Perkhidmatan Teknikal & Akreditasi Industri Agrimakanan ",
    value: "Unit Perkhidmatan Teknikal & Akreditasi Industri Agrimakanan ",
  },
  {
    label: "Unit Pembangunan Produk dan Komersialisasi Industri Agrimakanan",
    value: "Unit Pembangunan Produk dan Komersialisasi Industri Agrimakanan",
  },
  {
    label: "Unit Kemajuan Pertanian Daerah Brunei Muara",
    value: "Unit Kemajuan Pertanian Daerah Brunei Muara",
  },
  {
    label: "Unit Kemajuan Pertanian Daerah Tutong",
    value: "Unit Kemajuan Pertanian Daerah Tutong",
  },
  {
    label: "Unit Kemajuan Pertanian Daerah Belait",
    value: "Unit Kemajuan Pertanian Daerah Belait",
  },
  {
    label: "Unit Kemajuan Pertanian Daerah Temburong",
    value: "Unit Kemajuan Pertanian Daerah Temburong",
  },
  {
    label: "Bahagian Biosekuriti dan Akses Pasaran",
    value: "Bahagian Biosekuriti dan Akses Pasaran",
  },
  {
    label: "Bahagian Biosekuriti dan Akses Pasaran (PK Kuala Lurah)",
    value: "Bahagian Biosekuriti dan Akses Pasaran (PK Kuala Lurah)",
  },
  {
    label:
      "Bahagian Biosekuriti dan Akses Pasaran  (PK Pelabohan Muara dan Feri Terminal Serasa)",
    value:
      "Bahagian Biosekuriti dan Akses Pasaran  (PK Pelabohan Muara dan Feri Terminal Serasa)",
  },
  {
    label: "Bahagian Biosekuriti dan Akses Pasaran (PK Airport Cargo)",
    value: "Bahagian Biosekuriti dan Akses Pasaran (PK Airport Cargo)",
  },
  {
    label: "Bahagian Biosekuriti dan Akses Pasaran (PK Sungai Tujoh)",
    value: "Bahagian Biosekuriti dan Akses Pasaran (PK Sungai Tujoh)",
  },
  {
    label: "Bahagian Biosekuriti dan Akses Pasaran (PK Labu dan Ujong Jalan)",
    value: "Bahagian Biosekuriti dan Akses Pasaran (PK Labu dan Ujong Jalan)",
  },
];

UNIT_OFFICER = lodash.orderBy(UNIT_OFFICER, ["label"], ["asc"]);
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

const UPDATE_USER = gql`
  mutation tokenizedUpdateUser($tokenized: String!) {
    tokenizedUpdateUser(tokenized: $tokenized)
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

const EXPORT_USER_OFFICER = gql`
  mutation exportAllUserTypeOfficer {
    exportAllUsersTypeAdmin
  }
`;

const page = () => {
  const router = useRouter();
  const client = useApolloClient();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [passwordFormData, setPasswordFormData] = useState({});
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [rolesModal, setRolesModal] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const notification = useNotification();

  // const tokenizedPayload = {
  //   registerType: "OFFICER",
  // };

  // const tokenizedParams = jwt.sign(tokenizedPayload, TOKENIZE);
  // const { data, error, loading, refetch } = useQuery(QUERIES, {
  //   variables: {
  //     tokenizedParams,
  //     // registerType: "OFFICER",
  //   },
  // });
  const [activateUser] = useMutation(SET_ACTIVE_USERS);
  const [deactivateUser] = useMutation(DEACTIVATE_USERS);
  const [updateRoleForUser] = useMutation(SET_USER_ROLES);
  const [exportUser] = useMutation(EXPORT_USER_OFFICER);
  const [updateUser] = useMutation(UPDATE_USER);
  const [deleteUser] = useMutation(DELETE_USER);
  const [setUserOnlyBioSecurityEnforcement] = useMutation(SET_ONLY_ENFORCEMENT);
  const [allUsers, setAllUsers] = useState([]);
  const [allUserRoles, setAllUserRoles] = useState([]);
  let [savedCount, setSavedCount] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  useEffect(async () => {
    const tokenizedPayload = {
      registerType: "OFFICER",
    };

    const tokenizedParams = jwt.sign(tokenizedPayload, TOKENIZE);
    const result = await client.query({
      query: QUERIES,
      variables: {
        tokenizedParams,
      },
    });
    // const { data, error, loading, refetch } = useQuery(QUERIES, {
    //   variables: {
    //     tokenizedParams,
    //     // registerType: "OFFICER",
    //   },
    // });

    let allUsers = [];
    const encryptedUsers = result.data?.tokenizedAllUsers || "";
    if (encryptedUsers) {
      const decrypted = jwt.verify(encryptedUsers, TOKENIZE);
      allUsers = decrypted.queryResult;
    }

    let allUserRoles = [];
    const encryptedUserRoles = result.data?.tokenizedAllUserRoles || "";
    if (encryptedUserRoles) {
      const decrypted = jwt.verify(encryptedUserRoles, TOKENIZE);
      allUserRoles = decrypted.queryResult;
    }
    setAllUsers(allUsers);
    setAllUserRoles(allUserRoles);
  }, [savedCount]);

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
                <i className="text-white fa fa-edit" /> Edit Password
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
            !currentUserDontHavePrivilege(["User Roles:Update"], currentUser)
              ? ""
              : "hidden"
          }`}
        >
          <div className="flex flex-col">
            <button
              className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-1 px-2 text-white focus:outline-none rounded-md shadow-lg"
              onClick={(e) => {
                if (e) e.preventDefault();
                const foundUnit = UNIT_OFFICER.find(
                  (u) => u.value === props.row.original.unit
                );

                setPasswordModalVisible(true);
                setPasswordFormData({
                  ...props.row.original,
                });
                if (foundUnit) {
                  setSelectedUnit([
                    {
                      value: foundUnit.value,
                      label: foundUnit.label,
                    },
                  ]);
                }
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

            <button
              className={`mb-1 bg-${
                props.row.original.isUserBioSecurityEnforcementOnly
                  ? "green"
                  : "blue"
              }-500 hover:bg-roles-600 mx-1 py-1 px-2 text-white focus:outline-none rounded-md shadow-lg`}
              onClick={async (e) => {
                if (e) e.preventDefault();
                showLoadingSpinner();
                try {
                  let existed =
                    props.row.original?.isUserBioSecurityEnforcementOnly ||
                    false;

                  if (existed === false) {
                    existed = true;
                  } else {
                    existed = false;
                  }
                  await setUserOnlyBioSecurityEnforcement({
                    variables: {
                      uuid: props.row.original.uuid,
                      isUserBioSecurityEnforcementOnly: existed,
                    },
                  });

                  notification.addNotification({
                    title: "Success!",
                    message: `User updated!`,
                    level: "success",
                  });

                  // await refetch();
                  setSavedCount((savedCount += 1));
                } catch (err) {
                  notification.handleError(err);
                }
                hideLoadingSpinner();
              }}
            >
              <i className="text-white fa fa-cogs" /> Enforcement Only
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
        width: 150,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "IC. No",
      accessor: "icNo",
      style: {
        fontSize: 20,
        width: 150,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
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
      Header: "District",
      accessor: "district",
      style: {
        fontSize: 20,
        width: 150,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Control Post",
      accessor: "controlPost",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Unit",
      accessor: "unit",
      style: {
        fontSize: 20,
        width: 150,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "User Roles",
      accessor: "Role.name",
      style: {
        fontSize: 20,
        width: 150,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
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
            {props.value.toUpperCase()}
          </button>
        ) : (
          <button
            className="bg-mantis-500 text-white font-bold rounded-md text-md py-2 w-full"
            onClick={handleDeactivateUser(props.row.original)}
          >
            {props.value.toUpperCase()}
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
        // await refetch();
        setSavedCount((savedCount += 1));
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
        setSavedCount((savedCount += 1));
        // await refetch();
      }
    } catch (err) {
      handleError(err);
    }
    hideLoadingSpinner();
  };

  return (
    <AdminArea urlQuery={router.query}>
      <FormModal
        title={`Update User Details`}
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
              uuid: passwordFormData.uuid,
              // newPassword: passwordFormData.newPassword,
              ...passwordFormData,
            };
            const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);
            await updateUser({
              variables: {
                tokenized,
              },
            });
            notification.addNotification({
              title: "Success!",
              message: `details update!`,
              level: "success",
            });
            // await refetch();
            setSavedCount((savedCount += 1));
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}
      >
        {/* <div className="form-group">
          <label>Username*</label>
          <input
            className="form-control"
            value={passwordFormData.username || ""}
            required
            onChange={(e) => {
              if (e) e.preventDefault();
              setPasswordFormData({
                ...passwordFormData,
                username: e.target.value,
              });
            }}
          />
        </div> */}
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
              setPasswordFormData({
                ...passwordFormData,
                phone: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>District*</label>
          <select
            required
            className="py-3 bg-white form-control rounded-3xl"
            value={passwordFormData.district || ""}
            onChange={(e) => {
              if (e) e.preventDefault;
              setPasswordFormData({
                ...passwordFormData,
                district: e.target.value,
              });
            }}
          >
            <option value={""} disabled>
              Select District
            </option>
            <option value={"Brunei Muara"}>BRUNEI MUARA</option>
            <option value={"Tutong"}>TUTONG</option>
            <option value={"Belait"}>BELAIT</option>
            <option value={"Temburong"}>TEMBURONG</option>
          </select>
        </div>

        <div className="form-group">
          <label>Control Post</label>
          <select
            required
            className="py-3 bg-white form-control rounded-3xl"
            value={passwordFormData.controlPost || ""}
            onChange={(e) => {
              if (e) e.preventDefault;
              setPasswordFormData({
                ...passwordFormData,
                controlPost: e.target.value,
              });
            }}
          >
            <option value={""} disabled>
              Select Control Post
            </option>
            <option value={"All"}>ALL</option>
            <option value={"Cargo/Airport"}>CARGO/AIRPORT</option>
            <option value={"Kuala Lurah"}>KUALA LURAH</option>
            <option value={"Muara Port"}>MUARA PORT</option>
            <option value={"Sg Tujoh"}>SG TUJOH</option>
            <option value={"Terminal Serasa"}>TERMINAL SERASA</option>
            <option value={"Labu"}>LABU</option>
            <option value={"Ujong Jalan"}>UJONG JALAN</option>
            <option value={"N/A"}>N/A</option>
          </select>
        </div>

        <div className="form-group mb-[10rem]">
          <label>Unit*</label>
          <Select
            value={selectedUnit}
            options={UNIT_OFFICER}
            className="w-full"
            classNamePrefix="select"
            onChange={(data) => {
              setPasswordFormData({
                ...passwordFormData,
                unit: data.value,
              });
              setSelectedUnit(data);
            }}
          />
        </div>

        {/* <div className="form-group">
          <label>New Password</label>
          <input
            className="form-control"
            value={passwordFormData.newPassword || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setPasswordFormData({
                ...passwordFormData,
                newPassword: e.target.value,
              });
            }}
          />
        </div>
         */}
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

            // await refetch();
            notification.addNotification({
              title: "Success!",
              message: `User Role Updated!`,
              level: "success",
            });

            setRolesModal(false);
            setSavedCount((savedCount += 1));
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
              <option value={role.uuid}>{role.name.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        {!currentUserDontHavePrivilege(["User Roles:Read"], currentUser) ? (
          <Table
            loading={false}
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
                        //   response.data.exportAllUsersTypeAdmin,
                        //   "__blank"
                        // );

                        downloadExcelFromBuffer(
                          response.data.exportAllUsersTypeAdmin.data,
                          "user-management-admin"
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
              !currentUserDontHavePrivilege(["User Roles:Delete"], currentUser)
                ? async ({ rows }) => {
                    showLoadingSpinner();
                    try {
                      if (
                        confirm(`Are you sure to delete ${rows.length} user`)
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
                    // refetch();
                    setSavedCount((savedCount += 1));
                  }
                : null
            }
            // customUtilitiesPosition="left"
          />
        ) : null}
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(page);
