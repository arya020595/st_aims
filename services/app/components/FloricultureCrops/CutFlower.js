import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../../components/App";
import { handleError } from "../../libs/errors";
import { useRouter } from "next/router";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import gql from "graphql-tag";
import {
  useQuery,
  useLazyQuery,
  useMutation,
  useApolloClient,
} from "@apollo/client";
import { useCurrentUser } from "../AdminArea";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query allCropsCutFlowers {
    tokenizedAllCropsCutFlowers
  }
`;

const CREATE_CUTFLOWER = gql`
  mutation tokenizedCreateCropsCutFlower($tokenized: String!) {
    tokenizedCreateCropsCutFlower(tokenized: $tokenized)
  }
`;

const UPDATE_CUTFLOWER = gql`
  mutation tokenizedUpdateCropsCutFlower($tokenized: String!) {
    tokenizedUpdateCropsCutFlower(tokenized: $tokenized)
  }
`;

const DELETE_CUTFLOWER = gql`
  mutation tokenizedDeleteCropsCutFlower($tokenized: String!) {
    tokenizedDeleteCropsCutFlower(tokenized: $tokenized)
  }
`;

const EXPORT_CUTFLOWERCROPS = gql`
  mutation exportsCropsCutFlower {
    exportsCropsCutFlower
  }
`;

const CutFlower = ({}) => {
  const { data, loading, error, refetch } = useQuery(QUERY, {});
  const [createCropsCutFlower] = useMutation(CREATE_CUTFLOWER);
  const [updateCropsCutFlower] = useMutation(UPDATE_CUTFLOWER);
  const [deleteCropsCutFlower] = useMutation(DELETE_CUTFLOWER);
  const [exportsCropsCutFlower] = useMutation(EXPORT_CUTFLOWERCROPS);
  const client = useApolloClient();
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});

  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const [allCropsCutFlowers, setAllCropsCutFlowers] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedCropsCutFlowers = data?.tokenizedAllCropsCutFlowers || "";
      let allCropsCutFlowers = [];
      if (encryptedCropsCutFlowers) {
        const decrypted = jwt.verify(encryptedCropsCutFlowers, TOKENIZE);
        allCropsCutFlowers = decrypted.queryResult;
        setAllCropsCutFlowers(allCropsCutFlowers);
      }
    }
  }, [data, loading, error]);

  // const encryptedCropsCutFlowers = data?.tokenizedAllCropsCutFlowers || "";
  // let allCropsCutFlowers = [];
  // if (encryptedCropsCutFlowers) {
  //   const decrypted = jwt.verify(encryptedCropsCutFlowers, TOKENIZE);
  //   allCropsCutFlowers = decrypted.queryResult;
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
              onClick={async (e) => {
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
      Header: "Cut Flower ID",
      accessor: "cutFlowerId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Malay Name",
      accessor: "localName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "English Name",
      accessor: "englishName",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
    {
      Header: "Crop Name",
      accessor: "cropName",
      style: {
        fontSize: 20,
        width: 200,
      },
      Cell: (props) => <span>{props.value.toUpperCase()}</span>,
    },
  ]);

  const columnsComplience = useMemo(() => [
    {
      Header: "Date",
      accessor: "date",
      style: {
        fontSize: 20,
      },
    },
  ]);

  return (
    <div>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Cut Flower`}
        visible={modalVisible}
        size={"md"}
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
              await createCropsCutFlower({
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
              await updateCropsCutFlower({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: ` Crops Cut Flower saved!`,
              level: "success",
            });
          } catch (error) {
            notification.handleError(error);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="grid grid-cols-1">
          <div>
            <div className="form-group">
              <label>Cut Flower ID</label>
              <input
                disabled
                placeholder="Will generated after saved"
                className="form-control"
                value={formData.cutFlowerId || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    cutFlowerId: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Malay Name</label>
              <input
                className="form-control"
                value={formData.localName || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    localName: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>English Name</label>
              <input
                className="form-control"
                value={formData.englishName || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    englishName: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Crop Name</label>
              <input
                className="form-control"
                value={formData.cropName || ""}
                onChange={(e) => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    cropName: e.target.value.toUpperCase(),
                  });
                }}
              />
            </div>
          </div>
        </div>
      </FormModal>
      <div className="pr-0 py-2 h-full">
        <Table
          columns={columns}
          data={allCropsCutFlowers}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportsCropsCutFlower();
                    downloadExcelFromBuffer(
                      response.data.exportsCropsCutFlower.data,
                      "cut-flower-export-excel"
                    );
                    // window.open(response.data.exportsCropsCutFlower, "__blank")
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
            !currentUserDontHavePrivilege(["Cut Flower Floriculture:Update"])
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege(["Cut Flower Floriculture:Create"])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          customUtilitiesPosition="left"
          onRemove={
            !currentUserDontHavePrivilege(["Cut Flower Floriculture:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} cut flowers?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteCropsCutFlower({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} cut flowers deleted`,
                        level: "success",
                      });
                      await refetch();

                      router.replace({
                        pathname: router.pathname,
                        query: {
                          ...router.query,
                          saveDate: new Date().toISOString(),
                        },
                      });
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
    </div>
  );
};
export default withApollo({ ssr: true })(CutFlower);

// const downloadExcel = async (fileBuffer, filename) => {
//   const byteArray = Array.isArray(fileBuffer)
//     ? Uint8Array.from(fileBuffer)
//     : new Uint8Array(fileBuffer || []);

//   const blob = new Blob([byteArray], {
//     type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//   });

//   const url = window.URL.createObjectURL(blob);
//   const link = document.createElement("a");
//   link.href = url;
//   link.setAttribute("download", filename);
//   document.body.appendChild(link);
//   link.click();
//   link.remove();
//   window.URL.revokeObjectURL(url);

//   return {
//     success: true,
//     error: "",
//   };
// };
