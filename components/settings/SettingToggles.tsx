import { useDownload } from "@/providers/DownloadProvider";
import {
  apiAtom,
  getOrSetDeviceId,
  userAtom,
} from "@/providers/JellyfinProvider";
import {
  ScreenOrientationEnum,
  Settings,
  useSettings,
} from "@/utils/atoms/settings";
import {
  BACKGROUND_FETCH_TASK,
  registerBackgroundFetchAsync,
  unregisterBackgroundFetchAsync,
} from "@/utils/background-tasks";
import { getStatistics } from "@/utils/optimize-server";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as BackgroundFetch from "expo-background-fetch";
import * as ScreenOrientation from "expo-screen-orientation";
import * as TaskManager from "expo-task-manager";
import { useAtom } from "jotai";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Linking,
  Switch,
  TouchableOpacity,
  View,
  ViewProps,
} from "react-native";
import { toast } from "sonner-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Button } from "../Button";
import { Input } from "../common/Input";
import { Text } from "../common/Text";
import { Loader } from "../Loader";
import { MediaToggles } from "./MediaToggles";
import { Stepper } from "@/components/inputs/Stepper";
import { MediaProvider } from "./MediaContext";
import { SubtitleToggles } from "./SubtitleToggles";
import { AudioToggles } from "./AudioToggles";
import { JellyseerrApi, useJellyseerr } from "@/hooks/useJellyseerr";
import { ListItem } from "@/components/ListItem";
import { JellyseerrSettings } from "./Jellyseerr";
import { useTranslation } from "react-i18next";
import { AppLanguageSelector } from "./AppLanguageSelector";

interface Props extends ViewProps {}

export const SettingToggles: React.FC<Props> = ({ ...props }) => {
  const [settings, updateSettings] = useSettings();
  const { setProcesses } = useDownload();

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const [marlinUrl, setMarlinUrl] = useState<string>("");
  const [optimizedVersionsServerUrl, setOptimizedVersionsServerUrl] =
    useState<string>(settings?.optimizedVersionsServerUrl || "");

  const queryClient = useQueryClient();

  const { t } = useTranslation();

  /********************
   * Background task
   *******************/
  const checkStatusAsync = async () => {
    await BackgroundFetch.getStatusAsync();
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  };

  useEffect(() => {
    (async () => {
      const registered = await checkStatusAsync();

      if (settings?.autoDownload === true && !registered) {
        registerBackgroundFetchAsync();
        toast.success(t("home.settings.toasts.background_downloads_enabled"));
      } else if (settings?.autoDownload === false && registered) {
        unregisterBackgroundFetchAsync();
        toast.info(t("home.settings.toasts.background_downloads_disabled"));
      } else if (settings?.autoDownload === true && registered) {
        // Don't to anything
      } else if (settings?.autoDownload === false && !registered) {
        // Don't to anything
      } else {
        updateSettings({ autoDownload: false });
      }
    })();
  }, [settings?.autoDownload]);
  /**********************
   *********************/

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

      <AppLanguageSelector />

      <MediaProvider>
        <MediaToggles />
        <AudioToggles />
        <SubtitleToggles />
      </MediaProvider>

      <View>
        <Text className="text-lg font-bold mb-2">
          {t("home.settings.other.other_title")}
        </Text>

        <View className="flex flex-col rounded-xl overflow-hidden  divide-y-2 divide-solid divide-neutral-800">
          <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
            <View className="shrink">
              <Text className="font-semibold">
                {t("home.settings.other.auto_rotate")}
              </Text>
              <Text className="text-xs opacity-50">
                {t("home.settings.other.auto_rotate_hint")}
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
              <Text className="font-semibold">
                {t("home.settings.other.video_orientation")}
              </Text>
              <Text className="text-xs opacity-50">
                {t("home.settings.other.video_orientation_hint")}
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

          <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
            <View className="shrink">
              <Text className="font-semibold">
                {t("home.settings.other.safe_area_in_controls")}
              </Text>
              <Text className="text-xs opacity-50">
                {t("home.settings.other.safe_area_in_controls_hint")}
              </Text>
            </View>
            <Switch
              value={settings.safeAreaInControlsEnabled}
              onValueChange={(value) =>
                updateSettings({ safeAreaInControlsEnabled: value })
              }
            />
          </View>

          <View className="flex flex-col">
            <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
              <View className="flex flex-col">
                <Text className="font-semibold">
                  {t("home.settings.other.use_popular_lists_plugin")}
                </Text>
                <Text className="text-xs opacity-50">
                  {t("home.settings.other.use_popular_lists_plugin_hint")}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Linking.openURL(
                      "https://github.com/lostb1t/jellyfin-plugin-media-lists"
                    );
                  }}
                >
                  <Text className="text-xs text-purple-600">
                    {t("home.settings.other.more_info")}
                  </Text>
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

          <View className="flex flex-col">
            <View
              className={`
                flex flex-row items-center space-x-2 justify-between bg-neutral-900 p-4
              `}
            >
              <View className="flex flex-col shrink">
                <Text className="font-semibold">
                  {t("home.settings.other.search_engine")}
                </Text>
                <Text className="text-xs opacity-50">
                  {t("home.settings.other.search_engine_hint")}
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
                    {t("home.settings.other.save_button")}
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

          <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
            <View className="shrink">
              <Text className="font-semibold">
                {t("home.settings.other.show_custom_menu_links")}
              </Text>
              <Text className="text-xs opacity-50">
                {t("home.settings.other.show_custom_menu_links_hint")}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(
                    "https://jellyfin.org/docs/general/clients/web-config/#custom-menu-links"
                  )
                }
              >
                <Text className="text-xs text-purple-600">
                  {t("home.settings.other.more_info")}
                </Text>
              </TouchableOpacity>
            </View>
            <Switch
              value={settings.showCustomMenuLinks}
              onValueChange={(value) =>
                updateSettings({ showCustomMenuLinks: value })
              }
            />
          </View>
        </View>
      </View>

      <View className="mt-4">
        <Text className="text-lg font-bold mb-2">
          {t("home.settings.downloads.downloads_title")}
        </Text>
        <View className="flex flex-col rounded-xl overflow-hidden  divide-y-2 divide-solid divide-neutral-800">
          <View
            className={`
                flex flex-row items-center space-x-2 justify-between bg-neutral-900 p-4
              `}
          >
            <View className="flex flex-col shrink">
              <Text className="font-semibold">
                {t("home.settings.downloads.download_method")}
              </Text>
              <Text className="text-xs opacity-50">
                {t("home.settings.downloads.download_method_hint")}
              </Text>
            </View>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <TouchableOpacity className="bg-neutral-800 rounded-lg border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
                  <Text>
                    {settings.downloadMethod === "remux"
                      ? "Default"
                      : "Optimized"}
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
                <DropdownMenu.Label>Methods</DropdownMenu.Label>
                <DropdownMenu.Item
                  key="1"
                  onSelect={() => {
                    updateSettings({ downloadMethod: "remux" });
                    setProcesses([]);
                  }}
                >
                  <DropdownMenu.ItemTitle>Default</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  key="2"
                  onSelect={() => {
                    updateSettings({ downloadMethod: "optimized" });
                    setProcesses([]);
                    queryClient.invalidateQueries({ queryKey: ["search"] });
                  }}
                >
                  <DropdownMenu.ItemTitle>Optimized</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </View>
          <View
            pointerEvents={
              settings.downloadMethod === "remux" ? "auto" : "none"
            }
            className={`
              flex flex-row space-x-2 items-center justify-between bg-neutral-900 p-4
              ${
                settings.downloadMethod === "remux"
                  ? "opacity-100"
                  : "opacity-50"
              }`}
          >
            <View className="flex flex-col shrink">
              <Text className="font-semibold">
                {t("home.settings.downloads.remux_max_download")}
              </Text>
              <Text className="text-xs opacity-50 shrink">
                {t("home.settings.downloads.remux_max_download_hint")}
              </Text>
            </View>
            <Stepper
              value={settings.remuxConcurrentLimit}
              step={1}
              min={1}
              max={4}
              onUpdate={(value) =>
                updateSettings({
                  remuxConcurrentLimit:
                    value as Settings["remuxConcurrentLimit"],
                })
              }
            />
          </View>
          <View
            pointerEvents={
              settings.downloadMethod === "optimized" ? "auto" : "none"
            }
            className={`
              flex flex-row space-x-2 items-center justify-between bg-neutral-900 p-4
              ${
                settings.downloadMethod === "optimized"
                  ? "opacity-100"
                  : "opacity-50"
              }`}
          >
            <View className="flex flex-col shrink">
              <Text className="font-semibold">
                {t("home.settings.downloads.auto_download")}
              </Text>
              <Text className="text-xs opacity-50 shrink">
                {t("home.settings.downloads.auto_download_hint")}
              </Text>
            </View>
            <Switch
              value={settings.autoDownload}
              onValueChange={(value) => updateSettings({ autoDownload: value })}
            />
          </View>
          <View
            pointerEvents={
              settings.downloadMethod === "optimized" ? "auto" : "none"
            }
            className={`
              ${
                settings.downloadMethod === "optimized"
                  ? "opacity-100"
                  : "opacity-50"
              }`}
          >
            <View className="flex flex-col bg-neutral-900 px-4 py-4">
              <View className="flex flex-col shrink mb-2">
                <View className="flex flex-row justify-between items-center">
                  <Text className="font-semibold">
                    {t("home.settings.downloads.optimized_versions_server")}
                  </Text>
                </View>
                <Text className="text-xs opacity-50">
                  {t("home.settings.downloads.optimized_versions_server_hint")}
                </Text>
              </View>
              <View></View>
              <View className="flex flex-col">
                <Input
                  placeholder="Optimized versions server URL..."
                  value={optimizedVersionsServerUrl}
                  keyboardType="url"
                  returnKeyType="done"
                  autoCapitalize="none"
                  textContentType="URL"
                  onChangeText={(text) => setOptimizedVersionsServerUrl(text)}
                />
                <Button
                  color="purple"
                  className="h-12 mt-2"
                  onPress={async () => {
                    updateSettings({
                      optimizedVersionsServerUrl:
                        optimizedVersionsServerUrl.length === 0
                          ? null
                          : optimizedVersionsServerUrl.endsWith("/")
                          ? optimizedVersionsServerUrl
                          : optimizedVersionsServerUrl + "/",
                    });
                    const res = await getStatistics({
                      url: settings?.optimizedVersionsServerUrl,
                      authHeader: api?.accessToken,
                      deviceId: await getOrSetDeviceId(),
                    });
                    if (res) {
                      toast.success(t("home.settings.toasts.connected"));
                    } else toast.error(t("home.settings.toasts.could_not_connect"));
                  }}
                >
                  {t("home.settings.downloads.save_button")}
                </Button>
              </View>
            </View>
          </View>
        </View>
      </View>

      <JellyseerrSettings />
    </View>
  );
};
