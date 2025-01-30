import { getDatabase, ref, set, get, remove, query, orderByChild, equalTo, push } from "firebase/database";

class FirebaseRealtimeService {
    constructor(firebaseApp) {
        this.db = getDatabase(firebaseApp);
    }

    async setData(path, data) {
        const dataRef = ref(this.db, path);
        await set(dataRef, data);
    }

    async getData(path) {
        const dataRef = ref(this.db, path);
        const snapshot = await get(dataRef);
        return snapshot.exists() ? snapshot.val() : null;
    }

    async deleteData(path) {
        const dataRef = ref(this.db, path);
        await remove(dataRef);
    }

    async pushData(path, data) {
        const refPath = ref(this.db, path);
        await push(refPath, data);
    }

    async updateData(path, data) {
        const dataRef = ref(this.db, path);
        await update(dataRef, data);
    }

    async queryData(path, key, value) {
        const dataRef = query(ref(this.db, path), orderByChild(key), equalTo(value));
        const snapshot = await get(dataRef);
        let results = [];
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                results.push({ id: childSnapshot.key, ...childSnapshot.val() });
            });
        }
        return results;
    }
}

export default FirebaseRealtimeService;
