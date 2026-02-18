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
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries {
    tokenizedAllSefiRentalMachineries
    countSefiRentalMachinery
  }
`;

const CREATE_SEFI = gql`
  mutation tokenizedCreateSefiRentalMachinery($tokenized: String!) {
    tokenizedCreateSefiRentalMachinery(tokenized: $tokenized)
  }
`;

const UPDATE_SEFI = gql`
  mutation tokenizedUpdateSefiRentalMachinery($tokenized: String!) {
    tokenizedUpdateSefiRentalMachinery(tokenized: $tokenized)
  }
`;

const DELETE_SEFI = gql`
  mutation tokenizedDeleteSefiRentalMachinery($tokenized: String!) {
    tokenizedDeleteSefiRentalMachinery(tokenized: $tokenized)
  }
`;

const EXPORT_SEFI_RENTAL = gql`
  mutation exportSefiRental {
    exportSefiRental
  }
`;

const page = () => {
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createSefiRentalMachinery] = useMutation(CREATE_SEFI);
  const [updateSefiRentalMachinery] = useMutation(UPDATE_SEFI);
  const [deleteSefiRentalMachinery] = useMutation(DELETE_SEFI);
  const [exportSefiRental] = useMutation(EXPORT_SEFI_RENTAL);
  const countSefiRentalMachinery = data?.countSefiRentalMachinery || 0;

  const [allSefiRentalMachineries, setAllSefiRentalMachineries] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedSefiRentalMachineries =
        data?.tokenizedAllSefiRentalMachineries || "";
      let allSefiRentalMachineries = [];
      if (encryptedSefiRentalMachineries) {
        const decrypted = jwt.verify(encryptedSefiRentalMachineries, TOKENIZE);
        allSefiRentalMachineries = decrypted.queryResult;
        setAllSefiRentalMachineries(allSefiRentalMachineries);
      }
    }
  }, [data, loading, error]);

  // const encryptedSefiRentalMachineries =
  //   data?.tokenizedAllSefiRentalMachineries || "";
  // let allSefiRentalMachineries = [];
  // if (encryptedSefiRentalMachineries) {
  //   const decrypted = jwt.verify(encryptedSefiRentalMachineries, TOKENIZE);
  //   allSefiRentalMachineries = decrypted.queryResult;
  // }

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
              <i className="fa fa-pencil-alt texot-white" /> Edit
            </button>
          </div>
        );
      },
    },
  ]);

  const columns = useMemo(() => [
    {
      Header: "Machine ID",
      accessor: "machineId",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Machine Name",
      accessor: "machineName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
  ]);

  return (
    <AdminArea
      header={{ title: "SEFI Rental Machinaries" }}
      urlQuery={router.query}
    >
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} SEFI Rental Machinery`}
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
              const tokenized = jwt.sign(formData, TOKENIZE);
              await createSefiRentalMachinery({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateSefiRentalMachinery({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Sefi Machinery saved!`,
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
          <label>Machine ID</label>
          <input
            className="form-control"
            placeholder="Enter Machine ID"
            value={formData.machineId || ""}
            disabled
          />
        </div>
        <div className="form-group">
          <label>Machine Name</label>
          <input
            className="form-control"
            placeholder="Enter Name"
            required
            value={formData.machineName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                machineName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allSefiRentalMachineries}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportSefiRental();
                    downloadExcelFromBuffer(
                      response.data.exportSefiRental.data,
                      "sefi-rental-agrifood"
                    );
                    // window.open(response.data.exportSefiRental, "__blank")
                  } catch (error) {
                    notification.handleError(error);
                  }
                }}
              >
                Export Excel
              </button>
            </div>
          }
          customUtilities={
            !currentUserDontHavePrivilege(["SEFI Rental Machinaries:Delete"])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege(["SEFI Rental Machinaries:Create"])
              ? () => {
                  let PREFIX = "MA000";
                  let count = "" + (countSefiRentalMachinery + 1);

                  PREFIX = PREFIX.slice(0, count.length * -1) + count;

                  setFormData({
                    machineId: PREFIX,
                  });
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["SEFI Rental Machinaries:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} data?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteSefiRentalMachinery({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} data deleted`,
                        level: "success",
                      });
                      await refetch();
                    }
                  } catch (err) {
                    handleError(er);
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

export default withApollo({ ssr: true })(page);
