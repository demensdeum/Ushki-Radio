import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@ushki_radio_favorites';

const FavoritesService = {
    getFavorites: async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Error loading favorites:', e);
            return [];
        }
    },

    saveFavorite: async (station) => {
        try {
            const favorites = await FavoritesService.getFavorites();
            const isExist = favorites.find(f => f.stationuuid === station.stationuuid);

            if (!isExist) {
                const updatedFavorites = [...favorites, station];
                await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
                return updatedFavorites;
            }
            return favorites;
        } catch (e) {
            console.error('Error saving favorite:', e);
            throw e;
        }
    },

    removeFavorite: async (stationuuid) => {
        try {
            const favorites = await FavoritesService.getFavorites();
            const updatedFavorites = favorites.filter(f => f.stationuuid !== stationuuid);
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
            return updatedFavorites;
        } catch (e) {
            console.error('Error removing favorite:', e);
            throw e;
        }
    },

    isFavorite: async (stationuuid) => {
        try {
            const favorites = await FavoritesService.getFavorites();
            return favorites.some(f => f.stationuuid === stationuuid);
        } catch (e) {
            return false;
        }
    }
};

export default FavoritesService;
