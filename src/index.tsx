// Remove this eventually
/* global gapi */
import * as React from "react";
import { render } from "react-dom";
import { Container } from "@material-ui/core";

import {
  API_KEY,
  CLIENT_ID,
  DISCOVERY_DOCS,
  SCOPE,
  NON_COMPARISON_FIELDS,
  NORMALISED_EXTENSION_REGEXP,
  RANKING_EXTENSION_REGEXP
} from "./constants";
import { GoogleAuth } from "./GoogleAuth";
import {
  useSheetData,
  useConvertGeoJSONData,
  useFileUploadButton
} from "./hooks";
import { FeatureCollection } from "geojson";
import {
  Ward,
  IWeightings,
  ScoreType,
  SheetData,
  ApiResponse,
  IData
} from "./types";
import { csvToObjects, normaliseAll } from "./utils";

import "./styles.css";
import { DataContainer } from "./DataContainer";
import { openIndexedDB, getIndexedDBValue } from "./indexedDB";
import { getSheetData } from "./non-hooks";

const dbName = "ward-stats";

function App() {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploadDataProps, data] = useFileUploadButton<FeatureCollection>(
    fileInputRef
  );
  const [weightings, setWeightings] = React.useState<IWeightings | null>(null);
  const [sheetDataResponse, setSheetDataResponse] = React.useState<
    ApiResponse<Array<IData>>
  >(ApiResponse.preload<Array<IData>>());
  const signedInState = React.useState(false);
  const [isSignedIn] = signedInState;

  const dbPromise = React.useMemo(() => openIndexedDB(dbName), []);
  const makeConvertedSheetData = React.useCallback(async () => {
    if (!isSignedIn) {
      return Promise.resolve(ApiResponse.loading<Array<IData>>());
    }
    return await getSheetData({
      sheetName: "Ward stats 2",
      range: "API!A1:AD8571"
    }).then((sheetData: ApiResponse<SheetData>) =>
      sheetData.map(csvToObjects).map(normaliseAll)
    );
  }, [isSignedIn]);

  React.useEffect(() => {
    if (!isSignedIn) {
      return;
    }
    getIndexedDBValue(
      dbPromise,
      "geoJSON",
      makeConvertedSheetData,
      ApiResponse.prototype
    ).then(newValue => {
      setSheetDataResponse(newValue);
    });
  }, [isSignedIn, dbPromise, makeConvertedSheetData]);

  React.useEffect(() => {
    const data = sheetDataResponse.data();
    if (data && !weightings) {
      setWeightings(
        Object.keys(data[0]).reduce((objectSoFar: IWeightings, header) => {
          if (
            !NON_COMPARISON_FIELDS.includes(header) &&
            !NORMALISED_EXTENSION_REGEXP.test(header) &&
            !RANKING_EXTENSION_REGEXP.test(header)
          ) {
            objectSoFar[header] = { weight: 0, type: ScoreType.Normalised };
          }
          return objectSoFar;
        }, {})
      );
    }
  }, [sheetDataResponse]);

  const geoJSONDataResponse = useConvertGeoJSONData(data);

  const [selectedWard, setSelectedWard] = React.useState<Ward | null>(null);

  const sheetData = sheetDataResponse.data();
  const geoJSONData = geoJSONDataResponse.data();
  console.log(geoJSONData);

  return (
    <div className="App">
      <Container>
        <GoogleAuth
          apiKey={API_KEY}
          clientId={CLIENT_ID}
          discoveryDocs={DISCOVERY_DOCS}
          scope={SCOPE}
          signedInState={signedInState}
        />
        <input type="file" {...uploadDataProps} />
        {sheetData && geoJSONData && weightings ? (
          <DataContainer
            sheetData={sheetData}
            geoJSONData={geoJSONData}
            weightings={weightings}
            selectedWard={selectedWard}
            setSelectedWard={setSelectedWard}
            setWeightings={setWeightings}
          />
        ) : sheetDataResponse.isLoading() || geoJSONDataResponse.isLoading() ? (
          <p>Loading...</p>
        ) : (
          <React.Fragment>
            {sheetDataResponse.error() ? (
              <p>convertedSheetDataResponse.error()</p>
            ) : null}
            {geoJSONDataResponse.error() ? (
              <p>geoJSONDataResponse.error()</p>
            ) : null}
          </React.Fragment>
        )}
      </Container>
    </div>
  );
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
