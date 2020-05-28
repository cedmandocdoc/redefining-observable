const { Observable, Emitter } = require("../spec");

// source
const fromArray = (array) =>
  new Observable((open, next, fail, done, external) => {
    let cancelled = false;
    external
      .filter(([value]) => value === Observable.CANCEL)
      .tap(() => {
        cancelled = true;
        done(cancelled);
      })
      .listen();
    open();
    for (let index = 0; index < array.length; index++) {
      if (cancelled) break;
      next(array[index]);
    }

    if (!cancelled) done(cancelled);
  });

const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// no cancellation
console.log("no cancellation");
fromArray(data).listen(
  () => console.log("open"),
  (value) => console.log(value),
  (error) => console.log(error),
  (cancelled) => console.log('cancelled', cancelled)
);

console.log("\n");
console.log("take operator cancellation");

// take operator cancellation
fromArray(data)
  .map((count) => `Current count: ${count}`)
  .take(5)
  .listen(
    () => console.log("open"),
    (value) => console.log(value),
    (error) => console.log(error),
    (cancelled) => console.log('cancelled', cancelled)
  );

console.log("\n");
console.log("manual cancellation with emission");

// manual cancellation with emission
let emitter = new Emitter();
fromArray(data)
  .map((count) => `Current count: ${count}`)
  .listen(
    () => console.log("open"),
    (value) => {
      console.log(value);
      if (value === "Current count: 5") emitter.next([Observable.CANCEL]);
    },
    (error) => console.log(error),
    (cancelled) => console.log('cancelled', cancelled),
    emitter
  );

console.log("\n");
console.log("manual cancellation with no emission");

// manual cancellation with no emissio
emitter = new Emitter();
fromArray(data).listen(
  () => {
    console.log("open");
    emitter.next([Observable.CANCEL]);
  },
  (value) => console.log(value),
  (error) => console.log(error),
  (cancelled) => console.log('cancelled', cancelled),
  emitter
);
