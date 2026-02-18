import React, { useRef, useEffect, useState, useCallback } from "react";

const EditableText = ({
  disabled,
  className,
  style,
  children,
  onBlur,
  loading,
  multiline,
  placeholder,
  fontColor,
}) => {
  const input = useRef();
  const [mode, setMode] = useState("VIEW");
  const [innerHTML, setInnerHTML] = useState("");
  useEffect(() => {
    if (!children) {
      setInnerHTML("");
    } else if (typeof children === "string") {
      const html = children.split("\n").join("<br />");
      setInnerHTML(html);
    } else if (children && typeof children !== "string") {
      console.warn("Children must be string!");
    }
  }, [children]);
  useEffect(() => {
    if (mode === "CLICK_EDIT") {
      input.current.focus();
      setTimeout(() => {
        document.execCommand("selectAll", false, null);
        document.getSelection().collapseToEnd();
      }, 10);
      setMode("EDIT");
    } else if (mode === "EDIT") {
      input.current.focus();

      const preventCommandCtrl = (event) => {
        const keyCode = event.keyCode || event.which;
        if (event.ctrlKey || event.metaKey) {
          // console.log(event.ctrlKey, event.metaKey, keyCode);
          if (keyCode === 66 || keyCode === 73) {
            event.preventDefault();
            return false;
          }
        }
      };

      document.addEventListener("keydown", preventCommandCtrl, false);
      return () => {
        document.removeEventListener("keydown", preventCommandCtrl);
      };
    }
  }, [mode]);

  const handleSave = useCallback((e) => {
    if (e) e.preventDefault();
    const content = {
      text: trimSpaces(e.target.innerText),
      html: e.target.innerHTML,
    };
    if (onBlur) {
      onBlur({
        target: {
          ...content,
          value: content.text,
        },
      });
    }
    setMode("VIEW");
  });

  return (
    <span className={(loading ? "opacity-50 " : "") + (className || "flex")}>
      <span
        ref={input}
        suppressContentEditableWarning
        spellCheck={false}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text");
          input.current.innerText = text;
        }}
        // onKeyPress={!multiline ? disableNewlines({ type: "text" }) : null}
        onKeyPress={(e) => {
          const keyCode = e.keyCode || e.which;
          if (keyCode === 13 && !multiline) {
            e.returnValue = false;
            if (e.preventDefault) e.preventDefault();
            handleSave(e);
          }
        }}
        // onFocus={(e) => {
        //   setTimeout(() => {
        //     document.execCommand("selectAll", false, null);
        //     document.getSelection().collapseToEnd();
        //   }, 0);
        // }}
        style={{
          ...style,
          minWidth: 2,
          textDecorationStyle: "dashed",
          textDecorationColor: "rgba(0, 0, 0, 0.3)",
        }}
        className={
          "inline-block outline-none bg-transparent " +
          (!disabled ? "hover:opacity-80 " : "") +
          (!disabled && mode === "EDIT" ? " underline" : "") +
          (innerHTML || mode === "EDIT"
            ? " "
            : ` ${fontColor ? fontColor : "text-gray-300 font-light"}`)
          // + (!disabled && mode === "EDIT" ? "shadow" : "")
        }
        contentEditable={!disabled && mode === "EDIT"}
        onBlur={handleSave}
        // onInput={(e) => {
        //   if (e) e.preventDefault();
        //   console.log(input.current.innerText);
        // }}
        onClick={
          disabled
            ? null
            : (e) => {
                if (e) e.preventDefault();
                setMode("EDIT");
                setTimeout(() => {
                  input.current.focus();
                }, 0);
              }
        }
        dangerouslySetInnerHTML={{
          __html:
            innerHTML ||
            (mode === "VIEW"
              ? disabled
                ? ""
                : placeholder || "Klik untuk edit"
              : ""),
        }}
      >
        {/* {children} */}
      </span>
      &nbsp;
      {loading ? (
        <span className="pl-1">
          <i
            className="fa fa-fw fa-circle-notch fa-spin"
            style={{ fontSize: "85%" }}
          />
        </span>
      ) : (
        <>
          {mode === "VIEW" && !disabled ? (
            <a
              href="#"
              onClick={(e) => {
                if (e) {
                  e.preventDefault();
                  e.stopPropagation();
                }
                setMode("CLICK_EDIT");
              }}
            >
              <i
                className="pl-1 fa fa-fw fa-pencil-alt opacity-25"
                style={{ fontSize: "85%" }}
              />
            </a>
          ) : null}
          {mode === "EDIT" && !disabled ? (
            <a
              href="#"
              onClick={(e) => {
                if (e) {
                  e.preventDefault();
                  e.stopPropagation();
                }
                setMode("VIEW");
              }}
            >
              <i
                className="fa fa-fw fa-save opacity-25"
                style={{ fontSize: "85%" }}
              />
            </a>
          ) : null}
        </>
      )}
    </span>
  );
};

export default EditableText;

const trimSpaces = (string) => {
  return string
    .replace(/&nbsp;/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<");
};

// const disableNewlines = ({ type = "text" }) => (event) => {
//   const keyCode = event.keyCode || event.which;

//   if (keyCode === 13) {
//     event.returnValue = false;
//     if (event.preventDefault) event.preventDefault();
//   }

//   if (type === "number") {
//     const string = String.fromCharCode(keyCode);
//     const regex = /[0-9,]|\./;
//     if (!regex.test(string)) {
//       event.returnValue = false;
//       if (event.preventDefault) event.preventDefault();
//     }
//   }
// };
