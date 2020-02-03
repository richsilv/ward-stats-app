import * as React from "react";
import { Ward } from "./types";
import {
  makeStyles,
  Theme,
  createStyles,
  Fab,
  Grow,
  TextField,
  InputAdornment
} from "@material-ui/core";
import { Search } from "@material-ui/icons";
import { Autocomplete } from "@material-ui/lab";
import * as Nominatim from "nominatim-browser";
import { debounce } from "lodash";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fab: {
      position: "absolute",
      top: theme.spacing(2),
      right: theme.spacing(2)
    },
    fabPushed: {
      left: theme.spacing(7)
    },
    drawer: {
      padding: theme.spacing(2)
    },
    autoComplete: {
      width: 300
    },
    icon: {
      color: theme.palette.text.secondary,
      marginRight: theme.spacing(2)
    },
    startAdornment: {
      marginTop: "0 !important"
    },
    textField: {
      backgroundColor: "rgba(255, 255, 255, 0.5)"
    }
  })
);

interface ISearchBarProps {
  readonly mapRef: React.MutableRefObject<any>;
}

export const SearchBar: React.FC<ISearchBarProps> = ({ mapRef }) => {
  const classes = useStyles();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [options, setOptions] = React.useState<
    Array<Nominatim.NominatimResponse>
  >([]);
  const [searchString, setSearchString] = React.useState<string>("");

  const onClickToggle = React.useCallback(() => {
    setIsOpen(currentIsOpen => !currentIsOpen);
  }, []);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setSearchString(event.currentTarget.value),
    []
  );

  const onChange = React.useCallback(
    (_, value: Nominatim.NominatimResponse | null) => {
      if (value && mapRef.current) {
        mapRef.current.leafletElement.setView([value.lat, value.lon], 13);
      }
      setSearchString("");
      setIsOpen(false);
    },
    [setSearchString, setIsOpen]
  );

  React.useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 250);
    }
  }, [isOpen, inputRef]);

  React.useEffect(
    debounce(() => {
      Nominatim.geocode({
        q: searchString
      })
        .then((results: Array<Nominatim.NominatimResponse>) =>
          setOptions(results)
        )
        .catch((error: Error) => console.error(error));
    }, 500),
    [searchString, setOptions]
  );

  return (
    <React.Fragment>
      <Grow in={!isOpen}>
        <Fab
          aria-label="Search for a place"
          className={classes.fab}
          color="primary"
          onClick={onClickToggle}
        >
          <Search />
        </Fab>
      </Grow>
      <Grow in={isOpen} style={{ transformOrigin: "center right 0" }}>
        <Autocomplete
          className={`${classes.autoComplete} ${classes.fab}`}
          id="search-place"
          getOptionLabel={option =>
            typeof option === "string" ? option : option.display_name
          }
          onChange={onChange}
          options={options}
          filterOptions={x => {
            return x;
          }}
          autoComplete
          freeSolo
          renderInput={params => (
            <TextField
              {...params}
              label="Search for a location"
              variant="filled"
              fullWidth
              onBlur={onClickToggle}
              onChange={handleChange}
              className={classes.textField}
              autoFocus
              InputProps={{
                ...params.InputProps,
                inputRef: inputRef,
                startAdornment: (
                  <InputAdornment
                    className={classes.startAdornment}
                    position="start"
                  >
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          )}
          renderOption={option => option.display_name}
        />
      </Grow>
    </React.Fragment>
  );
};
