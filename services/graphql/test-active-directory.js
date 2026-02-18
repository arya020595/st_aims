const ActiveDirectory = require("activedirectory");

let config = {
  // url: "ldap://www.aims.agriculture.gov.bn",
  url: "ldap://mprt.eg.gov.bn",
  // baseDN: "dc=aims,dc=agriculture,dc=gov,dc=bn", // Replace with your baseDN
  // username: "MPRT\\aims.gc",
  // password: "Mirror#0091@", // Replace with your password
  username: "MPRT\\LDAP_MPRT",
  password: "6qW!6a18AA7KEzj",
};

const start = async () => {
  try {
    const isAuthenticated = await authenticateUser();
    if (isAuthenticated) {
      console.log("Authentication successful");
      // You can perform additional Active Directory operations here
    } else {
      console.log("Authentication failed");
    }
  } catch (err) {
    console.error("Authentication error:", err);
  }
  // ad.authenticate(config.username, config.password, (err, auth) => {
  //   if (err) {
  //     console.log("Authentication failed This:", err);
  //     return;
  //   }

  //   if (auth) {
  //     console.log("Authentication successful");
  //     // You can perform additional Active Directory operations here
  //   } else {
  //     console.log("Authentication failed");
  //   }
  // });
};

const authenticateUser = async () => {
  return new Promise((resolve, reject) => {
    const ad = new ActiveDirectory(config);

    ad.authenticate(config.username, config.password, (err, auth) => {
      if (err) {
        reject(err);
      } else {
        resolve(auth);
      }
    });
  });
};

start();
