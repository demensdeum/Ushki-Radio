import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { Provider as PaperProvider, Appbar, MD3DarkTheme, BottomNavigation, Text, Surface, IconButton, ActivityIndicator, Divider } from 'react-native-paper';
import { Audio } from 'expo-av';
import RadioBrowserScreen from './components/RadioBrowserScreen';
import FavoritesScreen from './components/FavoritesScreen';
import FavoritesService from './components/FavoritesService';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
  },
};

export default function App() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'search', title: 'Search', focusedIcon: 'magnify', unfocusedIcon: 'magnify' },
    { key: 'favorites', title: 'Favorites', focusedIcon: 'heart', unfocusedIcon: 'heart-outline' },
  ]);

  // Global Playback State
  const [sound, setSound] = useState(null);
  const [currentStation, setCurrentStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  // Global Favorites State
  const [favorites, setFavorites] = useState(new Set());

  const loadFavorites = useCallback(async () => {
    const favs = await FavoritesService.getFavorites();
    setFavorites(new Set(favs.map(f => f.stationuuid)));
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

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
      if (currentStation?.stationuuid === station.stationuuid) {
        await togglePlayback();
        return;
      }
      if (sound) {
        await sound.unloadAsync();
      }
      setCurrentStation(station);
      setIsPlaying(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: station.url_resolved },
        { shouldPlay: true }
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
  };

  const renderScene = BottomNavigation.SceneMap({
    search: () => (
      <RadioBrowserScreen
        playStation={playStation}
        currentStation={currentStation}
        isPlaying={isPlaying}
        isAudioLoading={isAudioLoading}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />
    ),
    favorites: () => (
      <FavoritesScreen
        playStation={playStation}
        currentStation={currentStation}
        isPlaying={isPlaying}
        isAudioLoading={isAudioLoading}
        toggleFavorite={toggleFavorite}
      />
    ),
  });

  const isCurrentStationFav = currentStation && favorites.has(currentStation.stationuuid);

  return (
    <PaperProvider theme={theme}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Appbar.Header elevated>
          <Appbar.Content title="Ushki Radio" />
        </Appbar.Header>

        <View style={styles.content}>
          <BottomNavigation
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            renderScene={renderScene}
            barStyle={{ backgroundColor: theme.colors.elevation.level2 }}
          />
        </View>

        {currentStation && (
          <Surface style={[styles.bottomPanel, { backgroundColor: theme.colors.surfaceVariant }]} elevation={4}>
            <View style={styles.bottomPanelContent}>
              <View style={styles.stationInfo}>
                <Text numberOfLines={1} style={styles.panelTitle}>{currentStation.name}</Text>
                <Text numberOfLines={1} style={styles.panelSubtitle}>{currentStation.country || 'Unknown'}</Text>
              </View>
              <View style={styles.panelActions}>
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
                    icon={isPlaying ? "pause" : "play"}
                    size={28}
                    onPress={togglePlayback}
                  />
                )}
                <IconButton
                  icon="close"
                  size={20}
                  onPress={stopPlayback}
                />
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
  }
});
