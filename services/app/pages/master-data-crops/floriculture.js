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
import { DropDownMenu } from "../../components/DropDownMenu";
import CutFlower from "../../components/FloricultureCrops/CutFlower";
import OrnamentalPlant from "../../components/FloricultureCrops/OrnamentalPlant";
import SellingLocation from "../../components/FloricultureCrops/SellingLocation";

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
      Header: "Cut Flower ID",
      accessor: "cutFlowerId",
    },
    {
      Header: "Malay Name",
      accessor: "malayName",
    },
    {
      Header: "English Name",
      accessor: "englishName",
    },
  ]);

  return (
    <AdminArea header={{ title: "Cut Flower" }} urlQuery={router.query}>
      {/* <FormModal
        title={`${!formData._id ? "New" : "Edit"} Cut Flower`}
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
          <label>Cut Flower ID</label>
          <input
            className="form-control"
            value={formData.cutFlowerId || ""}
            onChange={(e) => {
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
            value={formData.malayName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                malayName: e.target.value,
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
              setFormData({
                ...formData,
                englishName: e.target.value,
              });
            }}
          />
        </div>
      </FormModal> */}
      <div className="mt-28 pr-0 md:pr-10 pt-4 h-full">
        <DropDownMenu componentName={router.query.componentName}>
          <div
            className={`${
              router.query.componentName === "CutFlower"
                ? "bg-mantis-200 text-black font-bold"
                : "bg-white text-black border border-gray-300"
            } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
            onClick={(e) => {
              if (e) e.preventDefault();
              const { ...q } = router.query;
              router.replace({
                pathname: router.pathname,
                query: {
                  ...q,
                  componentName: "CutFlower",
                },
              });
            }}
          >
            <p className="text-base font-semibold">Cut Flower</p>
          </div>

          <div
            className={`${
              router.query.componentName === "OrnamentalPlant"
                ? "bg-mantis-200 text-black font-bold"
                : "bg-white text-black border border-gray-300"
            } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
            onClick={(e) => {
              if (e) e.preventDefault();
              const { ...q } = router.query;
              router.replace({
                pathname: router.pathname,
                query: {
                  ...q,
                  componentName: "OrnamentalPlant",
                },
              });
            }}
          >
            <p className="text-base font-semibold">Ornamental Plant</p>
          </div>

          <div
            className={`${
              router.query.componentName === "Selling Location"
                ? "bg-mantis-200 text-black font-bold"
                : "bg-white text-black border border-gray-300"
            } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
            onClick={(e) => {
              if (e) e.preventDefault();
              const { ...q } = router.query;
              router.replace({
                pathname: router.pathname,
                query: {
                  ...q,
                  componentName: "Selling Location",
                },
              });
            }}
          >
            <p className="text-base font-semibold">Selling Location</p>
          </div>
        </DropDownMenu>
        {router.query.componentName === "CutFlower" ? (
          <CutFlower />
        ) : router.query.componentName === "OrnamentalPlant" ? (
          <OrnamentalPlant />
        ) : router.query.componentName === "Selling Location" ? (
          <SellingLocation />
        ) : (
          <div />
        )}
        {/* <Table
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
        /> */}
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(page);
