import React, { useState } from "react";
import { SingleSelect } from "./SingleSelect";
import { Number } from "./Number";
import { handleFileUploadToS3, clearFileInputById } from "./File";
import mime from "mime-types";
import { useNotification } from "../Notification";
import { EllipsisLoading } from "../Loading";

const AVAILABLE_FILE_TYPES = [
  { type: "Semua", accept: "" },
  { type: "PDF", accept: "application/pdf" },
  { type: "Image", accept: "image/png,image/jpeg" },
  // { type: "Document", accept: "" },
  // { type: "Spreadsheet", accept: "" },
  // { type: "Presentation", accept: "" },
];

export const Attachment = ({
  label,
  required,
  placeholder,
  disabled,
  name,
  value,
  onChange,
  allowedType,
  maxSize,
  ...field
}) => {
  const notification = useNotification();
  const [internalLoading, setInternalLoading] = useState(false);

  const currentFileType = AVAILABLE_FILE_TYPES.find(
    (i) => i.type === allowedType
  );
  const accept = currentFileType?.accept || "";
  const acceptedMimes = accept.split(",");
  const fileInputId = "file-input-" + field._id;

  // console.log({
  //   allowedType,
  //   fileInputId,
  //   accept,
  //   acceptedMimes,
  //   value,
  // });

  return (
    <div className="py-2">
      {typeof label === "string" || typeof label === "object" ? (
        <label className={`text-base ${disabled ? "text-gray-400" : ""}`}>
          {label}{" "}
          {label && !required && (
            <span className="text-gray-300">(optional)</span>
          )}
        </label>
      ) : null}

      <div
        onClick={(e) => {
          if (e) e.preventDefault();
          if (internalLoading) return;
          document.getElementById(fileInputId).click();
        }}
        className={`mt-1 border rounded-md hover:bg-primary-100 py-4 px-6 ${
          internalLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } ${value ? "border-green-400" : "border-gray-400"}`}
      >
        <div
          className={`py-6 flex flex-col items-center ${
            value ? "text-primary-300" : "text-primary-500"
          }`}
        >
          <div>
            <i className="fas fa-cloud-upload-alt fa-3x"></i>
          </div>
          <div className="mt-2">
            {internalLoading ? (
              <div className="font-bold flex items-center mt-1">
                <EllipsisLoading />
                <div className="-ml-3 -mt-1">Mengunggah file...</div>
              </div>
            ) : (
              <span className="font-bold">
                Klik untuk mengunggah file{" "}
                {allowedType !== "Semua" ? allowedType : ""}
              </span>
            )}
            {/* <span className="font-bold">Select File</span>
            &nbsp;atau&nbsp;
            <span className="font-bold">
              Seret File disini
            </span> */}
          </div>
        </div>
      </div>
      {value && (
        <a
          href={value}
          target="_blank"
          className="flex justify-center group -mt-2 py-2 px-3 text-base border border-green-400 bg-white rounded-b"
        >
          <div className="text-gray-400 hidden group-hover:block font-bold">
            <i className="fa fa-search" /> Lihat File
          </div>
          <div className="text-green-500 block group-hover:hidden">
            File berhasil diunggah <i className="fa fa-check" />
          </div>
        </a>
      )}

      <input
        id={fileInputId}
        style={{
          // display: "none",
          height: 1,
          opacity: 0.01,
        }}
        type="file"
        accept={accept}
        required={required}
        onChange={async (e) => {
          if (e) e.preventDefault();
          // console.log({
          //   field,
          //   allowedType,
          //   fileInputId,
          //   accept,
          //   acceptedMimes,
          // });
          if (!onChange) return;

          setInternalLoading(true);
          try {
            const file = e.target.files[0];
            if (file) {
              if (
                acceptedMimes &&
                acceptedMimes.length > 0 &&
                !acceptedMimes.includes(file.type)
              )
                throw {
                  message: `Hanya file ${allowedType} yang diijinkan untuk dipilih!`,
                };
              if (file.size > maxSize * 1024) {
                throw {
                  message: `Ukuran file terlalu besar (maksimum ukuran file adalah ${maxSize} KB)!`,
                };
              }

              let fileUrl = await handleFileUploadToS3({
                file,
                presignedEndpoint: "/storage-presigned-url",
                objectOwnerType: "attachment",
                objectOwnerId: field._id,
                objectName:
                  `file-${new Date().getTime()}.` +
                  mime.extension(mime.lookup(file.name)),
              });
              // console.log({ fileUrl });
              onChange({
                preventDefault: () => {},
                stopPropagation: () => {},
                target: {
                  value: fileUrl,
                },
              });

              notification.addNotification({
                title: "Sukses",
                message: `File berhasil diunggah!`,
                level: "success",
              });
            } else {
              clearFileInputById(fileInputId);
            }
          } catch (err) {
            notification.handleError(err);
            clearFileInputById(fileInputId);
          }
          setInternalLoading(false);
        }}
      />
    </div>
  );
};

export const AttachmentProps = ({
  onUpdate,
  // placeholder,
  allowedType,
  maxSize,
}) => {
  return (
    <div className="pt-1 pb-20">
      {/* <ShortText
        label="Placeholder"
        value={placeholder || ""}
        onChange={(e) => {
          if (e) e.preventDefault();
          if (onUpdate) {
            onUpdate({
              placeholder: e.target.value,
            });
          }
        }}
      /> */}
      <SingleSelect
        required
        label="Tipe File"
        options={AVAILABLE_FILE_TYPES.map((item) => item.type)}
        value={allowedType || ""}
        onChange={(e) => {
          if (e) e.preventDefault();
          if (onUpdate) {
            onUpdate({
              allowedType: e.target.value || "",
            });
          }
        }}
      />
      <Number
        required
        label="Max Size (dalam KB)"
        value={maxSize || ""}
        onChange={(e) => {
          if (e) e.preventDefault();
          if (onUpdate) {
            onUpdate({
              maxSize: parseFloat(e.target.value || "0"),
            });
          }
        }}
      />
    </div>
  );
};
