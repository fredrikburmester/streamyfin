import axios, { AxiosError, AxiosInstance } from "axios";
import { Results } from "@/utils/jellyseerr/server/models/Search";
import { storage } from "@/utils/mmkv";
import { inRange } from "lodash";
import { User as JellyseerrUser } from "@/utils/jellyseerr/server/entity/User";
import { atom } from "jotai";
import { useAtom } from "jotai/index";
import "@/augmentations";
import { useCallback, useMemo } from "react";
import { useSettings } from "@/utils/atoms/settings";
import { toast } from "sonner-native";
import {
  MediaRequestStatus,
  MediaType,
} from "@/utils/jellyseerr/server/constants/media";
import MediaRequest from "@/utils/jellyseerr/server/entity/MediaRequest";
import { MediaRequestBody } from "@/utils/jellyseerr/server/interfaces/api/requestInterfaces";
import { MovieDetails } from "@/utils/jellyseerr/server/models/Movie";
import {
  SeasonWithEpisodes,
  TvDetails,
} from "@/utils/jellyseerr/server/models/Tv";
import {
  IssueStatus,
  IssueType,
} from "@/utils/jellyseerr/server/constants/issue";
import Issue from "@/utils/jellyseerr/server/entity/Issue";
import { RTRating } from "@/utils/jellyseerr/server/api/rating/rottentomatoes";
import { writeErrorLog } from "@/utils/log";
import DiscoverSlider from "@/utils/jellyseerr/server/entity/DiscoverSlider";
import { t } from "i18next";

interface SearchParams {
  query: string;
  page: number;
  language: string;
}

interface SearchResults {
  page: number;
  totalPages: number;
  totalResults: number;
  results: Results[];
}

const JELLYSEERR_USER = "JELLYSEERR_USER";
const JELLYSEERR_COOKIES = "JELLYSEERR_COOKIES";

export const clearJellyseerrStorageData = () => {
  storage.delete(JELLYSEERR_USER);
  storage.delete(JELLYSEERR_COOKIES);
};

export enum Endpoints {
  STATUS = "/status",
  API_V1 = "/api/v1",
  SEARCH = "/search",
  REQUEST = "/request",
  MOVIE = "/movie",
  RATINGS = "/ratings",
  ISSUE = "/issue",
  TV = "/tv",
  SETTINGS = "/settings",
  DISCOVER = "/discover",
  DISCOVER_TRENDING = DISCOVER + "/trending",
  DISCOVER_MOVIES = DISCOVER + "/movies",
  DISCOVER_TV = DISCOVER + TV,
  AUTH_JELLYFIN = "/auth/jellyfin",
}

export type DiscoverEndpoint =
  | Endpoints.DISCOVER_TRENDING
  | Endpoints.DISCOVER_MOVIES
  | Endpoints.DISCOVER_TV;

export type TestResult =
  | {
      isValid: true;
      requiresPass: boolean;
    }
  | {
      isValid: false;
    };

export class JellyseerrApi {
  axios: AxiosInstance;

  constructor(baseUrl: string) {
    this.axios = axios.create({
      baseURL: baseUrl,
      withCredentials: true,
      withXSRFToken: true,
      xsrfHeaderName: "XSRF-TOKEN",
    });

    this.setInterceptors();
  }

  async test(): Promise<TestResult> {
    const user = storage.get<JellyseerrUser>(JELLYSEERR_USER);
    const cookies = storage.get<string[]>(JELLYSEERR_COOKIES);

    if (user && cookies) {
      return Promise.resolve({
        isValid: true,
        requiresPass: false,
      });
    }

    return await this.axios
      .get(Endpoints.API_V1 + Endpoints.STATUS)
      .then((response) => {
        const { status, headers, data } = response;
        if (inRange(status, 200, 299)) {
          if (data.version < "2.0.0") {
            const error =
              t("jellyseerr.toasts.jellyseer_does_not_meet_requirements");
            toast.error(error);
            throw Error(error);
          }

          storage.setAny(
            JELLYSEERR_COOKIES,
            headers["set-cookie"]?.flatMap((c) => c.split("; ")) ?? []
          );
          return {
            isValid: true,
            requiresPass: true,
          };
        }
        toast.error(t("jellyseerr.toasts.jellyseerr_test_failed"));
        writeErrorLog(
          `Jellyseerr returned a ${status} for url:\n` +
            response.config.url +
            "\n" +
            JSON.stringify(response.data)
        );
        return {
          isValid: false,
          requiresPass: false,
        };
      })
      .catch((e) => {
        const msg = t("jellyseerr.toasts.failed_to_test_jellyseerr_server_url");
        toast.error(msg);
        console.error(msg, e);
        return {
          isValid: false,
          requiresPass: false,
        };
      });
  }

  async login(username: string, password: string): Promise<JellyseerrUser> {
    return this.axios
      ?.post<JellyseerrUser>(Endpoints.API_V1 + Endpoints.AUTH_JELLYFIN, {
        username,
        password,
        email: username,
      })
      .then((response) => {
        const user = response?.data;
        if (!user) throw Error("Login failed");
        storage.setAny(JELLYSEERR_USER, user);
        return user;
      });
  }

  async discoverSettings(): Promise<DiscoverSlider[]> {
    return this.axios
      ?.get<DiscoverSlider[]>(
        Endpoints.API_V1 + Endpoints.SETTINGS + Endpoints.DISCOVER
      )
      .then(({ data }) => data);
  }

  async discover(
    endpoint: DiscoverEndpoint,
    params: any
  ): Promise<SearchResults> {
    return this.axios
      ?.get<SearchResults>(Endpoints.API_V1 + endpoint, { params })
      .then(({ data }) => data);
  }

  async search(params: SearchParams): Promise<SearchResults> {
    const response = await this.axios?.get<SearchResults>(
      Endpoints.API_V1 + Endpoints.SEARCH,
      { params }
    );
    return response?.data;
  }

  async request(request: MediaRequestBody): Promise<MediaRequest> {
    return this.axios
      ?.post<MediaRequest>(Endpoints.API_V1 + Endpoints.REQUEST, request)
      .then(({ data }) => data);
  }

  async movieDetails(id: number) {
    return this.axios
      ?.get<MovieDetails>(Endpoints.API_V1 + Endpoints.MOVIE + `/${id}`)
      .then((response) => {
        return response?.data;
      });
  }

  async movieRatings(id: number) {
    return this.axios
      ?.get<RTRating>(
        `${Endpoints.API_V1}${Endpoints.MOVIE}/${id}${Endpoints.RATINGS}`
      )
      .then(({ data }) => data);
  }

  async tvDetails(id: number) {
    return this.axios
      ?.get<TvDetails>(`${Endpoints.API_V1}${Endpoints.TV}/${id}`)
      .then((response) => {
        return response?.data;
      });
  }

  async tvRatings(id: number) {
    return this.axios
      ?.get<RTRating>(
        `${Endpoints.API_V1}${Endpoints.TV}/${id}${Endpoints.RATINGS}`
      )
      .then(({ data }) => data);
  }

  async tvSeason(id: number, seasonId: number) {
    return this.axios
      ?.get<SeasonWithEpisodes>(
        `${Endpoints.API_V1}${Endpoints.TV}/${id}/season/${seasonId}`
      )
      .then((response) => {
        return response?.data;
      });
  }

  tvStillImageProxy(path: string, width: number = 1920, quality: number = 75) {
    return (
      this.axios.defaults.baseURL +
      `/_next/image?` +
      new URLSearchParams(
        `url=https://image.tmdb.org/t/p/original/${path}&w=${width}&q=${quality}`
      ).toString()
    );
  }

  async submitIssue(mediaId: number, issueType: IssueType, message: string) {
    return this.axios
      ?.post<Issue>(Endpoints.API_V1 + Endpoints.ISSUE, {
        mediaId,
        issueType,
        message,
      })
      .then((response) => {
        const issue = response.data;

        if (issue.status === IssueStatus.OPEN) {
          toast.success(t("jellyseerr.toasts.issue_submitted"));
        }
        return issue;
      });
  }

  private setInterceptors() {
    this.axios.interceptors.response.use(
      async (response) => {
        const cookies = response.headers["set-cookie"];
        if (cookies) {
          storage.setAny(
            JELLYSEERR_COOKIES,
            response.headers["set-cookie"]?.flatMap((c) => c.split("; "))
          );
        }
        return response;
      },
      (error: AxiosError) => {
        const errorMsg = "Jellyseerr response error";
        console.error(errorMsg, error, error.response?.data);
        writeErrorLog(
          errorMsg +
            `\n` +
            `error: ${error.toString()}\n` +
            `url: ${error?.config?.url}\n` +
            `data:\n` +
            JSON.stringify(error.response?.data)
        );
        if (error.status === 403) {
          clearJellyseerrStorageData();
        }
        return Promise.reject(error);
      }
    );

    this.axios.interceptors.request.use(
      async (config) => {
        const cookies = storage.get<string[]>(JELLYSEERR_COOKIES);
        if (cookies) {
          const headerName = this.axios.defaults.xsrfHeaderName!!;
          const xsrfToken = cookies
            .find((c) => c.includes(headerName))
            ?.split(headerName + "=")?.[1];
          if (xsrfToken) {
            config.headers[headerName] = xsrfToken;
          }
        }
        return config;
      },
      (error) => {
        console.error("Jellyseerr request error", error);
      }
    );
  }
}

const jellyseerrUserAtom = atom(storage.get<JellyseerrUser>(JELLYSEERR_USER));

export const useJellyseerr = () => {
  const [jellyseerrUser, setJellyseerrUser] = useAtom(jellyseerrUserAtom);
  const [settings, updateSettings] = useSettings();

  const jellyseerrApi = useMemo(() => {
    const cookies = storage.get<string[]>(JELLYSEERR_COOKIES);
    if (settings?.jellyseerrServerUrl && cookies && jellyseerrUser) {
      return new JellyseerrApi(settings?.jellyseerrServerUrl);
    }
    return undefined;
  }, [settings?.jellyseerrServerUrl, jellyseerrUser]);

  const clearAllJellyseerData = useCallback(async () => {
    clearJellyseerrStorageData();
    setJellyseerrUser(undefined);
    updateSettings({ jellyseerrServerUrl: undefined });
  }, []);

  const requestMedia = useCallback(
    (title: string, request: MediaRequestBody) => {
      jellyseerrApi?.request?.(request)?.then((mediaRequest) => {
        switch (mediaRequest.status) {
          case MediaRequestStatus.PENDING:
          case MediaRequestStatus.APPROVED:
            toast.success(t("jellyseerr.toasts.requested_item", {item: title}));
            break;
          case MediaRequestStatus.DECLINED:
            toast.error(t("jellyseerr.toasts.you_dont_have_permission_to_request"));
            break;
          case MediaRequestStatus.FAILED:
            toast.error(t("jellyseerr.toasts.something_went_wrong_requesting_media"));
            break;
        }
      });
    },
    [jellyseerrApi]
  );

  const isJellyseerrResult = (
    items: any[] | null | undefined
  ): items is Results[] => {
    return (
      !items ||
      (items.length >= 0 &&
        Object.hasOwn(items[0], "mediaType") &&
        Object.values(MediaType).includes(items[0]["mediaType"]))
    );
  };

  return {
    jellyseerrApi,
    jellyseerrUser,
    setJellyseerrUser,
    clearAllJellyseerData,
    isJellyseerrResult,
    requestMedia,
  };
};
