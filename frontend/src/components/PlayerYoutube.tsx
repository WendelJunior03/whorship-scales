import React from 'react';
import { Image, Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { radius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Player de vídeo do YouTube (spec 08, D-08.2). Web-first: embed via IFrame API. No nativo,
 * mostra a thumbnail e abre o vídeo no app/navegador (wrapper nativo fica pra fase nativa).
 */
export function PlayerYoutube({ videoId }: { videoId: string }) {
  const { colors } = useTheme();
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webWrap}>
        {React.createElement('iframe', {
          src: `https://www.youtube.com/embed/${videoId}`,
          width: '100%',
          height: '100%',
          style: { border: 0 },
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowFullScreen: true,
          title: 'YouTube',
        })}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.thumbWrap}
      activeOpacity={0.85}
      onPress={() => Linking.openURL(`https://youtu.be/${videoId}`)}
    >
      <Image
        source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
        style={styles.thumb}
        resizeMode="cover"
      />
      <View style={styles.play}>
        <Icon name="play" size={26} color={colors.textInverse} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  webWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  thumbWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    ...StyleSheet.absoluteFillObject,
  },
  play: {
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
