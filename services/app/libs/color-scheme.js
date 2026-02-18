import React, { useState, useEffect } from "react";

export const useColorScheme = () => {
  const [colorScheme, setColorScheme] = useState("light");
  const [colorIsInverted, setColorIsInverted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const colorSchemeMatcher = window.matchMedia(
        "(prefers-color-scheme: dark)"
      );
      console.log(
        `Now in ${colorSchemeMatcher.matches ? "dark" : "light"} mode`
      );
      setColorScheme(colorSchemeMatcher.matches ? "dark" : "light");
      colorSchemeMatcher.addEventListener("change", function (evt) {
        console.log(`Changed to ${evt.matches ? "dark" : "light"} mode`);
        setColorScheme(colorSchemeMatcher.matches ? "dark" : "light");
      });

      const invertedSchemeMatcher = window.matchMedia(
        "(inverted-colors: inverted)"
      );
      console.log(
        `Now in ${invertedSchemeMatcher.matches ? "inverted" : "normal"} mode`
      );
      setColorIsInverted(!!invertedSchemeMatcher.matches);
      invertedSchemeMatcher.addEventListener("change", function (evt) {
        console.log(`Changed to ${evt.matches ? "inverted" : "normal"} mode`);
        setColorScheme(invertedSchemeMatcher.matches ? "inverted" : "normal");
      });
    }
  }, []);

  return { colorScheme, colorIsInverted };
};
