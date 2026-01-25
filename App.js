import { StyleSheet, View, StatusBar } from 'react-native';
import { Provider as PaperProvider, Appbar, MD3DarkTheme } from 'react-native-paper';
import RadioBrowserScreen from './components/RadioBrowserScreen';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Add custom color overrides if needed
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Appbar.Header elevated>
          <Appbar.Content title="Ushki Radio" />
        </Appbar.Header>
        <View style={styles.content}>
          <RadioBrowserScreen />
        </View>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
  },
});

