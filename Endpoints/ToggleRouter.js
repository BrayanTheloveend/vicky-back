const express = require('express');
const { getPatientById, createPatient, getPatients, updatePatient, deletePatient } = require('../Controllers/Patient');
const ToggleRouter = express.Router();
const stats = require('../Controllers/Stats');
// Define your toggle endpoints here

module.exports = () => {
    // Example toggle endpoint

    ToggleRouter.post('/createPatients', createPatient);
    ToggleRouter.get('/patients', getPatients);
    ToggleRouter.get('/getPatients/:id', getPatientById);
    ToggleRouter.put('/updatePatients/:id', updatePatient);
    ToggleRouter.delete('/deletePatients/:id', deletePatient);
    ToggleRouter.get('/stats', stats.listDepartments);
    ToggleRouter.get('/stats/:department', stats.getDepartmentStats);
    ToggleRouter.get('/stats/:department/trend', stats.getDiseaseTrend);
    ToggleRouter.get('/stats/:department/top', stats.getTopDiseases);


    return ToggleRouter;
}
