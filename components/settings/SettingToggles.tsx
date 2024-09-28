import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import {
  DefaultLanguageOption,
  DownloadOptions,
  ScreenOrientationEnum,
  useSettings,
} from "@/utils/atoms/settings";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import {
  Linking,
  Switch,
  TouchableOpacity,
  View,
  ViewProps,
} from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Text } from "../common/Text";
import { Loader } from "../Loader";
import { Input } from "../common/Input";
import { useState } from "react";
import { Button } from "../Button";
import { MediaToggles } from "./MediaToggles";
import * as ScreenOrientation from "expo-screen-orientation";

interface Props extends ViewProps {}

export const SettingToggles: React.FC<Props> = ({ ...props }) => {
  const [settings, updateSettings] = useSettings();

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const [marlinUrl, setMarlinUrl] = useState<string>("");
  const [optimizedVersionsServerUrl, setOptimizedVersionsServerUrl] =
    useState<string>("");
  const [optimizedVersionsAuthHeader, setOptimizedVersionsAuthHeader] =
    useState<string>("");

  const queryClient = useQueryClient();

  const {
    data: mediaListCollections,
    isLoading: isLoadingMediaListCollections,
  } = useQuery({
    queryKey: ["sf_promoted", user?.Id, settings?.usePopularPlugin],
    queryFn: async () => {
      if (!api || !user?.Id) return [];

      const response = await getItemsApi(api).getItems({
        userId: user.Id,
        tags: ["sf_promoted"],
        recursive: true,
        fields: ["Tags"],
        includeItemTypes: ["BoxSet"],
      });

      return response.data.Items ?? [];
    },
    enabled: !!api && !!user?.Id && settings?.usePopularPlugin === true,
    staleTime: 0,
  });

  if (!settings) return null;

  return (
    <View {...props}>
      {/* <View>
        <Text className="text-lg font-bold mb-2">Look and feel</Text>
        <View className="flex flex-col rounded-xl mb-4 overflow-hidden divide-y-2 divide-solid divide-neutral-800 opacity-50">
          <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
            <View className="shrink">
              <Text className="font-semibold">Coming soon</Text>
              <Text className="text-xs opacity-50 max-w-[90%]">
                Options for changing the look and feel of the app.
              </Text>
            </View>
            <Switch disabled />
          </View>
        </View>
      </View> */}

      <MediaToggles />

      <View>
        <Text className="text-lg font-bold mb-2">Other</Text>

        <View className="flex flex-col rounded-xl overflow-hidden  divide-y-2 divide-solid divide-neutral-800">
          <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
            <View className="shrink">
              <Text className="font-semibold">Auto rotate</Text>
              <Text className="text-xs opacity-50">
                Important on android since the video player orientation is
                locked to the app orientation.
              </Text>
            </View>
            <Switch
              value={settings.autoRotate}
              onValueChange={(value) => updateSettings({ autoRotate: value })}
            />
          </View>

          <View
            pointerEvents={settings.autoRotate ? "none" : "auto"}
            className={`
            ${
              settings.autoRotate
                ? "opacity-50 pointer-events-none"
                : "opacity-100"
            }
                flex flex-row items-center space-x-2 justify-between bg-neutral-900 p-4
              `}
          >
            <View className="flex flex-col shrink">
              <Text className="font-semibold">Video orientation</Text>
              <Text className="text-xs opacity-50">
                Set the full screen video player orientation.
              </Text>
            </View>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <TouchableOpacity className="bg-neutral-800 rounded-lg border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
                  <Text>
                    {ScreenOrientationEnum[settings.defaultVideoOrientation]}
                  </Text>
                </TouchableOpacity>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                loop={true}
                side="bottom"
                align="start"
                alignOffset={0}
                avoidCollisions={true}
                collisionPadding={8}
                sideOffset={8}
              >
                <DropdownMenu.Label>Orientation</DropdownMenu.Label>
                <DropdownMenu.Item
                  key="1"
                  onSelect={() => {
                    updateSettings({
                      defaultVideoOrientation:
                        ScreenOrientation.OrientationLock.DEFAULT,
                    });
                  }}
                >
                  <DropdownMenu.ItemTitle>
                    {
                      ScreenOrientationEnum[
                        ScreenOrientation.OrientationLock.DEFAULT
                      ]
                    }
                  </DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  key="2"
                  onSelect={() => {
                    updateSettings({
                      defaultVideoOrientation:
                        ScreenOrientation.OrientationLock.PORTRAIT_UP,
                    });
                  }}
                >
                  <DropdownMenu.ItemTitle>
                    {
                      ScreenOrientationEnum[
                        ScreenOrientation.OrientationLock.PORTRAIT_UP
                      ]
                    }
                  </DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  key="3"
                  onSelect={() => {
                    updateSettings({
                      defaultVideoOrientation:
                        ScreenOrientation.OrientationLock.LANDSCAPE_LEFT,
                    });
                  }}
                >
                  <DropdownMenu.ItemTitle>
                    {
                      ScreenOrientationEnum[
                        ScreenOrientation.OrientationLock.LANDSCAPE_LEFT
                      ]
                    }
                  </DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  key="4"
                  onSelect={() => {
                    updateSettings({
                      defaultVideoOrientation:
                        ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT,
                    });
                  }}
                >
                  <DropdownMenu.ItemTitle>
                    {
                      ScreenOrientationEnum[
                        ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
                      ]
                    }
                  </DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </View>

          <View className="flex flex-row space-x-2 items-center justify-between bg-neutral-900 p-4">
            <View className="flex flex-col shrink">
              <Text className="font-semibold">Use external player (VLC)</Text>
              <Text className="text-xs opacity-50 shrink">
                Open all videos in VLC instead of the default player. This
                requries VLC to be installed on the phone.
              </Text>
            </View>
            <Switch
              value={settings.openInVLC}
              onValueChange={(value) => {
                updateSettings({ openInVLC: value, forceDirectPlay: value });
              }}
            />
          </View>

          <View className="flex flex-col">
            <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
              <View className="flex flex-col">
                <Text className="font-semibold">Use popular lists plugin</Text>
                <Text className="text-xs opacity-50">Made by: lostb1t</Text>
                <TouchableOpacity
                  onPress={() => {
                    Linking.openURL(
                      "https://github.com/lostb1t/jellyfin-plugin-media-lists"
                    );
                  }}
                >
                  <Text className="text-xs text-purple-600">More info</Text>
                </TouchableOpacity>
              </View>
              <Switch
                value={settings.usePopularPlugin}
                onValueChange={(value) =>
                  updateSettings({ usePopularPlugin: value })
                }
              />
            </View>
            {settings.usePopularPlugin && (
              <View className="flex flex-col py-2 bg-neutral-900">
                {mediaListCollections?.map((mlc) => (
                  <View
                    key={mlc.Id}
                    className="flex flex-row items-center justify-between bg-neutral-900 px-4 py-2"
                  >
                    <View className="flex flex-col">
                      <Text className="font-semibold">{mlc.Name}</Text>
                    </View>
                    <Switch
                      value={settings.mediaListCollectionIds?.includes(mlc.Id!)}
                      onValueChange={(value) => {
                        if (!settings.mediaListCollectionIds) {
                          updateSettings({
                            mediaListCollectionIds: [mlc.Id!],
                          });
                          return;
                        }

                        updateSettings({
                          mediaListCollectionIds:
                            settings.mediaListCollectionIds.includes(mlc.Id!)
                              ? settings.mediaListCollectionIds.filter(
                                  (id) => id !== mlc.Id
                                )
                              : [...settings.mediaListCollectionIds, mlc.Id!],
                        });
                      }}
                    />
                  </View>
                ))}
                {isLoadingMediaListCollections && (
                  <View className="flex flex-row items-center justify-center bg-neutral-900 p-4">
                    <Loader />
                  </View>
                )}
                {mediaListCollections?.length === 0 && (
                  <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
                    <Text className="text-xs opacity-50">
                      No collections found. Add some in Jellyfin.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View className="flex flex-row space-x-2 items-center justify-between bg-neutral-900 p-4">
            <View className="flex flex-col shrink">
              <Text className="font-semibold">Force direct play</Text>
              <Text className="text-xs opacity-50 shrink">
                This will always request direct play. This is good if you want
                to try to stream movies you think the device supports.
              </Text>
            </View>
            <Switch
              value={settings.forceDirectPlay}
              onValueChange={(value) =>
                updateSettings({ forceDirectPlay: value })
              }
            />
          </View>

          <View
            className={`
              flex flex-row items-center space-x-2 justify-between bg-neutral-900 p-4
              ${settings.forceDirectPlay ? "opacity-50 select-none" : ""}
            `}
          >
            <View className="flex flex-col shrink">
              <Text className="font-semibold">Device profile</Text>
              <Text className="text-xs opacity-50">
                A profile used for deciding what audio and video codecs the
                device supports.
              </Text>
            </View>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <TouchableOpacity className="bg-neutral-800 rounded-lg border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
                  <Text>{settings.deviceProfile}</Text>
                </TouchableOpacity>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                loop={true}
                side="bottom"
                align="start"
                alignOffset={0}
                avoidCollisions={true}
                collisionPadding={8}
                sideOffset={8}
              >
                <DropdownMenu.Label>Profiles</DropdownMenu.Label>
                <DropdownMenu.Item
                  key="1"
                  onSelect={() => {
                    updateSettings({ deviceProfile: "Expo" });
                  }}
                >
                  <DropdownMenu.ItemTitle>Expo</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  key="2"
                  onSelect={() => {
                    updateSettings({ deviceProfile: "Native" });
                  }}
                >
                  <DropdownMenu.ItemTitle>Native</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  key="3"
                  onSelect={() => {
                    updateSettings({ deviceProfile: "Old" });
                  }}
                >
                  <DropdownMenu.ItemTitle>Old</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </View>

          <View className="flex flex-col">
            <View
              className={`
                flex flex-row items-center space-x-2 justify-between bg-neutral-900 p-4
              `}
            >
              <View className="flex flex-col shrink">
                <Text className="font-semibold">Search engine</Text>
                <Text className="text-xs opacity-50">
                  Choose the search engine you want to use.
                </Text>
              </View>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <TouchableOpacity className="bg-neutral-800 rounded-lg border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
                    <Text>{settings.searchEngine}</Text>
                  </TouchableOpacity>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                  loop={true}
                  side="bottom"
                  align="start"
                  alignOffset={0}
                  avoidCollisions={true}
                  collisionPadding={8}
                  sideOffset={8}
                >
                  <DropdownMenu.Label>Profiles</DropdownMenu.Label>
                  <DropdownMenu.Item
                    key="1"
                    onSelect={() => {
                      updateSettings({ searchEngine: "Jellyfin" });
                      queryClient.invalidateQueries({ queryKey: ["search"] });
                    }}
                  >
                    <DropdownMenu.ItemTitle>Jellyfin</DropdownMenu.ItemTitle>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    key="2"
                    onSelect={() => {
                      updateSettings({ searchEngine: "Marlin" });
                      queryClient.invalidateQueries({ queryKey: ["search"] });
                    }}
                  >
                    <DropdownMenu.ItemTitle>Marlin</DropdownMenu.ItemTitle>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </View>
            {settings.searchEngine === "Marlin" && (
              <View className="flex flex-col bg-neutral-900 px-4 pb-4">
                <View className="flex flex-row items-center space-x-2">
                  <View className="grow">
                    <Input
                      placeholder="Marlin Server URL..."
                      defaultValue={settings.marlinServerUrl}
                      value={marlinUrl}
                      keyboardType="url"
                      returnKeyType="done"
                      autoCapitalize="none"
                      textContentType="URL"
                      onChangeText={(text) => setMarlinUrl(text)}
                    />
                  </View>
                  <Button
                    color="purple"
                    className="shrink w-16 h-12"
                    onPress={() => {
                      updateSettings({
                        marlinServerUrl: marlinUrl.endsWith("/")
                          ? marlinUrl
                          : marlinUrl + "/",
                      });
                    }}
                  >
                    Save
                  </Button>
                </View>

                {settings.marlinServerUrl && (
                  <Text className="text-neutral-500 mt-2">
                    Current: {settings.marlinServerUrl}
                  </Text>
                )}
              </View>
            )}
          </View>
          <View className="flex flex-col bg-neutral-900 px-4 py-4">
            <View className="flex flex-col shrink mb-2">
              <Text className="font-semibold">Optimized versions server</Text>
              <Text className="text-xs opacity-50">
                Set the URL for the optimized versions server for downloads.
              </Text>
            </View>
            <View className="flex flex-row items-center space-x-2">
              <View className="grow">
                <Input
                  placeholder="Optimized versions server URL..."
                  defaultValue={
                    settings.optimizedVersionsServerUrl
                      ? settings.optimizedVersionsServerUrl
                      : ""
                  }
                  value={optimizedVersionsServerUrl}
                  keyboardType="url"
                  returnKeyType="done"
                  autoCapitalize="none"
                  textContentType="URL"
                  onChangeText={(text) => setOptimizedVersionsServerUrl(text)}
                />
              </View>
              <Button
                color="purple"
                className="shrink w-16 h-12"
                onPress={() => {
                  updateSettings({
                    optimizedVersionsServerUrl:
                      optimizedVersionsServerUrl.length === 0
                        ? null
                        : optimizedVersionsServerUrl.endsWith("/")
                        ? optimizedVersionsServerUrl
                        : optimizedVersionsServerUrl + "/",
                  });
                }}
              >
                Save
              </Button>
            </View>

            {settings.optimizedVersionsServerUrl && (
              <Text className="text-neutral-500 mt-2">
                Current: {settings.optimizedVersionsServerUrl}
              </Text>
            )}
          </View>
          <View className="flex flex-col bg-neutral-900 px-4 py-4">
            <View className="flex flex-col shrink mb-2">
              <Text className="font-semibold">
                Optimized versions auth header
              </Text>
              <Text className="text-xs opacity-50">
                The auth header for the optimized versions server.
              </Text>
            </View>
            <View className="flex flex-row items-center space-x-2">
              <View className="shrink">
                <Input
                  placeholder="Optimized versions server URL..."
                  defaultValue={
                    settings.optimizedVersionsAuthHeader
                      ? settings.optimizedVersionsAuthHeader
                      : ""
                  }
                  value={optimizedVersionsAuthHeader}
                  keyboardType="url"
                  returnKeyType="done"
                  autoCapitalize="none"
                  textContentType="URL"
                  onChangeText={(text) => setOptimizedVersionsAuthHeader(text)}
                />
              </View>
              <Button
                color="purple"
                className=" w-16 h-12"
                onPress={() => {
                  updateSettings({
                    optimizedVersionsAuthHeader,
                  });
                }}
              >
                Save
              </Button>
            </View>

            {settings.optimizedVersionsAuthHeader && (
              <Text className="text-neutral-500 mt-2">
                Current: {settings.optimizedVersionsAuthHeader}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};
