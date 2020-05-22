const noop = () => {};

class Observable {
  constructor(producer) {
    this.producer = producer;
  }

  map(fn) {
    return new Observable((open, next, fail, done, external) => {
      this.listen(open, (value) => next(fn(value)), fail, done, external);
    });
  }

  tap(fn) {
    return this.map((value) => {
      fn(value);
      return value;
    });
  }

  take(amount) {
    return new Observable((open, next, fail, done, external) => {
      let count = 0;
      const teardown = new Teardown(external.producer);
      this.listen(
        open,
        (value) => {
          next(value);
          if (++count >= amount) teardown.run();
        },
        fail,
        done,
        teardown
      );
    });
  }

  listen(
    open = noop,
    next = noop,
    fail = noop,
    done = noop,
    external = new Observable(noop)
  ) {
    let completed = false;
    let cancelled = false;
    let active = false;
    this.producer(
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
      external.tap((value) => {
        if (value === Observable.CANCEL) {
          cancelled = true;
        }
      })
    );
  }
}

Observable.CANCEL = Symbol("CANCEL");

class Teardown extends Observable {
  constructor(producer = noop) {
    super(producer);
    this.run = noop;
  }

  listen(
    open = noop,
    next = noop,
    fail = noop,
    done = noop,
    external = new Observable(noop)
  ) {
    open();
    this.run = () => next(Observable.CANCEL);
    this.producer(open, next, fail, done, external);
  }
}

module.exports.Observable = Observable;
module.exports.Teardown = Teardown;
