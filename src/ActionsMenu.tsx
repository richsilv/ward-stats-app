import * as React from "react";
import { Ward, IWeightings, StatePair, MapRef, IData } from "./types";
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
  readonly sheetData: Map<string, IData>;
  readonly weightings: IWeightings;
  readonly showTopState: StatePair<number | null>;
  readonly showAboveState: StatePair<number | null>;
  readonly setWeightings: (weightings: IWeightings) => void;
  readonly zoomToWard: (wardCode: string) => void;
}

export const ActionsMenu: React.FC<IActionsMenuProps> = ({
  rankings,
  sheetData,
  mapRef,
  weightings,
  showTopState,
  showAboveState,
  setWeightings,
  zoomToWard
}) => {
  const theme = useTheme();
  const classes = useStyles(theme);
  const [isOpen, setIsOpen] = React.useState(false);
  const [localWeightings, setLocalWeightings] = React.useState(weightings);

  const toggleOpen = React.useCallback(() => {
    setIsOpen(_isOpen => !_isOpen);
  }, [setIsOpen]);

  const onOpenWeightingsEditor = React.useCallback(() => {
    toggleOpen();
    setLocalWeightings(weightings);
  }, [toggleOpen, weightings]);

  const onCloseWeightingsEditor = React.useCallback(() => {
    setWeightings(localWeightings);
  }, [localWeightings]);

  const [weightingsFab, weightingsDrawer] = useDrawerToggle({
    icon: <Edit />,
    anchor: "left",
    Contents: ({ isOpen }) => (
      <WeightingsEditor
        localWeightings={localWeightings}
        setLocalWeightings={setLocalWeightings}
        showTopState={showTopState}
        showAboveState={showAboveState}
      />
    ),
    callbacks: {
      onOpen: onOpenWeightingsEditor,
      onClose: onCloseWeightingsEditor
    }
  });
  const [topWardsFab, topWardsDrawer] = useDrawerToggle({
    icon: <ListAlt />,
    anchor: "top",
    Contents: ({ toggleOpen: toggleTopWardsOpen }) => (
      <TopWards
        rankings={rankings}
        sheetData={sheetData}
        zoomToWard={zoomToWard}
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
