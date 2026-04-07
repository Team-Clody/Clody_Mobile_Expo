import { useRouter } from "expo-router";
import { useContext, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AuthContext } from "../../../_layout";
import CloverRewardBottomSheet from "../../../../components/CloverRewardBottomSheet";

export default function Main() {
  const { logout } = useContext(AuthContext);
  const router = useRouter();
  const [showReward, setShowReward] = useState(false);

  return (
    <View
      style={{
        alignItems: "center",
        gap: 20,
        marginTop: 200,
      }}
    >
      <Text style={{ color: "black", fontSize: 16 }}>main</Text>

      <Pressable
        onPress={() => setShowReward(true)}
        style={{
          backgroundColor: "#5EB362",
          paddingVertical: 12,
          paddingHorizontal: 30,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "white", fontSize: 16 }}>클로버 보상</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/(home)/(tabs)/mypage")}
        style={{
          backgroundColor: "#4A90E2",
          paddingVertical: 12,
          paddingHorizontal: 30,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "white", fontSize: 16 }}>마이페이지 이동</Text>
      </Pressable>

      <Pressable
        onPress={logout}
        style={{
          backgroundColor: "#282A31",
          paddingVertical: 12,
          paddingHorizontal: 30,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "white", fontSize: 16 }}>로그아웃</Text>
      </Pressable>

      <CloverRewardBottomSheet
        visible={showReward}
        onClose={() => setShowReward(false)}
        totalClovers={2}
      />
    </View>
  );
}
