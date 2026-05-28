function getWindowObject() {
  if (typeof window === "undefined") {
    return null;
  }
  return window;
}

export function getLocalStorage() {
  const windowObject = getWindowObject();
  if (!windowObject || !windowObject.localStorage) {
    return null;
  }
  return windowObject.localStorage;
}

export function readLocalStorageItem(key) {
  const storage = getLocalStorage();
  if (!storage) {
    return null;
  }
  return storage.getItem(key);
}

export function writeLocalStorageItem(key, value) {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }
  storage.setItem(key, String(value));
}

export function removeLocalStorageItem(key) {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(key);
}
