import gql from "graphql-tag";

const QUERY = gql`
  query currentUser {
    currentUser {
      _id
      name
      #AccountSession {
      #  _id
      #  urlParams
      #}
    }
  }
`;

const checkLoggedIn = (apolloClient) => {
  return apolloClient
    .query({
      query: QUERY,
    })
    .then(({ data }) => {
      return { loggedInUser: data };
    })
    .catch((e) => {
      // Fail gracefully
      return { loggedInUser: {} };
    });
};

export default checkLoggedIn;
