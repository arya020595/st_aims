import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { withApollo } from "../libs/apollo";
import AdminArea from "../components/AdminArea";

import gql from "graphql-tag";
import { useMutation, useApolloClient, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import Header from "./Header";
import { hideLoadingSpinner, showLoadingSpinner } from "./App";
import { useNotification } from "./Notification";
import bcrypt from "bcryptjs";

const CURRENT_USER = gql`
  query currentUser {
    currentUser {
      _id
      name
      email
      phone
      defaultPassword
      passwordUpdatedAt
      phoneVerifiedAt
      emailVerifiedAt
      status

      roles

      employeeIds
      studentIds
      parentIds
      subscribeToStudents

      AccountSession {
        _id
      }
    }
  }
`;

const UPDATE_PASSWORD = gql`
  mutation updatePassword(
    $sessionId: ID
    $oldPassword: String!
    $newPassword: String!
  ) {
    updatePassword(
      sessionId: $sessionId
      oldPassword: $oldPassword
      newPassword: $newPassword
    )
  }
`;

const UPDATE_PROFILE = gql`
  mutation updateProfile(
    $sessionId: ID
    $name: String!
    $email: String!
    $phone: String!
  ) {
    updateProfile(
      sessionId: $sessionId
      name: $name
      email: $email
      phone: $phone
    )
  }
`;

const ProfileArea = () => {
  const notification = useNotification();
  const [currentUser, setCurrentUser] = useState({});
  const [enableEditName, setEnableEditName] = useState(true);
  const [enableEditMail, setEnableEditMail] = useState(true);
  const [enabelEditPassword, setEnableEditPassword] = useState(true);
  const [password, setPassword] = useState({
    oldPassword: "",
    newPassword: "",
    confirmationNewPassword: "",
  });
  const { data, error, loading, refetch } = useQuery(CURRENT_USER, {
    onCompleted: (completedData) => {
      setCurrentUser({
        ...completedData.currentUser,
      });
    },
  });
  const [updatePassword] = useMutation(UPDATE_PASSWORD);
  const [updateProfile] = useMutation(UPDATE_PROFILE);

  const handleSavePassword = async (e) => {
    if (e) e.preventDefault();
    showLoadingSpinner();
    try {
      if (password.newPassword !== password.confirmationNewPassword) {
        throw {
          message: "Password Baru Salah!",
        };
      }
      await updatePassword({
        variables: {
          sessionId: currentUser.AccountSession._id,
          oldPassword: password.oldPassword,
          newPassword: password.confirmationNewPassword,
        },
      });

      notification.addNotification({
        title: "Password berhasil dirubah",
        message: "Password berhasil dirubah",
        level: "success",
      });

      await refetch();
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  return (
    <div>
      <Header />
      <div className="mx-10 mt-28">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white shadow-md rounded-xl px-4 py-4 h-[32rem]">
            <div className="flex mb-4">
              <p className="text-lg font-bold">
                <i className="fa fa-user" />
              </p>
              <p className="text-lg font-bold mx-2">Profil</p>
            </div>

            <div className="flex justify-center items-center mt-10">
              <div>
                <img
                  src="/schooltalk/images/beranda-img-student-profile.svg"
                  className="h-56"
                />

                <p className="text-xl text-center mt-4 font-bold">
                  {currentUser?.name || ""}{" "}
                </p>
                <p className="text-lg text-center mt-2">
                  {currentUser?.email || "Email Not Inserted"}
                </p>
              </div>
            </div>
          </div>

          <div className="h-[32rem]">
            <div className="bg-white shadow-md rounded-xl px-4 py-4 h-[14rem] mb-16">
              <p className="text-lg font-bold mx-2">
                <i className="fa fa-user" /> Nama
              </p>

              <div className="mt-14 mb-4">
                <input
                  className="form-control border-0 border-b-2 rounded-none"
                  value={currentUser?.name || ""}
                  onChange={(e) => {
                    setCurrentUser({
                      ...currentUser,
                      name: e.target.value,
                    });
                  }}
                  disabled={enableEditName}
                  onBlur={(e) => {
                    setEnableEditName(true);
                  }}
                />
              </div>

              {enableEditName ? (
                <p
                  className="text-right font-bold cursor-pointer text-yellow-500"
                  onClick={(e) => {
                    setEnableEditName(false);
                  }}
                >
                  <i className="fa fa-edit" /> Edit
                </p>
              ) : null}
            </div>
            <div className="bg-white shadow-md rounded-xl px-4 py-4 h-[14rem]">
              <p className="text-lg font-bold mx-2">
                <i className="fa fa-at" /> Email
              </p>
              <div className="mt-14 mb-4">
                <input
                  className="form-control border-0 border-b-2 rounded-none"
                  placeholder="emailanda@email.com"
                  value={currentUser?.email || ""}
                  type="email"
                  onChange={(e) => {
                    setCurrentUser({
                      ...currentUser,
                      email: e.target.value,
                    });
                  }}
                  disabled={enableEditMail}
                  onBlur={(e) => {
                    setEnableEditMail(true);
                  }}
                />
              </div>

              {enableEditMail ? (
                <p
                  className="text-right font-bold cursor-pointer text-yellow-500"
                  onClick={(e) => {
                    setEnableEditMail(false);
                  }}
                >
                  <i className="fa fa-edit" /> Edit
                </p>
              ) : null}
            </div>
          </div>
          <div className="bg-white h-[32rem] rounded-xl px-4 py-4">
            <div className="flex">
              <p className="text-md font-bold">
                <i className="fa fa-lock" /> Ubah Sandi
              </p>
            </div>

            <input
              className={`form-control border-0 border-b-2 rounded-none mt-8 mb-2
              ${!enabelEditPassword ? "" : "bg-gray-100"}
              `}
              placeholder="Password Sebelumnya"
              value={password?.oldPassword || ""}
              type="password"
              onChange={(e) => {
                setPassword({
                  ...password,
                  oldPassword: e.target.value,
                });
              }}
            />
            <input
              className={`form-control border-0 border-b-2 rounded-none mt-8 mb-2 ${
                !enabelEditPassword ? "" : "bg-gray-100"
              }`}
              placeholder="Password Baru"
              value={password?.newPassword || ""}
              type="password"
              onChange={(e) => {
                setPassword({
                  ...password,
                  newPassword: e.target.value,
                });
              }}
            />
            <input
              className={`form-control border-0 border-b-2 rounded-none mt-8 mb-2 ${
                !enabelEditPassword ? "" : "bg-gray-100"
              }`}
              placeholder="Konfirmasi Password Baru"
              value={password?.confirmationNewPassword || ""}
              type="password"
              onChange={(e) => {
                setPassword({
                  ...password,
                  confirmationNewPassword: e.target.value,
                });
              }}
            />

            {enabelEditPassword ? (
              <p
                className="text-right font-bold cursor-pointer text-yellow-500"
                onClick={(e) => {
                  setEnableEditPassword(false);
                }}
              >
                <i className="fa fa-edit" /> Edit
              </p>
            ) : (
              <p
                className="text-right font-bold cursor-pointer text-green-500"
                onClick={handleSavePassword}
              >
                <i className="fa fa-save" /> Save
              </p>
            )}
          </div>
          <div className="bg-white h-[32rem] rounded-xl px-4 py-4">
            <p className="text-md font-bold">
              <i className="fa fa-info-circle" /> Hubungi Kami
            </p>

            <p className="text-md text-justify mt-10">
              Jika ada pertanyaan yang belum tercakup, Anda dapat menghubungi
              Kami menggunakan informasi dibawah ini
            </p>

            <p className="text-md text-justify mt-20">
              www.softwaresekolah.co.id
            </p>
            <p className="text-md text-justify">
              Jl. Gunung Sari Indah Blok BB No. 23
            </p>
            <p className="text-md text-justify">Surabaya, Jawa Timur</p>
            <p className="text-md text-justify">Indonesia</p>
            <p className="text-md text-justify">info@softwaresekolah.co.id</p>
            <p className="text-md text-justify">085777770201</p>
          </div>

          <div className="bg-white shadow-md rounded-xl px-4 py-4">
            <p className="text-lg font-bold">
              <i className="fa fa-info-circle" /> Pusat Bantuan
            </p>
            <p className="text-md mt-4 text-justify mb-2">
              Silahkan klik laman berikut untuk pusat bantuan School Talk
            </p>

            <a href="https://schooltalk.id/help" target="__blank">
              <p className="text-md text-blue-500 text-justify cursor-pointer">
                https://schooltalk.id/help
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(ProfileArea);
