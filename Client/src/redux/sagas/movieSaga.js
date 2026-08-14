import { takeEvery, put, call } from "redux-saga/effects";
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
import { format } from 'date-fns';
import { notify } from "../../utils/notificationUtils";
import { MovieAPI } from "../../api/movie";

// Worker Sagas
function* getMoviesSaga() {
    try{
        
        const response = yield call(MovieAPI.fetch);
        if(response.success)
        {
            const formattedData = response.data.map(movie => ({
                ...movie,
                releaseDate: format(movie.releaseDate, "yyyy-MM-dd")
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
        const errorMessage = error.response?.data?.message || error.message
        yield put(getMoviesFailure(errorMessage));
        notify("error", "Error fetching movies. Please try again.", errorMessage);
    }
}

function* addMovieSaga(action) {
    try{ 
        const response = yield call(MovieAPI.create, action.payload);
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
        const errorMessage = error.response?.data?.message || error.message
        yield put(addMovieFailure(errorMessage));
        notify("error", "Error adding movie. Please try again.", errorMessage);
    }
}

function* updateMovieSaga(action) {
    try{ 
        const {id, movie} = action.payload
        const response = yield call(MovieAPI.update, id, movie);
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
        const errorMessage = error.response?.data?.message || error.message
        yield put(updateMovieFailure(errorMessage));
        notify("error", "Error updating movie. Please try again.", errorMessage);  
    }
}

function* deleteMovieSaga(action) {
    try{ 
        const response = yield call(MovieAPI.delete, action.payload);
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
        const errorMessage = error.response?.data?.message || error.message
        yield put(deleteMovieFailure(errorMessage));
        notify("error", "Error deleting movie. Please try again.", errorMessage);  
    }
}

function* getMovieByIdSaga(action) {
    try{ 
        const response = yield call(MovieAPI.fetchById, action.payload);
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
        const errorMessage = error.response?.data?.message || error.message
        yield put(getMovieByIdFailure(errorMessage));
        notify("error", "Error fetching movie details. Please try again.", errorMessage);  
    }
}


// Watcher Saga
export function* movieSaga(){
    yield takeEvery(getMoviesRequest.type, getMoviesSaga);
    yield takeEvery(addMovieRequest.type, addMovieSaga);
    yield takeEvery(updateMovieRequest.type, updateMovieSaga);
    yield takeEvery(deleteMovieRequest.type, deleteMovieSaga);
    yield takeEvery(getMovieByIdRequest.type, getMovieByIdSaga)
}