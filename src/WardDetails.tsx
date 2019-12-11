import * as React from "react";

import { Ward } from "./types";
import {
  WARD_NAME_FIELD,
  WARD_CODE_FIELD,
  NORMALISED_EXTENSION_REGEXP,
  RANKING_EXTENSION_REGEXP
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
    drawer: {
      padding: theme.spacing(2)
    }
  })
);

interface IWardDetailsProps {
  readonly selectedWard: Ward | null;
  readonly score: number;
  readonly rank: number;
  readonly total: number;
  readonly setSelectedWard: (ward: Ward | null) => void;
}

export const WardDetails: React.FC<IWardDetailsProps> = ({
  selectedWard,
  score,
  rank,
  total,
  setSelectedWard
}) => {
  const theme = useTheme();
  const classes = useStyles(theme);

  const [isOpen, setIsOpen] = React.useState(false);

  const onSwipeFactory = React.useCallback(
    (ward: Ward | null) => () => {
      setIsOpen(!!ward);
      window.setTimeout(() => {
        setSelectedWard(ward);
      }, 250);
    },
    []
  );

  React.useEffect(() => {
    if (selectedWard) {
      setIsOpen(true);
    }
  }, [selectedWard, setIsOpen]);

  const content = selectedWard ? (
    <div className={classes.drawer}>
      <Typography variant="h2" component="h1">
        {selectedWard.properties[WARD_NAME_FIELD]}
      </Typography>
      <Typography>{selectedWard.properties[WARD_NAME_FIELD]}</Typography>
      <Typography>Score: {Math.round(score * 10000) / 100}%</Typography>
      <Typography>
        Rank: {rank} of {total}
      </Typography>
      {Object.keys(selectedWard.properties).map(header =>
        IGNORED_FIELDS.includes(header) ||
        NORMALISED_EXTENSION_REGEXP.test(header) ||
        RANKING_EXTENSION_REGEXP.test(header) ? null : (
          <Typography key={header}>
            {header}: {selectedWard.properties[header]}
          </Typography>
        )
      )}
    </div>
  ) : null;
  return (
    <SwipeableDrawer
      anchor="right"
      open={isOpen}
      onClose={onSwipeFactory(null)}
      onOpen={onSwipeFactory(selectedWard)}
    >
      {content}
    </SwipeableDrawer>
  );
};
