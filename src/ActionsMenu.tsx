import * as React from "react";
import { IWeightings, StatePair, MapRef, IData } from "./types";
import {
  SwipeableDrawer,
  makeStyles,
  Theme,
  createStyles,
  useTheme,
  Backdrop
} from "@material-ui/core";
import { Edit, ListAlt, House, Train } from "@material-ui/icons";
import { WeightingsEditor } from "./WeightingsEditor";
import { TopWards } from "./TopWards";
import { SpeedDial, SpeedDialIcon, SpeedDialAction } from "@material-ui/lab";
import geojsonPolyline from "polyline";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fab: {
      position: "absolute",
      bottom: theme.spacing(2),
      left: theme.spacing(2)
    },
    root: {
      // height: 380,
      transform: "translateZ(0px)",
      flexGrow: 1
    }
  })
);

interface IActionsMenuProps {
  readonly mapRef: MapRef;
  readonly rankings: Map<string, { score: number; rank: number }> | null;
  readonly sheetData: Map<string, IData>;
  readonly weightingsState: StatePair<IWeightings>;
  readonly showTopState: StatePair<number | null>;
  readonly showAboveState: StatePair<number | null>;
  readonly showStationsState: StatePair<boolean>;
  readonly zoomToWard: (wardCode: string) => void;
}

interface IActionMenuState {
  readonly panesOpen: {
    readonly main: boolean;
    readonly weightings: boolean;
    readonly topWards: boolean;
  };
  readonly weightings: IWeightings;
  readonly showTop: number | null;
  readonly showAbove: number | null;
}

type Pane = "main" | "weightings" | "topWards";
type Action =
  | {
      type: "closePanes";
    }
  | {
      type: "closePane";
      pane: Pane;
    }
  | {
      type: "openPane";
      pane: Pane;
    }
  | {
      type: "updateWeightings";
      weightings: IWeightings;
    }
  | {
      type: "updateShowTop";
      showTop: number | null;
    }
  | {
      type: "updateShowAbove";
      showAbove: number | null;
    };

export const ActionsMenu: React.FC<IActionsMenuProps> = ({
  rankings,
  sheetData,
  mapRef,
  weightingsState,
  showTopState,
  showAboveState,
  showStationsState,
  zoomToWard
}) => {
  const theme = useTheme();
  const classes = useStyles(theme);

  const reducer = React.useCallback(
    (state: IActionMenuState, action: Action) => {
      switch (action.type) {
        case "openPane": {
          const updatedState =
            action.pane === "weightings"
              ? {
                  weightings: weightingsState[0],
                  showTop: showTopState[0],
                  showAbove: showAboveState[0]
                }
              : state;
          return {
            ...updatedState,
            panesOpen: {
              main: false,
              weightings: false,
              topWards: false,
              [action.pane]: true
            }
          };
        }
        case "closePane":
          return {
            ...state,
            panesOpen: {
              ...state.panesOpen,
              [action.pane]: false
            }
          };
        case "closePanes":
          return {
            ...state,
            panesOpen: {
              main: false,
              weightings: false,
              topWards: false
            }
          };
        case "updateWeightings":
          return {
            ...state,
            weightings: {
              ...state.weightings,
              ...action.weightings
            }
          };
        case "updateShowTop":
          return {
            ...state,
            showTop: action.showTop
          };
        case "updateShowAbove":
          return {
            ...state,
            showAbove: action.showAbove
          };
        default:
          return state;
      }
    },
    [weightingsState, showTopState, showAboveState]
  );
  const [state, dispatch] = React.useReducer(reducer, {
    weightings: weightingsState[0],
    showTop: showTopState[0],
    showAbove: showAboveState[0],
    panesOpen: {
      main: false,
      weightings: false,
      topWards: false
    }
  });

  const setWeightings = React.useCallback(
    (weightings: IWeightings) => {
      dispatch({ type: "updateWeightings", weightings });
    },
    [dispatch]
  );
  const setShowTop = React.useCallback(
    (showTop: number | null) => {
      dispatch({ type: "updateShowTop", showTop });
    },
    [dispatch]
  );
  const setShowAbove = React.useCallback(
    (showAbove: number | null) => {
      dispatch({ type: "updateShowAbove", showAbove });
    },
    [dispatch]
  );
  const toggleShowStations = React.useCallback(() => {
    showStationsState[1](currentShowStations => !currentShowStations);
  }, [showStationsState]);

  const setOpenFactory = React.useCallback(
    (pane: Pane) => () => {
      dispatch({
        type: "openPane",
        pane
      });
    },
    [dispatch]
  );
  const setClosedFactory = React.useCallback(
    (pane: Pane) => () => {
      dispatch({
        type: "closePane",
        pane
      });
    },
    [dispatch]
  );
  const setClosed = React.useCallback(() => {
    dispatch({
      type: "closePanes"
    });
  }, [dispatch]);

  React.useEffect(() => {
    if (!state.panesOpen.weightings) {
      weightingsState[1](state.weightings);
      showTopState[1](state.showTop);
      showAboveState[1](state.showAbove);
    }
  }, [state.panesOpen.weightings]);

  const openRightmoveLink = React.useCallback(() => {
    if (!mapRef.current) {
      return;
    }
    const bounds: L.LatLngBounds = mapRef.current.leafletElement.getBounds();
    const north = Number(bounds.getNorth().toFixed(5));
    const south = Number(bounds.getSouth().toFixed(5));
    const east = Number(bounds.getEast().toFixed(5));
    const west = Number(bounds.getWest().toFixed(5));
    const polygon = [
      [north, west],
      [north, east],
      [south, east],
      [south, west],
      [north, west]
    ];
    const encoded = geojsonPolyline.encode(polygon);
    window.open(
      `https://www.rightmove.co.uk/property-for-sale/map.html?locationIdentifier=USERDEFINEDAREA%5E%7B%22polylines%22%3A%22${encoded}%22%7D`
    );
  }, [mapRef]);

  const actions = React.useMemo(() => {
    return [
      {
        name: "View data for the top wards",
        icon: <ListAlt />,
        onClick: () => {
          dispatch({ type: "openPane", pane: "topWards" });
        }
      },
      {
        name: "See this area on Rightmove",
        icon: <House />,
        onClick: () => {
          openRightmoveLink();
          dispatch({ type: "closePanes" });
        }
      },
      {
        name: "Edit weightings",
        icon: <Edit />,
        onClick: () => {
          dispatch({ type: "openPane", pane: "weightings" });
        }
      },
      {
        name: `${showStationsState[0] ? "Hide" : "Show"} stations`,
        icon: <Train color={showStationsState[0] ? "primary" : "inherit"} />,
        onClick: toggleShowStations
      }
    ];
  }, [dispatch, openRightmoveLink, showStationsState[0]]);

  return (
    <React.Fragment>
      <Backdrop open={state.panesOpen.main} />
      <SpeedDial
        ariaLabel="SpeedDial tooltip example"
        className={classes.fab}
        icon={<SpeedDialIcon />}
        onOpen={setOpenFactory("main")}
        onClose={setClosedFactory("main")}
        open={state.panesOpen.main}
      >
        {actions.map(action => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            tooltipPlacement="right"
            onClick={action.onClick}
          />
        ))}
      </SpeedDial>
      <SwipeableDrawer
        anchor="left"
        open={state.panesOpen.weightings}
        disableDiscovery
        disableSwipeToOpen
        onOpen={setOpenFactory("weightings")}
        onClose={setClosed}
      >
        <WeightingsEditor
          weightingsState={
            [state.weightings, setWeightings] as StatePair<IWeightings>
          }
          showTopState={[state.showTop, setShowTop] as StatePair<number | null>}
          showAboveState={
            [state.showAbove, setShowAbove] as StatePair<number | null>
          }
        />
      </SwipeableDrawer>
      <SwipeableDrawer
        anchor="top"
        open={state.panesOpen.topWards}
        disableDiscovery
        disableSwipeToOpen
        onOpen={setOpenFactory("topWards")}
        onClose={setClosed}
      >
        <TopWards
          rankings={rankings}
          sheetData={sheetData}
          zoomToWard={zoomToWard}
          closePane={setClosed}
        />
      </SwipeableDrawer>
    </React.Fragment>
  );
};
