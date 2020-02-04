import * as React from "react";
import { Ward } from "./types";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import {
  SwipeableDrawer,
  makeStyles,
  Theme,
  createStyles,
  Fab,
  TableCell,
  Box,
  Link
} from "@material-ui/core";
import * as L from "leaflet";
import { ListAlt, Close } from "@material-ui/icons";

import { WARD_CODE_FIELD, WARD_NAME_FIELD } from "./constants";

const ROW_HEIGHT = 35;

const Cell: React.FC<{ width: number; isHeader?: boolean }> = ({
  width,
  isHeader,
  children
}) => (
  <TableCell
    component="div"
    size="small"
    variant={isHeader ? "head" : "body"}
    style={{
      flexBasis: width,
      flexGrow: 1,
      flexShrink: 0
    }}
  >
    {children}
  </TableCell>
);

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fab: {
      position: "absolute",
      top: theme.spacing(2),
      left: theme.spacing(2)
    },
    fabPushed: {
      left: theme.spacing(7)
    },
    drawer: {
      padding: theme.spacing(2)
    },
    table: {
      marginTop: theme.spacing(10)
    },
    tableHead: {
      display: "flex",
      width: "100%",
      paddingRight: 15,
      boxSizing: "border-box"
    },
    tableRow: {
      display: "flex",
      width: "100%"
    }
  })
);

interface IWardWithScore extends Ward {
  readonly score: number;
  readonly rank: number;
}

interface ITopWardsProps {
  readonly mapRef: React.MutableRefObject<any>;
  readonly rankings: Map<string, { score: number; rank: number }>;
  readonly geoJsonData: Map<string, Ward> | null;
  readonly setSelectedWard: (ward: Ward | null) => void;
}

export const TopWards: React.FC<ITopWardsProps> = ({
  rankings,
  geoJsonData,
  mapRef,
  setSelectedWard
}) => {
  const classes = useStyles();
  const [isOpen, setIsOpen] = React.useState(false);

  const topWards: Array<IWardWithScore> = React.useMemo(() => {
    if (!geoJsonData) return [];

    const sortedRankings = Array.from(rankings.entries()).sort(
      ([_, { rank: rankA }], [__, { rank: rankB }]) => {
        return rankA - rankB;
      }
    );
    return sortedRankings.map(([wardCode, { score, rank }]) => {
      const thisWard = geoJsonData.get(wardCode);
      return { ...thisWard!, score, rank };
    });
  }, [rankings, geoJsonData]);

  const onClickToggle = React.useCallback(() => {
    setIsOpen(currentIsOpen => !currentIsOpen);
  }, []);

  const zoomToWardFactory = React.useCallback(
    (ward: Ward) => () => {
      setSelectedWard(ward);
      setIsOpen(false);
      if (mapRef.current) {
        mapRef.current.leafletElement.fitBounds(L.geoJSON(ward).getBounds(), {
          maxZoom: 14
        });
      }
    },
    [setSelectedWard, setIsOpen]
  );

  return (
    <React.Fragment>
      <Fab
        aria-label="View top wards"
        className={`${classes.fab} ${classes.fabPushed}`}
        color="primary"
        onClick={onClickToggle}
      >
        <ListAlt />
      </Fab>
      <SwipeableDrawer
        anchor="top"
        open={isOpen}
        onClose={onClickToggle}
        onOpen={onClickToggle}
      >
        <Fab
          aria-label="Close top wards"
          className={classes.fab}
          color="default"
          onClick={onClickToggle}
        >
          <Close />
        </Fab>
        <Box className={classes.table}>
          <Box className={classes.tableHead}>
            <Cell isHeader width={100}>
              Rank
            </Cell>
            <Cell isHeader width={200}>
              Ward Name
            </Cell>
            <Cell isHeader width={200}>
              Local Authority
            </Cell>
            <Cell isHeader width={200}>
              Region
            </Cell>
            <Cell isHeader width={100}>
              Score
            </Cell>
          </Box>
          <FixedSizeList
            height={525}
            itemCount={topWards.length}
            itemSize={ROW_HEIGHT}
            width="100%"
          >
            {({ style, index }: ListChildComponentProps) => {
              const ward = topWards[index];
              return (
                <Box className={classes.tableRow} style={style}>
                  <Cell width={100}>{ward.rank}.</Cell>
                  <Cell width={200}>
                    <Link href="#" onClick={zoomToWardFactory(ward)}>
                      {ward.properties[WARD_NAME_FIELD]}
                    </Link>
                  </Cell>
                  <Cell width={200}>{ward.properties["LA Name"]}</Cell>
                  <Cell width={200}>{ward.properties["Region"]}</Cell>
                  <Cell width={100}>{Math.round(ward.score * 1000) / 10}%</Cell>
                </Box>
              );
            }}
          </FixedSizeList>
        </Box>
      </SwipeableDrawer>
    </React.Fragment>
  );
};
