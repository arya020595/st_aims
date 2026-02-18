import Head from "next/head";
import appConfig from "../app.json";
import { useQuery, useMutation, gql, useApolloClient } from "@apollo/client";
import { useRouter } from "next/router";
import { showLoadingSpinner, hideLoadingSpinner, useNotification } from "./App";
import { useEffect, useMemo, useState } from "react";
import { FormModal } from "./Modal";
import Table from "./Table";
import { useCurrentUser } from "./AdminArea";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
import dayjs from "dayjs";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;
const QUERY = gql`
  query currentUser {
    currentUser {
      _id
      employeeId

      controlPost
      district
      Role {
        _id
        name
      }
    }

    allNotifications {
      date
      message
      module
    }
  }
`;

const GET_NOTIFICATION = gql`
  query allNotifications {
    # allNotifications {
    #   date
    #   message
    #   module
    #   controlPost
    #   type
    # }
    tokenizeAllNotification
  }
`;

const LOGOUT = gql`
  mutation logOut {
    logOut
  }
`;

const SERVER_STATS = gql`
  query serverStats {
    serverStats
  }
`;

const USER_LOGIN_TIME = gql`
  query checkUserLoginTime {
    checkUserLoginTime
  }
`;

const Header = ({ onClickOpenSidebar }) => {
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const router = useRouter();
  const client = useApolloClient();
  const notification = useNotification();
  const q = router.query;

  const [allNotifications, setAllNotification] = useState([]);
  const [serverStatsData, setServerStats] = useState({});
  const [showServerStats, setShowServerStats] = useState(false);
  const [showListButton, setShowListButton] = useState(false);

  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {},
  });

  const currentUser = data?.currentUser || {};

  useEffect(() => {
    const interval = setInterval(async () => {
      // console.log("Intervalling...")
      const found = await client.query({
        query: GET_NOTIFICATION,
        variables: {},
        fetchPolicy: "no-cache",
      });

      const encrypted = found?.data.tokenizeAllNotification || "";
      let allNotifications = [];
      if (encrypted) {
        const decrypted = jwt.verify(encrypted, TOKENIZE);
        allNotifications = decrypted?.lists;
      }
      const serverStats = await client.query({
        query: SERVER_STATS,
        variables: {},
        fetchPolicy: "no-cache",
      });

      const loginTime = await client.query({
        query: USER_LOGIN_TIME,
        variables: {},
        fetchPolicy: "no-cache",
      });

      const currentLoginTime = loginTime.data.checkUserLoginTime;
      if (currentLoginTime !== "no expired") {
        const runningTime = dayjs();

        // console.log({
        //   currentLoginTime,
        //   running: dayjs(runningTime).format("HH:mm"),
        // });
        const diff = runningTime.diff(currentLoginTime, "minute");
        // console.log({ diff });
        if (diff >= 60) {
          window.location.href = "/doa/logout";
        }
      }

      setServerStats(serverStats.data.serverStats);
      setAllNotification(allNotifications);
    }, 2000);

    // Cleanup function to stop the interval when the component is unmounted
    return () => {
      clearInterval(interval);
    };
  }, []); // Empty dependency array ensures the effect runs only once

  let showNotification = true;
  if (
    currentUser &&
    currentUser.Role &&
    currentUser.Role._id !== "__SUPER_USER__" &&
    !currentUser.controlPost
  ) {
    showNotification = false;
  } else {
    showNotification = true;
  }

  const columns = useMemo(() => [
    {
      Header: "Date",
      accessor: "date",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Message",
      accessor: "message",
      style: {
        fontSize: 20,
      },
      Cell: (props) => (
        <a onClick={openPage(props.row.original)}>{props.value}</a>
      ),
    },
    {
      Header: "Control Post",
      accessor: "controlPost",
      style: {
        fontSize: 20,
      },
    },
  ]);

  const openPage = (data) => (e) => {
    setShowNotificationModal(false);
    let type = "";
    if (data.type === "Commercial") {
      type = "Commercial";
    } else if (data.type === "Personal") {
      type = "Personal";
    } else if (data.type === "Personal Concession") {
      type = "Personal Concession";
    }
    router.replace({
      pathname: "/nonComplianceEnforcement-biosecurity",
      query: {
        sidebarMenu: "nonComplianceEnforcement-biosecurity",
        appState: "Bio Security",
        componentName: type,
      },
    });
  };

  const [showNotificationModal, setShowNotificationModal] = useState(false);

  let parentMenu = "";
  let parentIcon = "";
  let subMenu = q?.sidebarSubMenuName || "";

  if (q.reportPage) {
    subMenu = q.reportPage;
  }

  if (q.sidebarMenu === "dashboard") {
    parentMenu = "";
    parentIcon = "";
  } else if (q.sidebarMenu === "master-data-livestock") {
    parentMenu = "Master Data";
    parentIcon = "/doa/images/master-data.svg";
  } else if (q.sidebarMenu === "profiling-livestock") {
    parentMenu = "Profiling";
    parentIcon = "/doa/images/profiling.svg";
  } else if (q.sidebarMenu === "ruminant") {
    parentMenu = "Ruminant";
    parentIcon = "/doa/images/ruminant.svg";
  } else if (q.sidebarMenu === "broiler") {
    parentMenu = "Broiler";
    parentIcon = "/doa/images/broiler.svg";
  } else if (q.sidebarMenu === "day-old-chick") {
    parentMenu = "Day Old Chick";
    parentIcon = "/doa/images/chick.svg";
  } else if (q.sidebarMenu === "table-eggs") {
    parentMenu = "Table Eggs";
    parentIcon = "/doa/images/table-eggs.svg";
  } else if (q.sidebarMenu === "fertilized-eggs") {
    parentMenu = "Fertilized Eggs";
    parentIcon = "/doa/images/fertilized-egg.svg";
  } else if (q.sidebarMenu === "miscellaneous-livestock") {
    parentMenu = "Miscellaneous Livestock";
    parentIcon = "/doa/images/miscellaneous-livestock.svg";
  } else if (q.sidebarMenu === "livestock-feed") {
    parentMenu = "Livestock Feed";
    parentIcon = "/doa/images/livestock-feed.svg";
  } else if (q.sidebarMenu === "retail-price-livestock") {
    parentMenu = "Retail Price";
    parentIcon = "/doa/images/retail-price.svg";
  } else if (q.sidebarMenu === "vegetable-crops") {
    parentMenu = "Vegetables";
    parentIcon = "/doa/images/crops-vegetables.svg";
  } else if (q.sidebarMenu === "fruit-crops") {
    parentMenu = "Fruit";
    parentIcon = "/doa/images/crops-fruit.svg";
  } else if (q.sidebarMenu === "paddy-crops") {
    parentMenu = "Paddy";
    parentIcon = "/doa/images/crops-paddy.svg";
  } else if (q.sidebarMenu === "dashboard-agrifood") {
    parentMenu = "Dashboard";
    parentIcon = "/doa/images/agrifood-dashboard.svg";
  } else if (q.sidebarMenu === "production-agrifood") {
    parentMenu = "Production";
    parentIcon = "/doa/images/agrifood-production.svg";
  } else if (q.sidebarMenu === "product-catalogue-agrifood") {
    parentMenu = "Product Catalogue";
    parentIcon = "/doa/images/agrifood-catalogue.svg";
  } else if (q.sidebarMenu === "sefi-rental-agrifood") {
    parentMenu = "SEFI Rental";
    parentIcon = "/doa/images/agrifood-sefi-rental.svg";
  } else if (q.sidebarMenu === "food-sampling-agrifood") {
    parentMenu = "Food Sampling";
    parentIcon = "/doa/images/agrifood-food-sampling.svg";
  } else if (q.sidebarMenu === "master-data-agrifood") {
    parentMenu = "Master Data";
    parentIcon = "/doa/images/master-data.svg";
  } else if (q.sidebarMenu === "profiling-agrifood") {
    parentMenu = "Profiling";
    parentIcon = "/doa/images/profiling.svg";
  } else if (q.sidebarMenu === "miscellaneous-crops") {
    parentMenu = "Miscellaneous";
    parentIcon = "/doa/images/crops-miscellaneous.svg";
  } else if (q.sidebarMenu === "floriculture-crops") {
    parentMenu = "Floriculture";
    parentIcon = "/doa/images/crops-floriculture.svg";
  } else if (q.sidebarMenu === "master-data-crops") {
    parentMenu = "Master Data";
    parentIcon = "/doa/images/master-data.svg";
  } else if (q.sidebarMenu === "retail-price-crops") {
    parentMenu = "Retail Price";
    parentIcon = "/doa/images/crops-retail-price.svg";
  } else if (q.sidebarMenu === "profiling-crops") {
    parentMenu = "Profiling Crops";
    parentIcon = "/doa/images/crops-profiling.svg";
  } else if (q.sidebarMenu === "dashboard-biosecurity") {
    parentMenu = "Dashboard";
    parentIcon = "/doa/images/agrifood-dashboard.svg";
  } else if (q.sidebarMenu === "importData-biosecurity") {
    parentMenu = "Import Data";
    parentIcon = "/doa/images/bio-security-import.svg";
  } else if (q.sidebarMenu === "nonComplianceEnforcement-biosecurity") {
    parentMenu = "Non Compliance Enforcement";
    parentIcon = "/doa/images/bio-security-enforcement.svg";
  } else if (q.sidebarMenu === "master-data-biosecurity") {
    parentMenu = "Master Data";
    parentIcon = "/doa/images/master-data.svg";
  } else if (q.sidebarMenu === "profiling-biosecurity") {
    parentMenu = "Profiling";
    parentIcon = "/doa/images/profiling.svg";
  } else if (q.sidebarMenu === "user-profile-user-managament") {
    parentMenu = "User Profile";
    parentIcon = "/doa/images/user-management.svg";
  } else if (q.sidebarMenu === "user-admin-user-management") {
    parentMenu = "User Admin";
    parentIcon = "/doa/images/user-management.svg";
  } else if (q.sidebarMenu === "user-roles-user-management") {
    parentMenu = "User Roles";
    parentIcon = "/doa/images/user-management.svg";
  } else if (q.sidebarMenu === "user-farmer-management") {
    parentMenu = "Farmer User Management";
    parentIcon = "/doa/images/user-management.svg";
  } else if (q.sidebarMenu === "farmer-registration-form") {
    parentMenu = "Farmer Registration Form";
    parentIcon = "/doa/images/user-management.svg";
  } else if (q.sidebarMenu === "user-farmer-management-by-farmer") {
    parentMenu = "Farmer User Management";
    parentIcon = "/doa/images/user-management.svg";
  } else {
    // parentMenu = "Landing Dashboard"
    // parentIcon = "/doa/images/agrifood-dashboard.svg";
  }
  const [logOut] = useMutation(LOGOUT);
  const handleLogout = async () => {
    try {
      await logOut({});
      setTimeout(() => (window.location.href = "/schooltalk/logout"), 2000);

      // let getSession = await localforage.getItem(
      //   "accountSession",
      //   (err, val) => {
      //     if (err !== null) {
      //       return null;
      //     }
      //     return val;
      //   }
      // );

      // await localforage.clear();

      // notification.addNotification({
      //   title: "Logout",
      //   message: "Logout! Redirecting..",
      //   level: "danger",
      // });

      // setTimeout(() => {
      //   window.location.href = "/schooltalk/login";
      // }, 2000);
    } catch (err) {
      notification.handleError(err);
    }
  };

  return (
    <div>
      <div className="fixed top-0 left-0 right-0 bg-white px-4 py-4 md:py-6 w-full shadow-lg z-50">
        <div className="grid grid-cols-12 gap-0">
          <div className="hidden md:block col-span-2">
            <div className="hidden md:flex items-center">
              <img
                className="h-14 md:h-14 pl-4"
                src="/doa/images/DoAA-Logo-3.png"
              />
            </div>
          </div>
          <div className="col-span-8 md:col-span-6 md:ml-4 flex items-center">
            <div className="flex items-center">
              <img
                className="h-12 mr-2"
                src={
                  parentIcon
                  // router.pathname === "/dashboard"
                  //   ? "/doa/images/sidebar-icon-beranda-button.svg"
                  //   : ""
                }
              />
              <p className="text-lg md:text-2xl">
                {parentMenu}
                {subMenu ? " / " + subMenu : null}
              </p>
            </div>
          </div>
          <div className="col-span-4 hidden md:flex items-center justify-end">
            <div
              className={`mr-8 ${
                !currentUserDontHavePrivilege(
                  ["Notification:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
              }`}
            >
              <button
                className="relative inline-flex items-center text-white bg-blue-600 px-4 py-2 mx-6 text-xs rounded-md shadow-md font-bold"
                onClick={(e) => {
                  if (e) e.preventDefault();
                  setShowServerStats(true);
                }}
              >
                Server Stats
              </button>

              <button
                className="relative inline-flex items-center text-gray-500 hover:text-gray-300"
                onClick={(e) => {
                  if (e) e.preventDefault();
                  setShowNotificationModal(true);
                }}
              >
                <i
                  className={`fa fa-bell fa-lg ${
                    showNotification ? "" : "hidden"
                  }`}
                />
                <div
                  className={`${
                    showNotification ? "" : "hidden"
                  }absolute inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full -top-5 -right-5`}
                >
                  {allNotifications.length}
                </div>
              </button>
            </div>
            <img
              className="h-10 w-10 rounded-full"
              src={"/doa/images/user-dummy.jpg"}
              onClick={(e) => {
                if (e) e.preventDefault();
                setShowListButton(!showListButton);
              }}
            />
            <div className="px-4">
              <p
                className="cursor-pointer"
                onClick={(e) => {
                  if (e) e.preventDefault();
                  setShowListButton(!showListButton);
                }}
              >
                User{" "}
                <span className="font-bold">
                  {currentUser?.employeeId || ""}
                </span>
              </p>
            </div>
          </div>
          <a
            href="#"
            onClick={(e) => {
              if (e) e.preventDefault();
              if (onClickOpenSidebar) onClickOpenSidebar();
            }}
            className="col-span-4 flex md:hidden items-center justify-end hover:opacity-50"
          >
            <img
              className="h-10 w-10 rounded-full"
              src={"/doa/images/user-dummy.jpg"}
            />
            <div className="px-4 text-gray-400">
              <i className="fa fa-bars" />
            </div>
          </a>
          {/* <div className="col-span-4 flex justify-center">
          <div
            className="flex items-center cursor-pointer"
            onClick={(e) => {
              if (e) e.preventDefault();
              router.replace({
                pathname: "/dashboard",
                query: {
                  // ...urlQuery,
                  ...q,
                },
              });
            }}
          >
            <img
              className="h-10 mr-2"
              src={
                router.pathname === "/dashboard"
                  ? "/schooltalk/images/st-header-icon-schoollife-button-on.svg"
                  : "/schooltalk/images/st-header-icon-schoollife-button-off.svg"
              }
            />
            <p className="font-bold text-sm">School Life</p>
          </div>
          <div className="flex items-center ml-8">
            <img
              className="h-10 mr-2"
              src="/schooltalk/images/header-icon-course-button-off.svg"
            />
            <p className="font-bold text-sm text-gray-500">Kursus</p>
          </div>
          <div className="flex items-center ml-8">
            <img
              className="h-10 mr-2"
              src="/schooltalk/images/header-icon-chat-button-off.svg"
            />
            <p className="font-bold text-sm text-gray-500">Pesan</p>
          </div>
          <div
            className="flex items-center ml-8"
            onClick={(e) => {
              if (e) e.preventDefault();
              router.replace({
                pathname: "/profile",
                query: {
                  // ...urlQuery,
                  ...q,
                },
              });
            }}
          >
            <img
              className="h-10 mr-2 cursor-pointer"
              src={
                router.pathname !== "/profile"
                  ? "/schooltalk/images/st-header-icon-profile-button-off.svg"
                  : "/schooltalk/images/st-header-icon-profile-button-on.svg"
              }
            />
            <p className="font-bold text-sm text-gray-500 cursor-pointer">
              Profile
            </p>
          </div>

          <div className="flex items-center ml-8">
            <img
              className="h-10 mr-2"
              src="/schooltalk/images/header-icon-notification-button-off.svg"
            />
            <p className="font-bold text-sm text-gray-500">Notifikasi</p>
          </div>
        </div>

        <div className="flex justify-center items-center">
          <button
            className="bg-red-500 px-12 py-2 shadow-md rounded-full"
            onClick={handleLogout}
          >
            <div className="flex items-center">
              <img
                className="text-center self-center mr-2 h-4"
                src="/schooltalk/images/header-icon-logout-button.svg"
              />
              <p className="text-white font-bold text-sm">Logout</p>
            </div>
          </button>
        </div> */}
        </div>

        <FormModal
          title={`Notification`}
          visible={showNotificationModal}
          onClose={(e) => {
            if (e) e.preventDefault();
            setShowNotificationModal(false);
          }}
          size={"lg"}
        >
          <Table
            columns={columns}
            data={allNotifications}
            loading={false}
            withoutHeader={true}
          />
        </FormModal>

        <FormModal
          title={`Server Stats`}
          visible={showServerStats}
          onClose={(e) => {
            if (e) e.preventDefault();
            setShowServerStats(false);
          }}
          size={"lg"}
        >
          <div className="grid grid-cols-4">
            {serverStatsData?.cpuUsage?.length > 0
              ? serverStatsData.cpuUsage.map((cpu, index) => (
                  <div>
                    <p className="text-md">
                      CPU {index + 1}: {cpu.usage} %
                    </p>
                  </div>
                ))
              : null}
          </div>

          <hr className="bg-gray-200 h-1 mb-2" />
          <p className="text-center font-bold">Memory Usage</p>

          <div className="grid grid-cols-3">
            <div>
              <p className="text-md">
                Total Memory: {serverStatsData?.totalMemory || 0} MB
              </p>
            </div>
            <div>
              <p className="text-md">
                Used Memory: {serverStatsData?.usedMemory || 0} MB
              </p>
            </div>
            <div>
              <p className="text-md">
                Free Memory: {serverStatsData?.freeMemory || 0} MB
              </p>
            </div>
          </div>
        </FormModal>
      </div>

      {showListButton ? (
        <div className="fixed top-20 right-0 md:py-6 shadow-lg z-50 flex justify-end bg-white shadow-md rounded w-24 text-center">
          <a
            href="#"
            onClick={(e) => {
              if (e) e.preventDefault();
              window.location.href = "/doa/logout";
            }}
          >
            <p className="text-md font-bold mx-5">Logout</p>
          </a>
        </div>
      ) : null}
    </div>
  );
};
export default Header;
