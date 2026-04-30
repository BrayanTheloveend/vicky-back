const mongoose = require('mongoose');
const Patient = require('../Models/PatientSchema'); // adjust path if your models folder/name differs
const { ObjectId } = mongoose.Types;
// Create a new patient
const createPatient = async (req, res) => {
    try {
        const body = req.body || {};

        // Supporte payload plat (nom, prenom, email...) ou déjà structuré sous identite/contact/...
        const patientData = {
            numeroPatient: body.numeroPatient || `PATfr-${Date.now()}`,
            patientId: new ObjectId(), // généré automatiquement
            identite: {
                prenom: body.prenom || body.identite?.prenom,
                nom: body.nom || body.identite?.nom,
                dateNaissance: body.dateNaissance || body.identite?.dateNaissance,
                genre: body.genre || body.identite?.genre,
                nationalite: body.nationalite || body.identite?.nationalite,
                numeroCNI: body.numeroCNI || body.identite?.numeroCNI,
                photo: body.photo || body.identite?.photo,
            },
            contact: {
                email: body.email || body.contact?.email,
                telephone: body.telephone || body.contact?.telephone,
                telephoneUrgence: body.telephoneUrgence || body.contact?.telephoneUrgence,
                adresse: {
                    rue: body.rue || body.contact?.adresse?.rue || body.adresse?.rue,
                    ville: body.ville || body.contact?.adresse?.ville || body.adresse?.ville,
                    region: body.region || body.contact?.adresse?.region || body.adresse?.region,
                    pays: body.pays || body.contact?.adresse?.pays || body.adresse?.pays,
                },
            },
            dossierMedical: {
                groupeSanguin: body.groupeSanguin || body.dossierMedical?.groupeSanguin,
                allergies: body.allergies || body.dossierMedical?.allergies || [],
                antecedents: body.antecedents || body.dossierMedical?.antecedents || [],
                traitementsCours: body.traitementsCours || body.dossierMedical?.traitementsCours || [],
                handicap: typeof body.handicap !== 'undefined' ? body.handicap : body.dossierMedical?.handicap || false,
                notes: body.notes || body.dossierMedical?.notes,
            },
            assurance: {
                type: body.type || body.assurance?.type ,
                compagnie: body.compagnie || body.assurance?.compagnie,
                numeroPolice: body.numeroPolice || body.assurance?.numeroPolice,
                dateExpiration: body.dateExpiration || body.assurance?.dateExpiration,
                tauxCouverture: typeof body.tauxCouverture !== 'undefined' ? body.tauxCouverture : body.assurance?.tauxCouverture,
            },
            rendezVous: {
                departement: body.departement || body.rendezVous?.departement,
                pathologie: body.pathologie || body.rendezVous?.pathologie,
                motif: body.motif || body.rendezVous?.motif,
                dateRdv: body.dateRdv || body.rendezVous?.dateRdv,
                creneauDebut: body.creneauDebut || body.rendezVous?.creneauDebut,
                typeConsultation: body.typeConsultation || body.rendezVous?.typeConsultation,
                niveauUrgence: body.niveauUrgence || body.rendezVous?.niveauUrgence,
                notesSupplementaires: body.notesSupplementaires || body.rendezVous?.notesSupplementaires
            },
            contactUrgence: {
                nom: body.contactUrgence?.nom || body.contactUrgenceNom || body.contactUrgenceNom,
                lienParente: body.contactUrgence?.lienParente || body.contactUrgenceLien || body.lienParente,
                telephone: body.contactUrgence?.telephone || body.contactUrgenceTelephone || body.contactUrgenceTelephone,
            },
        };

        // validations simples
        if (!patientData.identite.prenom || !patientData.identite.nom) {
            return res.status(400).json({ success: false, message: 'Prénom et nom requis' });
        }
        if (!patientData.contact.email) {
            return res.status(400).json({ success: false, message: 'Email requis' });
        }
        
        const patient = new Patient(patientData);
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