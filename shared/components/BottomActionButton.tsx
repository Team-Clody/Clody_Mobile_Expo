import { useEffect, useState } from "react";
import { Keyboard, Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Button } from "./Button";

interface BottomActionButtonProps {
  title: string;
  onPress: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  buttonStyleOnKeyboard?: StyleProp<ViewStyle>;
}

/** Place inside a KeyboardAvoidingView; the parent owns keyboard positioning. */
export function BottomActionButton({ title, onPress, isDisabled, isLoading, containerStyle, buttonStyle, buttonStyleOnKeyboard }: BottomActionButtonProps) {
  const [keyboardVisible, setKeyboardVisible] = useState(Keyboard.isVisible());
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return (
    <View style={[styles.container, containerStyle, keyboardVisible && styles.docked]}>
      <Button title={title} onPress={onPress} isDisabled={isDisabled} isLoading={isLoading}
        containerStyle={[buttonStyle, keyboardVisible && buttonStyleOnKeyboard, keyboardVisible && styles.square]} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { paddingHorizontal: 14, paddingBottom: 2 },
  docked: { paddingHorizontal: 0, paddingBottom: 0 },
  square: { borderRadius: 0 },
});
