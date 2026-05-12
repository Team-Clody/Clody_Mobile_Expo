import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  ListRenderItemInfo,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

/** 12시간제 오전/오후 — UI 문구는 로케일로 별도 생성 */
export type ReminderPeriod = "am" | "pm";

export type ReminderLocale = "ko" | "en";

const REMINDER_PERIOD_ORDER: ReminderPeriod[] = ["am", "pm"];

export function getReminderPeriodLabel(
  period: ReminderPeriod,
  locale: ReminderLocale,
): string {
  if (locale === "ko") {
    return period === "am" ? "오전" : "오후";
  }
  const d = new Date(2000, 0, 1, period === "am" ? 9 : 15, 0, 0);
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: true,
  }).formatToParts(d);
  const dayPeriod = parts.find((p) => p.type === "dayPeriod");
  return dayPeriod?.value ?? (period === "am" ? "AM" : "PM");
}

export interface ReminderTimeValue {
  period: ReminderPeriod;
  hour: string;
  minute: string;
}

interface Props {
  visible: boolean;
  initialValue: ReminderTimeValue;
  onClose: () => void;
  onConfirm: (value: ReminderTimeValue) => void;
  locale?: ReminderLocale;
}

const ITEM_HEIGHT = 40;
const VISIBLE_COUNT = 5;
const COLUMN_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;

const HOUR_ITEMS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const MINUTE_ITEMS = Array.from({ length: 6 }, (_, i) =>
  String(i * 10).padStart(2, "0"),
);

interface ColumnProps {
  items: string[];
  initialValue: string;
  onChange: (value: string) => void;
  align?: "left" | "center" | "right";
  containerStyle?: ViewStyle;
}

const ReminderColumn = ({
  items,
  initialValue,
  onChange,
  align = "center",
  containerStyle,
}: ColumnProps) => {
  const startIndex = Math.max(0, items.indexOf(initialValue));
  const listRef = useRef<FlatList<string>>(null);
  const scrollY = useRef(new Animated.Value(startIndex * ITEM_HEIGHT)).current;
  const isReadyRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(startIndex);

  useEffect(() => {
    isReadyRef.current = false;
    setActiveIndex(startIndex);
    scrollY.setValue(startIndex * ITEM_HEIGHT);
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: startIndex * ITEM_HEIGHT,
        animated: false,
      });
      isReadyRef.current = true;
    });
  }, [startIndex, scrollY]);

  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isReadyRef.current) return;
    const y = event.nativeEvent.contentOffset.y;
    const rawIndex = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, rawIndex));
    scrollY.setValue(clamped * ITEM_HEIGHT);
    if (clamped !== activeIndex) {
      setActiveIndex(clamped);
      onChange(items[clamped]);
    }
  };

  const renderItem = ({ item, index }: ListRenderItemInfo<string>) => {
    const inputRange = [
      (index - 2) * ITEM_HEIGHT,
      (index - 1) * ITEM_HEIGHT,
      index * ITEM_HEIGHT,
      (index + 1) * ITEM_HEIGHT,
      (index + 2) * ITEM_HEIGHT,
    ];
    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [0.25, 0.5, 1, 0.5, 0.25],
      extrapolate: "clamp",
    });
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [0.88, 0.94, 1, 0.94, 0.88],
      extrapolate: "clamp",
    });
    const isActive = index === activeIndex;
    return (
      <Animated.View
        style={[
          styles.itemRow,
          {
            opacity,
            transform: [{ scale }],
            justifyContent:
              align === "left"
                ? "flex-start"
                : align === "right"
                  ? "flex-end"
                  : "center",
          },
        ]}
      >
        <Text
          style={[
            styles.itemText,
            isActive ? styles.itemTextActive : styles.itemTextInactive,
          ]}
        >
          {item}
        </Text>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.column, containerStyle]}>
      <Animated.FlatList
        ref={listRef}
        data={items}
        keyExtractor={(value, index) => `${value}-${index}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        scrollEventThrottle={16}
        onScrollEndDrag={settle}
        onMomentumScrollEnd={settle}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
      />
    </View>
  );
};

export default function ReminderTimeBottomSheet({
  visible,
  initialValue,
  onClose,
  onConfirm,
  locale = "ko",
}: Props) {
  const periodLabels = useMemo(
    () => REMINDER_PERIOD_ORDER.map((p) => getReminderPeriodLabel(p, locale)),
    [locale],
  );
  const sheetTitle =
    locale === "en" ? "Change reminder time" : "알림 시간을 선택해주세요";
  const confirmLabel = locale === "en" ? "Save" : "확인";
  const translateY = useRef(new Animated.Value(1)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const [period, setPeriod] = useState<ReminderPeriod>(initialValue.period);
  const [hour, setHour] = useState(initialValue.hour);
  const [minute, setMinute] = useState(initialValue.minute);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setPeriod(initialValue.period);
      setHour(initialValue.hour);
      setMinute(initialValue.minute);
      translateY.setValue(1);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 1,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, initialValue, translateY, backdropOpacity, mounted]);

  if (!mounted) return null;

  const sheetTranslate = translateY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 360],
  });

  const handleConfirm = () => {
    onConfirm({ period, hour, minute });
  };

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: sheetTranslate }] },
          ]}
        >
          <Text style={styles.title}>{sheetTitle}</Text>

          <View style={styles.pickerWrap}>
            <View pointerEvents="none" style={styles.highlightBar} />
            <ReminderColumn
              items={periodLabels}
              initialValue={getReminderPeriodLabel(period, locale)}
              onChange={(label) => {
                const idx = periodLabels.indexOf(label);
                if (idx >= 0) setPeriod(REMINDER_PERIOD_ORDER[idx]!);
              }}
              align="right"
              containerStyle={styles.periodColumn}
            />
            <ReminderColumn
              items={HOUR_ITEMS}
              initialValue={hour}
              onChange={setHour}
              align="center"
              containerStyle={styles.hourColumn}
            />
            <ReminderColumn
              items={MINUTE_ITEMS}
              initialValue={minute}
              onChange={setMinute}
              align="left"
              containerStyle={styles.minuteColumn}
            />
          </View>

          <Pressable style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmText}>{confirmLabel}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28,
  },
  title: {
    fontFamily: "PretendardSemiBold",
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.32,
    color: "#20242B",
    marginBottom: 12,
  },
  pickerWrap: {
    height: COLUMN_HEIGHT,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  highlightBar: {
    position: "absolute",
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    backgroundColor: "#F1F2F3",
  },
  column: {
    height: COLUMN_HEIGHT,
    overflow: "hidden",
  },
  periodColumn: {
    width: 64,
    marginRight: 22,
  },
  hourColumn: {
    width: 56,
    marginHorizontal: 18,
  },
  minuteColumn: {
    width: 56,
    marginLeft: 22,
  },
  itemRow: {
    height: ITEM_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  itemText: {
    fontFamily: "PretendardMedium",
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.36,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  itemTextActive: {
    color: "#212124",
    fontFamily: "PretendardSemiBold",
  },
  itemTextInactive: {
    color: "#B7BFCC",
  },
  confirmButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: "#20232A",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmText: {
    fontFamily: "PretendardSemiBold",
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.32,
  },
});
