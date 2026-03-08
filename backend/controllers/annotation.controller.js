// const Annotations = require('../models/Annotations');
// const { supabase } = require('../config/supabase');

// // Create annotation
// exports.createAnnotation = async (req, res) => {
//   try {
//     const annotation = await Annotations.create(req.body);
//     res.status(201).json(annotation);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// // Get annotations for a paper — enriched with userName from Supabase
// exports.getAnnotations = async (req, res) => {
//   try {
//     const { paperId } = req.params;
//     const annotations = await Annotations.find({ paperId });

//     const userIds = [...new Set(annotations.map(a => a.userId).filter(Boolean))];

//     const userMap = {};

//     if (userIds.length > 0) {
//       const { data: users, error } = await supabase
//         .from('users')
//         .select('auth_id, name')
//         .in('auth_id', userIds);

//       if (error) {
//         console.error('[Annotations] Supabase error:', error.message);
//       } else {
//         for (const u of users) {
//           userMap[u.auth_id] = u.name;
//         }
//       }
//     }

//     const enriched = annotations.map(a => ({
//       ...a.toObject(),
//       userName: userMap[a.userId] || 'Unknown',
//     }));

//     res.json(enriched);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// // Update annotation
// exports.updateAnnotation = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const annotation = await Annotations.findByIdAndUpdate(id, req.body, { new: true });
//     res.json(annotation);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// // Delete annotation
// exports.deleteAnnotation = async (req, res) => {
//   try {
//     const { id } = req.params;
//     await Annotations.findByIdAndDelete(id);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

const Annotations = require('../models/Annotations');
const { supabase } = require('../config/supabase');

/* ─── resolve userName from Supabase for a single userId ─── */
const resolveUserName = async (userId) => {
  if (!userId) return 'Unknown';
  const { data, error } = await supabase
    .from('users')
    .select('name')
    .eq('auth_id', userId)
    .single();
  if (error || !data) return 'Unknown';
  return data.name || 'Unknown';
};

/* ─── Create annotation ─────────────────────────────────── */
exports.createAnnotation = async (req, res) => {
  try {
    const body = { ...req.body, replies: req.body.replies || [] };
    const annotation = await Annotations.create(body);

    const userName = await resolveUserName(annotation.userId);
    const enriched = { ...annotation.toObject(), userName };

    try {
      const io = req.app.get('io');
      if (io) io.to(annotation.paperId).emit('annotationUpdate', enriched);
    } catch (e) { console.error('[Socket] Emit error on create:', e.message); }

    res.status(201).json(enriched);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* ─── Get annotations for a paper ──────────────────────── */
exports.getAnnotations = async (req, res) => {
  try {
    const { paperId } = req.params;
    const annotations = await Annotations.find({ paperId });

    const userIds = [...new Set(annotations.map(a => a.userId).filter(Boolean))];

    const userMap = {};
    if (userIds.length > 0) {
      const { data: users, error } = await supabase
        .from('users')
        .select('auth_id, name')
        .in('auth_id', userIds);

      if (error) console.error('[Annotations] Supabase error:', error.message);
      else for (const u of users) userMap[u.auth_id] = u.name;
    }

    const enriched = annotations.map(a => ({
      ...a.toObject(),
      userName: userMap[a.userId] || 'Unknown',
      replies: a.replies || [],
    }));

    res.json(enriched);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* ─── Update annotation (content OR replies) ────────────── */
exports.updateAnnotation = async (req, res) => {
  try {
    const { id } = req.params;
    const annotation = await Annotations.findByIdAndUpdate(id, req.body, { new: true });

    const userName = await resolveUserName(annotation.userId);
    const enriched = { ...annotation.toObject(), userName, replies: annotation.replies || [] };

    try {
      const io = req.app.get('io');
      if (io) io.to(annotation.paperId).emit('annotationUpdate', enriched);
    } catch (e) { console.error('[Socket] Emit error on update:', e.message); }

    res.json(enriched);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* ─── Delete annotation ─────────────────────────────────── */
exports.deleteAnnotation = async (req, res) => {
  try {
    const { id } = req.params;
    const annotation = await Annotations.findByIdAndDelete(id);

    try {
      const io = req.app.get('io');
      if (io && annotation) io.to(annotation.paperId).emit('annotationDelete', { id });
    } catch (e) { console.error('[Socket] Emit error on delete:', e.message); }

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};