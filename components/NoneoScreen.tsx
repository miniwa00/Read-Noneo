import { View, StyleSheet, TouchableOpacity,  SafeAreaView, ScrollView, TextInput, Keyboard } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Animated, { 
  useAnimatedStyle, 
  withSequence,
  withTiming,
  withSpring,
  useSharedValue,
  FadeIn,
} from 'react-native-reanimated';
import { useEffect, useState, useCallback, useRef } from 'react';
import { db } from '@/firebase/config';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { Animated as RNAnimated } from 'react-native';

const emotions = [
  '행복할',
  '기쁠',
  '우울할',
  '슬플',
  '화날',
  '괴로울',
  '힘들',
  '희망찰',
  '감사할'
];

interface GameScreenProps {
  onBack: () => void;
}

interface ExplanationAccordionProps {
  isOpen: boolean;
  onToggle: () => void;
  explanation: string;
}

const ExplanationAccordion = ({ isOpen, onToggle, explanation }: ExplanationAccordionProps) => {
  const animatedHeight = useRef(new RNAnimated.Value(0)).current;
  
  useEffect(() => {
    RNAnimated.timing(animatedHeight, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  return (
    <View style={styles.explanationContainer}>
      <TouchableOpacity 
        style={styles.explanationHeader}
        onPress={onToggle}
      >
        <ThemedText style={styles.explanationTitle}>해설</ThemedText>
        <IconSymbol 
          name={isOpen ? "chevron.up" : "chevron.down"}
          size={16}
          color="#FFFFFF"
          style={styles.explanationArrow}
        />
      </TouchableOpacity>
      
      <RNAnimated.View style={[
        styles.explanationContent,
        {
          maxHeight: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1000]
          }),
          opacity: animatedHeight
        }
      ]}>
        <ThemedText style={styles.explanationText}>{explanation}</ThemedText>
      </RNAnimated.View>
    </View>
  );
};

// Fisher-Yates 셔플 알고리즘을 위한 유틸리티 함수
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function GameScreen({ onBack }: GameScreenProps) {
  const contentTranslateY = useSharedValue(0);

  const [currentEmotion, setCurrentEmotion] = useState(emotions[0]);
  const [currentChapter, setCurrentChapter] = useState('');
  const [currentKoreanSentence, setCurrentKoreanSentence] = useState('');
  const [currentChineseSentence, setCurrentChineseSentence] = useState('');
  const [currentCommentary, setCurrentCommentary] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const opacity = useSharedValue(1);
  const emotionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const headerPositionY = useSharedValue(-75);
  const headerOpacity = useSharedValue(1);
  const contentOpacity = useSharedValue(0);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [shuffledEmotions, setShuffledEmotions] = useState<string[]>([]);
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const inputSlideAnim = useSharedValue(100);
  const fabScale = useSharedValue(0);
  const fabRotate = useSharedValue(0);
  const submitButtonRotate = useSharedValue(0);
  const submitButtonScale = useSharedValue(1);
  const inputRef = useRef<TextInput>(null);
  const [titleText, setTitleText] = useState('');
  const titleBorderColor = useSharedValue('#3D2645');

  const getRandomSentence = async () => {
    try {
      const sentencesDocRef = doc(db, 'noneo_book', 'sentences');
      const commentaryDocRef = doc(db, 'noneo_book', 'commentary');
      const sentencesDocSnapshot = await getDoc(sentencesDocRef);
      const commentaryDocSnapshot = await getDoc(commentaryDocRef);
      
      if (sentencesDocSnapshot.exists() && commentaryDocSnapshot.exists()) {
        const sentencesData = sentencesDocSnapshot.data();
        const commentaryData = commentaryDocSnapshot.data();
        const keys = Object.keys(sentencesData['sentences']);
        const randomKey: string = keys[Math.floor(Math.random() * keys.length)];
        const randomKoreanSentence = sentencesData["sentences"][randomKey]["kor_text"];
        const randomChineseSentence = sentencesData["sentences"][randomKey]["chn_text"];
        const randomChapter = sentencesData["sentences"][randomKey]["chapter"];
        const commentary = commentaryData[randomKey];
        console.log(commentary);
        setCurrentKoreanSentence(randomKoreanSentence);
        setCurrentChineseSentence(randomChineseSentence);
        setCurrentChapter(randomChapter);
        setCurrentCommentary(commentary);
        setIsLoaded(true);
        
        contentOpacity.value = withTiming(1, {
          duration: 500,
        });
      } else {
        console.error('문서를 찾을 수 없습니다!');
        setIsLoaded(false);
      }
    } catch (error) {
      console.error('문장을 가져오는 중 에러 발생!');
      setIsLoaded(false);
      
    }
  };

  const initializeScreen = useCallback(() => {
    const newShuffledEmotions = shuffleArray(emotions);
    setShuffledEmotions(newShuffledEmotions);
    setCurrentEmotion(newShuffledEmotions[0]);
    setCurrentChapter('');
    setCurrentKoreanSentence('');
    setCurrentChineseSentence('');
    setCurrentCommentary('');
    setIsLoading(true);
    setIsLoaded(false);
    contentOpacity.value = 0;
    opacity.value = 1;
    headerOpacity.value = 1;
    headerPositionY.value = -75;

    if (emotionIntervalRef.current) {
      clearInterval(emotionIntervalRef.current);
    }
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }

    const changeEmotion = () => {
      opacity.value = withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(1, { duration: 500 })
      );
      
      setTimeout(() => {
        setCurrentEmotion((prevEmotion) => {
          const currentIndex = newShuffledEmotions.indexOf(prevEmotion);
          return newShuffledEmotions[(currentIndex + 1) % newShuffledEmotions.length];
        });
      }, 500);
    };
    
    emotionIntervalRef.current = setInterval(changeEmotion, 2000);
    loadingTimerRef.current = setTimeout(async () => {
      await getRandomSentence();
      setIsLoading(false);
      
      headerOpacity.value = withTiming(0, {
        duration: 500
      });
    }, 4000);
  }, []);

  useEffect(() => {
    initializeScreen();
    
    return () => {
      if (emotionIntervalRef.current) {
        clearInterval(emotionIntervalRef.current);
      }
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []); 

  const handleBack = () => {
    if (emotionIntervalRef.current) {
      clearInterval(emotionIntervalRef.current);
    }
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
    
    setCurrentEmotion("");
    setCurrentChapter('');
    setCurrentKoreanSentence('');
    setCurrentChineseSentence('');
    setCurrentCommentary('');
    setIsLoading(true);
    setIsLoaded(false);
    opacity.value = 1;
    
    onBack();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: headerPositionY.value }],
    opacity: headerOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const handleFabPress = () => {
    inputSlideAnim.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
      mass: 0.6,
    });
    setIsInputVisible(true);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  };

  const handleSubmit = async () => {
    if (!titleText.trim()) {
      titleBorderColor.value = withSequence(
        withTiming('#FF0000', { duration: 200 }),
        withTiming('#3D2645', { duration: 200 })
      );
      return;
    }

    submitButtonScale.value = withSequence(
      withSpring(0.8, { damping: 10, stiffness: 200 }),
      withSpring(1.2, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    submitButtonRotate.value = withSequence(
      withSpring(360, { damping: 10, stiffness: 100 }),
      withTiming(0, { duration: 0 })
    );

    try {
      const userId = 'user1';
      const memoCollectionRef = collection(db, 'app/memos', userId);
      
      await addDoc(memoCollectionRef, {
        title: titleText,
        createdAt: new Date().toISOString(),
        sentence: currentKoreanSentence,
        content: inputText,
      });

      setTitleText('');
      setInputText('');
      hideInput();
    } catch (error) {
      console.error('메모 저장 중 오류 발생:', error);
    }
  };

  const hideInput = () => {
    Keyboard.dismiss();
    
    setIsInputVisible(false);
    
    inputSlideAnim.value = withSpring(100, {
      damping: 15,
      stiffness: 150,
      mass: 0.6,
    });
  };

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: inputSlideAnim.value * 2 }],
  }));

  const showFabAnimation = () => {
    fabScale.value = 0;
    fabRotate.value = 0;
    
    setTimeout(() => {
      fabScale.value = withSpring(1, {
        damping: 10,
        stiffness: 80,
      });
      fabRotate.value = withSpring(720, {
        damping: 12,
        stiffness: 100,
      });
    }, 1000);  
  };

  useEffect(() => {
    if (!isLoading) {
      showFabAnimation();
    }
  }, [isLoading]);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value },
      { rotate: `${fabRotate.value}deg` }
    ]
  }));

  const submitButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: submitButtonScale.value },
      { rotate: `${submitButtonRotate.value}deg` }
    ]
  }));

  const titleInputStyle = useAnimatedStyle(() => ({
    borderColor: titleBorderColor.value,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
            <ThemedText style={styles.backText}>뒤로</ThemedText>
          </TouchableOpacity>
        </View>
        
        <View style={styles.mainContainer}>
          <Animated.View style={[
            styles.contentWrapper,
            !isLoading && contentAnimatedStyle
          ]}>
            <View style={[
              styles.textContainer,
              isLoading && styles.loadingContainer
            ]}>
              <Animated.View style={[
                styles.headerContainer,
                headerAnimatedStyle
              ]}>
                <Animated.View style={[styles.emotionContainer, animatedStyle]}>
                  <ThemedText style={styles.emotionText}>{currentEmotion}</ThemedText>
                  <ThemedText style={styles.emotionText}> 땐</ThemedText>
                </Animated.View>
                <ThemedText style={styles.appTitle}>논어를 읽어요</ThemedText>
              </Animated.View>

              {isLoading ? (
                <ThemedText style={styles.loadingText}>잠시만 기다려주세요...</ThemedText>
              ) : (
                <ScrollView 
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollViewContent}
                >
                  <Animated.View 
                    style={styles.sentenceContainer}
                  >
                    <Animated.View 
                      entering={FadeIn.duration(800)}
                      style={styles.chapterContainer}
                    >
                      <ThemedText style={styles.chapterText}>{currentChapter} 편</ThemedText>
                    </Animated.View>
                    
                    <Animated.View 
                      entering={FadeIn.duration(800).delay(200)}
                      style={styles.sentenceWrapper}
                    >
                      <ThemedText style={styles.sentenceText}>{currentChineseSentence}</ThemedText>
                    </Animated.View>
                    
                    <Animated.View 
                      entering={FadeIn.duration(800).delay(400)}
                      style={styles.sentenceWrapper}
                    >
                      <ThemedText style={styles.sentenceText}>{currentKoreanSentence}</ThemedText>
                    </Animated.View>
                    
                    <Animated.View 
                      entering={FadeIn.duration(800).delay(600)}
                    >
                      <ExplanationAccordion
                        isOpen={isExplanationOpen}
                        onToggle={() => setIsExplanationOpen(!isExplanationOpen)}
                        explanation={currentCommentary}
                      />
                    </Animated.View>
                  </Animated.View>
                </ScrollView>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Floating Action Button with Animation */}
        {!isLoading && (
          <Animated.View style={[styles.fab, fabAnimatedStyle]}>
            <TouchableOpacity 
              style={styles.fabButton}
              onPress={handleFabPress}
            >
              <ThemedText style={styles.fabText}>+</ThemedText>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Overlay and Input Form */}
        <Animated.View 
          style={[
            styles.overlayContainer,
            {
              pointerEvents: isInputVisible ? 'auto' : 'none',
              opacity: isInputVisible ? 1 : 0
            }
          ]}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={hideInput}
          />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.inputContainer, 
            inputAnimatedStyle,
            { display: isInputVisible ? 'flex' : 'none' }
          ]}
        >
          <View style={styles.inputWrapper}>
            <Animated.View style={[styles.titleInputContainer, titleInputStyle]}>
              <TextInput
                style={styles.titleInput}
                placeholder="제목을 입력하세요..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={titleText}
                onChangeText={setTitleText}
                maxLength={50}
              />
            </Animated.View>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="내용을 입력하세요..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <Animated.View style={[styles.submitButton, submitButtonAnimatedStyle]}>
              <TouchableOpacity 
                onPress={handleSubmit}
                style={styles.submitButtonInner}
              >
                <IconSymbol 
                  name="chevron.up"
                  size={20}
                  color="#3D2645"
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#3D2645',
  },
  container: {
    flex: 1,
    backgroundColor: '#3D2645',
  },
  header: {
    height: 60,
    paddingHorizontal: 16,
    justifyContent: 'center',
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
  contentWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    paddingTop: 30,
    paddingBottom: 10,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  emotionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  emotionText: {
    fontSize: 28,
    color: '#00FF9D',
    textAlign: 'center',
    lineHeight: 36,
  },
  appTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
    width: '100%',
  },
  sentenceText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 28,
    width: '100%',
    marginBottom: 8,
  },
  chapterText: {
    fontSize: 24,
    color: '#7AFFA7',
    textAlign: 'left',
    lineHeight: 32,
    width: '100%',
    marginBottom: 12,
    fontWeight: '500',
  },
  sentenceContainer: {
    width: '100%',
    minHeight: 100,
    paddingTop: 40,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: 25 }],
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.7,
  },
  chapterContainer: {
    width: '100%',
    marginBottom: 12,
  },
  sentenceWrapper: {
    width: '100%',
    marginBottom: 8,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingContainer: {
    justifyContent: 'center',
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  explanationContainer: {
    marginTop: 20,
    marginBottom: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  explanationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  explanationTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  explanationArrow: {
    opacity: 0.8,
    marginLeft: 8,
  },
  explanationContent: {
    overflow: 'hidden',
  },
  explanationText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    padding: 16,
    paddingTop: 0,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    zIndex: 1,
  },
  fabButton: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: '#00FF9D',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#3D2645',
    lineHeight: 28,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginTop: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  inputContainer: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: '#2A1B30',
    borderRadius: 20,
    padding: 20,
    zIndex: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  input: {
    width: '100%',
    minHeight: 120,
    maxHeight: 200,
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 60,
    backgroundColor: '#3D2645',
    borderRadius: 12,
    textAlignVertical: 'top',
  },
  submitButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    backgroundColor: 'transparent',  // 배경색 제거
  },
  submitButtonInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#00FF9D',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  titleInputContainer: {
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#2A1B30',
    borderColor: '#3D2645',
  },
  titleInput: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
}); 