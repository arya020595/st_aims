import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { withApollo } from "../../libs/apollo";
import AdminArea from "../../components/AdminArea";
import Head from "next/head";

import gql from "graphql-tag";
import { useMutation, useApolloClient, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { FormModal } from "../../components/Modal";

const cropsDashboard = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace({
      pathname: "/paddy-crops/dashboard-paddy-crops",
      query: {
        ...router.query,
        // studentId: router.query?.studentId || allStudents[0]?._id || "",
      },
    });
  }, []);
  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Dashboard</title>
      </Head>
      <div className="mt-28 h-screen flex justify-center">
        <iframe
          title="Report Section"
          width="100%"
          height="100%"
          src="https://app.powerbi.com/view?r=eyJrIjoiYWMwYTFmN2UtMGI5Yy00NzU2LWJmNjItZGZmMzA4MGYyNmJiIiwidCI6IjljN2ZiNmU3LTM0YzUtNGMyZS1hYTVjLWJhZjAyY2E2MzcxMSIsImMiOjEwfQ%3D%3D"
          frameborder="0"
          allowFullScreen="true"
        ></iframe>
        {/* <iframe
          title="LKM Dashboard"
          width="100%"
          height="100%"
          src="https://app.powerbi.com/view?r=eyJrIjoiMjAyNDA2NDctMDA2ZC00YWU5LTllYjktZTRjZmUyM2FiNDNiIiwidCI6IjNiNmFjMTJhLTgwMDAtNGYwZS1iYmMyLWYwNzhiNTY0NGFlNiIsImMiOjEwfQ%3D%3D&pageName=ReportSection"
          frameborder="0"
          allowFullScreen="true"
        /> */}
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(cropsDashboard);
