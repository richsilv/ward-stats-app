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
    (header: string) => (
      event: React.ChangeEvent<{ name?: string; value: unknown }>
    ) => {
      setWeightings({
        ...weightings,
        [header]: {
          weight: weightings[header].weight,
          type: parseInt(event.currentTarget.value as string, 10) as ScoreType
        }
      });
    },
    [weightings]
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
          {Object.keys(weightings).map(header => {
            const { weight, type } = weightings[header];
            return (
              <div className={classes.entry} key={header}>
                <TextField
                  label={header}
                  value={weight || 0}
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
