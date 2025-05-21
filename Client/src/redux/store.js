import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import { rootSaga } from "./sagas";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import rootReducer from "./reducers/rootReducer";

const persistConfig = {
    key: "root",
    storage: storage
}

// Create saga middleware
const sagaMiddleware = createSagaMiddleware();

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer : persistedReducer,
    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware({ 
            thunk: false,
            serializableCheck: 
            { 
                // Ignore redux-persist actions 
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, "rootReducer/verification/setCountdownTimer"], 
            },
        }).concat(sagaMiddleware)
});
const persistor = persistStore(store);

// Run the root saga
sagaMiddleware.run(rootSaga)


export default store;

export {persistor};