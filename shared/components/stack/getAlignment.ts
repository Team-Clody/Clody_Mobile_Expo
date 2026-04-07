import { AlignmentConfig, ClockAlignment } from "./types";

type FlexDirection = "row" | "column";

/**
 * Clock alignment를 기반으로 flexbox alignment config를 반환합니다.
 *
 *   1(상좌) 2(상중) 3(상우)
 *   4(중좌) 5(중중) 6(중우)
 *   7(하좌) 8(하중) 9(하우)
 *   10: 중앙 + space-between
 *   11: direction별 space-between
 */

// [vertical position, horizontal position]
type Position = "flex-start" | "center" | "flex-end" | "space-between";
type GridEntry = [Position, Position];

const clockGrid: Record<ClockAlignment, GridEntry> = {
  1: ["flex-start", "flex-start"],
  2: ["flex-start", "center"],
  3: ["flex-start", "flex-end"],
  4: ["center", "flex-start"],
  5: ["center", "center"],
  6: ["center", "flex-end"],
  7: ["flex-end", "flex-start"],
  8: ["flex-end", "center"],
  9: ["flex-end", "flex-end"],
  10: ["center", "space-between"],
  11: ["flex-end", "space-between"],
};

// VStack 11번은 원본과 다른 의미를 가지므로 별도 override
const vStackOverride: Partial<Record<ClockAlignment, GridEntry>> = {
  11: ["space-between", "flex-start"],
};

export const getAlignment = (
  alignment: ClockAlignment,
  direction: FlexDirection
): AlignmentConfig => {
  const override = direction === "column" ? vStackOverride[alignment] : undefined;
  const [vertical, horizontal] = override ?? clockGrid[alignment];

  if (direction === "row") {
    return {
      alignItems: vertical as AlignmentConfig["alignItems"],
      justifyContent: horizontal,
    };
  }

  return {
    alignItems: horizontal as AlignmentConfig["alignItems"],
    justifyContent: vertical,
  };
};
