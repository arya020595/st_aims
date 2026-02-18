import React from "react";
import translations from "../locales";
import encryptedLS from "./encryptedLS";

import i18next from "i18next";

// console.log("Namespaces:", Object.keys(translations.en));
const startI18n = (lang, defaulttNamespace) =>
  i18next.init(
    {
      lng: lang ? lang : "en", // active language http://i18next.com/translate/
      fallbackLng: "en",

      resources: translations,
      // resources: {
      //   en: {
      //     translations: {
      //       Judul: "Title",
      //     },
      //   },
      //   id: {
      //     translations: {
      //       Judul: "Judul",
      //     },
      //   },
      // },

      ns: Object.keys(translations.en),
      defaultNS:
        defaulttNamespace || Object.keys(translations.en)[0] || "translations",

      debug: false,
      silent: true,
      saveMissing: false,
    }
    // (err, t) => {
    //   console.log("startI18n", i18next.t("Judul"), t("Judul"));
    // }
  );

// Gets the display name of a JSX component for dev tools
const getComponentDisplayName = (Component) => {
  return Component.displayName || Component.name || "Unknown";
};

export const withI18n = (defaulttNamespace) => (ComposedComponent) => {
  return class WithApollo extends React.Component {
    static displayName = `WithI18n(${getComponentDisplayName(
      ComposedComponent
    )})`;

    static async getInitialProps(ctx) {
      // Evaluate the composed component's getInitialProps()
      let composedInitialProps = {};
      if (ComposedComponent.getInitialProps) {
        composedInitialProps = await ComposedComponent.getInitialProps(ctx);
      }

      return {
        ...composedInitialProps,
      };
    }

    constructor(props) {
      super(props);

      const lang = encryptedLS.get("______lang");
      this.i18n = startI18n(lang, defaulttNamespace);
    }

    render() {
      return <ComposedComponent {...this.props} />;
    }
  };
};

export const translate = (key) => {
  return i18next.t(key);
};
