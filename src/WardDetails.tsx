import * as React from "react";

import { Ward, IData } from "./types";
import {
  WARD_NAME_FIELD,
  WARD_CODE_FIELD,
  NORMALISED_EXTENSION_REGEXP,
  RANKING_EXTENSION_REGEXP,
  RANKING_EXTENSION
} from "./constants";
import {
  SwipeableDrawer,
  Typography,
  makeStyles,
  Theme,
  createStyles,
  useTheme
} from "@material-ui/core";

const IGNORED_FIELDS = [
  "WD11CD",
  "WD11CDO",
  "WD11NM",
  "WD11NMW",
  WARD_CODE_FIELD,
  WARD_NAME_FIELD
];

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    drawerContainer: {
      maxWidth: "100%"
    },
    drawer: {
      padding: theme.spacing(2),
      maxWidth: "100%",
      overflowX: "scroll",
      boxSizing: "border-box"
    }
  })
);

interface IWardDetailsProps {
  readonly selectedWardDetails: IData | null;
  readonly score: number;
  readonly rank: number;
  readonly total: number;
  readonly setSelectedWard: (ward: string | null) => void;
}

export const WardDetails: React.FC<IWardDetailsProps> = ({
  selectedWardDetails,
  score,
  rank,
  total,
  setSelectedWard
}) => {
  const theme = useTheme();
  const classes = useStyles(theme);

  const [isOpen, setIsOpen] = React.useState(false);

  const onSwipeFactory = React.useCallback(
    (ward: string | null) => () => {
      setIsOpen(!!ward);
      window.setTimeout(() => {
        setSelectedWard(ward);
      }, 250);
    },
    []
  );

  React.useEffect(() => {
    if (selectedWardDetails) {
      setIsOpen(true);
    }
  }, [selectedWardDetails, setIsOpen]);

  const content = selectedWardDetails ? (
    <React.Fragment>
      <Typography variant="h2" component="h1">
        {selectedWardDetails[WARD_NAME_FIELD]}
      </Typography>
      <Typography>{selectedWardDetails[WARD_NAME_FIELD]}</Typography>
      <Typography>Score: {Math.round(score * 10000) / 100}%</Typography>
      <Typography>
        Rank: {rank} of {total}
      </Typography>
      {Object.keys(selectedWardDetails).map(header => {
        if (
          IGNORED_FIELDS.includes(header) ||
          NORMALISED_EXTENSION_REGEXP.test(header) ||
          RANKING_EXTENSION_REGEXP.test(header)
        ) {
          return null;
        }
        const rankBase = selectedWardDetails[`${header}${RANKING_EXTENSION}`];
        const rankTerm =
          typeof rankBase === "number"
            ? ` (${Math.round((1 - rankBase) * total) + 1}
          / ${total})`
            : "";
        return (
          <Typography key={header}>
            {header}: {selectedWardDetails[header]}
            {rankTerm}
          </Typography>
        );
      })}
    </React.Fragment>
  ) : null;
  return (
    <SwipeableDrawer
      classes={{ root: classes.drawerContainer, paper: classes.drawer }}
      anchor="right"
      open={isOpen}
      onClose={onSwipeFactory(null)}
      onOpen={onSwipeFactory(
        selectedWardDetails && selectedWardDetails[WARD_CODE_FIELD]
      )}
    >
      {content}
    </SwipeableDrawer>
  );
};
