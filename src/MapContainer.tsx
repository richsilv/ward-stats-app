import * as React from "react";
import Color from "color";

import { Ward, IWeightings } from "./types";
import {
  Map as LeafletMap,
  GeoJSON as LeafletGeoJSON,
  TileLayer
} from "react-leaflet";
import { LeafletEvent } from "leaflet";
import { WARD_CODE_FIELD } from "./constants";
import { useDebouncedCallback } from "./hooks";
import {
  useTheme,
  CircularProgress,
  Backdrop,
  makeStyles,
  Theme,
  createStyles
} from "@material-ui/core";

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
  const [zoom, setZoom] = React.useState(8);

  const goodColor = React.useMemo(() => Color(theme.palette.primary.main), [
    theme
  ]);
  const badColor = React.useMemo(() => Color(theme.palette.error.main), [
    theme
  ]);

  const styleFeatures = useDebouncedCallback(
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
    [zoom, weightings, rankings, selectedWard, showTop, showAbove],
    250,
    1000
  );

  const onZoom = React.useCallback((event: LeafletEvent) => {
    setZoom(event.target.getZoom());
  }, []);

  const onClick = React.useCallback((event: LeafletEvent) => {
    setSelectedWard(event.layer.feature);
  }, []);

  return (
    <React.Fragment>
      <LeafletMap
        ref={mapRef}
        zoom={zoom}
        center={[53.0, -1.75]}
        onZoom={onZoom}
        zoomAnimation={false}
        zoomSnap={0}
        preferCanvas={true}
      >
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoJsonToRender ? (
          <LeafletGeoJSON
            data={(geoJsonToRender as unknown) as GeoJSON.GeoJsonObject}
            style={styleFeatures}
            onClick={onClick}
          />
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
