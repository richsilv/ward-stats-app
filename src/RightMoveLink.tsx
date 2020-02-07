import * as React from "react";

import {
  makeStyles,
  Theme,
  createStyles,
  useTheme,
  Fab
} from "@material-ui/core";
import { House } from "@material-ui/icons";

import geojsonPolyline from "polyline";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fab: {
      position: "absolute",
      top: theme.spacing(2),
      left: theme.spacing(15)
    }
  })
);

interface IRightMoveLinkProps {
  readonly mapRef: React.MutableRefObject<any>;
}

export const RightMoveLink: React.FC<IRightMoveLinkProps> = ({ mapRef }) => {
  const theme = useTheme();
  const classes = useStyles(theme);

  const onClick = React.useCallback(() => {
    if (!mapRef.current) {
      return;
    }
    const bounds: L.LatLngBounds = mapRef.current.leafletElement.getBounds();
    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();
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

  return (
    <Fab
      aria-label="Edit weightings"
      className={classes.fab}
      color="secondary"
      onClick={onClick}
    >
      <House />
    </Fab>
  );
};
