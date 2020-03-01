import * as React from "react";
import { render } from "react-dom";
import {
  Container,
  createMuiTheme,
  LinearProgress,
  Typography
} from "@material-ui/core";
import { ThemeProvider, createStyles, makeStyles } from "@material-ui/styles";

import {
  NON_COMPARISON_FIELDS,
  NORMALISED_EXTENSION_REGEXP,
  RANKING_EXTENSION_REGEXP
} from "./constants";
import {
  IWeightings,
  ScoreType,
  SheetData,
  ApiResponse,
  IData,
  StatePair
} from "./types";
import { csvToObjects, normaliseAll, arrayToMap } from "./utils";
import { DataContainer } from "./DataContainer";
import { openIndexedDB, getIndexedDBValue } from "./indexedDB";
import { getGithubSheetData, getGithubGeoJson } from "./non-hooks";
import { MapRef } from "./types";
import { WARD_CODE_FIELD } from "./constants";

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
  const weightingsState = useLocallyStoredState<IWeightings | null>(
    "weightings",
    null
  );
  const showTopState = useLocallyStoredState<number | null>("showTop", null);
  const showAboveState = useLocallyStoredState<number | null>(
    "showAbove",
    null
  );
  const showStationsState = useLocallyStoredState<boolean>(
    "showStations",
    true
  );
  const [weightings, setWeightings] = weightingsState;

  const [sheetDataResponse, setSheetDataResponse] = React.useState<
    ApiResponse<Map<string, IData>>
  >(ApiResponse.preload<Map<string, IData>>());
  const [geoJsonDataResponse, setGeoJsonDataResponse] = React.useState<
    ApiResponse<GeoJSON.FeatureCollection>
  >(ApiResponse.preload<GeoJSON.FeatureCollection>());

  const dbPromise = React.useMemo(() => openIndexedDB(dbName), []);

  const makeConvertedSheetData = React.useCallback(async () => {
    return await getGithubSheetData().then((sheetData: SheetData) =>
      arrayToMap(normaliseAll(csvToObjects(sheetData)), WARD_CODE_FIELD)
    );
  }, []);

  React.useEffect(() => {
    setWrappedState(
      setSheetDataResponse,
      getIndexedDBValue<Map<string, IData>>(
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
        Object.keys(data.values().next().value).reduce(
          (objectSoFar: IWeightings, header) => {
            if (
              !NON_COMPARISON_FIELDS.includes(header) &&
              !NORMALISED_EXTENSION_REGEXP.test(header) &&
              !RANKING_EXTENSION_REGEXP.test(header)
            ) {
              objectSoFar[header] = { weight: 0, type: ScoreType.Normalised };
            }
            return objectSoFar;
          },
          {}
        )
      );
    }
  }, [sheetDataResponse]);

  React.useEffect(() => {
    setWrappedState(
      setGeoJsonDataResponse,
      getIndexedDBValue<GeoJSON.FeatureCollection, GeoJSON.FeatureCollection>(
        dbPromise,
        "geoJSON",
        getGithubGeoJson
      )
    );
  }, [dbPromise]);

  const [selectedWard, setSelectedWard] = React.useState<string | null>(null);

  const sheetData = sheetDataResponse.data();
  const geoJsonData = geoJsonDataResponse.data();
  const sheetDataError = sheetDataResponse.error();
  const geoJsonDataError = geoJsonDataResponse.error();

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <Container>
          {sheetData && geoJsonData && weightingsState[0] ? (
            <DataContainer
              mapRef={mapRef}
              sheetData={sheetData}
              geoJsonData={geoJsonData}
              selectedWard={selectedWard}
              setSelectedWard={setSelectedWard}
              weightingsState={weightingsState as StatePair<IWeightings>}
              showTopState={showTopState}
              showAboveState={showAboveState}
              showStationsState={showStationsState}
            />
          ) : sheetDataResponse.isLoading() ||
            geoJsonDataResponse.isLoading() ? (
            <LinearProgress className={classes.progress} />
          ) : (
            <React.Fragment>
              {sheetDataError ? (
                <Typography variant="body1" paragraph color="error">
                  {sheetDataError.message}
                </Typography>
              ) : geoJsonDataError ? (
                <Typography variant="body1" paragraph color="error">
                  {geoJsonDataError.message}
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
