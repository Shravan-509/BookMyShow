import { takeEvery, put, call } from "redux-saga/effects";
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
import { MovieAPI } from "../../api/movie";

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

const getMovieByIdAPI = async (id) => {
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
        
        const response = yield call(MovieAPI.fetch);
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
        yield put(getMovieByIdFailure(eerrorMessage));
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