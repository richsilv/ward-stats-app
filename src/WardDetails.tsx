import * as React from "react";

import { Ward, IWeightings } from "./types";
import {
  WARD_NAME_FIELD,
  WARD_CODE_FIELD,
  NORMALISED_EXTENSION_REGEXP,
  RANKING_EXTENSION_REGEXP
} from "./constants";
import { calculateScore } from "./utils";

const IGNORED_FIELDS = [
  "WD11CD",
  "WD11CDO",
  "WD11NM",
  "WD11NMW",
  WARD_CODE_FIELD,
  WARD_NAME_FIELD
];

interface IWardDetailsProps {
  readonly selectedWard: Ward | null;
  readonly score: number;
  readonly rank: number;
  readonly total: number;
}

export const WardDetails: React.FC<IWardDetailsProps> = ({
  selectedWard,
  score,
  rank,
  total
}) => {
  return (
    <div className="ward-details">
      {selectedWard ? (
        <React.Fragment>
          <h1>{selectedWard.properties[WARD_NAME_FIELD]}</h1>
          <p>{selectedWard.properties[WARD_NAME_FIELD]}</p>
          <p>Score: {Math.round(score * 10000) / 100}%</p>
          <p>
            Rank: {rank} of {total}
          </p>
          {Object.keys(selectedWard.properties).map(header =>
            IGNORED_FIELDS.includes(header) ||
            NORMALISED_EXTENSION_REGEXP.test(header) ||
            RANKING_EXTENSION_REGEXP.test(header) ? null : (
              <p key={header}>
                {header}: {selectedWard.properties[header]}
              </p>
            )
          )}
        </React.Fragment>
      ) : null}
    </div>
  );
};
