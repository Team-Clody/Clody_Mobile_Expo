import { FlexAlignType, FlexStyle } from "react-native";

export type ClockAlignment = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export interface AlignmentConfig {
  alignItems?: FlexAlignType;
  justifyContent?: FlexStyle["justifyContent"];
}
