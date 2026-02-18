import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../App";
import { handleError } from "../../libs/errors";
import redirect from "../../libs/redirect";
import gql from "graphql-tag";
import {
  useMutation,
  useQuery,
  useApolloClient,
  ApolloProvider,
} from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminArea from "../AdminArea";
import Table from "../Table";
import { FormModal } from "../Modal";
import Dropzone from "react-dropzone";
import Select from "react-select";
import dayjs from "dayjs";

const MONTHSLIST = [
  { monthName: "January", month: 1 },
  { monthName: "February", month: 2 },
  { monthName: "March", month: 3 },
  { monthName: "April", month: 4 },
  { monthName: "May", month: 5 },
  { monthName: "June", month: 6 },
  { monthName: "July", month: 7 },
  { monthName: "August", month: 8 },
  { monthName: "September", month: 9 },
  { monthName: "October", month: 10 },
  { monthName: "November", month: 11 },
  { monthName: "December", month: 12 },
];

const IMPORT_VEGETABLE_RETAIL_PRICE = gql`
  mutation importVegetableRetailPrice(
    $excelBase64: String!
    $year: Int!
    $month: Int!
    $fileName: String!
  ) {
    importVegetableRetailPrice(
      excelBase64: $excelBase64
      year: $year
      month: $month
      fileName: $fileName
    )
  }
`;

const GENERATE_VEGETABLE_RETAIL_TEMPLATE = gql`
  mutation generateVegetableRetailPriceTemplate {
    generateVegetableRetailPriceTemplate
  }
`;
const VegetableExcelImport = ({}) => {
  const notification = useNotification();
  const [importVegetableRetailPrice] = useMutation(
    IMPORT_VEGETABLE_RETAIL_PRICE
  );
  const [generateVegetableRetailPriceTemplate] = useMutation(
    GENERATE_VEGETABLE_RETAIL_TEMPLATE
  );
  const MONTHS = MONTHSLIST.map((m) => {
    return {
      value: m.month,
      label: m.monthName,
    };
  });

  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1940;
    // console.log([...new Array(toYear - fromYear)])

    let result = [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });

    result = result.map((res) => {
      return {
        value: res,
        label: res,
      };
    });
    return result;
  }, []);

  const [year, setYear] = useState(YEARS[0]);
  const [years, setYears] = useState([year]);

  const [selectedYears, setSelectedYears] = useState("");
  const [selectedMonths, setSelectMonths] = useState([]);

  const handleDrop = (acceptedFiles) => {
    var reader = new FileReader();
    reader.readAsDataURL(acceptedFiles[0]);

    reader.onload = async () => {
      showLoadingSpinner();
      try {
        if (selectedMonths.length === 0 || !selectedYears) {
          throw {
            message: "Filter Invalid",
          };
        }
        let fileName = acceptedFiles[0].path;

        await importVegetableRetailPrice({
          variables: {
            excelBase64: reader.result,
            year: parseInt(selectedYears),
            month: selectedMonths[0].value,
            fileName,
          },
        });

        notification.addNotification({
          title: "Success!",
          message: `Import success`,
          level: "success",
        });
      } catch (err) {
        notification.handleError(err);
      }
      hideLoadingSpinner();
    };
    reader.onerror = (error) => {
      notification.handleError(error);
    };
  };

  return (
    <div className="h-120 my-10 px-7 py-10 border border-gray shadow-xl">
      <div className="border-2 border-gray-300 h-full px-10 py-2">
        <div className="grid grid-cols-2 h-1/5 my-10 mx-20">
          <div className="form-group px-20 py-5 justify-self-end">
            <label>Month</label>
            <Select
              options={MONTHS}
              className="basic-multi-select w-60"
              classNamePrefix="select"
              onChange={(data) => {
                setSelectMonths([data]);
              }}
            />
          </div>
          <div className="form-group px-20 py-5 justify-self-start">
            <label>Year</label>
            <Select
              options={YEARS}
              className="basic-multi-select w-60"
              classNamePrefix="select"
              onChange={(data) => {
                setSelectedYears(data.value);
              }}
            />
          </div>
        </div>
        <div className="border-4 border-mantis-500 h-2/4">
          <Dropzone
            onDrop={(acceptedFiles) => handleDrop(acceptedFiles)}
            accept="application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            style={{
              position: "relative",
              border: "2px solid black",
              padding: "40px 20px",
            }}
            multiple={false}
          >
            {({ getRootProps, getInputProps }) => (
              <section
                className="card rounded-md px-6"
                style={{
                  // border: "8px solid #1AB08D",
                  paddingTop: "2.5rem",
                  paddingBottom: "2.5rem",
                }}
                {...getRootProps()}
              >
                <input {...getInputProps()} />
                <div className="w-full flex flex-wrap justify-center mb-2">
                  <p className="text-4xl text-mantis-700">
                    <i className="fa fa-file-excel" />
                  </p>
                </div>
                <div className="w-full flex flex-wrap justify-center mb-2">
                  <p className="text-lg font-semibold">
                    Drop file here or click to import
                  </p>
                </div>
              </section>
            )}
          </Dropzone>
        </div>
        <div className=" flex justify-center my-10">
          <button
            className="bg-mantis-500 rounded-md px-4 py-2 shadow-md"
            onClick={async () => {
              showLoadingSpinner();
              try {
                const result = await generateVegetableRetailPriceTemplate({
                  variables: {},
                });
                // Convert base64 to blob
                const base64Response = result.data.generateVegetableRetailPriceTemplate;
                const byteCharacters = atob(base64Response);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});

                // Create download URL and trigger download
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'vegetable_retail_price_template.xlsx';
                link.click();
                window.URL.revokeObjectURL(url);

                // window.open(
                //   result.data.generateVegetableRetailPriceTemplate,
                //   "__blank"
                // );
              } catch (err) {
                notification.handleError(err);
              }

              hideLoadingSpinner();
            }}
          >
            <p className="text-lg text-white font-bold">
              <i className="fa fa-file-excel" /> Download Template
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(VegetableExcelImport);
