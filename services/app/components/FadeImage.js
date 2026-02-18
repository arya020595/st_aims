import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
const Url = require("url-parse");
import appConfig from "../app.json";

const addCdnPrefix = ({ url, size = "" }) => {
  if (
    !process.env.CDN_PREFIX ||
    !url ||
    url.indexOf("amazonaws.com") < 0 ||
    !url.startsWith("http") ||
    url.startsWith("https://graph.facebook.com")
  ) {
    if (url.startsWith("/")) {
      let resolvedUrl = (appConfig.basePath || "") + url;
      return resolvedUrl;
    } else {
      return url;
    }
  }

  try {
    let parsedUrl = new Url(url);
    const paths = parsedUrl.pathname.split("/");
    if (size) {
      paths.splice(paths.length - 1, 0, size);
    }
    let newUrl = process.env.CDN_PREFIX + paths.join("/") + parsedUrl.query;
    // if (parsedUrl.query) {
    // }
    return newUrl;
  } catch (err) {
    console.warn(url, err);
    return url;
  }
};

function isImageCached(url) {
  var imgEle = document.createElement("img");
  imgEle.src = url;
  return imgEle.complete || imgEle.width + imgEle.height > 0;
}

const Image = (imageProps) => {
  const [images, setImages] = useState([
    addCdnPrefix({
      url: imageProps.src || "/images/default-profile.png",
      size: imageProps.size,
    }),
  ]);

  const [cached, setCached] = useState(true);
  useEffect(() => {
    const url = addCdnPrefix({
      url: imageProps.src || "/images/default-profile.png",
      size: imageProps.size,
    });
    const cached = isImageCached(url);
    setCached(cached);
    setImages([url]);
  }, [imageProps.src]);

  // const isSSR = typeof window === "undefined";
  // if (isSSR) {
  //   return <FadeImage {...imageProps} src={images[0]} />;
  // }

  return images.map((image, index) => {
    return (
      <motion.img
        key={image + index}
        src={image}
        className={imageProps.className}
        style={imageProps.style}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: cached && imageProps.fadeOnce ? 0 : 0.4 }}
        // loading="lazy"
      />
    );
  });
};

export default Image;

export const FadeDivImage = ({ children, backgroundImageSrc, ...divProps }) => {
  if (!backgroundImageSrc) {
    console.warn(`Please specify backgroundImageSrc props!`);
  }

  const [images, setImages] = useState([
    addCdnPrefix({
      url: backgroundImageSrc || "/images/default-profile.png",
      size: divProps.size,
    }),
  ]);

  const [cached, setCached] = useState(true);
  useEffect(() => {
    const url = addCdnPrefix({
      url: backgroundImageSrc || "/images/default-profile.png",
      size: divProps.size,
    });
    const cached = isImageCached(url);
    setCached(cached);
    setImages([url]);
  }, [backgroundImageSrc]);

  // const isSSR = typeof window === "undefined";
  // if (isSSR) {
  //   return <div {...divProps}>{children}</div>;
  // }

  return images.map((image, index) => {
    return (
      <motion.div
        key={image + index}
        className={divProps.className}
        style={{ ...divProps.style, backgroundImage: `url(${image})` }}
        // initial={{ opacity: 0 }}
        // animate={{ opacity: 1 }}
        transition={{ duration: cached && divProps.fadeOnce ? 0 : 0.4 }}
      >
        {children}
      </motion.div>
    );
  });
};
