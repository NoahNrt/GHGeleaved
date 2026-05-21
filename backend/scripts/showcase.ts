import Database from "better-sqlite3";

function test1() {
  const db = new Database("dorn_db.sql");

  //   const row = db.prepare("SELECT * FROM rewievs");
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all();

  console.log(tables);
}

function test2() {
  const db = new Database("data.db");

  const review = db
    .prepare("SELECT * FROM reviews where genre = 'musik'")
    .all();

  console.log(review);
}

test1();
