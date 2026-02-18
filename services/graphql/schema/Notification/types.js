const Notification = `
  type Notification {
    message: String,
    date: String
    module: String

    controlPost: String
    type: String
  }
`;
exports.customTypes = [Notification];
exports.rootTypes = `
   type Query {
    allNotifications: [Notification]
    tokenizeAllNotification: String
   }
`;
