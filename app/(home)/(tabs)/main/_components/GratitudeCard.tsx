import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import PromptIcon from "@/assets/icons/ic_prompt.svg";
import ChevronGreenIcon from "@/assets/icons/Vector_gr.svg";
import ChevronDarkIcon from "@/assets/icons/Vector_bk.svg";
import NewIcon from "@/assets/icons/ic_new.svg";
import AdToReplyKoIcon from "@/assets/icons/btn_ad_to_reply_ko.svg";
import AdToReplyEnIcon from "@/assets/icons/btn_ad_to_reply_en.svg";
import { GradientText } from "@/components/GradientText";
import i18n from "@/app/i18n/i18n";
import {
  DUMMY_JOURNAL_PROMPT_EN,
  DUMMY_JOURNAL_PROMPT_KO,
  GRATITUDE_ABOVE_TAB_BAR,
  GRATITUDE_PROMPT_BLOCK_HEIGHT,
  GRATITUDE_SCROLL_PADDING_TOP,
  GRATITUDE_SLOT_HEIGHT,
  GRATITUDE_SLOT_MARGIN_TOP,
  gratitudeDateRowTextStyle,
  gratitudePromptTextStyle,
} from "../_constants";
import { fontPreset } from "@/shared/theme/localeTypography";
import { isCalendarToday } from "../_utils/dateUtils";

type GratitudeCardProps = {
  gratitudeDate: Date;
  isKo: boolean;
  journalPromptText: string;
  pastDayBadgeLabel: string;
  pastCardDateLabel: string;
  isUnready: boolean;
  isReadyNotRead: boolean;
  selectedReplyReadyAtMs: number | null;
  timerText: string;
  unreadyNoScheduleText: string;
  actionLabel: string;
  actionTextColor: string;
  useGreenActionChevron: boolean;
};

export function GratitudeCard({
  gratitudeDate,
  isKo,
  journalPromptText,
  pastDayBadgeLabel,
  pastCardDateLabel,
  isUnready,
  isReadyNotRead,
  selectedReplyReadyAtMs,
  timerText,
  unreadyNoScheduleText,
  actionLabel,
  actionTextColor,
  useGreenActionChevron,
}: GratitudeCardProps) {
  const AdToReplyIcon = isKo ? AdToReplyKoIcon : AdToReplyEnIcon;
  const isToday = isCalendarToday(gratitudeDate);

  return (
    <View
      style={{
        width: "100%",
        paddingHorizontal: 20,
        marginTop: GRATITUDE_SLOT_MARGIN_TOP,
        marginBottom: GRATITUDE_ABOVE_TAB_BAR,
        height: GRATITUDE_SLOT_HEIGHT,
      }}
    >
      <View
        style={{
          flex: 1,
          paddingTop: GRATITUDE_SCROLL_PADDING_TOP,
          paddingBottom: 4,
        }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          bounces={false}
        >
          {!isToday && <View style={{ height: GRATITUDE_PROMPT_BLOCK_HEIGHT }} />}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              paddingHorizontal: 15,
              paddingTop: 15,
              paddingBottom: 15,
              overflow: "visible",
              boxShadow: [
                {
                  offsetX: 0,
                  offsetY: 1,
                  blurRadius: 6,
                  color: "rgba(0, 0, 0, 0.05)",
                },
              ],
            }}
          >
            {isToday && (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <PromptIcon width={18} height={18} style={{ marginRight: 6 }} />
                  <Text
                    style={[fontPreset.semibold, { color: "#00A34A", fontSize: 12 }]}
                  >
                    {i18n.t("main.gratitude.title")}
                  </Text>
                </View>
                <View style={{ width: "100%", marginBottom: 12 }}>
                  <GradientText style={gratitudePromptTextStyle}>
                    {journalPromptText ||
                      (isKo ? DUMMY_JOURNAL_PROMPT_KO : DUMMY_JOURNAL_PROMPT_EN)}
                  </GradientText>
                </View>
                <View
                  style={{
                    position: "relative",
                    marginBottom: 14,
                    overflow: "visible",
                  }}
                >
                  <View
                    style={{
                      height: StyleSheet.hairlineWidth,
                      backgroundColor: "#E5E7EB",
                    }}
                  />
                  {isUnready && (
                    <Pressable
                      onPress={() => {}}
                      hitSlop={8}
                      style={{
                        position: "absolute",
                        right: -15,
                        top: -13,
                        overflow: "visible",
                      }}
                    >
                      <AdToReplyIcon width={isKo ? 168 : 160} height={42} />
                    </Pressable>
                  )}
                </View>
              </>
            )}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                minHeight: 34,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", flexShrink: 1 }}>
                <View
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={[gratitudeDateRowTextStyle, { color: "#6B7280" }]}>
                    {isToday
                      ? i18n.t("main.gratitude.todayBadge")
                      : pastDayBadgeLabel}
                  </Text>
                </View>
                <Text
                  style={[
                    gratitudeDateRowTextStyle,
                    {
                      color: "#111827",
                      marginLeft: isKo ? 10 : 8,
                      flexShrink: 1,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {pastCardDateLabel}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: isKo ? 8 : 4 }} />
              {isUnready ? (
                <Text
                  style={[
                    fontPreset.medium,
                    {
                      color: "#4B5563",
                      fontSize: isKo ? 15 : 13,
                      fontWeight: "500",
                      flexShrink: 0,
                      fontFamily: "PretendardMedium",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {selectedReplyReadyAtMs != null ? timerText : unreadyNoScheduleText}
                </Text>
              ) : (
                <Pressable
                  onPress={() => {}}
                  hitSlop={8}
                  style={{ width: isKo ? 106 : 132, alignItems: "flex-end" }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    {isReadyNotRead && (
                      <NewIcon width={14} height={14} style={{ marginRight: 2 }} />
                    )}
                    <Text
                      style={[
                        fontPreset.semibold,
                        {
                          color: actionTextColor,
                          fontSize: 14,
                          fontWeight: "600",
                          marginLeft: isReadyNotRead ? 4 : 10,
                        },
                      ]}
                    >
                      {actionLabel}
                    </Text>
                    {useGreenActionChevron ? (
                      <ChevronGreenIcon
                        width={8}
                        height={12}
                        style={{ marginLeft: 6, transform: [{ translateY: 1 }] }}
                      />
                    ) : (
                      <ChevronDarkIcon
                        width={8}
                        height={12}
                        style={{ marginLeft: 6, transform: [{ translateY: 1 }] }}
                      />
                    )}
                  </View>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
