import { Text, TextProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export function MonoText(props: TextProps) {
  const { theme } = useTheme();

  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: 'SpaceMono',
          color: theme.colors.text
        },
        props.style
      ]}
    />
  );
}
