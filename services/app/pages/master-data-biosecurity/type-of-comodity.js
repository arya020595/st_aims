import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../../components/App";
import { useNotification } from "../../components/Notification";
import { handleError } from "../../libs/errors";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Table from "../../components/Table";
import {
  useQuery,
  useLazyQuery,
  useMutation,
  useApolloClient,
} from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { FormModal } from "../../components/Modal";
import { useRouter } from "next/router";
import Head from "next/dist/next-server/lib/head";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";

const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries($onPage: String) {
    tokenizedAllBioSecurityTypeOfComodities(onPage: $onPage)
    tokenizedAllBioSecurityCategories
    tokenizedAllBioSecurityUnits
  }
`;
const COMMODITY_DETAIL_QUERY = gql`
  query detailQuery($bioSecurityTypeOfComodityUUID: String!) {
    allBioSecurityTypeOfComodityDetail(
      bioSecurityTypeOfComodityUUID: $bioSecurityTypeOfComodityUUID
    ) {
      id
      uuid
      code
      englishName
      localName
      activeIngredients

      BioSecurityTypeOfComodity {
        uuid
        name
      }
      BioSecurityCategory {
        uuid
        name
      }

      BioSecuritySubCategory {
        uuid
        name
      }
      BioSecurityUnit {
        uuid
        name
      }
    }
  }
`;

const CREATE_TYPE_OF_COMODITY = gql`
  mutation tokenizedCreateBioSecurityTypeOfComodity($tokenized: String!) {
    tokenizedCreateBioSecurityTypeOfComodity(tokenized: $tokenized)
  }
`;

const UPDATE_TYPE_OF_COMODITY = gql`
  mutation tokenizedUpdateBioSecurityTypeOfComodity($tokenized: String!) {
    tokenizedUpdateBioSecurityTypeOfComodity(tokenized: $tokenized)
  }
`;

const DELETE_TYPE_OF_COMODITY = gql`
  mutation tokenizedDeleteBioSecurityTypeOfComodity($tokenized: String!) {
    tokenizedDeleteBioSecurityTypeOfComodity(tokenized: $tokenized)
  }
`;
const CREATE_TYPE_OF_COMODITY_DETAILS = gql`
  mutation createBioSecurityTypeOfComodityDetail(
    $code: String!
    $englishName: String!
    $localName: String!
    $activeIngredients: String
    $bioSecurityTypeOfComodityUUID: String!
    $bioSecurityCategoryUUID: String!
    $bioSecuritySubCategoryUUID: String!
    $bioSecurityUnitUUID: String!
  ) {
    createBioSecurityTypeOfComodityDetail(
      code: $code
      englishName: $englishName
      localName: $localName
      activeIngredients: $activeIngredients

      bioSecurityTypeOfComodityUUID: $bioSecurityTypeOfComodityUUID
      bioSecurityCategoryUUID: $bioSecurityCategoryUUID

      bioSecuritySubCategoryUUID: $bioSecuritySubCategoryUUID
      bioSecurityUnitUUID: $bioSecurityUnitUUID
    )
  }
`;

const UPDATE_TYPE_OF_COMODITY_DETAILS = gql`
  mutation updateBioSecurityTypeOfComodityDetail(
    $uuid: String!
    $code: String
    $englishName: String
    $localName: String
    $activeIngredients: String
    $bioSecurityTypeOfComodityUUID: String
    $bioSecurityCategoryUUID: String
    $bioSecuritySubCategoryUUID: String
    $bioSecurityUnitUUID: String
  ) {
    updateBioSecurityTypeOfComodityDetail(
      uuid: $uuid
      code: $code
      englishName: $englishName
      localName: $localName
      activeIngredients: $activeIngredients

      bioSecurityTypeOfComodityUUID: $bioSecurityTypeOfComodityUUID
      bioSecurityCategoryUUID: $bioSecurityCategoryUUID

      bioSecuritySubCategoryUUID: $bioSecuritySubCategoryUUID
      bioSecurityUnitUUID: $bioSecurityUnitUUID
    )
  }
`;

const DELETE_TYPE_OF_COMODITY_DETAILS = gql`
  mutation deleteBioSecurityTypeOfComodityDetail($uuid: String!) {
    deleteBioSecurityTypeOfComodityDetail(uuid: $uuid)
  }
`;

const EXPORT_TYPE_OF_COMMODITY = gql`
  mutation exportBioSecurityTypeOfComodity {
    exportBioSecurityTypeOfComodity
  }
`;
const EXPORT_TYPE_OF_COMMODITY_DETAILS = gql`
  mutation exportBioSecurityTypeOfComodityDetails(
    $bioSecurityTypeOfComodityUUID: String!
  ) {
    exportBioSecurityTypeOfComodityDetails(
      bioSecurityTypeOfComodityUUID: $bioSecurityTypeOfComodityUUID
    )
  }
`;

const BioSecurityTypeOfComodity = () => {
  const router = useRouter();
  const client = useApolloClient();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [bioSecurityTypeOfComodityUUID, setBioSecurityTypeOfComodityUUID] =
    useState("");
  const [formData, setFormData] = useState({
    bioSecurityTypeOfComodityUUID,
  });

  const [typeOfComodityDetailFormData, setTypeOfComodityDetailFormData] =
    useState({});
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  let [savedCountDetail, setSavedCountDetail] = useState(0);
  let [savedCount, setSavedCount] = useState(0);
  const [exportBioSecurityTypeOfComodity] = useMutation(
    EXPORT_TYPE_OF_COMMODITY
  );
  const [exportBioSecurityTypeOfComodityDetails] = useMutation(
    EXPORT_TYPE_OF_COMMODITY_DETAILS
  );
  const [allBioSecuritySubCategories, setAllSubCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

  const { data, error, loading, refetch } = useQuery(QUERY, {
    variables: {
      // bioSecurityTypeOfComodityUUID,
      onPage: "MASTER DATA",
    },
  });
  const [createBioSecurityTypeOfComodity] = useMutation(
    CREATE_TYPE_OF_COMODITY
  );
  const [updateBioSecurityTypeOfComodity] = useMutation(
    UPDATE_TYPE_OF_COMODITY
  );
  const [deleteBioSecurityTypeOfComodity] = useMutation(
    DELETE_TYPE_OF_COMODITY
  );

  const [createBioSecurityTypeOfComodityDetail] = useMutation(
    CREATE_TYPE_OF_COMODITY_DETAILS
  );
  const [updateBioSecurityTypeOfComodityDetail] = useMutation(
    UPDATE_TYPE_OF_COMODITY_DETAILS
  );
  const [deleteBioSecurityTypeOfComodityDetail] = useMutation(
    DELETE_TYPE_OF_COMODITY_DETAILS
  );

  const [allBioSecurityTypeOfComodities, setAllBioSecurityTypeOfComodities] =
    useState([]);
  const [allBioSecurityCategories, setAllBioSecurityCategories] = useState([]);
  const [allBioSecurityUnits, setAllBioSecurityUnits] = useState([]);

  const [
    allBioSecurityTypeOfComodityDetail,
    setAllBioSecurityTypeOfComodityDetail,
  ] = useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedBioSecurityTypeOfComodities =
        data?.tokenizedAllBioSecurityTypeOfComodities || "";
      let allBioSecurityTypeOfComodities = [];
      if (encryptedBioSecurityTypeOfComodities) {
        const decrypted = jwt.verify(
          encryptedBioSecurityTypeOfComodities,
          TOKENIZE
        );
        allBioSecurityTypeOfComodities = decrypted.queryResult;
        setAllBioSecurityTypeOfComodities(allBioSecurityTypeOfComodities);
      }
      const encryptedBioSecurityCategories =
        data?.tokenizedAllBioSecurityCategories || "";
      let allBioSecurityCategories = [];
      if (encryptedBioSecurityCategories) {
        const decrypted = jwt.verify(encryptedBioSecurityCategories, TOKENIZE);
        allBioSecurityCategories = decrypted.queryResult;
        setAllBioSecurityCategories(allBioSecurityCategories);
      }
      const encryptedBioSecurityUnits =
        data?.tokenizedAllBioSecurityUnits || "";
      let allBioSecurityUnits = [];
      if (encryptedBioSecurityUnits) {
        const decrypted = jwt.verify(encryptedBioSecurityUnits, TOKENIZE);
        allBioSecurityUnits = decrypted.queryResult;
        setAllBioSecurityUnits(allBioSecurityUnits);
      }
    }
  }, [data, loading, error]);

  useEffect(async () => {
    showLoadingSpinner();
    const result = await client.query({
      query: COMMODITY_DETAIL_QUERY,
      variables: {
        bioSecurityTypeOfComodityUUID,
      },
      fetchPolicy: "no-cache",
    });

    setAllBioSecurityTypeOfComodityDetail(
      result.data.allBioSecurityTypeOfComodityDetail
    );
    hideLoadingSpinner();
  }, [bioSecurityTypeOfComodityUUID, savedCountDetail]);

  // const encryptedBioSecurityTypeOfComodities =
  //   data?.tokenizedAllBioSecurityTypeOfComodities || "";
  // let allBioSecurityTypeOfComodities = [];
  // if (encryptedBioSecurityTypeOfComodities) {
  //   const decrypted = jwt.verify(
  //     encryptedBioSecurityTypeOfComodities,
  //     TOKENIZE
  //   );
  //   allBioSecurityTypeOfComodities = decrypted.queryResult;
  // }

  // const encryptedBioSecurityCategories =
  //   data?.tokenizedAllBioSecurityCategories || "";
  // let allBioSecurityCategories = [];
  // if (encryptedBioSecurityCategories) {
  //   const decrypted = jwt.verify(encryptedBioSecurityCategories, TOKENIZE);
  //   allBioSecurityCategories = decrypted.queryResult;
  // }
  // const encryptedBioSecurityTypeOfComodityDetail =
  //   data?.tokenizedAllBioSecurityTypeOfComodityDetail || "";

  // let allBioSecurityTypeOfComodityDetail = [];
  // if (encryptedBioSecurityTypeOfComodityDetail !== "") {
  //   if (encryptedBioSecurityTypeOfComodityDetail) {
  //     const decrypted = jwt.verify(
  //       encryptedBioSecurityTypeOfComodityDetail,
  //       TOKENIZE
  //     );
  //     allBioSecurityTypeOfComodityDetail = decrypted.queryResult;
  //   }
  // }

  // let allBioSecurityTypeOfComodityDetail = [];
  // if (data && data.allBioSecurityTypeOfComodityDetail) {
  //   allBioSecurityTypeOfComodityDetail =
  //     data.allBioSecurityTypeOfComodityDetail;
  // }

  // const encryptedBioSecurityUnits = data?.tokenizedAllBioSecurityUnits || "";
  // let allBioSecurityUnits = [];
  // if (encryptedBioSecurityUnits) {
  //   const decrypted = jwt.verify(encryptedBioSecurityUnits, TOKENIZE);
  //   allBioSecurityUnits = decrypted.queryResult;
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
              <i className="fa fa-pencil-alt text-white" /> Edit
            </button>
          </div>
        );
      },
    },
  ]);

  const customUtilitiesDetails = useMemo(() => [
    {
      label: "Edit",
      icon: <i className="fa fa-pencil" />,
      width: 400,

      render: (props) => {
        return (
          <div className="flex">
            <button
              onClick={(e) => {
                const found = allBioSecurityCategories.find(
                  (cat) =>
                    cat.uuid === props.row.original.BioSecurityCategory.uuid
                );
                setDetailModalVisible(true);
                setTypeOfComodityDetailFormData({
                  ...props.row.original,
                  bioSecurityCategoryUUID:
                    props.row.original?.BioSecurityCategory?.uuid || "",
                  bioSecurityUnitUUID:
                    props.row.original?.BioSecurityUnit?.uuid || "",
                  bioSecuritySubCategoryUUID:
                    props.row.original?.BioSecuritySubCategory?.uuid || "",
                });
                setAllSubCategories(found.SubCategories);
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

  // console.log({ typeOfComodityDetailFormData });

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
    {
      Header: "Details",
      accessor: "uuid",
      style: {
        fontSize: 20,
      },
      Cell: (props) => (
        <span>
          <button
            className="bg-blue-400 px-4 py-2 rounded-md shadow-md text-white font-bold"
            onClick={(e) => {
              if (e) e.preventDefault();

              setBioSecurityTypeOfComodityUUID(props.value);
            }}
          >
            <p className="text-xs">
              <i className="fa fa-search" /> Details
            </p>
          </button>
        </span>
      ),
    },
  ]);

  const columnDetails = useMemo(() => [
    {
      Header: "Product Code",
      accessor: "code",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "BioSecurityCategory",
      accessor: "BioSecurityCategory.name",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Sub Category",
      accessor: "BioSecuritySubCategory.name",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "English Name",
      accessor: "englishName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Local Name",
      accessor: "localName",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Active Ingredient / Crop Name",
      accessor: "activeIngredients",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Unit",
      accessor: "BioSecurityUnit.name",
      style: {
        fontSize: 20,
      },
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
  ]);

  return (
    <AdminArea header={{ title: "Type Of Comodity" }} urlQuery={router.query}>
      <Head>
        <title>Type Of Comodity</title>
      </Head>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Type of Commodity`}
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
              await createBioSecurityTypeOfComodity({
                variables: {
                  ...formData,
                  tokenized,
                },
              });

              setModalVisible(false);

              setModalVisible(true);
              setFormData({});
            } else {
              const tokenized = jwt.sign(formData, TOKENIZE);
              await updateBioSecurityTypeOfComodity({
                variables: {
                  ...formData,
                  tokenized,
                },
              });
            }

            await refetch();

            notification.addNotification({
              title: "Succeess!",
              message: `Type Of Comodity saved!`,
              level: "success",
            });
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

      <FormModal
        title={`${
          !typeOfComodityDetailFormData.uuid ? "New" : "Edit"
        } Comodity Details`}
        visible={detailModalVisible}
        onCustomCloseBackDrop={true}
        onClose={(e) => {
          if (e) e.preventDefault();
          setDetailModalVisible(false);
          setTypeOfComodityDetailFormData({});
        }}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            const { uuid, __typename } = typeOfComodityDetailFormData;
            if (!uuid) {
              await createBioSecurityTypeOfComodityDetail({
                variables: {
                  ...typeOfComodityDetailFormData,
                },
              });
              setDetailModalVisible(false);
              setTypeOfComodityDetailFormData({
                bioSecurityTypeOfComodityUUID: "",
              });
              setDetailModalVisible(true);
            } else {
              await updateBioSecurityTypeOfComodityDetail({
                variables: {
                  ...typeOfComodityDetailFormData,
                },
              });
            }

            setSavedCountDetail((savedCountDetail += 1));
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Comodity saved!`,
              level: "success",
            });
            setDetailModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Code</label>
          <input
            className="form-control"
            value={typeOfComodityDetailFormData.code || ""}
            onChange={(e) => {
              setTypeOfComodityDetailFormData({
                ...typeOfComodityDetailFormData,
                code: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Category</label>
          <select
            className="form-control"
            value={typeOfComodityDetailFormData.bioSecurityCategoryUUID || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              const found = allBioSecurityCategories.find(
                (cat) => cat.uuid === e.target.value
              );
              setTypeOfComodityDetailFormData({
                ...typeOfComodityDetailFormData,
                bioSecurityCategoryUUID: found?.uuid || "",
              });
              setAllSubCategories(found.SubCategories);
            }}
            required
          >
            <option value={""} disabled>
              Select Category
            </option>
            {allBioSecurityCategories.map((cat) => (
              <option value={cat.uuid}>{cat.name.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Sub Category</label>
          <select
            className="form-control"
            value={
              typeOfComodityDetailFormData.bioSecuritySubCategoryUUID || ""
            }
            onChange={(e) => {
              if (e) e.preventDefault();

              setTypeOfComodityDetailFormData({
                ...typeOfComodityDetailFormData,
                bioSecuritySubCategoryUUID: e.target.value,
              });
            }}
            required
          >
            <option value={""} disabled>
              Select Sub Category
            </option>
            {allBioSecuritySubCategories.map((cat) => (
              <option value={cat.uuid}>{cat.name.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>English Name</label>
          <input
            className="form-control"
            value={typeOfComodityDetailFormData.englishName || ""}
            onChange={(e) => {
              setTypeOfComodityDetailFormData({
                ...typeOfComodityDetailFormData,
                englishName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Local Name</label>
          <input
            className="form-control"
            value={typeOfComodityDetailFormData.localName || ""}
            onChange={(e) => {
              setTypeOfComodityDetailFormData({
                ...typeOfComodityDetailFormData,
                localName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Active Ingredient / Crop Name</label>
          <input
            className="form-control"
            value={typeOfComodityDetailFormData.activeIngredients || ""}
            onChange={(e) => {
              setTypeOfComodityDetailFormData({
                ...typeOfComodityDetailFormData,
                activeIngredients: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Unit</label>
          <select
            className="form-control"
            value={typeOfComodityDetailFormData.bioSecurityUnitUUID || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              setTypeOfComodityDetailFormData({
                ...typeOfComodityDetailFormData,
                bioSecurityUnitUUID: e.target.value,
              });
            }}
            required
          >
            <option value={""} disabled>
              Select Unit
            </option>
            {allBioSecurityUnits.map((unit) => (
              <option value={unit.uuid}>{unit.name.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </FormModal>
      <div
        className={`mt-26 pr-0 md:pr-10 py-4 h-full ${
          !bioSecurityTypeOfComodityUUID ? "" : "hidden"
        }`}
      >
        <Table
          loading={loading}
          columns={columns}
          data={allBioSecurityTypeOfComodities}
          withoutHeader={true}
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response = await exportBioSecurityTypeOfComodity();

                    downloadExcelFromBuffer(
                      response.data.exportBioSecurityTypeOfComodity.data,
                      "bios-type-of-commodity"
                    );
                    // window.open(response.data.exportBioSecurityTypeOfComodity, "__blank")
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
            !currentUserDontHavePrivilege(["Type Of Comodity:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
          onAdd={
            !currentUserDontHavePrivilege(["Type Of Comodity:Create"])
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Type Of Comodity:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} comodities?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteBioSecurityTypeOfComodity({
                          variables: {
                            uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} comodities deleted`,
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

      <div
        className={`mt-26 pr-0 md:pr-10 py-4 h-full ${
          !bioSecurityTypeOfComodityUUID ? "hidden" : ""
        }`}
      >
        <p
          className="text-lg text-blue-500 font-bold cursor-pointer"
          onClick={(e) => {
            if (e) e.preventDefault();
            setBioSecurityTypeOfComodityUUID("");
          }}
        >
          <i className="fa fa-arrow-left" /> Back
        </p>

        <Table
          loading={loading}
          columns={columnDetails}
          data={allBioSecurityTypeOfComodityDetail}
          withoutHeader={true}
          customUtilities={customUtilitiesDetails}
          customUtilitiesPosition="left"
          customHeaderUtilities={
            <div className="flex mx-2 items-end">
              <button
                className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                onClick={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    const response =
                      await exportBioSecurityTypeOfComodityDetails({
                        variables: {
                          bioSecurityTypeOfComodityUUID:
                            bioSecurityTypeOfComodityUUID,
                        },
                      });

                    window.open(
                      response.data.exportBioSecurityTypeOfComodityDetails,
                      "__blank"
                    );
                  } catch (error) {
                    notification.handleError(error);
                  }
                }}
              >
                Export Excel
              </button>
            </div>
          }
          onAdd={() => {
            setTypeOfComodityDetailFormData({
              bioSecurityTypeOfComodityUUID,
            });
            setDetailModalVisible(true);
          }}
          onRemove={async ({ rows }) => {
            showLoadingSpinner();
            try {
              let yes = confirm(
                `Are you sure to delete ${rows.length} details?`
              );
              if (yes) {
                for (const row of rows) {
                  await deleteBioSecurityTypeOfComodityDetail({
                    variables: {
                      uuid: row.uuid,
                    },
                  });
                }
                notification.addNotification({
                  title: "Success!",
                  message: `${rows.length} details deleted`,
                  level: "success",
                });
                await refetch();
                setSavedCountDetail((savedCountDetail += 1));
              }
            } catch (err) {
              handleError(err);
            }
            hideLoadingSpinner();
            refetch();
          }}
        />
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(BioSecurityTypeOfComodity);
