import { Stack } from "expo-router";
import { Chromecast } from "../Chromecast";
import { HeaderBackButton } from "../common/HeaderBackButton";

const commonScreenOptions = {
  title: "",
  headerShown: true,
  headerTransparent: true,
  headerShadowVisible: false,
  headerLeft: () => <HeaderBackButton />,
  headerRight: () => <Chromecast background="blur" width={22} height={22} />,
};

const routes = [
  "actors/[actorId]",
  "albums/[albumId]",
  "artists/index",
  "artists/[artistId]",
  "collections/[collectionId]",
  "items/[id]",
  "songs/[songId]",
  "series/[id]",
];

export const nestedTabPageScreenOptions: { [key: string]: any } =
  Object.fromEntries(routes.map((route) => [route, commonScreenOptions]));
