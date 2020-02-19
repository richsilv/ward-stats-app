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

const useStyles = makeStyles((theme: Theme) => createStyles({}));

interface IRightMoveLinkProps {
  readonly mapRef: React.MutableRefObject<any>;
  readonly onClick: () => void;
}

export const RightMoveLink: React.FC<IRightMoveLinkProps> = ({
  mapRef,
  onClick
}) => {
  const theme = useTheme();
  const classes = useStyles(theme);

  const onClickIcon = React.useCallback(() => {
    if (!mapRef.current) {
      return;
    }
    onClick();
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
  }, [mapRef, onClick]);

  return (
    <Fab aria-label="Edit weightings" color="secondary" onClick={onClickIcon}>
      <House />
    </Fab>
  );
};
