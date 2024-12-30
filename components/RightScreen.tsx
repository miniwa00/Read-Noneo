import { View, StyleSheet, TouchableOpacity, Platform, RefreshControl, FlatList, ActivityIndicator, BackHandler } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, writeBatch, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '@/firebase/config';
import Animated, { 
  useSharedValue, 
  withTiming, 
  useAnimatedStyle,
  Easing 
} from 'react-native-reanimated';
import EditScreen from '@/components/EditScreen';

interface RightScreenProps {
  onClose: () => void;
}

interface Memo {
  title: string;
  id: string;
  createdAt: string;
  sentence: string;
  content: string;
}

interface MemoCardProps {
  memo: Memo;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: (memo: Memo) => void;
  isSelectMode: boolean;
  isSelected: boolean;
  onSelect: (memo: Memo) => void;
  onLongPress: () => void;
}

const MemoCard = ({ 
  memo, 
  isOpen, 
  onToggle, 
  onEdit,
  isSelectMode,
  isSelected,
  onSelect,
  onLongPress 
}: MemoCardProps) => {
  const animatedHeight = useSharedValue(0);
  
  useEffect(() => {
    animatedHeight.value = withTiming(isOpen ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isOpen]);

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: animatedHeight.value * 500,
    opacity: animatedHeight.value,
  }));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <View style={[
      styles.cardContainer,
      isSelected && styles.cardContainerSelected
    ]}>
      <TouchableOpacity 
        style={styles.cardHeader}
        onPress={() => isSelectMode ? onSelect(memo) : onToggle()}
        onLongPress={onLongPress}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <View style={styles.cardTitleContainer}>
          {isSelectMode && (
            <View style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected
            ]}>
              {isSelected && (
                <IconSymbol name="checkmark" size={16} color="#3D2645" />
              )}
            </View>
          )}
          <ThemedText style={styles.cardTitle}>{memo.title}</ThemedText>
        </View>
        <View style={styles.cardHeaderRight}>
          <ThemedText style={styles.cardDate}>{formatDate(memo.createdAt)}</ThemedText>
          <IconSymbol 
            name={isOpen ? "chevron.up" : "chevron.down"}
            size={16}
            color="#FFFFFF"
            style={styles.cardArrow}
          />
        </View>
      </TouchableOpacity>
      
      <Animated.View style={[styles.cardContent, animatedStyle]}>
        <View style={styles.cardBody}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionLabel}>논어 구절</ThemedText>
            </View>
            <ThemedText style={styles.sectionContent}>{memo.sentence}</ThemedText>
          </View>
          <View style={styles.sectionContainer}>
            <ThemedText style={styles.sectionLabel}>메모</ThemedText>
            <ThemedText style={styles.sectionContent}>{memo.content}</ThemedText>
          </View>
          <View style={styles.editButtonContainer}>
            <TouchableOpacity 
              style={styles.editCardButton}
              onPress={() => onEdit(memo)}
            >
              <ThemedText style={styles.editCardButtonText}>수정</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default function RightScreen({ onClose }: RightScreenProps) {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [openMemoId, setOpenMemoId] = useState<string | null>(null);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMemos, setSelectedMemos] = useState<Set<string>>(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isUnmounting, setIsUnmounting] = useState(false);

  const ITEMS_PER_PAGE = 20;

  const fetchMemos = async (loadMore = false) => {
    console.log(`\n[${new Date().toLocaleString()}] fetchMemos 함수 호출`);
    if (isLoading || isUnmounting) {
      console.log(`isLoading || isUnmounting`);
      return;
    }
    if (loadMore && !hasMore) {
      console.log(`loadMore && !hasMore`);
      return;
    }
  
    try {
      setIsLoading(true);
      const userId = 'user1';
      const memosRef = collection(db, 'app/memos', userId);
  
      let memosQuery;
      if (loadMore && lastVisible) {
        memosQuery = query(
          memosRef,
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(ITEMS_PER_PAGE)
        );
      } else if (!loadMore) {
        // console.log(`[${new Date().toLocaleString()}] 처음부터 로드`);
        memosQuery = query(
          memosRef,
          orderBy('createdAt', 'desc'),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        // console.warn(`[${new Date().toLocaleString()}] lastVisible 값이 유효하지 않아 데이터를 처음부터 로드하지 않습니다.`);
        return;
      }
  
      const querySnapshot = await getDocs(memosQuery);
      console.log(`getDocs 트래픽 발생`);
      const fetchedMemos: Memo[] = [];
  
      querySnapshot.forEach((doc) => {
        fetchedMemos.push({
          id: doc.id,
          ...doc.data(),
        } as Memo);
      });
  
      const hasNextPage = fetchedMemos.length === ITEMS_PER_PAGE;
      if (loadMore) {
        console.log(`더 불러오기`);
        setMemos((prev) => [...prev, ...fetchedMemos]);
      } else {
        console.log(`처음부터 로드`);
        setMemos(fetchedMemos);
      }
  
      if (fetchedMemos.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        console.log(`lastVisible 값이 유효하게 설정되었습니다.`);
      } else {
        console.log(`더 로드할 데이터가 없습니다.`);
        setLastVisible(null);
      }
  
      setHasMore(hasNextPage);
    } catch (error) {
      console.error('메모 목록 가져오기 실패:', error);
    } finally {
      // console.log(`[${new Date().toLocaleString()}] 끝났습니다.`);
      setIsLoading(false);
    }
  };

  // 화면을 나갈 때 상태 초기화
  const handleClose = () => {
    setIsUnmounting(true);
    // 상태 초기화
    setMemos([]);
    setOpenMemoId(null);
    setEditingMemo(null);
    setLastVisible(null);
    setHasMore(true);
    setIsSelectMode(false);
    setSelectedMemos(new Set());
    
    onClose();
  };

  // 초기 로딩
  useEffect(() => {
    if (!isUnmounting) {
      fetchMemos();
      setIsInitialLoad(false);
    }

    return () => {
      setIsUnmounting(true);
    };
  }, []);

  // 새로고침
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setLastVisible(null);
      setHasMore(true);
      await fetchMemos();
    } catch (error) {
      console.error('새로고침 실패:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 더 불러오기
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && !isInitialLoad) {
      fetchMemos(true);
    }
  }, [isLoading, hasMore, isInitialLoad]);

  const handleEdit = (memo: Memo) => {
    setEditingMemo(memo);
  };

  const handleUpdate = (updatedMemo: Memo) => {
    setMemos(memos.map(memo => 
      memo.id === updatedMemo.id ? updatedMemo : memo
    ));
    setEditingMemo(null);
  };

  const handleLongPress = () => {
    setIsSelectMode(true);
  };

  const handleSelect = (memo: Memo) => {
    setSelectedMemos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memo.id)) {
        newSet.delete(memo.id);
      } else {
        newSet.add(memo.id);
      }
      return newSet;
    });
  };

  const handleDelete = async () => {
    try {
      const userId = 'user1';
      const batch = writeBatch(db);
      
      // 선택된 모든 메모를 batch로 삭제
      selectedMemos.forEach(memoId => {
        const memoRef = doc(db, 'app/memos', userId, memoId);
        batch.delete(memoRef);
      });
      
      await batch.commit();
      
      // 로컬 상태 업데이트
      setMemos(prevMemos => 
        prevMemos.filter(memo => !selectedMemos.has(memo.id))
      );
      
      // 선택 모드 초기화
      setSelectedMemos(new Set());
      setIsSelectMode(false);
    } catch (error) {
      console.error('메모 삭제 중 오류 발생:', error);
    }
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#00FF9D" />
      </View>
    );
  };

  // 하드웨어 백 버튼 처리
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => backHandler.remove();
  }, [onClose]);

  const handleBackPress = () => {
    if (isSelectMode) {
      // 선택 모드일 때는 선택 모드를 취소하고 선택된 메모들을 초기화
      setIsSelectMode(false);
      setSelectedMemos(new Set());
    } else {
      // 일반 모드일 때는 화면을 닫음
      handleClose();
    }
  };

  return (
    <View style={styles.container}>
      {editingMemo ? (
        <EditScreen
          memo={editingMemo}
          onClose={() => setEditingMemo(null)}
          onUpdate={handleUpdate}
        />
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              {isSelectMode ? (
                <ThemedText style={styles.cancelText}>취소</ThemedText>
              ) : (
                <>
                  <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
                  <ThemedText style={styles.backText}>뒤로</ThemedText>
                </>
              )}
            </TouchableOpacity>
            {isSelectMode && (
              <TouchableOpacity 
                style={[
                  styles.deleteButton,
                  selectedMemos.size === 0 && styles.deleteButtonDisabled
                ]}
                onPress={handleDelete}
                disabled={selectedMemos.size === 0}
              >
                <ThemedText style={[
                  styles.deleteText,
                  selectedMemos.size === 0 && styles.deleteTextDisabled
                ]}>
                  삭제
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
          <ThemedText style={styles.title}>메모 목록</ThemedText>
          
          <FlatList
            data={memos}
            renderItem={({ item }) => (
              <MemoCard
                key={`memo-${item.id}`}
                memo={item}
                isOpen={openMemoId === item.id}
                onToggle={() => setOpenMemoId(openMemoId === item.id ? null : item.id)}
                onEdit={handleEdit}
                isSelectMode={isSelectMode}
                isSelected={selectedMemos.has(item.id)}
                onSelect={handleSelect}
                onLongPress={handleLongPress}
              />
            )}
            keyExtractor={item => `memo-${item.id}`}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#00FF9D"
                colors={['#00FF9D']}
                progressBackgroundColor="#2A1B30"
                progressViewOffset={20}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            windowSize={10}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3D2645',
  },
  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 4,
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
    lineHeight: 36,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cardContainer: {
    backgroundColor: '#2A1B30',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  cardDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  cardArrow: {
    opacity: 0.8,
  },
  cardContent: {
    overflow: 'hidden',
  },
  cardBody: {
    padding: 16,
    paddingTop: 0,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#00FF9D',
    marginRight: 8,
  },
  sectionContent: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  editButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -4,
    marginRight: -2,
  },
  editCardButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 255, 157, 0.1)',
  },
  editCardButtonText: {
    color: '#00FF9D',
    fontSize: 14,
    fontWeight: '600',
  },
  cardContainerSelected: {
    backgroundColor: '#4D3655',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#00FF9D',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#00FF9D',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteTextDisabled: {
    color: 'rgba(255, 59, 48, 0.5)',
  },
  listContent: {
    padding: 20,
  },
  loaderContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
}); 