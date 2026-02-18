import React, { Component, useContext, useState, useEffect } from "react";
import NProgress from "nprogress";
import Router from "next/router";
import { NotificationProvider, NotificationContext } from "./Notification";
import { motion } from "framer-motion";

Router.onRouteChangeStart = (url) => {
  console.log(`Loading: ${url}`);
  NProgress.start();
};
Router.onRouteChangeComplete = () => NProgress.done();
Router.onRouteChangeError = () => NProgress.done();

let _loadingSpinner = React.createRef();

class LoadingSpinner extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: props.visible,
    };
  }

  show = () => {
    this.setState({
      visible: true,
    });
  };

  hide = () => {
    this.setState({
      visible: false,
    });
  };

  render() {
    const { visible } = this.state;
    return (
      <div>
        <div
          className="loader-wrapper"
          style={{
            visibility: visible ? "visible" : "hidden",
            opacity: visible ? 1 : 0,
          }}
        >
          <div className="loader" />
        </div>
        <style jsx>{`
          .loader-wrapper {
            -webkit-transition: visibility 0s linear 200ms, opacity 200ms linear; /* Safari */
            transition: visibility 0s linear 200ms, opacity 200ms linear;

            opacity: 1;
            position: fixed; /* Sit on top of the page content */
            display: block; /* Hidden by default */
            width: 100%; /* Full width (cover the whole page) */
            height: 100%; /* Full height (cover the whole page) */
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(
              243,
              243,
              243,
              0.4
            ); /* Black background with opacity */
            z-index: 9997; /* Specify a stack order in case you're using a different order for other elements */
            cursor: pointer; /* Add a pointer on hover */
          }
          .loader {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            margin: auto;
            border: 4px solid #ddd; /* Light grey */
            border-top: 4px solid #0984e3; /* Blue */
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 0.6s linear infinite;
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }
}

const App = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <NotificationProvider>
      <motion.div
        animate={mounted ? "visible" : "invisible"}
        initial="invisible"
        variants={{
          invisible: {
            opacity: 0,
          },
          visible: {
            opacity: 1,
          },
        }}
        transition={{ duration: 0.5, delay: 0 }}
        id="re-page-wrap"
      >
        {/* {process.env.STAGING_ENV ? (
          <div className="w-full bg-white text-blue-700 font-bold text-sm py-1 text-center shadow-xl opacity-50 absolute top-0 left-0 right-0 z-50">
            Perhatian! Anda berada dalam {process.env.STAGING_ENV.toUpperCase()}{" "}
            staging mode.
          </div>
        ) : null} */}

        {children}

        <LoadingSpinner
          visible={false}
          ref={(comp) => {
            _loadingSpinner = comp;
          }}
        />
      </motion.div>
    </NotificationProvider>
  );
};
export default App;

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const addNotification = (params) => {
  // unused
  console.warn(
    `You are using obsolete addNotification(), please use useNotification instead!`
  );
};
export const removeNotification = (id) => {
  // unused
  console.warn(
    `You are using obsolete removeNotification(), please use useNotification instead!`
  );
};
export const clearNotifications = () => {
  // unused
  console.warn(
    `You are using obsolete clearNotifications(), please use useNotification instead!`
  );
};

export const showLoadingSpinner = () => {
  if (!_loadingSpinner || !_loadingSpinner.show) return;
  _loadingSpinner.show();
};
export const hideLoadingSpinner = () => {
  if (!_loadingSpinner || !_loadingSpinner.show) return;
  _loadingSpinner.hide();
};
