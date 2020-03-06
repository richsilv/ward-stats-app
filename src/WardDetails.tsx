import numeral from "numeral";
import * as React from "react";

import { Ward, IData, FieldType } from "./types";
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

const useStylesWardDetails = makeStyles((theme: Theme) =>
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
  readonly fields: Map<string, FieldType>;
  readonly setSelectedWard: (ward: string | null) => void;
}

export const WardDetails: React.FC<IWardDetailsProps> = ({
  selectedWardDetails,
  score,
  rank,
  total,
  fields,
  setSelectedWard
}) => {
  const theme = useTheme();
  const classes = useStylesWardDetails(theme);

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
      <Typography>Score: {numeral(score).format("0[.]00%")}</Typography>
      <Typography>
        Rank: {rank} of {total}
      </Typography>
      {Object.keys(selectedWardDetails).map(header =>
        IGNORED_FIELDS.includes(header) ||
        NORMALISED_EXTENSION_REGEXP.test(header) ||
        RANKING_EXTENSION_REGEXP.test(header) ? null : (
          <DetailsRow
            wardDetails={selectedWardDetails}
            header={header}
            fields={fields}
            total={total}
          />
        )
      )}
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

const formatForType = ({
  fields,
  details,
  header
}: {
  fields: Map<string, FieldType>;
  details: IData;
  header: string;
}) => {
  switch (fields.get(header)) {
    case FieldType.Number:
      return numeral(details[header]).format("0,0[.]00");
    case FieldType.Currency:
      return numeral(details[header]).format("£ 0,0[.]00");
    case FieldType.Percentage:
      return numeral(details[header]).format("0[.]00%");
    default:
      return details[header];
  }
};

interface IDetailsRowProps {
  readonly wardDetails: IData;
  readonly header: string;
  readonly total: number;
  readonly fields: Map<string, FieldType>;
}

const useStylesDetailsRow = makeStyles((theme: Theme) =>
  createStyles({
    rankColor: (props: IDetailsRowProps) => {
      const rankBase = props.wardDetails[`${props.header}${RANKING_EXTENSION}`];
      console.log(rankBase);
      return {
        color:
          typeof rankBase === "number"
            ? rankBase > 0.75
              ? theme.palette.success.dark
              : rankBase < 0.25
              ? theme.palette.error.dark
              : theme.palette.grey[600]
            : theme.palette.grey[600]
      };
    }
  })
);

const DetailsRow: React.FC<IDetailsRowProps> = props => {
  const { wardDetails, header, fields, total } = props;

  const theme = useTheme();
  const styles = useStylesDetailsRow(props);

  const rankBase = wardDetails[`${header}${RANKING_EXTENSION}`];
  const rankTerm =
    typeof rankBase === "number" ? (
      <Typography
        display="inline"
        variant="body1"
        className={styles.rankColor}
      >{` (${numeral((1 - rankBase) * total + 1).format("0,0")}
    / ${numeral(total).format("0,0")})`}</Typography>
    ) : null;

  return (
    <Typography key={header}>
      {header}: {formatForType({ fields, details: wardDetails, header })}
      {rankTerm}
    </Typography>
  );
};
