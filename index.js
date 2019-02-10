/**
 * Paint Scraper
 * A simple node script to parse the hex codes, color names, and more from Rustoleum Painter's Touch 2x spray paint product pages on Home Depot's website.
 * See README for instructions and disclaimer.
 *
*/

const axios = require('axios');
var fs = require('fs');

// Constants
const DATAFILE = 'data.json';

// EDIT THIS OBJECT TO ADD YOUR URLS
// eg: https://www.homedepot.com/p/Rust-Oleum-Painter-s-Touch-2X-12-oz-Warm-Caramel-Satin-General-Purpose-Spray-Paint-6-Pack-267118/203872979
let urls = [];

// TODO: These fail to parse - need to tighten up the regexp
//  'https://www.homedepot.com/p/Rust-Oleum-Painter-s-Touch-2X-12-oz-Flat-Gray-Primer-General-Purpose-Spray-Paint-249088/100670412'
//   'https://www.homedepot.com/p/Rust-Oleum-Painter-s-Touch-2X-12-oz-Flat-Red-Primer-General-Purpose-Spray-Paint-249086/100670434',

// TODO: Leverage a command line argument or infile

// No Need to edit below this line for normal usage...


let totalRecords = 0;
let totalNewRecords = 0;
let totalSkipped = 0;
let totalErrored = 0;

// Open our json storage file to append to
fs.readFile(DATAFILE, 'utf8', function readFileCallback(err, data) {
  if (err) {
    throw Error('Error opening data file ' + DATAFILE);
  } else {
    // Prep array of data
    if (data == '') { data = '[]'; }
    // TODO: Make more robust if file isn't empty but some other object

    // Read Contents
    existingRecords = JSON.parse(data);

    // Iterate over list of candidate urls
    let urlsToParse = urls.reduce((acc, candidateUrl) => {
      // Check if the candidate url is already stored, saves a crawl
      let alreadyParsed = existingRecords.some((record) => {
        return (record.productUrl == candidateUrl);
      });

      if (!alreadyParsed) {
        return [...acc, candidateUrl];
      }

      // Skip it. We've seen it. If it is out of date, manually remove the record
      totalSkipped++;
      return acc;
    }, []);

    // Resolve all promises and add to records if not already seen
    let axiosPromises = urlsToParse.map(getDataFromUrl);
    Promise.all(axiosPromises).then((newRecords) => {
      newRecords.forEach((newRecord) => {
        if (!newRecord) {
          return; // Possible errored...
        }

        // Check to see if the record already exists - dupe OR goofy url
        let exists = existingRecords.some((existingRecord) => {
          return (existingRecord.hex == newRecord.hex);
        });

        if (!exists) {
          existingRecords.push(newRecord);
          totalNewRecords++;
        }
        else {
          totalSkipped++;
        }
      });

      json = JSON.stringify(existingRecords, null, 2);
      fs.writeFile(DATAFILE, json, 'utf8', () => { console.log('File updated. Total Records: ' + existingRecords.length + ' Total New: ' +  totalNewRecords + ' records. Total Skipped : ' + totalSkipped +'. Total Errored: ' + totalErrored); });
    });
  }
});

async function getDataFromUrl(url) {
  let data;

  try {
    const response = await axios.get(url);
    data = response.data;
  } catch(error) {
    totalErrored++;
      console.log('ERROR: ' + error.response.status + ' for url ' + url);
    return false;
  }

  // Parse
  try {
    return extractData(data);
  } catch(error) {
    totalErrored++;
    console.log('ERROR: There was an error parsing the contents of ' + url);
    console.log(error)
  }
}

function extractData(contents) {
  var specsRegexp = RegExp('(<div class="specs__group col-12 col-lg-6">\n[^<]*)(<div class="col-6 specs__cell specs__cell--label">)([^<]+)(</div>\n[^<]*<div class="col-6 specs__cell" >)([^<]+)(</div>)', 'g');
  var urlRegexp = RegExp('(<meta property="og:url" content=")(https://www.homedepot.com/p/[^"]+)("/>)', 'g');


  //var nameRegexp = RegExp('(Rust-Oleum Painter&#39;s Touch 2X 12 oz. )(Gloss|Satin|) (.+) (Gloss|Satin|)([^"]+)(Spray Paint)', 'g');
  var nameRegexpSingle = RegExp('(Rust-Oleum Painter&#39;s Touch 2X 12 oz. )(Gloss|Satin|) (.+) (Gloss|Satin|)([^"]+)(Spray Paint)', 'g');
  var nameRegexp6pack = RegExp('(Rust-Oleum Painter&#39;s Touch 2X 12 oz. )(.+) (Gloss|Satin)([^"]+)(Spray Paint)', 'g');

  let specs = [];
  var specsMatch;

  // Glean Specs
  while((specsMatch = specsRegexp.exec(contents)) !== null) {
    //console.log(specsMatch[3] + ': ' + specsMatch[5]);
    specs.push([specsMatch[3], specsMatch[5]]);
  }

  // Get Url
  let urlMatch = urlRegexp.exec(contents);
  productUrl = urlMatch[2];

  // Get Title - try the 6 pack title format
  let name;
  let titleMatch = nameRegexp6pack.exec(contents);
  if (titleMatch) {
    name = titleMatch[2];
  }
  else {
    // Try the single can title format
    titleMatch = nameRegexpSingle.exec(contents)
    name = titleMatch[3].replace(' General', ''); // lazy
  }

  // Get hex, shee, etc from the parsed specs
  let hex = null;
  let sheen = 'unknown';
  specs.forEach((pair) => {
    if (pair[0] == 'Hexadecimal Value') {
      hex = pair[1];
    }
    if (pair[0] == 'Sheen') {
      sheen = pair[1];
    }
  });

  return {name, hex, sheen, productUrl};
}
