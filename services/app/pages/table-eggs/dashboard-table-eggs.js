import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { withApollo } from "../../libs/apollo";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Head from "next/head";

const Dashboard = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  useEffect(() => {
    router.replace({
      pathname: "/table-eggs/dashboard-table-eggs",
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
      <div className="mt-28 h-screen bg-[#F7FFF6]">
        {!currentUserDontHavePrivilege(["Dashboard Table Eggs:Read"]) ? (
          <iframe
            title="DoAA_TableEggsDashboards"
            width="100%"
            height="100%"
            src="https://app.powerbi.com/view?r=eyJrIjoiYWNhNWNmNzgtN2ZkZi00ZmRiLWJmYTktYzgyYmQyOGJjODBmIiwidCI6IjljN2ZiNmU3LTM0YzUtNGMyZS1hYTVjLWJhZjAyY2E2MzcxMSIsImMiOjEwfQ%3D%3D"
            frameborder="0"
            allowFullScreen="true"
          ></iframe>
        ) : (
          <div>
            <div className="h-1/6 flex justify-center">
              <img src="/doa/images/DoAA_Logo.png" />
            </div>
            <div className="h-auto px-6 flex justify-center">
              <img
                src="/doa/images/landing-dashboard.png"
                className="rounded-xl"
              />
            </div>

            <div className="flex justify-center mt-24">
              <p className="text-md">
                Helpdesk | Tel: +673 2388054 | Email:
                aims.helpdesk@agriculture.gov.bn
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Dashboard);
