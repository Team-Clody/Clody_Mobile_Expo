import { Dimensions } from "react-native";
import { typography } from "@/shared/theme/typography";
import type { ReplyStatus } from "./types";

export const bgDefaultPng = require("../../../../assets/images/bg_default.png");
export const SCREEN_WIDTH = Dimensions.get("window").width;

export const WEEK_DAYS_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
export const WEEK_DAYS_KO = ["월", "화", "수", "목", "금", "토", "일"];
export const WEEKDAY_LABEL_CIRCLE_SIZE = 28;
export const TODAY_WEEKDAY_LABEL_CIRCLE_SIZE = 24;
export const MONTHLY_SHEET_CLOVER_ROW_GAP = 24;
export const MONTHLY_TODAY_BADGE_SIZE = {
  ko: { width: 30, height: 32, top: -24 },
  en: { width: 34, height: 38, top: -29 },
} as const;
export const MONTHLY_TODAY_BADGE_BG = "#4A4C54";
export const HEADER_ACTION_COLOR = "#3C3E48";
export const HEADER_ACTION_DIVIDER_COLOR = "#D1D5DD";

export const WEEK_STRIP_HALF_SPAN = 7000;
export const WEEK_STRIP_CENTER_INDEX = WEEK_STRIP_HALF_SPAN;
export const WEEK_STRIP_LENGTH = WEEK_STRIP_HALF_SPAN * 2 + 1;

export const GRATITUDE_SLOT_MARGIN_TOP = 40;
export const GRATITUDE_SLOT_HEIGHT = 326;
export const GRATITUDE_SCROLL_PADDING_TOP = 92;
export const BG_DEFAULT_ASPECT_RATIO = 1;
export const BG_CENTER_TRANSLATE_Y = 18;
export const CHARACTER_TOP_RATIO = 0.4;
export const GRATITUDE_ABOVE_TAB_BAR = 12;
export const GRATITUDE_PROMPT_BLOCK_HEIGHT = 98;

export const DUMMY_JOURNAL_PROMPT_KO =
  '"버텨줘서 고마워"라고 말해주고 싶은 나의 모습을 적어보세요.';
export const DUMMY_JOURNAL_PROMPT_EN =
  "Write about the version of yourself you want to say, 'Thank you for holding on.'";

/** QA/디자인 확인용: null이면 API 값 사용, 값 지정하면 해당 날짜만 강제 */
export const FORCE_REPLY_STATUS_PREVIEW: ReplyStatus | null = null;

export const EN_MONTH_ITEMS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const gratitudePromptTextStyle = typography.display4;
export const gratitudeDateRowTextStyle = typography.body2;
export const cloverDateTextStyle = {
  ...typography.body12,
  position: "absolute" as const,
  width: 32,
  textAlign: "center" as const,
  color: "#fff",
  includeFontPadding: false,
  textAlignVertical: "center" as const,
};
