import { Text } from "@/components/common/Text";
import { List } from "@/components/List";
import { ListItem } from "@/components/ListItem";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { Ionicons } from "@expo/vector-icons";
import { getSyncPlayApi } from "@jellyfin/sdk/lib/utils/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";

export default function page() {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const queryClient = useQueryClient();

  const name = useMemo(() => user?.Name || "", [user]);

  const { data: activeGroups } = useQuery({
    queryKey: ["syncplay", "activeGroups"],
    queryFn: async () => {
      if (!api) return [];
      const res = await getSyncPlayApi(api).syncPlayGetGroups();
      return res.data;
    },
    refetchInterval: 5000,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (GroupName: string) => {
      if (!api) return;
      const res = await getSyncPlayApi(api).syncPlayCreateGroup({
        newGroupRequestDto: {
          GroupName,
        },
      });
      if (res.status !== 204) {
        Alert.alert("Error", "Failed to create group");
        return false;
      }
      return true;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["syncplay", "activeGroups"] });
    },
  });

  const createGroup = () => {
    Alert.prompt("Create Group", "Enter a name for the group", (text) => {
      if (text) {
        createGroupMutation.mutate(text);
      }
    });
  };

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (!api) return;
      const res = await getSyncPlayApi(api).syncPlayJoinGroup({
        joinGroupRequestDto: {
          GroupId: groupId,
        },
      });
      if (res.status !== 204) {
        Alert.alert("Error", "Failed to join group");
        return false;
      }
      return true;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["syncplay", "activeGroups"] });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async () => {
      if (!api) return;
      const res = await getSyncPlayApi(api).syncPlayLeaveGroup();
      if (res.status !== 204) {
        Alert.alert("Error", "Failed to exit group");
        return false;
      }
      return true;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["syncplay", "activeGroups"] });
    },
  });

  return (
    <ScrollView>
      <View className="px-4 py-4">
        <View>
          <Text className="text-lg font-bold mb-4">Join group</Text>
          {!activeGroups?.length && (
            <Text className="text-neutral-500 mb-4">No active groups</Text>
          )}
          <List>
            {activeGroups?.map((group) => (
              <ListItem
                key={group.GroupId}
                title={group.GroupName}
                onPress={async () => {
                  if (!group.GroupId) {
                    return;
                  }
                  if (group.Participants?.includes(name)) {
                    leaveGroupMutation.mutate();
                  } else {
                    joinGroupMutation.mutate(group.GroupId);
                  }
                }}
                iconAfter={
                  group.Participants?.includes(name) ? (
                    <Ionicons name="exit-outline" size={20} color="white" />
                  ) : (
                    <Ionicons name="add" size={20} color="white" />
                  )
                }
                subTitle={group.Participants?.join(", ")}
              />
            ))}
            <ListItem
              onPress={() => createGroup()}
              key={"create"}
              title={"Create group"}
              iconAfter={
                createGroupMutation.isPending ? (
                  <ActivityIndicator size={20} color={"white"} />
                ) : (
                  <Ionicons name="add" size={20} color="white" />
                )
              }
            />
          </List>
        </View>
      </View>
    </ScrollView>
  );
}
