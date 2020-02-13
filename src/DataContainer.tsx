import * as React from "react";

import { MapContainer } from "./MapContainer";
import { WardDetails } from "./WardDetails";
import { WeightingsEditor } from "./WeightingsEditor";
import { Ward, IWeightings, IData, StatePair, MapRef } from "./types";
import { WARD_CODE_FIELD, QUANTUM } from "./constants";
import { TopWards } from "./TopWards";
import { useWorkerComputation } from "./hooks";
import { SearchBar } from "./SearchBar";
import { RightMoveLink } from "./RightMoveLink";
import { ActionsMenu } from "./ActionsMenu";

// const worker = new Worker("./worker.ts", { type: "module" });
let hasRun = { value: false };
interface IDataContainerProps {
  readonly mapRef: MapRef;
  readonly sheetData: Array<IData>;
  readonly geoJsonData: Map<string, Ward>;
  readonly weightings: IWeightings;
  readonly selectedWard: Ward | null;
  readonly setSelectedWard: (ward: Ward | null) => void;
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
  const geoJsonMap = useWorkerComputation<Map<string, Ward>>(
    null,
    "geoJsonMap",
    sheetData,
    geoJsonData
  );

  const geoJsonToRender = React.useMemo(
    () => (geoJsonMap ? Array.from(geoJsonMap.values()) : null),
    [geoJsonMap]
  );

  const scoresMeta = useWorkerComputation<{
    minScore: number;
    scoreRange: number;
  } | null>(null, "scoresMeta", geoJsonToRender, weightings);

  const rankings = useWorkerComputation<Map<
    string,
    { score: number; rank: number }
  > | null>(null, "rankings", sheetData, scoresMeta, weightings);

  const selectedWardStats = React.useMemo(() => {
    return rankings
      ? rankings.get(
          selectedWard ? selectedWard.properties[WARD_CODE_FIELD] : ""
        ) || { score: 0, rank: 0 }
      : null;
  }, [rankings, selectedWard]);

  return (
    <div className="data-container">
      <MapContainer
        mapRef={mapRef}
        selectedWard={selectedWard}
        rankings={rankings}
        noScores={!scoresMeta || scoresMeta.scoreRange === QUANTUM}
        geoJsonToRender={geoJsonToRender}
        setSelectedWard={setSelectedWard}
        showTop={showTopState[0]}
        showAbove={showAboveState[0]}
      />
      {selectedWardStats ? (
        <WardDetails
          selectedWard={selectedWard}
          setSelectedWard={setSelectedWard}
          score={selectedWardStats.score}
          rank={selectedWardStats.rank}
          total={sheetData.length}
        />
      ) : null}
      <ActionsMenu
        rankings={rankings}
        geoJsonMap={geoJsonMap}
        mapRef={mapRef}
        setSelectedWard={setSelectedWard}
        weightings={weightings}
        setWeightings={setWeightings}
        showTopState={showTopState}
        showAboveState={showAboveState}
      />
      <SearchBar mapRef={mapRef} />
    </div>
  );
};
