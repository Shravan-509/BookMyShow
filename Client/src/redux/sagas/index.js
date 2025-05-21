import { all, fork } from "redux-saga/effects";
import { authSaga } from "./authSaga";
import { verificationSaga } from "./verificationSaga"

// Root Saga that combines all sagas
export function* rootSaga(){
    yield all([fork(authSaga), fork(verificationSaga)])
}