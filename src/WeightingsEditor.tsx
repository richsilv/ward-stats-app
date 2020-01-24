import * as React from "react";
import { IWeightings, ScoreType } from "./types";
import {
  SwipeableDrawer,
  makeStyles,
  Theme,
  useTheme,
  Fab,
  createStyles,
  FormControl,
  Select,
  TextField,
  InputLabel
} from "@material-ui/core";
import { Edit } from "@material-ui/icons";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fab: {
      position: "absolute",
      bottom: theme.spacing(2),
      left: theme.spacing(2)
    },
    drawer: {
      padding: theme.spacing(2)
    },
    entry: {
      display: "flex",
      flexWrap: "nowrap",
      marginBottom: theme.spacing(2)
    }
  })
);

interface IWeightingsProps {
  weightings: IWeightings;
  setWeightings: (weightings: IWeightings) => void;
}

export const WeightingsEditor: React.FC<IWeightingsProps> = ({
  weightings,
  setWeightings
}) => {
  const theme = useTheme();
  const classes = useStyles(theme);

  const [isOpen, setIsOpen] = React.useState(false);
  const [localWeightings, setLocalWeightings] = React.useState<IWeightings>(
    weightings
  );

  React.useEffect(() => {
    if (!isOpen) {
      setLocalWeightings(weightings);
    }
  }, [isOpen, weightings]);

  const onClickToggle = React.useCallback(() => {
    if (isOpen) {
      setWeightings(localWeightings);
    }
    setIsOpen(!isOpen);
  }, [isOpen, setWeightings, localWeightings]);

  const onChangeWeightFactory = React.useCallback(
    (header: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setLocalWeightings({
        ...localWeightings,
        [header]: {
          type: localWeightings[header].type,
          weight: parseFloat(event.currentTarget.value)
        }
      });
    },
    [localWeightings]
  );

  const onChangeScoreTypeFactory = React.useCallback(
    (header: string) => (
      event: React.ChangeEvent<{ name?: string; value: unknown }>
    ) => {
      setLocalWeightings({
        ...localWeightings,
        [header]: {
          weight: localWeightings[header].weight,
          type: parseInt(event.currentTarget.value as string, 10) as ScoreType
        }
      });
    },
    [localWeightings]
  );

  return (
    <React.Fragment>
      <Fab
        aria-label="Edit weightings"
        className={classes.fab}
        color="primary"
        onClick={onClickToggle}
      >
        <Edit />
      </Fab>
      <SwipeableDrawer
        open={isOpen}
        onClose={onClickToggle}
        onOpen={onClickToggle}
      >
        <div className={classes.drawer}>
          {Object.keys(localWeightings).map(header => {
            const { weight, type } = localWeightings[header];
            return (
              <div className={classes.entry} key={header}>
                <TextField
                  label={header}
                  value={weight || 0}
                  inputProps={{
                    step: 0.5,
                    type: "number",
                    inputmode: "numeric"
                  }}
                  type="number"
                  onChange={onChangeWeightFactory(header)}
                />
                <FormControl>
                  <InputLabel>&nbsp;</InputLabel>
                  <Select
                    native
                    onChange={onChangeScoreTypeFactory(header)}
                    value={type}
                  >
                    <option value={ScoreType.Value}>Value</option>
                    <option value={ScoreType.Normalised}>Normalised</option>
                    <option value={ScoreType.Rank}>Rank</option>
                  </Select>
                </FormControl>
              </div>
            );
          })}
        </div>
      </SwipeableDrawer>
    </React.Fragment>
  );
};
