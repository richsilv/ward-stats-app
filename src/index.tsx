// Remove this eventually
/* global gapi */
import * as React from "react";
import { render } from "react-dom";
import {
  Container,
  createMuiTheme,
  LinearProgress,
  Typography,
  Theme
} from "@material-ui/core";
import { ThemeProvider, createStyles, makeStyles } from "@material-ui/styles";

import {
  API_KEY,
  CLIENT_ID,
  DISCOVERY_DOCS,
  SCOPE,
  NON_COMPARISON_FIELDS,
  NORMALISED_EXTENSION_REGEXP,
  RANKING_EXTENSION_REGEXP,
  WARD_STATS_FILE,
  WARD_STATS_RANGE
} from "./constants";
import { GoogleAuth } from "./GoogleAuth";
import {
  Ward,
  IWeightings,
  ScoreType,
  SheetData,
  ApiResponse,
  IData
} from "./types";
import { csvToObjects, normaliseAll } from "./utils";
import { DataContainer } from "./DataContainer";
import { openIndexedDB, getIndexedDBValue } from "./indexedDB";
import {
  getSheetData,
  getDriveDocument,
  convertGeoJSONData
} from "./non-hooks";
import { ConvertedGeoJSONData } from "./types";
import { GEO_JSON_FILE } from "./constants";

import "./styles.css";

const dbName = "ward-stats";

const theme = createMuiTheme();

const useStyles = makeStyles(() =>
  createStyles({
    progress: {
      marginTop: "2rem"
    }
  })
);

function App() {
  const classes = useStyles();

  const [weightings, setWeightings] = React.useState<IWeightings | null>(null);
  const [sheetDataResponse, setSheetDataResponse] = React.useState<
    ApiResponse<Array<IData>>
  >(ApiResponse.preload<Array<IData>>());
  const [geoJsonDataResponse, setGeoJsonDataResponse] = React.useState<
    ApiResponse<ConvertedGeoJSONData>
  >(ApiResponse.preload<ConvertedGeoJSONData>());
  const signedInState = React.useState(false);
  const [isSignedIn] = signedInState;

  const dbPromise = React.useMemo(() => openIndexedDB(dbName), []);

  const makeConvertedSheetData = React.useCallback(async () => {
    if (!isSignedIn) {
      return Promise.reject("Not signed in");
    }
    return await getSheetData({
      sheetName: WARD_STATS_FILE,
      range: WARD_STATS_RANGE
    }).then((sheetData: SheetData) => normaliseAll(csvToObjects(sheetData)));
  }, [isSignedIn]);

  const wrapInApiResponse = React.useCallback<
    <T extends any>(valuePromise: Promise<T>) => Promise<ApiResponse<T>>
  >(<T extends any>(valuePromise: Promise<T>) => {
    return valuePromise
      .then(value => ApiResponse.loaded<T>(value))
      .catch(error => ApiResponse.error<T>(error));
  }, []);

  React.useEffect(() => {
    if (!isSignedIn) {
      return;
    }
    getIndexedDBValue<ApiResponse<Array<IData>>, Array<IData>>(
      dbPromise,
      "sheetData",
      makeConvertedSheetData,
      wrapInApiResponse
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

  const makeGeoJsonData = React.useCallback(() => {
    if (!isSignedIn) {
      return Promise.reject("Not signed in");
    }
    return getDriveDocument<GeoJSON.FeatureCollection>({
      filename: GEO_JSON_FILE
    });
  }, [isSignedIn]);

  React.useEffect(() => {
    if (!isSignedIn) {
      return;
    }
    getIndexedDBValue<
      ApiResponse<ConvertedGeoJSONData>,
      GeoJSON.FeatureCollection
    >(dbPromise, "geoJSON", makeGeoJsonData, convertGeoJSONData).then(
      newValue => {
        setGeoJsonDataResponse(newValue);
      }
    );
  }, [isSignedIn, dbPromise, makeGeoJsonData]);

  const [selectedWard, setSelectedWard] = React.useState<Ward | null>(null);

  const sheetData = sheetDataResponse.data();
  const geoJsonData = geoJsonDataResponse.data();

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <Container>
          <GoogleAuth
            apiKey={API_KEY}
            clientId={CLIENT_ID}
            discoveryDocs={DISCOVERY_DOCS}
            scope={SCOPE}
            signedInState={signedInState}
          />
          {sheetData && geoJsonData && weightings ? (
            <DataContainer
              sheetData={sheetData}
              geoJsonData={geoJsonData}
              weightings={weightings}
              selectedWard={selectedWard}
              setSelectedWard={setSelectedWard}
              setWeightings={setWeightings}
            />
          ) : sheetDataResponse.isLoading() ||
            geoJsonDataResponse.isLoading() ? (
            <LinearProgress className={classes.progress} />
          ) : (
            <React.Fragment>
              {sheetDataResponse.error() ? (
                <Typography variant="body1" paragraph color="error">
                  {sheetDataResponse.error()}
                </Typography>
              ) : geoJsonDataResponse.error() ? (
                <Typography variant="body1" paragraph color="error">
                  {geoJsonDataResponse.error()}
                </Typography>
              ) : (
                <LinearProgress className={classes.progress} />
              )}
            </React.Fragment>
          )}
        </Container>
      </div>
    </ThemeProvider>
  );
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
