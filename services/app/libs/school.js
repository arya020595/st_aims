export const defaultAcademicYear = () => {
  let academicYear;
  if (new Date().getMonth() < 6) {
    academicYear = `${new Date().getFullYear() - 1
      }/${new Date().getFullYear()}`;
  } else {
    academicYear = `${new Date().getFullYear()}/${new Date().getFullYear() + 1
      }`;
  }
  return academicYear;
};

export const defaultSemester = () => {
  if (new Date().getMonth() + 1 < 6) {
    return "GENAP";
  } else {
    return "GANJIL";
  }
};