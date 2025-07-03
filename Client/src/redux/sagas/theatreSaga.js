import { takeLatest, put, call } from "redux-saga/effects";
import { axiosInstance } from "../../api/index";
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
import moment from "moment";
import { notify } from "../../utils/notificationUtils";

// Theatre API calls
const fetchTheatresAPI = async () => {
    try {
        const response = await axiosInstance.get("/theatres");
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to fetch Theatres';
        throw new Error(message);
    }
};

const addTheatreAPI = async (theatre) => {
    try {
        const response = await axiosInstance.post("/theatres", theatre);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to Add a Theatre';
        throw new Error(message);
    }
};

const updateTheatreAPI = async ({id, theatre}) => {
    try {
        const response = await axiosInstance.patch(`/theatres/${id}`, theatre);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to Update a Theatre';
        throw new Error(message);
    }
};

const deleteTheatreAPI = async (id) => {
    try {
        const response = await axiosInstance.delete(`/theatres/${id}`);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to Delete a Theatre';
        throw new Error(message);
    }
};

// Worker Sagas
function* getTheatresSaga() {
    try{
        
        const response = yield call(fetchTheatresAPI);
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
        yield put(getTheatresFailure(error.message));
        notify("error", "Error fetching theatres. Please try again.", error?.message);
    }
}

function* addTheatreSaga(action) {
    try{ 
        const response = yield call(addTheatreAPI, action.payload);
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
        yield put(addTheatreFailure(error.message));
        notify("error", "Error adding theatre. Please try again.", error?.message);
    }
}

function* updateTheatreSaga(action) {
    try{ 
        const response = yield call(updateTheatreAPI, action.payload);
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
        yield put(updateTheatreFailure(error.message));
        notify("error", "Error updating theatre. Please try again.", error?.message);  
    }
}

function* deleteTheatreSaga(action) {
    try{ 
        const response = yield call(deleteTheatreAPI, action.payload);
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
        yield put(deleteTheatreFailure(error.message));
        notify("error", "Error deleting theatre. Please try again.", error?.message);  
    }
}


// Watcher Saga
export function* theatreSaga(){
    yield takeLatest(getTheatresRequest.type, getTheatresSaga);
    yield takeLatest(addTheatreRequest.type, addTheatreSaga);
    yield takeLatest(updateTheatreRequest.type, updateTheatreSaga);
    yield takeLatest(deleteTheatreRequest.type, deleteTheatreSaga);
}