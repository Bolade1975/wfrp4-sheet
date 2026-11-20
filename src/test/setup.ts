// jsdom has no IndexedDB; fake-indexeddb polyfills it for Dexie tests.
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
