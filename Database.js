import { SQLite } from "expo";

const db = db || SQLite.openDatabase("dailytime-1.db");

export default class Database {
  static queryByTargetShortDate(targetShort, callback) {
    db.transaction(tx => {
      tx.executeSql(
        `select * from entries where targetShortDate = ?;`,
        [targetShort],
        (_, { rows: { _array } }) => {
          callback(_array);
        }
      );
    });
  }

  static initTable(updateFn) {
    db.transaction(
      tx => {
        // Database.deleteTable();
        tx.executeSql(
          "create table if not exists entries (id integer primary key not null, logDate text, targetDate text, logShortDate text, targetShortDate text, success int);"
        );
      },
      null,
      updateFn
    );
  }

  static deleteTable() {
    db.transaction(tx => {
      tx.executeSql("drop table entries");
    });
  }

  static add(
    logDate,
    targetDate,
    logShortDate,
    targetShortDate,
    success,
    updateFn
  ) {
    db.transaction(
      tx => {
        this._executeInsert(
          tx,
          logDate,
          targetDate,
          logShortDate,
          targetShortDate,
          success
        );
      },
      e => {
        console.error(e);
      },
      updateFn
    );
  }

  static upsert(
    logDate,
    targetDate,
    logShortDate,
    targetShortDate,
    success,
    updateFn
  ) {
    db.transaction(
      tx => {
        this._executeDelete(tx, targetShortDate);
        this._executeInsert(
          tx,
          logDate,
          targetDate,
          logShortDate,
          targetShortDate,
          success
        );
      },
      e => {
        console.error(e);
      },
      updateFn
    );
  }

  static getAll(callback) {
    db.transaction(tx => {
      tx.executeSql("select * from entries", [], (_, { rows }) => {
        console.log(rows);
        callback(rows._array);
      });
    });
  }

  static _executeInsert(
    tx,
    logDate,
    targetDate,
    logShortDate,
    targetShortDate,
    success
  ) {
    tx.executeSql(
      "insert into entries (logDate, targetDate, logShortDate, targetShortDate, success) values (?, ?, ?, ?, ?)",
      [logDate, targetDate, logShortDate, targetShortDate, success]
    );
  }

  static _executeDelete(tx, targetShortDate) {
    tx.executeSql(`delete from entries where targetShortDate = ?;`, [
      targetShortDate
    ]);
  }
}
