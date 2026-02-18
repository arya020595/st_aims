import {
  addNotification
  // errorReporting
} from "../components/App";

export const handleError = error => {
  // try {
  //   if (errorReporting) errorReporting.captureException(error);
  // } catch (err) {}

  if (error.message) {
    if (error.message.indexOf("Network error") >= 0) {
      error.message = "Network error! Please try again later.";
    } else {
      error.message = error.message.replace("GraphQL error: ", "");
    }
  } else {
    error.message = "Unknown error! Please try again later.";
  }
  console.warn("Handling error:", error.message);
  addNotification({
    title: "Terdapat Error",
    message: error.message,
    type: error.type ? error.type : "danger"
  });
};
