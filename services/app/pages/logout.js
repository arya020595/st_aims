import React, { useEffect } from "react";
import Head from "next/head";
import { withApollo } from "../libs/apollo";
import appConfig from "../app.json";
import cookie from "cookie";
import gql from "graphql-tag";
import { useMutation, useApolloClient, ApolloProvider } from "@apollo/client";

const LOGOUT = gql`
  mutation logOut {
    logOut
  }
`;

const DashboardPage = (props) => {
  const [logOut] = useMutation(LOGOUT);

  useEffect(async () => {
    setTimeout(async () => {
      await logOut({});
      document.cookie = cookie.serialize("token", "", {
        maxAge: -1, // Expire the cookie immediately
        path: "/",
      });
      window.location = "/doa/login";
      window.localStorage.clear();
    }, 1800);
  }, []);

  return (
    <div className="container">
      <Head>
        <title>Logout | {appConfig.name}</title>
      </Head>

      <div className="mb-16">
        <div className="block w-full py-24 text-center text-primary-600">
          <i className="fa fa-info-circle" style={{ fontSize: "200%" }} />
          <h3 className="text-lg mt-4">Successfully Logout!</h3>
        </div>
      </div>
    </div>
  );
};

export default withApollo({ ssr: false })(DashboardPage);
