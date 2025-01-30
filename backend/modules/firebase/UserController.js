import FirebaseRealtimeService from "./FirebaseRealtimeService.js";

import { initializeApp } from "firebase/app";

// use env
const admin_firebaseConfig = {
    apiKey: "AIzaSyDmzdrnFly1Re-pO2ggSbI8F-i9u6cm6HA",
    authDomain: "jwt-auth-session.firebaseapp.com",
    projectId: "jwt-auth-session",
    storageBucket: "jwt-auth-session.firebasestorage.app",
    messagingSenderId: "848181655825",
    appId: "1:848181655825:web:1e59538a00be213203b4b0"
};


const DB_PATHS = {
    USERS: "users",
    SESSIONS: "active_sessions",
    GLOBAL_VAR: "global_var",
};

const MAP = [DB_PATHS.USERS, DB_PATHS.SESSIONS];

class UserController {
    constructor(firebaseConfig = admin_firebaseConfig) {
        const firebaseApp = initializeApp(firebaseConfig);
        this.firebaseService = new FirebaseRealtimeService(firebaseApp);
        this.user = null;
    }
    // this.firebaseService.pushData (create unique id)
    // this.firebaseService.setData (create you define id)
    async push(user) {
        await this.firebaseService.setData(`${DB_PATHS.USERS}/${user.username}`, user);
    }

    async get(username) {
        this.user = await this.firebaseService.getData(`${DB_PATHS.USERS}/${username}`)
        return this.user;
    }

    async has(username) {
        return (await this.get(username)) !== null;
    }

    async delete(username) {
        await this.firebaseService.deleteData(`${DB_PATHS.USERS}/${username}`);
    }


    async addUserSession(session) {
        await this.firebaseService.pushData(`${DB_PATHS.SESSIONS}/${session.username}`, { refreshToken: session.refreshToken });
    }

    async getUserSessions(username) {
        const sessions = await this.firebaseService.getData(`${DB_PATHS.SESSIONS}/${username}`);
        const result = [];
        for (const [key, value] of Object.entries(sessions)) {
            result.push({ firebaseID: key, refreshToken: value.refreshToken });
        }
        return result;
    }

    async deleteAllSessions(username) {
        await this.firebaseService.deleteData(`${DB_PATHS.SESSIONS}/${username}`);
        // const sessions = await this.getUserSessions(username);
        // for (const session of sessions) {
        //     // can keep some
        //     await this.firebaseService.deleteData(`${DB_PATHS.SESSIONS}/${username}/${session.firebaseID}`);
        // }
    }

    async addContent(content_json, sheet_index) {
        if (sheet_index == 1) {
            await this.addUserSession(content_json);
        } else {
            await this.firebaseService.pushData(`${sheet_index}`, content_json);
        }
    }
    async updateContent(content_json, path, variable) {
        await this.firebaseService.updateData(`${DB_PATHS[path]}/${variable}`, content_json);
    }
    async deleteContent(filterColumn, filterValue, sheet_index = 0) {
        switch (filterColumn) {
            case "refreshToken":
                const { username } = this.user;
                const sessions = await this.getUserSessions(username);
                for (const session of sessions) {
                    if (filterValue == session.refreshToken)
                        await this.firebaseService.deleteData(`${DB_PATHS.SESSIONS}/${username}/${session.firebaseID}`);
                }
                break;
            default:
                break;
        }
    }
    async getContent(path, variable) {
        return await this.firebaseService.getData(`${DB_PATHS[path]}/${variable}`);
    }
}

export default UserController;
