import { all, fork } from "redux-saga/effects";
import { authSaga } from "./authSaga";
import { verificationSaga } from "./verificationSaga"
import { forgotPasswordSaga } from "./forgotPasswordSaga"
import { movieSaga } from "./movieSaga";
import { theatreSaga } from "./theatreSaga";

// Root Saga that combines all sagas
export function* rootSaga(){
    yield all([
        fork(authSaga), 
        fork(verificationSaga),
        fork(forgotPasswordSaga),
        fork(movieSaga),
        fork(theatreSaga)
    ])
}