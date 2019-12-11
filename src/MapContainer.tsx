import * as React from "react";
import { Ward, IWeightings } from "./types";
import {
  Map as LeafletMap,
  GeoJSON as LeafletGeoJSON,
  TileLayer
} from "react-leaflet";
import { LeafletEvent } from "leaflet";
import { WARD_CODE_FIELD } from "./constants";
import { calculateScore } from "./utils";
import { useDebouncedCallback } from "./hooks";

interface MapContainerProps {
  readonly weightings: IWeightings;
  readonly selectedWard: Ward | null;
  readonly minScore: number;
  readonly scoreRange: number;
  readonly geoJsonToRender: Array<Ward> | null;
  readonly setSelectedWard: (ward: Ward) => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  weightings,
  minScore,
  scoreRange,
  geoJsonToRender,
  selectedWard,
  setSelectedWard
}) => {
  const [zoom, setZoom] = React.useState(6);

  const styleFeatures = useDebouncedCallback(
    (feature?: GeoJSON.Feature) => {
      if (!feature || !feature.properties) {
        return {};
      }
      const { properties } = feature;
      const isSelected =
        selectedWard &&
        properties[WARD_CODE_FIELD] ===
          selectedWard.properties[WARD_CODE_FIELD];

      const score =
        (calculateScore(weightings, properties!) - minScore) / scoreRange;

      return {
        stroke: zoom > 9,
        color: `rgba(0, 0, 0, ${isSelected ? 0.8 : 0.3})`,
        weight: isSelected ? 2 : 1,
        opacity: 0.6,
        fill: true,
        fillOpacity: Math.abs(0.5 - score) * 0.5 + 0.3,
        fillColor: `rgb(${Math.max(
          0,
          Math.round(255 - score * 255)
        )}, ${Math.min(255, Math.round(score * 255))}, 0)`
      };
    },
    [zoom, weightings, minScore, scoreRange, selectedWard],
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
    <LeafletMap
      zoom={zoom}
      center={[53.0, -1.75]}
      onZoom={onZoom}
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
  );
};
