const fs = require("fs");
const path = require("path");

const filenameIn = process.argv[2];
const filenameOut = process.argv[3];
const precision = parseInt(process.argv[4] || 6);
const sliceFeatures = parseInt(process.argv[5] || -1);

const factor = 10 ** precision;

if (!filenameIn) {
  console.error("You need to specify a filename");
  process.exit(-1);
}

const fullFilenameIn = path.join(__dirname, filenameIn);
const fullFilenameOut = path.join(__dirname, filenameOut);
const inData = JSON.parse(fs.readFileSync(fullFilenameIn).toString());
const features =
  sliceFeatures === -1
    ? inData.features
    : inData.features.slice(0, sliceFeatures);
const outFeatures = features.map(feature => ({
  ...feature,
  properties: {
    WD11CD: feature.properties.WD11CD
  },
  geometry: {
    ...feature.geometry,
    coordinates: feature.geometry.coordinates.map(array =>
      array.map(subarray =>
        feature.geometry.type === "Polygon"
          ? subarray.map(value => Math.round(value * factor) / factor)
          : subarray.map(subsubArray =>
              subsubArray.map(value => Math.round(value * factor) / factor)
            )
      )
    )
  }
}));

const outData = { ...inData, features: outFeatures };
fs.writeFileSync(fullFilenameOut, JSON.stringify(outData));
