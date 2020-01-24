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
import { useParameterisedCallbacks } from "./hooks";

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

  const wasOpen = React.useRef(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [localWeightings, setLocalWeightings] = React.useState<IWeightings>(
    weightings
  );

  React.useEffect(() => {
    if (isOpen && !wasOpen.current) {
      setLocalWeightings(weightings);
    }
  }, [isOpen, wasOpen, weightings]);

  React.useEffect(() => {
    if (wasOpen && !isOpen) {
      setWeightings(localWeightings);
    }
  }, [isOpen, wasOpen, localWeightings]);

  React.useEffect(() => {
    wasOpen.current = isOpen;
  }, [isOpen, wasOpen]);

  const onClickToggle = React.useCallback(() => {
    setIsOpen(currentIsOpen => !currentIsOpen);
  }, []);

  const onChangeWeightArray = useParameterisedCallbacks<
    React.ChangeEvent<HTMLInputElement>,
    (header: string, event: React.ChangeEvent<HTMLInputElement>) => any
  >(
    Object.keys(localWeightings),
    (header, event) => {
      const value = event.currentTarget.value;
      setLocalWeightings(currentLocalWeightings => ({
        ...currentLocalWeightings,
        [header]: {
          type: currentLocalWeightings[header].type,
          weight: parseFloat(value)
        }
      }));
    },
    []
  );

  const onChangeScoreTypeArray = useParameterisedCallbacks<
    React.ChangeEvent<{ name?: string; value: unknown }>,
    (
      header: string,
      event: React.ChangeEvent<{ name?: string; value: unknown }>
    ) => any
  >(
    Object.keys(localWeightings),
    (header, event) => {
      const value = event.currentTarget.value;
      setLocalWeightings(currentLocalWeightings => ({
        ...currentLocalWeightings,
        [header]: {
          weight: currentLocalWeightings[header].weight,
          type: parseInt(value as string, 10) as ScoreType
        }
      }));
    },
    []
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
                    inputMode: "numeric"
                  }}
                  type="number"
                  onChange={onChangeWeightArray.get(header)}
                />
                <FormControl>
                  <InputLabel>&nbsp;</InputLabel>
                  <Select
                    native
                    onChange={onChangeScoreTypeArray.get(header)}
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
