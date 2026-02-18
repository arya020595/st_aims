import React, { useState, useMemo } from "react";
import UserCard from "../components/UserCard";
import { Scrollbar } from "react-scrollbars-custom";
import LoginModal from "../components/LoginModal";
import gql from "graphql-tag";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import FadeImage from "../components/FadeImage";
import { motion, AnimatePresence } from "framer-motion";

const CURRENT_USER = gql`
  query currentUser {
    currentUser {
      _id
      username
      name
      phone
      email
      profileImageUrl
      _updatedAt
      Organizations {
        _id
        name
        address
        logoUrl
      }
    }
    allMyWaitingMemberships {
      _id
      status
      Organization {
        _id
        name
        address
        logoUrl
      }
    }
    myChurchMemberships {
      _id
      role
      status
      Organization {
        _id
        name
        description
        address
        email
        phone
        type
        logoUrl
      }
    }
  }
`;

const CustomScrollbar = ({ autoHide, children, ...props }) => {
  const [inUse, setInUse] = useState();
  const style = {
    style: autoHide && {
      marginTop: -10,
      // display: inUse ? null : "none",
      opacity: inUse ? 1 : 0,
      transition: "opacity 0.3s ease-in-out",
      width: 7,
    },
  };
  // console.log({ style, inUse });

  return (
    <Scrollbar
      trackXProps={style}
      trackYProps={style}
      onMouseEnter={autoHide && (() => setInUse(true))}
      onMouseLeave={autoHide && (() => setInUse(false))}
      // compensateScrollbarsWidth={false}
      disableTracksWidthCompensation
      {...props}
    >
      {children}
    </Scrollbar>
  );
};

const UserArea = ({ children }) => {
  let { loading, error, data, refetch } = useQuery(CURRENT_USER, {});
  const router = useRouter();

  let currentUser = {
    Organizations: [],
  };
  if (data && data.currentUser) {
    currentUser = {
      ...data.currentUser,
    };
    if (data.myChurchMemberships) {
      currentUser.Organizations = data.myChurchMemberships
        .filter(
          (member) =>
            member.status === "Aktif" &&
            (member.role === "Manager" || member.role === "Trusted Advisor")
        )
        .map((member) => member.Organization);
    }
  }

  let allMyWaitingMemberships = [];
  if (data && data.allMyWaitingMemberships) {
    allMyWaitingMemberships = data.allMyWaitingMemberships;
  }

  const [loginModalVisible, setLoginModalVisible] = useState(false);
  return (
    <>
      <LoginModal
        visible={loginModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setLoginModalVisible(false);
        }}
        onLoginSuccess={(userSession) => {
          const { referenceEmail, ...query } = router.query;
          window.location.href =
            window.location.origin +
            window.location.pathname +
            "?" +
            Object.keys(query)
              .map((key) => key + "=" + (query[key] || ""))
              .join("&");

          // const { User } = userSession;
          // if (!User.foundCheckPoint) {
          //   redirect({}, "/create-community");
          // } else {
          //   router.push("/dashboard");
          // }
        }}
        onLoginError={(error) => {
          console.warn(error);
        }}
      />

      <div className="flex md:container pb-12 md:pb-0">
        <div className="w-1/4 hidden md:block h-auto overflow-y-visible inset-0 flex-none">
          <div className="sticky top-0 h-screen w-full no-scrollbars">
            <div className="pt-20 pb-16 overflow-hidden h-full">
              <div className="sticky top-0 z-10 mb-2">
                <UserCard
                  onClick={(e) => {
                    if (e) e.preventDefault();
                    if (!currentUser._id) {
                      setLoginModalVisible(true);
                    } else {
                      router.push(`/profile`);
                    }
                  }}
                />
              </div>

              <CustomScrollbar
                autoHide
                style={{
                  width: "100%",
                  height: "100%",
                }}
              >
                {currentUser._id && currentUser.Organizations ? (
                  <ActionButtons
                    initialCollapsed={currentUser.Organizations.length > 0}
                  />
                ) : null}

                {currentUser.Organizations &&
                currentUser.Organizations.length > 0 ? (
                  <List>
                    <ListTitle>
                      <div className="flex justify-between items-center">
                        <div className="text-md font-bold text-blue-500">
                          Organisasi Saya
                        </div>
                        <a
                          href="/manager"
                          className="text-sm text-blue-500 hover:opacity-50 transition duration-200"
                        >
                          Lihat Semua
                        </a>
                      </div>
                    </ListTitle>

                    {currentUser.Organizations?.map((org) => (
                      <ListItem key={org._id}>
                        <a
                          href={"/manager/" + org._id}
                          className="flex flex-row items-center flex-wrap py-2 px-5"
                        >
                          <ListImage>
                            <FadeImage
                              size="150xAUTO"
                              className="w-20 pt-1 object-cover object-center rounded-lg"
                              src={org.logoUrl || "/images/org/church.jpg"}
                            />
                          </ListImage>
                          <ListContent>
                            <div className="text-sm font-bold text-gray-500 truncate">
                              {org.name}
                            </div>
                            {org.address ? (
                              <div className="text-xs text-gray-400 mt-1 truncate">
                                <i className="fa fa-map-marker-alt"></i>&nbsp;
                                {org.address}
                              </div>
                            ) : null}
                          </ListContent>
                          <ListIcon>
                            <i className="fa fa-chevron-right text-blue-500 text-lg"></i>
                          </ListIcon>
                        </a>
                      </ListItem>
                    ))}
                  </List>
                ) : null}

                {allMyWaitingMemberships &&
                allMyWaitingMemberships.length > 0 ? (
                  <List>
                    <ListTitle>
                      <div className="text-md font-bold text-blue-500">
                        Menunggu Konfirmasi
                      </div>
                    </ListTitle>

                    {allMyWaitingMemberships?.map((member) => (
                      <ListItem key={member.Organization?._id}>
                        <a
                          href={"/manager/" + member.Organization?._id}
                          className="flex flex-row items-center flex-wrap py-2 px-5"
                        >
                          <ListImage>
                            <FadeImage
                              className="w-20 pt-1 object-cover object-center rounded-lg"
                              src={
                                member.Organization?.logoUrl ||
                                "/images/org/church.jpg"
                              }
                            />
                          </ListImage>
                          <ListContent>
                            <div className="text-sm font-bold text-gray-500 truncate">
                              {member.Organization?.name}
                            </div>
                            {member.Organization?.address ? (
                              <div className="text-xs text-gray-400 mt-1 truncate">
                                <i className="fa fa-map-marker-alt"></i>&nbsp;
                                {member.Organization?.address}
                              </div>
                            ) : null}
                          </ListContent>
                          <ListIcon>
                            <i className="fa fa-chevron-right text-blue-500 text-lg"></i>
                          </ListIcon>
                        </a>
                      </ListItem>
                    ))}
                  </List>
                ) : null}
              </CustomScrollbar>
            </div>
          </div>
        </div>

        <div className="w-full pt-16 md:w-3/4 md:pl-12 md:pt-20 h-full">
          {children}
        </div>
      </div>
    </>
  );
};

export default UserArea;

export const List = ({ children }) => {
  return (
    <div className="shadow-lg rounded-lg bg-white hover:shadow-lg mt-2 mb-5">
      {children}
    </div>
  );
};

const ListItem = ({ children }) => {
  return (
    <div className="border-t border-gray-200 transition duration-500 hover:bg-blue-100">
      {children}
    </div>
  );
};

const ListTitle = ({ children }) => {
  return <div className="py-4 px-5">{children}</div>;
};

const ListImage = ({ children }) => {
  return <div className="w-2/12 flex items-center">{children}</div>;
};

const ListContent = ({ children }) => {
  return <div className="w-9/12 py-3 px-4">{children}</div>;
};

const ListIcon = ({ children }) => {
  return <div className="py-5 w-1/12 text-right">{children}</div>;
};

const ActionButtons = ({ initialCollapsed = false }) => {
  const router = useRouter();
  const [actionMenuVisible, setActionMenuVisible] = useState(!initialCollapsed);
  // console.log({
  //   initialCollapsed,
  //   actionMenuVisible,
  // });

  const MENU = useMemo(
    () => [
      {
        link: "/manager/register-organization",
        label: "Organisasi",
        description: "Buat organisasi dan mulai berkarya",
        icon: "university",
        baseColor: "hover:bg-primary-300",
        activeBaseColor: "bg-primary-400",
        iconColor: "group-hover:bg-primary-600",
        activeIconColor: "bg-primary-600",
      },
      {
        link: "/manager/create-event",
        label: "Event",
        description: "Buat event untuk pertemuan dan ibadah setiap minggu",
        icon: "calendar-alt",
        baseColor: "hover:bg-purple-300",
        activeBaseColor: "bg-purple-400",
        iconColor: "group-hover:bg-purple-600",
        activeIconColor: "bg-purple-600",
      },
      {
        link: "/manager/create-article",
        label: "Artikel",
        description: "Tulis cerita, berbagi berkat dan kabar baik",
        icon: "pen-alt",
        baseColor: "hover:bg-red-300",
        activeBaseColor: "bg-red-400",
        iconColor: "group-hover:bg-red-600",
        activeIconColor: "bg-red-600",
      },
      // {
      //   link: "/manager/register-organization",
      //   label: "Grup",
      //   description:
      //     "Ciptakan ruang untuk diskusi dan berbagi, lebih tak terbatas",
      //   icon: "users",
      //   baseColor: "hover:bg-yellow-300",
      //   activeBaseColor: "bg-yellow-400",
      //   iconColor: "group-hover:bg-yellow-600",
      //   activeIconColor: "bg-yellow-600",
      // },
      {
        link: "/manager/create-classroom",
        label: "Kelas",
        description: "Buat kelas untuk pertumbuhan rohani jemaat dan komunitas",
        icon: "chalkboard-teacher",
        baseColor: "hover:bg-cyan-300",
        activeBaseColor: "bg-cyan-400",
        iconColor: "group-hover:bg-cyan-600",
        activeIconColor: "bg-cyan-600",
      },
    ],
    []
  );

  return (
    <motion.div
      variants={{
        collapsed: {
          height: 60,
        },
        expanded: {
          height: "auto",
        },
      }}
      animate={actionMenuVisible ? "expanded" : "collapsed"}
      transition={{ duration: 0.2 }}
      className="w-full bg-white z-20 rounded-md shadow-md overflow-hidden mt-4 px-1 pb-2 mb-8"
    >
      <a
        href="#"
        className="flex justify-between items-center px-4 mb-2 group border-b border-blue-200"
        onClick={(e) => {
          if (e) e.preventDefault();
          setActionMenuVisible(!actionMenuVisible);
        }}
      >
        <div className="text-xl font-semibold py-4 font-inter transition duration-200 text-gray-500 group-hover:text-black">
          Buat Sesuatu
        </div>
        <div
          className={`flex items-center justify-center rounded-full transition duration-200 bg-gray-100 group-hover:bg-gray-200 h-8 w-8 text-lg ${
            actionMenuVisible ? "opacity-25" : ""
          }`}
        >
          <i className="fa fa-caret-down" />
        </div>
      </a>
      {MENU.map((menu) => {
        const active = menu.isActive
          ? menu.isActive({
              router,
              menu,
            })
          : router.pathname.startsWith(menu.link);
        // console.log({ active });
        return (
          <a
            href={menu.link}
            key={menu.label}
            className={`${
              active ? "shadow-lg text-white" : "text-gray-500 hover:text-black"
            } group hover:font-bold rounded transition duration-200 ${
              active ? menu.activeBaseColor : menu.baseColor
            } px-3 py-2 flex items-center mx-1 my-1`}
          >
            <div
              className={`flex-none bg-gray-100 transition duration-200 ${
                active ? menu.activeIconColor : menu.iconColor
              } h-10 w-10 rounded-full mr-4 flex justify-center items-center`}
            >
              <i
                className={`text-sm transition duration-200 group-hover:text-white fa fa-${menu.icon}`}
              ></i>
            </div>
            <div className="text-sm whitespace-normal leading-4">
              <span className="font-bold">{menu.label}</span>
              <br />
              <span className="font-light text-xs">{menu.description}</span>
            </div>
          </a>
        );
      })}
    </motion.div>
  );
};
