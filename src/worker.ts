import { IData, Ward } from "./types";
import { WARD_CODE_FIELD } from "./constants";

const ctx: Worker = self as any;

ctx.onmessage = function(message: MessageEvent) {
  const { name } = message.data;
  switch (name) {
    case "geoJsonMap":
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
      return features;
      break;
    default:
      ctx.postMessage({
        name,
        error: "Unrecognised function"
      });
  }
};
