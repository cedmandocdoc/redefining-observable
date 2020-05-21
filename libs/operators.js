const observable = require('./spec');

const noop = () => {};
const pipe = (fn, ...fns) => fns.reduce((value, acc) => acc(value), fn);

const map = project => inner => (open, next, fail, done, external) => {
  inner(open, value => next(project(value)), fail, done, external);
};

const take = amount => inner => (open, next, fail, done, external) => {
  let count = 0;
  const stop = teardown(external);
  inner(
    open,
    value => {
      next(value);
      if (++count >= amount) stop.run();
    },
    fail,
    done,
    stop.observable
  )
};

const teardown = inner => {
  let stop = noop;
  const _inner = (open, next, fail, done, external) => {
    stop = () => next(observable.CANCEL);
    inner(open, next, fail, done, external);
  };

  return { observable: _inner, run: () => stop() };
};

const listen = (open, next, fail, done, external = noop) => inner => inner(open, next, fail, done, external);

module.exports.noop = noop;
module.exports.pipe = pipe;
module.exports.map = map;
module.exports.take = take;
module.exports.teardown = teardown;
module.exports.listen = listen;
