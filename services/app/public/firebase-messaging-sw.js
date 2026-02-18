importScripts("https://www.gstatic.com/firebasejs/8.2.6/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.2.6/firebase-messaging.js");

// self.addEventListener("notificationclick", function (event) {
//   var redirectUrl = event.notification.data.FCM_MSG.notification.click_action;

//   event.waitUntil(
//     self.clients
//       .claim()
//       .then(() => self.clients.matchAll({ type: "window" }))
//       .then((clients) => {
//         return clients.map((client) => {
//           const url = new URL(client.url);

//           if (url.pathname != redirectUrl && "navigate" in client) {
//             return client.navigate(redirectUrl);
//           }
//         });
//       })
//   );
// });

self.addEventListener("notificationclick", (event) => {
  const clickedNotification = event.notification;
  clickedNotification.close();
});

firebase.initializeApp({
  apiKey: "AIzaSyBZ3kqeW3Tk2-l5Ud__ueUjNziL52oJxEI",
  authDomain: "yong-chun.firebaseapp.com",
  databaseURL: "https://yong-chun-default-rtdb.firebaseio.com",
  projectId: "yong-chun",
  storageBucket: "yong-chun.appspot.com",
  messagingSenderId: "309898612893",
  appId: "1:309898612893:web:739edd28246ed2861c0474",
  measurementId: "G-QCG6JHSGRM",
});

const messaging = firebase.messaging();

// This will be called only once when the service worker is installed for first time.
// self.addEventListener("activate", async (event) => {
//   event.waitUntil(
//     self.clients
//       .matchAll({
//         type: "window",
//         includeUncontrolled: true,
//       })
//       .then((windowClients) => {
//         const client = windowClients[0];

//         messaging
//           .getToken()
//           .then((currentToken) => {
//             console.log("Recovered token from messaging: ", currentToken);

//             client.postMessage({
//               source: "firebase-messaging-sw",
//               currentToken: currentToken,
//             });
//           })
//           .catch((err) => {
//             console.log("An error occurred while retrieving token. ", err);
//           });
//       })
//   );
// });

// self.addEventListener('notificationclick', (event) => {
//   const clickedNotification = event.notification;
//   clickedNotification.close();
//   const promiseChain = clients
//       .matchAll({
//           type: 'window',
//           includeUncontrolled: true
//        })
//       .then(windowClients => {
//           let matchingClient = null;
//           for (let i = 0; i < windowClients.length; i++) {
//               const windowClient = windowClients[i];
//               if (windowClient.url === "") {
//                   matchingClient = windowClient;
//                   break;
//               }
//           }

//           // if (matchingClient) {
//           //     return matchingClient.focus();
//           // } else {
//           //     return clients.openWindow(feClickAction);
//           // }
//       });
//       event.waitUntil(promiseChain);
// });
