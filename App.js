import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { Provider as PaperProvider, Appbar, MD3DarkTheme, BottomNavigation, Text, Surface, IconButton, ActivityIndicator, Divider } from 'react-native-paper';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RadioBrowserScreen from './components/RadioBrowserScreen';
import FavoritesScreen from './components/FavoritesScreen';
import FavoritesService from './components/FavoritesService';
import i18n from './i18n';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
  },
};

const LAST_STATION_KEY = '@ushki_last_station';
const VOLUME_KEY = '@ushki_volume';

export default function App() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'search', title: i18n.t('search'), focusedIcon: 'magnify', unfocusedIcon: 'magnify' },
    { key: 'favorites', title: i18n.t('favorites'), focusedIcon: 'heart', unfocusedIcon: 'heart-outline' },
  ]);

  // Global Playback State
  const [sound, setSound] = useState(null);
  const [currentStation, setCurrentStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [volume, setVolume] = useState(1.0);

  // Global Favorites State
  const [favorites, setFavorites] = useState(new Set());

  const loadFavorites = useCallback(async () => {
    const favs = await FavoritesService.getFavorites();
    setFavorites(new Set(favs.map(f => f.stationuuid)));
  }, []);

  const loadSettingsSource = useCallback(async () => {
    try {
      const savedStation = await AsyncStorage.getItem(LAST_STATION_KEY);
      if (savedStation) {
        setCurrentStation(JSON.parse(savedStation));
      }
      const savedVolume = await AsyncStorage.getItem(VOLUME_KEY);
      if (savedVolume !== null) {
        setVolume(parseFloat(savedVolume));
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
    loadSettingsSource();
  }, [loadFavorites, loadSettingsSource]);

  const toggleFavorite = async (station) => {
    const isFav = favorites.has(station.stationuuid);
    if (isFav) {
      await FavoritesService.removeFavorite(station.stationuuid);
      favorites.delete(station.stationuuid);
    } else {
      await FavoritesService.saveFavorite(station);
      favorites.add(station.stationuuid);
    }
    setFavorites(new Set(favorites));
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playStation = async (station) => {
    try {
      setIsAudioLoading(true);
      if (currentStation?.stationuuid === station.stationuuid && sound) {
        await togglePlayback();
        return;
      }
      if (sound) {
        await sound.unloadAsync();
      }
      setCurrentStation(station);
      setIsPlaying(true);

      // Save last played station
      await AsyncStorage.setItem(LAST_STATION_KEY, JSON.stringify(station));

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: station.url_resolved },
        { shouldPlay: true, volume: volume }
      );
      setSound(newSound);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsAudioLoading(false);
          setIsPlaying(status.isPlaying);
        }
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
        if (status.error) {
          console.error(`Playback error: ${status.error}`);
          setIsAudioLoading(false);
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing station:', error);
      setIsAudioLoading(false);
      setIsPlaying(false);
    }
  };

  const togglePlayback = async () => {
    // If we have a current station but no sound (e.g. from app restart), load it first
    if (!sound && currentStation) {
      await playStation(currentStation);
      return;
    }

    if (!sound) return;
    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const stopPlayback = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    setSound(null);
    setCurrentStation(null);
    setIsPlaying(false);
    setIsAudioLoading(false);

    // Clear last played station
    await AsyncStorage.removeItem(LAST_STATION_KEY);
  };

  const onVolumeChange = async (value) => {
    setVolume(value);
    if (sound) {
      await sound.setVolumeAsync(value);
    }
    try {
      await AsyncStorage.setItem(VOLUME_KEY, value.toString());
    } catch (e) {
      console.error('Error saving volume:', e);
    }
  };


  const isCurrentStationFav = currentStation && favorites.has(currentStation.stationuuid);

  return (
    <PaperProvider theme={theme}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Appbar.Header elevated>
          <Appbar.Content title={i18n.t('app_name')} />
        </Appbar.Header>

        <View style={styles.content}>
          <BottomNavigation
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            renderScene={({ route }) => {
              switch (route.key) {
                case 'search':
                  return (
                    <RadioBrowserScreen
                      playStation={playStation}
                      currentStation={currentStation}
                      isPlaying={isPlaying}
                      isAudioLoading={isAudioLoading}
                      favorites={favorites}
                      toggleFavorite={toggleFavorite}
                    />
                  );
                case 'favorites':
                  return (
                    <FavoritesScreen
                      playStation={playStation}
                      currentStation={currentStation}
                      isPlaying={isPlaying}
                      isAudioLoading={isAudioLoading}
                      toggleFavorite={toggleFavorite}
                      favorites={favorites}
                    />
                  );
                default:
                  return null;
              }
            }}
            barStyle={{ backgroundColor: theme.colors.elevation.level2 }}
          />
        </View>

        {currentStation && (
          <Surface style={[styles.bottomPanel, { backgroundColor: theme.colors.surfaceVariant }]} elevation={4}>
            <View style={styles.bottomPanelContent}>
              <View style={styles.stationInfo}>
                <Text numberOfLines={1} style={styles.panelTitle}>{currentStation.name}</Text>
                <Text numberOfLines={1} style={styles.panelSubtitle}>{currentStation.country || i18n.t('unknown')}</Text>
              </View>
              <View style={styles.panelActions}>
                <Slider
                  style={styles.volumeSlider}
                  minimumValue={0}
                  maximumValue={1}
                  value={volume}
                  onValueChange={onVolumeChange}
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor="rgba(255,255,255,0.2)"
                  thumbTintColor={theme.colors.primary}
                />
                <IconButton
                  icon={isCurrentStationFav ? "heart" : "heart-outline"}
                  iconColor={isCurrentStationFav ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  size={24}
                  onPress={() => toggleFavorite(currentStation)}
                />
                <Divider style={styles.actionDivider} horizontal />
                {isAudioLoading ? (
                  <ActivityIndicator style={styles.panelLoader} />
                ) : (
                  <IconButton
                    icon={isPlaying ? "stop" : "play"}
                    size={28}
                    onPress={togglePlayback}
                  />
                )}
              </View>
            </View>
          </Surface>
        )}
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
  bottomPanel: {
    position: 'absolute',
    bottom: 80, // Above bottom navigation
    left: 8,
    right: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
  },
  bottomPanelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stationInfo: {
    flex: 1,
    marginRight: 8,
  },
  panelTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  panelSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  panelActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelLoader: {
    margin: 10,
  },
  actionDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 4,
  },
  volumeSlider: {
    width: '15%',
    minWidth: 60,
    height: 40,
  }
});
