import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export const openDb = async () => {
    return open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });
};
