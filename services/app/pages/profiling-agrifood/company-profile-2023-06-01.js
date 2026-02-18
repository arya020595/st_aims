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
      Header: "Company Name",
      accessor: "companyName",
    },
    {
      Header: "File Number",
      accessor: "fileNumber",
    },
    {
      Header: "Type Of Company Registration",
      accessor: "typeOfCompanyRegistration",
    },
    {
      Header: "Company Registration No",
      accessor: "companyRegistrationNo",
    },
    {
      Header: "Company Address",
      accessor: "companyAddress",
    },
    {
      Header: "Premise ID",
      accessor: "premiseId",
    },
    {
      Header: "Company Status",
      accessor: "farmCategory",
    },
    {
      Header: "Type Of Machinery",
      accessor: "typeOfMacinery",
    },
    {
      Header: "Current Status",
      accessor: "currentStatus",
    },
  ]);

  return (
    <AdminArea header={{ title: "Company Profile" }} urlQuery={router.query}>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Company profile`}
        size="md"
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
          <label>Company Name*</label>
          <input
            required
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
          <label>File Number</label>
          <input
            placeholder="Auto Generate"
            disabled
            className="form-control"
            value={formData.fileNumber || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                fileNumber: e.target.value,
              });
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-5">
          <div>
            <div className="form-group">
              <label>Types Of Registration</label>
              <select
                className="form-control"
                value={formData.typesOfRegistration || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    typesOfRegistration: e.target.value,
                  });
                }}
              >
                <option value="" disabled>
                  Select Types Of Company Registration
                </option>
                <option value="1">1</option>
              </select>
            </div>
            <div className="form-group">
              <label>Company Registration Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.companyRegistrattionDate || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    companyRegistrattionDate: e.target.value,
                  });
                }}
              />
            </div>
          </div>
          <div>
            {" "}
            <div className="form-group">
              <label>Company Registration Number</label>
              <input
                className="form-control"
                value={formData.companyRegistrattionNumber || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    companyRegistrattionNumber: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>ROCBN Registration NO.</label>
              <input
                className="form-control"
                value={formData.rocbnRegistratonNo || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    rocbnRegistratonNo: e.target.value,
                  });
                }}
              />
            </div>
          </div>
        </div>
        <div className="form-group">
          <label>Company Address*</label>
          <input
            required
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
          <label>Mailing Address</label>
          <input
            className="form-control"
            value={formData.mailingAddress || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                mailingAddress: e.target.value,
              });
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-5">
          <div className="form-group">
            <label>Premise Structure</label>
            <input
              className="form-control"
              value={formData.premiseStructure || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  premiseStructure: e.target.value,
                });
              }}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Social Media Account</label>
          <input
            className="form-control"
            value={formData.socialMediaAccount || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                socialMediaAccount: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>SME Category</label>
          <input
            disabled
            placeholder="Auto Filled"
            className="form-control"
            value={formData.smeCategory || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                smeCategory: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Manager Name</label>
          <input
            className="form-control"
            value={formData.managerName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                managerName: e.target.value,
              });
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-5">
          <div>
            <div className="form-group">
              <label>Position</label>
              <select
                className="form-control"
                value={formData.posititon || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    posititon: e.target.value,
                  });
                }}
              >
                <option value="" disabled>
                  Select Position
                </option>
                <option value="1">1</option>
              </select>
            </div>
            <div className="form-group">
              <label>IC No./Pasport No</label>
              <input
                className="form-control"
                value={formData.pasportNo || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    pasportNo: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Mobile No.</label>
              <input
                className="form-control"
                value={formData.mobileNo || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    mobileNo: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Race</label>
              <input
                className="form-control"
                value={formData.race || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    race: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                className="form-control"
                value={formData.emailAddress || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    emailAddress: e.target.value,
                  });
                }}
              />
            </div>
          </div>
          <div>
            <div className="form-group">
              <label>Date Of Birth</label>
              <input
                type="date"
                className="form-control"
                value={formData.dateOfBirth || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    dateOfBirth: e.target.value,
                  });
                }}
              />
            </div>
            <div>
              <div className="form-group">
                <label>IC Colour</label>
                <select
                  className="form-control"
                  value={formData.icColour || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      icColour: e.target.value,
                    });
                  }}
                >
                  <option value="" disabled>
                    Select Colour
                  </option>
                  <option value="1">1</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Telephone No</label>
              <input
                className="form-control"
                value={formData.telephoneNo || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    telephoneNo: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <input
                className="form-control"
                value={formData.gender || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    gender: e.target.value,
                  });
                }}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2"></div>
        <div className="form-group">
          <label>Director/Shareholders/Board Member/Official Member</label>
          <textarea
            className="form-control w-100 h-48"
            value={formData.member || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                member: e.target.value,
              });
            }}
          />
        </div>
        <div className="grid grid-cols-2">
          <div className="form-group">
            <label>Company Status</label>
            <select
              className="form-control"
              value={formData.companyStatus || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  companyStatus: e.target.value,
                });
              }}
            >
              <option value="" disabled>
                Select Company Status
              </option>
              <option vlalue="1">1</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-8 ">
          <div className="col-span-3 flex items-center">
            <div className="form-group">
              <label>No. of labours(local)</label>
            </div>
          </div>

          <div className="form-group">
            <NumberFormat
              className="form-control"
              placeholder="0"
              value={formData.noOfLaboursLocal || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  noOfLaboursLocal: e.floatValue,
                });
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-8 ">
          <div className="form-group flex items-center ">
            <label>Unskilled</label>
          </div>
          <div className="form-group">
            <NumberFormat
              className="form-control"
              placeholder="0"
              value={formData.unskilled || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  unskilled: e.floatValue,
                });
              }}
            />
          </div>
          <div className="form-group flex items-center ml-2 px-2">
            <label>Semi Skilled</label>
          </div>
          <div className="form-group">
            <NumberFormat
              className="form-control"
              placeholder="0"
              value={formData.semiSkilled || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  semiSkilled: e.floatValue,
                });
              }}
            />
          </div>
          <div className="form-group flex items-center ml-4 px-2">
            <label>Skilled</label>
          </div>
          <div className="form-group">
            <NumberFormat
              className="form-control"
              placeholder="0"
              value={formData.skilled || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  skilled: e.floatValue,
                });
              }}
            />
          </div>
          <div className="form-group flex items-center ml-4 px-2">
            <label>Expert</label>
          </div>
          <div className="form-group">
            <NumberFormat
              className="form-control"
              placeholder="0"
              value={formData.expert || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  expert: e.floatValue,
                });
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-8">
          <div className="col-span-3 flex items-center">
            <div className="form-group">
              <label>No. of labours(Foreigners)</label>
            </div>
          </div>

          <div className="form-group">
            <NumberFormat
              className="form-control"
              placeholder="0"
              value={formData.noOfLaboursForeigners || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  noOfLaboursForeigners: e.floatValue,
                });
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-8">
          <div className="form-group flex items-center">
            <label>Unskilled</label>
          </div>
          <div className="form-group">
            <NumberFormat
              className="form-control"
              placeholder="0"
              value={formData.unskilledForigners || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  unskilledForigners: e.floatValue,
                });
              }}
            />
          </div>
          <div className="form-group flex items-center ml-2 px-2">
            <label>Semi Skilled</label>
          </div>
          <div className="form-group">
            <NumberFormat
              className="form-control"
              placeholder="0"
              value={formData.semiskilledForigners || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  semiskilledForigners: e.floatValue,
                });
              }}
            />
          </div>
          <div className="form-group flex items-center ml-4 px-2">
            <label>Skilled</label>
          </div>
          <div className="form-group">
            <NumberFormat
              className="form-control"
              placeholder="0"
              value={formData.skilledForeigners || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  skilledForeigners: e.floatValue,
                });
              }}
            />
          </div>
          <div className="form-group flex items-center ml-4 px-2">
            <label>Expert</label>
          </div>
          <div className="form-group">
            <NumberFormat
              className="form-control"
              placeholder="0"
              value={formData.expertForigners || ""}
              thousandSeparator={","}
              decimalSeparator={"."}
              fixedDecimalScale={true}
              onValueChange={(e) => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  expertForigners: e.floatValue,
                });
              }}
            />
          </div>
        </div>
        <label>Type Of Machinery:</label>
        <div className="grid grid-cols-4 gap-x-2">
          <div className="form-group flex items-center">
            <input type="checkbox" className="mx-4 h-6" />
            <label>Machinery 1</label>
          </div>
          <div className="form-group flex items-center">
            <input type="checkbox" className="mx-4 h-6" />
            <label>Machinery 2</label>
          </div>
          <div className="form-group flex items-center">
            <input type="checkbox" className="mx-4 h-6" />
            <label>Machinery 3</label>
          </div>
          <div className="form-group flex items-center">
            <input type="checkbox" className="mx-4 h-6" />
            <label>Machinery 4</label>
          </div>
        </div>
        <div className="form-group">
          <label>Support/Programme/Training</label>
          <input
            className="form-control"
            value={formData.supportProgrammeTraining || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                supportProgrammeTraining: e.target.value,
              });
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-5">
          <div className="form-group">
            <label>Current Status</label>
            <select
              className="form-control"
              value={formData.currentStatus || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  currentStatus: e.target.value,
                });
              }}
            >
              <option vlalue="" disabel>
                Select Current Status
              </option>
              <option value="1">1</option>
            </select>
          </div>
          <div className="form-group">
            <label>Upload File</label>
            <input className="form-control" type="file" />
          </div>
        </div>
        <div className="form-group">
          <label>Remarks</label>
          <textarea
            className="form-control w-100 h-24"
            value={formData.remarks || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                remarks: e.target.value,
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
