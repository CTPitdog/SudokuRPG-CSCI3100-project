const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Sudoku = require('../backend/SudokuModel');
const User = require('../backend/UserModel');
const sinon = require('sinon');
const emailService = require('../backend/utils/sendEmail');

chai.use(chaiHttp);
const expect = chai.expect;

describe('API Endpoints', () => {
  let mongoServer;
  let app;
  let emailStub;

  before(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'testpass123';
    
    // Stub email service
    emailStub = sinon.stub(emailService, 'sendVerificationEmail').resolves(true);
    
    // Create new in-memory database
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Import server after setting test environment
    const { app: expressApp, connectDB } = require('../backend/server');
    app = expressApp;
    
    // Connect to the in-memory database
    await connectDB(mongoUri);

    // Add test data
    await Sudoku.create({
      puzzle: [
        [5,3,0,0,7,0,0,0,0],
        [6,0,0,1,9,5,0,0,0],
        [0,9,8,0,0,0,0,6,0],
        [8,0,0,0,6,0,0,0,3],
        [4,0,0,8,0,3,0,0,1],
        [7,0,0,0,2,0,0,0,6],
        [0,6,0,0,0,0,2,8,0],
        [0,0,0,4,1,9,0,0,5],
        [0,0,0,0,8,0,0,7,9]
      ],
      solution: [
        [5,3,4,6,7,8,9,1,2],
        [6,7,2,1,9,5,3,4,8],
        [1,9,8,3,4,2,5,6,7],
        [8,5,9,7,6,1,4,2,3],
        [4,2,6,8,5,3,7,9,1],
        [7,1,3,9,2,4,8,5,6],
        [9,6,1,5,3,7,2,8,4],
        [2,8,7,4,1,9,6,3,5],
        [3,4,5,2,8,6,1,7,9]
      ],
      difficulty: 'easy'
    });

    // Add medium difficulty puzzle
    await Sudoku.create({
      puzzle: [
        [0,0,0,2,6,0,7,0,1],
        [6,8,0,0,7,0,0,9,0],
        [1,9,0,0,0,4,5,0,0],
        [8,2,0,1,0,0,0,4,0],
        [0,0,4,6,0,2,9,0,0],
        [0,5,0,0,0,3,0,2,8],
        [0,0,9,3,0,0,0,7,4],
        [0,4,0,0,5,0,0,3,6],
        [7,0,3,0,1,8,0,0,0]
      ],
      solution: [
        [4,3,5,2,6,9,7,8,1],
        [6,8,2,5,7,1,4,9,3],
        [1,9,7,8,3,4,5,6,2],
        [8,2,6,1,9,5,3,4,7],
        [3,7,4,6,8,2,9,1,5],
        [9,5,1,7,4,3,6,2,8],
        [5,1,9,3,2,6,8,7,4],
        [2,4,8,9,5,7,1,3,6],
        [7,6,3,4,1,8,2,5,9]
      ],
      difficulty: 'medium'
    });

    // Add hard difficulty puzzle
    await Sudoku.create({
      puzzle: [
        [0,0,0,6,0,0,4,0,0],
        [7,0,0,0,0,3,6,0,0],
        [0,0,0,0,9,1,0,8,0],
        [0,0,0,0,0,0,0,0,0],
        [0,5,0,1,8,0,0,0,3],
        [0,0,0,3,0,6,0,4,5],
        [0,4,0,2,0,0,0,6,0],
        [9,0,3,0,0,0,0,0,0],
        [0,2,0,0,0,0,1,0,0]
      ],
      solution: [
        [5,8,1,6,7,2,4,3,9],
        [7,9,2,8,4,3,6,5,1],
        [3,6,4,5,9,1,7,8,2],
        [4,3,8,9,5,7,2,1,6],
        [2,5,6,1,8,4,9,7,3],
        [1,7,9,3,2,6,8,4,5],
        [8,4,5,2,1,9,3,6,7],
        [9,1,3,7,6,8,5,2,4],
        [6,2,7,4,3,5,1,9,8]
      ],
      difficulty: 'hard'
    });
  });

  beforeEach(async () => {
    // Clear users collection before each test
    if (mongoose.connection.models['User']) {
      await mongoose.connection.models['User'].deleteMany({});
    }
    // Reset email stub
    emailStub.resetHistory();
  });

  after(async () => {
    // Restore stubbed functions
    emailStub.restore();
    
    await mongoose.disconnect();
    await mongoServer.stop();
    
    // Reset environment
    process.env.NODE_ENV = 'development';
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
  });

  describe('Database Connection', () => {
    it('GET /api/test-db - should return database connection state', async () => {
      const res = await chai.request(app)
        .get('/api/test-db')
        .set('x-license-key', 'ABC123-XYZ789');
      
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('status', 'success');
      expect(res.body).to.have.property('message');
      expect(res.body.state).to.equal(1); // 1 means connected
    });
  });

  describe('Authentication', () => {
    it('POST /api/signup - should create new user and send verification email', async () => {
      const testEmail = `test${Date.now()}@example.com`;
      const res = await chai.request(app)
        .post('/api/signup')
        .set('x-license-key', 'ABC123-XYZ789')
        .send({ 
          email: testEmail, 
          password: 'Test@1234',
          username: 'testuser'  // Add username if required
        });
      
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('status', 'success');
      expect(res.body).to.have.property('message');
      expect(res.body.user).to.have.property('email', testEmail);

      // Verify user was created in database
      const user = await User.findOne({ email: testEmail });
      expect(user).to.exist;
      expect(user.email).to.equal(testEmail);
      expect(user.isVerified).to.be.false;

      // Verify email service was called
      expect(emailStub.calledOnce).to.be.true;
      expect(emailStub.firstCall.args[0]).to.equal(testEmail);
    });

    it('POST /api/login - should fail for unverified user', async () => {
      const res = await chai.request(app)
        .post('/api/login')
        .set('x-license-key', 'ABC123-XYZ789')
        .send({ email: 'fakeuser@example.com', password: 'wrongpass' });
      
      expect(res).to.have.status(404);
      expect(res.body).to.have.property('status', 'error');
    });
  });

  describe('Sudoku API', () => {
    it('should return a valid sudoku puzzle for easy difficulty', async () => {
      const res = await chai.request(app)
        .get('/api/sudoku/easy')
        .set('x-license-key', 'ABC123-XYZ789');
      
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('status', 'success');
      expect(res.body.data).to.have.property('puzzle').that.is.an('array');
      expect(res.body.data).to.have.property('solution').that.is.an('array');
      expect(res.body.data).to.have.property('difficulty', 'easy');
      expect(res.body.data.puzzle).to.have.lengthOf(9);
      expect(res.body.data.solution).to.have.lengthOf(9);
    });

    it('should return a valid sudoku puzzle for medium difficulty', async () => {
      const res = await chai.request(app)
        .get('/api/sudoku/medium')
        .set('x-license-key', 'ABC123-XYZ789');
      
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('status', 'success');
      expect(res.body.data).to.have.property('puzzle').that.is.an('array');
      expect(res.body.data).to.have.property('solution').that.is.an('array');
      expect(res.body.data).to.have.property('difficulty', 'medium');
      expect(res.body.data.puzzle).to.have.lengthOf(9);
      expect(res.body.data.solution).to.have.lengthOf(9);
    });

    it('should return a valid sudoku puzzle for hard difficulty', async () => {
      const res = await chai.request(app)
        .get('/api/sudoku/hard')
        .set('x-license-key', 'ABC123-XYZ789');
      
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('status', 'success');
      expect(res.body.data).to.have.property('puzzle').that.is.an('array');
      expect(res.body.data).to.have.property('solution').that.is.an('array');
      expect(res.body.data).to.have.property('difficulty', 'hard');
      expect(res.body.data.puzzle).to.have.lengthOf(9);
      expect(res.body.data.solution).to.have.lengthOf(9);
    });

    it('should validate puzzle format', async () => {
      const res = await chai.request(app)
        .get('/api/sudoku/easy')
        .set('x-license-key', 'ABC123-XYZ789');
      
      const { puzzle, solution } = res.body.data;
      
      // Check puzzle structure
      expect(puzzle).to.be.an('array').with.lengthOf(9);
      puzzle.forEach(row => {
        expect(row).to.be.an('array').with.lengthOf(9);
        row.forEach(cell => {
          expect(cell).to.be.a('number');
          expect(cell).to.be.within(0, 9);
        });
      });

      // Check solution structure
      expect(solution).to.be.an('array').with.lengthOf(9);
      solution.forEach(row => {
        expect(row).to.be.an('array').with.lengthOf(9);
        row.forEach(cell => {
          expect(cell).to.be.a('number');
          expect(cell).to.be.within(1, 9);
        });
      });
    });

    it('should return 404 for invalid difficulty', async () => {
      const res = await chai.request(app)
        .get('/api/sudoku/invalid')
        .set('x-license-key', 'ABC123-XYZ789');
      
      expect(res).to.have.status(404);
      expect(res.body).to.have.property('status', 'error');
    });

    it('should require license key', async () => {
      const res = await chai.request(app)
        .get('/api/sudoku/easy');
      
      expect(res).to.have.status(401);
    });

    it('should verify medium difficulty has appropriate number of empty cells', async () => {
      const res = await chai.request(app)
        .get('/api/sudoku/medium')
        .set('x-license-key', 'ABC123-XYZ789');
      
      const emptyCount = res.body.data.puzzle.flat().filter(cell => cell === 0).length;
      expect(emptyCount).to.be.at.least(40); // Medium difficulty should have more empty cells than easy
    });

    it('should verify hard difficulty has appropriate number of empty cells', async () => {
      const res = await chai.request(app)
        .get('/api/sudoku/hard')
        .set('x-license-key', 'ABC123-XYZ789');
      
      const emptyCount = res.body.data.puzzle.flat().filter(cell => cell === 0).length;
      expect(emptyCount).to.be.at.least(50); // Hard difficulty should have even more empty cells
    });
  });

  describe('Sudoku Solution Validation', () => {
    it('should have valid solutions', async () => {
      const res = await chai.request(app)
        .get('/api/sudoku/easy')
        .set('x-license-key', 'ABC123-XYZ789');
      
      const { solution } = res.body.data;
      
      // Check rows
      solution.forEach(row => {
        const numbers = new Set(row);
        expect(numbers.size).to.equal(9);
      });

      // Check columns
      for (let col = 0; col < 9; col++) {
        const numbers = new Set();
        for (let row = 0; row < 9; row++) {
          numbers.add(solution[row][col]);
        }
        expect(numbers.size).to.equal(9);
      }

      // Check 3x3 boxes
      for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
          const numbers = new Set();
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              numbers.add(solution[boxRow * 3 + i][boxCol * 3 + j]);
            }
          }
          expect(numbers.size).to.equal(9);
        }
      }
    });
  });
  
  



});
