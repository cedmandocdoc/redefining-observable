const observable = require('../libs/spec');
const { noop, pipe, map, take, listen } = require('../libs/operators');

// source
const interval = duration => observable((open, next, fail, done, external) => {
  let count = 0;
  open();
  const id = setInterval(() => next(++count), duration);
  const clear = value => {
    if (value === observable.CANCEL) {
      clearInterval(id);
      done(true);
    }
  };

  external(noop, clear, noop, noop, noop);
});

pipe(
  interval(100),
  map(count => `Current count: ${count}`),
  take(5),
  listen(
    () => console.log('open'),
    value => console.log(value),
    error => console.log(error),
    cancelled => console.log(cancelled)
  )
)