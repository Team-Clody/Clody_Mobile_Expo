import { useFonts } from "expo-font";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  View,
  ViewStyle,
} from "react-native";

interface Props {
  items: string[];
  onItemChange: (item: string) => void;
  itemHeight: number;
  initValue?: string;
  containerStyle?: ViewStyle;
  fontFamily?: string;
}
const WheelPicker: React.FC<Props> = (props) => {
  const { items, onItemChange, itemHeight, initValue, fontFamily } = props;
  const scrollY = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList<string>>(null);
  const initMatchedIndex = initValue ? items.indexOf(initValue) : 0;
  const initValueIndex =
    initMatchedIndex >= 0 ? initMatchedIndex : Math.max(0, items.length - 1);
  const didInitialSyncRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const currentIndexRef = useRef(initValueIndex);
  const [selectedItem, setSelectedItem] = useState(items[initValueIndex] ?? items[0]);
  const [fontsLoaded] = useFonts({
    PretendardRegular: require("../assets/fonts/Pretendard-Regular.otf"),
    PretendardBold: require("../assets/fonts/Pretendard-Bold.otf"),
    PretendardMedium: require("../assets/fonts/Pretendard-Medium.otf"),
    PretendardSemiBold: require("../assets/fonts/Pretendard-SemiBold.otf"),
  });
  const renderItem = ({ item, index }: ListRenderItemInfo<string>) => {
    const inputRange = [
      (index - 2) * itemHeight,
      (index - 1) * itemHeight,
      index * itemHeight,
      (index + 1) * itemHeight,
      (index + 2) * itemHeight,
    ];
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [0.86, 0.93, 1, 0.93, 0.86],
      extrapolate: "clamp",
    });
    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [0.28, 0.55, 1, 0.55, 0.28],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          {
            height: itemHeight,
            transform: [{ scale }],
            opacity,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Text
          style={[
            //TYPOS.headline4,
            {
              color: selectedItem === item ? "#212124" : "#B7BFCC",
              fontSize: 18,
              lineHeight: 22,
              fontFamily: fontFamily ?? "PretendardMedium",
              textAlign: "center",
              includeFontPadding: false,
              textAlignVertical: "center",
            },
          ]}
        >
          {item}
        </Text>
      </Animated.View>
    );
  };

  const syncSelectionToOffset = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    // 초기 마운트 직후 발생하는 불안정한 이벤트 무시
    if (!hasInitializedRef.current) return;

    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    const snappedOffset = clampedIndex * itemHeight;

    // Keep interpolation value aligned without triggering recursive scroll events.
    scrollY.setValue(snappedOffset);

    currentIndexRef.current = clampedIndex;
    const nextItem = items[clampedIndex];
    if (selectedItem !== nextItem) {
      setSelectedItem(nextItem);
      onItemChange(nextItem);
    }
  };

  useEffect(() => {
    const matchedIndex = initValue ? items.indexOf(initValue) : 0;
    const fallbackIndex = Math.max(0, items.length - 1);
    const nextIndex = matchedIndex >= 0 ? matchedIndex : fallbackIndex;
    const safeIndex = Number.isFinite(nextIndex) && nextIndex >= 0 ? nextIndex : 0;
    const nextItem = items[safeIndex] ?? items[0];
    currentIndexRef.current = safeIndex;
    setSelectedItem(nextItem);

    requestAnimationFrame(() => {
      // Keep visual interpolation in sync with the initial offset.
      scrollY.setValue(safeIndex * itemHeight);
      listRef.current?.scrollToOffset({
        offset: safeIndex * itemHeight,
        animated: didInitialSyncRef.current,
      });
      hasInitializedRef.current = true;
      didInitialSyncRef.current = true;
    });
  }, [initValue, items, itemHeight]);

  return (
    <View
      style={[{ height: itemHeight * 5, overflow: "hidden" }, props.containerStyle]}
    >
      <Animated.FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        onScrollEndDrag={syncSelectionToOffset}
        onMomentumScrollEnd={syncSelectionToOffset}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        contentContainerStyle={{
          paddingVertical: itemHeight * 2,
        }}
      />
    </View>
  );
};

export default WheelPicker;
