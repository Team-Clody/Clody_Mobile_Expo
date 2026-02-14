import { useContext } from "react";
import { View, Text, Pressable } from "react-native";
import { AuthContext } from "../_layout";

export default function Index() {
  const { logout } = useContext(AuthContext);

  return (
    <View style={{ alignItems: "center", gap: 20, marginTop: 100 }}>
      <Text style={{ fontSize: 22 }}>home</Text>
      <Pressable
        onPress={logout}
        style={({ pressed }) => ({
          backgroundColor: pressed ? "#c0392b" : "#e74c3c",
          paddingVertical: 12,
          paddingHorizontal: 30,
          borderRadius: 8,
        })}
      >
        <Text style={{ color: "white", fontSize: 16 }}>로그아웃</Text>
      </Pressable>
    </View>
  );
}
