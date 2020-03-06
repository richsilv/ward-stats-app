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
  StatePair,
  FieldType,
  ISheetDataMaps
} from "./types";
import {
  csvToObjects,
  normaliseAll,
  arrayToMap,
  makeFieldTypes
} from "./utils";
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

  const [sheetResponse, setSheetResponse] = React.useState<
    ApiResponse<ISheetDataMaps>
  >(ApiResponse.preload<ISheetDataMaps>());
  const [geoJsonDataResponse, setGeoJsonDataResponse] = React.useState<
    ApiResponse<GeoJSON.FeatureCollection>
  >(ApiResponse.preload<GeoJSON.FeatureCollection>());

  const dbPromise = React.useMemo(() => openIndexedDB(dbName), []);

  const makeConvertedSheetData = React.useCallback(async () => {
    return await getGithubSheetData().then((sheetData: SheetData) => {
      const fieldTypes = sheetData.splice(1, 1)[0];
      return {
        data: arrayToMap(
          normaliseAll(csvToObjects(sheetData)),
          WARD_CODE_FIELD
        ),
        fields: makeFieldTypes(sheetData[0], fieldTypes)
      };
    });
  }, []);

  React.useEffect(() => {
    setWrappedState(
      setSheetResponse,
      getIndexedDBValue<ISheetDataMaps>(
        dbPromise,
        "sheetData",
        makeConvertedSheetData
      )
    );
  }, [dbPromise, makeConvertedSheetData]);

  React.useEffect(() => {
    const data = sheetResponse.data();
    if (data && !weightings) {
      setWeightings(
        Object.keys(data.data.values().next().value).reduce(
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
  }, [sheetResponse]);

  React.useEffect(() => {
    setWrappedState(
      setGeoJsonDataResponse,
      getIndexedDBValue<GeoJSON.FeatureCollection>(
        dbPromise,
        "geoJSON",
        getGithubGeoJson
      )
    );
  }, [dbPromise]);

  const [selectedWard, setSelectedWard] = React.useState<string | null>(null);

  const sheet = sheetResponse.data();
  const geoJsonData = geoJsonDataResponse.data();
  const sheetError = sheetResponse.error();
  const geoJsonDataError = geoJsonDataResponse.error();

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <Container>
          {sheet && geoJsonData && weightingsState[0] ? (
            <DataContainer
              mapRef={mapRef}
              sheetData={sheet.data}
              fields={sheet.fields}
              geoJsonData={geoJsonData}
              selectedWard={selectedWard}
              setSelectedWard={setSelectedWard}
              weightingsState={weightingsState as StatePair<IWeightings>}
              showTopState={showTopState}
              showAboveState={showAboveState}
              showStationsState={showStationsState}
            />
          ) : sheetResponse.isLoading() || geoJsonDataResponse.isLoading() ? (
            <LinearProgress className={classes.progress} />
          ) : (
            <React.Fragment>
              {sheetError ? (
                <Typography variant="body1" paragraph color="error">
                  {sheetError.message}
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
