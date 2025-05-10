const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const Sudoku = require('./SudokuModel');
const User = require('./UserModel');
const RecordTime = require('./RecordTimeModel');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./utils/sendEmail');

const app = express();

const LICENSE_KEY = "ABC123-XYZ789";

const validateLicenseKey = (req, res, next) => {
  const clientLicenseKey = req.headers['x-license-key'];
  if (!clientLicenseKey || clientLicenseKey !== LICENSE_KEY) {
    return res.status(401).json({
      status: "error",
      message: "Invalid or missing license key",
    });
  }
  next();
};

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", validateLicenseKey);

// Move database connection to a separate function
const connectDB = async (uri) => {
  try {
    await mongoose.connect(uri || process.env.MONGODB_URI || "mongodb://localhost:27017/CSCI3100project");
    console.log("Successfully connected to MongoDB.");
  } catch (error) {
    console.log("Could not connect to MongoDB.");
    console.error(error);
    throw error;
  }
};

// Only connect to database if not in test mode
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

app.get("/api/test-db", async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };
    res.json({
      status: "success",
      message: `Database is ${states[dbState]}`,
      state: dbState,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error checking database connection",
      error: error.message,
    });
  }
});

app.get("/api/sudoku/:difficulty", async (req, res) => {
  try {
    const difficulty = req.params.difficulty;
    console.log(`Querying difficulty: ${difficulty}`);
    const count = await Sudoku.countDocuments({ difficulty });
    console.log(`Total puzzles found: ${count}`);
    if (count === 0) {
      return res.status(404).json({
        status: "error",
        message: `No puzzles found for difficulty: ${difficulty}`,
      });
    }

    const [puzzle] = await Sudoku.aggregate([
      { $match: { difficulty } },
      { $sample: { size: 1 } },
    ]);
    console.log(`Selected puzzle ID: ${puzzle._id}`);

    if (!puzzle) {
      return res.status(404).json({
        status: "error",
        message: `No puzzle found for difficulty: ${difficulty}`,
      });
    }

    res.json({
      status: "success",
      data: {
        puzzle: puzzle.puzzle,
        solution: puzzle.solution,
        difficulty: puzzle.difficulty,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        status: "error",
        message: "Please verify your email before logging in",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "Invalid password",
      });
    }

    res.json({
      status: "success",
      message: "Login successful",
      user: {
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
});

app.post("/api/verify-email", async (req, res) => {
  const { token } = req.body;

  try {
    if (!token) {
      return res.status(400).json({
        status: "error",
        message: "Verification token is required",
      });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired verification token",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({
      status: "success",
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
});

app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = new User({
      email,
      password,
      isVerified: false,
      verificationToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    await user.save();
    await sendVerificationEmail(email, verificationToken);

    res.json({
      status: "success",
      message: "Signup successful. Please check your email to verify your account.",
      user: {
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: "error",
        message: "Email already in use. Please use a different email.",
      });
    }

    res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
});

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "No user found with this email",
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    await sendPasswordResetEmail(email, resetToken);

    res.json({
      status: "success",
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
});

app.post("/api/reset-password", async (req, res) => {
  const { token, password } = req.body;

  try {
    if (!token || !password) {
      return res.status(400).json({
        status: "error",
        message: "Token and new password are required",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired reset token",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
});

app.post("/api/record", async (req, res) => {
  const { email, totalTime } = req.body;

  try {
    if (!email || totalTime === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields (email, totalTime)",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const existingRecord = await RecordTime.findOne({ email });

    if (existingRecord) {
      if (totalTime < existingRecord.totalTime) {
        existingRecord.totalTime = totalTime;
        existingRecord.createdAt = Date.now();
        await existingRecord.save();

        return res.json({
          status: "success",
          message: "New Best Record: " + existingRecord.totalTime,
          data: existingRecord,
        });
      } else {
        return res.json({
          status: "success",
          message: "Best Record: " + existingRecord.totalTime,
          data: existingRecord,
        });
      }
    } else {
      const record = new RecordTime({
        email,
        totalTime,
      });
      await record.save();

      return res.json({
        status: "success",
        message: "New total completion time recorded",
        data: record,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
});

app.get("/api/rankings", async (req, res) => {
  try {
    const rankings = await RecordTime.find()
      .sort({ totalTime: 1 })
      .limit(50);

    res.json({
      status: "success",
      data: rankings.map(record => ({
        email: record.email,
        totalTime: record.totalTime,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3001;

// Only start the server if not being required as a module (for testing)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}

// Export both app and connectDB for testing
module.exports = { app, connectDB };