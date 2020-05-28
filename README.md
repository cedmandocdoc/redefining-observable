# Redefining Observable

_An attempt to redefine Observable at its core_

## Introduction

Observable is the building block of reactive application, it is useful for logic that deals with asynchrony like promises, timeouts, web sockets, and dom events. Based on the article [Learning Observable By Building Observable](https://medium.com/@benlesh/learning-observable-by-building-observable-d5da57405d87) authored by Ben Lesh, Observable is defined as a function that takes an observer and returns a function. It connects the observer to something that produces values and returns a means to cancel the connection.

The definition is widely known and appears on other articles as well, check out the links below for references.

- [Introduction to Observable](https://medium.com/@davidjtomczyk/introduction-to-observable-85a5122bf260)
- [JavaScript — Observables Under The Hood](https://netbasal.com/javascript-observables-under-the-hood-2423f760584)
- [Understanding RxJS Observables and why you need them](https://blog.logrocket.com/understanding-rxjs-observables/)

The implementation follows the same definition. In pseudo-code form, it looks like this

```javascript
const observable = next => {
  const id = setInterval(() => next('data'), 1000));
  return () => clearInterval(id);
};

const cancel = observable(data => console.log(data));
```

On the code above, the observable takes an observer in the form of a function named `next` which then called on the callback of `setInterval` then returns a function that teardown the connection of the observer to the producer by `clearInterval`. Many Observable libraries have this kind of implementation. They may vary on observer types or observable initialization and composition but always conforms to provide values and cancellation to the observer.

But there could be more to explore what Observable is. This article attempts to rethink its current definition, dissecting fundamental properties in the hope to define what it is at its core.

## Observable Redefined

The definition mentioned above shows that Observable properties are the following:

- a function that provides values: any object that able to produce values
- takes an observer: connects an observer to the producer
- returns a function: provides a means of turning down the connection

These properties may seem fundamental but not all of them.

Take a look at the English definition of Observable, from [merriam webster](https://www.merriam-webster.com/dictionary/observable), it was defined as `capable of being observed`. Nothing more nothing less, it does not interact back from an external entity.  With that in mind, the only fundamental property of an Observable is when observed it provides something to the observer, this void the cancellation as a fundamental property.

In a real-world program implementing an Observable without a way of canceling the connection may impose a dangerous problem later on. Leaving an Observable provides data across the program, without needing it anymore could result in memory leak or can eat up processes. Cancellation may not be a fundamental property of an Observable but it is an emergent property of a reactive program and plays a crucial role across.

Solving the cancellation problem can never be achieved using only an Observable, a reactive program asks for a more powerful object. First, take a look at the English definition of cancellation, from [merriam webster](https://www.merriam-webster.com/dictionary/cancellation), it was defined as `the act or an instance of canceling`. It is an action so it involves a representation (at least an identification of the action) and an actor. It is like a signal or data provided by an entity, this definition looks just like an Observable, but with context. Cancellation is a data signal given by an Observable that represents of canceling something.

This could mean, that for an Observable to be canceled it should observe an Observable that emits a representation of canceling something. This idea reforms its definition to be reactive on an external entity. Reactive Observable could be the type of object needed by a reactive program not just a pure Observable.

Below is a pseudo-code implementation of a Reactive Observable with cancellation context.

```javascript
const cancelObservable = (next) => {
  setTimeout(() => next('cancel'), 2000); // sends data that represents a cancellation
};

const intervalObservable = (next, externalObservable) => {
  const id = setInterval(() => next('data'), 1000)); // sends data

  // listens to external observable for cancellation
  externalObservable(data => {
    if (data === 'cancel') clearInterval(id); // cancel the propgation when external observable emits cancellation
  });
};

intervalObservable(data => console.log(data), cancelObservable);
```
The code above forms a communication between two observables. The `intervalObservable` accepts an observer which is a function called `next` and an observable called `externalObservable` to listen for cancellation making the `intervalObservable` reactive. The code also shows that some observable may not be reactive, for instance `cancelObservable` doesn't react to an external entity leaving it only as an Observable.

## Reactive Observable pattern

A reactive observable pattern opens up a whole new set of doors. Cancellation is one thing, but never limits to that. A timer for instance, emits data in the form of time but also listens to an external entity when to propagate or when to pause or when to completely stop. Pull observables can be also be built by this pattern, on which the producer listens to a consumer request as an indication that the data should be sent.

Sometimes the name reactive observable is hard to comprehend. The capability of being observed does not directly imply that data will be sent. A reactive data stream is another name to think of this pattern. Using this term it reverses the idea of being observed directly to emit data. The term Reactive Observable has been only used to gain attraction since the word Observable is famous in reactive programming.

For what a Reactive Observable provides, its definition could be, an object that can be observed and to observe. Below is its pseudo-code form.

```javascript
const reactiveObservable = (observer, externalObservable) => {};
```
It accepts an observer and an Observable from the outside. An observer is an object that could be in any shape but its purpose should be served and that is a means to emit data. External Observable is an Observable from the outside that could be listened to and react accordingly.

## Speculated Spec

A pattern is not enough to apply the idea in a real-world program. Specification generalized a pattern and unifies an implementation across programs. A speculated spec of a Reactive Observable is inherited from the implementation of Observables in the wild. The types of observer it accepts are the following:

- `open` - callback for ready notification.
- `next` - unary callback for data provision.
- `fail` - unary callback for error notification.
- `done` - unary callback for completion notification.

Below is a pseudo-code of its shape together with the observers.
```javascript
const myobservable = (open, next, fail, done, externalObservable) => {};
```

Next is the specification for external observable, for Observables to properly play with each other, their communication should be bounded by some rules. Most of the time, external Observable emits cancellation but it should never limit to that. To handle generic communication, Symbols can be used to represent data without colliding with one another.

Moreover a representation is not enough for an Observable to react, some representation may impose with the same type but could have different variables. For instance, a timer Observable that reacts on a signal that jumps over a certain period of time. The representation is to jump but it also needs to tell on what time the timer should jump. The specification for an external Observable should emit a type and payload. Lastly, it will get unsubscribed upon calling `done` observer.

Below is a pseudo code implementation of Observable communication.
```javascript
const externalObservable = (open, next, fail, done) => {
  open();
  next([symbol, payload]); // communicate with other observable through type and a payload
};
```

For a complete example of the specification, see [spec.js](https://github.com/cedmandocdoc/redefining-observable/blob/master/spec.js#L3).

## Final Words

Observable is a great tool for asynchronous programming, it functionally connects different async codes. But the definition of the capability of just being observed has been changed due to some problems like the need for cancellation. Maybe a greater tool than Observable is needed, like making the observable reactive to an external entity. Combining the idea of being observed and be able to observe creates a powerful tool for reactive programming.

For more actions, check the examples folder.