import {
  getLocalStorage,
  removeLocalStorageItem,
  writeLocalStorageItem,
} from "./browserStorage";

const AUTH_STORAGE_KEYS = {
  token: "memesee_token",
  user: "memesee_user",
  userLevel: "memesee_user_level",
};

const LEGACY_AUTH_STORAGE_KEYS = {
  token: "forum_token",
  user: "forum_user",
  userLevel: "forum_user_level",
};

function readRawValue(storage, primaryKey, legacyKey) {
  const primaryValue = storage.getItem(primaryKey);
  if (primaryValue !== null) {
    return {
      value: primaryValue,
      migrated: false,
    };
  }

  const legacyValue = storage.getItem(legacyKey);
  if (legacyValue === null) {
    return {
      value: "",
      migrated: false,
    };
  }

  storage.setItem(primaryKey, legacyValue);
  storage.removeItem(legacyKey);
  return {
    value: legacyValue,
    migrated: true,
  };
}

export function getStoredAuthSession() {
  const storage = getLocalStorage();
  if (!storage) {
    return {
      token: "",
      currentUser: "",
      currentUserLevel: 0,
    };
  }

  const token = readRawValue(
    storage,
    AUTH_STORAGE_KEYS.token,
    LEGACY_AUTH_STORAGE_KEYS.token,
  ).value;
  const currentUser = readRawValue(
    storage,
    AUTH_STORAGE_KEYS.user,
    LEGACY_AUTH_STORAGE_KEYS.user,
  ).value;
  const levelRaw = readRawValue(
    storage,
    AUTH_STORAGE_KEYS.userLevel,
    LEGACY_AUTH_STORAGE_KEYS.userLevel,
  ).value;
  const currentUserLevel = Number(levelRaw);

  return {
    token,
    currentUser,
    currentUserLevel: Number.isFinite(currentUserLevel) ? currentUserLevel : 0,
  };
}

export function writeStoredAuthSession({ token, currentUser, currentUserLevel }) {
  writeLocalStorageItem(AUTH_STORAGE_KEYS.token, token);
  writeLocalStorageItem(AUTH_STORAGE_KEYS.user, currentUser);
  writeLocalStorageItem(AUTH_STORAGE_KEYS.userLevel, currentUserLevel);

  removeLocalStorageItem(LEGACY_AUTH_STORAGE_KEYS.token);
  removeLocalStorageItem(LEGACY_AUTH_STORAGE_KEYS.user);
  removeLocalStorageItem(LEGACY_AUTH_STORAGE_KEYS.userLevel);
}

export function updateStoredUserLevel(level) {
  writeLocalStorageItem(AUTH_STORAGE_KEYS.userLevel, level);
  removeLocalStorageItem(LEGACY_AUTH_STORAGE_KEYS.userLevel);
}

export function updateStoredToken(token) {
  writeLocalStorageItem(AUTH_STORAGE_KEYS.token, token);
  removeLocalStorageItem(LEGACY_AUTH_STORAGE_KEYS.token);
}

export function clearStoredAuthSession() {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  Object.values(AUTH_STORAGE_KEYS).forEach(removeLocalStorageItem);
  Object.values(LEGACY_AUTH_STORAGE_KEYS).forEach(removeLocalStorageItem);
}

export { AUTH_STORAGE_KEYS, LEGACY_AUTH_STORAGE_KEYS };
