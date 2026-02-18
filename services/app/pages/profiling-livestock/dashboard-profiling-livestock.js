import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { withApollo } from "../../libs/apollo";
import AdminArea from "../../components/AdminArea";
import Head from "next/head";

const profilingLivestock = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace({
      pathname: "/profiling-livestock/dashboard-profiling-livestock",
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
          title="DoAA_ProfilingDashboards"
          width="100%"
          height="100%"
          src="https://app.powerbi.com/view?r=eyJrIjoiYmJhMzljZTEtN2NkZS00N2VhLTgxMDktYmM3ZGJiMzY0YjQ2IiwidCI6IjljN2ZiNmU3LTM0YzUtNGMyZS1hYTVjLWJhZjAyY2E2MzcxMSIsImMiOjEwfQ%3D%3D"
          frameborder="0"
          allowFullScreen="true"
        ></iframe>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(profilingLivestock);
