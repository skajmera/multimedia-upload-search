require('./setup');
const request = require('supertest');
const createApp = require('../src/app');
const User = require('../src/models/User');
const File = require('../src/models/File');

const app = createApp();

async function authedUser() {
  const user = await User.create({
    name: 'Grace Hopper',
    email: 'grace@example.com',
    password: 'secret123',
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: 'secret123' });
  return { user, token: res.body.token };
}

describe('File search & ranking', () => {
  test('matches by keyword in file name and tags', async () => {
    const { user, token } = await authedUser();

    await File.create([
      {
        owner: user._id,
        fileName: 'sunset-beach.jpg',
        url: 'https://cloudinary.test/sunset.jpg',
        publicId: 'sunset',
        fileType: 'image',
        mimeType: 'image/jpeg',
        size: 1024,
        tags: ['beach', 'vacation'],
        viewCount: 5,
      },
      {
        owner: user._id,
        fileName: 'quarterly-report.pdf',
        url: 'https://cloudinary.test/report.pdf',
        publicId: 'report',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        size: 2048,
        tags: ['finance'],
        viewCount: 1,
      },
    ]);

    const res = await request(app)
      .get('/api/files/search')
      .query({ query: 'beach' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.results[0].fileName).toBe('sunset-beach.jpg');
  });

  test('ranks a stronger keyword match with more views above a weaker/older one', async () => {
    const { user, token } = await authedUser();

    const now = Date.now();
    await File.create([
      {
        owner: user._id,
        fileName: 'cat-video-compilation.mp4',
        url: 'https://cloudinary.test/cat1.mp4',
        publicId: 'cat1',
        fileType: 'video',
        mimeType: 'video/mp4',
        size: 4096,
        tags: ['cat', 'funny'],
        viewCount: 100,
        createdAt: new Date(now - 1000 * 60 * 60 * 24), // 1 day ago
      },
      {
        owner: user._id,
        fileName: 'random-clip.mp4',
        url: 'https://cloudinary.test/cat2.mp4',
        publicId: 'cat2',
        fileType: 'video',
        mimeType: 'video/mp4',
        size: 4096,
        tags: ['cat'],
        viewCount: 1,
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 60), // 60 days ago
      },
    ]);

    const res = await request(app)
      .get('/api/files/search')
      .query({ query: 'cat' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.results[0].fileName).toBe('cat-video-compilation.mp4');
  });

  test('filters by file type', async () => {
    const { user, token } = await authedUser();

    await File.create([
      {
        owner: user._id,
        fileName: 'a.pdf',
        url: 'https://cloudinary.test/a.pdf',
        publicId: 'a',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        size: 10,
        viewCount: 0,
      },
      {
        owner: user._id,
        fileName: 'b.jpg',
        url: 'https://cloudinary.test/b.jpg',
        publicId: 'b',
        fileType: 'image',
        mimeType: 'image/jpeg',
        size: 10,
        viewCount: 0,
      },
    ]);

    const res = await request(app)
      .get('/api/files/search')
      .query({ type: 'pdf' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.results[0].fileType).toBe('pdf');
  });

  test('increments view count when a file is fetched by id', async () => {
    const { user, token } = await authedUser();
    const file = await File.create({
      owner: user._id,
      fileName: 'view-me.jpg',
      url: 'https://cloudinary.test/view.jpg',
      publicId: 'view',
      fileType: 'image',
      mimeType: 'image/jpeg',
      size: 10,
      viewCount: 0,
    });

    const res = await request(app)
      .get(`/api/files/${file._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.file.viewCount).toBe(1);
  });
});
