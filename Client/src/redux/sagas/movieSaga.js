import { takeLatest, put, call } from "redux-saga/effects";
import { axiosInstance } from "../../api/index";
import { 
    addMovieFailure, 
    addMovieRequest, 
    addMovieSuccess, 
    deleteMovieFailure, 
    deleteMovieRequest, 
    deleteMovieSuccess, 
    getMovieByIdFailure, 
    getMovieByIdRequest, 
    getMovieByIdSuccess, 
    getMoviesFailure, 
    getMoviesRequest, 
    getMoviesSuccess, 
    updateMovieFailure, 
    updateMovieRequest, 
    updateMovieSuccess
    } from "../slices/movieSlice";
import moment from "moment";
import { notify } from "../../utils/notificationUtils";

// Movie API calls
const fetchMoviesAPI = async () => {
    try {
        const response = await axiosInstance.get("/movies");
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to fetch Movies';
        throw new Error(message);
    }
};

const addMovieAPI = async (movie) => {
    try {
        const response = await axiosInstance.post("/movies", movie);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to Add a Movie';
        throw new Error(message);
    }
};

const updateMovieAPI = async ({id, movie}) => {
    try {
        const response = await axiosInstance.patch(`/movies/${id}`, movie);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to Update a Movie';
        throw new Error(message);
    }
};

const deleteMovieAPI = async (id) => {
    try {
        const response = await axiosInstance.delete(`/movies/${id}`);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to Delete a Movie';
        throw new Error(message);
    }
};

export const getMovieByIdAPI = async (id) => {
    try {
        const response = await axiosInstance.get(`/movies/${id}`);
        return response?.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to get a Movie';
        throw new Error(message);
    }
};


// Worker Sagas
function* getMoviesSaga() {
    try{
        
        const response = yield call(fetchMoviesAPI);
        if(response.success)
        {
            const formattedData = response.data.map(movie => ({
                ...movie,
                releaseDate: moment(movie.releaseDate).format("YYYY-MM-DD")
            }));
            yield put(getMoviesSuccess(formattedData));
        
            // Show success message
            notify("success", response.message);
        }
        else
        {
            yield put(getMoviesFailure(response.message));
            notify("warning", "Failed to fetch movies", response.message);
        }
        
    }
    catch(error)
    {
        yield put(getMoviesFailure(error.message));
        notify("error", "Error fetching movies. Please try again.", error?.message);
    }
}

function* addMovieSaga(action) {
    try{ 
        const response = yield call(addMovieAPI, action.payload);
        if(response.success)
        {
            yield put(addMovieSuccess(response.message));
            // Show success message
            notify("success", response.message);

            yield put(getMoviesRequest());
        }
        else
        {
            yield put(addMovieFailure(response.message));
            notify("warning", "Failed to add movie", response.message);
        }        
    }
    catch(error)
    {
        yield put(addMovieFailure(error.message));
        notify("error", "Error adding movie. Please try again.", error?.message);
    }
}

function* updateMovieSaga(action) {
    try{ 
        const response = yield call(updateMovieAPI, action.payload);
        if(response.success)
        {
            yield put(updateMovieSuccess(response.data));
            // Show success message
            notify("success", response.message);

            yield put(getMoviesRequest());
        }
        else
        {
            yield put(updateMovieFailure(response.message));
            notify("warning", "Failed to update movie", response.message);
        }    
    }
    catch(error)
    {
        yield put(updateMovieFailure(error.message));
        notify("error", "Error updating movie. Please try again.", error?.message);  
    }
}

function* deleteMovieSaga(action) {
    try{ 
        const response = yield call(deleteMovieAPI, action.payload);
         if(response.success)
        {
            yield put(deleteMovieSuccess(response.data));
            // Show success message
            notify("success", response.message);

            yield put(getMoviesRequest());
        }
        else
        {
            yield put(deleteMovieFailure(response.message));
            notify("warning", "Failed to delete movie", response.message);
        }    
    }
    catch(error)
    {
        yield put(deleteMovieFailure(error.message));
        notify("error", "Error deleting movie. Please try again.", error?.message);  
    }
}

function* getMovieByIdSaga(action) {
    try{ 
        const response = yield call(getMovieByIdAPI, action.payload);
        if(response.success)
        {
            yield put(getMovieByIdSuccess(response.data));
            // Show success message
            notify("success", response.message);
        }
        else
        {
            yield put(getMovieByIdFailure(response.message));
            notify("warning", "Failed to get movie", response.message);
        }
        
    }
    catch(error)
    {
        yield put(getMovieByIdFailure(error.message));
        notify("error", "Error fetching movie details. Please try again.", error?.message);  
    }
}


// Watcher Saga
export function* movieSaga(){
    yield takeLatest(getMoviesRequest.type, getMoviesSaga);
    yield takeLatest(addMovieRequest.type, addMovieSaga);
    yield takeLatest(updateMovieRequest.type, updateMovieSaga);
    yield takeLatest(deleteMovieRequest.type, deleteMovieSaga);
    yield takeLatest(getMovieByIdRequest.type, getMovieByIdSaga)
}