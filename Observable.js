const IDLE = 0;
const ACTIVE = 1;
const DONE = 2;
const noop = () => {};

class Observable {
  constructor(producer) {
    this.producer = producer;
  }

  map(fn) {
    return new Observable((open, next, fail, done, external) => {
      this.listen(open, value => next(fn(value)), fail, done, external);
    });
  }

  tap(fn) {
    return this.map(value => {
      fn(value);
      return value;
    });
  }

  filter(fn) {
    return new Observable((open, next, fail, done, external) => {
      this.listen(
        open,
        value => fn(value) && next(value),
        fail,
        done,
        external
      );
    });
  }

  take(amount) {
    return new Observable((open, next, fail, done, external) => {
      let count = 0;
      const cancellation = new CancelInterceptor(external);
      this.listen(
        open,
        value => {
          next(value);
          if (++count >= amount) cancellation.run();
        },
        fail,
        done,
        cancellation
      );
    });
  }

  listen(
    open = noop,
    next = noop,
    fail = noop,
    done = noop,
    external = new OpenObservable()
  ) {
    const cancellation = new ExternalCancelInterceptor(external);
    let state = IDLE;
    this.producer(
      () => {
        if (state === IDLE) {
          state = ACTIVE;
          open();
        }
      },
      value => {
        if (state === ACTIVE) {
          try {
            next(value);
          } catch (error) {
            fail(error);
          }
        }
      },
      error => {
        if (state === ACTIVE) fail(error);
      },
      cancelled => {
        if (state === ACTIVE) {
          cancellation.run();
          done(cancelled);
          state = DONE;
        }
      },
      cancellation
    );
  }
}

// just an open observable that do nothing
class OpenObservable extends Observable {
  constructor() {
    super(open => open())
  }
}


// an observable that just emits cancel signal
class CancelSignal extends OpenObservable {
  constructor() {
    super();
    this.run = noop;
  }

  listen(open, next, fail, done, external) {
    this.run = () => next(Observable.CANCEL);
    super.listen(open, next, fail, done, external);
  }
}

// use internally to intercept observable
// to emit cancel signal to the source via run.
class CancelInterceptor extends Observable {
  constructor(observable) {
    super((open, next, fail, done, external) => observable.listen(open, next, fail, done, external));
    this.run = noop;
  }

  listen(open, next, fail, done, external) {
    this.run = () => next(Observable.CANCEL);
    super.listen(open, next, fail, done, external);
  }
}

// observable that intercepts external observable
// for cancellation
class ExternalCancelInterceptor extends Observable {
  constructor(observable) {
    super((open, next, fail, done, external) => observable.listen(open, next, fail, done, external));
    this.run = noop;
  }

  listen(open, next, fail, done, external) {
    const cancellation = new CancelInterceptor(external);
    this.run = () => cancellation.run();
    super.listen(open, next, fail, done, cancellation);
  }
}

Observable.CANCEL = Symbol("CANCEL");
Observable.CancelSignal = CancelSignal;

module.exports = Observable;
