import * as React from "react";
import { Ward } from "./types";
import {
  SwipeableDrawer,
  makeStyles,
  Theme,
  createStyles,
  Fab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from "@material-ui/core";
import { ListAlt, Close } from "@material-ui/icons";
import { WARD_CODE_FIELD, WARD_NAME_FIELD } from "./constants";

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
    }
  })
);

interface IWardWithScore extends Ward {
  readonly score: number;
  readonly rank: number;
}

interface ITopWardsProps {
  readonly rankings: Map<string, { score: number; rank: number }>;
  readonly geoJsonData: Map<string, Ward> | null;
  readonly setSelectedWard: (ward: Ward | null) => void;
}

export const TopWards: React.FC<ITopWardsProps> = ({
  rankings,
  geoJsonData,
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
        <Table
          className={classes.table}
          size="small"
          aria-label="a dense table"
        >
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Ward Name</TableCell>
              <TableCell>Local Authority</TableCell>
              <TableCell>Region</TableCell>
              <TableCell align="right">Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topWards.slice(0, 50).map(ward => (
              <TableRow key={ward.properties[WARD_CODE_FIELD]}>
                <TableCell>{ward.rank}</TableCell>
                <TableCell component="th" scope="row">
                  {ward.properties[WARD_NAME_FIELD]}
                </TableCell>
                <TableCell>{ward.properties["LA Name"]}</TableCell>
                <TableCell>{ward.properties["Region"]}</TableCell>
                <TableCell align="right">
                  {Math.round(ward.score * 1000) / 10}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SwipeableDrawer>
    </React.Fragment>
  );
};
