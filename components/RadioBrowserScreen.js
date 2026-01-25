import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { List, Searchbar, Divider, Text, Surface, useTheme, IconButton } from 'react-native-paper';
import RadioService from './RadioService';
import FavoritesService from './FavoritesService';

const RadioBrowserScreen = ({ playStation, currentStation, isPlaying, isAudioLoading, favorites, toggleFavorite }) => {
    const theme = useTheme();
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const PAGE_SIZE = 20;
    const INITIAL_LIMIT = 20;

    const isFirstRun = useRef(true);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (isFirstRun.current) {
                isFirstRun.current = false;
                fetchStations(true);
            } else {
                fetchStations(true);
            }
        }, isFirstRun.current ? 0 : 2000);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // Favorites are now handled globally in App.js

    const fetchStations = async (isInitial = false, isRefresh = false) => {
        if (loading || loadingMore || (refreshing && !isRefresh) || (!hasMore && !isInitial && !isRefresh)) return;

        if (isRefresh) {
            setRefreshing(true);
            setOffset(0);
            setHasMore(true);
        } else if (isInitial) {
            setLoading(true);
            setOffset(0);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const currentOffset = isInitial ? 0 : offset;
            const currentLimit = isInitial ? INITIAL_LIMIT : PAGE_SIZE;

            let data = [];
            if (searchQuery.length > 2) {
                data = await RadioService.searchStations(searchQuery, currentLimit, currentOffset);
            } else {
                data = await RadioService.getTopStations(currentLimit, currentOffset);
            }

            if (data.length < currentLimit) {
                setHasMore(false);
            }

            if (isInitial || isRefresh) {
                setStations(data);
                setOffset(data.length);
            } else {
                setStations((prev) => [...prev, ...data]);
                setOffset((prev) => prev + data.length);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        fetchStations(true, true);
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    const handleLoadMore = () => {
        if (!loading && !loadingMore && hasMore) {
            fetchStations(false);
        }
    };

    const renderItem = ({ item }) => {
        const isThisStationPlaying = currentStation?.stationuuid === item.stationuuid;
        const isFav = favorites.has(item.stationuuid);

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
                            icon={isFav ? "heart" : "heart-outline"}
                            iconColor={isFav ? theme.colors.primary : theme.colors.outline}
                            size={20}
                            onPress={() => toggleFavorite(item)}
                        />
                    </View>
                )}
            />
        );
    };

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={[styles.footerLoader, { borderColor: theme.colors.outline }]}>
                <ActivityIndicator animating={true} />
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Searchbar
                placeholder="Search Stations"
                onChangeText={handleSearch}
                value={searchQuery}
                style={styles.searchbar}
                loading={loading}
            />
            <View style={styles.flexArea}>
                {loading && stations.length === 0 ? (
                    <ActivityIndicator animating={true} style={styles.loader} />
                ) : (
                    <FlatList
                        data={stations}
                        keyExtractor={(item, index) => `${item.stationuuid}-${index}`}
                        renderItem={renderItem}
                        ItemSeparatorComponent={() => <Divider />}
                        contentContainerStyle={[styles.list, currentStation && styles.listWithPanel]}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={renderFooter}
                        onRefresh={handleRefresh}
                        refreshing={refreshing}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flexArea: {
        flex: 1,
    },
    searchbar: {
        margin: 16,
        elevation: 4,
    },
    loader: {
        marginTop: 20,
    },
    footerLoader: {
        paddingVertical: 20,
        borderTopWidth: 1,
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

export default RadioBrowserScreen;
