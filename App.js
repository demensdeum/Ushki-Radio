import { StyleSheet, View, StatusBar } from 'react-native';
import { Provider as PaperProvider, Appbar } from 'react-native-paper';
import RadioBrowserScreen from './components/RadioBrowserScreen';

export default function App() {
  return (
    <PaperProvider>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
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
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
});
