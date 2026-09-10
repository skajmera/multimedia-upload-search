import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const uploadFile = createAsyncThunk(
  'files/upload',
  async ({ file, fileName, tags }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (fileName) formData.append('fileName', fileName);
      if (tags) formData.append('tags', tags);

      const { data } = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.file;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Upload failed');
    }
  }
);

export const searchFiles = createAsyncThunk(
  'files/search',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/files/search', { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Search failed');
    }
  }
);

// Hitting GET /files/:id is what actually increments the server-side view
// count (search results themselves don't bump it) — call this when the user
// opens a file, not just when it appears in a results list.
export const viewFile = createAsyncThunk(
  'files/view',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/files/${id}`);
      return data.file;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to open file');
    }
  }
);

const initialState = {
  results: [],
  total: 0,
  status: 'idle',
  error: null,
  uploadStatus: 'idle',
  uploadError: null,
};

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    resetUploadStatus(state) {
      state.uploadStatus = 'idle';
      state.uploadError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchFiles.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(searchFiles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.results = action.payload.results;
        state.total = action.payload.total;
      })
      .addCase(searchFiles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(uploadFile.pending, (state) => {
        state.uploadStatus = 'loading';
        state.uploadError = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.uploadStatus = 'succeeded';
        state.results = [action.payload, ...state.results];
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.uploadStatus = 'failed';
        state.uploadError = action.payload;
      })
      .addCase(viewFile.fulfilled, (state, action) => {
        const index = state.results.findIndex((f) => f._id === action.payload._id);
        if (index !== -1) state.results[index] = action.payload;
      });
  },
});

export const { resetUploadStatus } = fileSlice.actions;
export default fileSlice.reducer;
