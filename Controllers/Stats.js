const mongoose = require('mongoose');
const Patient = require('../Models/PatientSchema');

function toYear(dateField) {
  // helper pour pipeline: obtient l'année depuis rendezVous.dateRdv ou createdAt si absent
  return {
    $year: {
      $ifNull: [ `$${dateField}`, "$createdAt" ]
    }
  };
}

// GET /api/stats -> liste des départements et années disponibles
const listDepartments = async (req, res) => {
  try {
    const departments = await Patient.distinct('rendezVous.departement', { 'rendezVous.departement': { $exists: true, $ne: null } });
    const yearsAgg = await Patient.aggregate([
      { $match: { $or: [ { 'rendezVous.dateRdv': { $exists: true, $ne: null } }, { createdAt: { $exists: true, $ne: null } } ] } },
      { $project: { year: toYear('rendezVous.dateRdv') } },
      { $group: { _id: '$year' } },
      { $sort: { _id: 1 } }
    ]);
    const years = yearsAgg.map(y => String(y._id));
    return res.json({ success: true, data: { departments: departments.filter(Boolean), years } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/stats/:department?year=2024
const getDepartmentStats = async (req, res) => {
  try {
    const dept = req.params.department;
    if (!dept) return res.status(400).json({ success: false, message: 'Department requis' });

    // récupérer années disponibles pour ce département
    const yearsAgg = await Patient.aggregate([
      { $match: { 'rendezVous.departement': { $regex: `^${dept}$`, $options: 'i' } } },
      { $project: { year: toYear('rendezVous.dateRdv') } },
      { $group: { _id: '$year' } },
      { $sort: { _id: 1 } }
    ]);
    if (!yearsAgg.length) return res.status(404).json({ success: false, message: 'Aucune donnée pour ce service' });
    const years = yearsAgg.map(y => Number(y._id)).sort();
    const year = Number(req.query.year || years[years.length - 1]);

    // aggregation counts par pathologie pour l'année et année précédente
    const pipeline = [
      { $match: { 'rendezVous.departement': { $regex: `^${dept}$`, $options: 'i' } } },
      { $addFields: { year: toYear('rendezVous.dateRdv') } },
      { $match: { year: { $in: [year, year - 1] } } },
      { $group: {
          _id: { pathologie: '$rendezVous.pathologie', year: '$year' },
          count: { $sum: 1 }
      }},
      { $group: {
          _id: '$_id.pathologie',
          counts: { $push: { year: '$_id.year', count: '$count' } },
          total: { $sum: '$count' } // total across included years (will be split later)
      }},
    ];
    const agg = await Patient.aggregate(pipeline);

    // construire structure: countsByYear[pathologie][year] = count
    const countsByDisease = {};
    let totalForSelectedYear = 0;
    agg.forEach(d => {
      countsByDisease[d._id] = {};
      d.counts.forEach(c => { countsByDisease[d._id][String(c.year)] = c.count; });
      const cYearCount = countsByDisease[d._id][String(year)] || 0;
      totalForSelectedYear += cYearCount;
    });

    const maladies = Object.keys(countsByDisease).map(m => {
      const count = countsByDisease[m][String(year)] || 0;
      return {
        maladie: m || 'Non renseigné',
        count,
        part: totalForSelectedYear ? Number(((count / totalForSelectedYear) * 100).toFixed(2)) : 0,
        prevYearCount: countsByDisease[m][String(year - 1)] || 0
      };
    }).sort((a,b) => b.count - a.count);

    // growth par maladie
    const growth = {};
    maladies.forEach(m => {
      const prev = m.prevYearCount || 0;
      const now = m.count || 0;
      const diff = now - prev;
      const pct = prev ? Number(((diff / prev) * 100).toFixed(2)) : (now ? 100 : 0);
      growth[m.maladie] = { prev, now, diff, pct };
      delete m.prevYearCount;
    });

    return res.json({
      success: true,
      data: {
        department: dept,
        year: String(year),
        totalPatients: totalForSelectedYear,
        maladies,
        growth
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/stats/:department/trend?maladieName=... ou ?maladieIndex=0
const getDiseaseTrend = async (req, res) => {
  try {
    const dept = req.params.department;
    const { maladieName, maladieIndex } = req.query;
    if (!dept) return res.status(400).json({ success: false, message: 'Department requis' });

    // récupérer distinct maladies et années pour ce département
    const maladiesAgg = await Patient.aggregate([
      { $match: { 'rendezVous.departement': { $regex: `^${dept}$`, $options: 'i' } } },
      { $group: { _id: '$rendezVous.pathologie' } },
    ]);
    const maladies = maladiesAgg.map(m => m._id).filter(Boolean);

    let target = null;
    if (typeof maladieIndex !== 'undefined') target = maladies[Number(maladieIndex)];
    else if (maladieName) target = maladies.find(m => m && m.toLowerCase() === maladieName.toLowerCase());
    if (!target) return res.status(400).json({ success: false, message: 'Maladie introuvable' });

    const seriesAgg = await Patient.aggregate([
      { $match: { 'rendezVous.departement': { $regex: `^${dept}$`, $options: 'i' }, 'rendezVous.pathologie': target } },
      { $addFields: { year: toYear('rendezVous.dateRdv') } },
      { $group: { _id: '$year', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const series = seriesAgg.map(s => ({ year: String(s._id), value: s.count }));

    return res.json({ success: true, data: { department: dept, maladie: target, series } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/stats/:department/top?n=3&year=2024
const getTopDiseases = async (req, res) => {
  try {
    const dept = req.params.department;
    const n = Math.max(1, Math.min(50, parseInt(req.query.n || '5', 10)));
    if (!dept) return res.status(400).json({ success: false, message: 'Department requis' });

    const year = req.query.year ? Number(req.query.year) : null;

    const match = { 'rendezVous.departement': { $regex: `^${dept}$`, $options: 'i' } };
    const pipeline = [
      { $match: match },
      { $addFields: { year: toYear('rendezVous.dateRdv') } },
    ];
    if (year) pipeline.push({ $match: { year } });

    pipeline.push(
      { $group: { _id: '$rendezVous.pathologie', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: n }
    );

    const top = await Patient.aggregate(pipeline);
    return res.json({ success: true, data: { department: dept, year: year ? String(year) : undefined, top: top.map(t => ({ maladie: t._id || 'Non renseigné', count: t.count })) } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  listDepartments,
  getDepartmentStats,
  getDiseaseTrend,
  getTopDiseases,
};