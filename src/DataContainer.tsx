import * as React from "react";
import * as L from "leaflet";

import { MapContainer } from "./MapContainer";
import { WardDetails } from "./WardDetails";
import { WeightingsEditor } from "./WeightingsEditor";
import { Ward, IWeightings, IData, StatePair, MapRef } from "./types";
import { WARD_CODE_FIELD, QUANTUM, WARD_CODE_CODE } from "./constants";
import { TopWards } from "./TopWards";
import { useWorkerComputation } from "./hooks";
import { SearchBar } from "./SearchBar";
import { RightMoveLink } from "./RightMoveLink";
import { ActionsMenu } from "./ActionsMenu";

// const worker = new Worker("./worker.ts", { type: "module" });
let hasRun = { value: false };
interface IDataContainerProps {
  readonly mapRef: MapRef;
  readonly sheetData: Map<string, IData>;
  readonly geoJsonData: GeoJSON.FeatureCollection;
  readonly weightings: IWeightings;
  readonly selectedWard: string | null;
  readonly setSelectedWard: (ward: string | null) => void;
  readonly setWeightings: (weightings: IWeightings) => void;
  readonly showTopState: StatePair<number | null>;
  readonly showAboveState: StatePair<number | null>;
}

export const DataContainer: React.FC<IDataContainerProps> = ({
  mapRef,
  sheetData,
  geoJsonData,
  weightings,
  selectedWard,
  setSelectedWard,
  setWeightings,
  showTopState,
  showAboveState
}) => {
  const scoresMeta = useWorkerComputation<{
    minScore: number;
    scoreRange: number;
  } | null>(null, "scoresMeta", sheetData, weightings);

  const rankings = useWorkerComputation<Map<
    string,
    { score: number; rank: number }
  > | null>(null, "rankings", sheetData, scoresMeta, weightings);

  const selectedWardStats = React.useMemo(() => {
    return rankings
      ? rankings.get(selectedWard || "") || { score: 0, rank: 0 }
      : null;
  }, [rankings, selectedWard]);

  const selectedWardDetails = React.useMemo(() => {
    return selectedWard !== null ? sheetData.get(selectedWard) : undefined;
  }, [sheetData, selectedWard]);

  const zoomToWard = React.useCallback(
    (wardCode: string) => {
      const geoJsonItem = geoJsonData.features.find(
        ({ properties }) =>
          !!properties && properties[WARD_CODE_CODE] === wardCode
      );
      if (geoJsonItem && mapRef.current) {
        mapRef.current.leafletElement.fitBounds(
          L.geoJSON(geoJsonItem).getBounds(),
          {
            maxZoom: 14
          }
        );
      }
    },
    [geoJsonData, mapRef]
  );

  return (
    <div className="data-container">
      <MapContainer
        mapRef={mapRef}
        selectedWard={selectedWard}
        rankings={rankings}
        noScores={!scoresMeta || scoresMeta.scoreRange === QUANTUM}
        geoJsonData={geoJsonData}
        setSelectedWard={setSelectedWard}
        showTop={showTopState[0]}
        showAbove={showAboveState[0]}
      />
      {selectedWardStats && selectedWardDetails ? (
        <WardDetails
          selectedWardDetails={selectedWardDetails}
          setSelectedWard={setSelectedWard}
          score={selectedWardStats.score}
          rank={selectedWardStats.rank}
          total={sheetData.size}
        />
      ) : null}
      <ActionsMenu
        rankings={rankings}
        sheetData={sheetData}
        mapRef={mapRef}
        zoomToWard={zoomToWard}
        weightings={weightings}
        setWeightings={setWeightings}
        showTopState={showTopState}
        showAboveState={showAboveState}
      />
      <SearchBar mapRef={mapRef} />
    </div>
  );
};
