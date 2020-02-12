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
  getGithubSheetData,
  convertGeoJSONData,
  getGithubGeoJson
} from "./non-hooks";
import { ConvertedGeoJSONData, MapRef } from "./types";
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

  const mapRef: MapRef = React.useRef();
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

  const dbPromise = React.useMemo(() => openIndexedDB(dbName), []);

  const makeConvertedSheetData = React.useCallback(async () => {
    return await getGithubSheetData().then((sheetData: SheetData) =>
      normaliseAll(csvToObjects(sheetData))
    );
  }, []);

  React.useEffect(() => {
    setWrappedState(
      setSheetDataResponse,
      getIndexedDBValue<Array<IData>>(
        dbPromise,
        "sheetData",
        makeConvertedSheetData
      )
    );
  }, [dbPromise, makeConvertedSheetData]);

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
    return getGithubGeoJson();
  }, []);

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
  }, [dbPromise, makeGeoJsonData]);

  const [selectedWard, setSelectedWard] = React.useState<Ward | null>(null);

  const sheetData = sheetDataResponse.data();
  const geoJsonData = geoJsonDataResponse.data();

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <Container>
          {sheetData && geoJsonData && weightings ? (
            <DataContainer
              mapRef={mapRef}
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
