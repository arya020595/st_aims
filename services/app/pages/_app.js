import App from "../components/App";
import "../styles/index.css";
import dayjs from "dayjs";
require("dayjs/locale/ms-my");
require("dayjs/locale/en");
const localeData = require("dayjs/plugin/localeData");
dayjs.extend(localeData);
// const relativeTime = require("dayjs/plugin/relativeTime");
// dayjs.extend(relativeTime);

const MyApp = ({ Component, pageProps }) => {
  return (
    <App>
      <Component {...pageProps} />
    </App>
  );
};

export default MyApp;
