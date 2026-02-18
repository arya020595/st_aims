const uploadFile = async ({ file, url }) => {
  let response = await fetch(url, {
    method: "PUT",
    body: file,
  });
  return response.text();
};

const retrieveNewURL = async ({
  presignedEndpoint,
  //
  bucketName,
  objectName,
  //
  contentType,
  objectKey,
}) => {
  let params = {
    bucketName,
    objectName,
    contentType,
    objectKey,
  };
  const response = await fetch(
    `${presignedEndpoint}?${Object.keys(params)
      .filter((key) => !!params[key])
      .map((key) => key + "=" + params[key])
      .join("&")}`
  );
  const result = await response.json();
  if (result.error) {
    throw {
      message: result.error,
    };
  } else {
    return result.url;
  }
};

export const handleFileUploadToS3 = async ({
  file,
  presignedEndpoint,
  bucketName,
  objectName,
  objectOwnerType,
  objectOwnerId,
}) => {
  if (!bucketName) {
    bucketName = "uploads";
  }
  if (!objectName) {
    objectName = uuidV4() + "." + mime.extension(mime.lookup(file.name));
  } else if (typeof objectName === "function") {
    objectName = objectName(file);
  }
  const objectKey = [
    (process.env.NODE_ENV === "production" ? "" : "dev-") +
      (objectOwnerType || "etc"),
    objectOwnerId,
    objectName,
  ].join("/");

  let url = await retrieveNewURL({
    presignedEndpoint,
    bucketName,
    objectName,
    objectKey,
    contentType: file.type,
  });
  await uploadFile({
    file,
    url,
  });

  let publicUrl = `${new URL(url).protocol}//${new URL(url).host}/${objectKey}`;
  return publicUrl;
};

export const clearFileInputById = (fileInputId) => {
  const fileInput = document.getElementById(fileInputId);
  if (fileInput) {
    fileInput.value = "";
  }
};

export const clearFileInputsByClassName = (fileInputClassName) => {
  const allFileInputs = document.getElementsByClassName(fileInputClassName);
  for (const input of allFileInputs) {
    input.value = "";
  }
};
