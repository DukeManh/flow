/**
 * Unit tests for the Storage Service
 */
import storageService from '../../js/storage.js';

describe('Storage Service', () => {
  beforeEach(() => {
    // Clear localStorage and sessionStorage before each test
    localStorage.clear();
    sessionStorage.clear();
    
    // Reset mock counters
    localStorage.getItem.mockClear();
    localStorage.setItem.mockClear();
    localStorage.removeItem.mockClear();
    localStorage.clear.mockClear();
  });
  
  // Test item storage and retrieval
  test('setItem and getItem should store and retrieve values', async () => {
    const key = 'testKey';
    const value = 'testValue';
    
    await storageService.setItem(key, value);
    const retrievedValue = await storageService.getItem(key);
    
    expect(localStorage.setItem).toHaveBeenCalledWith(key, value);
    expect(localStorage.getItem).toHaveBeenCalledWith(key);
    expect(retrievedValue).toBe(value);
  });
  
  // Test JSON storage and retrieval
  test('setJSON and getJSON should store and retrieve JSON objects', async () => {
    const key = 'jsonTestKey';
    const value = { name: 'Test Object', items: [1, 2, 3] };
    
    await storageService.setJSON(key, value);
    const retrievedValue = await storageService.getJSON(key);
    
    expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(value));
    expect(localStorage.getItem).toHaveBeenCalledWith(key);
    expect(retrievedValue).toEqual(value);
  });
  
  // Test default values for getJSON
  test('getJSON should return default value when key does not exist', async () => {
    const key = 'nonExistentKey';
    const defaultValue = { default: true };
    
    localStorage.getItem.mockReturnValue(null);
    
    const retrievedValue = await storageService.getJSON(key, defaultValue);
    
    expect(localStorage.getItem).toHaveBeenCalledWith(key);
    expect(retrievedValue).toEqual(defaultValue);
  });
  
  // Test removing items
  test('removeItem should remove an item from storage', async () => {
    const key = 'keyToRemove';
    
    await storageService.removeItem(key);
    
    expect(localStorage.removeItem).toHaveBeenCalledWith(key);
  });
  
  // Test clearing all storage
  test('clear should clear all storage', async () => {
    await storageService.clear();
    
    expect(localStorage.clear).toHaveBeenCalled();
  });
  
  // Test error handling for getItem
  test('getItem should handle localStorage errors', async () => {
    const key = 'errorKey';
    
    // Simulate an error
    localStorage.getItem.mockImplementation(() => {
      throw new Error('Mock storage error');
    });
    
    const result = await storageService.getItem(key);
    
    expect(result).toBeNull();
  });
  
  // Test error handling for JSON parsing
  test('getJSON should handle invalid JSON', async () => {
    const key = 'invalidJsonKey';
    
    // Return invalid JSON string
    localStorage.getItem.mockReturnValue('{"invalid": json}');
    
    const defaultValue = { default: true };
    const result = await storageService.getJSON(key, defaultValue);
    
    expect(result).toEqual(defaultValue);
  });
});