const mongoose = require('mongoose');
const { Schema } = mongoose;



const PatientSchema = new Schema({
    patientId: {
        type: String,
        unique: true,
        default: () => `P${Date.now().toString(36)}${Math.floor(Math.random() * 9000 + 1000)}`
    },
    dateNaissance: { type: Date },
    departement: { type: String, trim: true },
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    genre: { type: String, enum: ['Homme', 'Femme', 'Autre', 'Non divulgué'], default: 'Non divulgué' },
    email: { type: String, trim: true, lowercase: true },
    motif: { type: String, trim: true },
    message: { type: String, trim: true },
    telephone: { type: String, trim: true },
    hospital: { type: Schema.Types.ObjectId, ref: 'Hospital' },
    status: { type: String, enum: ['urgent', 'non urgent', 'faible', 'modéré'], default: 'non urgent' },
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);
