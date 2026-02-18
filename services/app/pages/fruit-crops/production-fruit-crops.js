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
import { v4 as uuidv4 } from "uuid";
import NumberFormat from "react-number-format";
import { DropDownMenu } from "../../components/DropDownMenu";
import ActualProduction from "../../components/FruitCrops/TempActual";
import EstimateProduction from "../../components/FruitCrops/EstimateProduction";

const page = () => {
  const router = useRouter();

  return (
    <AdminArea urlQuery={router.query}>
      <div className="mt-26">
        <div className="pr-0 py-4 bg-white h-full">
          <DropDownMenu componentName={router.query.componentName}>
            <div
              className={`${
                router.query.componentName === "ActualProduction"
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
                    componentName: "ActualProduction",
                  },
                });
              }}
            >
              <p className="text-lg font-semibold">Actual Production</p>
            </div>

            <div
              className={`${
                router.query.componentName === "EstimateProduction"
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
                    componentName: "EstimateProduction",
                  },
                });
              }}
            >
              <p className="text-lg font-semibold">Estimate Production</p>
            </div>
          </DropDownMenu>
          {router.query.componentName === "ActualProduction" ? (
            <ActualProduction />
          ) : router.query.componentName === "EstimateProduction" ? (
            <EstimateProduction />
          ) : (
            <div />
          )}
        </div>
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(page);
