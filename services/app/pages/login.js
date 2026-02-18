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

import redirect from "../libs/redirect";
import checkLoggedIn from "../libs/checkLoggedIn";
import gql from "graphql-tag";
import { useMutation, useApolloClient, ApolloProvider } from "@apollo/client";
import { FormModal } from "../components/Modal";
import cookie from "cookie";
import { useRouter } from "next/dist/client/router";
import ms from "ms";
import lodash, { result } from "lodash";
import { customAlphabet } from "nanoid";
import Select from "react-select";
const nanoid = customAlphabet("1234567890abcdef", 10);
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const UNIT_OFFICER = [
  {
    label: "Bahagian Dasar, Pengurusan & Kewangan",
    value: "Bahagian Dasar, Pengurusan & Kewangan",
  },
  {
    label: "Seksyen Pengurusan Statistik dan SIPA",
    value: "Seksyen Pengurusan Statistik dan SIPA",
  },
  { label: "Unit Pengurusan Statistik", value: "Unit Pengurusan Statistik" },
  {
    label: "Unit Pengurusan Maklumat dan SIPA",
    value: "Unit Pengurusan Maklumat dan SIPA",
  },
  { label: "Bahagian Industri Tanaman", value: "Bahagian Industri Tanaman" },
  {
    label: "Seksyen Kemajuan Industri Buah dan Kemajuan Pertanian Luar Bandar",
    value: "Seksyen Kemajuan Industri Buah dan Kemajuan Pertanian Luar Bandar",
  },
  {
    label: "Unit Kemajuan Industri Pelbagai Tanaman",
    value: "Unit Kemajuan Industri Pelbagai Tanaman",
  },
  {
    label: "Unit Kemajuan Industri Buah",
    value: "Unit Kemajuan Industri Buah",
  },
  {
    label: "Unit Kemajuan Pertanian Luar Bandar",
    value: "Unit Kemajuan Pertanian Luar Bandar",
  },
  {
    label: "Unit Kemajuan Industri Sayur",
    value: "Unit Kemajuan Industri Sayur",
  },
  {
    label: "Unit Kemajuan Industri Florikultur",
    value: "Unit Kemajuan Industri Florikultur",
  },
  { label: "Seksyen Industri Padi", value: "Seksyen Industri Padi" },
  {
    label: "Unit Kemajuan Industri Padi",
    value: "Unit Kemajuan Industri Padi",
  },
  { label: "Unit Biji Benih Padi", value: "Unit Biji Benih Padi" },
  {
    label: "Unit  Pengurusan Tapak Pertanian",
    value: "Unit  Pengurusan Tapak Pertanian",
  },
  {
    label: "Bahagian Industri Ternakan dan Perkhidmatan Veterinar",
    value: "Bahagian Industri Ternakan dan Perkhidmatan Veterinar",
  },
  {
    label: "Seksyen Pembangunan Industri Ternakan",
    value: "Seksyen Pembangunan Industri Ternakan",
  },
  {
    label: "Unit Kemajuan Industri Ternakan",
    value: "Unit Kemajuan Industri Ternakan",
  },
  {
    label: "Unit Regulatori dan Penguatkuasaan Veterinar",
    value: "Unit Regulatori dan Penguatkuasaan Veterinar",
  },
  {
    label: "Bahagian Industri Agrimakanan dan Perkidmatan-Perkhidmatan",
    value: "Bahagian Industri Agrimakanan dan Perkidmatan-Perkhidmatan",
  },
  {
    label: "Seksyen Industri Agrimakanan",
    value: "Seksyen Industri Agrimakanan",
  },
  {
    label: "Unit Pasaran dan Pengembangan Industri Agrimakanan",
    value: "Unit Pasaran dan Pengembangan Industri Agrimakanan",
  },
  {
    label: "Unit Perkhidmatan Teknikal & Akreditasi Industri Agrimakanan ",
    value: "Unit Perkhidmatan Teknikal & Akreditasi Industri Agrimakanan ",
  },
  {
    label: "Unit Pembangunan Produk dan Komersialisasi Industri Agrimakanan",
    value: "Unit Pembangunan Produk dan Komersialisasi Industri Agrimakanan",
  },
  {
    label: "Unit Kemajuan Pertanian Daerah Brunei Muara",
    value: "Unit Kemajuan Pertanian Daerah Brunei Muara",
  },
  {
    label: "Unit Kemajuan Pertanian Daerah Tutong",
    value: "Unit Kemajuan Pertanian Daerah Tutong",
  },
  {
    label: "Unit Kemajuan Pertanian Daerah Belait",
    value: "Unit Kemajuan Pertanian Daerah Belait",
  },
  {
    label: "Unit Kemajuan Pertanian Daerah Temburong",
    value: "Unit Kemajuan Pertanian Daerah Temburong",
  },
  {
    label: "Bahagian Biosekuriti dan Akses Pasaran",
    value: "Bahagian Biosekuriti dan Akses Pasaran",
  },
  {
    label: "Bahagian Biosekuriti dan Akses Pasaran (PK Kuala Lurah)",
    value: "Bahagian Biosekuriti dan Akses Pasaran (PK Kuala Lurah)",
  },
  {
    label:
      "Bahagian Biosekuriti dan Akses Pasaran  (PK Pelabohan Muara dan Feri Terminal Serasa)",
    value:
      "Bahagian Biosekuriti dan Akses Pasaran  (PK Pelabohan Muara dan Feri Terminal Serasa)",
  },
  {
    label: "Bahagian Biosekuriti dan Akses Pasaran (PK Airport Cargo)",
    value: "Bahagian Biosekuriti dan Akses Pasaran (PK Airport Cargo)",
  },
  {
    label: "Bahagian Biosekuriti dan Akses Pasaran (PK Sungai Tujoh)",
    value: "Bahagian Biosekuriti dan Akses Pasaran (PK Sungai Tujoh)",
  },
  {
    label: "Bahagian Biosekuriti dan Akses Pasaran (PK Labu dan Ujong Jalan)",
    value: "Bahagian Biosekuriti dan Akses Pasaran (PK Labu dan Ujong Jalan)",
  },
  {
    label: "Seksyen Pengurusan Pemasaran",
    value: "Seksyen Pengurusan Pemasaran",
  },
];
const LIST_APP = [
  {
    name: "Livestock",
    order: 1,
    pathname: "/dashboard",
    query: {
      sidebarMenu: "dashboard",
      appState: "Livestock",
    },
  },
  {
    name: "Crops",
    order: 2,
    pathname: "/vegetable-crops/dashboard",
    query: {
      sidebarMenu: "vegetable",
      appState: "Crops",
    },
  },
  {
    name: "Agrifood",
    order: 3,
    pathname: "/dashboard-agrifood",
    query: {
      sidebarMenu: "dashboard-agrifood",
      appState: "Agrifood",
    },
  },
  {
    name: "Bio Security",
    order: 4,
    pathname: "/dashboard-biosecurity",
    query: {
      sidebarMenu: "dashboard",
      appState: "Bio Security",
    },
  },
  {
    name: "User Mangement",
    order: 5,
    pathname: "/user-admin-user-management",
    query: {
      sidebarMenu: "user-admin-user-management",
      appState: "User Management",
    },
  },
];

const CHECK_USER_PASSWORD = gql`
  mutation checkEmployeeIdAndPassword(
    $employeeId: String!
    $password: String!
  ) {
    checkEmployeeIdAndPassword(employeeId: $employeeId, password: $password)
  }
`;

const CHECK_FARMER_USER_PASSWORD = gql`
  mutation checkFarmerUser($icNo: String!, $password: String!) {
    checkFarmerUser(icNo: $icNo, password: $password)
  }
`;
const FARMER_FORGOT_PASSWORD = gql`
  mutation farmerForgotPassword($tokenized: String!) {
    farmerForgotPassword(tokenized: $tokenized)
  }
`;

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

      appList
    }
  }
`;

const LOGIN_FARMER = gql`
  mutation loginByFarmer($icNo: String!) {
    loginByFarmer(icNo: $icNo) {
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
      appList
    }
  }
`;

const REGISTER_OFFICER = gql`
  mutation registerOfficerUser(
    $username: String!
    $password: String!
    $name: String!
    $icNo: String
    $email: String
    $phone: String
    $controlPost: String
    $district: String
    $registerType: String
    $unit: String
  ) {
    registerOfficerUser(
      username: $username
      password: $password

      name: $name
      icNo: $icNo
      email: $email
      phone: $phone

      controlPost: $controlPost
      district: $district

      registerType: $registerType
      unit: $unit
    ) {
      uuid
    }
  }
`;

const CREATE_FARMER_REGISTRATION_FORM = gql`
  mutation createFarmerRegistrationForm(
    $name: String!
    $icNo: String!
    $password: String
    $doaaRegNo: String
    $rocbnRegNo: String
    $email: String
    $phone: String
  ) {
    createFarmerRegistrationForm(
      name: $name
      icNo: $icNo
      password: $password

      doaaRegNo: $doaaRegNo
      rocbnRegNo: $rocbnRegNo

      email: $email
      phone: $phone
    )
  }
`;
const Page = (props) => {
  const router = useRouter();
  const client = useApolloClient();
  const [checkEmployeeIdAndPassword] = useMutation(CHECK_USER_PASSWORD);
  const [checkFarmerUser] = useMutation(CHECK_FARMER_USER_PASSWORD);
  const [createFarmerRegistrationForm] = useMutation(
    CREATE_FARMER_REGISTRATION_FORM
  );
  const [farmerForgotPassword] = useMutation(FARMER_FORGOT_PASSWORD);

  const [logInByEmployeeId] = useMutation(LOGIN);
  const [loginByFarmer] = useMutation(LOGIN_FARMER);
  const notification = useNotification();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [rocbnRegNo, setRocbnNo] = useState("");
  const [farmerPassword, setFarmerPassword] = useState("");
  const [farmerIcNo, setFarmerIcNo] = useState("");
  const apolloClient = useApolloClient();

  const [loginAs, setLoginAs] = useState("");
  const [farmerForgotPasswordModal, setFarmerForgotPasswordModal] = useState({
    visible: false,
    icNo: "",
    rocbnRegNo: "",
    newPassword: "",
    confirmationPassword: "",
    doaaRegNo: "",
  });

  const [officerRegisterModal, setOfficerRegisterModal] = useState(false);
  const [officerRegisterFormData, setOfficerRegisterFormModal] = useState({});

  const [farmerRegistrationFormModal, setFarmerRegistrationFormModal] =
    useState(false);
  const [farmerRegistartionForm, setFarmerRegistartionForm] = useState({});

  const [registerOfficerUser] = useMutation(REGISTER_OFFICER);

  const handleSubmit = (type) => async (e) => {
    if (e) e.preventDefault();
    showLoadingSpinner();
    try {
      let result = null;

      if (type === "OFFICER") {
        const result = await checkEmployeeIdAndPassword({
          variables: {
            employeeId: username,
            password,
          },
        });
        if (result.data.checkEmployeeIdAndPassword) {
          const tokenChecker = result.data.checkEmployeeIdAndPassword;

          const resultLogin = await logInByEmployeeId({
            variables: {
              employeeId: tokenChecker,
            },
          });

          const { token, expiresIn, User, appList } =
            resultLogin.data.logInByEmployeeId;

          let lists = [];
          for (const list of appList) {
            const found = LIST_APP.find((l) => l.name === list);
            if (found) {
              lists.push(found);
            }
          }

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

          if (lists.length === 1) {
            router.replace({
              pathname: lists[0].pathname,
              query: lists[0].query,
            });
          } else {
            // router.replace({
            //   pathname: "/dashboard",
            //   query: {
            //     sidebarMenu: "dashboard",
            //     appState: "Livestock",
            //   },
            // });
            router.replace({
              pathname: "/landing-dashboard",
              query: {
                // sidebarMenu: "dashboard",
                appState: "Landing Dashboard",
              },
            });
          }
        }
      } else {
        result = await checkFarmerUser({
          variables: {
            icNo: farmerIcNo,
            password: farmerPassword,
          },
        });
        if (result.data.checkFarmerUser) {
          const tokenChecker = result.data.checkFarmerUser;
          const resultLogin = await loginByFarmer({
            variables: {
              icNo: tokenChecker,
            },
          });

          if (resultLogin.data.loginByFarmer.appList.length === 0) {
            throw {
              message: "User roles not set for this account!",
            };
          }

          // let routerObject = {};
          // const applist = resultLogin.data.loginByFarmer.appList;
          // if (applist.includes("Crops")) {
          //   routerObject = {
          //     pathname: "/profiling-crops/farmer-profile",
          //     query: {
          //       sidebarMenu: "profiling-crops",
          //       sidebarSubMenu: "farmer-profile",
          //       sidebarSubMenuName: "Farmer Profile",
          //       componentName: "",
          //       appState: "Crops",
          //     },
          //   };
          // }
          // if (applist.includes("Livestock")) {
          //   routerObject = {
          //     pathname: "/profiling-livestock/farmer-profile",
          //     query: {
          //       sidebarMenu: "profiling-livestock",
          //       sidebarSubMenu: "farmer-profile",
          //       sidebarSubMenuName: "Farmer Profile",
          //       componentName: "",
          //       appState: "Livestock",
          //     },
          //   };
          // }

          const { token, expiresIn, User } = resultLogin.data.loginByFarmer;
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
            pathname: "/landing-dashboard",
            query: {
              // sidebarMenu: "dashboard",
              appState: "Landing Dashboard",
            },
          });

          // router.replace(routerObject);
        }
      }
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  const hasNumber = (str) => {
    return /\d/.test(str);
  };
  const containsSpecialChars = (str) => {
    const specialChars = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    return specialChars.test(str);
  };

  return (
    <div>
      <Head>
        <title>Login | {appConfig.name}</title>
      </Head>

      <FormModal
        title={`Forgot Password`}
        visible={farmerForgotPasswordModal.visible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setFarmerForgotPasswordModal({
            visible: false,
            icNo: "",
            rocbnRegNo: "",
            newPassword: "",
            doaaRegNo: "",
            confirmationPassword: "",
          });
        }}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let tokenizedPayload = {
              ...farmerForgotPasswordModal,
            };
            if (
              tokenizedPayload.newPassword !==
              tokenizedPayload.confirmationPassword
            ) {
              throw {
                message: "Password does not match!",
              };
            }

            if (
              !tokenizedPayload.newPassword ||
              !tokenizedPayload.confirmationPassword
            ) {
              throw {
                message: "Password and confirmation password are required!",
              };
            }
            if (tokenizedPayload.newPassword.length < 8) {
              throw {
                message: "Password at least 8 characters",
              };
            }

            const containSpecial = containsSpecialChars(
              tokenizedPayload.newPassword
            );
            if (!containSpecial) {
              throw {
                message: "Must contain special character such as @,!,&,$,%",
              };
            }

            delete tokenizedPayload.confirmationPassword;
            const tokenized = jwt.sign(tokenizedPayload, TOKENIZE);

            await farmerForgotPassword({
              variables: {
                tokenized,
              },
            });
            notification.addNotification({
              title: "Success",
              message: "Update Password Success",
              level: "success",
            });
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>IC No</label>
          <input
            className="form-control"
            value={farmerForgotPasswordModal.icNo}
            required
            placeholder="IC No."
            onChange={(e) => {
              if (e) e.preventDefault();
              setFarmerForgotPasswordModal({
                ...farmerForgotPasswordModal,
                icNo: e.target.value,
              });
            }}
          />
        </div>
        {/* <div className="form-group">
          <label>ROCBN Reg. No</label>
          <input
            className="form-control"
            value={farmerForgotPasswordModal.rocbnRegNo}
            required
            placeholder="ROCBN Reg. No"
            onChange={(e) => {
              if (e) e.preventDefault();
              setFarmerForgotPasswordModal({
                ...farmerForgotPasswordModal,
                rocbnRegNo: e.target.value,
              });
            }}
          />
        </div> */}
        <div className="form-group">
          <label>DOAA Reg. No</label>
          <input
            className="form-control"
            value={farmerForgotPasswordModal.doaaRegNo}
            required
            placeholder="DOAA Reg. No"
            onChange={(e) => {
              if (e) e.preventDefault();
              setFarmerForgotPasswordModal({
                ...farmerForgotPasswordModal,
                doaaRegNo: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            className="form-control"
            value={farmerForgotPasswordModal.newPassword}
            required
            placeholder="New Password"
            onChange={(e) => {
              if (e) e.preventDefault();
              setFarmerForgotPasswordModal({
                ...farmerForgotPasswordModal,
                newPassword: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Confirmation Password</label>
          <input
            type="password"
            className="form-control"
            value={farmerForgotPasswordModal.confirmationPassword}
            required
            placeholder="Confirmation Password"
            onChange={(e) => {
              if (e) e.preventDefault();
              setFarmerForgotPasswordModal({
                ...farmerForgotPasswordModal,
                confirmationPassword: e.target.value,
              });
            }}
          />
        </div>
      </FormModal>
      <FormModal
        title={`Farmer Registration`}
        visible={farmerRegistrationFormModal}
        onClose={(e) => {
          if (e) e.preventDefault();
          setFarmerRegistrationFormModal(false);
        }}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            if (farmerRegistartionForm.password.length < 8) {
              throw {
                message: "Password at least 8 characters",
              };
            }

            const containNumber = hasNumber(farmerRegistartionForm.password);
            if (!containNumber) {
              throw {
                message: "Must contain at least 1 digit number",
              };
            }

            const containSpecial = containsSpecialChars(
              farmerRegistartionForm.password
            );
            if (!containSpecial) {
              throw {
                message: "Must contain special character such as @,!,&,$,%",
              };
            }

            await createFarmerRegistrationForm({
              variables: {
                ...farmerRegistartionForm,
              },
            });

            notification.addNotification({
              title: "Success",
              message: "Registration Success",
              level: "success",
            });
            setFarmerRegistrationFormModal(false);
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="form-group">
          <label>Name*</label>
          <input
            required
            className="py-3 bg-white form-control rounded-3xl"
            placeholder="Name"
            type="text"
            value={farmerRegistartionForm.name || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFarmerRegistartionForm({
                ...farmerRegistartionForm,
                name: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>IC. No*</label>
          <input
            required
            className="py-3 bg-white form-control rounded-3xl"
            placeholder="IC. No"
            type="text"
            value={farmerRegistartionForm.icNo || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFarmerRegistartionForm({
                ...farmerRegistartionForm,
                icNo: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>DOAA Registration Number*</label>
          <input
            required
            className="py-3 bg-white form-control rounded-3xl"
            placeholder="DOAA Registration Number"
            type="text"
            value={farmerRegistartionForm.doaaRegNo || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFarmerRegistartionForm({
                ...farmerRegistartionForm,
                doaaRegNo: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Company Registration No. (ROCBN)</label>
          <input
            className="py-3 bg-white form-control rounded-3xl"
            placeholder="Company Registration No. (ROCBN)"
            type="text"
            value={farmerRegistartionForm.rocbnRegNo || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFarmerRegistartionForm({
                ...farmerRegistartionForm,
                rocbnRegNo: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Phone*</label>
          <input
            required
            className="py-3 bg-white form-control rounded-3xl"
            placeholder="Phone Number"
            type="text"
            value={farmerRegistartionForm.phone || ""}
            onChange={(e) => {
              if (e) e.preventDefault;
              setFarmerRegistartionForm({
                ...farmerRegistartionForm,
                phone: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Email*</label>
          <input
            required
            className="py-3 bg-white form-control rounded-3xl"
            placeholder="Email"
            type="email"
            value={farmerRegistartionForm.email || ""}
            onChange={(e) => {
              if (e) e.preventDefault;
              setFarmerRegistartionForm({
                ...farmerRegistartionForm,
                email: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Password*</label>
          <input
            required
            className="py-3 bg-white form-control rounded-3xl"
            placeholder="Password"
            type="password"
            value={farmerRegistartionForm.password || ""}
            onChange={(e) => {
              if (e) e.preventDefault;
              setFarmerRegistartionForm({
                ...farmerRegistartionForm,
                password: e.target.value,
              });
            }}
          />
        </div>

        <p className="text-sm font-bold italic">
          *Phone and Email will use to inform you that your account is accepted
        </p>
      </FormModal>

      <FormModal
        title={`Officer Registration`}
        visible={officerRegisterModal}
        onClose={(e) => {
          if (e) e.preventDefault();
          setOfficerRegisterModal(false);
        }}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            // if (officerRegisterFormData.password.length < 8) {
            //   throw {
            //     message: "Password at least 8 characters",
            //   };
            // }

            // const containNumber = hasNumber(officerRegisterFormData.password);
            // if (!containNumber) {
            //   throw {
            //     message: "Must contain at least 1 digit number",
            //   };
            // }

            // const containSpecial = containsSpecialChars(
            //   officerRegisterFormData.password
            // );
            // if (!containSpecial) {
            //   throw {
            //     message: "Must contain special character such as @,!,&,$,%",
            //   };
            // }

            await registerOfficerUser({
              variables: {
                ...officerRegisterFormData,
                password: nanoid(),
                registerType: "OFFICER",
              },
            });
            notification.addNotification({
              title: "Succeess!",
              message: `Registration Success!`,
              level: "success",
            });

            setOfficerRegisterModal(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
      >
        <div className="h-screen">
          <div className="form-group">
            <label>Name*</label>
            <input
              required
              className="py-3 bg-white form-control rounded-3xl"
              placeholder="Name"
              type="text"
              value={officerRegisterFormData.name || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setOfficerRegisterFormModal({
                  ...officerRegisterFormData,
                  name: e.target.value,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>IC. No*</label>
            <input
              required
              className="py-3 bg-white form-control rounded-3xl"
              placeholder="IC. No"
              type="text"
              value={officerRegisterFormData.icNo || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setOfficerRegisterFormModal({
                  ...officerRegisterFormData,
                  icNo: e.target.value,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Username*</label>
            <input
              required
              className="py-3 bg-white form-control rounded-3xl"
              placeholder="Username must be same with Active Directory"
              type="text"
              value={officerRegisterFormData.username || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setOfficerRegisterFormModal({
                  ...officerRegisterFormData,
                  username: e.target.value,
                });
              }}
            />
          </div>
          {/* <div className="form-group">
          <label>Password*</label>
          <input
            required
            className="py-3 bg-white form-control rounded-3xl"
            placeholder="Password"
            type="password"
            value={officerRegisterFormData.password || ""}
            onChange={(e) => {
              if (e) e.preventDefault;
              setOfficerRegisterFormModal({
                ...officerRegisterFormData,
                password: e.target.value,
              });
            }}
          />
        </div> */}

          <div className="form-group">
            <label>Phone*</label>
            <input
              className="py-3 bg-white form-control rounded-3xl"
              placeholder="Phone Number"
              type="text"
              value={officerRegisterFormData.phone || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setOfficerRegisterFormModal({
                  ...officerRegisterFormData,
                  phone: e.target.value,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Email*</label>
            <input
              className="py-3 bg-white form-control rounded-3xl"
              placeholder="Email"
              type="email"
              value={officerRegisterFormData.email || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setOfficerRegisterFormModal({
                  ...officerRegisterFormData,
                  email: e.target.value,
                });
              }}
            />
          </div>

          <div className="form-group">
            <label>District*</label>
            <select
              required
              className="py-3 bg-white form-control rounded-3xl"
              value={officerRegisterFormData.district || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setOfficerRegisterFormModal({
                  ...officerRegisterFormData,
                  district: e.target.value,
                });
              }}
            >
              <option value={""} disabled>
                Select District
              </option>
              <option value={"Brunei Muara"}>Brunei Muara</option>
              <option value={"Tutong"}>Tutong</option>
              <option value={"Belait"}>Belait</option>
              <option value={"Temburong"}>Temburong</option>
            </select>
          </div>
          <div className="form-group">
            <label>Control Post*</label>
            <select
              required
              className="py-3 bg-white form-control rounded-3xl"
              value={officerRegisterFormData.controlPost || ""}
              onChange={(e) => {
                if (e) e.preventDefault;
                setOfficerRegisterFormModal({
                  ...officerRegisterFormData,
                  controlPost: e.target.value,
                });
              }}
            >
              <option value={""} disabled>
                Select Control Post
              </option>
              <option value={"All"}>All</option>
              <option value={"Cargo/Airport"}>Cargo/Airport</option>
              <option value={"Kuala Lurah"}>Kuala Lurah</option>
              <option value={"Muara Port"}>Muara Port</option>
              <option value={"Sg Tujoh"}>Sg Tujoh</option>
              <option value={"Terminal Serasa"}>Terminal Serasa</option>
              <option value={"Labu"}>Labu</option>
              <option value={"Ujong Jalan"}>Ujong Jalan</option>
              <option value={"N/A"}>N/A</option>
            </select>
          </div>

          <div className="form-group">
            <label>Unit</label>
            <Select
              options={lodash.orderBy(UNIT_OFFICER, ["label"], ["asc"])}
              className="w-full"
              classNamePrefix="select"
              onChange={(data) => {
                setOfficerRegisterFormModal({
                  ...officerRegisterFormData,
                  unit: data.value,
                });
                // setSelectMonths([data]);
              }}
            />
          </div>

          <p className="text-sm font-bold italic">
            *Phone and Email will use to inform you that your account is
            accepted
          </p>
        </div>
      </FormModal>

      <div className="flex w-full h-screen">
        <div className="hidden md:block w-3/5 bg-gray-100 bg-fixed bg-no-repeat bg-cover h-full">
          <div className="flex flex-col w-full h-full justify-center items-center align-middle">
            <div className="w-2/3 block">
              <div className="flex justify-center">
                <img src="/doa/images/DoAA-Logo-3.png" className="pb-8 w-2/3" />
              </div>

              <div className="text-2xl font-black py-4 text-green-500 text-center">
                Agriculture Information Management System (AIMS)
              </div>
              <div className="text-sm leading-6 font-light mt-4 text-center">
                Towards Increasing Production on Agriculture and Agrifood Based
                Industries through Increasing Productivity And High Technology
                Oriented For Domestic and Export Market
              </div>
            </div>
          </div>
        </div>
        <div className="w-full md:w-2/5 bg-green-500 bg-fixed bg-no-repeat bg-cover h-full">
          <div className="flex flex-col h-full justify-center items-center md:items-start">
            <form
              className="w-10/12 bg-white rounded-lg overflow-hidden shadow-lg px-8 py-12 md:-ml-6 border border-primary-400"
              onSubmit={handleSubmit("OFFICER")}
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
                  Agriculture Information Management System (AIMS)
                </div>
              </div>

              {loginAs === "OFFICER" ? (
                <div>
                  <div className="font-bold py-2">Administrator Login</div>
                  <div className="form-group py-3">
                    <input
                      required
                      className="py-3 bg-white form-control rounded-3xl"
                      placeholder="Username"
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
                    <button
                      className="btn btn-warning mr-2 md:px-6"
                      onClick={(e) => {
                        if (e) e.preventDefault();
                        setLoginAs("");
                      }}
                    >
                      Back &nbsp; <i className="fa fa-arrow-left text-sm" />
                    </button>
                    <button className="btn btn-primary md:px-6">
                      Login &nbsp; <i className="fa fa-arrow-right text-sm" />
                    </button>

                    <button
                      className="btn btn-success ml-2 md:px-6"
                      onClick={(e) => {
                        if (e) e.preventDefault();
                        setOfficerRegisterFormModal(true);
                        setOfficerRegisterModal({});
                      }}
                    >
                      Register &nbsp;{" "}
                      <i className="fa fa-paper-plane text-sm" />
                    </button>
                  </div>
                </div>
              ) : loginAs === "FARMER" ? (
                <div>
                  <div className="font-bold py-2">Farmer Login</div>
                  <div className="form-group py-3">
                    <input
                      required
                      className="py-3 bg-white form-control rounded-3xl"
                      placeholder="IC No"
                      type="text"
                      value={farmerIcNo}
                      onChange={(e) => {
                        if (e) e.preventDefault;
                        setFarmerIcNo(e.target.value);
                      }}
                    />
                  </div>
                  <div className="form-group py-3">
                    <input
                      required
                      className="py-3 bg-white form-control rounded-3xl"
                      placeholder="Password"
                      type="password"
                      value={farmerPassword}
                      onChange={(e) => {
                        if (e) e.preventDefault;
                        setFarmerPassword(e.target.value);
                      }}
                    />
                  </div>
                  <div className="form-group py-3 text-center">
                    <button
                      className="btn btn-warning mr-2 md:px-6"
                      onClick={(e) => {
                        if (e) e.preventDefault();
                        setLoginAs("");
                      }}
                    >
                      Back &nbsp; <i className="fa fa-arrow-left text-sm" />
                    </button>
                    <button
                      className="btn btn-primary md:px-6"
                      onClick={handleSubmit("FARMER")}
                    >
                      Login &nbsp; <i className="fa fa-arrow-right text-sm" />
                    </button>

                    <button
                      className="btn btn-success ml-2 md:px-6"
                      onClick={(e) => {
                        if (e) e.preventDefault();
                        setFarmerRegistrationFormModal(true);
                        setFarmerRegistartionForm({});
                      }}
                    >
                      Register &nbsp;{" "}
                      <i className="fa fa-paper-plane text-sm" />
                    </button>
                  </div>

                  <div className="text-center text-blue-500 text-sm font-semibold">
                    <a
                      href="#"
                      className="cursor-pointer"
                      onClick={(e) => {
                        if (e) e.preventDefault();
                        setFarmerForgotPasswordModal({
                          visible: true,
                          icNo: "",
                          rocbnRegNo: "",
                          newPassword: "",
                        });
                      }}
                    >
                      Forgot Password
                    </a>
                  </div>
                </div>
              ) : null}

              {!loginAs ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    className="bg-matrix-500 text-white font-bold text-md rounded-md shadow-md py-2"
                    onClick={(e) => {
                      if (e) e.preventDefault();
                      setLoginAs("OFFICER");
                    }}
                  >
                    Officer
                  </button>
                  <button
                    className="bg-matrix-500 text-white font-bold text-md rounded-md shadow-md py-2"
                    onClick={(e) => {
                      if (e) e.preventDefault();
                      setLoginAs("FARMER");
                    }}
                  >
                    Farmer
                  </button>
                </div>
              ) : null}

              <p className="text-sm leading-6 font-light mt-4 text-center">
                Powered by <span className="text-slate-700">ST Advisory</span>
              </p>
            </form>

            <div className="w-full flex justify-center">
              <p className="text-sm text-white text-center mt-10">
                Helpdesk | Tel: +673 2388054 | Email:
                aims.helpdesk@agriculture.gov.bn
              </p>
            </div>
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
      // redirect(context, `/doa/dashboard?${urlParams}`);
      redirect(context, "/doa/landing-dashboard");
    } else {
      redirect(context, "/doa/landing-dashboard");
      // redirect(context, `/doa/dashboard?${urlParams}`);
      // redirect(context, "/doa/logout");
    }
  } else if (typeof loggedInUser.currentUser === "undefined") {
    return { errorCode: 500 };
  }
  return {};
};
