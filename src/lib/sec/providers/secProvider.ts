import "server-only";

import { padCik } from "../cik";
import { secFetchJson } from "../secClient";
import type {
  SecCompanyFactsResponse,
  SecProvider,
  SecSubmissionsResponse,
} from "../types";

export const secProvider: SecProvider = {
  async fetchSubmissions(cik: string) {
    return secFetchJson<SecSubmissionsResponse>(
      `https://data.sec.gov/submissions/CIK${padCik(cik)}.json`,
    );
  },

  async fetchCompanyFacts(cik: string) {
    return secFetchJson<SecCompanyFactsResponse>(
      `https://data.sec.gov/api/xbrl/companyfacts/CIK${padCik(cik)}.json`,
    );
  },
};
