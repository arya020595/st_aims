import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";

export const useCountdown = ({
  initialTimestamp = new Date().toISOString(),
  expirationTimestamp,
}) => {
  const [countdownTime, setCountdownTime] = useState({
    hour: 0,
    minute: 0,
    second: 0,
    expired: false,
    running: false,
  });

  let timer = useRef();

  useEffect(() => {
    if (expirationTimestamp && !countdownTime.running && !timer.current) {
      // console.log("setCountdownTime...");
      timer.current = setInterval(() => {
        setCountdownTime((time) => {
          let expired = false;
          let { hour, minute, second } = time;

          if (!time.running) {
            second = dayjs(expirationTimestamp).diff(
              dayjs(initialTimestamp),
              "second"
            );
            hour = Math.floor(second / 3600);
            second -= hour * 3600;
            minute = Math.floor(second / 60);
            second -= minute * 60;
          } else {
            second -= 1;
          }

          if (second < 0) {
            second = 59;
            minute -= 1;
          }
          if (minute < 0) {
            minute = 59;
            hour -= 1;
          }
          if (hour < 0) {
            hour = 0;
            minute = 0;
            second = 0;
            expired = true;
            clearInterval(timer.current);
          }

          return {
            hour,
            minute,
            second,
            expired,
            running: true,
          };
        });
      }, 900);

      return () => {
        clearInterval(timer.current);
      };
    }
  }, [expirationTimestamp]);

  return countdownTime;
};
