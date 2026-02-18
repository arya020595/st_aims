import React, { useEffect, useState } from "react";
import Head from "next/head";
import { withApollo } from "../libs/apollo";
import appConfig from "../app.json";
import cookie from "cookie";
import { useRouter } from "next/dist/client/router";
import ms from "ms";
import { gql, useMutation, useApolloClient } from "@apollo/client";
import { useNotification } from "../components/Notification";

const LOGIN = gql`
  mutation logInByEmployeeId($employeeId: String!) {
    logInByEmployeeId(employeeId: $employeeId) {
      _id
      User {
        _id
        employeeId
        Role {
          _id
          name
          privileges
        }
        # Organization {
        #   _id
        #   name
        # }
        status
      }
      token
      expiresIn
    }
  }
`;

const DashboardPage = (props) => {
  const router = useRouter();
  const notification = useNotification();
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState("");

  const apolloClient = useApolloClient();
  const [logInByEmployeeId] = useMutation(LOGIN);

  useEffect(() => {
    if (!router.query.employeeID) return;

    const logIn = async () => {
      setInternalLoading(true);
      try {
        const result = await logInByEmployeeId({
          variables: {
            employeeId: router.query.employeeID,
          },
        });

        const { token, expiresIn, User } = result.data.logInByEmployeeId;
        let maxAge = ms(expiresIn) / 1000;
        document.cookie = cookie.serialize("token", token, {
          maxAge,
          path: "/",
        });
        await apolloClient.cache.reset();
        notification.addNotification({
          title: "Please wait",
          message: "Redirecting you to Dashboard...",
          level: "success",
        });
        router.replace({
          pathname: "/dashboard",
          query: {
            sidebarMenu: "dashboard",
            appState: "Livestock",
          },
        });
      } catch (err) {
        setInternalLoading(false);
        notification.handleError(err);
        setError(err.message);
      }
    };
    logIn();
  }, [router.query.employeeID]);

  if (!router.query.employeeID) {
    return (
      <div className="container">
        <Head>
          <title>Error | {appConfig.name}</title>
        </Head>

        <div className="mb-16">
          <div className="block w-full py-24 text-center text-orange-600">
            <i className="fa fa-info-circle" style={{ fontSize: "200%" }} />
            <h3 className="text-lg mt-4">Invalid Employee ID Parameter!</h3>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <Head>
          <title>Error | {appConfig.name}</title>
        </Head>

        <div className="mb-16">
          <div className="block w-full py-24 text-center text-red-600">
            <i className="fa fa-info-circle" style={{ fontSize: "200%" }} />
            <h3 className="text-lg mt-4">{error}</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Head>
        <title>{appConfig.name}</title>
      </Head>

      <div className="mb-16">
        <div className="block w-full py-24 text-center text-primary-600">
          <i className="fa fa-info-circle" style={{ fontSize: "200%" }} />
          <h3 className="text-lg mt-4">Please Wait...</h3>
        </div>
      </div>
    </div>
  );
};

export default withApollo({ ssr: false })(DashboardPage);
