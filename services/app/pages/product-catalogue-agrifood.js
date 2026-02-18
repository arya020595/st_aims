import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../libs/apollo";
import { useRouter } from "next/router";
import AdminArea, { useCurrentUser } from "../components/AdminArea";
import Catalogue from "../components/ProductCatalogue/Catalogue";
import CatalogueDetails from "../components/ProductCatalogue/CatalogueDetails";

import { DropDownMenu } from "../components/DropDownMenu";

const ProductCatalogue = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  return (
    <AdminArea urlQuery={router.query}>
      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <DropDownMenu componentName={router.query.componentName}>
            <div
              className={`${
                router.query.componentName === "Catalogue"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
              } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
              onClick={(e) => {
                if (e) e.preventDefault();

                const {
                  componentName,
                  companyRegNo,
                  companyUUID,
                  productCatalogueUUID,
                  productCategory,
                  productCategoryUUID,
                  ...q
                } = router.query;
                router.replace({
                  pathname: router.pathname,
                  query: {
                    ...q,
                    componentName: "Catalogue",
                  },
                });
              }}
            >
              <p className="text-lg font-semibold">Catalogue</p>
            </div>

            <div
              className={`${
                router.query.componentName === "Catalogue Details"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
              } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
              // onClick={(e) => {
              //   if (e) e.preventDefault();
              //   router.replace({
              //     pathname: router.pathname,
              //     query: {
              //       ...router.query,
              //       componentName: "Catalogue Details",
              //     },
              //   });
              // }}
            >
              <p className="text-lg font-semibold">Catalogue Details</p>
            </div>
          </DropDownMenu>
          {router.query.componentName === "Catalogue" ? (
            <Catalogue
              currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              currentUser={currentUser}
            />
          ) : router.query.componentName === "Catalogue Details" ? (
            <CatalogueDetails
              currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              currentUser={currentUser}
            />
          ) : (
            <div />
          )}
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(ProductCatalogue);
