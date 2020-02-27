import * as React from "react";
import { IData } from "./types";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import {
  makeStyles,
  Theme,
  createStyles,
  Fab,
  TableCell,
  Box,
  Link,
  useTheme
} from "@material-ui/core";
import { Close } from "@material-ui/icons";

import { WARD_NAME_FIELD, WARD_CODE_FIELD } from "./constants";
import { useParameterisedCallbacks, useWindowSize } from "./hooks";

const ROW_HEIGHT = 35;
const COLUMN_WIDTHS = [100, 200, 200, 200, 100];
const TABLE_MIN_WIDTH = COLUMN_WIDTHS.reduce((sum, width) => sum + width, 0);

const Cell: React.FC<{
  width: number;
  height?: number;
  isHeader?: boolean;
}> = ({ width, height, isHeader, children }) => (
  <TableCell
    component="div"
    size="small"
    variant={isHeader ? "head" : "body"}
    style={{
      flexBasis: width,
      flexGrow: 1,
      flexShrink: 0,
      height,
      boxSizing: "border-box"
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

  const { height } = useWindowSize();

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
        <FixedSizeList
          height={height - 80}
          itemCount={topWards.length + 1}
          itemSize={ROW_HEIGHT}
          outerElementType={WithHeader}
          width="100%"
          style={{
            minWidth: TABLE_MIN_WIDTH
          }}
        >
          {({ style, index }: ListChildComponentProps) => {
            const ward = topWards[index];
            return (
              <Box
                className={classes.tableRow}
                style={{
                  ...style,
                  top:
                    typeof style.top === "number"
                      ? style.top + ROW_HEIGHT
                      : style.top
                }}
              >
                <Cell width={COLUMN_WIDTHS[0]}>{ward.rank}.</Cell>
                <Cell width={COLUMN_WIDTHS[1]}>
                  <Link
                    href="#"
                    onClick={zoomToWardArray.get(ward[WARD_CODE_FIELD])}
                  >
                    {ward[WARD_NAME_FIELD]}
                  </Link>
                </Cell>
                <Cell width={COLUMN_WIDTHS[2]}>{ward["LA Name"]}</Cell>
                <Cell width={COLUMN_WIDTHS[3]}>{ward["Region"]}</Cell>
                <Cell width={COLUMN_WIDTHS[4]}>
                  {Math.round(ward.score * 1000) / 10}%
                </Cell>
              </Box>
            );
          }}
        </FixedSizeList>
      </Box>
    </React.Fragment>
  );
};

function WithHeader(props: any) {
  const { children, ...otherProps } = props;
  return (
    <div {...otherProps}>
      <Box
        style={{
          position: "sticky",
          top: -1,
          zIndex: 1,
          minWidth: TABLE_MIN_WIDTH,
          backgroundColor: "white",
          display: "flex",
          width: "100%",
          boxSizing: "border-box",
          height: ROW_HEIGHT,
          alignItems: "center"
        }}
      >
        <Cell isHeader width={COLUMN_WIDTHS[0]} height={ROW_HEIGHT}>
          Rank
        </Cell>
        <Cell isHeader width={COLUMN_WIDTHS[1]} height={ROW_HEIGHT}>
          Ward Name
        </Cell>
        <Cell isHeader width={COLUMN_WIDTHS[2]} height={ROW_HEIGHT}>
          Local Authority
        </Cell>
        <Cell isHeader width={COLUMN_WIDTHS[3]} height={ROW_HEIGHT}>
          Region
        </Cell>
        <Cell isHeader width={COLUMN_WIDTHS[4]} height={ROW_HEIGHT}>
          Score
        </Cell>
      </Box>
      {children}
    </div>
  );
}
