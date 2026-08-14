import { takeLatest, put, call } from "redux-saga/effects";
import { 
    addTheatreFailure, 
    addTheatreRequest, 
    addTheatreSuccess, 
    deleteTheatreFailure, 
    deleteTheatreRequest, 
    deleteTheatreSuccess, 
    getTheatresFailure, 
    getTheatresRequest, 
    getTheatresSuccess, 
    updateTheatreFailure, 
    updateTheatreRequest, 
    updateTheatreSuccess
    } from "../slices/theatreSlice";
import { notify } from "../../utils/notificationUtils";
import { TheatreAPI } from "../../api/theatre";

// Worker Sagas
function* getTheatresSaga() {
    try{
        
        const response = yield call(TheatreAPI.fetch);
        if(response.success)
        {
            yield put(getTheatresSuccess(response.data));
            // Show success message
            notify("success", response.message);
        }
        else
        {
            yield put(getTheatresFailure(response.message));
            notify("warning", "Failed to fetch theatres", response.message);
        }
        
    }
    catch(error)
    {
        const errorMessage = error.response?.data?.message || error.message
        yield put(getTheatresFailure(errorMessage));
        notify("error", "Error fetching theatres. Please try again.", errorMessage);
    }
}

function* addTheatreSaga(action) {
    try{ 
        const response = yield call(TheatreAPI.create, action.payload);
        if(response.success)
        {
            yield put(addTheatreSuccess(response.message));
            // Show success message
            notify("success", response.message);

            yield put(getTheatresRequest());
        }
        else
        {
            yield put(addTheatreFailure(response.message));
            notify("warning", "Failed to add theatre", response.message);
        }        
    }
    catch(error)
    {
        const errorMessage = error.response?.data?.message || error.message
        yield put(addTheatreFailure(errorMessage));
        notify("error", "Error adding theatre. Please try again.", errorMessage);
    }
}

function* updateTheatreSaga(action) {
    const {id, theatre} = action.payload;
    try{ 
        const response = yield call(TheatreAPI.update, id, theatre);
        if(response.success)
        {
            yield put(updateTheatreSuccess(response.data));
            // Show success message
            notify("success", response.message);

            yield put(getTheatresRequest());
        }
        else
        {
            yield put(updateTheatreFailure(response.message));
            notify("warning", "Failed to update theatre", response.message);
        }    
    }
    catch(error)
    {
        const errorMessage = error.response?.data?.message || error.message
        yield put(updateTheatreFailure(errorMessage));
        notify("error", "Error updating theatre. Please try again.", errorMessage);  
    }
}

function* deleteTheatreSaga(action) {
    try{ 
        const response = yield call(TheatreAPI.delete, action.payload);
         if(response.success)
        {
            yield put(deleteTheatreSuccess(response.data));
            // Show success message
            notify("success", response.message);

            yield put(getTheatresRequest());
        }
        else
        {
            yield put(deleteTheatreFailure(response.message));
            notify("warning", "Failed to delete theatre", response.message);
        }    
    }
    catch(error)
    {
        const errorMessage = error.response?.data?.message || error.message
        yield put(deleteTheatreFailure(errorMessage));
        notify("error", "Error deleting theatre. Please try again.", errorMessage);  
    }
}


// Watcher Saga
export function* theatreSaga(){
    yield takeLatest(getTheatresRequest.type, getTheatresSaga);
    yield takeLatest(addTheatreRequest.type, addTheatreSaga);
    yield takeLatest(updateTheatreRequest.type, updateTheatreSaga);
    yield takeLatest(deleteTheatreRequest.type, deleteTheatreSaga);
}