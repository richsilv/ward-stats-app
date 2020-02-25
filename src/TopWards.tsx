import * as React from "react";
import { Ward, MapRef, IData } from "./types";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import {
  SwipeableDrawer,
  makeStyles,
  Theme,
  createStyles,
  Fab,
  TableCell,
  Box,
  Link,
  useTheme
} from "@material-ui/core";
import * as L from "leaflet";
import { ListAlt, Close } from "@material-ui/icons";

import { WARD_NAME_FIELD, WARD_CODE_FIELD } from "./constants";
import { useParameterisedCallbacks } from "./hooks";

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

interface IDataWithScore extends IData {
  readonly score: number;
  readonly rank: number;
}

interface ITopWardsProps {
  readonly rankings: Map<string, { score: number; rank: number }> | null;
  readonly sheetData: Map<string, IData>;
  readonly closePane: () => void;
  readonly zoomToWard: (wardCode: string) => void;
}

export const TopWards: React.FC<ITopWardsProps> = ({
  rankings,
  sheetData,
  closePane,
  zoomToWard
}) => {
  const theme = useTheme();
  const classes = useStyles(theme);

  const topWards: Array<IDataWithScore> = React.useMemo(() => {
    const sortedRankings = Array.from(rankings ? rankings.entries() : []).sort(
      ([_, { rank: rankA }], [__, { rank: rankB }]) => {
        return rankA - rankB;
      }
    );
    return sortedRankings.map(([wardCode, { score, rank }]) => {
      const thisWard = sheetData.get(wardCode);
      return { ...thisWard!, score, rank };
    });
  }, [rankings, sheetData]);

  const zoomToWardArray = useParameterisedCallbacks(
    Array.from(sheetData.keys()),
    (wardCode: string) => {
      closePane();
      zoomToWard(wardCode);
    },
    [zoomToWard, closePane]
  );

  return (
    <React.Fragment>
      <Fab
        aria-label="Close top wards"
        className={classes.fab}
        color="default"
        onClick={closePane}
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
                  <Link
                    href="#"
                    onClick={zoomToWardArray.get(ward[WARD_CODE_FIELD])}
                  >
                    {ward[WARD_NAME_FIELD]}
                  </Link>
                </Cell>
                <Cell width={200}>{ward["LA Name"]}</Cell>
                <Cell width={200}>{ward["Region"]}</Cell>
                <Cell width={100}>{Math.round(ward.score * 1000) / 10}%</Cell>
              </Box>
            );
          }}
        </FixedSizeList>
      </Box>
    </React.Fragment>
  );
};
