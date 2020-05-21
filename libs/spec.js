const CANCEL = Symbol('CANCEL');

module.exports = (innerObservable) => (open, next, fail, done, outerObservable) => {
  let completed = false;
  let cancelled = false;
  let active = false;
  innerObservable(
    () => {
      if (active || completed) return;
      active = true;
      open();
    },
    (value) => {
      if (!active || cancelled || completed) return;
      try {
        next(value);
      } catch (error) {
        fail(error);
      }
    },
    (error) => {
      if (!active || cancelled || completed) return;
      fail(error);
    },
    (cancelled) => {
      if (!active || completed) return;
      completed = true;
      try {
        done(cancelled);
      } catch (error) {
        fail(error);
      }
    },
    (_open, _next, _fail, _done, _observable) => {
      outerObservable(
        _open,
        (value) => {
          if (value === CANCEL) {
            cancelled = true;
          }
          _next(value);
        },
        _fail,
        _done,
        _observable
      );
    }
  );
};

module.exports.CANCEL = CANCEL;