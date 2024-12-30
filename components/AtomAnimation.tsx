import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

export default function AtomAnimation() {
  return (
    <View style={styles.atomContainer}>
      {/* 중심 원자핵 */}
      <View style={styles.nucleus}>
        <ThemedText style={styles.elementSymbol}>Kr</ThemedText>
        <ThemedText style={styles.atomicNumber}>36</ThemedText>
      </View>
      
      {/* 외부 원 */}
      <View style={styles.outerCircle} />
    </View>
  );
}

const styles = StyleSheet.create({
  atomContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nucleus: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4DA6FF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  elementSymbol: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  atomicNumber: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  outerCircle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
  },
}); 