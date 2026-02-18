import { useMutation, useQuery } from "@apollo/client";
import cookie from "cookie";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import gql from "graphql-tag";
import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "../libs/localStorage";
import Header from "./Header";
import Sidebar from "./Sidebar";
const CURRENT_USER = gql`
  query currentUser {
    currentUser {
      _id
      employeeId
      Role {
        _id
        name
        privileges
      }
      registerType
      loginStatus
    }
  }
`;

const LOGOUT = gql`
  mutation logOut {
    logOut
  }
`;

const AdminArea = ({ urlQuery, children }) => {
  const [logOut] = useMutation(LOGOUT);

  const [latestLoadAdminArea, setLatestLoadAdminArea] = useLocalStorage(
    "latestLoadAdminArea",
    dayjs().toISOString(),
  );

  const { data, error, loading, refetch } = useQuery(CURRENT_USER);
  const [widthContent, setWidthContent] = useState({
    // contentLeft: "sm:w-1/5",
    // contentRight: "sm:w-4/5",
    contentLeft: "",
    contentRight: "",
  });

  let currentUser = {};
  if (data?.currentUser) {
    currentUser = data.currentUser;
  }

  const EXPIRED_ADMIN_AREA_TIME_IN_MINUTES = 15;
  const [elapsedTimeInSeconds, setElapsedTimeInSeconds] = useState(0);
  useEffect(() => {
    // if (loading || error) return;
    if (loading && !error) {
      return;
    }
    if (error) {
      window.location.href = "/doa/logout";
    }
    if (!currentUser?._id || !data?.currentUser?._id) {
      window.location.href = "/doa/logout";
    }

    // disable auto logout on dev...
    // if (process.env.NODE_ENV !== "production") return;

    const diffInMinutes = dayjs().diff(latestLoadAdminArea, "minute");

    if (diffInMinutes >= EXPIRED_ADMIN_AREA_TIME_IN_MINUTES) {
      window.location.href = "/doa/logout";
      return;
    }

    setLatestLoadAdminArea(dayjs().toISOString());
    setElapsedTimeInSeconds(EXPIRED_ADMIN_AREA_TIME_IN_MINUTES * 60);

    let timer = setInterval(() => {
      setElapsedTimeInSeconds((elapsedTimeInSeconds) => {
        const newElapsedTimeInSeconds = Math.max(elapsedTimeInSeconds - 1, 0);
        if (newElapsedTimeInSeconds <= 0) {
          window.location.href = "/doa/logout";
        }
        return newElapsedTimeInSeconds;
      });
    }, 970); // approx 1 seconds
    return () => {
      clearInterval(timer);
    };
  }, [currentUser?._id, loading, error]);

  useEffect(() => {
    // disable on dev...
    // if (process.env.NODE_ENV !== "production") return;

    const handleWindowClick = () => {
      setLatestLoadAdminArea(dayjs().toISOString());
      setElapsedTimeInSeconds(EXPIRED_ADMIN_AREA_TIME_IN_MINUTES * 60);
    };
    const handleMouseMove = (e) => {
      setLatestLoadAdminArea(dayjs().toISOString());
      setElapsedTimeInSeconds(EXPIRED_ADMIN_AREA_TIME_IN_MINUTES * 60);
    };

    const handleKeyDown = (e) => {
      setLatestLoadAdminArea(dayjs().toISOString());
      setElapsedTimeInSeconds(EXPIRED_ADMIN_AREA_TIME_IN_MINUTES * 60);
    };

    // const handleBeforeUnload = async (e) => {
    //   const confirmationMessage = "Are you sure you want to leave?";
    //   const storage = localStorage.getItem(`userId_${currentUser?._id || ""}`);

    //   if (storage !== "0") {
    //     if (e) {
    //       e.preventDefault(); // Some browsers may require this to show the prompt
    //       e.returnValue = confirmationMessage; // For most browsers
    //       // await logOut({});
    //       return confirmationMessage; // For older browsers
    //     }
    //   }
    // };

    window.addEventListener("click", handleWindowClick);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);

    // window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("click", handleWindowClick);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleMouseMove);
      // window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (menuVisible) {
      // document.body.style.position = "fixed";
      document.body.style["overflow-y"] = "hidden";
    }
    // else {
    //   // document.body.style.position = "static";
    //   document.body.style["overflow-y"] = "auto";
    // }

    return () => {
      document.body.style["overflow-y"] = "auto";
    };
  }, [menuVisible]);

  useEffect(() => {
    localStorage.setItem(
      `userId_${currentUser?._id || ""}`,
      elapsedTimeInSeconds,
    );
  }, [elapsedTimeInSeconds]);

  return (
    <div className="bg-white">
      <Header
        onClickOpenSidebar={(e) => {
          if (e) e.preventDefault();
          setMenuVisible(true);
        }}
      />
      <div className="w-full flex min-h-full z-20">
        <AnimatePresence>
          {menuVisible ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1, delay: 0 }}
              className={`w-full md:hidden bg-white h-full fixed top-0 left-0 shadow-lg transition-all duration-40 z-20 overflow-y-scroll`}>
              <Sidebar
                onClose={(e) => {
                  if (e) e.preventDefault();
                  setMenuVisible(false);
                }}
                sidebarWidth={widthContent.contentLeft}
                urlQuery={urlQuery}
                // currentUser={currentUser}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div
          className={`hidden md:block ${widthContent.contentLeft} w-2/12 bg-white h-full sticky top-0 shadow-lg transition-all duration-40 z-20`}>
          <Sidebar
            sidebarWidth={widthContent.contentLeft}
            urlQuery={urlQuery}
            currentUser={currentUser}
          />
        </div>

        <div
          className={`${widthContent.contentRight} w-full md:w-10/12 h-full pl-4 md:pl-10 pr-4 md:pr-0`}>
          {children}

          {elapsedTimeInSeconds > 0 ? (
            <div className="px-4 py-4 text-sm text-right text-gray-400">
              You will be logged out automatically in {elapsedTimeInSeconds}{" "}
              seconds for no activity.
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-right text-gray-400">
              &nbsp;
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminArea;

export const useCurrentUser = () => {
  const { data, error, loading, refetch } = useQuery(CURRENT_USER);
  const [logOut] = useMutation(LOGOUT);

  let currentUser = {};
  if (data?.currentUser) {
    currentUser = data.currentUser;
  }

  useEffect(() => {
    setTimeout(async () => {
      // await logOut({});
      if (!loading) {
        if (!currentUser._id || !currentUser.employeeId) {
          document.cookie = cookie.serialize("token", "", {
            maxAge: -1, // Expire the cookie immediately
            path: "/",
          });
          window.location = "/doa/login";
          window.localStorage.clear();
        } else {
          if (currentUser.loginStatus === "LOGOUT") {
            window.location = "/doa/logout";
          }
        }
      }
    }, 800);
  }, []);

  // if (!loading) {
  //   if (!currentUser._id || !currentUser.employeeId) {
  //     if (typeof window === "undefined") {
  //       window.location.href
  //     }
  //     // setTimeout(async () => {
  //     //   window.location = "/doa/login-2";
  //     //   window.localStorage.clear();
  //     // }, 800);
  //   }
  // }

  const currentUserDontHavePrivilege = useCallback(
    (privileges) => {
      if (!currentUser || !currentUser._id) {
        return true;
      } else if (currentUser.Role) {
        if (currentUser.Role._id.indexOf("__SUPER_USER__") > -1) {
          return false;
        }

        return !privileges.some((v) => currentUser.Role.privileges.includes(v));
      } else if (
        currentUser.roles &&
        currentUser.roles.includes(`__SUPER_USER__`)
        // (currentUser.roles.includes("yongchun_root") ||
        //   currentUser.roles.includes("yongchun_superuser"))
      ) {
        return false;
      }
      return true;
    },
    [currentUser],
  );

  return {
    currentUser,
    currentUserDontHavePrivilege,
  };
};
