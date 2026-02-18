import Router from "next/router";

const HybridNavigator = {
  push: ({ pathname, screen, childScreen, query, nativeParams }) => {
    if (typeof window !== "undefined" && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: screen ? "NATIVE" : "NAVIGATION",
          command: "push",
          screen,
          childScreen,
          pathname,
          query,
          params: {
            ...nativeParams,
          },
        })
      );
    } else {
      if (pathname.startsWith("http")) {
        window.location.href = pathname;
      } else {
        Router.push({
          pathname,
          query,
        });
      }
    }
  },
  replace: ({ pathname, screen, childScreen, query, nativeParams }) => {
    if (typeof window !== "undefined" && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: screen ? "NATIVE" : "NAVIGATION",
          command: "replace",
          screen,
          childScreen,
          pathname,
          query,
          params: {
            ...nativeParams,
          },
        })
      );
    } else {
      if (pathname.startsWith("http")) {
        window.location.replace(pathname);
      } else {
        Router.replace({
          pathname,
          query,
        });
      }
    }
  },
  open: (url) => {
    if (typeof window !== "undefined" && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "LINKING",
          url,
        })
      );
    } else {
      window.open(url);
      // window.location.href = url;
    }
  },
  isReactNative: () =>
    typeof window !== "undefined" && window.ReactNativeWebView,
};

const WindowNavigator = {
  push: ({ pathname, query, nativeParams }) => {
    window.location.assign(
      pathname +
      "?" +
      Object.keys(query)
        .map((key) => key + "=" + query[key])
        .join("&")
    );
    if (window.ReactNativeWebView && nativeParams) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "NAVIGATION_UPDATE",
          params: {
            ...nativeParams,
          },
        })
      );
    }
  },
  replace: ({ pathname, query, nativeParams }) => {
    window.location.replace(
      pathname +
      "?" +
      Object.keys(query)
        .map((key) => key + "=" + query[key])
        .join("&")
    );
    if (window.ReactNativeWebView && nativeParams) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "NAVIGATION_UPDATE",
          params: {
            ...nativeParams,
          },
        })
      );
    }
  },
};

module.exports = {
  HybridNavigator,
  WindowNavigator,
};
