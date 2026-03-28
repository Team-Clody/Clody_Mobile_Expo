import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ListScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 16, color: "#333" }}>모아보기</Text>
      </View>
    </SafeAreaView>
  );
}
