// @refresh reset
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { showLoadingSpinner, hideLoadingSpinner } from "./App";
import { useNotification } from "../components/Notification";
import gql from "graphql-tag";
import { useQuery, useMutation } from "@apollo/client";
import { FormModal, CustomModalTitle } from "./Modal";
import Toggle from "./form/Toggle";
import EditableText from "./form/EditableText";
import { motion, AnimatePresence } from "framer-motion";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { ShortText, ShortTextProps } from "./form/ShortText";
import { LongText, LongTextProps } from "./form/LongText";
import { SingleSelect, SingleSelectProps } from "./form/SingleSelect";
import { MultipleSelect, MultipleSelectProps } from "./form/MultipleSelect";
import { Number, NumberProps } from "./form/Number";
import { Currency, CurrencyProps } from "./form/Currency";
import { Date, DateProps } from "./form/Date";
import { PhoneNumber, PhoneNumberProps } from "./form/PhoneNumber";
import { OpinionScale, OpinionScaleProps } from "./form/OpinionScale";
import { Time, TimeProps } from "./form/Time";
import { Attachment, AttachmentProps } from "./form/Attachment";
import { Rating, RatingProps } from "./form/Rating";
import { Email, EmailProps } from "./form/Email";
import { Checkbox, CheckboxProps } from "./form/Checkbox";
import { URL, URLProps } from "./form/URL";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const CUSTOM_FORM = gql`
  query customForm($formId: String!, $ownerId: String!) {
    customForm(formId: $formId, ownerId: $ownerId) {
      _id
      _createdAt
      _updatedAt

      formId
      ownerId
      status

      fields {
        _id
        _createdAt
        _updatedAt

        type
        placeholder
        options {
          value
          color
        }
        numberFormat
        minValue
        maxValue
        decimalPlace
        allowNegative
        dateFormat
        minDate
        maxDate
        statement
        ratingIcon
        maxScale
        minScale
        leftLabel
        rightLabel

        required
        question
      }
    }
  }
`;

const UPDATE = gql`
  mutation updateCustomForm(
    $formId: String!
    $ownerId: String!
    $fields: [CustomFieldPayload!]!
  ) {
    updateCustomForm(formId: $formId, ownerId: $ownerId, fields: $fields)
  }
`;

const TOGGLE = gql`
  mutation toggleCustomFormStatus(
    $formId: String!
    $ownerId: String!
    $status: String!
  ) {
    toggleCustomFormStatus(formId: $formId, ownerId: $ownerId, status: $status)
  }
`;

const sanitizeCustomFields = (customFields) => {
  return customFields.map((customField) => {
    let {
      // unused fields
      __typename,
      color,
      icon,
      name,
      _createdAt,
      _updatedAt,
      // sanitized fields
      ...sanitizedCustomField
    } = customField;
    if (!sanitizedCustomField._id) {
      sanitizedCustomField._id = "";
    }
    if (sanitizedCustomField.options) {
      sanitizedCustomField.options = sanitizedCustomField.options.map(
        (option) => {
          return {
            value: option.value,
            color: option.color,
          };
        }
      );
    } else {
      sanitizedCustomField.options = [];
    }
    return sanitizedCustomField;
  });
};

export const FormCustomizer = ({
  ownerId = "",
  formId = "",
  title,
  onChange,
}) => {
  let notification = useNotification();

  const [updateCustomForm] = useMutation(UPDATE);
  const [toggleCustomFormStatus] = useMutation(TOGGLE);
  let { loading, error, data, refetch } = useQuery(CUSTOM_FORM, {
    variables: {
      ownerId,
      formId,
    },
  });
  let customForm = { fields: [] };
  if (data && data.customForm) {
    customForm = {
      ...data.customForm,
    };
    if (!customForm.fields) {
      customForm.fields = [];
    }
  }

  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState(null);

  let [fields, setFields] = useState([]);
  useEffect(() => {
    if (error || loading) return;
    setFields([...customForm.fields]);
  }, [customForm.fields, error, loading]);

  const dropFieldAndMove = useCallback(
    (dragIndex, hoverIndex) => {
      const draggedField = fields[dragIndex];

      let newFields = [...fields];
      newFields.splice(dragIndex, 1);
      newFields.splice(hoverIndex, 0, draggedField);
      setFields(newFields);
    },
    [fields]
  );

  return (
    <DndProvider backend={HTML5Backend}>
      {/* <div className="bg-white shadow-md px-4 md:px-8 w-full py-6 rounded-lg"> */}
      <div className="flex justify-between">
        <div className="w-full">
          {title || <div className="font-bold text-sm">Custom Fields</div>}
          <div className="flex items-center">
            <Toggle
              className="transform scale-75"
              active={customForm.status === "Aktif"}
              onChange={async (e) => {
                if (e && e.preventDefault) e.preventDefault();
                showLoadingSpinner();
                try {
                  await toggleCustomFormStatus({
                    variables: {
                      ownerId,
                      formId,
                      status:
                        customForm.status === "Aktif" ? "Tidak Aktif" : "Aktif",
                    },
                  });
                  await refetch();
                } catch (err) {
                  notification.handleError(err);
                }
                hideLoadingSpinner();
              }}
            />
            <div
              className={
                "pr-2 text-sm md:text-md " +
                (customForm.status === "Aktif"
                  ? "text-green-500"
                  : "text-red-500")
              }
            >
              {customForm.status || "Tidak Aktif"}
            </div>
          </div>
        </div>

        {internalError ? (
          <div className={`text-sm text-red-500 transition duration-200`}>
            <i className="italic">Terjadi kesalahan!</i>
            &nbsp;&nbsp;&nbsp;
            <a
              href="#"
              className="btn btn-danger btn-sm"
              onClick={async (e) => {
                if (e) e.preventDefault();
                setInternalLoading(true);
                showLoadingSpinner();
                try {
                  await updateCustomForm({
                    variables: {
                      ownerId,
                      formId,
                      fields: sanitizeCustomFields(fields),
                    },
                  });
                  await refetch();
                  setInternalError(null);
                  if (onChange) {
                    onChange({
                      ownerId,
                      formId,
                      fields: sanitizeCustomFields(fields),
                      status: customForm.status,
                    });
                  }
                } catch (err) {
                  setInternalError(err);
                  notification.handleError(err);
                }
                hideLoadingSpinner();
                setInternalLoading(false);
              }}
            >
              <i className="fa fa-history" /> Ulangi simpan
            </a>
          </div>
        ) : (
          <div
            className={`italic text-sm text-gunpowder-500 transition duration-200 ${
              internalLoading ? "opacity-75" : "opacity-0"
            }`}
          >
            Menyimpan custom form...
          </div>
        )}
      </div>
      <div className={customForm.status === "Aktif" ? "" : "opacity-25"}>
        {fields && fields?.length === 0 ? (
          <div className="flex flex-col items-center text-center text-muted pt-8">
            <img className="h-48" src="/images/no-field.png" />
            <h1 className="mt-1">Kustomisasi Data Anggota Anda</h1>
          </div>
        ) : (
          fields.map((field, index) => {
            return (
              <FieldCustomizer
                key={field._id}
                //
                id={field._id}
                index={index}
                dropFieldAndMove={dropFieldAndMove}
                //
                onToggleRequired={async (e) => {
                  if (e && e.preventDefault) e.preventDefault();
                  setInternalLoading(true);
                  showLoadingSpinner();
                  try {
                    let newFields = fields.map((f) =>
                      f._id !== field._id
                        ? f
                        : { ...f, required: e.target.active }
                    );
                    setFields(newFields);
                    await updateCustomForm({
                      variables: {
                        ownerId,
                        formId,
                        fields: sanitizeCustomFields(newFields),
                      },
                    });
                    await refetch();
                    setInternalError(null);
                    if (onChange) {
                      onChange({
                        ownerId,
                        formId,
                        fields: sanitizeCustomFields(fields),
                        status: customForm.status,
                      });
                    }
                  } catch (err) {
                    setInternalError(err);
                    notification.handleError(err);
                  }
                  hideLoadingSpinner();
                  setInternalLoading(false);
                }}
                onEdit={async (changedField) => {
                  setInternalLoading(true);
                  showLoadingSpinner();
                  try {
                    let newFields = fields.map((f) =>
                      f._id !== field._id ? f : { ...f, ...changedField }
                    );
                    setFields(newFields);
                    await updateCustomForm({
                      variables: {
                        ownerId,
                        formId,
                        fields: sanitizeCustomFields(newFields),
                      },
                    });
                    await refetch();
                    setInternalError(null);
                    if (onChange) {
                      onChange({
                        ownerId,
                        formId,
                        fields: sanitizeCustomFields(fields),
                        status: customForm.status,
                      });
                    }
                  } catch (err) {
                    setInternalError(err);
                    notification.handleError(err);
                  }
                  hideLoadingSpinner();
                  setInternalLoading(false);
                }}
                onRemove={async (e) => {
                  if (e) e.preventDefault();
                  try {
                    let yes = confirm(
                      `Apakah anda yakin untuk menghapus field ini?`
                    );
                    if (yes) {
                      setInternalLoading(true);
                      showLoadingSpinner();

                      let newFields = fields.filter((f) => f._id !== field._id);
                      setFields(newFields);
                      await updateCustomForm({
                        variables: {
                          ownerId,
                          formId,
                          fields: sanitizeCustomFields(newFields),
                        },
                      });
                      await refetch();
                      if (onChange) {
                        onChange({
                          ownerId,
                          formId,
                          fields: sanitizeCustomFields(fields),
                          status: customForm.status,
                        });
                      }
                    }
                    setInternalError(null);
                  } catch (err) {
                    setInternalError(err);
                    notification.handleError(err);
                  }
                  hideLoadingSpinner();
                  setInternalLoading(false);
                }}
                onEditQuestion={async (e) => {
                  if (e && e.preventDefault) e.preventDefault();
                  if (e.target.value === field.question) {
                    return;
                  }
                  setInternalLoading(true);
                  showLoadingSpinner();
                  try {
                    let newFields = fields.map((f) =>
                      f._id !== field._id
                        ? f
                        : { ...f, question: e.target.value || "" }
                    );
                    setFields(newFields);
                    await updateCustomForm({
                      variables: {
                        ownerId,
                        formId,
                        fields: sanitizeCustomFields(newFields),
                      },
                    });
                    await refetch();
                    setInternalError(null);
                    if (onChange) {
                      onChange({
                        ownerId,
                        formId,
                        fields: sanitizeCustomFields(fields),
                        status: customForm.status,
                      });
                    }
                  } catch (err) {
                    setInternalError(err);
                    notification.handleError(err);
                  }
                  hideLoadingSpinner();
                  setInternalLoading(false);
                }}
                {...field}
              >
                {field.type === "Short Text" ? (
                  <ShortText {...field} />
                ) : field.type === "Long Text" ? (
                  <LongText {...field} />
                ) : field.type === "Single Select" ? (
                  <SingleSelect {...field} />
                ) : field.type === "Multiple Select" ? (
                  <MultipleSelect {...field} />
                ) : field.type === "Number" ? (
                  <Number {...field} />
                ) : field.type === "Currency" ? (
                  <Currency {...field} />
                ) : field.type === "Date" ? (
                  <Date {...field} />
                ) : field.type === "Phone Number" ? (
                  <PhoneNumber {...field} />
                ) : field.type === "Time" ? (
                  <Time {...field} />
                ) : field.type === "Attachment" ? (
                  <Attachment {...field} />
                ) : field.type === "Opinion Scale" ? (
                  <OpinionScale {...field} />
                ) : field.type === "Rating" ? (
                  <Rating {...field} />
                ) : field.type === "Email" ? (
                  <Email {...field} />
                ) : field.type === "Checkbox" ? (
                  <Checkbox {...field} />
                ) : (
                  <URL {...field} />
                )}
              </FieldCustomizer>
            );
          })
        )}

        <AddFieldButton
          onCreate={async (newField) => {
            showLoadingSpinner();
            try {
              let newFields = [...fields, newField];
              setFields(newFields);
              await updateCustomForm({
                variables: {
                  ownerId,
                  formId,
                  fields: sanitizeCustomFields(newFields),
                },
              });
              await refetch();
              setInternalError(null);
              if (onChange) {
                onChange({
                  ownerId,
                  formId,
                  fields: sanitizeCustomFields(fields),
                  status: customForm.status,
                });
              }
            } catch (err) {
              setInternalError(err);
              notification.handleError(err);
            }
            hideLoadingSpinner();
          }}
        />
      </div>
      {/* </div> */}
    </DndProvider>
  );
};

const AddFieldButton = ({ onCreate }) => {
  const [fieldModalVisible, setFieldModalVisible] = useState(false);

  return (
    <div className="flex justify-center my-8">
      <FieldCustomizerModal
        visible={fieldModalVisible}
        onClose={(e) => {
          setFieldModalVisible(false);
        }}
        onSubmit={onCreate}
      />
      <button
        className="btn btn-primary w-full sm:w-auto"
        type="button"
        onClick={(e) => {
          if (e) e.preventDefault();
          setFieldModalVisible(true);
        }}
      >
        <i className="fa fa-plus-circle"></i> Tambah Field
      </button>
    </div>
  );
};

const ALL_FIELD_TYPES = [
  {
    color: "bg-primary-400",
    icon: "font",
    name: "Short Text",
  },
  {
    color: "bg-green-400",
    icon: "align-left",
    name: "Long Text",
  },
  {
    color: "bg-orange-400",
    icon: "caret-square-down",
    name: "Single Select",
  },
  {
    color: "bg-red-400",
    icon: "list",
    name: "Multiple Select",
  },
  {
    color: "bg-pink-400",
    icon: "sort-numeric-down",
    name: "Number",
  },
  {
    color: "bg-purple-400",
    icon: "dollar-sign",
    name: "Currency",
  },
  {
    color: "bg-gunpowder-400",
    icon: "phone",
    name: "Phone Number",
  },
  {
    color: "bg-red-400",
    icon: "envelope",
    name: "Email",
  },
  {
    color: "bg-orange-400",
    icon: "link",
    name: "URL",
  },
  {
    color: "bg-indigo-400",
    icon: "calendar-day",
    name: "Date",
  },
  {
    color: "bg-pink-400",
    icon: "clock",
    name: "Time",
  },
  {
    color: "bg-purple-400",
    icon: "check-square",
    name: "Checkbox",
  },
  {
    color: "bg-indigo-400",
    icon: "star",
    name: "Rating",
  },
  {
    color: "bg-green-400",
    icon: "signal",
    name: "Opinion Scale",
  },
  {
    color: "bg-primary-400",
    icon: "file",
    name: "Attachment",
  },
];

const FieldCustomizerModal = ({
  visible,
  onClose,
  onSubmit,
  ...fieldProps
}) => {
  const [keyword, setKeyword] = useState("");
  const [selectVisible, setSelectVisible] = useState(false);
  const [fieldType, setFieldType] = useState({
    color: "blue",
    icon: "font",
    name: "Short Text",
  });

  useEffect(() => {
    if (!visible) return;

    setKeyword("");
    setSelectVisible(false);
    let fieldTypeProps = ALL_FIELD_TYPES.find(
      (t) => t.name === (fieldProps?.type || "Short Text")
    );
    setFieldType({ ...fieldTypeProps, ...fieldProps });
  }, [visible, fieldProps?.type]);

  let dropdown = useRef();
  useEffect(() => {
    if (!visible) return;

    const handleClick = (e) => {
      if (!dropdown.current.contains(e.target)) {
        // setTimeout(() => {
        setSelectVisible(false);
        // }, 10);
        return;
      }
    };

    // add when mounted
    document.addEventListener("mousedown", handleClick);
    // return function to be called when unmounted
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [visible]);

  return (
    <FormModal
      title="Kustomisasi Form"
      visible={visible}
      closeLabel="Batalkan"
      onClose={onClose}
      onSubmit={async (e) => {
        if (e) e.preventDefault();
        if (onSubmit) {
          await onSubmit({
            // ...fieldProps,
            ...fieldType,
            type: fieldType.name,
          });
        }
        if (onClose) {
          onClose(e);
        }
      }}
    >
      <div>Pilih Jenis Field</div>
      <div
        onClick={(e) => {
          if (e) e.preventDefault();
          setSelectVisible(!selectVisible);
        }}
        className="cursor-pointer py-2 px-4 w-full border border-gunpowder-200 text-gunpowder-500 rounded-lg relative mt-3 mb-4"
      >
        <FontAwesomeIcon icon={fieldType.icon} />
        &nbsp;{fieldType.name}{" "}
        {selectVisible ? (
          <i className="fa fa-caret-up absolute top-0 right-0 pt-3 mr-4"></i>
        ) : (
          <i className="fa fa-caret-down absolute top-0 right-0 pt-3 mr-4"></i>
        )}
        <div ref={dropdown}>
          <AnimatePresence>
            {selectVisible ? (
              <motion.div
                initial={{
                  opacity: 0,
                  height: "0",
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                }}
                exit={{
                  opacity: 0,
                  height: "0",
                }}
                transition={{
                  duration: 0.2,
                }}
                className="flex justify-center"
              >
                <div className="rounded bg-white z-20 absolute top-0 left-0 right-0 mt-12 border border-gunpowder-100 overflow-y-scroll h-64">
                  {ALL_FIELD_TYPES.filter((field) => {
                    return field.name?.toLowerCase().indexOf(keyword) >= 0;
                  }).map((field) => {
                    return (
                      <a
                        href="#"
                        onClick={(e) => {
                          if (e) e.preventDefault();
                          setFieldType({ ...fieldProps, ...field });
                        }}
                        className="py-2 hover:bg-primary-100 px-4 flex items-center"
                      >
                        <div
                          className={` ${field.color} h-8 w-8 flex justify-center items-center text-white rounded-full`}
                        >
                          <FontAwesomeIcon icon={field.icon} />
                        </div>
                        &nbsp;&nbsp;&nbsp;
                        {field.name}
                      </a>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div>
        {fieldType.name === "Short Text" ? (
          <ShortTextProps
            {...fieldType}
            onUpdate={(props) => {
              setFieldType({
                ...fieldType,
                ...props,
              });
            }}
          />
        ) : fieldType.name === "Long Text" ? (
          <LongTextProps
            {...fieldType}
            onUpdate={(props) => {
              setFieldType({
                ...fieldType,
                ...props,
              });
            }}
          />
        ) : fieldType.name === "Single Select" ? (
          <SingleSelectProps
            {...fieldType}
            onUpdate={(props) => {
              setFieldType({
                ...fieldType,
                ...props,
              });
            }}
          />
        ) : fieldType.name === "Multiple Select" ? (
          <MultipleSelectProps
            {...fieldType}
            onUpdate={(props) => {
              setFieldType({
                ...fieldType,
                ...props,
              });
            }}
          />
        ) : fieldType.name === "Number" ? (
          <NumberProps
            {...fieldType}
            onUpdate={(props) => {
              setFieldType({
                ...fieldType,
                ...props,
              });
            }}
          />
        ) : fieldType.name === "Currency" ? (
          <CurrencyProps
            {...fieldType}
            onUpdate={(props) => {
              setFieldType({
                ...fieldType,
                ...props,
              });
            }}
          />
        ) : fieldType.name === "Date" ? (
          <DateProps
            {...fieldType}
            onUpdate={(props) => {
              setFieldType({
                ...fieldType,
                ...props,
              });
            }}
          />
        ) : fieldType.name === "Phone Number" ? (
          <PhoneNumberProps
            {...fieldType}
            onUpdate={(props) => {
              setFieldType({
                ...fieldType,
                ...props,
              });
            }}
          />
        ) : fieldType.name === "Time" ? (
          <TimeProps
            {...fieldType}
            onUpdate={(props) => {
              setFieldType({
                ...fieldType,
                ...props,
              });
            }}
          />
        ) : fieldType.name === "Attachment" ? (
          <AttachmentProps
            {...fieldType}
            onUpdate={(props) => {
              setFieldType({
                ...fieldType,
                ...props,
              });
            }}
          />
        ) : fieldType.name === "Opinion Scale" ? (
          <OpinionScaleProps
            {...fieldType}
            onUpdate={(props) => {
              setFieldType({
                ...fieldType,
                ...props,
              });
            }}
          />
        ) : fieldType.name === "Rating" ? (
          <RatingProps
            {...fieldType}
            onUpdate={(props) => {
              setFieldType({
                ...fieldType,
                ...props,
              });
            }}
          />
        ) : fieldType.name === "Email" ? (
          <EmailProps
            {...fieldType}
            onUpdate={(props) => {
              setFieldType({
                ...fieldType,
                ...props,
              });
            }}
          />
        ) : fieldType.name === "Checkbox" ? (
          <CheckboxProps
            {...fieldType}
            onUpdate={(props) => {
              setFieldType({
                ...fieldType,
                ...props,
              });
            }}
          />
        ) : (
          <URLProps
            {...fieldType}
            onUpdate={(props) => {
              setFieldType({
                ...fieldType,
                ...props,
              });
            }}
          />
        )}
      </div>
    </FormModal>
  );
};

const FieldCustomizer = ({
  onEdit,
  children,
  onRemove,
  onToggleRequired,
  onEditQuestion,
  id,
  index,
  dropFieldAndMove,
  ...fieldProps
}) => {
  const [expanded, setExpanded] = useState(false);
  const [fieldModalVisible, setFieldModalVisible] = useState(false);
  const [fieldType, setFieldType] = useState({
    name: "Short Text",
    icon: "font",
  });

  const ref = useRef();
  useEffect(() => {
    if (!expanded) return;

    const handleClick = (e) => {
      if (!ref.current.contains(e.target)) {
        setTimeout(() => {
          setExpanded(false);
        }, 10);
        return;
      }
    };

    let fieldTypeProps = ALL_FIELD_TYPES.find(
      (t) => t.name === (fieldProps?.type || "Short Text")
    );
    setFieldType({ ...fieldTypeProps, ...fieldProps });

    // add when mounted
    document.addEventListener("mousedown", handleClick);
    // return function to be called when unmounted
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [expanded, fieldProps.type]);

  const dragDropRef = useRef();
  const [, drop] = useDrop({
    accept: "FIELD_CUSTOMIZER",
    hover(item, monitor) {
      if (!dragDropRef.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = dragDropRef.current?.getBoundingClientRect();
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      const hoverMiddleTop =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 4;
      const hoverMiddleBottom =
        ((hoverBoundingRect.bottom - hoverBoundingRect.top) * 3) / 4;

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleTop) {
        return;
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleBottom) {
        return;
      }

      // console.log({
      //   dragIndex,
      //   hoverIndex,
      // });
      // Time to actually perform the action
      dropFieldAndMove(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });
  const [{ isDragging }, drag] = useDrag({
    item: { type: "FIELD_CUSTOMIZER", id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  drag(drop(dragDropRef));

  return (
    <div
      className={`${
        isDragging
          ? "border-2 border-blue-600 bg-blue-100 opacity-25"
          : "border border-gunpowder-200"
      } rounded-lg mt-6`}
      ref={ref}
    >
      <FieldCustomizerModal
        visible={fieldModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setFieldModalVisible(false);
        }}
        onSubmit={onEdit}
        {...fieldProps}
      />

      <div ref={dragDropRef}>
        <AnimatePresence>
          {expanded ? (
            <motion.div
              initial={{
                opacity: 0,
                height: "0",
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: "0",
              }}
              transition={{
                duration: 0.1,
              }}
            >
              <div
                // onClick={(e) => {
                //   if (e) e.preventDefault();
                //   setExpanded(false);
                // }}
                className="cursor-pointer md:flex py-4 border-b border-gunpowder-200 items-center px-4 md:px-6"
              >
                <div className="md:w-1/2 flex items-center">
                  <div className="flex text-gunpowder-400 pr-8">
                    <FontAwesomeIcon icon="ellipsis-v" />
                    <FontAwesomeIcon icon="ellipsis-v" />
                    {/* <i className="fa fa-ellipsis-v"></i> */}
                    {/* <i className="fa fa-ellipsis-v"></i> */}
                  </div>
                  <div>
                    <FontAwesomeIcon icon={fieldType.icon} />{" "}
                    {/* <i className={`fa fa-${fieldType.icon}`}></i>{" "} */}
                    {fieldType.name}
                  </div>
                </div>
                {fieldProps?.type !== "Checkbox" ? (
                  <div className="md:w-1/2 text-xs md:text-md flex items-center justify-end mt-2 md:mt-0">
                    Required{" "}
                    <Toggle
                      className="transform scale-75"
                      active={!!fieldProps?.required}
                      onChange={onToggleRequired}
                      activeBackgroundColor="#c0392b"
                    />
                  </div>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div
          onClick={(e) => {
            if (e) e.preventDefault();
            setExpanded(true);
          }}
          className="bg-white rounded shadow cursor-pointer pt-6 pb-4 px-4 md:px-6"
        >
          <div className="flex items-center -mb-2">
            <label className="text-sm">
              <EditableText
                onBlur={onEditQuestion}
                placeholder="Ketik pertanyaan di sini..."
              >
                {fieldProps.question || ""}
              </EditableText>
            </label>
            {fieldProps?.type !== "Checkbox" && fieldProps?.required ? (
              <AnimatePresence>
                {!expanded ? (
                  <motion.div
                    initial={{
                      opacity: 0,
                      height: "0",
                    }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                    }}
                    exit={{
                      opacity: 0,
                      height: "0",
                    }}
                    To
                    transition={{
                      duration: 0.1,
                    }}
                    className="flex-grow text-right text-sm text-red-400"
                  >
                    <i className="fa fa-exclamation-circle" /> Required
                  </motion.div>
                ) : null}
              </AnimatePresence>
            ) : null}
          </div>
          {children}
        </div>

        <AnimatePresence>
          {expanded ? (
            <motion.div
              initial={{
                opacity: 0,
                height: "0",
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: "0",
              }}
              transition={{
                duration: 0.1,
              }}
            >
              <div
                // onClick={(e) => {
                //   if (e) e.preventDefault();
                //   setExpanded(false);
                // }}
                className="cursor-pointer flex justify-end py-4 px-6 bg-gunpowder-100"
              >
                <button
                  className="btn btn-sm btn-danger text-xs btn-rounded btn-flat float-left mr-3"
                  type="button"
                  onClick={onRemove}
                >
                  <FontAwesomeIcon icon="trash-alt" />
                  &nbsp; Hapus
                </button>

                <button
                  className="btn btn-sm btn-primary text-xs"
                  type="button"
                  onClick={(e) => {
                    if (e) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                    setFieldModalVisible(true);
                    setFieldType(fieldType);
                  }}
                >
                  <FontAwesomeIcon icon="edit" />
                  &nbsp; Edit
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const CustomForm = ({
  ownerId = "",
  formId = "",
  value = {},
  onChange,
}) => {
  let { loading, error, data, refetch } = useQuery(CUSTOM_FORM, {
    variables: {
      ownerId,
      formId,
    },
  });
  let customForm = { fields: [] };
  if (data && data.customForm) {
    customForm = {
      ...data.customForm,
    };
    if (!customForm.fields) {
      customForm.fields = [];
    }
  }
  // console.log({ customForm });

  const formData = useMemo(() => {
    let formData = {};
    for (const field of customForm.fields) {
      let label = field.question;
      formData[label] = value?.[label] || "";
    }
    return formData;
  }, [value, customForm.fields]);

  if (
    !loading &&
    !error &&
    (!customForm || !customForm._id || customForm.status !== "Aktif")
  ) {
    return null;
  }

  return customForm.fields.map((field) => {
    const label = field.question;
    const value = formData[label] || "";

    return (
      <div key={field._id}>
        {field.type === "Short Text" ? (
          <ShortText
            {...field}
            label={label}
            value={value}
            onChange={(e) => {
              if (!onChange) return;
              onChange({
                formData: {
                  ...formData,
                  [label]: e.target.value,
                },
                field,
                label,
                value,
              });
            }}
          />
        ) : field.type === "Long Text" ? (
          <LongText
            {...field}
            label={label}
            value={value}
            onChange={(e) => {
              if (!onChange) return;
              onChange({
                formData: {
                  ...formData,
                  [label]: e.target.value,
                },
                field,
                label,
                value,
              });
            }}
          />
        ) : field.type === "Single Select" ? (
          <SingleSelect
            {...field}
            label={label}
            value={value}
            onChange={(e) => {
              if (!onChange) return;
              onChange({
                formData: {
                  ...formData,
                  [label]: e.target.value,
                },
                field,
                label,
                value,
              });
            }}
          />
        ) : field.type === "Multiple Select" ? (
          <MultipleSelect
            {...field}
            label={label}
            value={value}
            onChange={(e) => {
              if (!onChange) return;
              onChange({
                formData: {
                  ...formData,
                  [label]: e.target.value,
                },
                field,
                label,
                value,
              });
            }}
          />
        ) : field.type === "Number" ? (
          <Number
            {...field}
            label={label}
            value={value}
            onChange={(e) => {
              if (!onChange) return;
              onChange({
                formData: {
                  ...formData,
                  [label]: e.target.value,
                },
                field,
                label,
                value,
              });
            }}
          />
        ) : field.type === "Currency" ? (
          <Currency
            {...field}
            label={label}
            value={value}
            onChange={(e) => {
              if (!onChange) return;
              onChange({
                formData: {
                  ...formData,
                  [label]: e.target.value,
                },
                field,
                label,
                value,
              });
            }}
          />
        ) : field.type === "Date" ? (
          <Date
            {...field}
            label={label}
            value={value}
            onChange={(e) => {
              if (!onChange) return;
              onChange({
                formData: {
                  ...formData,
                  [label]: e.target.value,
                },
                field,
                label,
                value,
              });
            }}
          />
        ) : field.type === "Phone Number" ? (
          <PhoneNumber
            {...field}
            label={label}
            value={value}
            onChange={(e) => {
              if (!onChange) return;
              onChange({
                formData: {
                  ...formData,
                  [label]: e.target.value,
                },
                field,
                label,
                value,
              });
            }}
          />
        ) : field.type === "Time" ? (
          <Time
            {...field}
            label={label}
            value={value}
            onChange={(e) => {
              if (!onChange) return;
              onChange({
                formData: {
                  ...formData,
                  [label]: e.target.value,
                },
                field,
                label,
                value,
              });
            }}
          />
        ) : field.type === "Attachment" ? (
          <Attachment
            {...field}
            label={label}
            value={value}
            onChange={(e) => {
              if (!onChange) return;
              onChange({
                formData: {
                  ...formData,
                  [label]: e.target.value,
                },
                field,
                label,
                value,
              });
            }}
          />
        ) : field.type === "Opinion Scale" ? (
          <OpinionScale
            {...field}
            label={label}
            value={value}
            onChange={(e) => {
              if (!onChange) return;
              onChange({
                formData: {
                  ...formData,
                  [label]: e.target.value,
                },
                field,
                label,
                value,
              });
            }}
          />
        ) : field.type === "Rating" ? (
          <Rating
            {...field}
            label={label}
            value={value}
            onChange={(e) => {
              if (!onChange) return;
              onChange({
                formData: {
                  ...formData,
                  [label]: e.target.value,
                },
                field,
                label,
                value,
              });
            }}
          />
        ) : field.type === "Email" ? (
          <Email
            {...field}
            label={label}
            value={value}
            onChange={(e) => {
              if (!onChange) return;
              onChange({
                formData: {
                  ...formData,
                  [label]: e.target.value,
                },
                field,
                label,
                value,
              });
            }}
          />
        ) : field.type === "Checkbox" ? (
          <Checkbox
            {...field}
            label={label}
            value={value}
            onChange={(e) => {
              if (!onChange) return;
              onChange({
                formData: {
                  ...formData,
                  [label]: e.target.value,
                },
                field,
                label,
                value,
              });
            }}
          />
        ) : (
          <URL
            {...field}
            label={label}
            value={value}
            onChange={(e) => {
              if (!onChange) return;
              onChange({
                formData: {
                  ...formData,
                  [label]: e.target.value,
                },
                field,
                label,
                value,
              });
            }}
          />
        )}
      </div>
    );
  });
};
