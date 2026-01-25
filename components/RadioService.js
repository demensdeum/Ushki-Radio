const BASE_URL = 'https://de1.api.radio-browser.info/json';

const RadioService = {
    getTopStations: async (limit = 20, offset = 0) => {
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString(),
                order: 'clickcount',
                reverse: 'true',
                hidebroken: 'true'
            });

            const response = await fetch(`${BASE_URL}/stations?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const stations = await response.json();
            return stations;
        } catch (error) {
            console.error('Error fetching stations:', error);
            throw error;
        }
    },

    searchStations: async (name, limit = 20, offset = 0) => {
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString(),
                name: name,
                order: 'clickcount',
                reverse: 'true',
                hidebroken: 'true'
            });

            const response = await fetch(`${BASE_URL}/stations/search?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const stations = await response.json();
            return stations;
        } catch (error) {
            console.error('Error searching stations:', error);
            throw error;
        }
    },
};

export default RadioService;
