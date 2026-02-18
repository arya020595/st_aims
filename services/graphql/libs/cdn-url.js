const Url = require("url-parse");

const replaceHostWithPrefix = ({ url, prefix = process.env.CDN_PREFIX }) => {
  if (!prefix || url.startsWith("/")) return url;
  url = new Url(url);
  if (prefix) {
    url.set("host", prefix);
  }
  return url.toString();
};

module.exports = {
  replaceHostWithPrefix,
};
