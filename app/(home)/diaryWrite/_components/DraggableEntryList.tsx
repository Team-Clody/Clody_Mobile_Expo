import * as Haptics from "expo-haptics";
import { ReactNode, useEffect, useState } from "react";
import { Keyboard, Platform, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  LinearTransition,
  SharedValue,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const LONG_PRESS_MS = 300;
const SPRING = { damping: 24, stiffness: 280, mass: 0.7 };

// 드래그 중인 칸의 중심이 다른 칸의 중심을 넘어간 슬롯을 찾음 (칸 높이가 서로 달라도 동작)
const getTargetIndex = (from: number, ty: number, heights: number[]) => {
  "worklet";
  const hFrom = heights[from] ?? 0;
  let idx = from;
  let gap = 0;
  if (ty > 0) {
    for (let i = from + 1; i < heights.length; i++) {
      const h = heights[i] ?? 0;
      if (ty > hFrom / 2 + gap + h / 2) {
        idx = i;
        gap += h;
      } else break;
    }
  } else {
    for (let i = from - 1; i >= 0; i--) {
      const h = heights[i] ?? 0;
      if (-ty > hFrom / 2 + gap + h / 2) {
        idx = i;
        gap += h;
      } else break;
    }
  }
  return idx;
};

type RowProps = {
  id: string;
  index: number;
  isDragging: boolean;
  activeIndex: SharedValue<number>;
  translationY: SharedValue<number>;
  anchorAdjust: SharedValue<number>;
  heights: SharedValue<number[]>;
  onMove: (from: number, to: number) => void;
  onDragChange: (id: string | null) => void;
  onLayoutHeight: (index: number, height: number) => void;
  children: ReactNode;
};

function DraggableRow({
  id,
  index,
  isDragging,
  activeIndex,
  translationY,
  anchorAdjust,
  heights,
  onMove,
  onDragChange,
  onLayoutHeight,
  children,
}: RowProps) {
  // 동시에 하나의 드래그만 허용 — 정착 애니메이션 중 다른 칸을 잡는 경우 포함
  const isOwner = useSharedValue(false);

  const beginDrag = () => {
    // 제스처 활성화 프레임에서 동기 dismiss하면 키보드 큐가 밀릴 수 있어 한 틱 미룸
    setTimeout(() => Keyboard.dismiss(), 0);
    onDragChange(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  const endDrag = () => onDragChange(null);
  const tickHaptic = () => Haptics.selectionAsync();

  const pan = Gesture.Pan()
    .activateAfterLongPress(LONG_PRESS_MS)
    .maxPointers(1)
    .onStart(() => {
      if (activeIndex.value !== -1) {
        isOwner.value = false;
        return;
      }
      isOwner.value = true;
      activeIndex.value = index;
      translationY.value = 0;
      anchorAdjust.value = 0;
      runOnJS(beginDrag)();
    })
    .onUpdate((e) => {
      if (!isOwner.value || activeIndex.value === -1) return;
      const y = e.translationY + anchorAdjust.value;
      const from = activeIndex.value;
      const h = heights.value;
      const target = getTargetIndex(from, y, h);
      if (target === from) {
        translationY.value = y;
        return;
      }
      // 자리 교환을 즉시 커밋하고, 레이아웃 이동분만큼 앵커를 당겨 드래그가 이어지게 함
      let dest = 0;
      if (target > from) {
        for (let i = from + 1; i <= target; i++) dest += h[i] ?? 0;
      } else {
        for (let i = target; i < from; i++) dest -= h[i] ?? 0;
      }
      const next = h.slice();
      const [moved] = next.splice(from, 1);
      next.splice(target, 0, moved);
      heights.value = next;
      anchorAdjust.value -= dest;
      translationY.value = y - dest;
      activeIndex.value = target;
      runOnJS(onMove)(from, target);
      runOnJS(tickHaptic)();
    })
    .onEnd(() => {
      if (!isOwner.value) return;
      translationY.value = withSpring(0, SPRING, (finished) => {
        // 취소된 스프링의 콜백이 다음 드래그 상태를 초기화하지 않도록 finished 확인
        if (finished) {
          isOwner.value = false;
          activeIndex.value = -1;
          runOnJS(endDrag)();
        }
      });
    })
    .onFinalize((_e, success) => {
      if (success || !isOwner.value) return;
      translationY.value = withSpring(0, SPRING, (finished) => {
        if (finished) {
          isOwner.value = false;
          activeIndex.value = -1;
        }
      });
      runOnJS(endDrag)();
    });

  const animatedStyle = useAnimatedStyle(() => {
    if (isDragging) {
      return {
        zIndex: 10,
        transform: [
          { translateY: translationY.value },
          { scale: withTiming(1.03, { duration: 120 }) },
        ],
        // Android 뷰에는 없는 프롭이라 iOS에서만 전달
        ...(Platform.OS === "ios" && {
          shadowOpacity: withTiming(0.14, { duration: 120 }),
        }),
      };
    }
    return {
      zIndex: 0,
      transform: [{ translateY: 0 }, { scale: withTiming(1) }],
      ...(Platform.OS === "ios" && { shadowOpacity: withTiming(0) }),
    };
  }, [isDragging, index]);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        // 드래그 중인 칸은 transform으로 움직이므로 레이아웃 애니메이션 제외
        layout={isDragging ? undefined : LinearTransition.duration(180)}
        onLayout={(e) => onLayoutHeight(index, e.nativeEvent.layout.height)}
        style={[styles.row, animatedStyle]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

type DraggableEntryListProps = {
  ids: string[];
  renderEntry: (index: number) => ReactNode;
  onMove: (from: number, to: number) => void;
  onDragStateChange: (dragging: boolean) => void;
};

export function DraggableEntryList({
  ids,
  renderEntry,
  onMove,
  onDragStateChange,
}: DraggableEntryListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const activeIndex = useSharedValue(-1);
  const translationY = useSharedValue(0);
  const anchorAdjust = useSharedValue(0);
  const heights = useSharedValue<number[]>([]);

  useEffect(() => {
    heights.value = heights.value.slice(0, ids.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.length]);

  const handleDragChange = (id: string | null) => {
    setDraggingId(id);
    onDragStateChange(id !== null);
  };

  const updateHeight = (index: number, height: number) => {
    if (heights.value[index] === height) return;
    const next = heights.value.slice();
    next[index] = height;
    heights.value = next;
  };

  return (
    <>
      {ids.map((id, index) => (
        <DraggableRow
          key={id}
          id={id}
          index={index}
          isDragging={draggingId === id}
          activeIndex={activeIndex}
          translationY={translationY}
          anchorAdjust={anchorAdjust}
          heights={heights}
          onMove={onMove}
          onDragChange={handleDragChange}
          onLayoutHeight={updateHeight}
        >
          {renderEntry(index)}
        </DraggableRow>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  row: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
      shadowOpacity: 0,
    },
    default: {},
  }),
});
