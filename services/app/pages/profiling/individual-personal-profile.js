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
      Header: "Name",
      accessor: "name",
    },
    {
      Header: "Ic No.",
      accessor: "icNo",
    },
    {
      Header: "Contact Number",
      accessor: "contactNumber",
    },
    {
      Header: "Address",
      accessor: "address",
    },
    {
      Header: "Non-Compliance Details",
      accessor: "nonComplianceDetails",
    },
  ]);

  return (
    <AdminArea
      header={{ title: "individual / Personal Profile" }}
      urlQuery={router.query}
    >
      <FormModal
        title={`${
          !formData.uuid ? "New" : "Edit"
        } individual / Personal Profile`}
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
          <label>Name</label>
          <input
            className="form-control"
            value={formData.name || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                name: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>IC No.</label>
          <input
            className="form-control"
            value={formData.icNumber || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                icNumber: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Contact Number</label>
          <input
            className="form-control"
            value={formData.contactNumber || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                contactNumber: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Address</label>
          <input
            className="form-control"
            value={formData.address || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                address: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Non-Compliance Details</label>
          <input
            className="form-control"
            value={formData.nonComplianceDetails || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                nonComplianceDetails: e.target.value,
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
