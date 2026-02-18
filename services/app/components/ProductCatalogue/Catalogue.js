import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
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
import AsyncSelect from "react-select/async";
import Select from "react-select";
import Link from "next/link";
import AdminArea from "../../components/AdminArea";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import { concat } from "lodash";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries {
    tokenizedAllProductCatalogues

    #tokenizedAllAgrifoodCompanyProfiles

    tokenizedAllAgrifoodProductCategories
  }
`;

const SEARCH_COMPANY_PROFILE = gql`
  query searchAllAgrifoodCompanyProfiles($name: String) {
    searchAllAgrifoodCompanyProfiles(name: $name)
  }
`;

const GET_COMPANY_PROFILE = gql`
  query getAgrifoodCompanyProfile($uuid: String!) {
    getAgrifoodCompanyProfile(uuid: $uuid) {
      uuid
      companyName
      companyRegNo
    }
  }
`;
const CREATE_PRODUCT_CATALOGUE = gql`
  mutation tokenizedCreateProductCatalogue($tokenized: String!) {
    tokenizedCreateProductCatalogue(tokenized: $tokenized)
  }
`;

const UPDATE_PRODUCT_CATALOGUE = gql`
  mutation tokenizedUpdateProductCatalogue($tokenized: String!) {
    tokenizedUpdateProductCatalogue(tokenized: $tokenized)
  }
`;
const DELETE_PRODUCT_CATALOGUE = gql`
  mutation tokenizedDeleteProductCatalogue($tokenized: String!) {
    tokenizedDeleteProductCatalogue(tokenized: $tokenized)
  }
`;

const IS_CHECK_FARMER = gql`
  query isFarmerCheck {
    isFarmerCheck
  }
`;

const Catalogue = ({ currentUserDontHavePrivilege, currentUser }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();
  const client = useApolloClient();

  const { data, error, loading, refetch } = useQuery(QUERY);
  const [createProductCatalogue] = useMutation(CREATE_PRODUCT_CATALOGUE);
  const [updateProductCatalogue] = useMutation(UPDATE_PRODUCT_CATALOGUE);
  const [deleteProductCatalogue] = useMutation(DELETE_PRODUCT_CATALOGUE);
  const [registerType, setRegisterType] = useState("");
  const [allProductCatalogues, setAllProductCatalogues] = useState([]);
  const [allAgrifoodCompanyProfiles, setAllAgrifoodCompanyProfiles] = useState(
    []
  );
  const [allAgrifoodProductCategories, setAllAgrifoodProductCategories] =
    useState([]);

  useEffect(() => {
    if (!loading && !error) {
      const encryptedProductCatalogues =
        data?.tokenizedAllProductCatalogues || "";
      let allProductCatalogues = [];
      if (encryptedProductCatalogues) {
        const decrypted = jwt.verify(encryptedProductCatalogues, TOKENIZE);
        allProductCatalogues = decrypted.queryResult;
        setAllProductCatalogues(allProductCatalogues);
      }

      // const encryptedAgrifoodCompanyProfiles =
      //   data?.tokenizedAllAgrifoodCompanyProfiles || "";
      // let allAgrifoodCompanyProfiles = [];
      // if (encryptedAgrifoodCompanyProfiles) {
      //   const decrypted = jwt.verify(
      //     encryptedAgrifoodCompanyProfiles,
      //     TOKENIZE
      //   );
      //   allAgrifoodCompanyProfiles = decrypted.queryResult;
      //   setAllAgrifoodCompanyProfiles(allAgrifoodCompanyProfiles);
      // }

      const encryptedAgrifoodProductCategories =
        data?.tokenizedAllAgrifoodProductCategories || "";
      let allAgrifoodProductCategories = [];
      if (encryptedAgrifoodProductCategories) {
        const decrypted = jwt.verify(
          encryptedAgrifoodProductCategories,
          TOKENIZE
        );
        allAgrifoodProductCategories = decrypted.queryResult;
        setAllAgrifoodProductCategories(allAgrifoodProductCategories);
      }
    }
  }, [data, loading, error]);

  const fetchingCompany = async (input, callback) => {
    const result = await client.query({
      query: SEARCH_COMPANY_PROFILE,
      variables: {
        name: input,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedCompanyProfile =
      result.data?.searchAllAgrifoodCompanyProfiles || "";
    let allAgrifoodCompanyProfiles = [];
    if (encryptedCompanyProfile) {
      const decrypted = jwt.verify(encryptedCompanyProfile, TOKENIZE);
      allAgrifoodCompanyProfiles = decrypted.queryResult;
      setAllAgrifoodCompanyProfiles(allAgrifoodCompanyProfiles);
    }

    callback(allAgrifoodCompanyProfiles);
  };

  const getCompany = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      fetchingCompany(input, callback);
    }
  };

  // let allProductCatalogues = [];
  // const encryptedProductCatalogues = data?.tokenizedAllProductCatalogues || "";
  // if (encryptedProductCatalogues) {
  //   const decrypted = jwt.verify(encryptedProductCatalogues, TOKENIZE);
  //   allProductCatalogues = decrypted.queryResult;
  // }

  // let allAgrifoodCompanyProfiles = [];
  // const encryptedAgrifoodCompanyProfiles =
  //   data?.tokenizedAllAgrifoodCompanyProfiles || "";
  // if (encryptedAgrifoodCompanyProfiles) {
  //   const decrypted = jwt.verify(encryptedAgrifoodCompanyProfiles, TOKENIZE);
  //   allAgrifoodCompanyProfiles = decrypted.queryResult;
  // }

  // let allAgrifoodProductCategories = [];
  // const encryptedAgrifoodProductCategories =
  //   data?.tokenizedAllAgrifoodProductCategories || "";
  // if (encryptedAgrifoodProductCategories) {
  //   const decrypted = jwt.verify(encryptedAgrifoodProductCategories, TOKENIZE);
  //   allAgrifoodProductCategories = decrypted.queryResult;
  // }

  useEffect(async () => {
    const result = await client.query({
      query: IS_CHECK_FARMER,
      fetchPolicy: "no-cache",
    });

    const farmerCheck = result.data.isFarmerCheck;
    if (farmerCheck) {
      const result = await client.query({
        query: SEARCH_COMPANY_PROFILE,
        variables: {},
        fetchPolicy: "no-cache",
      });

      const encryptedCompanyProfile =
        result.data?.searchAllAgrifoodCompanyProfiles || "";
      let allAgrifoodCompanyProfiles = [];
      if (encryptedCompanyProfile) {
        const decrypted = jwt.verify(encryptedCompanyProfile, TOKENIZE);
        allAgrifoodCompanyProfiles = decrypted.queryResult;
        setAllAgrifoodCompanyProfiles(allAgrifoodCompanyProfiles);
      }
      setRegisterType("FARMER");
    } else {
      setRegisterType("OFFICER");
    }
  }, []);

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
                  CompanyProfile: {
                    uuid: props.row.original?.companyUUID,
                    companyName: props.row.original?.companyName,
                  },
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
      Header: "Company Name",
      accessor: "companyName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Product Category",
      accessor: "productCategory",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Code",
      accessor: "code",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "",
      accessor: "uuid",
      style: {
        fontSize: 20,
        width: 120,
      },
      disableFilters: true,
      Cell: (props) => (
        <span>
          <button
            className="bg-blue-400 px-4 py-2 rounded-md shadow-md text-white font-bold"
            onClick={async (e) => {
              if (e) e.preventDefault();

              console.log(props.row.original);

              const company = await client.query({
                query: GET_COMPANY_PROFILE,
                variables: {
                  uuid: props.row.original.companyUUID,
                },
              });

              // const company = allAgrifoodCompanyProfiles.find(
              //   (comp) => comp.uuid === props.row.original.companyUUID
              // );

              router.replace({
                pathname: router.pathname,
                query: {
                  // ...urlQuery,
                  ...router.query,
                  productCatalogueUUID: props.row.original.uuid,
                  catalogueCode: props.row.original.code,
                  componentName: "Catalogue Details",
                  companyUUID:
                    company.data.getAgrifoodCompanyProfile?.uuid || "",
                  companyName:
                    company.data.getAgrifoodCompanyProfile?.companyName || "",
                  companyRegNo:
                    company.data.getAgrifoodCompanyProfile?.companyRegNo || "",

                  productCategoryUUID: props.row.original.productCategoryUUID,
                  productCategory: props.row.original.productCategory,
                },
              });
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

  return (
    <div>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Product Catalogue`}
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
            const { id, uuid, __typename } = formData;
            let payload = {
              ...formData,
            };
            delete payload.CompanyProfile;
            if (!uuid) {
              const tokenized = jwt.sign(payload, TOKENIZE);
              await createProductCatalogue({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });

              setModalVisible(false);
              setFormData({});
              setModalVisible(true);
            } else {
              const tokenized = jwt.sign(payload, TOKENIZE);
              await updateProductCatalogue({
                variables: {
                  // ...formData,
                  tokenized,
                },
              });
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Product Catalogue saved!`,
              level: "success",
            });

            // setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Company Name</label>
          {registerType === "OFFICER" ? (
            <AsyncSelect
              loadOptions={getCompany}
              classNamePrefix="select"
              noOptionsMessage={() => "Type to Search"}
              getOptionLabel={(option) => `${option.companyName}`}
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              value={formData.CompanyProfile || ""}
              onChange={(selectedValues) => {
                setFormData({
                  ...formData,
                  companyUUID: selectedValues?.uuid || "",
                  companyName: selectedValues?.companyName || "",
                  CompanyProfile: selectedValues,
                });
              }}
            />
          ) : (
            <Select
              options={allAgrifoodCompanyProfiles}
              classNamePrefix="select"
              getOptionLabel={(option) => `${option.companyName}`}
              getOptionValue={(option) => option.uuid}
              autoFocus={true}
              value={formData.CompanyProfile || ""}
              onChange={(selectedValues) => {
                setFormData({
                  ...formData,
                  companyUUID: selectedValues?.uuid || "",
                  companyName: selectedValues?.companyName || "",
                  CompanyProfile: selectedValues,
                });
              }}
            />
          )}

          {/* <select
            className="form-control"
            value={formData.companyUUID || ""}
            required
            onChange={(e) => {
              if (e) e.preventDefault();
              const found = allAgrifoodCompanyProfiles.find(
                (company) => company.uuid === e.target.value
              );
              setFormData({
                ...formData,
                companyUUID: found?.uuid || "",
                companyName: found?.companyName || "",
              });
            }}
          >
            <option value="" disabled>
              Select Company Name
            </option>
            {allAgrifoodCompanyProfiles.map((company) => (
              <option value={company.uuid}>{company.companyName}</option>
            ))}
          </select> */}
        </div>
        <div className="form-group">
          <label>Product Category</label>
          <select
            className="form-control"
            value={formData.productCategoryUUID || ""}
            required
            onChange={(e) => {
              if (e) e.preventDefault();
              const found = allAgrifoodProductCategories.find(
                (company) => company.uuid === e.target.value
              );
              setFormData({
                ...formData,
                productCategoryUUID: found?.uuid || "",
                productCategory: found?.productNameEnglish || "",
              });
            }}
          >
            <option value="" disabled>
              Select Product Category
            </option>
            {allAgrifoodProductCategories.map((cat) => (
              <option value={cat.uuid}>{cat.productNameEnglish}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Code</label>
          <input
            placeholder="Code will generate after saved"
            disabled
            className="form-control"
            value={formData.code || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                code: e.target.value,
              });
            }}
            required
          />
        </div>
      </FormModal>
      <div className="mt-4 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allProductCatalogues}
          withoutHeader={true}
          customUtilities={
            !currentUserDontHavePrivilege(
              ["Product Catalogue:Update"],
              currentUser
            )
              ? customUtilities
              : null
          }
          onAdd={
            !currentUserDontHavePrivilege(
              ["Product Catalogue:Create"],
              currentUser
            )
              ? () => {
                  setFormData({});
                  setModalVisible(true);
                }
              : null
          }
          customUtilitiesPosition="left"
          onRemove={
            !currentUserDontHavePrivilege(
              ["Product Catalogue:Delete"],
              currentUser
            )
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} catalogues?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        const tokenized = jwt.sign(row, TOKENIZE);
                        await deleteProductCatalogue({
                          variables: {
                            // uuid: row.uuid,
                            tokenized,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} catalogues deleted`,
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
        />
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(Catalogue);
