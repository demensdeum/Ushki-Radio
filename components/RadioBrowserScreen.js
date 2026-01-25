import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { List, Searchbar, Divider, Text, Surface, useTheme } from 'react-native-paper';
import RadioService from './RadioService';

const RadioBrowserScreen = () => {
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

    const isFirstRun = React.useRef(true);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (isFirstRun.current) {
                isFirstRun.current = false;
                fetchStations(true);
            } else {
                fetchStations(true);
            }
        }, isFirstRun.current ? 0 : 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const fetchStations = async (isInitial = false, isRefresh = false) => {
        console.log(`Starting radio stations fetch (initial: ${isInitial}, refresh: ${isRefresh})...`);
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
                console.log(`Fetched ${data.length} stations:`);
                data.forEach((s, i) => {
                    console.log(`${i + 1}. ${s.name} (${s.country || 'Unknown'}) - clicks: ${s.clickcount}, tags: ${s.tags}`);
                });
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

    const renderItem = ({ item }) => (
        <List.Item
            title={item.name}
            description={item.country || 'Unknown Country'}
            left={(props) => <List.Icon {...props} icon="radio" />}
            right={(props) =>
                item.tags && item.tags.trim().length > 0 ? (
                    <View style={styles.tagContainer}>
                        {item.tags.split(',').slice(0, 2).map((tag, index) => {
                            const trimmedTag = tag.trim();
                            return trimmedTag.length > 0 ? (
                                <Surface key={index} style={[styles.tag, { backgroundColor: theme.colors.surfaceVariant }]}>
                                    <Text style={[styles.tagText, { color: theme.colors.onSurfaceVariant }]}>{trimmedTag}</Text>
                                </Surface>
                            ) : null;
                        })}
                    </View>
                ) : null
            }
        />
    );

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
            {loading && stations.length === 0 ? (
                <ActivityIndicator animating={true} style={styles.loader} />
            ) : (
                <FlatList
                    data={stations}
                    keyExtractor={(item, index) => `${item.stationuuid}-${index}`}
                    renderItem={renderItem}
                    ItemSeparatorComponent={() => <Divider />}
                    contentContainerStyle={styles.list}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
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
    tagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
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
