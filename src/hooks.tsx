/* global gapi */
import * as React from "react";

import { ApiResponse, Ward } from "./types";
import { workerPolyfill } from "./worker-polyfill";
import { Fab, SwipeableDrawer } from "@material-ui/core";

export function useSheetData({
  isSignedIn,
  sheetName,
  range
}: {
  isSignedIn: boolean;
  sheetName: string;
  range: string;
}) {
  const [
    sheetDetails,
    setSheetDetails
  ] = React.useState<gapi.client.drive.File | null>(null);
  const [sheetDataResponse, setSheetDataResponse] = React.useState<
    ApiResponse<Array<Array<number | string>>>
  >(ApiResponse.preload<Array<Array<number | string>>>());

  React.useEffect(() => {
    if (isSignedIn) {
      gapi.client.drive.files
        .list({
          q: `name='${sheetName}'`,
          pageSize: 1,
          fields: "nextPageToken, files(id, name)"
        })
        .then(
          response => {
            setSheetDetails(
              (response.result.files as Array<gapi.client.drive.File>)[0] ||
                null
            );
          },
          err => console.error(err)
        );
    }
  }, [sheetName, isSignedIn]);

  React.useEffect(() => {
    if (sheetDetails && sheetDataResponse.isPreload()) {
      const newSheetDataResponse = sheetDataResponse.load();
      setSheetDataResponse(newSheetDataResponse);
      gapi.client.sheets.spreadsheets.values
        .get({
          spreadsheetId: sheetDetails.id as string,
          range,
          majorDimension: "ROWS",
          valueRenderOption: "UNFORMATTED_VALUE"
        })
        .then(
          response => {
            try {
              if (!response.result.values) {
                throw new Error("No value data returned");
              }
              setSheetDataResponse(
                newSheetDataResponse.resolve(
                  response.result.values as Array<Array<number | string>>
                )
              );
            } catch (err) {
              console.error(err);
            }
          },
          error => setSheetDataResponse(newSheetDataResponse.fail(error))
        );
    }
  }, [isSignedIn, range, sheetDetails, sheetDataResponse]);

  return sheetDataResponse;
}

export function useDriveDocument({
  isSignedIn,
  filename
}: {
  isSignedIn: boolean;
  filename: string;
}) {
  const [
    geoJSONFileDetails,
    setGeoJSONFileDetails
  ] = React.useState<gapi.client.drive.File | null>(null);

  const [geoJSONDataResponse, setGeoJSONDataResponse] = React.useState<
    ApiResponse<GeoJSON.FeatureCollection>
  >(ApiResponse.loading<GeoJSON.FeatureCollection>());

  React.useEffect(() => {
    if (isSignedIn) {
      gapi.client.drive.files
        .list({
          q: `name='${filename}'`,
          pageSize: 1,
          fields: "nextPageToken, files(id, name)"
        })
        .then(
          response => {
            setGeoJSONFileDetails(
              (response.result.files as Array<gapi.client.drive.File>)[0] ||
                null
            );
          },
          err => console.error(err)
        );
    }
  }, [isSignedIn, filename]);

  React.useEffect(() => {
    if (geoJSONFileDetails) {
      gapi.client.drive.files
        .get({
          fileId: geoJSONFileDetails.id as string,
          alt: "media"
        })
        .then(
          response => {
            setGeoJSONDataResponse(
              geoJSONDataResponse.resolve(
                response.result as GeoJSON.FeatureCollection
              )
            );
          },
          error => setGeoJSONDataResponse(geoJSONDataResponse.fail(error))
        );
    }
  }, [geoJSONFileDetails]);

  return geoJSONDataResponse;
}

export function useConvertGeoJSONData(
  response: ApiResponse<GeoJSON.FeatureCollection>
) {
  return React.useMemo(() => {
    const data = response.data();
    const error = response.error();
    if (data) {
      return ApiResponse.loaded(
        new Map(
          data.features.map(
            feature =>
              [(feature.properties as any)["WD11CD"], feature] as [string, Ward]
          )
        )
      );
    } else if (error) {
      return ApiResponse.error<Map<string, Ward>>(error);
    }
    return ApiResponse.loading<Map<string, Ward>>();
  }, [response]);
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
): [R, boolean] {
  const [refreshToken, setRefreshToken] = React.useState({});
  const [maxWaitActive, setMaxWaitActive] = React.useState<boolean>(false);
  const [isWaiting, setIsWaiting] = React.useState(false);
  const debounceTimeout = React.useRef<number | undefined>();
  const maxWaitTimeout = React.useRef<number | undefined>();

  React.useEffect(() => {
    setIsWaiting(true);
    maxWaitTimeout.current = window.setTimeout(() => {
      setIsWaiting(false);
      window.clearInterval(debounceTimeout.current);
      if (maxWaitActive) {
        setRefreshToken({});
        setMaxWaitActive(false);
      }
    }, maxWait);
    return () => {
      setIsWaiting(false);
      window.clearTimeout(maxWaitTimeout.current);
    };
  }, [maxWaitActive, maxWait]);

  React.useEffect(() => {
    setMaxWaitActive(true);
    setIsWaiting(true);
    debounceTimeout.current = window.setTimeout(() => {
      setIsWaiting(false);
      setMaxWaitActive(false);
      setRefreshToken({});
    }, wait);
    return () => {
      setIsWaiting(false);
      window.clearTimeout(debounceTimeout.current);
    };
  }, [...dependencies, wait]);

  React.useEffect(() => {
    setMaxWaitActive(false);
  }, [refreshToken]);

  return React.useMemo((): [R, boolean] => [calc(), isWaiting], [
    refreshToken,
    isWaiting
  ]);
}

export function useLocallyStoredState<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(defaultValue);
  const localStorageKey = `LOCAL_STORAGE_${key}`;

  React.useEffect(() => {
    const encodedState = localStorage.getItem(localStorageKey);
    try {
      if (encodedState) {
        const decodedState = JSON.parse(atob(encodedState));
        setState(decodedState);
      }
    } catch (error) {
      console.error(`Cannot decode stored state for ${key}`);
      console.error(error);
    }
  }, [localStorageKey]);

  React.useEffect(() => {
    localStorage.setItem(localStorageKey, btoa(JSON.stringify(state)));
  }, [localStorageKey, state]);

  return [state, setState];
}

export function useParameterisedCallbacks<E extends React.SyntheticEvent<any>>(
  parameters: Array<string>,
  callback: (parameter: string, event: E, ...args: any) => any,
  deps: React.DependencyList
) {
  const [storedCallbacks, setStoredCallbacks] = React.useState(
    new Map<string, React.EventHandler<E>>()
  );

  React.useEffect(() => {
    setStoredCallbacks(
      new Map<string, React.EventHandler<E>>(
        parameters.map((parameter): [
          string,
          React.EventHandler<React.SyntheticEvent>
        ] => [
          parameter,
          (event: E, ...args: any) => callback(parameter, event, ...args)
        ])
      )
    );
  }, [...parameters, ...deps]);

  return storedCallbacks;
}

export function useWorkerComputation<T>(
  worker: Worker | null,
  name: string,
  ...data: Array<any>
) {
  const [value, setValue] = React.useState<T | null>(null);
  const callback = React.useCallback(
    (event: MessageEvent) => {
      if (event.data.name === name) {
        if (event.data.error) {
          console.error(event.data.error);
        } else {
          setValue(event.data.data);
        }
      }
    },
    [...data, setValue]
  );
  React.useEffect(() => {
    if (!worker) {
      const fn = (workerPolyfill as any)[name];
      return setValue(fn(...data));
    }
    worker.addEventListener("message", callback);
    worker.postMessage({ name, data });
    return () => {
      worker.removeEventListener("message", callback);
    };
  }, [...data, callback]);

  return value;
}
