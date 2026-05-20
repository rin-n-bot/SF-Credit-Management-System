// Type definitions for the Electron API exposed to the renderer process
export type ApiResult<T> = Promise<T>;


// Define the shape of the API exposed by the main process
export function getApi() {
  if (!window.api) {
    throw new Error('Electron API is unavailable. Run the app through Electron, not only the browser.');
  }
  return window.api;
}