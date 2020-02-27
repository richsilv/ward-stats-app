import * as React from "react";
import * as L from "leaflet";
import Color from "color";

import { Ward, IWeightings, MapRef, DefinedMapRef } from "./types";
import {
  Map as LeafletMap,
  GeoJSON as LeafletGeoJSON,
  TileLayer,
  FeatureGroup,
  Circle,
  Popup
} from "react-leaflet";
import { LeafletEvent } from "leaflet";
import { WARD_CODE_FIELD, WARD_CODE_CODE } from "./constants";
import { useLocallyStoredState, useParameterisedCallbacks } from "./hooks";
import {
  useTheme,
  CircularProgress,
  Backdrop,
  makeStyles,
  Theme,
  createStyles,
  Typography,
  TableBody,
  Table,
  TableRow,
  TableCell
} from "@material-ui/core";

import stationData from "./station-data.json";
import { filterByBounds } from "./utils";

interface IStation {
  readonly code: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
  readonly vol: number;
  readonly ave: number;
  readonly fast: number;
  readonly hour: number | null;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    backdrop: {
      zIndex: theme.zIndex.drawer + 1,
      color: "#fff"
    }
  })
);

interface MapContainerProps {
  readonly mapRef: MapRef;
  readonly selectedWard: string | null;
  readonly noScores: boolean;
  readonly rankings: Map<string, { score: number; rank: number }> | null;
  readonly geoJsonData: GeoJSON.FeatureCollection;
  readonly showTop: number | null;
  readonly showAbove: number | null;
  readonly showStations: boolean;
  readonly setSelectedWard: (ward: string) => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  mapRef,
  noScores,
  rankings,
  geoJsonData,
  selectedWard,
  showTop,
  showAbove,
  showStations,
  setSelectedWard
}) => {
  const theme = useTheme();
  const classes = useStyles();
  const [zoom, setZoom] = useLocallyStoredState("zoom", 8);
  const [center, setCenter] = useLocallyStoredState(
    "center",
    new L.LatLng(53.0, -1.75)
  );
  const [station, setStation] = React.useState<IStation>(stationData[0]);
  const selectedWardLayer = React.useRef<L.Path | null>(null);
  const geoJsonLayer = React.useRef<L.GeoJSON | null>(null);

  const goodColor = React.useMemo(() => Color(theme.palette.success.dark), [
    theme
  ]);
  const badColor = React.useMemo(() => Color(theme.palette.error.light), [
    theme
  ]);

  const stationsToRender = React.useMemo(() => {
    return filterByBounds(stationData, mapRef);
  }, [stationData, mapRef, zoom, center]);

  const styleFeatures = React.useCallback(
    (feature?: GeoJSON.Feature) => {
      if (noScores || !rankings || !feature || !feature.properties) {
        return {};
      }
      const { score } = rankings.get(feature.properties[WARD_CODE_CODE]) || {
        score: 0
      };

      const styling: L.PathOptions = {
        opacity: 0.6,
        fillOpacity: Math.abs(0.5 - score) * 0.5 + 0.3,
        fillColor: badColor.mix(goodColor, score).string()
      };
      return styling;
    },
    [noScores, rankings]
  );

  const filter = React.useCallback(
    (feature?: GeoJSON.Feature) => {
      if (noScores || !rankings || !feature || !feature.properties) {
        return false;
      }
      const { score, rank } = rankings.get(
        feature.properties[WARD_CODE_CODE]
      ) || {
        score: 0,
        rank: 0
      };

      return (
        (!!showTop && showTop >= rank) ||
        (!!showAbove && score >= showAbove) ||
        (!showTop && !showAbove)
      );
    },
    [noScores, rankings, showTop, showAbove]
  );

  React.useEffect(() => {
    const layer = geoJsonLayer.current;
    if (layer) {
      layer.clearLayers();
      layer.options.filter = filter;
      window.requestAnimationFrame(() => layer.addData(geoJsonData));
    }
  }, [showTop, showAbove, rankings]);

  const onZoom = React.useCallback((event: LeafletEvent) => {
    setZoom(event.target.getZoom());
  }, []);

  const onMove = React.useCallback((event: LeafletEvent) => {
    setCenter(event.target.getCenter());
  }, []);

  const onClick = React.useCallback((event: LeafletEvent) => {
    setSelectedWard(event.layer.feature.properties[WARD_CODE_CODE]);
    selectedWardLayer.current = event.layer;
    event.layer.setStyle({
      opacity: 0.6,
      color: "rgba(0, 0, 0, 0.8)",
      weight: 2
    });
  }, []);

  React.useEffect(() => {
    if (!selectedWard && selectedWardLayer.current) {
      selectedWardLayer.current.setStyle({
        opacity:
          selectedWardLayer.current.options.fillColor === "transparent"
            ? 0.3
            : 0.6,
        color: "rgba(0, 0, 0, 0.3)",
        weight: 1
      });
    }
  }, [selectedWard]);

  const onClickStationArray = useParameterisedCallbacks(
    stationData.map(station => station.code),
    (stationCode: string) => {
      const station = stationData.find(({ code }) => code === stationCode);
      if (station) {
        setStation(station);
      }
    },
    [stationData, setStation]
  );

  const geoJsonRefCallback = React.useCallback((element: any) => {
    element.leafletElement.bringToBack();
    geoJsonLayer.current = element.leafletElement;
  }, []);

  return (
    <React.Fragment>
      <LeafletMap
        preferCanvas
        ref={mapRef as DefinedMapRef}
        zoom={zoom}
        center={center}
        onZoom={onZoom}
        onMove={onMove}
      >
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoJsonData && rankings ? (
          <LeafletGeoJSON
            ref={geoJsonRefCallback}
            data={geoJsonData}
            style={styleFeatures}
            filter={filter}
            stroke={true}
            color="rgba(0, 0, 0, 0.3)"
            fill={true}
            fillColor="transparent"
            opacity={0.3}
            weight={1}
            onClick={onClick}
          />
        ) : null}
        {zoom >= 10 && showStations ? (
          <FeatureGroup>
            {stationsToRender.map((station: IStation) => (
              <Circle
                key={station.code}
                onClick={onClickStationArray.get(station.code)}
                center={[station.lat, station.lon]}
                radius={20 + Math.log2(station.vol) * 15}
                stroke={true}
                weight={1}
                color="#222"
                fill={true}
                fillOpacity={0.75}
                fillColor={`hsl(${120 - station.ave / 2}, 100%, 50%)`}
                className={`station station-${station.code}`}
              />
            ))}
            <Popup>
              <Typography variant="h5">{station.name}</Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Fastest train: {station.fast} minutes</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Average train: {station.ave} minutes</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Trains per hour: {station.hour || "Few"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Popup>
          </FeatureGroup>
        ) : null}
      </LeafletMap>
      <Backdrop className={classes.backdrop} open={!rankings}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </React.Fragment>
  );
};
