const Observable = require("../Observable");

const interval = duration =>
  new Observable((open, next, fail, done, external) => {
    let count = 0;
    const id = setInterval(() => next(++count), duration);
    open();
    external
      .filter((value) => value === Observable.CANCEL)
      .tap(() => {
        clearInterval(id);
        done(true);
      })
      .listen();
  });

interval(100)
  .map(count => `Current count: ${count}`)
  .take(5)
  .listen(
    () => console.log("open"),
    value => console.log(value),
    error => console.log(error),
    cancelled => console.log("cancelled", cancelled)
  );
