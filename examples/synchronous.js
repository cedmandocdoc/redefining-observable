const { Observable, Teardown } = require("../spec");

// source
const fromArray = (array) =>
  new Observable((open, next, fail, done, external) => {
    let cancelled = false;
    external
      .filter(([value]) => value === Observable.CANCEL)
      .take(1)
      .tap(() => {
        cancelled = true;
        done(true);
      })
      .listen();
    open();
    for (let index = 0; index < array.length; index++) {
      if (cancelled) break;
      next(array[index]);
    }
    if (!cancelled) done(false);
  });

const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// no cancellation
console.log("no cancellation");
fromArray(data).listen(
  () => console.log("open"),
  (value) => console.log(value),
  (error) => console.log(error),
  (cancelled) => console.log(cancelled)
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
    (cancelled) => console.log(cancelled)
  );

console.log("\n");
console.log("manual cancellation with emission");

// manual cancellation with emission
let teardown = new Teardown();
fromArray(data)
  .map((count) => `Current count: ${count}`)
  .listen(
    () => console.log("open"),
    (value) => {
      console.log(value);
      if (value === "Current count: 5") teardown.run();
    },
    (error) => console.log(error),
    (cancelled) => console.log(cancelled),
    teardown
  );
  
console.log("\n");
console.log("manual cancellation with no emission");

// manual cancellation with no emissio
teardown = new Teardown();
fromArray(data)
  .map((count) => `Current count: ${count}`)
  .listen(
    () => {
      teardown.run();
      console.log("open");
    },
    (value) => console.log(value),
    (error) => console.log(error),
    (cancelled) => console.log(cancelled),
    teardown
  );

