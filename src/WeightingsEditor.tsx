import * as React from "react";
import { IWeightings, ScoreType } from "./types";

interface IWeightingsProps {
  weightings: IWeightings;
  setWeightings: (weightings: IWeightings) => void;
}

export const WeightingsEditor: React.FC<IWeightingsProps> = ({
  weightings,
  setWeightings
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const onClickToggle = React.useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const onChangeWeightFactory = React.useCallback(
    (header: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setWeightings({
        ...weightings,
        [header]: {
          type: weightings[header].type,
          weight: parseFloat(event.currentTarget.value)
        }
      });
    },
    [weightings]
  );

  const onChangeScoreTypeFactory = React.useCallback(
    (header: string) => (event: React.ChangeEvent<HTMLSelectElement>) => {
      setWeightings({
        ...weightings,
        [header]: {
          weight: weightings[header].weight,
          type: parseInt(event.currentTarget.value, 10) as ScoreType
        }
      });
    },
    [weightings]
  );

  return (
    <div className={`weightings ${isOpen ? "is-open" : ""}`}>
      <div className="toggle" onClick={onClickToggle}>
        {isOpen ? "▼" : "▲"}
      </div>
      <div className="contents">
        {Object.keys(weightings).map(header => {
          const { weight, type } = weightings[header];
          return (
            <div className="weighting" key={header}>
              <label>{header}</label>
              <input
                type="number"
                value={weight || 0}
                onChange={onChangeWeightFactory(header)}
              />
              <label>Normalise ?</label>
              <select onChange={onChangeScoreTypeFactory(header)} value={type}>
                <option value={ScoreType.Value}>Value</option>
                <option value={ScoreType.Normalised}>Normalised</option>
                <option value={ScoreType.Rank}>Rank</option>
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
};
