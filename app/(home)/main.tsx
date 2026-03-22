import { View, Text, Pressable } from "react-native";
import { AuthContext } from "../_layout";
import { useContext } from "react";
import { useRouter } from "expo-router";

export default function Main() {
  const { logout } = useContext(AuthContext);
  const router = useRouter();

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
        onPress={() => router.push("/(home)/mypage")}
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
    </View>
  );
}
