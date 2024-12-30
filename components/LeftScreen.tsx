import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface LeftScreenProps {
  onClose: () => void;
}

export default function LeftScreen({ onClose }: LeftScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          <ThemedText style={styles.backText}>뒤로</ThemedText>
        </TouchableOpacity>
      </View>
      <ThemedText style={styles.title}>왼쪽 화면</ThemedText>
      {/* 여기에 왼쪽 화면의 컨텐츠를 추가하세요 */}
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
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 40,
  },
}); 