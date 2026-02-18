import React, { useState, useEffect } from "react";
import Head from "next/head";
import appConfig from "../app.json";
import { withApollo } from "../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../components/App";
import { handleError } from "../libs/errors";
import ms from "ms";
import redirect from "../libs/redirect";
import checkLoggedIn from "../libs/checkLoggedIn";
import cookie from "cookie";
import gql from "graphql-tag";
import firebaseConfig from "../firebaseConfig.json";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import Fingerprint2 from "fingerprintjs2";
import querystring from "query-string";
import { useMutation, useApolloClient, ApolloProvider } from "@apollo/client";
import localforage from "localforage";
import { useRouter } from "next/router";
import Link from "next/link";
import lodash from "lodash";

const CHECK_USER_PASSWORD = gql`
  mutation checkEmployeeIdAndPassword(
    $employeeId: String!
    $password: String!
  ) {
    checkEmployeeIdAndPassword(employeeId: $employeeId, password: $password)
  }
`;
const Page = (props) => {
  const router = useRouter();
  const client = useApolloClient();
  const [checkEmployeeIdAndPassword] = useMutation(CHECK_USER_PASSWORD);
  const notification = useNotification();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    showLoadingSpinner();
    try {
      const result = await checkEmployeeIdAndPassword({
        variables: {
          employeeId: username,
          password,
        },
      });
      if (result.data.checkEmployeeIdAndPassword) {
        notification.addNotification({
          title: "Succeess!",
          message: `Redirecting...`,
          level: "success",
        });

        setTimeout(
          () =>
            router.replace({
              pathname: "/login-by-employee-id",
              query: {
                employeeID: result.data.checkEmployeeIdAndPassword,
              },
            }),
          1500
        );
      }
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  return (
    <div>
      <Head>
        <title>Login | {appConfig.name}</title>
      </Head>
      <div className="flex w-full h-screen">
        <div className="hidden md:block w-3/5 bg-gray-100 h-full bg-center bg-cover">
          <div className="flex flex-col w-full h-full justify-center items-center align-middle">
            <div className="w-2/3 block">
              <img src="/doa/images/DoAA-Logo-3.png" className="pb-8" />
              <div className="text-2xl font-black py-4 text-green-500">
                Agriculture Information Management System (AIMS)
              </div>
              <div className="text-sm leading-6 font-light mt-4 text-center">
                Towards Increasing Production on Agriculture and Agrifood Based
                Industries through Increasing Productivity and High Technology
                Oriented For Export
              </div>
            </div>
          </div>
        </div>
        <div className="w-full md:w-2/5 bg-green-500 h-full">
          <div className="flex flex-col h-full justify-center items-center md:items-start">
            <form
              className="w-10/12 bg-white rounded-lg overflow-hidden shadow-lg px-8 py-12 md:-ml-6 border border-primary-400"
              onSubmit={handleSubmit}
            >
              <div className="text-center hidden md:block">
                <img
                  src="/doa/images/DoAA-Logo-3.png"
                  className="pt-8 w-2/3 inline"
                />
                <h3 className="text-xl font-black">AIMS</h3>
              </div>
              <div className="text-center block md:hidden">
                <img
                  src="/images/DoAA-Logo-3.png"
                  className="pt-8 w-2/3 inline"
                />
              </div>
              <div className="text-xl font-black text-center pb-10">
                <div className="block md:hidden text-sm leading-6 font-light">
                  Modern Agriculture Network Information System (MANIS)
                </div>
              </div>
              <div className="font-bold py-2">Administrator Login</div>
              <div className="form-group py-3">
                <input
                  required
                  className="py-3 bg-white form-control rounded-3xl"
                  placeholder="Employee ID"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    if (e) e.preventDefault;
                    setUsername(e.target.value);
                  }}
                />
              </div>
              <div className="form-group py-3">
                <input
                  required
                  className="py-3 bg-white form-control rounded-3xl"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    if (e) e.preventDefault;
                    setPassword(e.target.value);
                  }}
                />
              </div>
              <div className="form-group py-3 text-center">
                <button className="btn btn-primary" type="submit">
                  Login &nbsp; <i className="fa fa-arrow-right text-sm" />
                </button>
              </div>
              <p className="text-sm leading-6 font-light mt-4 text-center">
                Powered by <span className="text-slate-700">ST Advisory</span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withApollo({ ssr: true })(Page);

Page.getInitialProps = async (context) => {
  // console.log("Process ENV", process.env.NODE_ENV)
  const { loggedInUser } = await checkLoggedIn(context.apolloClient);
  let urlParams = "";
  if (loggedInUser.currentUser) {
    if (loggedInUser.currentUser.AccountSession) {
      if (loggedInUser.currentUser.AccountSession.urlParams) {
        urlParams = loggedInUser.currentUser.AccountSession.urlParams;
      }
    }

    if (process.env.NODE_ENV === "development") {
      redirect(context, `/dashboard?${urlParams}`);
    } else {
      redirect(context, `/dashboard?${urlParams}`);
    }
  } else if (typeof loggedInUser.currentUser === "undefined") {
    return { errorCode: 500 };
  }
  return {};
};
