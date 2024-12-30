import { StyleSheet, Platform, TouchableOpacity, Dimensions, BackHandler, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useState, useEffect } from 'react';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AtomAnimation from '@/components/AtomAnimation';
import NoneoScreen from '@/components/NoneoScreen';
import LeftScreen from '@/components/LeftScreen';
import RightScreen from '@/components/RightScreen';
import { useRouter } from 'expo-router';

const { height, width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [showGame, setShowGame] = useState(false);
  const [showLeftScreen, setShowLeftScreen] = useState(false);
  const [showRightScreen, setShowRightScreen] = useState(false);
  const slideAnim = useSharedValue(height);
  const leftSlideAnim = useSharedValue(-width);
  const rightSlideAnim = useSharedValue(width);
  const atomOpacity = useSharedValue(1);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showGame) {
        handleBack();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [showGame]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: slideAnim.value }],
    };
  });

  const leftScreenStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: leftSlideAnim.value }],
    };
  });

  const rightScreenStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: rightSlideAnim.value }],
    };
  });

  const atomAnimatedStyle = useAnimatedStyle(() => ({
    opacity: atomOpacity.value,
  }));

  const handleStart = () => {
    setShowGame(true);
    slideAnim.value = withSpring(0, {
      damping: 20,
      stiffness: 90,
    });
  };

  const handleBack = () => {
    slideAnim.value = withSpring(height, {
      damping: 20,
      stiffness: 90,
    });
    setTimeout(() => {
      setShowGame(false);
    }, 300);
  };

  const handleLeftScreenOpen = () => {
    setShowLeftScreen(true);
    leftSlideAnim.value = withTiming(0, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  };

  const handleLeftScreenClose = () => {
    leftSlideAnim.value = withTiming(-width, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    setTimeout(() => {
      setShowLeftScreen(false);
    }, 300);
  };

  const handleRightScreenOpen = () => {
    setShowRightScreen(true);
    rightSlideAnim.value = withSpring(0, {
      damping: 20,
      stiffness: 90,
    });
  };

  const handleRightScreenClose = () => {
    rightSlideAnim.value = withSpring(width, {
      damping: 20,
      stiffness: 90,
    });
    setTimeout(() => setShowRightScreen(false), 300);
  };

  return (
    <ThemedView style={styles.container}>
      {!showGame ? (
        <>
          <ThemedText type="title" style={styles.title}>
            힘들 땐{'\n'}논어를 읽어요
          </ThemedText>
          <Animated.View style={atomAnimatedStyle}>
            <AtomAnimation />
          </Animated.View>
          <View style={styles.bottomButtonContainer}>
            <View style={styles.arrowContainer}>
              <TouchableOpacity 
                style={styles.leftArrowButton}
                onPress={handleLeftScreenOpen}>
                <ThemedText style={styles.leftArrowText}>{'〈'}</ThemedText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.startButton}
              onPress={handleStart}>
              <ThemedText style={styles.startButtonText}>랜덤 구절 추천받기</ThemedText>
            </TouchableOpacity>
            <View style={styles.arrowContainer}>
              <TouchableOpacity 
                style={styles.rightArrowButton}
                onPress={handleRightScreenOpen}>
                <ThemedText style={styles.rightArrowText}>{'〉'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <Animated.View style={[styles.gameContainer, animatedStyle]}>
          <NoneoScreen onBack={handleBack} />
        </Animated.View>
      )}

      {showLeftScreen && (
        <Animated.View style={[styles.sideScreen, leftScreenStyle]}>
          <LeftScreen onClose={handleLeftScreenClose} />
        </Animated.View>
      )}

      {showRightScreen && (
        <Animated.View style={[styles.sideScreen, rightScreenStyle]}>
          <RightScreen onClose={handleRightScreenClose} />
        </Animated.View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 100,
    backgroundColor: '#3D2645',
    paddingVertical: 60,
  },
  title: {
    fontSize: 30,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 48,
  },
  startButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  startButtonText: {
    color: '#00FF9D',
    fontSize: 22,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: 'bold',
    lineHeight: 50,
  },
  gameContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#3D2645',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  atomContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#3D2645',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'ios' ? 60 : 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 4,
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  arrowContainer: {
    width: 50,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftArrowButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 100,
    overflow: 'hidden',
  },
  leftArrowText: {
    fontSize: 50,
    color: 'rgba(255, 255, 255, 0.1)',
    fontWeight: '500',
    lineHeight: 100,
    textAlign: 'center',
    marginVertical: 'auto'
  },
  rightArrowButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 100,
    overflow: 'hidden',
  },
  rightArrowText: {
    fontSize: 50,
    color: 'rgba(255, 255, 255, 0.1)',
    fontWeight: '500',
    lineHeight: 100,
    textAlign: 'center',
  },
});
