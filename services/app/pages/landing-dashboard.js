import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { withApollo } from "../libs/apollo";
import AdminArea from "../components/AdminArea";
import Head from "next/head";

import gql from "graphql-tag";
import { useMutation, useApolloClient, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { FormModal } from "../components/Modal";

const Dashboard = () => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Dashboard</title>
      </Head>
      <FormModal
        visible={router.query.appState === "Livestock" ? false : showModal}
        size="lg"
      >
        <div className="relative">
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowModal(false);
            }}
            className="absolute top-2 right-2 z-10 bg-red-500 rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors duration-200"
          >
            <i className="fa fa-times text-white text-lg"></i>
          </button>
          <img
            className="w-128 h-128 mx-auto pl-4"
            src="/doa/images/AIMS-Announcement.jpeg"
          />
        </div>
      </FormModal>
      <div className="mt-28 h-screen bg-[#F7FFF6]">
        <div className="h-1/6 flex justify-center">
          <img src="/doa/images/DoAA_Logo.png" />
        </div>
        <div className="h-auto px-6 flex justify-center">
          <img src="/doa/images/landing-dashboard.png" className="rounded-xl" />
        </div>

        <div className="flex justify-center mt-24">
          <p className="text-md">
            Helpdesk | Tel: +673 2388054 | Email:
            aims.helpdesk@agriculture.gov.bn
          </p>
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Dashboard);
