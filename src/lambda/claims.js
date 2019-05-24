import Airtable from 'airtable'

const { AIRTABLE_API_KEY, AIRTABLE_BASE } = process.env
// (TODO: add a file with this config (needed to be `mv`) and add .gitignore)
// or in dev env
// const AIRTABLE_API_KEY=
// const AIRTABLE_BASE=

// TODO: use a bot instead of a netlify function to avoid a DDOS attack
exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method Not Allowed" }

  const base = new Airtable({ apiKey: AIRTABLE_API_KEY })
    .base(AIRTABLE_BASE)

  const params = JSON.parse(event.body)
  console.log("address", params.address)
  const address = params.address || "0x00"

  // TODO: check if the signature is valid
  // if valid send to airtable else return 401 UNAUTHORIZED
  base('Owners').select({
    view: 'Grid view',
    filterByFormula: `{Address} = '${address}'` // FIXME: ${drizzleState.account}
  }).firstPage((err, records) => {
    if (err) { console.error(err); return; }
    records.forEach(record => {
      base('Claims').create({
          "Address Finder": "send by prod 42", // FIXME: finder address
          "Item ID": "test Prod", // FIXME: item ID
          "Email Owner": "wagner.nicolas1@gmail.com", // idem
          "Phone Number Owner": "+33650334223" // idem
        }, 
        err => { if (err) { console.error(err); return }
      })
    })
  })

  return {
    statusCode: 200,
    body: JSON.stringify({ 
      itemID: "Hello, World!",
      addressFinder: "",
      addressOwner: "",
      mailOwner: "",
      phoneNumberOwner: ""
    })
  }
}
