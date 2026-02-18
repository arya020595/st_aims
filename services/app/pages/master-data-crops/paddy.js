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
import { DropDownMenu } from "../../components/DropDownMenu";
import PaddyVariety from "../../components/PaddyCrops/PaddyVariety";
import PaddySeedVariety from "../../components/PaddyCrops/PaddySeedVariety";
import PaddySeedlingVariety from "../../components/PaddyCrops/PaddySeedlingVariety";
import MilledRiceProductRice from "../../components/PaddyCrops/MilledRiceProductRice";
import ByProduct from "../../components/PaddyCrops/ByProduct";
import MilledRiceLocation from "../../components/PaddyCrops/MilledRiceLocation";

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
      Header: "Paddy ID",
      accessor: "paddyId",
    },
    {
      Header: "Paddy Category",
      accessor: "paddyCategory",
    },
    {
      Header: "Variety Name",
      accessor: "varietyName",
    },
    {
      Header: "Scheme Price/Kg",
      accessor: "schemePrice",
    },
    {
      Header: "Market Price/Kg",
      accessor: "marketPrice",
    },
  ]);

  return (
    <AdminArea header={{ title: "Paddy Variety" }} urlQuery={router.query}>
      {/* <FormModal
        title={`${!formData._id ? "New" : "Edit"} Paddy Variety`}
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
          <label>Paddy ID</label>
          <input
            className="form-control"
            value={formData.paddyId || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                paddyId: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Category</label>
          <input
            className="form-control"
            value={formData.category || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                category: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Variety Name</label>
          <input
            className="form-control"
            value={formData.varietyName || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                varietyName: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Scheme Price/Kg</label>
          <NumberFormat
            className="form-control"
            value={formData.schemePrice || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                schemePrice: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>New Scheme Price/Kg</label>
          <NumberFormat
            className="form-control"
            value={formData.mewSchemePrice || ""}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            onValueChange={(e) => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                mewSchemePrice: e.floatValue,
              });
            }}
          />
        </div>
      </FormModal> */}
      <div className="mt-28 pr-0 md:pr-10 pt-4 h-full">
        <DropDownMenu componentName={router.query.componentName}>
          <div
            className={`${
              router.query.componentName === "PaddyVariety"
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
                  componentName: "PaddyVariety",
                },
              });
            }}
          >
            <p className="text-sm font-semibold">Paddy Variety</p>
          </div>

          <div
            className={`${
              router.query.componentName === "PaddySeedVariety"
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
                  componentName: "PaddySeedVariety",
                },
              });
            }}
          >
            <p className="text-sm font-semibold">Paddy Seed Variety</p>
          </div>

          <div
            className={`${
              router.query.componentName === "PaddySeedlingVariety"
                ? "bg-mantis-200 text-black font-bold"
                : "bg-white text-black border border-gray-300"
            } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4 hidden`}
            onClick={(e) => {
              if (e) e.preventDefault();
              const { ...q } = router.query;
              router.replace({
                pathname: router.pathname,
                query: {
                  ...q,
                  componentName: "PaddySeedlingVariety",
                },
              });
            }}
          >
            <p className="text-sm font-semibold">Paddy Seedling Variety</p>
          </div>

          <div
            className={`${
              router.query.componentName === "MilledRiceProductRice"
                ? "bg-mantis-200 text-black font-bold"
                : "bg-white text-black border border-gray-300"
            } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4 hidden`}
            onClick={(e) => {
              if (e) e.preventDefault();
              const { ...q } = router.query;
              router.replace({
                pathname: router.pathname,
                query: {
                  ...q,
                  componentName: "MilledRiceProductRice",
                },
              });
            }}
          >
            <p className="text-sm font-semibold">Milled Rice Product Rice</p>
          </div>

          <div
            className={`${
              router.query.componentName === "ByProduct"
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
                  componentName: "ByProduct",
                },
              });
            }}
          >
            <p className="text-sm font-semibold">By-Product</p>
          </div>

          <div
            className={`${
              router.query.componentName === "MilledRiceLocation"
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
                  componentName: "MilledRiceLocation",
                },
              });
            }}
          >
            <p className="text-sm font-semibold">Milled Rice Location</p>
          </div>
        </DropDownMenu>
        {router.query.componentName === "PaddyVariety" ? (
          <PaddyVariety />
        ) : router.query.componentName === "PaddySeedVariety" ? (
          <PaddySeedVariety />
        ) : router.query.componentName === "PaddySeedlingVariety" ? (
          <PaddySeedlingVariety />
        ) : router.query.componentName === "MilledRiceProductRice" ? (
          <MilledRiceProductRice />
        ) : router.query.componentName === "ByProduct" ? (
          <ByProduct />
        ) : router.query.componentName === "MilledRiceLocation" ? (
          <MilledRiceLocation />
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
