import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './Button';
import { Typo } from './typo/Typo';
import { palette } from '@/shared/theme/palette';

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const PADDING_ITEMS = Math.floor(VISIBLE_ROWS / 2);
const BUTTON_BOTTOM_PADDING = 14;
const GRADIENT_HEIGHT = ITEM_HEIGHT * PADDING_ITEMS;

export interface MonthPickerValue {
  year: number;
  month: number;
}

interface MonthPickerBottomSheetProps {
  visible: boolean;
  initialValue?: MonthPickerValue;
  onConfirm: (value: MonthPickerValue) => void;
  onClose: () => void;
}

const yearOptions = Array.from({ length: 2030 - 2024 + 1 }, (_, i) => 2024 + i);
const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

const toPaddedItems = <T,>(items: T[]) => [
  ...Array(PADDING_ITEMS).fill(null),
  ...items,
  ...Array(PADDING_ITEMS).fill(null),
];

const WheelColumn = <T extends string | number>({
  items,
  value,
  onChange,
  formatItem,
}: {
  items: T[];
  value: T;
  onChange: (value: T) => void;
  formatItem?: (item: T) => string;
}) => {
  const data = useMemo(() => toPaddedItems(items), [items]);
  const listRef = useRef<FlatList<T | null>>(null);

  useEffect(() => {
    const index = items.indexOf(value);
    if (index >= 0) {
      listRef.current?.scrollToOffset({
        offset: index * ITEM_HEIGHT,
        animated: false,
      });
    }
  }, [items, value]);

  const handleMomentumEnd = (offsetY: number) => {
    const index = Math.round(offsetY / ITEM_HEIGHT) + PADDING_ITEMS;
    const item = data[index];
    if (item !== null && item !== undefined) {
      onChange(item);
    }
  };

  return (
    <View style={styles.wheelColumn}>
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(_, index) => `${index}`}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={event =>
          handleMomentumEnd(event.nativeEvent.contentOffset.y)
        }
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        renderItem={({ item }) => {
          const isSelected = item === value;
          return (
            <View style={styles.item}>
              {item === null ? null : (
                <Typo.Body
                  variant="body7"
                  color={isSelected ? 'gray1000' : 'gray400'}
                >
                  {formatItem ? formatItem(item) : item}
                </Typo.Body>
              )}
            </View>
          );
        }}
      />
    </View>
  );
};

export const MonthPickerBottomSheet = ({
  visible,
  initialValue,
  onConfirm,
  onClose,
}: MonthPickerBottomSheetProps) => {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const [year, setYear] = useState<number>(
    initialValue?.year ?? now.getFullYear(),
  );
  const [month, setMonth] = useState<number>(
    initialValue?.month ?? now.getMonth() + 1,
  );

  useEffect(() => {
    if (visible && initialValue) {
      setYear(initialValue.year);
      setMonth(initialValue.month);
    }
  }, [visible, initialValue]);

  const handleConfirm = () => {
    onConfirm({ year, month });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View>
          <View
            style={[
              styles.sheet,
              {
                paddingBottom: BUTTON_BOTTOM_PADDING,
              },
            ]}
          >
            <Typo.Display variant="display4" style={styles.display4}>
              조회할 날짜 선택
            </Typo.Display>
            <View style={styles.wheelRow}>
              <View style={styles.selectionOverlay} pointerEvents="none" />
              <LinearGradient
                colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
                locations={[0.15, 1]}
                style={styles.topFade}
                pointerEvents="none"
              />
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
                locations={[0, 0.85]}
                style={styles.bottomFade}
                pointerEvents="none"
              />
              <View style={styles.wheelContainer}>
                <WheelColumn
                  items={yearOptions}
                  value={year}
                  onChange={setYear}
                  formatItem={item => `${item}년`}
                />
                <WheelColumn
                  items={monthOptions}
                  value={month}
                  onChange={setMonth}
                  formatItem={item => `${item}월`}
                />
              </View>
            </View>
            <View style={styles.buttonRow}>
              <Button title="확인" onPress={handleConfirm} />
            </View>
          </View>
          <View style={[styles.bottomFill, { height: insets.bottom }]} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.gray0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 14,
  },
  display4: {
    color: palette.gray1000,
  },
  wheelRow: {
    marginTop: 8,
    height: ITEM_HEIGHT * VISIBLE_ROWS,
    position: 'relative',
  },
  wheelContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 30,
  },
  wheelColumn: {
    flex: 1,
    height: ITEM_HEIGHT * VISIBLE_ROWS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionOverlay: {
    position: 'absolute',
    top: ITEM_HEIGHT * PADDING_ITEMS,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    backgroundColor: palette.gray50,
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: GRADIENT_HEIGHT,
    zIndex: 1,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: GRADIENT_HEIGHT,
    zIndex: 1,
  },
  buttonRow: {
    marginTop: 20,
  },
  bottomFill: {
    backgroundColor: palette.gray0,
  },
});
