const fs = require("fs");
const path = require("path");

const filename = process.argv[2];

if (!filename) {
  console.error("You need to specify a filename");
  process.exit(-1);
}

const fullFilename = path.join(__dirname, filename);
const inData = JSON.parse(fs.readFileSync(fullFilename).toString());
const outFeatures = inData.features.map(feature => ({
  ...feature,
  properties: {
    WD11CD: feature.properties.WD11CD
  },
  geometry: {
    ...feature.geometry,
    coordinates: feature.geometry.coordinates.map(array =>
      array.map(subarray =>
        subarray.map(value => Math.round(value * 100000) / 100000)
      )
    )
  }
}));

const outData = { ...inData, features: outFeatures };
fs.writeFileSync(fullFilename, JSON.stringify(outData));
