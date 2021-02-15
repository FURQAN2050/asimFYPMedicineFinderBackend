const schedule = require('node-schedule');
const axios = require('axios');
const base64Encode=require('../boot/utilities/base64_lib')


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
          let username=medicalStore.userName;
          let password=medicalStore.password;
          let authType=medicalStore.authentication;
          let medicalStoreData = [];
          try {
            try {
              let serverResponse="";
              if(!authType){
                serverResponse = await axios.get(medicalStoreEndpoint)
              }
              else if(authType=="basicAuth"){
                let headers=BasicAuth(medicalStoreEndpoint,username,password);
                serverResponse=await axios.get(medicalStoreEndpoint, {headers: headers});
              }
              medicalStoreData = serverResponse.data;
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
    async function BasicAuth(finalUrl, username, password) {
      console.log(finalUrl);
      serverResponse = { status: false }
      var res = null;
      let AuthHeader = "";
      if (username && password) {
        AuthHeader = base64_encode(username + ':' + password);
      }

      let headers = {
        "Authorization": "Basic " + AuthHeader,
        "Content-Type":"application/json"
      };
      return headers;
      console.log(headers);
      try{
        res = await axios.get(finalUrl, {
          headers: headers});
        console.log(res.data);
        return res;
      }
      catch(e){
        console.log(e);
      }
      return serverResponse;
    }
    function base64_encode(data) {
      // From: http://phpjs.org/functions
      // +   original by: Tyler Akins (http://rumkin.com)
      // +   improved by: Bayron Guevara
      // +   improved by: Thunder.m
      // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +   bugfixed by: Pellentesque Malesuada
      // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +   improved by: Rafał Kukawski (http://kukawski.pl)
      // *     example 1: base64_encode('Kevin van Zonneveld');
      // *     returns 1: 'S2V2aW4gdmFuIFpvbm5ldmVsZA=='
      // mozilla has this native
      // - but breaks in 2.0.0.12!
      //if (typeof this.window['btoa'] === 'function') {
      //    return btoa(data);
      //}
      var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
              ac = 0,
              enc = '',
              tmp_arr = [];

      if (!data) {
          return data;
      }

      do { // pack three octets into four hexets
          o1 = data.charCodeAt(i++);
          o2 = data.charCodeAt(i++);
          o3 = data.charCodeAt(i++);

          bits = o1 << 16 | o2 << 8 | o3;

          h1 = bits >> 18 & 0x3f;
          h2 = bits >> 12 & 0x3f;
          h3 = bits >> 6 & 0x3f;
          h4 = bits & 0x3f;

          // use hexets to index into b64, and append result to encoded string
          tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
      } while (i < data.length);

      enc = tmp_arr.join('');

      var r = data.length % 3;

      return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);

  }
  });

}
