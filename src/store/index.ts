// store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './reducers/authReducer';
import trainingReducer from './reducers/trainingReducer';
import userReducer from './reducers/userReducer';
import appReducer from './slices/appSlice';
import playersReducer from './slices/playersSlice';
import plansReducer from './slices/plansSlice';
import workoutsReducer from './slices/workoutsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    training: trainingReducer,
    user: userReducer,
    app: appReducer,
    players: playersReducer,
    plans: plansReducer,
    workouts: workoutsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;