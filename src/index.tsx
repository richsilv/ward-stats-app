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
import { useLocallyStoredState } from "./hooks";

const dbName = "ward-stats";

const theme = createMuiTheme();

const useStyles = makeStyles(() =>
  createStyles({
    progress: {
      marginTop: "2rem"
    }
  })
);

function setWrappedState<T>(
  setter: (value: ApiResponse<T>) => void,
  response: Promise<T>
) {
  response
    .then(newValue => {
      if (newValue) {
        setter(ApiResponse.loaded<T>(newValue));
      }
    })
    .catch(error => {
      setter(ApiResponse.error<T>(error));
    });
}

function App() {
  const classes = useStyles();

  const [weightings, setWeightings] = useLocallyStoredState<IWeightings | null>(
    "weightings",
    null
  );
  const showTopState = useLocallyStoredState<number | null>("showTop", null);
  const showAboveState = useLocallyStoredState<number | null>(
    "showAbove",
    null
  );

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

  React.useEffect(() => {
    setWrappedState(
      setSheetDataResponse,
      getIndexedDBValue<Array<IData>>(
        dbPromise,
        "sheetData",
        makeConvertedSheetData
      )
    );
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
    setWrappedState(
      setGeoJsonDataResponse,
      getIndexedDBValue<ConvertedGeoJSONData, GeoJSON.FeatureCollection>(
        dbPromise,
        "geoJSON",
        makeGeoJsonData,
        convertGeoJSONData
      )
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
              showTopState={showTopState}
              showAboveState={showAboveState}
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
