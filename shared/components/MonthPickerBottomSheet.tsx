import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typo } from './typo/Typo';

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const PADDING_ITEMS = Math.floor(VISIBLE_ROWS / 2);

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
  scrollKey,
}: {
  items: T[];
  value: T;
  onChange: (value: T) => void;
  formatItem?: (item: T) => string;
  scrollKey?: number;
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
  }, [items, value, scrollKey]);

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
                  style={{ color: isSelected ? '#1B1C20' : '#ABAFBB' }}
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
  const [scrollKey, setScrollKey] = useState(0);

  useEffect(() => {
    if (visible && initialValue) {
      setYear(initialValue.year);
      setMonth(initialValue.month);
      setScrollKey(prev => prev + 1);
    }
  }, [visible, initialValue]);

  const handleConfirm = () => {
    onConfirm({ year, month });
  };

  const handleToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
    setScrollKey(prev => prev + 1);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View>
          <View style={styles.sheet}>
            <Typo.Display variant="display4" style={{ color: '#212124' }}>
              날짜 선택
            </Typo.Display>
            <View style={styles.wheelRow}>
              <View style={styles.selectionOverlay} pointerEvents="none" />
              <View style={styles.wheelContainer}>
                <WheelColumn
                  items={yearOptions}
                  value={year}
                  onChange={setYear}
                  formatItem={item => `${item}년`}
                  scrollKey={scrollKey}
                />
                <WheelColumn
                  items={monthOptions}
                  value={month}
                  onChange={setMonth}
                  formatItem={item => `${item}월`}
                  scrollKey={scrollKey}
                />
              </View>
            </View>
            <View style={styles.buttonRow}>
              <Pressable style={styles.todayButton} onPress={handleToday}>
                <Typo.Body variant="body1" style={{ color: '#6B7684' }}>
                  오늘
                </Typo.Body>
              </Pressable>
              <Pressable style={styles.confirmButton} onPress={handleConfirm}>
                <Typo.Body variant="body1" style={{ color: '#FFFFFF' }}>
                  확인
                </Typo.Body>
              </Pressable>
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
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
    borderRadius: 4,
    backgroundColor: '#F2F3F6',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  todayButton: {
    width: 80,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F3F6',
    borderRadius: 6,
  },
  confirmButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#293038',
    borderRadius: 6,
  },
  bottomFill: {
    backgroundColor: '#FFFFFF',
  },
});
