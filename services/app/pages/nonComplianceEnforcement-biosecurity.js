import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../libs/apollo";
import { useRouter } from "next/router";
import AdminArea, { useCurrentUser } from "../components/AdminArea";

import { DropDownMenu } from "../components/DropDownMenu";
import Header from "../components/Header";
import Commercial from "../components/NonComplianceEnforcement/Commercial";
import Personal from "../components/NonComplianceEnforcement/Personal";
import PersonalConcession from "../components/NonComplianceEnforcement/PersonalConcession";

const page = () => {
  const router = useRouter();

  return (
    <AdminArea urlQuery={router.query}>
      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <DropDownMenu componentName={router.query.componentName}>
            <div
              className={`${
                router.query.componentName === "Commercial"
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
                    componentName: "Commercial",
                  },
                });
              }}
            >
              <p className="text-lg font-semibold">Commercial</p>
            </div>

            <div
              className={`${
                router.query.componentName === "Personal"
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
                    componentName: "Personal",
                  },
                });
              }}
            >
              <p className="text-lg font-semibold">Personal</p>
            </div>

            <div
              className={`${
                router.query.componentName === "Personal Concession"
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
                    componentName: "Personal Concession",
                  },
                });
              }}
            >
              <p className="text-lg font-semibold">Personal Concession</p>
            </div>
          </DropDownMenu>
          {router.query.componentName === "Commercial" ? (
            <Commercial />
          ) : router.query.componentName === "Personal" ? (
            <Personal />
          ) : router.query.componentName === "Personal Concession" ? (
            <PersonalConcession />
          ) : (
            <div />
          )}
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(page);
