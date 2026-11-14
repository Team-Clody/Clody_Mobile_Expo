import { ActivityIndicator, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { Typo } from './typo/Typo';

interface ButtonProps {
  title: string;
  onPress: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Button = ({
  title,
  onPress,
  isDisabled,
  isLoading,
  containerStyle,
}: ButtonProps) => {
  return (
    <Pressable onPress={onPress} disabled={isDisabled || isLoading} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: !!(isDisabled || isLoading), busy: !!isLoading }}>
      <View
        style={[
          {
            height: 48,
            backgroundColor: isDisabled ? '#E3E6ED' : '#293038',
            borderRadius: 6,
            justifyContent: 'center',
            alignItems: 'center',
          },
          containerStyle,
        ]}
      >
        {isLoading ? <ActivityIndicator color="#FFFFFF" /> : (
          <Typo.Body variant="body1" color={isDisabled ? '#ABAFBB' : '#FFFFFF'}>
            {title}
          </Typo.Body>
        )}
      </View>
    </Pressable>
  );
};
