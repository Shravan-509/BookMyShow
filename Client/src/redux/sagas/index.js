import { all, fork } from "redux-saga/effects";
import { authSaga } from "./authSaga";
import { verificationSaga } from "./verificationSaga"
import { forgotPasswordSaga } from "./forgotPasswordSaga"
import { movieSaga } from "./movieSaga";
import { theatreSaga } from "./theatreSaga";
import { showSaga } from "./showSaga";
import { profileSaga } from "./profileSaga";

// Root Saga that combines all sagas
export function* rootSaga(){
    yield all([
        fork(authSaga), 
        fork(verificationSaga),
        fork(forgotPasswordSaga),
        fork(movieSaga),
        fork(theatreSaga),
        fork(showSaga),
        fork(profileSaga)
    ])
}