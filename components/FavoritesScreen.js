import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { List, Divider, Text, Surface, useTheme, IconButton } from 'react-native-paper';
import FavoritesService from './FavoritesService';

const FavoritesScreen = ({ playStation, currentStation, isPlaying, isAudioLoading, toggleFavorite, favorites: favSet }) => {
    const theme = useTheme();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadFavorites = useCallback(async () => {
        setLoading(true);
        const data = await FavoritesService.getFavorites();
        setFavorites(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadFavorites();
    }, [loadFavorites, favSet]);

    const handleToggleFavorite = async (station) => {
        await toggleFavorite(station);
    };


    const renderItem = ({ item }) => {
        const isThisStationPlaying = currentStation?.stationuuid === item.stationuuid;

        return (
            <List.Item
                title={item.name}
                description={item.country || 'Unknown Country'}
                onPress={() => playStation(item)}
                left={(props) => (
                    isThisStationPlaying && isAudioLoading ? (
                        <ActivityIndicator {...props} size="small" />
                    ) : (
                        <List.Icon
                            {...props}
                            icon={isThisStationPlaying && isPlaying ? "stop-circle" : "play-circle"}
                            color={isThisStationPlaying ? theme.colors.primary : props.color}
                        />
                    )
                )}
                right={(props) => (
                    <View style={styles.rightContainer}>
                        {item.tags && item.tags.trim().length > 0 ? (
                            <View style={styles.tagContainer}>
                                {item.tags.split(',').slice(0, 1).map((tag, index) => {
                                    const trimmedTag = tag.trim();
                                    return trimmedTag.length > 0 ? (
                                        <Surface key={index} style={[styles.tag, { backgroundColor: theme.colors.surfaceVariant }]}>
                                            <Text style={[styles.tagText, { color: theme.colors.onSurfaceVariant }]}>{trimmedTag}</Text>
                                        </Surface>
                                    ) : null;
                                })}
                            </View>
                        ) : null}
                        <IconButton
                            icon="heart"
                            iconColor={theme.colors.primary}
                            size={20}
                            onPress={() => handleToggleFavorite(item)}
                        />
                    </View>
                )}
            />
        );
    };

    if (loading && favorites.length === 0) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator animating={true} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {favorites.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <IconButton icon="heart-outline" size={48} disabled />
                    <Text variant="titleMedium">No favorite stations yet</Text>
                    <Text variant="bodySmall">Add some from the search tab!</Text>
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    keyExtractor={(item) => item.stationuuid}
                    renderItem={renderItem}
                    ItemSeparatorComponent={() => <Divider />}
                    contentContainerStyle={[styles.list, currentStation && styles.listWithPanel]}
                    onRefresh={loadFavorites}
                    refreshing={loading}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        opacity: 0.6,
    },
    list: {
        paddingBottom: 16,
    },
    listWithPanel: {
        paddingBottom: 160,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 4,
    },
    tag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 4,
    },
    tagText: {
        fontSize: 10,
    },
});

export default FavoritesScreen;
