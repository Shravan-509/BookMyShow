import { takeLatest, put, call } from "redux-saga/effects";
import { axiosInstance } from "../../api/index";
import { 
    addShowFailure, 
    addShowRequest, 
    addShowSuccess, 
    deleteShowFailure, 
    deleteShowRequest, 
    deleteShowSuccess, 
    updateShowFailure, 
    updateShowRequest, 
    updateShowSuccess,
    getShowByIdRequest, 
    getShowByIdSuccess,
    getShowByIdFailure,
    getShowsByTheatreSuccess,
    getShowsByTheatreFailure,
    getShowsByTheatreRequest,
    getTheatresWithShowsByMovieSuccess,
    getTheatresWithShowsByMovieFailure,
    getTheatresWithShowsByMovieRequest, 
    } from "../slices/showSlice";
import { notify } from "../../utils/notificationUtils";

// Show API calls
const addShowAPI = async (show) => {
    try {
        const response = await axiosInstance.post("/shows", show);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to Add a Show';
        throw new Error(message);
    }
};

const updateShowAPI = async ({id, show}) => {
    try {
        const response = await axiosInstance.patch(`/shows/${id}`, show);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to Update a Show';
        throw new Error(message);
    }
};

const deleteShowAPI = async (id) => {
    try {
        const response = await axiosInstance.delete(`/shows/${id}`);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to Delete a Show';
        throw new Error(message);
    }
};

export const getShowByIdAPI = async (id) => {
    try {
        const response = await axiosInstance.get(`/shows/${id}`);
        return response?.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to get a Show';
        throw new Error(message);
    }
};

export const getShowsByTheatreAPI = async (id) =>  {
    try {
        const response = await axiosInstance.get(`/shows/theatre/${id}`);
        return response?.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to get a Show in a Theatre';
        throw new Error(message);
    }
};

export const getTheatresWithShowsByMovieAPI = async (movie) =>  {
    try {
        const response = await axiosInstance.post('/shows/theatres/movie', movie);
        return response?.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to get Theatres for a Movie';
        throw new Error(message);
    }
};


// Worker Sagas
function* addShowSaga(action) {
    try{ 
        const response = yield call(addShowAPI, action.payload);
        if(response.success)
        {
            yield put(addShowSuccess(response.message));
            // Show success message
            notify("success", response.message);

            // Re-fetch shows for this theatre
            const theatreId = action.payload.theatre;
            yield put(getShowsByTheatreRequest(theatreId));
        }
        else
        {
            yield put(addShowFailure(response.message));
            notify("warning", "Failed to add show", response.message);
        }        
    }
    catch(error)
    {
        yield put(addShowFailure(error.message));
        notify("error", "Error adding show. Please try again.", error?.message);
    }
}

function* updateShowSaga(action) {
    try{ 
        const response = yield call(updateShowAPI, action.payload);
        if(response.success)
        {
            yield put(updateShowSuccess(response.data));
            // Show success message
            notify("success", response.message);

            // Re-fetch shows for this theatre
            const theatreId = action.payload.show.theatre;
            yield put(getShowsByTheatreRequest(theatreId));
        }
        else
        {
            yield put(updateShowFailure(response.message));
            notify("warning", "Failed to update show", response.message);
        }    
    }
    catch(error)
    {
        yield put(updateShowFailure(error.message));
        notify("error", "Error updating show. Please try again.", error?.message);  
    }
}

function* deleteShowSaga(action) {
    const { showId, theatreId } = action.payload;
    try{ 
        const response = yield call(deleteShowAPI, showId);
         if(response.success)
        {
            yield put(deleteShowSuccess(response.data));
            // Show success message
            notify("success", response.message);

            if(theatreId)
            {
                yield put(getShowsByTheatreRequest(theatreId));
            }
        }
        else
        {
            yield put(deleteShowFailure(response.message));
            notify("warning", "Failed to delete show", response.message);
        }    
    }
    catch(error)
    {
        yield put(deleteShowFailure(error.message));
        notify("error", "Error deleting show. Please try again.", error?.message);  
    }
}

function* getShowByIdSaga(action) {
    try{ 
        const response = yield call(getShowByIdAPI, action.payload);
        if(response.success)
        {
            yield put(getShowByIdSuccess(response.data));
            // Show success message
            notify("success", response.message);
        }
        else
        {
            yield put(getShowByIdFailure(response.message));
            notify("warning", "Failed to get show", response.message);
        }
        
    }
    catch(error)
    {
        yield put(getShowByIdFailure(error.message));
        notify("error", "Error fetching show details. Please try again.", error?.message);  
    }
}

function* getShowByTheatreSaga(action) {
    try{ 
        const response = yield call(getShowsByTheatreAPI, action.payload);
        if(response.success)
        {
            yield put(getShowsByTheatreSuccess(response.data));
            // Show success message
            notify("success", response.message);

            // yield put(getMoviesRequest());
        }
        else
        {
            yield put(getShowsByTheatreFailure(response.message));
            notify("warning", "Failed to get a Show in a Theatre", response.message);
        }
        
    }
    catch(error)
    {
        yield put(getShowsByTheatreFailure(error.message));
        notify("error", "Error fetching show details. Please try again.", error?.message);  
    }
}

function* getTheatresWithShowsByMovieSaga(action) {
    try{ 
        const response = yield call(getTheatresWithShowsByMovieAPI, action.payload);
        if(response.success)
        {
            yield put(getTheatresWithShowsByMovieSuccess(response.data));
            // Show success message
            notify("success", response.message);
        }
        else
        {
            yield put(getTheatresWithShowsByMovieFailure(response.message));
            notify("warning", "Failed to get Theatres for a Movie", response.message);
        }
        
    }
    catch(error)
    {
        yield put(getTheatresWithShowsByMovieFailure(error.message));
        notify("error", "Error fetching show details. Please try again.", error?.message);  
    }
}

// Watcher Saga
export function* showSaga(){
    yield takeLatest(addShowRequest.type, addShowSaga);
    yield takeLatest(updateShowRequest.type, updateShowSaga);
    yield takeLatest(deleteShowRequest.type, deleteShowSaga);
    yield takeLatest(getShowByIdRequest.type, getShowByIdSaga);
    yield takeLatest(getShowsByTheatreRequest.type, getShowByTheatreSaga);
    yield takeLatest(getTheatresWithShowsByMovieRequest.type, getTheatresWithShowsByMovieSaga )
}