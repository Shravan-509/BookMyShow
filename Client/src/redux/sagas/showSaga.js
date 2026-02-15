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
import { ShowAPI } from "../../api/show";

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
        const response = yield call(ShowAPI.create, action.payload);
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
        const errorMessage = error.response?.data?.message || error.message
        yield put(addShowFailure(errorMessage));
        notify("error", "Error adding show. Please try again.", errorMessage);
    }
}

function* updateShowSaga(action) {
    const { id, show } = action.payload;
    try{ 
        const response = yield call(ShowAPI.update, id, show);
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
        const errorMessage = error.response?.data?.message || error.message
        yield put(updateShowFailure(errorMessage));
        notify("error", "Error updating show. Please try again.", errorMessage);  
    }
}

function* deleteShowSaga(action) {
    const { showId, theatreId } = action.payload;
    try{ 
        const response = yield call(ShowAPI.delete, showId);
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
        const errorMessage = error.response?.data?.message || error.message
        yield put(deleteShowFailure(errorMessage));
        notify("error", "Error deleting show. Please try again.", errorMessage);  
    }
}

function* getShowByIdSaga(action) {
    try{ 
        const response = yield call(ShowAPI.fetchById, action.payload);
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
        const errorMessage = error.response?.data?.message || error.message 
        yield put(getShowByIdFailure(errorMessage));
        notify("error", "Error fetching show details. Please try again.", errorMessage);  
    }
}

function* getShowByTheatreSaga(action) {
    try{ 
        const response = yield call(ShowAPI.fetchByTheatre, action.payload);
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
        const errorMessage = error.response?.data?.message || error.message
        yield put(getShowsByTheatreFailure(errorMessage));
        notify("error", "Error fetching show details. Please try again.", errorMessage);  
    }
}

function* getTheatresWithShowsByMovieSaga(action) {
    try{ 
        const response = yield call(ShowAPI.fetchTheatresByMovie, action.payload);
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
        const errorMessage = error.response?.data?.message || error.message
        yield put(getTheatresWithShowsByMovieFailure(errorMessage));
        notify("error", "Error fetching show details. Please try again.", errorMessage);  
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