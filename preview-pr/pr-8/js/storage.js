// Storage abstraction for Flow State app
// This module provides a unified interface for various storage providers

// Storage providers enum
export const StorageProvider = {
  LOCAL: 'localStorage',
  SESSION: 'sessionStorage',
  SERVER: 'serverStorage',
  FIRESTORE: 'firestoreStorage',
  // Add more providers as needed
};

// Default configuration
const defaultConfig = {
  provider: StorageProvider.LOCAL,
  user: null,
  apiEndpoint: null,
  firestoreConfig: null,
  // Add more configuration options as needed
};

// Current configuration
let currentConfig = { ...defaultConfig };

/**
 * Main storage class that provides a unified interface for different storage providers
 */
class StorageService {
  constructor() {
    this.initialized = false;
    this.firebase = null;
    this.db = null;

    this.providerImplementations = {
      [StorageProvider.LOCAL]: {
        getItem: (key) => localStorage.getItem(key),
        setItem: (key, value) => localStorage.setItem(key, value),
        removeItem: (key) => localStorage.removeItem(key),
        clear: () => localStorage.clear(),
        getAllKeys: () => Object.keys(localStorage),
      },
      [StorageProvider.SESSION]: {
        getItem: (key) => sessionStorage.getItem(key),
        setItem: (key, value) => sessionStorage.setItem(key, value),
        removeItem: (key) => sessionStorage.removeItem(key),
        clear: () => sessionStorage.clear(),
        getAllKeys: () => Object.keys(sessionStorage),
      },
      [StorageProvider.SERVER]: {
        // Placeholder for server-side storage implementation
        // This would be implemented when server storage is added
        getItem: async (key) => {
          if (!currentConfig.user || !currentConfig.apiEndpoint) {
            throw new Error('Server storage requires user login and API endpoint');
          }

          // This would be replaced with actual API call implementation
          console.log(`Fetching ${key} for user ${currentConfig.user} from ${currentConfig.apiEndpoint}`);

          // Fall back to localStorage for now
          return localStorage.getItem(key);
        },
        setItem: async (key, value) => {
          if (!currentConfig.user || !currentConfig.apiEndpoint) {
            throw new Error('Server storage requires user login and API endpoint');
          }

          // This would be replaced with actual API call implementation
          console.log(`Saving ${key} for user ${currentConfig.user} to ${currentConfig.apiEndpoint}`);

          // Fall back to localStorage for now
          localStorage.setItem(key, value);
        },
        removeItem: async (key) => {
          if (!currentConfig.user || !currentConfig.apiEndpoint) {
            throw new Error('Server storage requires user login and API endpoint');
          }

          // This would be replaced with actual API call implementation
          console.log(`Removing ${key} for user ${currentConfig.user} from ${currentConfig.apiEndpoint}`);

          // Fall back to localStorage for now
          localStorage.removeItem(key);
        },
        clear: async () => {
          if (!currentConfig.user || !currentConfig.apiEndpoint) {
            throw new Error('Server storage requires user login and API endpoint');
          }

          // This would be replaced with actual API call implementation
          console.log(`Clearing data for user ${currentConfig.user} from ${currentConfig.apiEndpoint}`);

          // Fall back to localStorage for now
          localStorage.clear();
        },
        getAllKeys: async () => {
          if (!currentConfig.user || !currentConfig.apiEndpoint) {
            throw new Error('Server storage requires user login and API endpoint');
          }

          // This would be replaced with actual API call implementation
          console.log(`Fetching all keys for user ${currentConfig.user} from ${currentConfig.apiEndpoint}`);

          // Fall back to localStorage for now
          return Object.keys(localStorage);
        },
      },
      [StorageProvider.FIRESTORE]: {
        getItem: async (key) => {
          if (!this.db || !currentConfig.user) {
            throw new Error('Firestore storage requires user login and proper initialization');
          }

          try {
            const docRef = this.db.collection('users').doc(currentConfig.user).collection('data').doc(key);
            const doc = await docRef.get();

            if (doc.exists) {
              const data = doc.data();
              // If data was stored as a JSON object directly, return it as is
              if (data.isJSON === true && typeof data.jsonValue !== 'undefined') {
                return JSON.stringify(data.jsonValue); // Convert back to string to match the API
              }
              return data.value;
            } else {
              return null;
            }
          } catch (error) {
            console.error(`Error getting document '${key}':`, error);
            return null;
          }
        },

        setItem: async (key, value) => {
          if (!this.db || !currentConfig.user) {
            throw new Error('Firestore storage requires user login and proper initialization');
          }

          try {
            await this.db.collection('users').doc(currentConfig.user).collection('data').doc(key).set({
              value: value,
              updatedAt: new Date(),
              key: key
            });
            return true;
          } catch (error) {
            console.error(`Error setting document '${key}':`, error);
            return false;
          }
        },

        // Direct methods to handle JSON efficiently in Firestore
        // These will be used by the optimized Firestore-specific methods below
        getJSON: async (key, defaultValue = null) => {
          if (!this.db || !currentConfig.user) {
            throw new Error('Firestore storage requires user login and proper initialization');
          }
          
          try {
            const docRef = this.db.collection('users').doc(currentConfig.user).collection('data').doc(key);
            const doc = await docRef.get();
            
            if (doc.exists) {
              const data = doc.data();
              // Return the JSON value directly if it was stored that way
              if (data.isJSON === true && typeof data.jsonValue !== 'undefined') {
                return data.jsonValue;
              }
              
              // Otherwise try to parse the string value
              if (typeof data.value === 'string') {
                try {
                  return JSON.parse(data.value);
                } catch (e) {
                  console.error(`Error parsing JSON for key ${key}:`, e);
                  return defaultValue;
                }
              }
              
              return defaultValue;
            } else {
              return defaultValue;
            }
          } catch (error) {
            console.error(`Error getting JSON document '${key}':`, error);
            return defaultValue;
          }
        },
        
        setJSON: async (key, value) => {
          if (!this.db || !currentConfig.user) {
            throw new Error('Firestore storage requires user login and proper initialization');
          }
          
          try {
            // Store the JSON value directly in Firestore
            await this.db.collection('users').doc(currentConfig.user).collection('data').doc(key).set({
              jsonValue: value, // Store the actual object
              isJSON: true,    // Flag to identify JSON data
              updatedAt: new Date(),
              key: key
            });
            return true;
          } catch (error) {
            console.error(`Error setting JSON document '${key}':`, error);
            return false;
          }
        },

        removeItem: async (key) => {
          if (!this.db || !currentConfig.user) {
            throw new Error('Firestore storage requires user login and proper initialization');
          }

          try {
            await this.db.collection('users').doc(currentConfig.user).collection('data').doc(key).delete();
            return true;
          } catch (error) {
            console.error(`Error removing document '${key}':`, error);
            return false;
          }
        },

        clear: async () => {
          if (!this.db || !currentConfig.user) {
            throw new Error('Firestore storage requires user login and proper initialization');
          }

          try {
            // Firestore doesn't have a direct "clear collection" method
            // We need to get all documents and delete them in batches
            const querySnapshot = await this.db.collection('users').doc(currentConfig.user).collection('data').get();

            // Use batched writes for better performance (limited to 500 operations per batch)
            const batchSize = 450;
            let batch = this.db.batch();
            let count = 0;

            querySnapshot.forEach((doc) => {
              batch.delete(doc.ref);
              count++;

              if (count >= batchSize) {
                batch.commit();
                batch = this.db.batch();
                count = 0;
              }
            });

            // Commit any remaining operations
            if (count > 0) {
              await batch.commit();
            }

            return true;
          } catch (error) {
            console.error('Error clearing all documents:', error);
            return false;
          }
        },

        getAllKeys: async () => {
          if (!this.db || !currentConfig.user) {
            throw new Error('Firestore storage requires user login and proper initialization');
          }

          try {
            const querySnapshot = await this.db.collection('users').doc(currentConfig.user).collection('data').get();
            const keys = [];

            querySnapshot.forEach((doc) => {
              keys.push(doc.id);
            });

            return keys;
          } catch (error) {
            console.error('Error getting all keys:', error);
            return [];
          }
        }
      }
    };
  }

  /**
   * Initialize the storage service with configuration
   * @param {Object} config Configuration object
   */
  init(config = {}) {
    currentConfig = { ...defaultConfig, ...config };
    this.initialized = true;

    // Log initialization for debugging
    console.log(`Storage service initialized with provider: ${currentConfig.provider}`);

    // Check if provider is supported
    if (!this.providerImplementations[currentConfig.provider]) {
      console.error(`Storage provider ${currentConfig.provider} is not supported`);
      // Fall back to localStorage
      currentConfig.provider = StorageProvider.LOCAL;
    }

    // Initialize Firestore if it's the selected provider
    if (currentConfig.provider === StorageProvider.FIRESTORE) {
      this.initFirestore();
    }

    return this;
  }

  /**
   * Initialize Firestore service
   * @private
   */
  async initFirestore() {
    if (!currentConfig.firestoreConfig) {
      console.error('Firestore configuration is missing');
      return false;
    }

    try {
      // Dynamically import firebase modules (better for tree-shaking)
      if (!this.firebase) {
        const { initializeApp } = await import('firebase/app');
        const { getFirestore } = await import('firebase/firestore');

        // Initialize Firebase
        const app = initializeApp(currentConfig.firestoreConfig);
        this.db = getFirestore(app);

        console.log('Firestore initialized successfully');
        return true;
      }
      return true;
    } catch (error) {
      console.error('Failed to initialize Firestore:', error);
      return false;
    }
  }

  /**
   * Get the current provider implementation
   * @returns {Object} Provider implementation
   */
  getCurrentProvider() {
    if (!this.initialized) {
      this.init();
    }

    return this.providerImplementations[currentConfig.provider];
  }

  /**
   * Get item from storage
   * @param {string} key The key to get
   * @returns {string|null} The stored value or null
   */
  async getItem(key) {
    const provider = this.getCurrentProvider();
    try {
      return await provider.getItem(key);
    } catch (err) {
      console.error(`Error getting item '${key}':`, err);
      return null;
    }
  }

  /**
   * Set item in storage
   * @param {string} key The key to set
   * @param {string} value The value to store
   */
  async setItem(key, value) {
    const provider = this.getCurrentProvider();
    await provider.setItem(key, value);
  }

  /**
   * Remove item from storage
   * @param {string} key The key to remove
   */
  async removeItem(key) {
    const provider = this.getCurrentProvider();
    await provider.removeItem(key);
  }

  /**
   * Clear all storage
   */
  async clear() {
    const provider = this.getCurrentProvider();
    await provider.clear();
  }

  /**
   * Get all storage keys
   * @returns {Array} Array of keys
   */
  async getAllKeys() {
    const provider = this.getCurrentProvider();
    return await provider.getAllKeys();
  }

  /**
   * Get item as JSON
   * @param {string} key The key to get
   * @param {any} defaultValue Default value if item doesn't exist
   * @returns {Object} Parsed JSON object
   */
  async getJSON(key, defaultValue = null) {
    const provider = this.getCurrentProvider();
    
    // Use provider-specific getJSON if available for optimized handling
    if (provider.getJSON) {
      return await provider.getJSON(key, defaultValue);
    }

    // Fall back to generic implementation for providers without native JSON support
    const data = await this.getItem(key);
    if (!data) return defaultValue;
    
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(`Error parsing JSON for key ${key}:`, e);
      return defaultValue;
    }
  }

  /**
   * Set item as JSON
   * @param {string} key The key to set
   * @param {Object} value The object to store
   */
  async setJSON(key, value) {
    const provider = this.getCurrentProvider();
    
    // Use provider-specific setJSON if available for optimized handling
    if (provider.setJSON) {
      return await provider.setJSON(key, value);
    }
    
    // Fall back to generic implementation for providers without native JSON support
    try {
      const jsonValue = JSON.stringify(value);
      await this.setItem(key, jsonValue);
    } catch (e) {
      console.error(`Error stringifying JSON for key ${key}:`, e);
    }
  }

  /**
   * Update configuration
   * @param {Object} config New configuration
   */
  updateConfig(config = {}) {
    currentConfig = { ...currentConfig, ...config };
    console.log(`Storage configuration updated: ${JSON.stringify(currentConfig)}`);
    return this;
  }

  /**
   * Set current user
   * @param {string} user User identifier
   */
  setUser(user) {
    this.updateConfig({ user });
    return this;
  }

  /**
   * Change storage provider
   * @param {StorageProvider} provider The provider to use
   */
  setProvider(provider) {
    if (!this.providerImplementations[provider]) {
      console.error(`Storage provider ${provider} is not supported`);
      return this;
    }

    this.updateConfig({ provider });
    return this;
  }

  /**
   * Set API endpoint for server storage
   * @param {string} apiEndpoint API endpoint URL
   */
  setApiEndpoint(apiEndpoint) {
    this.updateConfig({ apiEndpoint });
    return this;
  }

  /**
   * Configure and set Firestore as the storage provider
   * @param {Object} firestoreConfig Firebase configuration object
   * @param {string} userId User ID for Firestore documents
   */
  useFirestore(firestoreConfig, userId = null) {
    // Update configuration
    this.updateConfig({
      firestoreConfig,
      user: userId,
      provider: StorageProvider.FIRESTORE
    });

    // Initialize Firestore
    return this.initFirestore();
  }

  /**
   * Get a direct reference to the Firestore database
   * Useful for advanced operations
   */
  getFirestoreDb() {
    return this.db;
  }

  /**
   * Sync local storage data to Firestore
   * Helpful when migrating from local to cloud storage
   */
  async syncLocalToFirestore() {
    if (!this.db || !currentConfig.user) {
      throw new Error('Firestore storage requires user login and proper initialization');
    }

    try {
      // Get all data from localStorage
      const originalProvider = currentConfig.provider;
      this.setProvider(StorageProvider.LOCAL);

      // Get all keys
      const keys = await this.getAllKeys();
      const localData = {};

      // Get values for all keys
      for (const key of keys) {
        localData[key] = await this.getItem(key);
      }

      // Switch to Firestore provider
      this.setProvider(StorageProvider.FIRESTORE);

      // Batch update for better performance
      let batch = this.db.batch();
      let count = 0;
      const batchSize = 450; // Firestore limit is 500 operations per batch

      for (const key in localData) {
        const docRef = this.db.collection('users').doc(currentConfig.user).collection('data').doc(key);
        batch.set(docRef, {
          key: key,
          value: localData[key],
          updatedAt: new Date(),
          syncedFromLocal: true
        });

        count++;

        if (count >= batchSize) {
          await batch.commit();
          batch = this.db.batch();
          count = 0;
        }
      }

      // Commit any remaining operations
      if (count > 0) {
        await batch.commit();
      }

      // Restore original provider
      this.setProvider(originalProvider);

      console.log(`Synced ${Object.keys(localData).length} items from localStorage to Firestore`);
      return true;
    } catch (error) {
      console.error('Error syncing data to Firestore:', error);
      return false;
    }
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...currentConfig };
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated() {
    return !!currentConfig.user;
  }

  /**
   * Migrate data from one provider to another
   * @param {StorageProvider} fromProvider Source provider
   * @param {StorageProvider} toProvider Destination provider
   */
  async migrateData(fromProvider, toProvider) {
    if (!this.providerImplementations[fromProvider] || !this.providerImplementations[toProvider]) {
      console.error(`Invalid storage providers for migration`);
      return false;
    }

    try {
      // Save original provider
      const originalProvider = currentConfig.provider;

      // Set provider to source
      this.setProvider(fromProvider);

      // Get all keys from source
      const keys = await this.getAllKeys();

      // Get all data from source
      const data = {};
      for (const key of keys) {
        data[key] = await this.getItem(key);
      }

      // Set provider to destination
      this.setProvider(toProvider);

      // Store all data in destination
      for (const key in data) {
        await this.setItem(key, data[key]);
      }

      // Restore original provider
      this.setProvider(originalProvider);

      console.log(`Data migrated from ${fromProvider} to ${toProvider}`);
      return true;
    } catch (e) {
      console.error(`Error migrating data:`, e);
      return false;
    }
  }
}

// Create singleton instance
const storageService = new StorageService();

// Initialize with default configuration
storageService.init();

export default storageService;