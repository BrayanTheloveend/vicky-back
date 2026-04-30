const mongoose = require('mongoose');
const { Schema } = mongoose;



const PatientSchema = new Schema({

                // généré auto par MongoDB
        patientId:       { type: Schema.Types.ObjectId, auto: true }, // _id
     numeroPatient:  String,                      // ex: "PAT-2024-00842" (unique, indexé)
     createdAt:      Date,                        // ISODate("2024-03-15T08:32:00Z")
     updatedAt:      Date,

     // ── IDENTITÉ ──────────────────────────────────────────────
     identite: {
       prenom:        String,                     // "Jean"
       nom:           String,                     // "Dupont"
       dateNaissance: Date,                       // ISODate("1990-05-20")
       genre:         String,                     // "Homme" | "Femme" | "Autre"
       nationalite:   String,                     // "Camerounaise"
       numeroCNI:     String,                     // "123456789"
       photo:         String,                     // URL ou base64
     },

     // ── CONTACT ───────────────────────────────────────────────
     contact: {
       email:         String,                     // indexé, unique par patient
       telephone:     String,                     // "+237 699 123 456"
       telephoneUrgence: String,                  // contact en cas d'urgence
       adresse: {
         rue:         String,
         ville:       String,                     // "Yaoundé"
         region:      String,                     // "Centre"
         pays:        String,                     // "Cameroun"
       },
     },

     // ── INFORMATIONS MÉDICALES ─────────────────────────────────
     dossierMedical: {
       groupeSanguin:  String,                    // "A+", "O-", etc.
       allergies:      [String],                  // ["Pénicilline", "Aspirine"]
       antecedents:    [String],                  // ["Diabète type 2", "HTA"]
       traitementsCours: [String],                // médicaments actuels
       handicap:       Boolean,
       notes:          String,                    // observations générales
     },

     // ── ASSURANCE ─────────────────────────────────────────────
     assurance: {
       type:           { type: String },                    // "CNPS" | "Privée" | "Aucune"
       compagnie:      { type: String },                    // "AXA Cameroun"
       numeroPolice:   { type: String },
       dateExpiration: { type: Date },
       tauxCouverture: { type: Number },                    // 80 (%)
     },

    // 📁 Collection : rendezVous
   //───────────────────────────────────────────────────────────────
   rendezVous:   { 
    departement: String, 
    pathologie: String, 
    motif: String, 
    dateRdv: Date, 
    creneauDebut: String, 
    typeConsultation: String, 
    niveauUrgence: String, 
    notesSupplementaires: String
  },

     // ── CONTACT D'URGENCE ──────────────────────────────────────
     contactUrgence: {
       nom:            String,
       lienParente:    String,                    // "Épouse", "Parent"
       telephone:      String,
     },
   
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);
