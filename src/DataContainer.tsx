import * as React from "react";

import { MapContainer } from "./MapContainer";
import { WardDetails } from "./WardDetails";
import { WeightingsEditor } from "./WeightingsEditor";
import { Ward, IWeightings, IData, StatePair } from "./types";
import { WARD_CODE_FIELD, QUANTUM } from "./constants";
import { calculateScore } from "./utils";
import { TopWards } from "./TopWards";

import Worker from "worker-loader!./worker";

const worker = new Worker();

interface IDataContainerProps {
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
  sheetData,
  geoJsonData,
  weightings,
  selectedWard,
  setSelectedWard,
  setWeightings,
  showTopState,
  showAboveState
}) => {
  const geoJsonMap = React.useMemo(() => {
    if (!sheetData || !geoJsonData) return null;
    const features: Map<string, Ward> = new Map(
      sheetData.map((data): [string, Ward] => {
        const wardCode = data[WARD_CODE_FIELD] as string;
        const feature = geoJsonData.get(wardCode);
        return [
          wardCode,
          {
            ...feature!,
            properties: { ...feature!.properties, ...data }
          }
        ];
      })
    );
    return features;
  }, [sheetData, geoJsonData]);

  const geoJsonToRender = React.useMemo(
    () => (geoJsonMap ? Array.from(geoJsonMap.values()) : []),
    [geoJsonMap]
  );

  const { minScore, scoreRange } = React.useMemo(() => {
    if (!geoJsonToRender) return { minScore: 0, scoreRange: QUANTUM };
    const { minScore, maxScore } = geoJsonToRender.reduce(
      (
        { minScore, maxScore }: { minScore: number; maxScore: number },
        { properties }
      ) => {
        const score = calculateScore(weightings, properties!);
        return {
          minScore: Math.min(minScore, score),
          maxScore: Math.max(maxScore, score)
        };
      },
      { minScore: Infinity, maxScore: -Infinity }
    );
    return { minScore, scoreRange: maxScore - minScore + QUANTUM };
  }, [geoJsonToRender, weightings]);

  const rankings = React.useMemo(() => {
    return new Map(
      sheetData
        .map((dataItem): [string, number] => [
          dataItem[WARD_CODE_FIELD] as string,
          (calculateScore(weightings, dataItem) - minScore) / scoreRange
        ])
        .sort(([_, scoreA], [__, scoreB]) => scoreB - scoreA)
        .map(
          ([wardCode, score], index) =>
            [wardCode, { score, rank: index + 1 }] as [
              string,
              { score: number; rank: number }
            ]
        )
    );
  }, [sheetData, minScore, scoreRange]);

  const { score, rank } = React.useMemo(() => {
    return (
      rankings.get(
        selectedWard ? selectedWard.properties[WARD_CODE_FIELD] : ""
      ) || { score: 0, rank: 0 }
    );
  }, [rankings, selectedWard]);

  return (
    <div className="data-container">
      <MapContainer
        weightings={weightings}
        selectedWard={selectedWard}
        rankings={rankings}
        noScores={scoreRange === QUANTUM}
        geoJsonToRender={geoJsonToRender}
        setSelectedWard={setSelectedWard}
        showTop={showTopState[0]}
        showAbove={showAboveState[0]}
      />
      <WardDetails
        selectedWard={selectedWard}
        setSelectedWard={setSelectedWard}
        score={score}
        rank={rank}
        total={sheetData.length}
      />
      <WeightingsEditor
        weightings={weightings}
        setWeightings={setWeightings}
        showTopState={showTopState}
        showAboveState={showAboveState}
      />
      <TopWards
        rankings={rankings}
        geoJsonData={geoJsonMap}
        setSelectedWard={setSelectedWard}
      />
    </div>
  );
};
