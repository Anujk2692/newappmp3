import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
} from 'react-native-image-picker';
import {api, FaceIdentifyResult} from '../../api/client';
import {COLORS, SPACING} from '../../config';

export function IdentifyFaceScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<FaceIdentifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageResult = (pickerResult: ImagePickerResponse) => {
    if (pickerResult.didCancel || !pickerResult.assets?.[0]?.uri) return;
    setImageUri(pickerResult.assets[0].uri);
    setResult(null);
  };

  const identify = async () => {
    if (!imageUri) {
      Alert.alert('Required', 'Select or capture a photo first');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const response = await api.identifyFace(imageUri);
      if (response.success) {
        setResult(response.data);
      } else {
        Alert.alert('Failed', response.message || 'Identification failed');
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Check backend connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={['#0A2E28', COLORS.background]} style={styles.hero}>
        <Icon name="scan-circle" size={40} color={COLORS.face} />
        <Text style={styles.heroTitle}>Identify Person</Text>
        <Text style={styles.heroSub}>
          Finds the exact person among many — works with side angles and partial faces
        </Text>
      </LinearGradient>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => launchImageLibrary({mediaType: 'photo', quality: 0.85, maxWidth: 1280, maxHeight: 1280}, handleImageResult)}>
          <Icon name="images" size={22} color={COLORS.face} />
          <Text style={styles.actionText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => launchCamera({mediaType: 'photo', quality: 0.85, cameraType: 'front', maxWidth: 1280, maxHeight: 1280}, handleImageResult)}>
          <Icon name="camera" size={22} color={COLORS.face} />
          <Text style={styles.actionText}>Camera</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewWrap}>
        {imageUri ? (
          <Image source={{uri: imageUri}} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Icon name="person-circle-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.placeholderText}>No photo selected</Text>
          </View>
        )}
        {loading && (
          <View style={styles.scanOverlay}>
            <ActivityIndicator size="large" color={COLORS.face} />
            <Text style={styles.scanText}>Scanning face...</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.identifyBtn, (loading || !imageUri) && styles.identifyDisabled]}
        onPress={identify}
        disabled={loading || !imageUri}>
        <Icon name="scan" size={22} color={COLORS.background} />
        <Text style={styles.identifyText}>{loading ? 'Analyzing...' : 'Identify Person'}</Text>
      </TouchableOpacity>

      {result && (
        <LinearGradient
          colors={result.matched ? ['#0A3D32', '#0F0F14'] : ['#3D2A0A', '#0F0F14']}
          style={[styles.resultCard, result.matched ? styles.matchBorder : styles.noMatchBorder]}>
          <Icon
            name={result.matched ? 'checkmark-circle' : 'close-circle'}
            size={48}
            color={result.matched ? COLORS.success : COLORS.warning}
          />
          <Text style={styles.resultTitle}>
            {result.matched ? result.personName : 'Unknown Person'}
          </Text>
          <Text style={styles.resultSub}>
            {result.matched
              ? `Match confidence: ${result.confidence}% · gap ${result.matchGap ?? 0}% over next person`
              : `Best guess: ${result.confidence}% — not confident enough among registered people`}
          </Text>
          {result.facesScanned != null && result.facesScanned > 1 ? (
            <Text style={styles.facesScanned}>
              Scanned {result.facesScanned} faces in photo
            </Text>
          ) : null}
          <View style={styles.confidenceBarBg}>
            <View style={[styles.confidenceBar, {
              width: `${Math.min(100, result.confidence)}%`,
              backgroundColor: result.matched ? COLORS.success : COLORS.warning,
            }]} />
          </View>
          {result.candidates && result.candidates.length > 0 ? (
            <View style={styles.candidates}>
              <Text style={styles.candidatesTitle}>Top matches</Text>
              {result.candidates.map((c, index) => (
                <View key={c.personId} style={styles.candidateRow}>
                  <Text style={styles.candidateRank}>{index + 1}.</Text>
                  <Text style={styles.candidateName}>{c.personName}</Text>
                  <Text style={styles.candidateScore}>{c.confidence}%</Text>
                </View>
              ))}
            </View>
          ) : null}
        </LinearGradient>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  content: {paddingBottom: SPACING.xl},
  hero: {padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.md},
  heroTitle: {color: COLORS.text, fontSize: 22, fontWeight: '800', marginTop: SPACING.sm},
  heroSub: {color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs},
  actions: {flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.md},
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, padding: SPACING.md, borderRadius: 14,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.face,
  },
  actionText: {color: COLORS.face, fontWeight: '700'},
  previewWrap: {
    margin: SPACING.md, borderRadius: 20, overflow: 'hidden',
    height: 300, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  preview: {width: '100%', height: '100%'},
  previewPlaceholder: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  placeholderText: {color: COLORS.textMuted, marginTop: SPACING.sm},
  scanOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  scanText: {color: COLORS.text, marginTop: SPACING.sm, fontWeight: '600'},
  identifyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, marginHorizontal: SPACING.md,
    backgroundColor: COLORS.face, borderRadius: 16, padding: SPACING.md,
  },
  identifyDisabled: {opacity: 0.5},
  identifyText: {color: COLORS.background, fontWeight: '800', fontSize: 16},
  resultCard: {
    margin: SPACING.md, padding: SPACING.lg, borderRadius: 20,
    alignItems: 'center', borderWidth: 1,
  },
  matchBorder: {borderColor: COLORS.success},
  noMatchBorder: {borderColor: COLORS.warning},
  resultTitle: {color: COLORS.text, fontSize: 24, fontWeight: '800', marginTop: SPACING.sm},
  resultSub: {color: COLORS.textSecondary, marginTop: SPACING.xs, fontSize: 14, textAlign: 'center'},
  facesScanned: {color: COLORS.textMuted, marginTop: SPACING.xs, fontSize: 12},
  confidenceBarBg: {
    width: '100%', height: 8, borderRadius: 4,
    backgroundColor: COLORS.surfaceLight, marginTop: SPACING.lg, overflow: 'hidden',
  },
  confidenceBar: {height: '100%', borderRadius: 4},
  candidates: {
    width: '100%',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  candidatesTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  candidateRank: {color: COLORS.textMuted, width: 24, fontWeight: '700'},
  candidateName: {flex: 1, color: COLORS.text, fontWeight: '600'},
  candidateScore: {color: COLORS.face, fontWeight: '700'},
});
