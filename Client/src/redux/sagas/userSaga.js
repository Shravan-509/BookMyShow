import { takeLatest, put, call } from "redux-saga/effects"
import { getAllUsersFailure, getAllUsersRequest, getAllUsersSuccess } from "../slices/userSlice"
import { UserAPI } from "../../api/user"
import { notify } from "../../utils/notificationUtils";

function* getAllUsersSaga() {
  try {
    
    const response = yield call(UserAPI.fetchAllUsers)
    if (response.success) 
    {
      yield put(getAllUsersSuccess(response.data))
    } 
    else 
    {
      yield put(getAllUsersFailure(response.message))
      notify("warning", response.message || "Failed to fetch users");
    }
  } 
  catch (error) 
  {
    const errorMessage = error.response?.data?.message || error.message
    yield put(getAllUsersFailure(errorMessage));
    notify("error", "Error fetching users. Please try again.", errorMessage)
  }
}

export function* userSaga() {
  yield takeLatest(getAllUsersRequest.type, getAllUsersSaga)
}
