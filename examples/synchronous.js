const Observable = require("../Observable");

// source
const fromArray = array =>
  new Observable((open, next, fail, done, external) => {
    let cancelled = false;
    external
      .filter((value) => value === Observable.CANCEL)
      .tap(() => {
        // dirty, should be on listen -> next method
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
  value => console.log(value),
  error => console.log(error),
  cancelled => console.log("cancelled", cancelled)
);

console.log("\n");
console.log("take operator cancellation");

// take operator cancellation
fromArray(data)
  .map(count => `Current count: ${count}`)
  .take(5)
  .listen(
    () => console.log("open"),
    value => console.log(value),
    error => console.log(error),
    cancelled => console.log("cancelled", cancelled)
  );

console.log("\n");
console.log("manual cancellation with emission");

// manual cancellation with emission
let cancellation = new Observable.CancelSignal();
fromArray(data)
  .map(count => `Current count: ${count}`)
  .listen(
    () => console.log("open"),
    value => {
      console.log(value);
      if (value === "Current count: 5") cancellation.run()
    },
    error => console.log(error),
    cancelled => console.log("cancelled", cancelled),
    cancellation
  );

console.log("\n");
console.log("manual cancellation with no emission");

// manual cancellation with no emission
cancellation = new Observable.CancelSignal();
fromArray(data).listen(
  () => {
    console.log("open");
    cancellation.run()
  },
  value => console.log(value),
  error => console.log(error),
  cancelled => console.log("cancelled", cancelled),
  cancellation
);
