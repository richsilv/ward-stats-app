import * as React from "react";
import { Ward } from "./types";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import {
  SwipeableDrawer,
  makeStyles,
  Theme,
  createStyles,
  Fab,
  TableCell
} from "@material-ui/core";
import { ListAlt, Close } from "@material-ui/icons";
import { WARD_CODE_FIELD, WARD_NAME_FIELD } from "./constants";

const ROW_HEIGHT = 35;

const Cell: React.FC<{ width: number }> = ({ width, children }) => (
  <TableCell
    component="div"
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
      width: "100%"
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
        <div className={classes.table}>
          <div className={classes.tableHead}>
            <Cell width={100}>Rank</Cell>
            <Cell width={200}>Ward Name</Cell>
            <Cell width={200}>Local Authority</Cell>
            <Cell width={200}>Region</Cell>
            <Cell width={100}>Score</Cell>
          </div>
          <FixedSizeList
            height={500}
            itemCount={topWards.length}
            itemSize={ROW_HEIGHT}
            width="100%"
          >
            {({ style, index }: ListChildComponentProps) => {
              const ward = topWards[index];
              return (
                <div className={classes.tableRow} style={style}>
                  <Cell width={100}>{ward.rank}</Cell>
                  <Cell width={200}>
                    <a href="#" onClick={zoomToWardFactory(ward)}>
                      {ward.properties[WARD_NAME_FIELD]}
                    </a>
                  </Cell>
                  <Cell width={200}>{ward.properties["LA Name"]}</Cell>
                  <Cell width={200}>{ward.properties["Region"]}</Cell>
                  <Cell width={100}>{Math.round(ward.score * 1000) / 10}%</Cell>
                </div>
              );
            }}
          </FixedSizeList>
        </div>
      </SwipeableDrawer>
    </React.Fragment>
  );
};
