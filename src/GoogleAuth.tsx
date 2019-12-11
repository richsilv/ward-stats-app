/* global gapi */
import * as React from "react";
import {
  Button,
  makeStyles,
  Theme,
  createStyles,
  useTheme
} from "@material-ui/core";
import { green } from "@material-ui/core/colors";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    button: {
      marginTop: theme.spacing(3)
    }
  })
);

interface IGoogleAuthProps {
  apiKey: string;
  clientId: string;
  discoveryDocs: Array<string>;
  scope: string;
  signedInState: [boolean, (newState: boolean) => void];
}

export const GoogleAuth: React.FC<IGoogleAuthProps> = ({
  apiKey,
  clientId,
  discoveryDocs,
  scope,
  signedInState: [isSignedIn, updateIsSignedIn]
}) => {
  const theme = useTheme();
  const classes = useStyles(theme);

  const googleApi = React.useRef<typeof gapi | null>(null);

  const handleSignIn = React.useCallback(() => {
    if (googleApi.current) {
      googleApi.current.auth2.getAuthInstance().signIn();
    } else {
      alert("Google API not loaded");
    }
  }, [googleApi]);
  const handleSignOut = React.useCallback(() => {
    if (googleApi.current) {
      googleApi.current.auth2.getAuthInstance().signOut();
    } else {
      alert("Google API not loaded");
    }
  }, [googleApi]);

  React.useEffect(() => {
    gapi.load("client:auth2", () => {
      gapi.client
        .init({
          apiKey,
          discoveryDocs,
          clientId,
          scope
        })
        .then(() => {
          googleApi.current = gapi;
          gapi.auth2.getAuthInstance().isSignedIn.listen(updateIsSignedIn);
          updateIsSignedIn(gapi.auth2.getAuthInstance().isSignedIn.get());
        })
        .catch(err => console.error(err));
    });
  }, []);

  return isSignedIn ? (
    <Button
      className={classes.button}
      variant="contained"
      onClick={handleSignOut}
    >
      Sign Out
    </Button>
  ) : (
    <Button
      className={classes.button}
      variant="contained"
      color="primary"
      onClick={handleSignIn}
    >
      Sign In
    </Button>
  );
};
