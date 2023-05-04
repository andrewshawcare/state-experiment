import "regenerator-runtime/runtime";
import React from "react";
import ReactDOM from "react-dom";
import { createStore, applyMiddleware, compose } from "redux";
import { createActions, handleActions } from "redux-actions";
import produce from "immer";
import createSagaMiddleware from "redux-saga";
import { call, put, takeEvery } from "redux-saga/effects";

function RequestComponent({ id, isComplete = false }) {
  return (
    <div>
      {isComplete ? (
        <span>Request {id + 1} completed.</span>
      ) : (
        <span>Loading...</span>
      )}
    </div>
  );
}
React.memo(RequestComponent);

function ResponseComponent({ id, waitInMilliseconds }) {
  return (
    <div key={id}>
      Response {id + 1} received in {waitInMilliseconds} milliseconds.
    </div>
  );
}
React.memo(ResponseComponent);

const { requestReceived, requestCompleted, responseReceived } = createActions(
  "REQUEST_RECEIVED",
  "REQUEST_COMPLETED",
  "RESPONSE_RECEIVED"
);

const defaultState = { requests: [], responses: [] };

const reducer = handleActions(
  {
    [requestReceived]: produce((state, action) => {
      state.requests.push(action.payload);
    }),
    [requestCompleted]: produce((state, action) => {
      state.requests[action.payload.id].isComplete = true;
    }),
    [responseReceived]: produce((state, action) => {
      state.responses.push(action.payload);
    })
  },
  defaultState
);
const sagaMiddleware = createSagaMiddleware();
const composeEnhancers =
  (typeof window !== "undefined" &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;
const store = createStore(
  reducer,
  defaultState,
  composeEnhancers(applyMiddleware(sagaMiddleware))
);

const render = state => {
  ReactDOM.render(
    <div style={{ display: "flex" }}>
      <div>
        <h2>Requests</h2>
        {state.requests.map(request => (
          <RequestComponent
            key={request.id}
            id={request.id}
            isComplete={request.isComplete}
          />
        ))}
      </div>
      <div>
        <h2>Responses</h2>
        {state.responses.map((response, index) => (
          <ResponseComponent
            key={index}
            id={response.id}
            waitInMilliseconds={response.data.waitInMilliseconds}
          />
        ))}
      </div>
    </div>,
    document.getElementById("container")
  );
};
store.subscribe(() => render(store.getState()));

const wait = async (waitInMilliseconds = 0) => {
  return new Promise(resolve => {
    setTimeout(() => resolve({ waitInMilliseconds }), waitInMilliseconds);
  });
};

function* fetchResponse(action) {
  const data = yield call(wait, action.payload.request);
  yield put(requestCompleted({ id: action.payload.id, isComplete: true }));
  yield put(responseReceived({ id: action.payload.id, data }));
}

function* requestReceivedSaga() {
  yield takeEvery("REQUEST_RECEIVED", fetchResponse);
}

sagaMiddleware.run(requestReceivedSaga);

const requestCount = 100;
const maxWaitInMilliseconds = 5000;
const requests = Array(requestCount)
  .fill(0)
  .map(() => Math.round(Math.random() * maxWaitInMilliseconds));

requests.map((request, index) => {
  store.dispatch(requestReceived({ id: index, isComplete: false, request }));
});
