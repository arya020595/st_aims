const fetch = require("isomorphic-unfetch");
const Bowser = require("bowser");
const { nanoid } = require("nanoid");

export const sendVisitRecords = async ({
  pageId = "",
  analyticEndpoint = "https://analytic.lato.co.id/visits",
  analyticPath = "",
} = {}) => {
  try {
    if (typeof window === "undefined") {
      console.warn("Can't send visit records: window is not defined!");
      return;
    }

    let visitorId = window.localStorage.getItem("sa-vid");
    if (!visitorId) {
      visitorId = nanoid();
      window.localStorage.setItem("sa-vid", visitorId);
    }

    // const parsedResult = {};
    const { parsedResult } = Bowser.getParser(window.navigator.userAgent);

    let visitRecord = {
      pageId,
      visitorId,
      //
      window: {
        screen: {
          height: window.screen.height,
          width: window.screen.width,
        },
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
      },
      browser: parsedResult.browser,
      os: parsedResult.os,
      platform: parsedResult.platform,
      engine: parsedResult.engine,
    };

    if (!analyticEndpoint) {
      analyticEndpoint = `${window.location.protocol}//${window.location.host}/site-analytics/visits`;
    } else if (analyticPath) {
      analyticEndpoint = `${window.location.protocol}//${window.location.host}${analyticPath}`;
    }

    // console.log({ visitRecord });
    const response = await fetch(analyticEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(visitRecord), // body data type must match "Content-Type" header
    });
    let responseData = await response.json();
    // console.log({ responseData });
  } catch (err) {
    console.warn(err);
  }
};
