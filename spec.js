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

  filter(fn) {
    return new Observable((open, next, fail, done, external) => {
      this.listen(
        open,
        (value) => fn(value) && next(value),
        fail,
        done,
        external
      );
    });
  }

  take(amount) {
    return new Observable((open, next, fail, done, external) => {
      let count = 0;
      this.listen(
        open,
        (value) => {
          next(value);
          if (++count >= amount) done();
        },
        fail,
        done,
        external
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
    let active = false;
    const teardown = new Teardown(external);
    this.producer(
      () => {
        if (active) return;
        active = true;
        open();
      },
      (value) => {
        if (!active || completed) return;
        try {
          next(value);
        } catch (error) {
          fail(error);
        }
      },
      (error) => {
        if (!active || completed) return;
        fail(error);
      },
      () => {
        if (!active || completed) return;
        completed = true;
        try {
          teardown.run();
          done();
        } catch (error) {
          fail(error);
        }
      },
      teardown.tap(
        ([value]) => value === Observable.CANCEL && (active = true)
      )
    );
  }
}

Observable.CANCEL = Symbol("CANCEL");

class Teardown extends Observable {
  constructor(observable = new Observable(noop)) {
    super((...args) => observable.listen(...args));
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
    this.run = () => next([Observable.CANCEL]);
    this.producer(open, next, fail, done, external);
  }
}

module.exports.Observable = Observable;
module.exports.Teardown = Teardown;
