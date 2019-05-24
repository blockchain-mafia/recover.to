import Airtable from 'airtable'

const { AIRTABLE_API_KEY, AIRTABLE_BASE } = process.env
// (TODO: add a file with this config (needed to be `mv`) and add .gitignore)
// or in dev env
// const AIRTABLE_API_KEY = ''
// const AIRTABLE_BASE = ''

// TODO: use a bot instead of a netlify function to avoid a DDOS attack
export function handler(event, context, callback) {
  // Only allow POST
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method Not Allowed" }

  const base = new Airtable({ apiKey: AIRTABLE_API_KEY })
    .base(AIRTABLE_BASE)

  const params = JSON.parse(event.body)
  const addressOwner = params.addressOwner || "0x00"
  const addressFinder = params.addressFinder || "0x00"
  const itemID = params.itemID || ""
  const emailOwner = params.emailOwner || ""
  const phoneNumberOwner = params.phoneNumberOwner || ""

  try {
    base('Owners').select({
      view: 'Grid view',
      filterByFormula: `{Address} = '${addressOwner}'`
    }).firstPage((err, records) => {
      records.forEach(record => {
        base('Claims').create({
          "Address Finder": addressFinder,
          "Item ID": itemID,
          "Phone Number Owner": phoneNumberOwner,
          "Email Owner": emailOwner
        })
        callback(null, {
          statusCode: 200,
          body: JSON.stringify({ result: "Data recorded" })
        })
      })
    })
  } catch (err) { 
    console.log(err)
    callback(null, {
      statusCode: err.response.status,
      body: JSON.stringify({ ...err.response.data })
    })
  }
}
