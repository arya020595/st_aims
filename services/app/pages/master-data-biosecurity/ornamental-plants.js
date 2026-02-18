import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../../components/App";
import { useNotification } from "../../components/Notification";
import { handleError } from "../../libs/errors";
import AdminArea from "../../components/AdminArea";
import Table from "../../components/Table";
import { useQuery, useLazyQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { FormModal } from "../../components/Modal";
import { useRouter } from "next/router";
import { create, filter } from "lodash";
import { from } from "apollo-link";
import { configure } from "nprogress";
import Head from "next/dist/next-server/lib/head";
import { Leaf } from "slate";
import NumberFormat from "react-number-format";

const page = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const notification = useNotification();

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
      Header: "Product Code",
      accessor: "productCode",
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Category",
      accessor: "category",
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "English Name",
      accessor: "englishName",
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Local Name",
      accessor: "localName",
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
    {
      Header: "Unit",
      accessor: "unit",
      Cell: (props) => <span>{props.value?.toUpperCase() || ""}</span>,
    },
  ]);

  return (
    <AdminArea header={{ title: "Ornamental Plants" }} urlQuery={router.query}>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Ornamental Plants`}
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
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Product Code</label>
          <input
            disabled
            placeholder="Auto Generate"
            className="form-control"
            value={formData.productCode || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                productCode: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Category</label>
          <select
            className="form-control"
            value={formData.category || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                category: e.target.value,
              });
            }}
          >
            <option value="" disabled>
              Select Category
            </option>
            <option value="1">TEST</option>
          </select>
        </div>
        <div className="form-group">
          <label>English Name</label>
          <input
            className="form-control"
            value={formData.englishName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                englishName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Local Name</label>
          <input
            className="form-control"
            value={formData.localName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                localName: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Unit</label>
          <input
            className="form-control"
            value={formData.unit || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                unit: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
      </FormModal>
      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          loading={false}
          columns={columns}
          data={[]}
          withoutHeader={true}
          customUtilities={customUtilities}
          onAdd={() => {
            setFormData({});
            setModalVisible(true);
          }}
          onRemove={async ({ rows }) => {
            showLoadingSpinner();
            try {
            } catch (err) {
              handleError(er);
            }
            hideLoadingSpinner();
            refetch();
          }}
        />
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(page);
