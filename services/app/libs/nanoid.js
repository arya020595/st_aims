const DEFAULT_NANOID_LENGTH = 16;

const en = require("nanoid-good/locale/en");
// const id = require("nanoid-good/locale/id");
// const generate = require("nanoid-good/generate")(en, id);
const generate = require("nanoid-good").customAlphabet(en);
const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const generateNanoId = (length, customAlphabet) => {
  const generator = generate(
    customAlphabet || ALPHABET,
    length || DEFAULT_NANOID_LENGTH
  );
  return generator();
};

module.exports = {
  generateNanoId,
  DEFAULT_NANOID_LENGTH,
};
