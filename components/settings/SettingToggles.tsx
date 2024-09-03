import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import {
  DefaultLanguageOption,
  DownloadOptions,
  useSettings,
} from "@/utils/atoms/settings";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { Linking, Switch, TouchableOpacity, View } from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Text } from "../common/Text";
import { Loader } from "../Loader";
import { Input } from "../common/Input";
import { useState } from "react";
import { Button } from "../Button";

const LANGUAGES: DefaultLanguageOption[] = [
  { label: "eng", value: "eng" },
  {
    label: "sv",
    value: "sv",
  },
];

export const SettingToggles: React.FC = () => {
  const [settings, updateSettings] = useSettings();

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const [marlinUrl, setMarlinUrl] = useState<string>("");

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

  return (
    <View>
      <View>
        <Text className="text-lg font-bold mb-2">Downloads</Text>
        <View className="flex flex-col rounded-xl mb-4 overflow-hidden  divide-y-2 divide-solid divide-neutral-800">
          <View
            className={`
              flex flex-row items-center space-x-2 justify-between bg-neutral-900 p-4
            `}
          >
            <View className="flex flex-col shrink">
              <Text className="font-semibold">Audio language</Text>
              <Text className="text-xs opacity-50">
                Choose a default audio language for downloads.
              </Text>
            </View>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <TouchableOpacity className="bg-neutral-800 rounded-lg border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
                  <Text>{settings?.defaultAudioLanguage?.label || "None"}</Text>
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
                <DropdownMenu.Label>Languages</DropdownMenu.Label>
                <DropdownMenu.Item
                  key={"none-audio"}
                  onSelect={() => {
                    updateSettings({
                      defaultAudioLanguage: null,
                    });
                  }}
                >
                  <DropdownMenu.ItemTitle>None</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
                {LANGUAGES.map((l) => (
                  <DropdownMenu.Item
                    key={l.value}
                    onSelect={() => {
                      updateSettings({
                        defaultAudioLanguage: l,
                      });
                    }}
                  >
                    <DropdownMenu.ItemTitle>{l.label}</DropdownMenu.ItemTitle>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </View>
          <View
            className={`
              flex flex-row items-center space-x-2 justify-between bg-neutral-900 p-4
            `}
          >
            <View className="flex flex-col shrink">
              <Text className="font-semibold">Subtitle language</Text>
              <Text className="text-xs opacity-50">
                Choose a default subtitle language for downloads.
              </Text>
            </View>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <TouchableOpacity className="bg-neutral-800 rounded-lg border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
                  <Text>
                    {settings?.defaultSubtitleLanguage?.label || "None"}
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
                <DropdownMenu.Label>Languages</DropdownMenu.Label>
                <DropdownMenu.Item
                  key={"none-subs"}
                  onSelect={() => {
                    updateSettings({
                      defaultSubtitleLanguage: null,
                    });
                  }}
                >
                  <DropdownMenu.ItemTitle>None</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
                {LANGUAGES.map((l) => (
                  <DropdownMenu.Item
                    key={l.value}
                    onSelect={() => {
                      updateSettings({
                        defaultSubtitleLanguage: l,
                      });
                    }}
                  >
                    <DropdownMenu.ItemTitle>{l.label}</DropdownMenu.ItemTitle>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </View>
        </View>
      </View>

      <View>
        <Text className="text-lg font-bold mb-2">Other</Text>

        <View className="flex flex-col rounded-xl mb-4 overflow-hidden  divide-y-2 divide-solid divide-neutral-800">
          <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
            <View className="shrink">
              <Text className="font-semibold">Auto rotate</Text>
              <Text className="text-xs opacity-50">
                Important on android since the video player orientation is
                locked to the app orientation.
              </Text>
            </View>
            <Switch
              value={settings?.autoRotate}
              onValueChange={(value) => updateSettings({ autoRotate: value })}
            />
          </View>

          <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
            <View className="shrink">
              <Text className="font-semibold">Start videos in fullscreen</Text>
              <Text className="text-xs opacity-50">
                Clicking a video will start it in fullscreen mode, instead of
                inline.
              </Text>
            </View>
            <Switch
              value={settings?.openFullScreenVideoPlayerByDefault}
              onValueChange={(value) =>
                updateSettings({ openFullScreenVideoPlayerByDefault: value })
              }
            />
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
              value={settings?.openInVLC}
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
                value={settings?.usePopularPlugin}
                onValueChange={(value) =>
                  updateSettings({ usePopularPlugin: value })
                }
              />
            </View>
            {settings?.usePopularPlugin && (
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
                      value={settings?.mediaListCollectionIds?.includes(
                        mlc.Id!
                      )}
                      onValueChange={(value) => {
                        if (!settings.mediaListCollectionIds) {
                          updateSettings({
                            mediaListCollectionIds: [mlc.Id!],
                          });
                          return;
                        }

                        updateSettings({
                          mediaListCollectionIds:
                            settings?.mediaListCollectionIds.includes(mlc.Id!)
                              ? settings?.mediaListCollectionIds.filter(
                                  (id) => id !== mlc.Id
                                )
                              : [...settings?.mediaListCollectionIds, mlc.Id!],
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
              value={settings?.forceDirectPlay}
              onValueChange={(value) =>
                updateSettings({ forceDirectPlay: value })
              }
            />
          </View>

          <View
            className={`
        flex flex-row items-center space-x-2 justify-between bg-neutral-900 p-4
        ${settings?.forceDirectPlay ? "opacity-50 select-none" : ""}
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
                  <Text>{settings?.deviceProfile}</Text>
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
                    <Text>{settings?.searchEngine}</Text>
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
            {settings?.searchEngine === "Marlin" && (
              <View className="flex flex-col bg-neutral-900 px-4 pb-4">
                <>
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
                        updateSettings({ marlinServerUrl: marlinUrl });
                      }}
                    >
                      Save
                    </Button>
                  </View>

                  <Text className="text-neutral-500 mt-2">
                    {settings?.marlinServerUrl}
                  </Text>
                </>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};
