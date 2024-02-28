const xsenv = require('@sap/xsenv');
const hana = require('@sap/hana-client');

const { v4: uuidv4 } = require('uuid');


const services = xsenv.getServices({
   hana: { name: 'hana' }
 });


services.hana.host = process.env.HANA_HOST;
services.hana.port = process.env.HANA_PORT;
services.hana.schema = process.env.HANA_SCHEMA;

const hanaConn = hana.createConnection();

async function queryDB(sql) {
  try {
    await hanaConn.connect(services.hana);
  } catch (err) {
    console.error('queryDB connect', err.message, err.stack);
    results = err.message;
  }
  try {
    console.log(`schema: ${services.hana.schema}`)
    await hanaConn.exec('SET SCHEMA ' + services.hana.schema);
    
    results = await hanaConn.exec(sql);
    
  } catch (err) {
    console.error('queryDB exec', err.message, err.stack);
    results = err.message;
  }
  try {
    await hanaConn.disconnect();
  } catch (err) {
    console.error('queryDB disconnect', err.message, err.stack);
    results = err.message;
  }
  return results;
}

module.exports = {
    main: async function (event, context) {
        if (event.extensions.request.method === 'GET') {
            const books = await queryDB(`SELECT * FROM BOOKS`);
            return books
        } else if(event.extensions.request.method === 'POST'){
            if(event.extensions.request.body.title && event.extensions.request.body.author){
                let query = `insert into BOOKS values ('${uuidv4()}', '${event.extensions.request.body.title}', '${event.extensions.request.body.author}')`
                try {
                    let result =  await queryDB(query)
                    return `${result} book added`
                } catch (err) {
                    return err.message;
                }
            }

            res = event.extensions.response;
            
            res.statusMessage="'author' & 'title' required in the payload"
            res.status(400)
            return
            
        }
    }
}