import appConfig from "../app.json";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import { gql, useQuery } from "@apollo/client";
import { withApollo } from "../libs/apollo";
import { useRouter } from "next/router";

const Page = () => {
  const Router = useRouter();
  useEffect(() => {
    Router.replace("/login");
  });

  return (
    <>
      <Head>
        <title>Welcome | {appConfig.name}</title>
      </Head>
    </>
  );
};

export default withApollo({ ssr: true })(Page);
