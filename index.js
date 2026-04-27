const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { randomUUID } = require('crypto');
const mongoose = require('mongoose');
const { ServerApiVersion } = require('mongodb');
require('dotenv').config()
const toggleRouter = require('./Endpoints/ToggleRouter')();
/**
 * Basic Express.js REST API for "hospitals"
 * Save as: /Users/Macbook/Documents/GitHub/hospital-back/index.js
 *
 * Minimal dependencies: express
 * Optional development: nodemon
 *
 * Start: PORT=3000 node index.js
 */

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// In-memory "database"
const hospitals = [];

// Helpers
function findIndexById(id) {
    return hospitals.findIndex(h => h.id === id);
}

// Async wrapper to capture errors in async handlers (optional but handy)
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Toggle routes

app.use('/api', toggleRouter);


mongoose.connect(process.env.DATABASE_URI,
    {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  autoSelectFamily: false, // Explicitly disable auto selection of IP family
}
)
    const connection = mongoose.connection;
    connection.once('open', () => {
        app.listen(PORT, () =>{
            console.log(`Server running on port ${PORT}`);
        });
    });

