import Document, { Html, Head, Main, NextScript } from "next/document";
import appConfig from "../app.json";

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    const basePath = appConfig.basePath || "";
    let faviconUrl = basePath + appConfig.favicon;
    if (process.env.NODE_ENV !== "production") {
      faviconUrl += "?t=" + new Date().getTime();
    }
    return (
      <Html>
        <Head />
        {/* <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"> */}
        {/* <link rel="icon" href="/favicon.ico" type="image/x-icon"></link> */}
        <meta name="theme-color" content="#2F80EC" />
        <link rel="shortcut icon" href={faviconUrl} type="image/x-icon"></link>
        <link rel="icon" href={faviconUrl} type="image/x-icon"></link>
        <link
          href={basePath + "/fontawesome-free-5.12.1-web/css/all.min.css"}
          rel="stylesheet"
        />
        {/* <link href={basePath + "/css/animation.css"} rel="stylesheet" /> */}
        <link
          href={basePath + "/css/react-multi-carousel.css"}
          rel="stylesheet"
        />
        <link
          href={basePath + "/css/react-big-calendar.css"}
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        ></link>
        {/* <link href={basePath + "/css/tippy.css"} rel="stylesheet" /> */}
        {/* <link href={basePath + "/css/ol.css"} rel="stylesheet" /> */}
        {/* <link
          href={basePath + "/css/react-notification-component.min.css"}
          rel="stylesheet"
        /> */}
        <link href={basePath + "/css/nprogress.css"} rel="stylesheet" />
        {/* <link href={basePath + "/css/react-table.min.css"} rel="stylesheet" /> */}
        {/* <link
          href={basePath + "/css/react-datepicker.min.css"}
          rel="stylesheet"
        /> */}
        {/* <link rel="manifest" href={basePath + "/manifest.json"} /> */}

        <script defer src={basePath + "/js/mathlive.min.js"}></script>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
