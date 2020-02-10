import * as React from "react";
import * as L from "leaflet";
import Color from "color";

import { Ward, IWeightings } from "./types";
import {
  Map as LeafletMap,
  GeoJSON as LeafletGeoJSON,
  TileLayer,
  FeatureGroup,
  Circle,
  Popup
} from "react-leaflet";
import { LeafletEvent } from "leaflet";
import { WARD_CODE_FIELD } from "./constants";
import { useDebouncedCallback, useLocallyStoredState } from "./hooks";
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
  readonly mapRef: React.MutableRefObject<any>;
  readonly weightings: IWeightings;
  readonly selectedWard: Ward | null;
  readonly noScores: boolean;
  readonly rankings: Map<string, { score: number; rank: number }> | null;
  readonly geoJsonToRender: Array<Ward> | null;
  readonly showTop: number | null;
  readonly showAbove: number | null;
  readonly setSelectedWard: (ward: Ward) => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  mapRef,
  weightings,
  noScores,
  rankings,
  geoJsonToRender,
  selectedWard,
  showTop,
  showAbove,
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

  const goodColor = React.useMemo(() => Color(theme.palette.primary.main), [
    theme
  ]);
  const badColor = React.useMemo(() => Color(theme.palette.error.main), [
    theme
  ]);

  const styleFeatures = React.useCallback(
    (feature?: GeoJSON.Feature) => {
      if (!rankings || !feature || !feature.properties) {
        return {};
      }
      const { properties } = feature;
      const isSelected =
        selectedWard &&
        properties[WARD_CODE_FIELD] ===
          selectedWard.properties[WARD_CODE_FIELD];

      const { score, rank } = rankings.get(properties[WARD_CODE_FIELD]) || {
        score: 0,
        rank: 0
      };

      if ((showTop && showTop < rank) || (showAbove && score < showAbove)) {
        return {
          opacity: isSelected ? 0.6 : 0,
          fill: false
        };
      }

      return {
        stroke: zoom > 9,
        color: `rgba(0, 0, 0, ${isSelected ? 0.8 : 0.3})`,
        weight: isSelected ? 2 : 1,
        opacity: 0.6,
        fill: true,
        fillOpacity: noScores ? 0 : Math.abs(0.5 - score) * 0.5 + 0.3,
        fillColor: badColor.mix(goodColor, score).string()
      };
    },
    [zoom, weightings, rankings, selectedWard, showTop, showAbove]
  );

  const onZoom = React.useCallback((event: LeafletEvent) => {
    setZoom(event.target.getZoom());
  }, []);

  const onMove = React.useCallback((event: LeafletEvent) => {
    setCenter(event.target.getCenter());
  }, []);

  const onClick = React.useCallback((event: LeafletEvent) => {
    setSelectedWard(event.layer.feature);
  }, []);

  const onClickStationFactory = React.useCallback(
    (station: IStation) => () => {
      setStation(station);
    },
    [setStation]
  );

  return (
    <React.Fragment>
      <LeafletMap
        ref={mapRef}
        zoom={zoom}
        center={center}
        onZoom={onZoom}
        onMove={onMove}
        preferCanvas
      >
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoJsonToRender && rankings ? (
          <LeafletGeoJSON
            data={(geoJsonToRender as unknown) as GeoJSON.GeoJsonObject}
            style={styleFeatures}
            onClick={onClick}
          />
        ) : null}
        {zoom >= 10 ? (
          <FeatureGroup>
            {stationData.map((station: IStation) => (
              <Circle
                onClick={onClickStationFactory(station)}
                center={[station.lat, station.lon]}
                radius={20 + Math.log2(station.vol) * 15}
                stroke={true}
                weight={1}
                color="#222"
                fill={true}
                fillOpacity={0.75}
                fillColor={`hsl(${120 - station.ave / 2}, 100%, 50%)`}
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
      <Backdrop
        className={classes.backdrop}
        open={!geoJsonToRender || !rankings}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </React.Fragment>
  );
};
