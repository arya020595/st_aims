const PDFMake = require("pdfmake");
const { existsSync, mkdirSync, writeFileSync } = require("fs");
const pdfFonts = require("./pdf-fonts");
const printer = new PDFMake({
  ...pdfFonts,
});

const createPdf = ({ docDefinition, prefix, filename, basePath }) => {
  if (!docDefinition) {
    throw new Error("Undefined docDefinition!");
  }
  if (!filename) {
    throw new Error("Undefined filename!");
  }

  return new Promise((resolve, reject) => {
    // console.log("Init pdfDoc");
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    if (!existsSync(process.cwd() + "/../app/public/cache/")) {
      mkdirSync(process.cwd() + "/../app/public/cache", { recursive: true });
    }
    let outputDir = process.cwd() + "/../app/public/cache";

    if (prefix) {
      outputDir = outputDir + "/" + prefix;
    }
    if (prefix && !existsSync(outputDir)) {
      mkdirSync(outputDir);
    }
    const filePath = `${outputDir}/${filename}`;
    // console.log({ outputDir, filePath, filename });
    // pdfDoc.pipe(createWriteStream(filePath));
    // console.log("end pdfDoc");
    pdfDoc.end();

    let buffers = [];
    pdfDoc.on("data", buffers.push.bind(buffers));
    pdfDoc.on("end", () => {
      let pdfData = Buffer.concat(buffers);
      writeFileSync(filePath, pdfData);
      const urlPath = `${basePath || ""}/cache/${
        prefix ? prefix + "/" : ""
      }${filename}`;
      resolve(urlPath);
    });
  });
};

exports.createPdf = createPdf;

const hrLine = (width) => ({
  canvas: [
    {
      type: "line",
      x1: 20,
      y1: 5,
      x2: width - 20,
      y2: 5,
      lineWidth: 0.7,
    },
  ],
});
exports.hrLine = hrLine;

const renderLogoBase64 = (logoUrl) => {
  // console.log("logoUrl", logoUrl.substring(0, 100));
  return logoUrl
    ? {
        image: logoUrl,
        // width: 60,
        maxWidth: 140,
        maxHeight: 60,
        absolutePosition: { x: 20, y: 8 },
      }
    : {};
};
exports.renderLogoBase64 = renderLogoBase64;

exports.renderFooter = () => (currentPage, pageCount) => ({
  // text: "Hal " + currentPage.toString() + " dari " + pageCount,
  text: "Halaman " + currentPage.toString(),
  fontSize: 11,
  alignment: "center",
  lineHeight: 1,
  marginTop: 4,
});

exports.renderHeader =
  (companyInformation, ignorePages = []) =>
  (currentPage, pageCount, pageSize) => {
    // console.log({ currentPage, pageCount, ignorePages });
    if (ignorePages.includes(currentPage)) return [{ text: "" }];

    let nama = "NAMA SEKOLAH";
    let alamat = "Alamat";
    let telepon = "-";
    let website = "-";
    let email = "-";
    let logoUrl = null;

    if (companyInformation && companyInformation.name) {
      nama = companyInformation.name;
      alamat = companyInformation.address;
      telepon = companyInformation.phoneNumber
        ? companyInformation.phoneNumber
        : companyInformation.phone
        ? companyInformation.phone
        : "-";
      website = companyInformation.website ? companyInformation.website : "-";
      email = companyInformation.email ? companyInformation.email : "-";
      logoUrl = companyInformation.logoUrl ? companyInformation.logoUrl : null;
    }

    const alamatLines = alamat.split("\n");
    // console.log(
    //   { alamatLines },
    //   alamat.length,
    //   "Jl. Terusan Cibaduyut No 74A, Ds. Cankuang Kulon, Kec. Dayeuhkolot"
    //     .length
    // );
    if (alamatLines.length >= 2 || alamat.length > 70) {
      return [
        {
          text: nama,
          bold: true,
          fontSize: 13,
          alignment: "center",
          margin: [0, 10, 0, 0],
          lineHeight: 1,
        },
        {
          text: alamat,
          bold: true,
          fontSize: 12,
          alignment: "center",
          lineHeight: 1,
          marginLeft: 100,
          marginRight: 100,
        },
        {
          text: `Telepon: ${telepon}`,
          fontSize: 12,
          alignment: "center",
          lineHeight: 1,
        },
        // {
        //   text: `Website: ${website}. Email: ${email}`,
        //   fontSize: 11,
        //   alignment: "center",
        //   lineHeight: 1,
        // },
        renderLogoBase64(logoUrl),
        hrLine(pageSize.width),
      ];
    } else {
      return [
        {
          text: nama,
          bold: true,
          fontSize: 14,
          alignment: "center",
          margin: [0, 10, 0, 0],
          lineHeight: 1,
        },
        {
          text: alamat,
          bold: true,
          fontSize: 12,
          alignment: "center",
          lineHeight: 1,
          marginLeft: 100,
          marginRight: 100,
        },
        {
          text: `Telepon: ${telepon}`,
          fontSize: 12,
          alignment: "center",
          lineHeight: 1,
        },
        {
          text: `Website: ${website}. Email: ${email}`,
          fontSize: 11,
          alignment: "center",
          lineHeight: 1,
        },
        hrLine(pageSize.width),
        renderLogoBase64(logoUrl),
      ];
    }
  };

exports.renderHeaderForReceipt =
  (companyInformation, informasiYayasan, label) =>
  (currentPage, pageCount, pageSize) => {
    let nama = "NAMA SEKOLAH";
    let alamat = "Alamat";
    let telepon = "-";
    let website = "-";
    let email = "-";
    let logUrl = null;

    if (companyInformation && companyInformation.name) {
      nama = companyInformation.name;
      alamat = companyInformation.address;
      telepon = companyInformation.phoneNumber
        ? companyInformation.phoneNumber
        : "-";
      website = companyInformation.website ? companyInformation.website : "-";
      email = companyInformation.email ? companyInformation.email : "-";
      logoUrl = companyInformation.logoUrl ? companyInformation.logoUrl : null;
    } else if (informasiYayasan) {
      nama = informasiYayasan.name;
      alamat = informasiYayasan.address;
      telepon = informasiYayasan.phoneNumber
        ? informasiYayasan.phoneNumber
        : "-";
      website = informasiYayasan.website ? informasiYayasan.website : "-";
      email = informasiYayasan.email ? informasiYayasan.email : "-";
      logoUrl = informasiYayasan.logoUrl ? informasiYayasan.logoUrl : null;
    }

    return [
      {
        text: nama,
        bold: true,
        fontSize: 14,
        // alignment: "center",
        margin: [20, 10, 0, 0],
        lineHeight: 1,
      },
      {
        text: alamat,
        bold: true,
        fontSize: 12,
        //  alignment: "center",
        margin: [20, 0, 0, 0],
        lineHeight: 1,
        marginLeft: 100,
        marginRight: 100,
      },
      {
        text: `Telepon: ${telepon}`,
        fontSize: 12,
        //  alignment: "center"
        margin: [20, 0, 0, 0],
        lineHeight: 1,
      },
      {
        text: `Website: ${website}. Email: ${email}`,
        fontSize: 11,
        // alignment: "center"
        margin: [20, 0, 0, 0],
        lineHeight: 1,
      },
      hrLine(pageSize.width),
      renderLogoBase64(logoUrl),
      label
        ? {
            absolutePosition: { x: 450, y: 14 },
            table: {
              widths: [115],
              body: [[{ text: "" + label, alignment: "center" }]],
            },
          }
        : {},
    ];
  };

exports.defaultPageMargins = [20, 80, 20, 30];

exports.defaultTableLayout = {
  hLineWidth: function (i, node) {
    return 1;
    return i === 0 || i === node.table.body.length ? 2 : 1;
  },
  vLineWidth: function (i, node) {
    return 1;
    return i === 0 || i === node.table.widths.length ? 2 : 1;
  },
  hLineColor: function (i, node) {
    return i === 0 || i === node.table.body.length ? "black" : "gray";
  },
  vLineColor: function (i, node) {
    return i === 0 || i === node.table.widths.length ? "black" : "gray";
  },
  paddingLeft: function (i, node) {
    return 2;
  },
  paddingRight: function (i, node) {
    return 2;
  },
  paddingTop: function (i, node) {
    return 1;
  },
  paddingBottom: function (i, node) {
    return 1;
  },
  // fillColor: function (rowIndex, node, columnIndex) { return null; }
};

exports.noBorderTableLayout = {
  hLineWidth: () => 0,
  vLineWidth: () => 0,
  hLineColor: () => "white",
  vLineColor: () => "white",

  paddingLeft: () => 0,
  paddingRight: () => 0,
  paddingTop: () => 0,
  paddingBottom: () => 0,
};

exports.composeHeaderRow = (row, style) =>
  row.map((cell) => ({
    text: cell,
    ...style,
  }));
