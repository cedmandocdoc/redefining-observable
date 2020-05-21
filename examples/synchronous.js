const observable = require('../libs/spec');
const { noop, pipe, map, take, listen, teardown} = require('../libs/operators');

// source
const fromArray = array => (open, next, fail, done, external) => {
  let cancelled = false;
  external(
    noop,
    value => {
      if (value === observable.CANCEL) {
        cancelled = true;
        done(true);
      }
    },
    noop,
    noop,
    noop
  );
  open();
  for (let index = 0; index < array.length; index++) {
    if (cancelled) break;
    next(array[index]);
  }
  if (!cancelled) done(false);
};


const data = [1, 2, 3 , 4, 5, 6, 7, 8, 9, 10];

// no cancellation
pipe(
  fromArray(data),
  listen(
    () => console.log('open'),
    value => console.log(value),
    error => console.log(error),
    cancelled => console.log(cancelled),
  )
);

// take operator cancellation
pipe(
  fromArray(data),
  map(count => `Current count: ${count}`),
  take(5),
  listen(
    () => console.log('open'),
    value => console.log(value),
    error => console.log(error),
    cancelled => console.log(cancelled),
  )
);

// manaul cancellation
const stop = teardown(noop);
pipe(
  fromArray(data),
  map(count => `Current count: ${count}`),
  listen(
    () => console.log('open'),
    value => {
      console.log(value);
      if (value === 'Current count: 5') stop.run();
    },
    error => console.log(error),
    cancelled => console.log(cancelled),
    stop.observable
  )
);