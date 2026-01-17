import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ExternalLink } from './ExternalLink';
import { MonoText } from './StyledText';
import { useTheme } from '@/contexts/ThemeContext';

export default function EditScreenInfo({ path }: { path: string }) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <View style={styles.getStartedContainer}>
        <Text style={styles.getStartedText}>
          Open up the code for this screen:
        </Text>

        <View style={[styles.codeHighlightContainer, styles.homeScreenFilename]}>
          <MonoText>{path}</MonoText>
        </View>

        <Text style={styles.getStartedText}>
          Change any of the text, save the file, and your app will automatically update.
        </Text>
      </View>

      <View style={styles.helpContainer}>
        <ExternalLink
          style={styles.helpLink}
          href="https://docs.expo.io/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet">
          <Text style={styles.helpLinkText}>
            Tap here if your app doesn't automatically update after making changes
          </Text>
        </ExternalLink>
      </View>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
  },
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
  codeHighlightContainer: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 4,
  },
  getStartedText: {
    color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  helpContainer: {
    marginTop: 15,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: 15,
  },
  helpLinkText: {
    color: theme.colors.primary,
    textAlign: 'center',
  },
});
