import * as React from "react";
import { IWeightings, ScoreType, StatePair } from "./types";
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
  InputLabel,
  Typography,
  Grid,
  Slider,
  Input,
  Divider
} from "@material-ui/core";
import { useParameterisedCallbacks } from "./hooks";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    drawer: {
      padding: theme.spacing(2)
    },
    entry: {
      display: "flex",
      flexWrap: "nowrap",
      marginBottom: theme.spacing(2)
    },
    sliderInput: {
      width: 60
    }
  })
);

interface IWeightingsProps {
  readonly localWeightings: IWeightings;
  readonly showTopState: StatePair<number | null>;
  readonly showAboveState: StatePair<number | null>;
  readonly setLocalWeightings: (
    weightings: IWeightings | ((currentWeightings: IWeightings) => IWeightings)
  ) => void;
}

export const WeightingsEditor: React.FC<IWeightingsProps> = ({
  localWeightings,
  setLocalWeightings,
  showTopState: [showTop, setShowTop],
  showAboveState: [showAbove, setShowAbove]
}) => {
  const theme = useTheme();
  const classes = useStyles(theme);

  const onChangeWeightArray = useParameterisedCallbacks<
    React.ChangeEvent<HTMLInputElement>
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
    // weightings and localWeightings should have identical keys, and weightings changes less frequently
    [localWeightings, setLocalWeightings]
  );

  const onChangeScoreTypeArray = useParameterisedCallbacks<
    React.ChangeEvent<{ name?: string; value: unknown }>
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
    [localWeightings, setLocalWeightings]
  );

  const handleSliderChange = useParameterisedCallbacks<React.ChangeEvent<any>>(
    ["top", "above"],
    (header, event, value) => {
      const [top, above] =
        header === "top"
          ? [parseFloat(value), null]
          : [null, parseFloat(value)];
      setShowTop(top);
      setShowAbove(above);
    },
    []
  );

  const handleInputChange = useParameterisedCallbacks<
    React.ChangeEvent<HTMLInputElement>
  >(
    ["top", "above"],
    (header, event) => {
      const [top, above] =
        header === "top"
          ? [parseFloat(event.currentTarget.value), null]
          : [null, parseFloat(event.currentTarget.value)];
      setShowTop(top);
      setShowAbove(above);
    },
    []
  );

  return (
    <React.Fragment>
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
        <Divider />
        <Typography id="top-slider" gutterBottom>
          Show top
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Slider
              value={typeof showTop === "number" ? showTop : 0}
              onChange={handleSliderChange.get("top")}
              aria-labelledby="top-slider"
              min={0}
              step={25}
              max={5000}
            />
          </Grid>
          <Grid item>
            <Input
              className={classes.sliderInput}
              value={typeof showTop === "number" ? showTop : 0}
              margin="dense"
              onChange={handleInputChange.get("top")}
              inputProps={{
                step: 25,
                min: 0,
                max: 5000,
                type: "number",
                "aria-labelledby": "top-slider"
              }}
            />
          </Grid>
        </Grid>
        <Typography id="above-slider" gutterBottom>
          Show above
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Slider
              value={typeof showAbove === "number" ? showAbove : 0}
              onChange={handleSliderChange.get("above")}
              aria-labelledby="above-slider"
              min={0}
              max={1}
              step={0.01}
            />
          </Grid>
          <Grid item>
            <Input
              className={classes.sliderInput}
              value={typeof showAbove === "number" ? showAbove : 0}
              margin="dense"
              onChange={handleInputChange.get("above")}
              inputProps={{
                step: 0.01,
                min: 0.0,
                max: 1.0,
                type: "number",
                "aria-labelledby": "above-slider"
              }}
            />
          </Grid>
        </Grid>
      </div>
    </React.Fragment>
  );
};
