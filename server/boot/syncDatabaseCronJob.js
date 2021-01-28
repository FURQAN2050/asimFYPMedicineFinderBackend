const schedule = require('node-schedule');
const axios = require('axios');


module.exports = (app) => {
  var job = schedule.scheduleJob('*/1 * * * *', function () {
    run();
    async function run() {
      try {
        // get data from databaseSyncConfig table
        console.log("step-1 :" + "Get data from database Sync config table")
        let databaseconfigs = await app.models.databaseSyncConfig.find();
        console.log(databaseconfigs);

        // traverse every medical store to get medicine
        console.log("step-2 :" + "Traverse every medical store to get medicine");
        for (let i = 0; i < databaseconfigs.length; i++) {
          let databaseConfig = databaseconfigs[i];
          console.log(databaseConfig);
          let medicalStore = databaseConfig;
          let medicalStoreEndpoint = medicalStore.endpoint;
          let medicalStoreData = [];
          try {
            try {
              const axiosRequest = await axios.get(medicalStoreEndpoint)
              medicalStoreData = axiosRequest.data;
              console.log(medicalStoreData);
            } catch (e) {
              throw "Failed to get the data from endpoint";
            }
            if (medicalStoreData.length == 0) {
              throw "No Medical Store data Found";
            }


            console.log("step-3 : making field map");
            let medicineFieldMapList = [];

            let medicineNameFieldMap = medicalStore.medicineNameField;
            let splitedMedicineNameFieldMap = medicineNameFieldMap.split("|");
            let medicineFieldMap = { medicalStoreField: splitedMedicineNameFieldMap[0], medicineFinderField: splitedMedicineNameFieldMap[1] };
            medicineFieldMapList.push(medicineFieldMap);

            let medicinePriceFieldMap = medicalStore.medicinePriceField;
            let splitedMedicinePriceFieldMap = medicinePriceFieldMap.split("|");
            medicineFieldMap = { medicalStoreField: splitedMedicinePriceFieldMap[0], medicineFinderField: splitedMedicinePriceFieldMap[1] };
            medicineFieldMapList.push(medicineFieldMap);

            let medicinePotencyFieldMap = medicalStore.medicinePotencyField;
            let splitedMedicinePotencyFieldMap = medicinePotencyFieldMap.split("|");
            medicineFieldMap = { medicalStoreField: splitedMedicinePotencyFieldMap[0], medicineFinderField: splitedMedicinePotencyFieldMap[1] };
            medicineFieldMapList.push(medicineFieldMap);

            let medicineStockFieldMap = medicalStore.medicineStockField;
            let splitedMedicineStockFieldMap = medicineStockFieldMap.split("|");
            medicineFieldMap = { medicalStoreField: splitedMedicineStockFieldMap[0], medicineFinderField: splitedMedicineStockFieldMap[1] };
            medicineFieldMapList.push(medicineFieldMap);

            console.log("step-4 : implement field map");

            medicalStoreData.forEach(element => {
              let medicineTobeAdded = element;
              for (var key in medicineTobeAdded) {
                medicineFieldMapList.forEach(FieldMap => {
                  if (key == FieldMap.medicalStoreField) {
                    let medName = medicineTobeAdded[FieldMap.medicalStoreField];
                    medicineTobeAdded[FieldMap.medicineFinderField] = medName;
                  }
                });
              }
            });

            console.log("step-3 : adding or updating medicine Logic");
            for (let i = 0; i < medicalStoreData.length; i++) {
              let medicineTobeAdded = medicalStoreData[i];
              //find medicine.
              let medicine = "";
              medicine = await app.models.medicine.find({ where: { name: medicineTobeAdded.name, accountprofileId: medicalStore.accountprofileId } })
              if (medicine.length > 0) {
                //delete the medicine if the medicine quantity is 0;
                if(parseInt(medicineTobeAdded.quantity)==0){
                  console.log("medicine is going To delte");
                  let deletedMedicine=await app.models.medicine.deleteById(medicine[0].id);
                  console.log("medicine is deleted succesfully"+deletedMedicine);
                  continue;
                }
                medicineUpdateObj = {
                  id: medicine[0].id,
                  name: medicine[0].name || "",
                  price: medicine[0].price || "",
                  potency: medicine[0].potency || "",
                  quantity: medicineTobeAdded.quantity || "",
                  accountprofileId: medicalStore.accountprofileId
                }
                let updatedMedicine = await app.models.medicine.upsertWithWhere({ id: medicineUpdateObj.id }, medicineUpdateObj);
              } else {
                if(parseInt(medicineTobeAdded.quantity)==0){
                    continue;
                  }
                //create Medicines;
                createdMedicineObj = {
                  name: medicineTobeAdded.name || "",
                  price: medicineTobeAdded.price || "",
                  potency: medicineTobeAdded.potency || "",
                  quantity: medicineTobeAdded.quantity || "",
                  accountprofileId: medicalStore.accountprofileId
                }
                let createdMedicine = await app.models.medicine.create(createdMedicineObj);
              }
            }
            console.log('Final end');
          } catch (e) {
            
            console.log(`error occoured while fetching the the data from Medical Store ${databaseConfig.accountprofileId}
                and the endpoint is ${databaseConfig.endpoint}.
                Going to iterate next store.
                `);
                console.log(e)
            continue;
          }
        }
      } catch (e) {
        console.log("Cron Job intreputed due to " + JSON.stringify(e));
      }
    }
  });
}
