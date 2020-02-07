import { IData, Ward, IWeightings } from "./types";
import { WARD_CODE_FIELD, QUANTUM } from "./constants";
import { calculateScore } from "./utils";

const geoJsonMap = (
  sheetData: Array<IData>,
  geoJsonData: Map<string, Ward>
) => {
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
};

const scoresMeta = (
  geoJsonToRender: Array<Ward> | null,
  weightings: IWeightings
) => {
  if (!geoJsonToRender) return null;
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
};

const rankings = (
  sheetData: Array<IData>,
  scoresMeta: { minScore: number; scoreRange: number } | null,
  weightings: IWeightings
) => {
  if (!scoresMeta || !weightings) return null;
  const rankings = new Map(
    sheetData
      .map((dataItem): [string, number] => [
        dataItem[WARD_CODE_FIELD] as string,
        (calculateScore(weightings, dataItem) - scoresMeta.minScore) /
          scoresMeta.scoreRange
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
  return rankings;
};

export const workerPolyfill = {
  geoJsonMap,
  scoresMeta,
  rankings
};
