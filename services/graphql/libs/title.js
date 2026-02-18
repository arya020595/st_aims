const composeNameWithTitle = ({
  name,
  academicTitleBeforeName,
  academicTitleAfterName,
  nobleTitleAfterName,
  nobleTitleBeforeName,
  religiousTitle,
  listedOnIDCard
}) => {
  let result = "";
  if (
    listedOnIDCard === "YA" &&
    nobleTitleAfterName &&
    nobleTitleAfterName.trim()
  ) {
    result = nobleTitleAfterName;
  }
  if (listedOnIDCard === "YA" && religiousTitle && religiousTitle.trim()) {
    result += " " + religiousTitle;
  }
  if (
    listedOnIDCard === "YA" &&
    academicTitleBeforeName &&
    academicTitleBeforeName.trim()
  ) {
    result += " " + academicTitleBeforeName;
  }
  result += " " + name;
  if (
    listedOnIDCard === "YA" &&
    academicTitleAfterName &&
    academicTitleAfterName.trim()
  ) {
    result += ", " + academicTitleAfterName;
  }
  if (
    listedOnIDCard === "YA" &&
    nobleTitleBeforeName &&
    nobleTitleBeforeName.trim()
  ) {
    result += ", " + nobleTitleBeforeName;
  }
  return result.trim();
};

module.exports = {
  composeNameWithTitle
};
