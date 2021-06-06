import React from "react";
import ReactDOM from "react-dom";
import produce from "immer";
import "regenerator-runtime/runtime";

const RequestComponent = ({ id, isComplete = false, waitInMilliseconds }) => {
    return <li>{
        isComplete ?
            <span><strong>Request {id + 1}</strong> completed in <strong>{waitInMilliseconds} milliseconds</strong>.</span> :
            <span>Loading...</span>
    }</li>;
}

const ResponseComponent = ({ id, waitInMilliseconds }) => {
    return <li key={id}><strong>Response {id + 1}</strong> received in <strong>{waitInMilliseconds} milliseconds</strong>.</li>
}

const render = (state) => {
    ReactDOM.render(
        <div style={{display: "flex"}}>
            <div>
                <h2>Requests</h2>
                <ol>
                    { state.requests.map((request) =>
                        <RequestComponent
                            key={request.id}
                            id={request.id}
                            isComplete={request.isComplete}
                            waitInMilliseconds={request.waitInMilliseconds}
                        />
                    ) }
                </ol>
            </div>
            <div>
                <h2>Responses</h2>
                <ol>
                    { state.responses.map((response, index) =>
                        <ResponseComponent
                            key={index}
                            id={response.id}
                            waitInMilliseconds={response.data.waitInMilliseconds}
                        />
                    ) }
                </ol>
            </div>
        </div>,
        document.getElementById("container")
    );
}

const requestCompleteReducer = produce((draftState, response) => {
    draftState.requests[response.id].waitInMilliseconds = response.data.waitInMilliseconds;
    draftState.requests[response.id].isComplete = true;
    draftState.responses.push(response);
});

const randomWait = async ({ maxWaitInMilliseconds = 1000 }) => {
    return new Promise((resolve) => {
        const timeoutInMilliseconds = Math.floor(Math.random() * maxWaitInMilliseconds);
        setTimeout(() => resolve({ waitInMilliseconds: timeoutInMilliseconds }), timeoutInMilliseconds);
    });
};

const maxWaitInMilliseconds = 5000;
const requestCount = 40;

const promises = Array(requestCount)
    .fill(0)
    .map(() => randomWait({ maxWaitInMilliseconds }));

(async (state) => {
    await Promise.all(promises.map(async (promise, index) => {
        const data = await promise;
        state = requestCompleteReducer(state, { id: index, data });
        render(state);
    }));
})({
    requests: promises.map((_, index) => ({ id: index, isComplete: false })),
    responses: []
});
