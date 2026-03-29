export class Store {
    constructor(initialState = {}) {
        // Initialize state as a deep copy to prevent external mutation
        this.state = JSON.parse(JSON.stringify(initialState));
        this.subscribers = [];
        this._saveTimeout = null;

        // Auto-subscribe the private persistence method
        this.subscribe(this._persistState.bind(this));
    }

    getState() {
        // Returns a deep copy of current state
        return JSON.parse(JSON.stringify(this.state));
    }

    setState(updates) {
        // Merges updates into current state
        this.state = { ...this.state, ...updates };
        this.notify();
    }

    subscribe(callback) {
        // Adds a callback to subscribers array
        this.subscribers.push(callback);
        
        // Returns an unsubscribe function
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback);
        };
    }

    notify() {
        const stateCopy = this.getState();
        this.subscribers.forEach(callback => callback(stateCopy));
    }

    _persistState(state) {
        // Implement 500ms debounce for localStorage.setItem
        clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => {
            try {
                localStorage.setItem('interactiveCalcState', JSON.stringify(state));
            } catch (e) {
                console.error("Store: Failed to persist state to localStorage", e);
            }
        }, 500);
    }
}

const defaultState = {
    // Core calculator logic state
    currentValue: '0',
    previousValue: null,
    operator: null,
    resetNext: false,
    memoryValue: 0,
    
    // UI/Persisted state
    theme: '',
    darkMode: false,
    mode: 'standard',
    cards: {},
    sciRows: [],
    auditData: []
};

// Export an instance of Store with the default calculator state
export const store = new Store(defaultState);
