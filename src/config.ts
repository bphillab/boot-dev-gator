import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {homedir} from "node:os";

export type Config = {
    dbUrl: string,
    currentUserName?:string
}

export function setUser(username:string){
    const config:Config = readConfig();
    config.currentUserName = username;
    writeConfig(config);
}

export function readConfig():Config {
    const fp = getConfigFilePath();
    const json = readFileSync(fp, "utf8");
    return validateConfig(JSON.parse(json));
}

function getConfigFilePath():string {
    return join(homedir(), ".gatorconfig.json");
}

function writeConfig(config:Config) {
    const fp = getConfigFilePath();
    const fileConfig = {db_url: config.dbUrl,
        ...(config.currentUserName !== undefined
            ? { current_user_name: config.currentUserName }
            : {}),
    };
    const json = JSON.stringify(fileConfig);
    writeFileSync(fp, json, "utf8");
}

function validateConfig(rawConfig:any):Config{
    if (typeof rawConfig !== "object" || rawConfig === null || Array.isArray(rawConfig)) {
        throw new Error("Config must be an object");
    }
    const obj = rawConfig as Record<string, unknown>;
    if (typeof obj.db_url !== "string" || obj.db_url.trim() === "") {
        throw new Error("db_url is required and must be a non-empty string");
    }
    let currentUserName: string | undefined = undefined;
    if (obj.current_user_name !== undefined) {
        if (typeof obj.current_user_name !== "string") {
            throw new Error("current_user_name must be a string");
        }
        currentUserName = obj.current_user_name;
    }

    return {dbUrl: obj.db_url,
        currentUserName,
            };
}

