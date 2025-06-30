import { all, fork } from "redux-saga/effects";
import { authSaga } from "./authSaga";
import { verificationSaga } from "./verificationSaga"
import { movieSaga } from "./movieSaga";

// Root Saga that combines all sagas
export function* rootSaga(){
    yield all([
        fork(authSaga), 
        fork(verificationSaga),
        fork(movieSaga)
    ])
}