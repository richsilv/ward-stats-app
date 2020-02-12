import * as React from "react";
import { Ward, IWeightings, StatePair, MapRef } from "./types";
import {
  SwipeableDrawer,
  makeStyles,
  Theme,
  createStyles,
  Fab,
  useTheme,
  Paper
} from "@material-ui/core";
import { Close, Menu, Edit, ListAlt } from "@material-ui/icons";
import { WeightingsEditor } from "./WeightingsEditor";
import { RightMoveLink } from "./RightMoveLink";
import { TopWards } from "./TopWards";
import { useDrawerToggle } from "./hooks";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fab: {
      position: "absolute",
      bottom: theme.spacing(2),
      left: theme.spacing(2)
    },
    close: {
      position: "absolute",
      top: theme.spacing(2),
      right: theme.spacing(2)
    },
    root: {
      padding: theme.spacing(2),
      "& > *": {
        display: "inline-flex",
        marginLeft: theme.spacing(2)
      }
    }
  })
);

interface IActionsMenuProps {
  readonly mapRef: MapRef;
  readonly rankings: Map<string, { score: number; rank: number }> | null;
  readonly geoJsonMap: Map<string, Ward> | null;
  readonly weightings: IWeightings;
  readonly showTopState: StatePair<number | null>;
  readonly showAboveState: StatePair<number | null>;
  readonly setWeightings: (weightings: IWeightings) => void;
  readonly setSelectedWard: (ward: Ward | null) => void;
}

export const ActionsMenu: React.FC<IActionsMenuProps> = ({
  rankings,
  geoJsonMap,
  mapRef,
  weightings,
  showTopState,
  showAboveState,
  setWeightings,
  setSelectedWard
}) => {
  const theme = useTheme();
  const classes = useStyles(theme);
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleOpen = React.useCallback(() => {
    setIsOpen(_isOpen => !_isOpen);
  }, [setIsOpen]);

  const [weightingsFab, weightingsDrawer] = useDrawerToggle({
    icon: <Edit />,
    anchor: "left",
    Contents: ({ isOpen }) => (
      <WeightingsEditor
        isOpen={isOpen}
        weightings={weightings}
        setWeightings={setWeightings}
        showTopState={showTopState}
        showAboveState={showAboveState}
      />
    ),
    callbacks: {
      onOpen: toggleOpen
    }
  });
  const [topWardsFab, topWardsDrawer] = useDrawerToggle({
    icon: <ListAlt />,
    anchor: "top",
    Contents: ({ toggleOpen: toggleTopWardsOpen }) => (
      <TopWards
        rankings={rankings}
        geoJsonMap={geoJsonMap}
        mapRef={mapRef}
        setSelectedWard={setSelectedWard}
        toggleOpen={toggleTopWardsOpen}
      />
    ),
    callbacks: {
      onOpen: toggleOpen
    }
  });

  const drawerContents = (
    <Paper className={classes.root}>
      {weightingsFab}
      {topWardsFab}
      <RightMoveLink mapRef={mapRef} onClick={toggleOpen} />
      <Fab
        aria-label="Close menu"
        className={classes.close}
        color="default"
        onClick={toggleOpen}
      >
        <Close />
      </Fab>
    </Paper>
  );

  return (
    <React.Fragment>
      <Fab
        aria-label="Actions menu"
        className={classes.fab}
        color="primary"
        onClick={toggleOpen}
      >
        <Menu />
      </Fab>
      <SwipeableDrawer
        anchor="bottom"
        open={isOpen}
        onClose={toggleOpen}
        onOpen={toggleOpen}
      >
        {drawerContents}
      </SwipeableDrawer>
      {weightingsDrawer}
      {topWardsDrawer}
    </React.Fragment>
  );
};
