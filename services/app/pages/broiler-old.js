import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../app.json";
import { withApollo } from "../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../components/App";
import { handleError } from "../libs/errors";
import redirect from "../libs/redirect";
import gql from "graphql-tag";
import {
  useMutation,
  useQuery,
  useApolloClient,
  ApolloProvider,
} from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminArea, { useCurrentUser } from "../components/AdminArea";
import Table from "../components/Table";
import { FormModal } from "../components/Modal";
import dayjs from "dayjs";
import NumberFormat from "react-number-format";
import Select from "react-select";
import { MonthAndYearsFilterWithExport } from "../components/MonthAndYearsFilterWithExport";
import lodash from "lodash";
// import downloadExcelFromBuffer from "../../libs/downloadExcelFromBuffer";

const QUERY = gql`
  query listQueries($farmerUUID: String, $monthYear: String) {
    allBroilers(monthYear: $monthYear) {
      id
      uuid

      farmerCompanyName
      farmerUUID

      farmAreaId
      farmProfileArea

      poultryHouseId
      poultryHouseNo

      cycleNo
      dateEntry
      noDocEntry
      docSource
      chickenBreed
      feedSource

      Mortality {
        listMortalities {
          day
          total
        }
      }

      total
      productionDate

      createdAt
      updatedAt
    }

    allFarmerProfiles {
      uuid
      farmerCompanyName
    }
    allFarmProfilesByFarmer(farmerUUID: $farmerUUID) {
      uuid
      farmerName
      farmArea
      farmDistrict
    }
  }
`;

const POULTRY_HOUSE_QUERY = gql`
  query poultryHouseByFarmerAndLocation(
    $farmerUUID: String!
    $farmAreaId: String!
  ) {
    poultryHouseByFarmerAndLocation(
      farmerUUID: $farmerUUID
      farmAreaId: $farmAreaId
    ) {
      id
      uuid
      houseNo
    }
  }
`;

const CREATE_BROILER = gql`
  mutation createBroiler(
    $farmerCompanyName: String!
    $farmerUUID: String!
    $farmAreaId: String!
    $farmProfileArea: String!
    $poultryHouseId: String!
    $poultryHouseNo: String!
    $cycleNo: Int!
    $dateEntry: String!
    $noDocEntry: String
    $docSource: String
    $chickenBreed: String
    $feedSource: String
    $mortalityObject: MortalityObjInput
    $productionDate: String
    $total: Int!
    $production: Int
  ) {
    createBroiler(
      farmerCompanyName: $farmerCompanyName
      farmerUUID: $farmerUUID

      farmAreaId: $farmAreaId
      farmProfileArea: $farmProfileArea

      poultryHouseId: $poultryHouseId
      poultryHouseNo: $poultryHouseNo

      cycleNo: $cycleNo
      dateEntry: $dateEntry
      noDocEntry: $noDocEntry
      docSource: $docSource
      chickenBreed: $chickenBreed
      feedSource: $feedSource

      mortalityObject: $mortalityObject
      productionDate: $productionDate

      total: $total
      production: $production
    )
  }
`;

const UPDATE_BROILER = gql`
  mutation updateBroiler(
    $uuid: String!
    $farmerCompanyName: String
    $farmerUUID: String
    $farmAreaId: String
    $farmProfileArea: String
    $poultryHouseId: String
    $poultryHouseNo: String
    $cycleNo: Int
    $dateEntry: String
    $noDocEntry: String
    $docSource: String
    $chickenBreed: String
    $feedSource: String
    $mortalityObject: MortalityObjInput
    $productionDate: String
    $total: Int
    $production: Int
  ) {
    updateBroiler(
      uuid: $uuid
      farmerCompanyName: $farmerCompanyName
      farmerUUID: $farmerUUID

      farmAreaId: $farmAreaId
      farmProfileArea: $farmProfileArea

      poultryHouseId: $poultryHouseId
      poultryHouseNo: $poultryHouseNo

      cycleNo: $cycleNo
      dateEntry: $dateEntry
      noDocEntry: $noDocEntry
      docSource: $docSource
      chickenBreed: $chickenBreed
      feedSource: $feedSource

      mortalityObject: $mortalityObject
      productionDate: $productionDate

      total: $total
      production: $production
    )
  }
`;

const DELETE_BROILER = gql`
  mutation deleteBroiler($uuid: String!) {
    deleteBroiler(uuid: $uuid)
  }
`;

const EXPORT_TO_EXCEL = gql`
  mutation exportBroilerExcel(
    $monthYear: String!
    $farmerUUID: String
    $farmAreaId: String
  ) {
    exportBroilerExcel(
      monthYear: $monthYear
      farmerUUID: $farmerUUID
      farmAreaId: $farmAreaId
    )
  }
`;

const Broiler = () => {
  const router = useRouter();
  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM")
  );
  const notification = useNotification();
  const client = useApolloClient();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const [formData, setFormData] = useState({
    mortalityObject: generateMortalityAgeTable(),
  });

  const { data, error, loading, refetch } = useQuery(QUERY, {
    variables: {
      farmerUUID: formData.farmerUUID || "",
      monthYear: yearMonth,
    },
  });

  const [createBroiler] = useMutation(CREATE_BROILER);
  const [updateBroiler] = useMutation(UPDATE_BROILER);
  const [deleteBroiler] = useMutation(DELETE_BROILER);
  const [exportBroilerExcel] = useMutation(EXPORT_TO_EXCEL);

  const [allPoultryHouses, setAllPoultryHouse] = useState([]);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportFormData, setExportFormData] = useState({});

  const [selectedCompany, setSelectedCompany] = useState([
    {
      value: "",
      label: "",
    },
  ]);
  const [selectedFarmArea, setSelectedFarmArea] = useState([
    {
      value: "",
      label: "",
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);

  const allFarmerProfiles = data?.allFarmerProfiles || [];
  const allFarmProfilesByFarmer = data?.allFarmProfilesByFarmer || [];
  const allBroilers = data?.allBroilers || [];

  let allFarmProfilesByFarmerForExport = data?.allFarmProfilesByFarmer || [];

  allFarmProfilesByFarmerForExport = lodash.uniqBy(
    allFarmProfilesByFarmerForExport,
    (farm) => farm.farmArea
  );

  useEffect(async () => {
    try {
      const result = await client.query({
        query: POULTRY_HOUSE_QUERY,
        variables: {
          farmerUUID: formData.farmerUUID || "",
          farmAreaId: formData.farmAreaId || "",
        },
        fetchPolicy: "no-cache",
      });

      if (result.data.poultryHouseByFarmerAndLocation) {
        setAllPoultryHouse(result.data.poultryHouseByFarmerAndLocation);
      }
    } catch (err) {
      notification.handleError(err);
    }
  }, [formData.farmerUUID, formData.farmAreaId]);

  useEffect(() => {
    let arrayTotal = formData.mortalityObject.map((m) => parseInt(m.total));
    const grandTotal = arrayTotal.reduce((acc, curr) => acc + curr, 0);

    let doc = 0;
    if (formData.noDocEntry) {
      doc = parseInt(formData.noDocEntry);
    }
    const production = doc - grandTotal;
    setFormData({
      ...formData,
      total: grandTotal,
      production,
    });
  }, [formData.mortalityObject, formData.noDocEntry]);

  const customUtilities = useMemo(() => [
    {
      label: "Edit",
      icon: <i className="fa fa-pencil" />,
      width: 400,
      render: (propsTable) => {
        return (
          <div className="flex">
            <button
              onClick={(e) => {
                if (e) e.preventDefault();

                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                  mortalityObject:
                    propsTable.row.original.Mortality.listMortalities,
                });

                setSelectedCompany([
                  {
                    label: propsTable.row.original.farmerCompanyName || "",
                    value: propsTable.row.original.farmerUUID || "",
                  },
                ]);
              }}
              className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg"
            >
              <p className="text-white text-md font-bold">
                <i className="fa fa-pencil-alt " /> Edit
              </p>
            </button>
          </div>
        );
      },
    },
  ]);

  const columns = useMemo(() => [
    {
      Header: "Date Entry",
      accessor: "dateEntry",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Company Name",
      accessor: "farmerCompanyName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Farm Area",
      accessor: "farmProfileArea",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "House No.",
      accessor: "poultryHouseNo",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Cycle No.",
      accessor: "cycleNo",
      style: {
        fontSize: 20,
      },
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data | Broiler</title>
      </Head>

      <FormModal
        title={`Export Production`}
        visible={exportModalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setExportModalVisible(false);
          setExportFormData({});
          setSelectedCompany([]);
          setSelectedFarmArea([]);
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          setExportModalVisible(true);
          showLoadingSpinner();
          try {
            const response = await exportBroilerExcel({
              variables: {
                monthYear: yearMonth,
                ...exportFormData,
              },
            });

            // downloadExcelFromBuffer(response.data.exportBroilerExcel.data, "broiler")

            // window.location.href = response.data.exportBroilerExcel;
            // window.open(response.data.exportBroilerExcel, "__blank");
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}
      >
        <div>
          <MonthAndYearsFilterWithExport
            label="Month Year Filter"
            defaultValue={dayjs().format("YYYY-MM")}
            isDisabled={true}
          />

          <div className="form-group">
            <label>Company Name</label>
            <Select
              isClearable={true}
              value={selectedCompany}
              options={allFarmerProfiles.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.farmerCompanyName,
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                // console.log({ selectedValues });

                const found = allFarmerProfiles.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  farmerUUID: found?.uuid || "",
                });

                setSelectedCompany([
                  {
                    value: found?.uuid || "",

                    label: found?.farmerCompanyName || "",
                  },
                ]);
              }}
            />
          </div>

          <div className="form-group">
            <label>Farm Area</label>
            <Select
              isClearable={true}
              value={selectedFarmArea}
              options={allFarmProfilesByFarmerForExport.map((prof) => {
                return {
                  value: prof.uuid,
                  label: prof.farmArea,
                };
              })}
              className={`form-control`}
              classNamePrefix="select"
              onChange={(selectedValues) => {
                const found = allFarmProfilesByFarmerForExport.find((profile) =>
                  selectedValues ? profile.uuid === selectedValues.value : null
                );
                setExportFormData({
                  ...exportFormData,
                  farmAreaId: found?.uuid || "",
                });

                setSelectedFarmArea([
                  {
                    value: found?.uuid || "",
                    label: found?.farmArea || "",
                  },
                ]);
              }}
            />
          </div>

          <br />
          <br />
        </div>
      </FormModal>

      <FormModal
        title={`${!formData.uuid ? "New" : "Edit"} Broiler`}
        visible={modalVisible}
        onClose={(e) => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            mortalityObject: generateMortalityAgeTable(),
          });
          setSelectedCompany({});
        }}
        onCustomCloseBackDrop={true}
        onSubmit={async (e) => {
          if (e) e.preventDefault();
          try {
            let { __typename, mortalityObject, Mortality, uuid, ...data } =
              formData;

            let tmp = [];
            for (let m of mortalityObject) {
              tmp.push({
                day: m.day,
                total: parseInt(m.total),
              });
            }

            if (!uuid) {
              await createBroiler({
                variables: {
                  ...data,
                  mortalityObject: {
                    listMortalities: tmp,
                  },
                },
              });
            } else {
              await updateBroiler({
                variables: {
                  uuid,
                  ...data,
                  mortalityObject: {
                    listMortalities: tmp,
                  },
                },
              });
            }

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Broiler saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}
        size="md"
      >
        <div className="form-group">
          <label>Company Name</label>
          <Select
            value={selectedCompany}
            options={allFarmerProfiles.map((prof) => {
              return {
                value: prof.uuid,
                label: prof.farmerCompanyName,
              };
            })}
            className={`form-control`}
            classNamePrefix="select"
            onChange={(selectedValues) => {
              // console.log({ selectedValues });

              const found = allFarmerProfiles.find(
                (profile) => profile.uuid === selectedValues.value
              );
              setFormData({
                ...formData,
                farmerUUID: found.uuid,
                farmerCompanyName: found.farmerCompanyName,

                farmAreaId: "",
                farmProfileArea: "",
                poultryHouseId: "",
                poultryHouseNo: "",
              });

              setSelectedCompany([
                {
                  value: found.uuid,
                  label: found.farmerCompanyName,
                },
              ]);
            }}
          />
          {/* <select
            className="form-control"
            value={formData.farmerUUID || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allFarmerProfiles.find(
                (c) => c.uuid === e.target.value
              );
              setFormData({
                ...formData,
                farmerUUID: found.uuid,
                farmerCompanyName: found.farmerCompanyName,
              });
            }}
            required
          >
            <option value={""} disabled>
              Select Company Name
            </option>

            {allFarmerProfiles.map((farm) => (
              <option value={farm.uuid}>{farm.farmerCompanyName}</option>
            ))}
          </select> */}
        </div>
        <div className="form-group">
          <label>Farm Area</label>
          <select
            className="form-control"
            value={formData.farmAreaId || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allFarmProfilesByFarmer.find(
                (c) => c.uuid === e.target.value
              );
              setFormData({
                ...formData,
                farmAreaId: found.uuid,
                farmProfileArea: found.farmArea,
              });
            }}
            required
          >
            <option value={""} disabled>
              Select Farm
            </option>

            {allFarmProfilesByFarmer.map((farm) => (
              <option value={farm.uuid}>{farm.farmArea}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>House No</label>
          <select
            className="form-control"
            value={formData.poultryHouseId || ""}
            onChange={(e) => {
              if (e) e.preventDefault();

              const found = allPoultryHouses.find(
                (c) => c.uuid === e.target.value
              );
              setFormData({
                ...formData,
                poultryHouseId: found.uuid,
                poultryHouseNo: found.houseNo,
              });
            }}
            required
          >
            <option value={""} disabled>
              Select House
            </option>

            {allPoultryHouses.map((house) => (
              <option value={house.uuid}>{house.houseNo}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Cycle No</label>
          <input
            className="form-control"
            value={formData.cycleNo || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                cycleNo: parseInt(e.target.value),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Date of Entry</label>
          <input
            className="form-control"
            type="date"
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                dateEntry: e.target.value,
              });
            }}
            value={formData.dateEntry || ""}
          />
        </div>
        <div className="form-group">
          <label>No. Of DOC Entry</label>
          <input
            className="form-control"
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                noDocEntry: e.target.value,
              });
            }}
            value={formData.noDocEntry || ""}
          />
        </div>
        <div className="form-group">
          <label>DOC Source</label>
          <select
            className="form-control"
            value={formData.docSource || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                docSource: e.target.value,
              });
            }}
          >
            <option value={""} disabled>
              Select DOC Source
            </option>
            <option value={"Golden Chick Hatchery And Breeding Farm Sdn Bhd"}>
              1. Golden Chick Hatchery And Breeding Farm Sdn Bhd
            </option>
            <option value={"Ideal Hatchery (B) Sdn Bhd"}>
              2. Ideal Hatchery (B) Sdn Bhd
            </option>
            <option value={"Import"}>3. Import</option>
          </select>
        </div>
        <div className="form-group">
          <label>Chicken Breed</label>
          <select
            className="form-control"
            value={formData.chickenBreed || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                chickenBreed: e.target.value,
              });
            }}
          >
            <option value={""} disabled>
              Select Chiken Breed
            </option>
            <option value={"Cobb 500"}>1. Cobb 500</option>
            <option value={"Ross"}>2. Ross</option>
            <option value={"Abor Acres"}>3. Abor Acres</option>
          </select>
        </div>
        <div className="form-group">
          <label>Feed Source</label>
          <select
            className="form-control"
            value={formData.feedSource || ""}
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                feedSource: e.target.value,
              });
            }}
          >
            <option value={""} disabled>
              Select Feed Source
            </option>
            <option value={"Gold Coin Feedmill (B) Sdn Bhd"}>
              1. Gold Coin Feedmill (B) Sdn Bhd
            </option>
            <option value={"Ideal Feed Mills Sdn Bhd"}>
              2. Ideal Feed Mills Sdn Bhd
            </option>
            <option value={"Import"}>3. Import</option>
          </select>
        </div>
        <div className="form-group hidden">
          <label>Production Date</label>
          <input
            className="form-control"
            type="date"
            onChange={(e) => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                productionDate: e.target.value,
              });
            }}
            value={formData.productionDate || ""}
          />
        </div>

        <p className="text-md my-2">Mortality by Age (Day)</p>
        <div className="grid grid-cols-6">
          {formData.mortalityObject.map((mortality) => (
            <div>
              <div className="bg-mantis-500 text-center py-2 text-white font-bold">
                {mortality.day}
              </div>
              <div className="bg-white w-auto">
                <NumberFormat
                  className="form-control"
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  value={mortality.total || 0}
                  onValueChange={(e) => {
                    setFormData({
                      ...formData,
                      mortalityObject: formData.mortalityObject.map((det) =>
                        det.day !== mortality.day
                          ? det
                          : {
                              ...mortality,
                              total: e.floatValue || 0,
                            }
                      ),
                    });
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div />

          <div />

          <div>
            <div className="form-group">
              <label>Mortality Total</label>
              <NumberFormat
                className="form-control"
                thousandSeparator={","}
                decimalSeparator={"."}
                value={formData.total || 0}
                disabled
              />
            </div>
          </div>
        </div>
        <div className="form-group">
          <label>Broiler Production</label>
          <NumberFormat
            className="form-control"
            thousandSeparator={","}
            decimalSeparator={"."}
            value={formData.production || 0}
            disabled
          />
        </div>
      </FormModal>

      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
        <Table
          customHeaderUtilities={
            <div className="flex">
              <MonthAndYearsFilterWithExport
                label="Month Year Filter"
                defaultValue={dayjs().format("YYYY-MM")}
                // options={YEARS}
                onSelect={(yearMonth) => {
                  setYearMonth(yearMonth);
                }}
                // exportConfig={{
                //   title: "Entrepreneur - Production And Sales",
                //   collectionName: "EntrepreneurProductionAndSaleses",
                //   filters: {
                //     yearMonth,
                //   },
                //   columns,
                // }}
              />

              <div className="flex mx-2 items-end">
                <button
                  className="bg-mantis-500 px-4 py-2 text-white rounded-md shadow-md"
                  onClick={async (e) => {
                    if (e) e.preventDefault();
                    setExportModalVisible(true);
                    // showLoadingSpinner();
                    // try {
                    //   const response = await exportVegetableProduction({
                    //     variables: {
                    //       monthYear: yearMonth,
                    //     },
                    //   });

                    //   window.open(
                    //     response.data.exportVegetableProduction,
                    //     "__blank"
                    //   );
                    // } catch (err) {
                    //   notification.handleError(err);
                    // }
                    // hideLoadingSpinner();
                  }}
                >
                  Export Excel
                </button>
              </div>
            </div>
          }
          loading={loading}
          columns={columns}
          data={allBroilers}
          withoutHeader={true}
          onAdd={
            !currentUserDontHavePrivilege(["Broiler:Create"])
              ? (e) => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({
                    mortalityObject: generateMortalityAgeTable(),
                  });
                  setSelectedCompany({});
                }
              : null
          }
          onRemove={
            !currentUserDontHavePrivilege(["Broiler:Delete"])
              ? async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} broilers?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteBroiler({
                          variables: {
                            uuid: row.uuid,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} broilers deleted`,
                        level: "success",
                      });
                      await refetch();
                    }
                  } catch (err) {
                    handleError(err);
                  }
                  hideLoadingSpinner();
                }
              : null
          }
          customUtilities={
            !currentUserDontHavePrivilege(["Broiler:Update"])
              ? customUtilities
              : null
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Broiler);

const generateMortalityAgeTable = () => {
  let results = [];
  for (let i = 1; i <= 60; i++) {
    results.push({
      day: i,
      total: 0,
    });
  }
  return results;
};
