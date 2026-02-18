import dayjs from "dayjs";
import router, { useRouter } from "next/router";
import { useEffect, useState } from "react";
import getConfig from "next/config";
import { useCurrentUser } from "./AdminArea";
import { set } from "nprogress";
const { publicRuntimeConfig } = getConfig();
let { MODE, SECRET_KEY } = publicRuntimeConfig;

MODE = MODE.split(", ");

const Sidebar = ({ sidebarWidth, urlQuery, onClose }) => {
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const router = useRouter();
  const sidebarMenu = urlQuery.sidebarMenu;
  const { date, ...q } = urlQuery;

  const [menuState, setMenu] = useState("");
  const [showSubMenu, setShowSubMenu] = useState(true);
  const [subMenuState, setSubMenu] = useState("");
  const [appState, selectAppState] = useState("SEP");

  useEffect(() => {
    setMenu(router.query.sidebarMenu);
  }, []);
  // console.log(SECRET_KEY);
  const selectSidebarMenu = (menu) => (e) => {
    if (e) e.preventDefault();
    setMenu(menu);
    // console.log({ menu });
    if (menu === "dashboard") {
      if (currentUser.registerType === "FARMER") {
        router.replace({
          pathname: "/landing-dashboard",
          query: {
            // ...urlQuery,
            sidebarMenu: "dashboard",
            appState: "Livestock",
          },
        });
      } else {
        router.replace({
          pathname: "/dashboard",
          query: {
            // ...urlQuery,
            sidebarMenu: "dashboard",
            appState: "Livestock",
          },
        });
      }
    }
    // else if (menu === "broiler") {
    //   router.replace({
    //     pathname: "/broiler",
    //     query: {
    //       // ...urlQuery,
    //       sidebarMenu: "broiler",
    //       appState: "Livestock",
    //     },
    //   });
    // }
    // else if (menu === "day-old-chick") {
    //   router.replace({
    //     pathname: "/day-old-chick",
    //     query: {
    //       // ...urlQuery,
    //       sidebarMenu: "day-old-chick",
    //       appState: "Livestock",
    //     },
    //   });
    // }
    //  else if (menu === "table-eggs") {
    //   router.replace({
    //     pathname: "/table-eggs",
    //     query: {
    //       // ...urlQuery,
    //       sidebarMenu: "table-eggs",
    //       appState: "Livestock",
    //     },
    //   });
    // } 
    // else if (menu === "fertilized-eggs") {
    //   router.replace({
    //     pathname: "/fertilized-eggs",
    //     query: {
    //       // ...urlQuery,
    //       sidebarMenu: "fertilized-eggs",
    //       appState: "Livestock",
    //     },
    //   });
    // } 
    // else if (menu === "miscellaneous-livestock") {
    //   router.replace({
    //     pathname: "/miscellaneous-livestock",
    //     query: {
    //       // ...urlQuery,
    //       sidebarMenu: "miscellaneous-livestock",
    //       appState: "Livestock",
    //     },
    //   });
    // } else if (menu === "livestock-feed") {
    //   router.replace({
    //     pathname: "/livestock-feed",
    //     query: {
    //       // ...urlQuery,
    //       sidebarMenu: "livestock-feed",
    //       appState: "Livestock",
    //     },
    //   });
    // } 
    else if (menu === "retail-price-livestock") {
      router.replace({
        pathname: "/retail-price-livestock",
        query: {
          // ...urlQuery,
          sidebarMenu: "retail-price-livestock",
          appState: "Livestock",
        },
      });
    } else if (menuState === menu) {
      setShowSubMenu(!showSubMenu);
    } else {
      setShowSubMenu(true);
    }
  };
  // console.log(showSubMenu);
  const selectSidebarMenuCrops = (menu) => (e) => {
    if (e) e.preventDefault();
    setMenu(menu);
    if (menuState === menu) {
      setShowSubMenu(!showSubMenu);
    } else {
      setShowSubMenu(true);
    }
  };
  const selectSidebarMenuAgrifood = (menu) => (e) => {
    if (e) e.preventDefault();
    setMenu(menu);
    if (menu === "dashboard-agrifood") {
      if (currentUser.registerType === "FARMER") {
        router.replace({
          pathname: "/landing-dashboard",
          query: {
            // ...urlQuery,
            sidebarMenu: "dashboard-agrifood",
            appState: "Agrifood",
          },
        });
      } else {
        router.replace({
          pathname: "/dashboard-agrifood",
          query: {
            sidebarMenu: "dashboard-agrifood",
            appState: "Agrifood",
          },
        });
      }
    }
    if (menu === "production-agrifood") {
      router.replace({
        pathname: "/production-agrifood",
        query: {
          sidebarMenu: "production-agrifood",
          appState: "Agrifood",
        },
      });
    }
    if (menu === "product-catalogue-agrifood") {
      router.replace({
        pathname: "/product-catalogue-agrifood",
        query: {
          sidebarMenu: "product-catalogue-agrifood",
          appState: "Agrifood",
          componentName: "Catalogue",
        },
      });
    }
    if (menu === "sefi-rental-agrifood") {
      router.replace({
        pathname: "/sefi-rental-agrifood",
        query: {
          sidebarMenu: "sefi-rental-agrifood",
          appState: "Agrifood",
        },
      });
    }
    if (menu === "food-sampling-agrifood") {
      router.replace({
        pathname: "/food-sampling-agrifood",
        query: {
          sidebarMenu: "food-sampling-agrifood",
          appState: "Agrifood",
        },
      });
    } else if (menuState === menu) {
      setShowSubMenu(!showSubMenu);
    } else {
      setShowSubMenu(true);
    }
  };
  const selectSidebarMenuBiosecurity = (menu) => (e) => {
    if (e) e.preventDefault();
    setMenu(menu);
    if (menu === "dashboard-biosecurity") {
      if (currentUser.registerType === "FARMER") {
        router.replace({
          pathname: "/landing-dashboard",
          query: {
            // ...urlQuery,
            sidebarMenu: "dashboard-biosecurity",
            appState: "Bio Security",
          },
        });
      } else {
        router.replace({
          pathname: "/dashboard-biosecurity",
          query: {
            sidebarMenu: "dashboard-biosecurity",
            appState: "Bio Security",
          },
        });
      }
    }
    if (menu === "importData-biosecurity") {
      router.replace({
        pathname: "/importData-biosecurity",
        query: {
          sidebarMenu: "importData-biosecurity",
          appState: "Bio Security",
        },
      });
    }
    if (menu === "nonComplianceEnforcement-biosecurity") {
      router.replace({
        pathname: "/nonComplianceEnforcement-biosecurity",
        query: {
          sidebarMenu: "nonComplianceEnforcement-biosecurity",
          appState: "Bio Security",
          componentName: "Commercial",
        },
      });
    }
    if (menu === "") {
      router.replace({
        pathname: "",
        query: {
          sidebarMenu: "",
          appState: "Bio Security",
        },
      });
    }
  };
  const selectSidebarMenuUserManagement = (menu) => (e) => {
    if (e) e.preventDefault();
    setMenu(menu);
    if (menu === "farmer-registration-form") {
      router.replace({
        pathname: "/farmer-registration-form",
        query: {
          sidebarMenu: "farmer-registration-form",
          appState: "User Management",
        },
      });
    }
    if (menu === "user-roles-user-management") {
      router.replace({
        pathname: "/user-roles-user-management",
        query: {
          sidebarMenu: "user-roles-user-management",
          appState: "User Management",
        },
      });
    }
    if (menu === "user-admin-user-management") {
      router.replace({
        pathname: "/user-admin-user-management",
        query: {
          sidebarMenu: "user-admin-user-management",
          appState: "User Management",
        },
      });
    }
    if (menu === "user-farmer-management") {
      router.replace({
        pathname: "/user-farmer-management",
        query: {
          sidebarMenu: "user-farmer-management",
          appState: "User Management",
        },
      });
    } else if (menuState === menu) {
      setShowSubMenu(!showSubMenu);
    } else {
      setShowSubMenu(true);
    }
  };

  const selectSidebarSubMenu = (subMenu, subMenuName, componentName) => (e) => {
    if (e) e.preventDefault();
    setSubMenu(subMenu);
    setMenu(menuState);
    if (router.query.sidebarSubMenu !== subMenu) {
      router.replace({
        // pathname: `/${menuState}/${subMenu}`,
        pathname: `/${menuState}/${subMenu}`,
        query: {
          // ...urlQuery,
          sidebarMenu: menuState,
          sidebarSubMenu: subMenu,
          sidebarSubMenuName: subMenuName,
          componentName,
          appState: "Livestock",
        },
      });
    }
  };

  const selectSidebarSubCrops =
    (subMenu, subMenuName, componentName) => (e) => {
      if (e) e.preventDefault();
      setSubMenu(subMenu);
      setMenu(menuState);

      if (router.query.sidebarSubMenu !== subMenu) {
        router.replace({
          // pathname: `/${menuState}/${subMenu}`,
          pathname: `/${menuState}/${subMenu}`,
          query: {
            // ...urlQuery,
            sidebarMenu: menuState,
            sidebarSubMenu: subMenu,
            sidebarSubMenuName: subMenuName,
            componentName,
            appState: "Crops",
          },
        });
      }
    };
  const selectSidebarSubAgrifood =
    (subMenu, subMenuName, componentName) => (e) => {
      if (e) e.preventDefault();
      setSubMenu(subMenu);
      setMenu(menuState);
      if (router.query.sidebarSubMenu !== subMenu) {
        router.replace({
          // pathname: `/${menuState}/${subMenu}`,
          pathname: `/${menuState}/${subMenu}`,
          query: {
            // ...urlQuery,
            sidebarMenu: menuState,
            sidebarSubMenu: subMenu,
            sidebarSubMenuName: subMenuName,
            componentName,
            appState: "Agrifood",
          },
        });
      }
    };
  const selectSidebarSubBiosecurity =
    (subMenu, subMenuName, componentName) => (e) => {
      if (e) e.preventDefault();
      setSubMenu(subMenu);
      setMenu(menuState);
      if (router.query.sidebarSubMenu !== subMenu) {
        router.replace({
          // pathname: `/${menuState}/${subMenu}`,
          pathname: `/${menuState}/${subMenu}`,
          query: {
            // ...urlQuery,
            sidebarMenu: menuState,
            sidebarSubMenu: subMenu,
            sidebarSubMenuName: subMenuName,
            componentName,
            appState: "Bio Security",
          },
        });
      }
    };
  const selectSidebarSubUserManagement =
    (subMenu, subMenuName, componentName) => (e) => {
      if (e) e.preventDefault();
      setSubMenu(subMenu);
      setMenu(menuState);
      if (router.query.sidebarSubMenu !== subMenu) {
        router.replace({
          // pathname: `/${menuState}/${subMenu}`,
          pathname: `/${menuState}/${subMenu}`,
          query: {
            // ...urlQuery,
            sidebarMenu: menuState,
            sidebarSubMenu: subMenu,
            sidebarSubMenuName: subMenuName,
            componentName,
            appState: "User Management",
          },
        });
      }
    };
  const selectSidebarSubMenuEstate =
    (subMenu, subMenuName, componentName) => (e) => {
      if (e) e.preventDefault();
      setSubMenu(subMenu);
      setMenu(menuState);

      let estateUrlQuery = {};

      if (router.query.sidebarSubMenu !== subMenu) {
        if (router.query.estateId) {
          const { estateId, estateYear } = router.query;
          estateUrlQuery = {
            ...estateUrlQuery,
            estateId,
            estateYear,
          };
        }
        router.replace({
          // pathname: `/${menuState}/${subMenu}`,
          pathname: `/${menuState}/${subMenu}`,
          query: {
            // ...urlQuery,
            ...estateUrlQuery,
            sidebarMenu: menuState,
            sidebarSubMenu: subMenu,
            sidebarSubMenuName: subMenuName,
            componentName,
            appState: "Estate",
          },
        });
      }
    };

  const selectSidebarSubMenuSmallholder =
    (subMenu, subMenuName, componentName) => (e) => {
      if (e) e.preventDefault();
      // console.log({ subMenu, subMenuName, componentName, menuState });
      setSubMenu(subMenu);
      setMenu(menuState);

      router.replace({
        // pathname: `/${menuState}/${subMenu}`,
        pathname: `/${menuState}/${subMenu}`,
        query: {
          sidebarMenu: menuState,
          sidebarSubMenu: subMenu,
          sidebarSubMenuName: subMenuName,
          componentName,
          appState: "Smallholder",
        },
      });
    };

  return (
    <div className={`bg-white shadow-md h-screen overflow-y-scroll `}>
      <div className="sticky top-0 flex-1 bg-white pt-4">
        <div className="hidden md:flex items-center">
          <img
            className="h-12 md:h-12 pl-4"
            src="/doa/images/DoAA-Logo-3.png"
          />
        </div>

        <a
          href="#"
          onClick={(e) => {
            if (e) e.preventDefault();
            if (onClose) onClose();
          }}
          className="flex md:hidden items-center justify-start"
        >
          <img
            className="h-12 md:h-20 pl-4 flex-none"
            src="/doa/images/doa-logo.png"
          />
          <div className="mx-4 flex-none">
            <p className="font-bold text-base md:text-xl">DoAA</p>
          </div>
          <div className="w-full text-right px-6">
            <i className="fa fa-times" />
          </div>
        </a>
        <hr className="bg-gray-200 h-1" />
      </div>
      <div className="w-full mb-4 pr-2 block mt-10">
        <select
          className="form-control"
          value={router.query.appState}
          onChange={(e) => {
            if (e) e.preventDefault();
            if (e.target.value === "Livestock") {
              // if (currentUser.registerType === "FARMER" && currentUserDontHavePrivilege(["Dashboard Livestock:Read"])) {
              if (currentUser.registerType === "FARMER") {
                router.replace({
                  pathname: "/landing-dashboard",
                  query: {
                    // ...urlQuery,
                    // sidebarMenu: "dashboard",
                    appState: e.target.value,
                  },
                });
              } else {
                router.replace({
                  pathname: "/landing-dashboard",
                  query: {
                    // ...urlQuery,
                    // sidebarMenu: "dashboard",
                    appState: e.target.value,
                  },
                });
              }
            } else if (e.target.value === "Crops") {
              if (currentUser.registerType === "FARMER") {
                router.replace({
                  pathname: "/landing-dashboard",
                  query: {
                    // ...urlQuery,
                    // sidebarMenu: "dashboard",
                    appState: e.target.value,
                  },
                });
              } else {
                router.replace({
                  pathname: "/vegetable-crops/dashboard",
                  query: {
                    sidebarMenu: "dashboard",
                    appState: e.target.value,
                  },
                });
              }
            } else if (e.target.value === "Agrifood") {
              if (currentUser.registerType === "FARMER") {
                router.replace({
                  pathname: "/landing-dashboard",
                  query: {
                    // ...urlQuery,
                    // sidebarMenu: "dashboard",
                    appState: e.target.value,
                  },
                });
              } else {
                router.replace({
                  pathname: "/dashboard-agrifood",
                  query: {
                    sidebarMenu: "dashboard-agrifood",
                    appState: e.target.value,
                  },
                });
              }
            } else if (e.target.value === "Bio Security") {
              if (currentUser.registerType === "FARMER") {
                router.replace({
                  pathname: "/landing-dashboard",
                  query: {
                    // ...urlQuery,
                    // sidebarMenu: "dashboard",
                    appState: e.target.value,
                  },
                });
              } else {
                router.replace({
                  pathname: "/dashboard-biosecurity",
                  query: {
                    sidebarMenu: "dashboard-biosecurity",
                    appState: e.target.value,
                  },
                });
              }
            } else if (e.target.value === "User Management") {
              if (currentUser.registerType === "FARMER") {
                router.replace({
                  pathname: "/landing-dashboard",
                  query: {
                    // ...urlQuery,
                    // sidebarMenu: "dashboard",
                    appState: e.target.value,
                  },
                });
              } else {
                router.replace({
                  pathname: "/user-admin-user-management",
                  query: {
                    sidebarMenu: "user-admin-user-management",
                    appState: e.target.value,
                  },
                });
              }
            } else if (e.target.value === "Overall Dashboard") {
              // if (currentUser.registerType === "FARMER" && currentUserDontHavePrivilege(["Dashboard Livestock:Read"])) {
              if (currentUser.registerType === "FARMER") {
                
              } else {
                router.replace({
                  pathname: "/overall-dashboard",
                  query: {
                    // ...urlQuery,
                    sidebarMenu: "overall-dashboard",
                    appState: e.target.value,
                  },
                });
              }
            }
          }}
        >
          <option value="Landing Dashboard" disabled>
            Choose Module
          </option>

          <option
            className={
              currentUserDontHavePrivilege(["Overall Dashboard:Read"])
                ? "hidden"
                : ""
            }
            value="Overall Dashboard"
          >
            Overall Dashboard
          </option>

          <option
            className={
              currentUserDontHavePrivilege(["Livestock App Menu:Read"])
                ? "hidden"
                : ""
            }
            value="Livestock"
          >
            Livestock
          </option>
          <option
            className={
              currentUserDontHavePrivilege(["Crops App Menu:Read"])
                ? "hidden"
                : ""
            }
            value="Crops"
          >
            Crops
          </option>
          <option
            className={
              currentUserDontHavePrivilege(["Agrifood Menu:Read"])
                ? "hidden"
                : ""
            }
            value="Agrifood"
          >
            Agrifood
          </option>
          <option
            className={
              currentUserDontHavePrivilege(["Biosecurity Menu:Read"])
                ? "hidden"
                : ""
            }
            value="Bio Security"
          >
            Biosecurity
          </option>
          <option
            className={
              currentUserDontHavePrivilege(["User Management Menu:Read"])
                ? "hidden"
                : ""
            }
            value="User Management"
          >
            User Management
          </option>
        </select>
      </div>
      {/* THIS FOR LIVE STOCK APPS */}
      <div
        className={`${router.query.appState === "Livestock" ? "block" : "hidden"
          }`}
      >
        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Dashboard Livestock:Read"],
            currentUser
          )
            ? "hidden"
            : "hidden"
            }`}
        >
          {menuState === "dashboard" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenu("dashboard")}
                >
                  <img
                    src="/doa/images/agrifood-dashboard.svg"
                    className="h-10 w-auto"
                  />
                  <p className={"text-black font-bold text-lg md:text-sm mx-2"}>
                    Dashboard
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenu("dashboard")}
              >
                <img
                  src="/doa/images/agrifood-dashboard.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Dashboard
                </p>
              </div>
            </div>
          )}
        </div>

        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Broiler:Read"], currentUser)
            ? "block"
            : "hidden"
            }
        `}
        >
          {menuState === "broiler" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenu("broiler")}
                >
                  <img src="/doa/images/broiler.svg" className="h-10 w-auto" />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Broiler
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenu("broiler")}
              >
                <img src="/doa/images/broiler.svg" className="h-10 w-auto" />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Broiler
                </p>
              </div>
            </div>
          )}

          {menuState === "broiler" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(["Dashboard Broiler:Read"], currentUser)
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("dashboard-broiler", "Dashboard", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "dashboard-broiler" || q.sidebarSubMenu === "dashboard-broiler"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Dashboard
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Broiler:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("broiler", "", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "broiler" ||
                    q.sidebarSubMenu === "broiler"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Broiler
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Broiler:Read"], currentUser)
            ? "block"
            : "hidden"
            }
        `}
        >
          {menuState === "broiler" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenu("broiler")}
                >
                  <img src="/doa/images/broiler.svg" className="h-10 w-auto" />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Broiler
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenu("broiler")}
              >
                <img src="/doa/images/broiler.svg" className="h-10 w-auto" />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Broiler
                </p>
              </div>
            </div>
          )}
        </div> */}

        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Table Eggs:Read"], currentUser)
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "table-eggs" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenu("table-eggs")}
                >
                  <img src="/doa/images/table-eggs.svg" className="h-10 w-auto" />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Table Eggs
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenu("table-eggs")}
              >
                <img src="/doa/images/table-eggs.svg" className="h-10 w-auto" />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Table Eggs
                </p>
              </div>
            </div>
          )}

          {menuState === "table-eggs" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(["Dashboard Table Eggs:Read"], currentUser)
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("dashboard-table-eggs", "Dashboard", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "dashboard-table-eggs" || q.sidebarSubMenu === "dashboard-table-eggs"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Dashboard
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Table Eggs:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("table-eggs", "", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "table-eggs" ||
                    q.sidebarSubMenu === "table-eggs"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Table Eggs
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Table Eggs:Read"], currentUser)
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "table-eggs" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenu("table-eggs")}
                >
                  <img
                    src="/doa/images/table-eggs.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Table Eggs
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenu("table-eggs")}
              >
                <img src="/doa/images/table-eggs.svg" className="h-10 w-auto" />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Table Eggs
                </p>
              </div>
            </div>
          )}
        </div> */}

        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Day Old Chick:Read"], currentUser)
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "day-old-chick" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenu("day-old-chick")}
                >
                  <img src="/doa/images/chick.svg" className="h-10 w-auto" />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Day Old Chick
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenu("day-old-chick")}
              >
                <img src="/doa/images/chick.svg" className="h-10 w-auto" />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Day Old Chick
                </p>
              </div>
            </div>
          )}

          {menuState === "day-old-chick" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(["Dashboard Day Old Chick:Read"], currentUser)
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("dashboard-day-old-chick", "Dashboard", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "dashboard-day-old-chick" || q.sidebarSubMenu === "dashboard-day-old-chick"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Dashboard
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Day Old Chick:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("day-old-chick", "", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "day-old-chick" ||
                    q.sidebarSubMenu === "day-old-chick"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Day Old Chick
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* <div
          className={` w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Day Old Chick:Read"], currentUser)
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "day-old-chick" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenu("day-old-chick")}
                >
                  <img src="/doa/images/chick.svg" className="h-10 w-auto" />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Day Old Chick
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenu("day-old-chick")}
              >
                <img src="/doa/images/chick.svg" className="h-10 w-auto" />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Day Old Chick
                </p>
              </div>
            </div>
          )}
        </div> */}

        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Fertilized Eggs:Read"], currentUser)
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "fertilized-eggs" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenu("fertilized-eggs")}
                >
                  <img src="/doa/images/fertilized-egg.svg" className="h-10 w-auto" />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Fertilized Eggs
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenu("fertilized-eggs")}
              >
                <img src="/doa/images/fertilized-egg.svg" className="h-10 w-auto" />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Fertilized Eggs
                </p>
              </div>
            </div>
          )}

          {menuState === "fertilized-eggs" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(["Dashboard Fertilized Eggs:Read"], currentUser)
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("dashboard-fertilized-eggs", "Dashboard", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "dashboard-fertilized-eggs" || q.sidebarSubMenu === "dashboard-fertilized-eggs"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Dashboard
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Fertilized Eggs:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("fertilized-eggs", "", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "fertilized-eggs" ||
                    q.sidebarSubMenu === "fertilized-eggs"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Fertilized Eggs
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Fertilized Eggs:Read"], currentUser)
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "fertilized-eggs" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenu("fertilized-eggs")}
                >
                  <img
                    src="/doa/images/fertilized-egg.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Fertilized Eggs
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenu("fertilized-eggs")}
              >
                <img
                  src="/doa/images/fertilized-egg.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Fertilized Eggs
                </p>
              </div>
            </div>
          )}
        </div> */}

        <div
          className={` w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Ruminant Livestock:Read"],
            currentUser
          )
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "ruminant" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenu("ruminant")}
                >
                  <img src="/doa/images/ruminant.svg" className="h-10 w-auto" />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Ruminant
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenu("ruminant")}
              >
                <img src="/doa/images/ruminant.svg" className="h-10 w-auto" />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Ruminant
                </p>
              </div>
            </div>
          )}

          {menuState === "ruminant" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(["Dashboard Ruminant Livestock:Read"], currentUser)
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("dashboard-ruminant", "Dashboard", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "dashboard-ruminant" || q.sidebarSubMenu === "dashboard-ruminant"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Dashboard
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(["Stock:Read"], currentUser)
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("stock", "Stock", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "stock" || q.sidebarSubMenu === "stock"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Stock
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Production:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("production", "Production", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "production" ||
                    q.sidebarSubMenu === "production"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Production
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Miscellaneous Livestock:Read"], currentUser)
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "miscellaneous-livestock" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenu("miscellaneous-livestock")}
                >
                  <img src="/doa/images/miscellaneous-livestock.svg" className="h-10 w-auto" />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Miscellaneous Livestock
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenu("miscellaneous-livestock")}
              >
                <img src="/doa/images/miscellaneous-livestock.svg" className="h-10 w-auto" />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Miscellaneous Livestock
                </p>
              </div>
            </div>
          )}

          {menuState === "miscellaneous-livestock" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(["Dashboard Miscellaneous Livestock:Read"], currentUser)
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("dashboard-miscellaneous-livestock", "Dashboard", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "dashboard-miscellaneous-livestock" || q.sidebarSubMenu === "dashboard-miscellaneous-livestock"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Dashboard
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Miscellaneous Livestock:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("miscellaneous-livestock", "", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "miscellaneous-livestock" ||
                    q.sidebarSubMenu === "miscellaneous-livestock"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Miscellaneous Livestock
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Miscellaneous Livestock:Read"],
            currentUser
          )
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "miscellaneous-livestock" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenu("miscellaneous-livestock")}
                >
                  <img
                    src="/doa/images/miscellaneous-livestock.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Miscellaneous Livestock
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenu("miscellaneous-livestock")}
              >
                <img
                  src="/doa/images/miscellaneous-livestock.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Miscellaneous Livestock
                </p>
              </div>
            </div>
          )}
        </div>
         */}

        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Livestock Feed:Read"], currentUser)
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "livestock-feed" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenu("livestock-feed")}
                >
                  <img src="/doa/images/livestock-feed.svg" className="h-10 w-auto" />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Livestock Feed
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenu("livestock-feed")}
              >
                <img src="/doa/images/livestock-feed.svg" className="h-10 w-auto" />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Livestock Feed
                </p>
              </div>
            </div>
          )}

          {menuState === "livestock-feed" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(["Dashboard Livestock Feed:Read"], currentUser)
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("dashboard-livestock-feed", "Dashboard", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "dashboard-livestock-feed" || q.sidebarSubMenu === "dashboard-livestock-feed"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Dashboard
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Livestock Feed:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("livestock-feed", "", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "livestock-feed" ||
                    q.sidebarSubMenu === "livestock-feed"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Livestock Feed
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Livestock Feed:Read"], currentUser)
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "livestock-feed" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenu("livestock-feed")}
                >
                  <img
                    src="/doa/images/livestock-feed.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Livestock Feed
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenu("livestock-feed")}
              >
                <img
                  src="/doa/images/livestock-feed.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Livestock Feed
                </p>
              </div>
            </div>
          )}
        </div>
         */}
        <div
          className={` w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Profiling Livestock:Read"],
            currentUser
          )
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "profiling-livestock" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenu("profiling-livestock")}
                >
                  <img
                    src="/doa/images/profiling.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Profiling
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenu("profiling-livestock")}
              >
                <img src="/doa/images/profiling.svg" className="h-10 w-auto" />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Profiling
                </p>
              </div>
            </div>
          )}

          {menuState === "profiling-livestock" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(["Dashboard Profiling Livestock:Read"], currentUser)
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("dashboard-profiling-livestock", "Dashboard", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "dashboard-profiling-livestock" ||
                    q.sidebarSubMenu === "dashboard-profiling-livestock"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Dashboard
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(["Supplier:Read"], currentUser)
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("supplier", "Supplier", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "supplier" ||
                    q.sidebarSubMenu === "supplier"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Supplier
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer hidden ${!currentUserDontHavePrivilege(
                  ["Machinery Livestock:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("machinery", "Machinery", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "machinery" ||
                    q.sidebarSubMenu === "machinery"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Machinery
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Company Status Livestock:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu(
                  "company-status",
                  "Company Status",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "company-status" ||
                    q.sidebarSubMenu === "company-status"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2 `}
                >
                  Company Status
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Race Profiling Livestock:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("race", "Race", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "race" || q.sidebarSubMenu === "race"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Race
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer hidden ${!currentUserDontHavePrivilege(
                  ["Planting System:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu(
                  "planting-system",
                  "Planting System",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "planting-system" ||
                    q.sidebarSubMenu === "planting-system"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Planting System
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Farming System:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu(
                  "farming-system",
                  "Farming System",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "farming-system" ||
                    q.sidebarSubMenu === "farming-system"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2 `}
                >
                  Farming System
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Commodity Type:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu(
                  "comodity-type",
                  "Commodity Type",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "comodity-type" ||
                    q.sidebarSubMenu === "comodity-type"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Commodity Type
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Award Type Profiling Livestock:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("award-type", "Award Type", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "award-type" ||
                    q.sidebarSubMenu === "award-type"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Award Type
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Land Ownership Status:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu(
                  "land-ownership-status",
                  "Land Ownership Status",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "land-ownership-status" ||
                    q.sidebarSubMenu === "land-ownership-status"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Land Ownership Status
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Irrigation Status:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu(
                  "irigation-status",
                  "Irrigation Status",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "irigation-status" ||
                    q.sidebarSubMenu === "irigation-status"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Irrigation Status
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Support Type:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu(
                  "support-type",
                  "Support Type",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "support-type" ||
                    q.sidebarSubMenu === "support-type"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Support Type
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Type Company Reg:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu(
                  "type-company-reg",
                  "Type of Company Reg",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "type-company-reg" ||
                    q.sidebarSubMenu === "type-company-reg"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Type of Company Reg
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Current Status:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu(
                  "current-status",
                  "Current Status",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "current-status" ||
                    q.sidebarSubMenu === "current-status"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Current Status
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Contract Status Profiling Livestock:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu(
                  "contract-status",
                  "Contract Status",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "contract-status" ||
                    q.sidebarSubMenu === "contract-status"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Contract Status
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Farmer Profile Livestock:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu(
                  "farmer-profile",
                  "Farmer Profile",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "farmer-profile" ||
                    q.sidebarSubMenu === "farmer-profile"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Farmer Profile
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Farm Profile:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu(
                  "farm-profile",
                  "Farm Profile",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "farm-profile" ||
                    q.sidebarSubMenu === "farm-profile"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Farm Profile
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Modern Technology Profiling Livestock:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu(
                  "modern-technology",
                  "Modern Technology",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "modern-technology" ||
                    q.sidebarSubMenu === "modern-technology"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Modern Technology
                </p>
              </div>
            </div>
          ) : null}
        </div>
        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Retail Price Livestock:Read"],
            currentUser
          )
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "retail-price-livestock" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenu("retail-price-livestock")}
                >
                  <img
                    src="/doa/images/retail-price.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Retail Price
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenu("retail-price-livestock")}
              >
                <img
                  src="/doa/images/retail-price.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Retail Price
                </p>
              </div>
            </div>
          )}
        </div>
        <div
          className={` w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Master Data Livestock:Read"],
            currentUser
          )
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "master-data-livestock" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenu("master-data-livestock")}
                >
                  <img
                    src="/doa/images/master-data.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Master Data
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenu("master-data-livestock")}
              >
                <img
                  src="/doa/images/master-data.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Master Data
                </p>
              </div>
            </div>
          )}
          {menuState === "master-data-livestock" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer 
                ${!currentUserDontHavePrivilege(
                  ["Category Livestock:Read"],
                  currentUser
                )
                    ? "block"
                    : "hidden"
                  }
                
                `}
                onClick={selectSidebarSubMenu("category", "Category", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "category" ||
                    q.sidebarSubMenu === "category"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Category
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Position Master Data Livestock:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("position", "Position", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "position" ||
                    q.sidebarSubMenu === "position"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Position
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Farm Location:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu(
                  "farm-location",
                  "Farm Location",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "farm-location" ||
                    q.sidebarSubMenu === "farm-location"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Farm Location
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(["Livestock:Read"], currentUser)
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("livestock", "Livestock", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "livestock" ||
                    q.sidebarSubMenu === "livestock"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Livestock
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Animal Feed:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("animal-feed", "Animal Feed", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "animal-feed" ||
                    q.sidebarSubMenu === "animal-feed"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Animal Feed
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Poultry House:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu(
                  "poultry-house",
                  "Poultry House",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "poultry-house" ||
                    q.sidebarSubMenu === "poultry-house"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Poultry House
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Ruminant Pens:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu(
                  "ruminant-pens",
                  "Ruminant Pens",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "ruminant-pens" ||
                    q.sidebarSubMenu === "ruminant-pens"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Ruminant Pens
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Livestock Unit:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu("livestock-unit", "Unit", "")}
              >
                <p
                  className={`${subMenuState === "livestock-unit" ||
                    q.sidebarSubMenu === "livestock-unit"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Unit
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Livestock Commodity:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubMenu(
                  "livestock-commodity",
                  "Commodity",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "livestock-commodity" ||
                    q.sidebarSubMenu === "livestock-commodity"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Commodity
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {/* THIS IS FOR CROPS APPS */}
      <div
        className={`${router.query.appState === "Crops" ? "block" : "hidden"}`}
      >
        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Vegetable:Read"], currentUser)
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "vegetable-crops" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuCrops("vegetable-crops")}
                >
                  <img
                    src="/doa/images/crops-vegetables.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Vegetable
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuCrops("vegetable-crops")}
              >
                <img
                  src="/doa/images/crops-vegetables.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Vegetable
                </p>
              </div>
            </div>
          )}
          {menuState === "vegetable-crops" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Dashboard Vegetable:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={
                  (e) => {
                    if (currentUser.registerType === "FARMER") {
                      router.replace({
                        pathname: "/landing-dashboard",
                        query: {
                          // ...urlQuery,
                          sidebarMenu: menuState,
                          sidebarSubMenu: "dashboard",
                          appState: "Crops",
                        },
                      });
                    } else {
                      router.replace({
                        pathname: `/${menuState}/dashboard`,
                        query: {
                          // ...urlQuery,
                          sidebarMenu: menuState,
                          sidebarSubMenu: "dashboard",
                          sidebarSubMenuName: "Dashboard",
                          appState: "Crops",
                        },
                      });
                    }
                  }}
              >
                <p
                  className={`${subMenuState === "dashboard" ||
                    q.sidebarSubMenu === "dashboard"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Dashboard
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Production Vegetable:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops("production", "Production", "")}
              >
                <p
                  className={`${subMenuState === "production" ||
                    q.sidebarSubMenu === "production"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Production
                </p>
              </div>
            </div>
          ) : null}
        </div>
        <div
          className={` w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Fruit:Read"], currentUser)
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "fruit-crops" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuCrops("fruit-crops")}
                >
                  <img
                    src="/doa/images/crops-fruit.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Fruit
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuCrops("fruit-crops")}
              >
                <img
                  src="/doa/images/crops-fruit.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Fruit
                </p>
              </div>
            </div>
          )}
          {menuState === "fruit-crops" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Dashboard Fruit:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={
                  (e) => {
                    if (currentUser.registerType === "FARMER") {
                      router.replace({
                        pathname: "/landing-dashboard",
                        query: {
                          // ...urlQuery,
                          sidebarMenu: menuState,
                          sidebarSubMenu: "fruit-dashboard",
                          appState: "Crops",
                        },
                      });
                    } else {
                      router.replace({
                        pathname: `/${menuState}/fruit-dashboard`,
                        query: {
                          // ...urlQuery,
                          sidebarMenu: menuState,
                          sidebarSubMenu: "fruit-dashboard",
                          sidebarSubMenuName: "Dashboard",
                          appState: "Crops",
                        },
                      });
                    }
                  }}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "fruit-dashboard" ||
                    q.sidebarSubMenu === "fruit-dashboard"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Dashboard
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Production Fruit:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "production-fruit-crops",
                  "Production",
                  "ActualProduction"
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "production-fruit-crops" ||
                    q.sidebarSubMenu === "production-fruit-crops"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Production
                </p>
              </div>
            </div>
          ) : null}
        </div>
        <div
          className={` w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Paddy:Read"], currentUser)
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "paddy-crops" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuCrops("paddy-crops")}
                >
                  <img
                    src="/doa/images/crops-paddy.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Paddy
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuCrops("paddy-crops")}
              >
                <img
                  src="/doa/images/crops-paddy.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Paddy
                </p>
              </div>
            </div>
          )}
          {menuState === "paddy-crops" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Dashboard Paddy:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={
                  (e) => {
                    if (currentUser.registerType === "FARMER") {
                      router.replace({
                        pathname: "/landing-dashboard",
                        query: {
                          // ...urlQuery,
                          sidebarMenu: menuState,
                          sidebarSubMenu: "dashboard-paddy-crops",
                          appState: "Crops",
                        },
                      });
                    } else {
                      router.replace({
                        pathname: `/${menuState}/dashboard-paddy-crops`,
                        query: {
                          // ...urlQuery,
                          sidebarMenu: menuState,
                          sidebarSubMenu: "dashboard-paddy-crops",
                          sidebarSubMenuName: "Dashboard",
                          appState: "Crops",
                        },
                      });
                    }
                  }}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "dashboard-paddy-crops" ||
                    q.sidebarSubMenu === "dashboard-paddy-crops"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Dashboard
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Paddy Production:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "production-paddy-crops",
                  "Production",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "production-paddy-crops" ||
                    q.sidebarSubMenu === "production-paddy-crops"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Paddy Production
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Paddy Seed Production:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "paddy-seed-production",
                  "Paddy Seed Production",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "paddy-seed-production" ||
                    q.sidebarSubMenu === "paddy-seed-production"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Paddy Seed Production
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Milled Rice Production:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "milled-rice-production",
                  "Milled Rice Production",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "milled-rice-production" ||
                    q.sidebarSubMenu === "milled-rice-production"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Milled Rice Production
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Paddy Seedling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "paddy-seedling-production",
                  "Paddy Seedling Sales and Price",
                  "PaddySeedlingSalesPrice"
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "paddy-seedling-production" ||
                    q.sidebarSubMenu === "paddy-seedling-production"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Paddy Seedling Production
                </p>
              </div>
            </div>
          ) : null}
        </div>
        <div
          className={` w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Miscellaneous Crops:Read"],
            currentUser
          )
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "miscellaneous-crops" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuCrops("miscellaneous-crops")}
                >
                  <img
                    src="/doa/images/crops-miscellaneous.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Miscellaneous Crops
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuCrops("miscellaneous-crops")}
              >
                <img
                  src="/doa/images/crops-miscellaneous.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Miscellaneous
                </p>
              </div>
            </div>
          )}
          {menuState === "miscellaneous-crops" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Dashboard Miscellaneous Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={
                  (e) => {
                    if (currentUser.registerType === "FARMER") {
                      router.replace({
                        pathname: "/landing-dashboard",
                        query: {
                          // ...urlQuery,
                          sidebarMenu: menuState,
                          sidebarSubMenu: "miscellaneous-dashboard",
                          appState: "Crops",
                        },
                      });
                    } else {
                      router.replace({
                        pathname: `/${menuState}/miscellaneous-dashboard`,
                        query: {
                          // ...urlQuery,
                          sidebarMenu: menuState,
                          sidebarSubMenu: "miscellaneous-dashboard",
                          sidebarSubMenuName: "Dashboard",
                          appState: "Crops",
                        },
                      });
                    }
                  }}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "miscellaneous-dashboard" ||
                    q.sidebarSubMenu === "miscellaneous-dashboard"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Dashboard
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Production Miscellaneous Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops("production", "Production", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "production" ||
                    q.sidebarSubMenu === "production"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Production
                </p>
              </div>
            </div>
          ) : null}
        </div>
        <div
          className={` w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Floriculture:Read"], currentUser)
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "floriculture-crops" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuCrops("floriculture-crops")}
                >
                  <img
                    src="/doa/images/crops-floriculture.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Floriculture
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuCrops("floriculture-crops")}
              >
                <img
                  src="/doa/images/crops-floriculture.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Floriculture
                </p>
              </div>
            </div>
          )}
          {menuState === "floriculture-crops" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Dashboard Floriculture:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={
                  (e) => {
                    if (e) e.preventDefault()
                    if (currentUser.registerType === "FARMER") {
                      router.replace({
                        pathname: "/landing-dashboard",
                        query: {
                          // ...urlQuery,
                          sidebarMenu: menuState,
                          sidebarSubMenu: "miscellaneous-dashboard",
                          appState: "Crops",
                        },
                      });
                    } else {
                      router.replace({
                        pathname: `/${menuState}/dashboard-floriculture`,
                        query: {
                          // ...urlQuery,
                          sidebarMenu: menuState,
                          sidebarSubMenu: "dashboard-floriculture",
                          sidebarSubMenuName: "Dashboard",
                          appState: "Crops",
                        },
                      });
                    }
                  }}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "dashboard-floriculture" ||
                    q.sidebarSubMenu === "dashboard-floriculture"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Dashboard
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Cut Flower Production:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "cut-flower-production",
                  "Cut Flower Production",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "cut-flower-production" ||
                    q.sidebarSubMenu === "cut-flower-production"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Cut Flower Production
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Ornamental Plant Production:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "ornamental-plant-production",
                  "Ornamental Plant Production",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "ornamental-plant-production" ||
                    q.sidebarSubMenu === "ornamental-plant-production"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Ornamental Plant Production
                </p>
              </div>
            </div>
          ) : null}
        </div>
        <div
          className={` w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Master Data Crops:Read"],
            currentUser
          )
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "master-data-crops" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuCrops("master-data-crops")}
                >
                  <img
                    src="/doa/images/master-data.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Master Data
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuCrops("master-data-crops")}
              >
                <img
                  src="/doa/images/master-data.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Master Data
                </p>
              </div>
            </div>
          )}
          {menuState === "master-data-crops" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(["Season:Read"], currentUser)
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops("season", "Season", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "season" || q.sidebarSubMenu === "season"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Season
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Category Master Data:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops("category", "Category", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "category" ||
                    q.sidebarSubMenu === "category"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Category
                </p>
              </div>

              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Farm Location Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "farm-location",
                  "Farm Location",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "farm-location" ||
                    q.sidebarSubMenu === "farm-location"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Farm Location
                </p>
              </div>

              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Vegetable Master Data:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops("vegetable", "Vegetable", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "vegetable" ||
                    q.sidebarSubMenu === "vegetable"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Vegetable
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Fruit Master Data:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops("fruit", "Fruit", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "fruit" || q.sidebarSubMenu === "fruit"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Fruit
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Paddy Master Data Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "paddy",
                  "Paddy",
                  "PaddyVariety"
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "paddy" || q.sidebarSubMenu === "paddy"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Paddy
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Miscellaneous Crops Master Data:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "miscellaneous-crops",
                  "Miscellaneous Crops",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "miscellaneous-crops" ||
                    q.sidebarSubMenu === "miscellaneous-crops"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Miscellaneous Crops
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Floriculture Master Data:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "floriculture",
                  "Cut Flower",
                  "CutFlower"
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "floriculture" ||
                    q.sidebarSubMenu === "floriculture"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Floriculture
                </p>
              </div>
            </div>
          ) : null}
        </div>
        <div
          className={` w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Retail Price Crops:Read"],
            currentUser
          )
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "retail-price-crops" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuCrops("retail-price-crops")}
                >
                  <img
                    src="/doa/images/crops-retail-price.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Retail Price
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuCrops("retail-price-crops")}
              >
                <img
                  src="/doa/images/crops-retail-price.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Retail Price
                </p>
              </div>
            </div>
          )}

          {menuState === "retail-price-crops" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Vegetable Retail Price:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "vegetable-retail",
                  "Vegetable",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "vegetable-retail" ||
                    q.sidebarSubMenu === "vegetable-retail"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Vegetable
                </p>
              </div>

              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Fruit Retail Price:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops("fruit-retail", "Fruit", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "fruit-retail" ||
                    q.sidebarSubMenu === "fruit-retail"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Fruit
                </p>
              </div>

              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Miscellaneous Crops Retail Price:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "miscellaneous-crops-retail",
                  "Miscellaneous Crops",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "miscellaneous-crops-retail" ||
                    q.sidebarSubMenu === "miscellaneous-crops-retail"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Miscellaneous Crops
                </p>
              </div>
            </div>
          ) : null}
        </div>
        {/* <div
          className={`w-full mb-4 pr-2 ${
            !currentUserDontHavePrivilege(
              ["Retail Price Crops:Read"],
              currentUser
            )
              ? "block"
              : "hidden"
          }`}
        >
          {menuState === "retail-price-crops" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuCrops("retail-price-crops")}
                >
                  <img
                    src="/doa/images/crops-retail-price.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Retail Price
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuCrops("retail-price-crops")}
              >
                <img
                  src="/doa/images/crops-retail-price.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Retail Price
                </p>
              </div>
            </div>
          )}
        </div> */}

        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Profiling Crops:Read"], currentUser)
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "profiling-crops" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuCrops("profiling-crops")}
                >
                  <img
                    src="/doa/images/crops-profiling.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Profiling
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuCrops("profiling-crops")}
              >
                <img
                  src="/doa/images/crops-profiling.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Profiling
                </p>
              </div>
            </div>
          )}
          {menuState === "profiling-crops" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Dashboard Profiling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops("dashboard-profiling-crops", "Dashboard", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "dashboard-profiling-crops" ||
                    q.sidebarSubMenu === "dashboard-profiling-crops"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Dashboard
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer hidden ${!currentUserDontHavePrivilege(
                  ["Supplier Profiling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops("supplier", "Supplier", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "supplier" ||
                    q.sidebarSubMenu === "supplier"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Supplier
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer hidden ${!currentUserDontHavePrivilege(
                  ["Machinery Profiling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops("machinery", "Machinery", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "machinery" ||
                    q.sidebarSubMenu === "machinery"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Machinery
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Company Status Profiling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "company-status",
                  "Company Status",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "company-status" ||
                    q.sidebarSubMenu === "company-status"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2 `}
                >
                  Company Status
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Race Profiling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops("race", "Race", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "race" || q.sidebarSubMenu === "race"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Race
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Planting System Profiling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "planting-system",
                  "Planting System",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "planting-system" ||
                    q.sidebarSubMenu === "planting-system"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Planting System
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege([
                  "Farming System Profiling Crops:Read",
                ])
                  ? ""
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "farming-system",
                  "Farming System",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "farming-system" ||
                    q.sidebarSubMenu === "farming-system"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2 `}
                >
                  Farming System
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Commodity Type Profiling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "comodity-type",
                  "Commodity Type",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "comodity-type" ||
                    q.sidebarSubMenu === "comodity-type"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Commodity Type
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Award Type Profiling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops("award-type", "Award Type", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "award-type" ||
                    q.sidebarSubMenu === "award-type"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Award Type
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Land Ownership Status Profiling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "land-ownership-status",
                  "Land Ownership Status",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "land-ownership-status" ||
                    q.sidebarSubMenu === "land-ownership-status"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Land Ownership Status
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Irrigation Status Profiling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "irigation-status",
                  "Irrigation Status",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "irigation-status" ||
                    q.sidebarSubMenu === "irigation-status"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Irrigation Status
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Support Type Profiling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "support-type",
                  "Support Type",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "support-type" ||
                    q.sidebarSubMenu === "support-type"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Support Type
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Type Company Reg Profiling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "type-company-reg",
                  "Type Company Reg",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "type-company-reg" ||
                    q.sidebarSubMenu === "type-company-reg"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Type of Company Reg
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Current Status Profiling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "current-status",
                  "Current Status",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "current-status" ||
                    q.sidebarSubMenu === "current-status"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Current Status
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Contract Status Profiling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "contract-status",
                  "Contract Status",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "contract-status" ||
                    q.sidebarSubMenu === "contract-status"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Contract Status
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Farmer Profiling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "farmer-profile",
                  "Farmer Profile ",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "farmer-profile" ||
                    q.sidebarSubMenu === "farmer-profile"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Farmer Profile
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Farm Profiling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "farm-profile",
                  "Farm Profile",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "farm-profile" ||
                    q.sidebarSubMenu === "farm-profile"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Farm Profile
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Modern Technology Profiling Crops:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubCrops(
                  "modern-technology",
                  "Modern Technology",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "modern-technology" ||
                    q.sidebarSubMenu === "modern-technology"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Modern Technology
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {/*THIS IS FOR AGRIFOOD APPS */}
      <div
        className={`${router.query.appState === "Agrifood" ? "block" : "hidden"
          }`}
      >
        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Dashboard Agrifood:Read"],
            currentUser
          )
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "dashboard-agrifood" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuAgrifood("dashboard-agrifood")}
                >
                  <img
                    src="/doa/images/agrifood-dashboard.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Dashboard
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuAgrifood("dashboard-agrifood")}
              >
                <img
                  src="/doa/images/agrifood-dashboard.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Dashboard
                </p>
              </div>
            </div>
          )}
        </div>
        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Production Agrifood:Read"],
            currentUser
          )
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "production-agrifood" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuAgrifood("production-agrifood")}
                >
                  <img
                    src="/doa/images/agrifood-production.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Production
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuAgrifood("production-agrifood")}
              >
                <img
                  src="/doa/images/agrifood-production.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Production
                </p>
              </div>
            </div>
          )}
        </div>
        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Product Catalogue:Read"],
            currentUser
          )
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "product-catalogue-agrifood" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuAgrifood(
                    "product-catalogue-agrifood"
                  )}
                >
                  <img
                    src="/doa/images/agrifood-catalogue.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Product Catalogue
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuAgrifood(
                  "product-catalogue-agrifood"
                )}
              >
                <img
                  src="/doa/images/agrifood-catalogue.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Product Catalogue
                </p>
              </div>
            </div>
          )}
        </div>
        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["SEFI Rental:Read"], currentUser)
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "sefi-rental-agrifood" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuAgrifood("sefi-rental-agrifood")}
                >
                  <img
                    src="/doa/images/agrifood-sefi-rental.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    SEFI Rental
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuAgrifood("sefi-rental-agrifood")}
              >
                <img
                  src="/doa/images/agrifood-sefi-rental.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  SEFI Rental
                </p>
              </div>
            </div>
          )}
        </div>
        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Food Sampling:Read"], currentUser)
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "food-sampling-agrifood" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuAgrifood("food-sampling-agrifood")}
                >
                  <img
                    src="/doa/images/agrifood-food-sampling.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Food Sampling
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuAgrifood("food-sampling-agrifood")}
              >
                <img
                  src="/doa/images/agrifood-food-sampling.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Food Sampling
                </p>
              </div>
            </div>
          )}
        </div>
        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Master Data Agrifood:Read"],
            currentUser
          )
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "master-data-agrifood" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuAgrifood("master-data-agrifood")}
                >
                  <img
                    src="/doa/images/master-data.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Master Data
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuAgrifood("master-data-agrifood")}
              >
                <img
                  src="/doa/images/master-data.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Master Data
                </p>
              </div>
            </div>
          )}
          {menuState === "master-data-agrifood" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Machinery Agrifood:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubAgrifood("machinery", "Machinery", "")}
              >
                <p
                  className={`${subMenuState === "machinery" ||
                    q.sidebarSubMenu === "machinery"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Machinery
                </p>
              </div>

              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Test Agrifood:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubAgrifood("test", "Test", "")}
              >
                <p
                  className={`${subMenuState === "test" || q.sidebarSubMenu === "test"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Test
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["SEFI Rental Machinaries:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubAgrifood(
                  "sefi-rental-machinaries",
                  "SEFI Rental Machinaries",
                  ""
                )}
              >
                <p
                  className={`${subMenuState === "sefi-rental-machinaries" ||
                    q.sidebarSubMenu === "sefi-rental-machinaries"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  SEFI Rental Machinaries
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Product Category:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubAgrifood(
                  "product-category",
                  "Product Category",
                  ""
                )}
              >
                <p
                  className={`${subMenuState === "product-category" ||
                    q.sidebarSubMenu === "product-category"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Product Category
                </p>
              </div>

              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Sub Product Category:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubAgrifood(
                  "product-sub-category",
                  "Sub Product Category",
                  ""
                )}
              >
                <p
                  className={`${subMenuState === "product-sub-category" ||
                    q.sidebarSubMenu === "product-sub-category"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Sub Product Category
                </p>
              </div>

              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Type Of Analysis:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubAgrifood(
                  "type-of-analysis",
                  "Type of Analysis",
                  ""
                )}
              >
                <p
                  className={`${subMenuState === "type-of-analysis" ||
                    q.sidebarSubMenu === "type-of-analysis"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Type of Analysis
                </p>
              </div>

              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(["Unit:Read"], currentUser)
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubAgrifood("unit", "Unit", "")}
              >
                <p
                  className={`${subMenuState === "unit" || q.sidebarSubMenu === "unit"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Unit
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(["Condition:Read"], currentUser)
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubAgrifood("condition", "Condition", "")}
              >
                <p
                  className={`${subMenuState === "condition" ||
                    q.sidebarSubMenu === "condition"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Condition
                </p>
              </div>
            </div>
          ) : null}
        </div>
        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Profiling Agrifood:Read"],
            currentUser
          )
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "profiling-agrifood" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuAgrifood("profiling-agrifood")}
                >
                  <img
                    src="/doa/images/profiling.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Profiling
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuAgrifood("profiling-agrifood")}
              >
                <img src="/doa/images/profiling.svg" className="h-10 w-auto" />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Profiling
                </p>
              </div>
            </div>
          )}
          {menuState === "profiling-agrifood" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Company Status Agrifood:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubAgrifood(
                  "company-status",
                  "Company Status",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "company-status" ||
                    q.sidebarSubMenu === "company-status"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2 `}
                >
                  Company Status
                </p>
              </div>

              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(["Location:Read"], currentUser)
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubAgrifood("location", "Location", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "location" ||
                    q.sidebarSubMenu === "location"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Location
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Position Profiling Agrifood:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubAgrifood("position", "Position", "")}
              >
                <p
                  className={`${subMenuState === "position" ||
                    q.sidebarSubMenu === "position"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2 `}
                >
                  Position
                </p>
              </div>

              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Race Profiling Agrifood:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubAgrifood("race", "Race", "")}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "race" || q.sidebarSubMenu === "race"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Race
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Award Type Profiling Agrifood:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubAgrifood(
                  "award-type",
                  "Award Type",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "award-type" ||
                    q.sidebarSubMenu === "award-type"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Award Type
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Contract Status Profiling Agrifood:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubAgrifood(
                  "contract-status",
                  "Contract Status",
                  ""
                )}
              >
                {/* <img src="/doa/images/sidebar-icon-beranda-button.svg" /> */}
                <p
                  className={`${subMenuState === "contract-status" ||
                    q.sidebarSubMenu === "contract-status"
                    ? "text-mantis-600"
                    : "text-black"
                    } font-bold text-lg md:text-sm  mx-2`}
                >
                  Contract Status
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Premise Profile:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubAgrifood(
                  "premise-profile",
                  "Premise Profile",
                  ""
                )}
              >
                <p
                  className={`${subMenuState === "premise-profile" ||
                    q.sidebarSubMenu === "premise-profile"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2 `}
                >
                  Premise Profile
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Company Profile Profiling Agrifood:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubAgrifood(
                  "company-profile",
                  "Company Profile",
                  ""
                )}
              >
                <p
                  className={`${subMenuState === "company-profile" ||
                    q.sidebarSubMenu === "company-profile"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Company Profile
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {/*THIS IS FOR BIO SECURITY APPS */}
      <div
        className={`${router.query.appState === "Bio Security" ? "block" : "hidden"
          }`}
      >
        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Dashboard Bio Security:Read"],
            currentUser
          )
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "dashboard-biosecurity" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuBiosecurity(
                    "dashboard-biosecurity"
                  )}
                >
                  <img
                    src="/doa/images/agrifood-dashboard.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Dashboard
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuBiosecurity("dashboard-biosecurity")}
              >
                <img
                  src="/doa/images/agrifood-dashboard.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Dashboard
                </p>
              </div>
            </div>
          )}
        </div>
        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(["Import Data:Read"], currentUser)
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "importData-biosecurity" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuBiosecurity(
                    "importData-biosecurity"
                  )}
                >
                  <img
                    src="/doa/images/bio-security-import.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Import Data
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuBiosecurity("importData-biosecurity")}
              >
                <img
                  src="/doa/images/bio-security-import.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Import Data
                </p>
              </div>
            </div>
          )}
        </div>
        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Non Compliance & Enforcement:Read"],
            currentUser
          )
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "nonComplianceEnforcement-biosecurity" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuBiosecurity(
                    "nonComplianceEnforcement-biosecurity"
                  )}
                >
                  <img
                    src="/doa/images/bio-security-enforcement.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Non Compliance & Enforcement
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuBiosecurity(
                  "nonComplianceEnforcement-biosecurity"
                )}
              >
                <img
                  src="/doa/images/bio-security-enforcement.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Non Compliance & Enforcement
                </p>
              </div>
            </div>
          )}
        </div>
        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Master Data Bio Security:Read"],
            currentUser
          )
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "master-data-biosecurity" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuBiosecurity(
                    "master-data-biosecurity"
                  )}
                >
                  <img
                    src="/doa/images/master-data.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Master Data
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuBiosecurity(
                  "master-data-biosecurity"
                )}
              >
                <img
                  src="/doa/images/master-data.svg"
                  className="h-10 w-auto"
                />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Master Data
                </p>
              </div>
            </div>
          )}
          {menuState === "master-data-biosecurity" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(["Category:Read"], currentUser)
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubBiosecurity(
                  "category",
                  "Category",
                  ""
                )}
              >
                <p
                  className={`${subMenuState === "category" ||
                    q.sidebarSubMenu === "category"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Category
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Sub Category:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubBiosecurity(
                  "sub-category",
                  "Sub Category",
                  ""
                )}
              >
                <p
                  className={`${subMenuState === "sub-category" ||
                    q.sidebarSubMenu === "sub-category"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Sub Category
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Unit Bio Security:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubBiosecurity("unit", "Unit", "")}
              >
                <p
                  className={`${subMenuState === "unit" || q.sidebarSubMenu === "unit"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Unit
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Type Of Comodity:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubBiosecurity(
                  "type-of-comodity",
                  "Type of Commodity",
                  ""
                )}
              >
                <p
                  className={`${subMenuState === "type-of-comodity" ||
                    q.sidebarSubMenu === "type-of-comodity"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Type of Commodity
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Country Bio Security:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubBiosecurity("country", "Country", "")}
              >
                <p
                  className={`${subMenuState === "country" || q.sidebarSubMenu === "country"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Country
                </p>
              </div>

              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Compliance:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubBiosecurity(
                  "compliance",
                  "Compliance",
                  ""
                )}
              >
                <p
                  className={`${subMenuState === "compliance" ||
                    q.sidebarSubMenu === "compliance"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Compliance
                </p>
              </div>

              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Taken Action:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubBiosecurity(
                  "taken-action",
                  "Taken Action",
                  ""
                )}
              >
                <p
                  className={`${subMenuState === "taken-action" ||
                    q.sidebarSubMenu === "taken-action"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Taken Action
                </p>
              </div>
            </div>
          ) : null}
        </div>
        <div
          className={`w-full mb-4 pr-2 ${!currentUserDontHavePrivilege(
            ["Profiling Bio Security:Read"],
            currentUser
          )
            ? "block"
            : "hidden"
            }`}
        >
          {menuState === "profiling-biosecurity" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuBiosecurity(
                    "profiling-biosecurity"
                  )}
                >
                  <img
                    src="/doa/images/profiling.svg"
                    className="h-10 w-auto"
                  />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Profiling
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuBiosecurity("profiling-biosecurity")}
              >
                <img src="/doa/images/profiling.svg" className="h-10 w-auto" />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Profiling
                </p>
              </div>
            </div>
          )}
          {menuState === "profiling-biosecurity" ? (
            <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Company Profile Profiling Bio Security:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubBiosecurity(
                  "company-profile",
                  "Company Profile",
                  ""
                )}
              >
                <p
                  className={`${subMenuState === "company-profile" ||
                    q.sidebarSubMenu === "company-profile"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Company Profile
                </p>
              </div>
              <div
                className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${!currentUserDontHavePrivilege(
                  ["Individual / Personal Profile:Read"],
                  currentUser
                )
                  ? "block"
                  : "hidden"
                  }`}
                onClick={selectSidebarSubBiosecurity(
                  "individual-personal-profile",
                  "Individual / Personal Profile",
                  ""
                )}
              >
                <p
                  className={`${subMenuState === "individual-personal-profile" ||
                    q.sidebarSubMenu === "individual-personal-profile"
                    ? "text-mantis-600"
                    : "text-black"
                    }
                font-bold text-lg md:text-sm mx-2`}
                >
                  Individual / Personal Profile
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {/*THIS IS FOR USER MANAGEMENT */}
      <div
        className={`w-full mb-4 pr-2
          ${!currentUserDontHavePrivilege(
          ["User Management:Read"],
          currentUser
        ) && router.query.appState === "User Management"
            ? "block"
            : "hidden"
          }`}
      >
        <div className={`w-full mb-4 pr-2`}>
          {menuState === "user-roles-user-management" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuUserManagement(
                    "user-roles-user-management"
                  )}
                >
                  <img src="/doa/images/user-management.svg" className="h-10" />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    User Roles
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuUserManagement(
                  "user-roles-user-management"
                )}
              >
                <img src="/doa/images/user-management.svg" className="h-10" />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  User Roles
                </p>
              </div>
            </div>
          )}
        </div>
        <div
          className={`w-full mb-4 pr-2
        ${!currentUserDontHavePrivilege(["User Management:Read"], currentUser)
              ? "block"
              : "hidden"
            }
        `}
        >
          {menuState === "user-admin-user-management" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuUserManagement(
                    "user-admin-user-management"
                  )}
                >
                  <img src="/doa/images/user-management.svg" className="h-10" />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    User Admin (Officer)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuUserManagement(
                  "user-admin-user-management"
                )}
              >
                <img src="/doa/images/user-management.svg" className="h-10" />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  User Admin (Officer)
                </p>
              </div>
            </div>
          )}
        </div>

        <div
          className={`w-full mb-4 pr-2
        ${!currentUserDontHavePrivilege(["User Management:Read"], currentUser)
              ? "block"
              : "hidden"
            }
        `}
        >
          {menuState === "user-farmer-management" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuUserManagement(
                    "user-farmer-management"
                  )}
                >
                  <img src="/doa/images/user-management.svg" className="h-10" />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    User (Farmer)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuUserManagement(
                  "user-farmer-management"
                )}
              >
                <img src="/doa/images/user-management.svg" className="h-10" />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  User (Farmer)
                </p>
              </div>
            </div>
          )}
        </div>
        <div
          className={`w-full mb-4 pr-2
        ${!currentUserDontHavePrivilege(
            ["Farmer Registration:Read"],
            currentUser
          )
              ? "block"
              : "hidden"
            }
        `}
        >
          {menuState === "farmer-registration-form" ? (
            <div>
              <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                <div
                  className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                  onClick={selectSidebarMenuUserManagement(
                    "farmer-registration-form"
                  )}
                >
                  <img src="/doa/images/user-management.svg" className="h-10" />
                  <p
                    className={"text-black font-bold text-lg md:text-sm  mx-2"}
                  >
                    Farmer Registration Form
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                onClick={selectSidebarMenuUserManagement(
                  "farmer-registration-form"
                )}
              >
                <img src="/doa/images/user-management.svg" className="h-10" />
                <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
                  Farmer Registration Form
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="pl-4 mb-4 hidden">
        {!currentUserDontHavePrivilege(
          ["User Management Only For Farmer:Read"],
          currentUser
        ) ? (
          <div
            className={`px-4 py-2 flex items-center rounded-l-lg cursor-pointer hover:bg-gray-100
            ${currentUser._id !== "__ROOT__" ? "" : "hidden"}
            `}
            onClick={(e) => {
              if (e) e.preventDefault();
              router.replace({
                pathname: "/user-farmer-management-by-farmer",
                query: {
                  sidebarMenu: "user-farmer-management-by-farmer",
                  appState: "User Management",
                },
              });
            }}
          >
            <i className="fa fa-info" />
            <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
              Farmer Info
            </p>
          </div>
        ) : (
          ""
        )}
      </div>

      <div
        className={`px-4 py-2 flex items-center rounded-l-lg cursor-pointer hover:bg-gray-100 hiddend`}
        onClick={(e) => {
          if (e) e.preventDefault();
          window.location.href = "/doa/logout";
        }}
      >
        <i className="fa fa-arrow-left" />
        <p className={"text-black font-bold text-lg md:text-sm  mx-2"}>
          Logout
        </p>
      </div>
    </div>
  );
};
export default Sidebar;
