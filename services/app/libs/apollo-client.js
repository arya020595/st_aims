import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from "apollo-link-http";
import fetch from "isomorphic-unfetch";
import { createUploadLink } from "apollo-upload-client";
import { setContext } from "apollo-link-context";
import { onError } from "apollo-link-error";
import { ApolloLink } from "apollo-link";
import cookie from "cookie";
import { Base64 } from "js-base64";

function parseCookies(ctx, options = {}) {
  return cookie.parse(
    ctx && ctx.req
      ? ctx.req.headers.cookie || ""
      : typeof document !== "undefined"
        ? document.cookie
        : "",
    options
  );
}

export default function createApolloClient(initialState, ctx) {
  // // The `ctx` (NextPageContext) will only be present on the server.
  // // use it to extract auth headers (ctx.req) or similar.
  const httpLink = createUploadLink({
    // uri: "http://localhost:7082/api",
    uri:
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}/api`
        : "http://localhost:9201/graphql", //`http://localhost:${process.env.ADMIN_PORT}/api`,
    // uri:
    //   process.env.NODE_ENV === "production"
    //     ? typeof window !== "undefined"
    //       ? `${window.location.protocol}//${window.location.host}/api`
    //       : `http://localhost:${process.env.ADMIN_PORT}/api`
    //     : `http://localhost:${process.env.ADMIN_PORT}/api`,
    credentials: "same-origin",
    connectToDevTools: !Boolean(ctx),
    ssrMode: Boolean(ctx),
    fetch,
  });

  const errorLink = onError(({ networkError, graphQLErrors }) => {
    if (graphQLErrors) {
      graphQLErrors.map((error) => {
        const { message, locations, path } = error;

        console.warn(
          `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(
            locations,
            null,
            4
          )}, Path: ${path ? path : "N/A"}`
        );
      });
    }
    // if (networkError) console.warn(`[Network error]: ${networkError}`);
  });

  const authLink = setContext((_, { headers }) => {
    let cookies = parseCookies(ctx);
    // console.log({ cookies });
    return {
      headers: {
        ...headers,
        authorization: cookies.token ? `Bearer ${cookies.token}` : "",
        org: cookies["organization-id"]
          ? Base64.encode(cookies["organization-id"])
          : "",
      },
    };
  });

  const link = ApolloLink.from([errorLink, authLink, httpLink]);
  // Check out https://github.com/zeit/next.js/pull/4611 if you want to use the AWSAppSyncClient
  return new ApolloClient({
    connectToDevTools: !Boolean(ctx),
    link,
    cache: new InMemoryCache().restore(initialState || {}),
  });
}
