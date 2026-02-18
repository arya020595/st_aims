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
      Header: "Company Status",
      accessor: "companyStatus",
    },
    {
      Header: "Company ID",
      accessor: "companyId",
    },
    {
      Header: "Company Registration No",
      accessor: "companyRegistrationNo",
    },
    {
      Header: "Company Name",
      accessor: "companyName",
    },
    {
      Header: "Company's Owner Name",
      accessor: "companyOwnerName",
    },
    {
      Header: "IC No.",
      accessor: "icNo",
    },
    {
      Header: "Contact Details",
      accessor: "contactDetails",
    },
    {
      Header: "Company Address",
      accessor: "companyAddress",
    },
    {
      Header: "Approved Categories Of Commodities",
      accessor: "approvedCategoriesOfCommodities",
    },

    {
      Header: "Upload File",
      accessor: "uploadFile",
    },
  ]);

  return (
    <AdminArea header={{ title: "Company Profile" }} urlQuery={router.query}>
      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Company profile`}
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
        <label>Company Status</label>
        <div className="grid grid-cols-2">
          <div className="form-group flex items-center">
            <input type="checkbox" value="" className="mx-2" />
            <label>Active</label>
          </div>
          <div className="form-group flex items-center">
            <input type="checkbox" value="" className="mx-2" />
            <label>Inactive</label>
          </div>
        </div>

        <div className="form-group">
          <label>Company ID</label>
          <input
            disabled
            placeholder="Auto Generate"
            className="form-control"
            value={formData.companyId || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                companyId: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Company Registration No.</label>
          <input
            className="form-control"
            value={formData.companyRegistrationNo || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                companyRegistrationNo: e.target.value,
              });
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-5">
          <div className="form-group">
            <label>Company Registration No. (Crop)</label>
            <input
              className="form-control"
              value={formData.companyRegistrationNoCrop || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  companyRegistrationNoCrop: e.target.value,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Company Registration No. (Animal)</label>
            <input
              className="form-control"
              value={formData.companyRegistrationNoAnimal || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  companyRegistrationNoAnimal: e.target.value,
                });
              }}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Registered Date</label>
          <input
            type="date"
            className="form-control"
            value={formData.registeredDate || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                registeredDate: e.target.value,
              });
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-5">
          <div className="form-group">
            <label>Registered Date (Crop)</label>
            <input
              type="date"
              className="form-control"
              value={formData.registeredDateCrop || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  registeredDateCrop: e.target.value,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Registered Date (Animal)</label>
            <input
              type="date"
              className="form-control"
              value={formData.registeredDateAnimal || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  registeredDateAnimal: e.target.value,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Renewal Date (Crop)</label>
            <input
              type="date"
              className="form-control"
              value={formData.renewalDateCrop || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  renewalDateCrop: e.target.value,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Renewal Date (Animal)</label>
            <input
              type="date"
              className="form-control"
              value={formData.renewalDateAnimal || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  renewalDateAnimal: e.target.value,
                });
              }}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Company Name</label>
          <input
            className="form-control"
            value={formData.companyName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                companyName: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Company's Owner Name</label>
          <input
            className="form-control"
            value={formData.companyOwnerName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                companyOwnerName: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>IC No.</label>
          <input
            className="form-control"
            value={formData.IcNo || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                IcNo: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Contact Details</label>
          <input
            className="form-control"
            value={formData.contactDetails || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                contactDetails: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Company Address</label>
          <input
            className="form-control"
            value={formData.companyAddress || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                companyAddress: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>
            Field / Premises / Factory Address (for more than 1 address, use "/"
            between the address)
          </label>
          <textarea
            className="form-control w-100 h-48"
            value={formData.fieldPremisesFactoryAddress || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                fieldPremisesFactoryAddress: e.target.value,
              });
            }}
          />
        </div>
        <label>Approved Categories Of Commodities</label>
        <div className="grid grid-cols-4 mb-5">
          <div className="form-group flex items-center">
            <input type="checkbox" value="" className="mx-2" />
            <label>Commodity A</label>
          </div>
          <div className="form-group flex items-center">
            <input type="checkbox" value="" className="mx-2" />
            <label>Commodity B</label>
          </div>
          <div className="form-group flex items-center">
            <input type="checkbox" value="" className="mx-2" />
            <label>Commodity C</label>
          </div>
          <div className="form-group flex items-center">
            <input type="checkbox" value="" className="mx-2" />
            <label>Commodity D</label>
          </div>
        </div>
        <div className="form-group">
          <label>Approved Suppliers / Exporters</label>
          <textarea
            className="form-control w-100 h-48"
            value={formData.approvedSupppilersExporters || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                approvedSupppilersExporters: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Approved Suppliers / Exporters Address</label>
          <textarea
            className="form-control w-100 h-48"
            value={formData.approvedSupppilersExportersAdress || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                approvedSupppilersExportersAdress: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Non-Compilance Details</label>
          <input
            disabled
            placeholder="Auto Filled"
            className="form-control"
            value={formData.nonCompilancceDetails || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                nonCompilancceDetails: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Upload File</label>
          <input
            type="file"
            className="form-control"
            value={formData.uploadFile || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                uploadFile: e.target.value,
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
