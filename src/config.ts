import fs from "fs";
import os from "os";
import path from "path";

export type Config ={
    dbUrl: string;
    currentUserName: string;
};

export function setUser(user: string): void {
    const config = readConfig();
    config.currentUserName = user;
    writeConfig(config);
}

export function readConfig(): Config {
    const filePath = getConfigFilePath();
    const read = fs.readFileSync(filePath, 'utf-8');
    const parsedJSON = JSON.parse(read);
    const validatedJSON = validateConfig(parsedJSON);
    return validatedJSON;
}

function getConfigFilePath(): string{
    const home = os.homedir();
    const filePath = path.join(home, '.gatorconfig.json');
    return filePath;
}

function writeConfig(cfg: Config): void {
    const returnConfig = {
        db_url: cfg.dbUrl,
        current_user_name: cfg.currentUserName
    };
    const stringJSON = JSON.stringify(returnConfig);
    
    const filePath = getConfigFilePath();
    fs.writeFileSync(filePath, stringJSON);
}

function validateConfig(rawConfig: any): Config {
    const newConfig = {
        dbUrl: rawConfig.db_url,
        currentUserName: rawConfig.current_user_name ? rawConfig.current_user_name : "",
    }    
    return newConfig;

}
