import { HeaderBackButton } from "../common/HeaderBackButton";

const commonScreenOptions = {
  title: "",
  headerShown: true,
  headerTransparent: true,
  headerShadowVisible: false,
  headerLeft: () => <HeaderBackButton />,
};

const routes = [
  "actors/[actorId]",
  "albums/[albumId]",
  "artists/index",
  "artists/[artistId]",
  "items/page",
  "series/[id]",
];

export const nestedTabPageScreenOptions: { [key: string]: any } =
  Object.fromEntries(routes.map((route) => [route, commonScreenOptions]));
