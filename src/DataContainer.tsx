import * as React from "react";

import { MapContainer } from "./MapContainer";
import { WardDetails } from "./WardDetails";
import { WeightingsEditor } from "./WeightingsEditor";
import { Ward, IWeightings, IData } from "./types";
import { useDebounce } from "./hooks";
import { WARD_CODE_FIELD, QUANTUM } from "./constants";
import { calculateScore } from "./utils";

interface IDataContainerProps {
  sheetData: Array<IData>;
  geoJSONData: Map<string, Ward>;
  weightings: IWeightings;
  selectedWard: Ward | null;
  setSelectedWard: (ward: Ward | null) => void;
  setWeightings: (weightings: IWeightings) => void;
}

export const DataContainer: React.FC<IDataContainerProps> = ({
  sheetData,
  geoJSONData,
  weightings,
  selectedWard,
  setSelectedWard,
  setWeightings
}) => {
  const geoJSONToRender = React.useMemo(() => {
    if (!sheetData || !geoJSONData) return null;
    const features: Array<Ward> = sheetData.map(data => {
      const wardCode = data[WARD_CODE_FIELD] as string;
      const feature = geoJSONData.get(wardCode);
      return {
        ...feature!,
        properties: { ...feature!.properties, ...data }
      };
    });
    return features;
  }, [sheetData, geoJSONData]);

  const { minScore, scoreRange } = useDebounce(
    () => {
      if (!geoJSONToRender) return { minScore: 0, scoreRange: QUANTUM };
      const { minScore, maxScore } = geoJSONToRender.reduce(
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
    },
    [geoJSONToRender, weightings],
    2000,
    5000
  );

  const rankings = useDebounce(
    () => {
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
    },
    [weightings, sheetData, minScore, scoreRange],
    2000,
    5000
  );

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
        minScore={minScore}
        scoreRange={scoreRange}
        geoJSONToRender={geoJSONToRender}
        setSelectedWard={setSelectedWard}
      />
      <WardDetails
        selectedWard={selectedWard}
        score={score}
        rank={rank}
        total={sheetData.length}
      />
      <WeightingsEditor weightings={weightings} setWeightings={setWeightings} />
    </div>
  );
};
