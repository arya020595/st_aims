import React, { useState, useEffect } from "react";
import encryptedLS from "../libs/encryptedLS";
import appConfig from "../app.json";

const Footer = (props) => {
  const [lang, setLang] = useState("en");
  useEffect(() => {
    const lang = encryptedLS.get("______lang");
    setLang(lang);
  }, []);
  return (
    <div className="w-full flex justify-between text-gray-500">
      <div className="text-sm px-4 py-4">
        Language{" "}
        <a
          href="#"
          onClick={(e) => {
            if (e) e.preventDefault();
            encryptedLS.set("______lang", "en");
            setTimeout(() => {
              location.reload();
            }, 500);
          }}
          style={{
            fontWeight: lang && lang === "en" ? "bold" : "",
          }}
        >
          English
        </a>{" "}
        &middot;{" "}
        <a
          href="#"
          onClick={(e) => {
            if (e) e.preventDefault();
            encryptedLS.set("______lang", "id");
            setTimeout(() => {
              location.reload();
            }, 500);
          }}
          style={{
            fontWeight: lang && lang === "id" ? "bold" : "",
          }}
        >
          Bahasa Indonesia
        </a>
      </div>
      {/* <div className="text-sm px-4 py-4">
        Copyright 2021 &middot; QWIFI.id - Versi {appConfig.version}
      </div> */}
    </div>
  );
};
export default Footer;
