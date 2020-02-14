import { Feature, Polygon } from "geojson";
import { Map as LeafletMap } from "leaflet";
import { Map as ReactLeafletMap } from "react-leaflet";

import { WARD_CODE_FIELD, WARD_NAME_FIELD } from "./constants";

export type ApiResponseValue<T> =
  | {
      status: "error";
      error: Error;
    }
  | {
      status: "loaded";
      data: T;
    }
  | {
      status: "loading";
    }
  | {
      status: "preload";
    };

export class ApiResponse<T> {
  public static preload<T>() {
    return new ApiResponse<T>({ status: "preload" });
  }
  public static loading<T>() {
    return new ApiResponse<T>({ status: "loading" });
  }

  public static error<T>(error: Error) {
    return new ApiResponse<T>({ status: "error", error });
  }

  public static loaded<T>(data: T) {
    return new ApiResponse<T>({ status: "loaded", data });
  }

  private value: ApiResponseValue<T>;

  private constructor(response: ApiResponseValue<T>) {
    this.value = response;
  }

  public data() {
    return this.value.status === "loaded" ? this.value.data : null;
  }

  public error() {
    return this.value.status === "error" ? this.value.error : null;
  }

  public isLoading() {
    return this.value.status === "loading";
  }

  public isPreload() {
    return this.value.status === "preload";
  }

  public load() {
    if (this.value.status === "preload") {
      return ApiResponse.loading<T>();
    } else {
      console.error(
        `Cannot load an ApiResponse in the ${this.value.status} state.`
      );
      return this;
    }
  }

  public resolve(data: T) {
    if (this.value.status === "loading") {
      return ApiResponse.loaded(data);
    } else {
      console.error(
        `Cannot resolve an ApiResponse in the ${this.value.status} state.`
      );
      return this;
    }
  }

  public fail(error: Error): ApiResponse<T> {
    if (this.value.status === "loading") {
      return ApiResponse.error(error);
    } else {
      console.error(
        `Cannot fail an ApiResponse in the ${this.value.status} state.`
      );
      return this;
    }
  }

  public map<U>(mapper: (input: T) => U) {
    if (this.value.status === "loaded") {
      return ApiResponse.loaded<U>(mapper(this.value.data));
    }
    return new ApiResponse<U>(this.value);
  }
}

export type SheetData = Array<Array<number | string>>;

export interface IData {
  [WARD_CODE_FIELD]: string;
  [header: string]: string | number;
}

export interface IWardData {
  [WARD_CODE_FIELD]: string;
  [WARD_NAME_FIELD]: string;
  score: number;
  [s: string]: string | number;
}

export type Ward = Feature<Polygon, IWardData>;

export interface IWeightings {
  [header: string]: {
    weight: number;
    type: ScoreType;
  };
}

export enum ScoreType {
  Value,
  Normalised,
  Rank
}

export type ConvertedGeoJSONData = Map<string, Feature<Polygon, IWardData>>;

export type StatePair<T> = [T, (t: T) => void];

export type MapRef = React.MutableRefObject<
  ReactLeafletMap<any, LeafletMap> | undefined
>;
export type DefinedMapRef = React.MutableRefObject<
  ReactLeafletMap<any, LeafletMap>
>;
