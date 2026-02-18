const User = `
  scalar JSON

  type User {
    _id: String!
    uuid: String!
    
    employeeId: String
    email: String
    phone: String
    roleId: String!

    status: String!
    
    name: String
    address: String
    pictureUrl: String

    Role: UserRole
    
    tags: [String!]
    lastLoginAt: String
    deptCode: String

    controlPost: String
    district: String
    

    username: String!
    password: String!
    defaultPassword: String!
    icNo: String

    registerType: String

    isUserBioSecurityEnforcementOnly: Boolean

    loginStatus: String
    unit: String

    _createdAt: String!
    _updatedAt: String!
  }

  type UserRole {
    _id: String!
    uuid: String!
    name: String!
    privileges: [String!]!
    countUsers: Int!
    _createdAt: String!
    _updatedAt: String!
  }

  type UserSession {
    _id: String!
    User: User!
    token: String!
    expiresIn: String

    appList: [String]
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [User];
exports.rootTypes = `
  type Query {
    allUsers(registerType: String!): [User!]!
    allUserRoles: [UserRole!]!
    currentUser: User

    checkUserLoginTime: String!
    
    tokenizedAllUsers(tokenizedParams: String!): String!
    tokenizedAllUserRoles: String!
  }

  type Mutation {
    farmerForgotPassword(
      tokenized: String!
    ): String!
    registerUser (
      username: String!
      password: String!
      userRoleId: String!
    ): User!

    registerOfficerUser (
      username: String!
      password: String!

      name: String!
      icNo: String
      email: String
      phone: String

      controlPost: String
      district: String

      registerType: String
      unit: String
      
    ): User!

    deleteUser (uuid: String!): String
    deactivateUser (uuid: String!): String
    activateUser (uuid: String!): String
    updateUser (
      uuid: String!
      username: String
      newPassword: String
      email: String
      phone: String
      district: String
      controlPost: String

      #employeeId: String
      #email: String
      #phone: String
      #name: String
      #address: String
      #pictureUrl: String
      #deptCode: String
      #regionIds: [String]
      #roleId: String
    ): String
    updateRoleForUser (
      uuid: String!
      roleId: String!
    ): String
    updateUserFarmer(
      _id: String!
      #oldPassword: String!
      email: String
      phone: String
      newPassword: String!
    ): String!
    updateUserPassword (
      _id: String!
      #oldPassword: String!
      newPassword: String!
    ): String
    resetUserPassword (
      _id: String!
      newPassword: String!
    ): String

    updateTagsForUser (
      _id: String!
      tags: [String!]!
    ): String

    createUserRole (
      name: String!
      privileges: [String!]!  
    ): String!
    updateUserRole (
      uuid: String!
      name: String!
      privileges: [String!]!
    ): String
    deleteUserRole (uuid: String!): String

    logIn (
      employeeId: String!
      password: String!
      wontExpired: Boolean
    ): UserSession!
    logOut: String

    logInByEmployeeId (
      employeeId: String!
      wontExpired: Boolean
    ): UserSession!

    loginByFarmer (
      icNo: String!
      wontExpired: Boolean
    ): UserSession!

    exportCollectionDataAsExcel(exportConfig: JSON!): String!

    checkEmployeeIdAndPassword(employeeId: String!, password: String!): String!

    setUserOnlyBioSecurityEnforcement(uuid: String!, isUserBioSecurityEnforcementOnly: Boolean): String!

    checkFarmerUser(icNo: String!, password: String!): String!

    tokenizedCreateUserRole(tokenized: String!): String!
    tokenizedUpdateUserRole(tokenized: String!): String!
    tokenizedDeleteUserRole(tokenized: String!): String!
    tokenizedUpdateUser(tokenized: String!): String!
    tokenizedDeleteUser(tokenized: String!): String!
    tokenizedUpdateUserFarmer(tokenized: String!): String!
    exportAllUsersTypeAdmin: Buffer
    exportAllUsersTypeFarmer: Buffer
    latestTimeConnection: String
  }
`;
