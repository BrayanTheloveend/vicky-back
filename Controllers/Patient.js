const mongoose = require('mongoose');
const Patient = require('../Models/PatientSchema'); // adjust path if your models folder/name differs

// Create a new patient
const createPatient = async (req, res) => {
    try {
        const {
            nom,
            prenom,
            genre,
            dateNaissance,
            telephone,
            email,
            departement,
            motif,
            message,
        } = req.body;

        if (!email) return res.status(400).json({ success: false, message: 'Name is required' });

        const patient = new Patient({
            nom,
            prenom,
            genre,
            dateNaissance,
            telephone,
            email,
            departement,
            motif,
            message,
        });

        const saved = await patient.save();
        return res.status(201).json({ success: true, data: saved });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Get list of patients (with pagination & optional search)
const getPatients = async (req, res) => {
    try {
        const { page = 1, limit = 20, q, sortBy = 'createdAt', order = 'desc' } = req.query;
        const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
        const sortOrder = order === 'asc' ? 1 : -1;

        const filter = {};
        if (q) {
            const regex = new RegExp(q, 'i');
            filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
        }

        const [total, data] = await Promise.all([
            Patient.countDocuments(filter),
            Patient.find(filter)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(Math.max(1, parseInt(limit, 10))),
        ]);

        return res.json({
            success: true,
            data,
            meta: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Get single patient by id
const getPatientById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid patient id' });

        const patient = await Patient.findById(id);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

        return res.json({ success: true, data: patient });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Update patient
const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid patient id' });

        const updates = req.body;
        const patient = await Patient.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

        return res.json({ success: true, data: patient });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Delete patient
const deletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid patient id' });

        const patient = await Patient.findByIdAndDelete(id);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

        return res.json({ success: true, message: 'Patient deleted' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    createPatient,
    getPatients,
    getPatientById,
    updatePatient,
    deletePatient,
};