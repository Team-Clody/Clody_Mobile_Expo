import { Text, View } from "react-native";
import CloverDraftEllipsisIcon from "@/assets/icons/dotdotdot.svg";
import { cloverCenterOverlayStyle, cloverDateTextStyle } from "../_constants";

type CloverDayOverlayProps = {
  isDraft: boolean;
  dayNumber: number;
};

export function CloverDayOverlay({ isDraft, dayNumber }: CloverDayOverlayProps) {
  if (isDraft) {
    return (
      <View style={cloverCenterOverlayStyle}>
        <CloverDraftEllipsisIcon width={10} height={2} />
      </View>
    );
  }

  return <Text style={cloverDateTextStyle}>{dayNumber}</Text>;
}
