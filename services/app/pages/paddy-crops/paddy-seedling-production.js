import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../../libs/apollo";
import { showLoadingSpinner, hideLoadingSpinner } from "../../components/App";
import { useNotification } from "../../components/Notification";
import { handleError } from "../../libs/errors";
import AdminArea from "../../components/AdminArea";
import { DropDownMenu } from "../../components/DropDownMenu";
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
import PaddySeedlingSalesPrice from "../../components/PaddySeedlingProductionCrops/PaddySeedlingSalesPrice";
import PaddySeedlingProduction from "../../components/PaddySeedlingProductionCrops/PaddySeedlingProduction";

const page = () => {
  const router = useRouter();

  return (
    <AdminArea urlQuery={router.query}>
      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <DropDownMenu componentName={router.query.componentName}>
            <div
              className={`${
                router.query.componentName === "PaddySeedlingSalesPrice"
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
                    componentName: "PaddySeedlingSalesPrice",
                  },
                });
              }}
            >
              <p className="text-lg font-semibold">
                Paddy Seedling Sales and Price
              </p>
            </div>

            <div
              className={`${
                router.query.componentName === "PaddySeedlingProduction"
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
                    componentName: "PaddySeedlingProduction",
                  },
                });
              }}
            >
              <p className="text-lg font-semibold">Paddy Seedling Production</p>
            </div>
          </DropDownMenu>
          {router.query.componentName === "PaddySeedlingSalesPrice" ? (
            <PaddySeedlingSalesPrice />
          ) : router.query.componentName === "PaddySeedlingProduction" ? (
            <PaddySeedlingProduction />
          ) : (
            <div />
          )}
        </div>
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(page);
