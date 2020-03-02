/* global process */
import * as React from "react";
import { getCsvParser } from "basic-csv-parser";

import { ApiResponse, Ward, SheetData, ConvertedGeoJSONData } from "./types";

const parser = getCsvParser({});

const DATA_PREFIX =
  process.env.NODE_ENV === "development"
    ? "/local-data/"
    : "https://raw.githubusercontent.com/richsilv/ward-stats-app/master/";

export async function getGithubSheetData() {
  return fetch(`${DATA_PREFIX}Ward%20stats%20data.csv`)
    .then(result => result.text())
    .then(parser);
}

export function getGithubGeoJson() {
  return fetch(`${DATA_PREFIX}Ward%20GeoJson%20simplified.json`)
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
