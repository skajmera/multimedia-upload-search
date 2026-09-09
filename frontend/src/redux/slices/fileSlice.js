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
      });
  },
});

export const { resetUploadStatus } = fileSlice.actions;
export default fileSlice.reducer;
