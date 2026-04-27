const express = require('express');
const { getPatientById, createPatient, getPatients, updatePatient, deletePatient } = require('../Controllers/Patient');
const ToggleRouter = express.Router();

// Define your toggle endpoints here

module.exports = () => {
    // Example toggle endpoint

    ToggleRouter.post('/createPatients', createPatient);
    ToggleRouter.get('/patients', getPatients);
    ToggleRouter.get('/patients/:id', getPatientById);
    ToggleRouter.put('/patients/:id', updatePatient);
    ToggleRouter.delete('/patients/:id', deletePatient);


    return ToggleRouter;
}
