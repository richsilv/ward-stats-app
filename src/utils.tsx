import { IData, IWeightings, ScoreType, MapRef } from "./types";
import {
  NON_COMPARISON_FIELDS,
  NORMALISED_EXTENSION,
  RANKING_EXTENSION
} from "./constants";

export interface INormalisedStats {
  min: number;
  range: number;
}

export function getNormalisedStats(
  dataArray: Array<IData>,
  keys: Array<string>
) {
  const minMax = dataArray.reduce(
    (stats, data) =>
      keys.map((key, index) => ({
        max: Math.max(stats[index].max, data[key] as number),
        min: Math.min(stats[index].min, data[key] as number)
      })),
    keys.map(key => ({ max: -Infinity, min: Infinity }))
  );
  return keys.map((_, index) => ({
    min: minMax[index].min,
    range: minMax[index].max - minMax[index].min
  }));
}

export function normalise(
  data: IData,
  key: string,
  { min, range }: INormalisedStats
) {
  const value = data[key] as number;
  return (value - min) * range;
}

export function addRankings(
  dataArray: Array<IData>,
  keys: Array<string>
): Array<IData> {
  const size = dataArray.length - 1;
  keys.forEach(key => {
    dataArray
      // Rankings should be ASCENDING to maintain the same order of items as
      // for the absolute values (and normalised values)
      .sort((dataA, dataB) => (dataA[key] as number) - (dataB[key] as number))
      .forEach((dataItem, index) => {
        dataItem[`${key}${RANKING_EXTENSION}`] = index / size;
      });
  });
  return dataArray;
}

export function normaliseAll(dataArray: Array<IData>): Array<IData> {
  const keys = Object.keys(dataArray[0]).filter(
    header => !NON_COMPARISON_FIELDS.includes(header)
  );
  addRankings(dataArray, keys);
  const stats = getNormalisedStats(dataArray, keys);
  return dataArray.map(data => ({
    ...data,
    ...keys.reduce(
      (objectSoFar, key, index) => ({
        ...objectSoFar,
        [`${key}${NORMALISED_EXTENSION}`]: normalise(data, key, stats[index])
      }),
      {}
    )
  }));
}

export function csvToObjects(csv: Array<Array<number | string>>) {
  const firstRow = csv[0];
  return csv.slice(1).map(data =>
    firstRow!.reduce((objectSoFar: IData, header, index) => {
      objectSoFar[header] = data[index];
      return objectSoFar;
    }, {} as IData)
  );
}

export function arrayToMap<K extends string, T extends { [k in K]: string }>(
  array: Array<T>,
  key: K
) {
  return new Map(array.map((entry): [string, T] => [entry[key], entry]));
}

export function calculateScore(weightings: IWeightings, properties: IData) {
  return Object.keys(weightings).reduce((scoreSoFar: number, header) => {
    const { weight, type } = weightings[header];
    const headerName =
      type === ScoreType.Normalised
        ? `${header}${NORMALISED_EXTENSION}`
        : type === ScoreType.Rank
        ? `${header}${RANKING_EXTENSION}`
        : header;
    const value = (properties![headerName] as number) || 0;
    return scoreSoFar + weight * value;
  }, 0);
}

export function filterByBounds<T extends { lat: number; lon: number }>(
  items: Array<T>,
  mapRef: MapRef
) {
  if (!mapRef.current) {
    return [];
  }
  const bounds = mapRef.current.leafletElement.getBounds();
  return items.filter(({ lat, lon }) => {
    return bounds.contains([lat, lon]);
  });
}
