const schedule = require('node-schedule');
const axios = require('axios')


module.exports = (app) => {
    console.log("running job scheduler..");
    var job = schedule.scheduleJob('*/1 * * * *', function () {
        console.log('The answer to life, the universe, and everything!');
        run();
        async function run() {
            // get data from databaseSyncconfig table
            console.log("step-1 :"+"get data from databaseSyncconfig table")
            let databaseconfigs = await app.models.databaseSyncConfig.find();
            console.log(databaseconfigs);
            
            // traverse every medical store to get medicine
            console.log("step-2 :"+"traverse every medical store to get medicine");
            for(let i=0;i<databaseconfigs.length;i++){
                let databaseConfig=databaseconfigs[i];
                console.log(databaseConfig);
                let medicalStore=databaseConfig;
                let medicalStoreEndpoint=medicalStore.endpoint;

                

                const axiosRequest = await axios.get(medicalStoreEndpoint)
                let medicalStoreData = axiosRequest.data;
                console.log(medicalStoreData);
                
                let medicineFieldMapList=[];

                let medicineNameFieldMap=medicalStore.medicineNameField;
                let splitedMedicineNameFieldMap=medicineNameFieldMap.split("|");
                let medicineFieldMap={medicalStoreField:splitedMedicineNameFieldMap[0] , medicineFinderField:splitedMedicineNameFieldMap[1]};
                medicineFieldMapList.push(medicineFieldMap);
                
                let medicinePriceFieldMap=medicalStore.medicinePriceField;
                let splitedMedicinePriceFieldMap=medicinePriceFieldMap.split("|");
                 medicineFieldMap={medicalStoreField:splitedMedicinePriceFieldMap[0] , medicineFinderField:splitedMedicinePriceFieldMap[1]};
                 medicineFieldMapList.push(medicineFieldMap);

                let medicinePotencyFieldMap=medicalStore.medicinePotencyField;
                let splitedMedicinePotencyFieldMap=medicinePotencyFieldMap.split("|");
                 medicineFieldMap={medicalStoreField:splitedMedicinePotencyFieldMap[0] , medicineFinderField:splitedMedicinePotencyFieldMap[1]};
                 medicineFieldMapList.push(medicineFieldMap);
                 
                let medicineStockFieldMap=medicalStore.medicineStockField;
                let splitedMedicineStockFieldMap=medicineStockFieldMap.split("|");
                 medicineFieldMap={medicalStoreField:splitedMedicineStockFieldMap[0] , medicineFinderField:splitedMedicineStockFieldMap[1]};
                 medicineFieldMapList.push(medicineFieldMap);

                 //console.log(medicineFieldMapList);

                //  medicinesTobeAdded=[];
                 medicalStoreData.forEach(element => {
                     let medicineTobeAdded=element;
                     for (var key in medicineTobeAdded) {
                        medicineFieldMapList.forEach(FieldMap => {
                            if(key==FieldMap.medicalStoreField){
                                //console.log('key found: '+key);
                                let medName=medicineTobeAdded[FieldMap.medicalStoreField];
                                //console.log(medName);
                                medicineTobeAdded[FieldMap.medicineFinderField]=medName;
                            }
                         });
                     }

                    //  let medcinetobeAddedObj={};
                 });
                 //console.log(medicalStoreData);
                 
                for (let i = 0; i < medicalStoreData.length; i++) {
                    let medicineTobeAdded=medicalStoreData[i];
                    //find medicine .
                    let medicine="";
                    medicine=await app.models.medicine.find({where:{name:medicineTobeAdded.name,accountprofileId:medicalStore.accountprofileId}})
                     //console.log(medicine);
                    if (medicine.length > 0) {
                    //     medicine = medicine[0];
                    // }
                    // if(medicine){
                        medicineUpdateObj={
                            id:medicine[0].id,
                            name:medicine[0].name || "",
                            price:medicine[0].price || "",
                            potency:medicine[0].potency || "",
                            quantity:medicineTobeAdded.quantity || "",
                            accountprofileId:medicalStore.accountprofileId
                        }

                        console.log("medicine is going to update"+medicine);
                        //update medicine;
                        //medicine.quantity=medicineTobeAdded.quantity;
                        let updatedMedicine=await app.models.medicine.upsertWithWhere({id:medicineUpdateObj.id},medicineUpdateObj);
                        console.log("updated medicine"+JSON.stringify(updatedMedicine));
                    }else{
                        console.log("medicine is going to create");
                        //create Medicines;
                        createdMedicineObj={
                            name:medicineTobeAdded.name || "",
                            price:medicineTobeAdded.price || "",
                            potency:medicineTobeAdded.potency || "",
                            quantity:medicineTobeAdded.quantity || "",
                            accountprofileId:medicalStore.accountprofileId
                        }
                        let createdMedicine=await app.models.medicine.create(createdMedicineObj);
                        console.log("createdMedicine: "+JSON.stringify(createdMedicine));
                    }
                }

                 


                console.log('final end');

            }
            // update and add medicines in our medicine table 
            // check if one job already in progress so return 2nd job


        }
    });
}