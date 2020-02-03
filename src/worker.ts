import { IData, Ward, IWeightings } from "./types";
import { WARD_CODE_FIELD, QUANTUM } from "./constants";
import { calculateScore } from "./utils";

const ctx: Worker = self as any;

ctx.onmessage = function(message: MessageEvent) {
  const { name } = message.data;
  switch (name) {
    case "geoJsonMap": {
      const [sheetData, geoJsonData]: [
        Array<IData>,
        Map<string, Ward>
      ] = message.data.data;
      if (!sheetData || !geoJsonData)
        return ctx.postMessage({
          name,
          data: null
        });
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
      return ctx.postMessage({
        name,
        data: features
      });
    }

    case "scoresMeta": {
      const [geoJsonToRender, weightings]: [
        Array<Ward> | null,
        IWeightings
      ] = message.data.data;
      if (!geoJsonToRender) return ctx.postMessage({ name, data: null });
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
      return ctx.postMessage({
        name,
        data: { minScore, scoreRange: maxScore - minScore + QUANTUM }
      });
    }

    case "rankings": {
      const [sheetData, scoresMeta, weightings]: [
        Array<IData>,
        { minScore: number; scoreRange: number } | null,
        IWeightings
      ] = message.data.data;
      if (!scoresMeta || !weightings)
        return ctx.postMessage({ name, data: null });
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
      return ctx.postMessage({ name, data: rankings });
    }

    default:
      ctx.postMessage({
        name,
        error: "Unrecognised function"
      });
  }
};
