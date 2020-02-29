const OBJECT_STORE_MODIFIER = "_os";

export function openIndexedDB(
  databaseName: string
): Promise<IDBDatabase | null> {
  if (!("indexedDB" in window)) {
    console.warn("No IndexedDB available");
    return Promise.resolve(null);
  }

  return new Promise(resolve => {
    const request = window.indexedDB.open(databaseName, 2);
    request.onerror = function(error) {
      console.error(`Could not open DB ${databaseName}`);
      console.error(error);
      resolve(null);
    };
    request.onsuccess = function() {
      console.info(`Opened DB ${databaseName}`);
      resolve(request.result);
    };
    request.onupgradeneeded = function(
      this: IDBOpenDBRequest,
      event: IDBVersionChangeEvent
    ) {
      console.info(`Setting up DB ${databaseName}`);
      const db = this.result;
      const osName = databaseName + OBJECT_STORE_MODIFIER;
      const objectStore = db.createObjectStore(osName, {
        keyPath: "id"
      });
      objectStore.transaction.oncomplete = function() {
        console.info(`Set up objectStore ${osName}`);
        resolve(db);
      };
    };
  });
}

export function getIndexedDBValue<T, S = T>(
  dbPromise: Promise<IDBDatabase | null>,
  key: string,
  fallback: (key: string) => Promise<S>,
  deserialiser: (jsonPromise: S) => Promise<T> = value =>
    Promise.resolve((value as unknown) as T)
): Promise<T> {
  return dbPromise.then<T>(db => {
    if (!db) {
      return fallback(key)
        .then(deserialiser)
        .catch((error: Error) => {
          console.error("Could not calculate fallback value or deserialise!");
          console.error(error);
          throw error;
        });
    }

    return new Promise<T>((resolve, reject) => {
      const catchFallbackFailure = (error: Error) => {
        console.error("Could not calculate fallback value or deserialise!");
        console.error(error);
        reject(error);
      };

      const os = db
        .transaction([db.name + OBJECT_STORE_MODIFIER], "readwrite")
        .objectStore(db.name + OBJECT_STORE_MODIFIER);
      const readRequest = os.get(key);
      readRequest.onerror = function(error) {
        console.error(`Could not read key ${key} from DB ${db.name}`);
        console.error(error);
        return fallback(key)
          .then(deserialiser)
          .then(resolve)
          .catch(catchFallbackFailure);
      };
      readRequest.onsuccess = function() {
        if (readRequest.result) {
          return deserialiser(readRequest.result.value)
            .then(resolve)
            .catch(catchFallbackFailure);
        }

        Promise.resolve(fallback(key))
          .then(result => {
            const writeOs = db
              .transaction([db.name + OBJECT_STORE_MODIFIER], "readwrite")
              .objectStore(db.name + OBJECT_STORE_MODIFIER);
            const writeRequest = writeOs.add({ id: key, value: result });
            writeRequest.onerror = function(error) {
              console.error(`Could not write new key ${key} to DB ${db.name}`);
              console.error(error);
            };
            return deserialiser(result);
          })
          .then(resolve)
          .catch(catchFallbackFailure);
      };
    });
  });
}
