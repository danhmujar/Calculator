/**
 * Store - Centralized State Management
 * Implements Proxy-based Lazy Shallow Cloning (Copy-on-Write)
 * for O(1) reads and structural sharing.
 */
export class Store {
    constructor(initialState = {}) {
        this._state = initialState;
        this.subscribers = [];
        this._saveTimeout = null;
        this._isBatching = false;
        this._pendingNotification = false;
        this._proxy = null;

        // Auto-subscribe the private persistence method
        this.subscribe(this._persistState.bind(this));
    }

    /**
     * Returns a reactive proxy for the state.
     * Mutations through this proxy trigger Lazy Shallow Cloning (CoW).
     */
    get state() {
        if (!this._proxy) {
            this._proxy = this._createProxy(this._state);
        }
        return this._proxy;
    }

    _createProxy(target, path = []) {
        const self = this;
        return new Proxy(target, {
            get(t, prop) {
                // Internal flag to check if object is a Proxy (useful for testing or debugging)
                if (prop === '__isProxy') return true;
                
                const value = t[prop];
                // Lazy recursion: only wrap objects in a Proxy when accessed
                if (typeof value === 'object' && value !== null) {
                    return self._createProxy(value, [...path, prop]);
                }
                return value;
            },
            set(t, prop, value) {
                // Prevent unnecessary updates
                if (t[prop] === value) return true;
                
                // Trigger Copy-on-Write update up the tree
                self._updateState([...path, prop], value);
                return true;
            }
        });
    }

    /**
     * Performs a Copy-on-Write update along the specified path.
     * Ensures structural sharing for unaffected branches.
     */
    _updateState(path, value) {
        const newState = { ...this._state };
        let current = newState;
        
        // Clone only the path down to the property being modified
        for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            // Handle both objects and arrays for structural sharing
            current[key] = Array.isArray(current[key]) ? [...current[key]] : { ...current[key] };
            current = current[key];
        }
        
        // Set the new value
        current[path[path.length - 1]] = value;
        
        // Update root state
        this._state = newState;
        
        // Invalidate proxy cache as the underlying state has changed
        this._proxy = null;

        // Notify or queue notification
        if (this._isBatching) {
            this._pendingNotification = true;
        } else {
            this.notify();
        }
    }

    /**
     * Returns the current state. Efficient O(1) read.
     * Due to structural sharing, unchanged objects maintain reference equality.
     */
    getState() {
        return this._state;
    }

    /**
     * Batch update multiple properties at once.
     * Subscribers are notified only once after the batch completes.
     */
    setState(updates) {
        this.batch(() => {
            for (const [key, value] of Object.entries(updates)) {
                this.state[key] = value;
            }
        });
    }

    /**
     * Execution wrapper for atomic updates.
     */
    batch(fn) {
        const wasBatching = this._isBatching;
        this._isBatching = true;
        try {
            fn();
        } finally {
            this._isBatching = wasBatching;
            // Notify if a change occurred during the batch
            if (!this._isBatching && this._pendingNotification) {
                this._pendingNotification = false;
                this.notify();
            }
        }
    }

    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback);
        };
    }

    notify() {
        const state = this.getState();
        this.subscribers.forEach(callback => callback(state));
    }

    /**
     * Debounced persistence to localStorage.
     * Only serializes the 'persistent' segment of the state.
     */
    _persistState(state) {
        clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => {
            try {
                // Task 2: Segmented persistence
                // If the state is segmented, only save the persistent part.
                // Fallback to full state if segmentation is not present.
                const dataToSave = state.persistent || state;
                localStorage.setItem('interactiveCalcState', JSON.stringify(dataToSave));
            } catch (e) {
                console.error("Store: Failed to persist state to localStorage", e);
            }
        }, 500);
    }
}

// Default state with Segmented Architecture (Persistent vs Transient)
const defaultState = {
    persistent: {
        theme: '',
        darkMode: false,
        mode: 'standard',
        cards: {
            'type1': [],
            'type2': [],
            'type3': [],
            'type4': []
        },
        sciRows: [],
        auditData: []
    },
    transient: {
        currentValue: '0',
        previousValue: null,
        operator: null,
        resetNext: false,
        memoryValue: 0,
        activeRowIndex: -1,
        selection: null,
        focusState: null
    }
};

// Export an instance of Store with the default calculator state
export const store = new Store(defaultState);
