import { View, type ViewProps } from "react-native";

export interface StackProps extends ViewProps {
  children?: React.ReactNode;
}

export const Stack = ({ children, style, ...rest }: StackProps) => {
  return (
    <View style={style} {...rest}>
      {children}
    </View>
  );
};
