/* global gapi */
import * as React from "react";
import { getCsvParser } from "basic-csv-parser";

import { ApiResponse, Ward, SheetData, ConvertedGeoJSONData } from "./types";

const parser = getCsvParser({});

export async function getSheetData({
  sheetName,
  range
}: {
  sheetName: string;
  range: string;
}) {
  const sheetDetails: any = await new Promise((resolve, reject) =>
    gapi.client.drive.files
      .list({
        q: `name='${sheetName}'`,
        pageSize: 1,
        fields: "nextPageToken, files(id, name)"
      })
      .then(
        response =>
          resolve(
            (response.result.files as Array<gapi.client.drive.File>)[0] || null
          ),
        error => {
          reject(error);
        }
      )
  );
  if (!sheetDetails) {
    throw new Error("Cannot find sheet.");
  }
  const sheetData = await new Promise<SheetData>((resolve, reject) =>
    gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: sheetDetails.id as string,
        range,
        majorDimension: "ROWS",
        valueRenderOption: "UNFORMATTED_VALUE"
      })
      .then(
        response => {
          if (!response.result.values) {
            return reject("No value data returned.");
          }
          resolve(response.result.values as Array<Array<number | string>>);
        },
        error => {
          reject(error);
        }
      )
  );
  return sheetData;
}

export async function getGithubSheetData() {
  return fetch(
    "https://raw.githubusercontent.com/richsilv/ward-stats-app/master/Ward%20stats%20data.csv"
  )
    .then(result => result.text())
    .then(parser);
}

export async function getDriveDocument<T>({ filename }: { filename: string }) {
  const geoJSONFileDetails: any = await new Promise((resolve, reject) =>
    gapi.client.drive.files
      .list({
        q: `name='${filename}'`,
        pageSize: 1,
        fields: "nextPageToken, files(id, name)"
      })
      .then(
        response => {
          resolve(
            (response.result.files as Array<gapi.client.drive.File>)[0] || null
          );
        },
        error => {
          reject(error);
        }
      )
  );

  if (!geoJSONFileDetails) {
    throw new Error("Cannot find document.");
  }

  const geoJSONDataResponse = await new Promise((resolve, reject) =>
    gapi.client.drive.files
      .get({
        fileId: geoJSONFileDetails.id as string,
        alt: "media"
      })
      .then(
        response => resolve(response.result as GeoJSON.FeatureCollection),
        error => {
          reject(error);
        }
      )
  );

  return geoJSONDataResponse as T;
}

export function getGithubGeoJson() {
  return fetch(
    "https://raw.githubusercontent.com/richsilv/ward-stats-app/master/Ward%20GeoJson%20simplified.json"
  )
    .then(result => result.text())
    .then(text => JSON.parse(text));
}

export async function convertGeoJSONData(
  response: GeoJSON.FeatureCollection
): Promise<ConvertedGeoJSONData> {
  return Promise.resolve(
    new Map(
      response.features.map(
        feature =>
          [(feature.properties as any)["WD11CD"], feature] as [string, Ward]
      )
    )
  );
}

export function useFileUploadButton<D>(
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>
) {
  const [response, setResponse] = React.useState<ApiResponse<D>>(
    ApiResponse.loading<D>()
  );
  const fileReader = React.useMemo(() => {
    const reader = new FileReader();
    reader.onloadend = event => {
      setResponse(
        ApiResponse.loaded<D>(JSON.parse(reader.result as string) as D)
      );
    };
    return reader;
  }, [setResponse]);

  const onChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = (event.target.files as FileList)[0];
      fileReader.readAsText(file);
    },
    [fileReader]
  );
  return [
    {
      ref: fileInputRef,
      onChange
    },
    response
  ] as [
    {
      ref: React.MutableRefObject<HTMLInputElement>;
      onChange: React.ChangeEventHandler;
    },
    ApiResponse<D>
  ];
}

export function useDebouncedCallback<
  C extends (...args: Array<any>) => any,
  D extends Array<any>
>(callback: C, dependencies: D, wait: number, maxWait: number): C {
  const [refreshToken, setRefreshToken] = React.useState({});
  const [maxWaitActive, setMaxWaitActive] = React.useState<boolean>(false);
  const debounceTimeout = React.useRef<number | undefined>();
  const maxWaitTimeout = React.useRef<number | undefined>();

  React.useEffect(() => {
    maxWaitTimeout.current = window.setTimeout(() => {
      window.clearInterval(debounceTimeout.current);
      if (maxWaitActive) {
        setRefreshToken({});
        setMaxWaitActive(false);
      }
    }, maxWait);
    return () => window.clearTimeout(maxWaitTimeout.current);
  }, [maxWaitActive, maxWait]);

  React.useEffect(() => {
    setMaxWaitActive(true);
    debounceTimeout.current = window.setTimeout(() => {
      setMaxWaitActive(false);
      setRefreshToken({});
    }, wait);
    return () => window.clearTimeout(debounceTimeout.current);
  }, [...dependencies, wait]);

  React.useEffect(() => {
    setMaxWaitActive(false);
  }, [refreshToken]);

  return React.useCallback<C>(callback, [refreshToken]);
}

export function useDebounce<A extends Array<any>, R, D extends Array<any>>(
  calc: () => R,
  dependencies: D,
  wait: number,
  maxWait: number
): R {
  const [refreshToken, setRefreshToken] = React.useState({});
  const [maxWaitActive, setMaxWaitActive] = React.useState<boolean>(false);
  const debounceTimeout = React.useRef<number | undefined>();
  const maxWaitTimeout = React.useRef<number | undefined>();

  React.useEffect(() => {
    maxWaitTimeout.current = window.setTimeout(() => {
      window.clearInterval(debounceTimeout.current);
      if (maxWaitActive) {
        setRefreshToken({});
        setMaxWaitActive(false);
      }
    }, maxWait);
    return () => window.clearTimeout(maxWaitTimeout.current);
  }, [maxWaitActive, maxWait]);

  React.useEffect(() => {
    setMaxWaitActive(true);
    debounceTimeout.current = window.setTimeout(() => {
      setMaxWaitActive(false);
      setRefreshToken({});
    }, wait);
    return () => window.clearTimeout(debounceTimeout.current);
  }, [...dependencies, wait]);

  React.useEffect(() => {
    setMaxWaitActive(false);
  }, [refreshToken]);

  return React.useMemo(() => calc(), [refreshToken]);
}
