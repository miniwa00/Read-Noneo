import { View, StyleSheet, TouchableOpacity, Platform, TextInput, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Animated, { 
  useSharedValue, 
  withTiming, 
  withSequence, 
  useAnimatedStyle,
  Easing 
} from 'react-native-reanimated';
import { BackHandler } from 'react-native';

interface Memo {
  id: string;
  title: string;
  createdAt: string;
  sentence: string;
  content: string;
}

interface EditScreenProps {
  memo: Memo;
  onClose: () => void;
  onUpdate: (updatedMemo: Memo) => void;
}

export default function EditScreen({ memo, onClose, onUpdate }: EditScreenProps) {
  const [title, setTitle] = useState(memo.title);
  const [content, setContent] = useState(memo.content);
  const titleBorderColor = useSharedValue('#2A1B30');
  const contentBorderColor = useSharedValue('#2A1B30');

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => backHandler.remove();
  }, [onClose]);

  const handleSave = async () => {
    let hasError = false;

    if (!title.trim()) {
      titleBorderColor.value = withSequence(
        withTiming('#FF0000', { 
          duration: 200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        withTiming('#2A1B30', {
          duration: 200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      );
      hasError = true;
    }

    if (!content.trim()) {
      contentBorderColor.value = withSequence(
        withTiming('#FF0000', { 
          duration: 200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        withTiming('#2A1B30', {
          duration: 200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      );
      hasError = true;
    }

    if (hasError) return;

    try {
      const userId = 'user1';
      const memoRef = doc(db, 'app/memos', userId, memo.id);
      
      await updateDoc(memoRef, {
        title: title,
        content: content
      });

      onUpdate({
        ...memo,
        title: title,
        content: content
      });
      onClose();
    } catch (error) {
      console.error('메모 수정 중 오류 발생:', error);
    }
  };

  const titleInputStyle = useAnimatedStyle(() => ({
    borderColor: titleBorderColor.value,
  }));

  const contentInputStyle = useAnimatedStyle(() => ({
    borderColor: contentBorderColor.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          <ThemedText style={styles.backText}>뒤로</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>논어 구절</ThemedText>
          <ThemedText style={styles.sentenceText}>{memo.sentence}</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>메모 제목</ThemedText>
          <Animated.View style={[styles.titleInputContainer, titleInputStyle]}>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="제목을 입력하세요..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              maxLength={50}
            />
          </Animated.View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>메모 내용</ThemedText>
          <Animated.View style={[styles.contentInputContainer, contentInputStyle]}>
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              multiline
              placeholder="메모 내용을 입력하세요..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
          </Animated.View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <ThemedText style={styles.saveButtonText}>저장하기</ThemedText>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'center',
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#00FF9D',
    marginBottom: 8,
  },
  sentenceText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  titleInputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#2A1B30',
    borderColor: '#2A1B30',
  },
  titleInput: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  contentInputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#2A1B30',
    borderColor: '#2A1B30',
  },
  contentInput: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveButton: {
    backgroundColor: '#00FF9D',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#3D2645',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 