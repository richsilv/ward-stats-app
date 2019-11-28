export const CLIENT_ID =
  "978388352537-fnn94mu0emjd6tdme0tokctt80iludg7.apps.googleusercontent.com";
export const API_KEY = "AIzaSyCNKv31Uepktj0jpyZ7xZy_NofctPYxH9M";
export const DISCOVERY_DOCS = [
  "https://sheets.googleapis.com/$discovery/rest?version=v4",
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
];
export const SCOPE =
  "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly";
export const WARD_CODE_FIELD = "Ward Code";
export const WARD_NAME_FIELD = "Ward Name";
export const NON_COMPARISON_FIELDS = [
  "WD11CD",
  "WD11CDO",
  "WD11NM",
  "WD11NMW",
  WARD_CODE_FIELD,
  WARD_NAME_FIELD,
  "LA Name",
  "Region",
  "Rurality",
  "Constituency",
  "Constituency Code",
  "GE 2017"
];
export const NORMALISED_EXTENSION = "_¬NORMALISED¬";
export const NORMALISED_EXTENSION_REGEXP = new RegExp(NORMALISED_EXTENSION);
export const RANKING_EXTENSION = "_¬RANKING¬";
export const RANKING_EXTENSION_REGEXP = new RegExp(RANKING_EXTENSION);

export const QUANTUM = 0.000001;
