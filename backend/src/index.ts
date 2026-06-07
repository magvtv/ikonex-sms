import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import db from "./database/db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------
// DASHBOARD STATS
// ---------------------------------------------------------
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const studentCount = await db("students").count("id as count").first();
    const streamCount = await db("streams").count("id as count").first();
    const subjectCount = await db("subjects").count("id as count").first();
    const avgScoreResult = await db("assessment_scores").avg("score as avg").first();
    
    // Fetch all grading scales to calculate distribution
    const gradingScales = await db("grading_scales").select("*");
    const scores = await db("assessment_scores").select("score");

    let highCount = 0; // A, A-, B+, B, B-
    let midCount = 0;  // C+, C, C-, D+, D, D-
    let lowCount = 0;  // E

    scores.forEach((s) => {
      const val = Number(s.score);
      const gradeScale = gradingScales.find(g => val >= Number(g.min_score) && val <= Number(g.max_score));
      if (gradeScale) {
        const g = gradeScale.grade;
        if (["A", "A-", "B+", "B", "B-"].includes(g)) {
          highCount++;
        } else if (["C+", "C", "C-", "D+", "D", "D-"].includes(g)) {
          midCount++;
        } else {
          lowCount++;
        }
      }
    });

    const totalGraded = scores.length || 1;
    const distribution = {
      high: Math.round((highCount / totalGraded) * 100),
      mid: Math.round((midCount / totalGraded) * 100),
      low: Math.round((lowCount / totalGraded) * 100),
    };

    res.json({
      students: studentCount?.count || 0,
      streams: streamCount?.count || 0,
      subjects: subjectCount?.count || 0,
      averageScore: avgScoreResult?.avg ? Number(Number(avgScoreResult.avg).toFixed(2)) : 0,
      distribution
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// STUDENTS CRUD
// ---------------------------------------------------------
app.get("/api/students", async (req, res) => {
  try {
    const students = await db("students")
      .leftJoin("streams", "students.stream_id", "streams.id")
      .select(
        "students.id",
        "students.first_name",
        "students.last_name",
        "students.admission_number",
        "students.stream_id",
        "streams.name as stream_name"
      )
      .orderBy("students.admission_number", "asc");
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/students", async (req, res) => {
  try {
    const { first_name, last_name, admission_number, stream_id } = req.body;
    if (!first_name || !last_name || !admission_number) {
      return res.status(400).json({ error: "Missing required student details" });
    }
    const id = uuidv4();
    await db("students").insert({
      id,
      first_name,
      last_name,
      admission_number,
      stream_id: stream_id || null
    });
    res.status(201).json({ id, first_name, last_name, admission_number, stream_id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, admission_number, stream_id } = req.body;
    await db("students")
      .where({ id })
      .update({
        first_name,
        last_name,
        admission_number,
        stream_id: stream_id || null,
        updated_at: db.fn.now()
      });
    res.json({ message: "Student updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db("students").where({ id }).del();
    res.json({ message: "Student deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// STREAMS CRUD
// ---------------------------------------------------------
app.get("/api/streams", async (req, res) => {
  try {
    const streams = await db("streams")
      .leftJoin("students", "streams.id", "students.stream_id")
      .select(
        "streams.id",
        "streams.name",
        "streams.grade_level",
        db.raw("count(students.id) as student_count")
      )
      .groupBy("streams.id")
      .orderBy("streams.name", "asc");
    res.json(streams);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/streams", async (req, res) => {
  try {
    const { name, grade_level } = req.body;
    if (!name || !grade_level) {
      return res.status(400).json({ error: "Missing required stream details" });
    }
    const id = uuidv4();
    await db("streams").insert({ id, name, grade_level });
    res.status(201).json({ id, name, grade_level });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/streams/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, grade_level } = req.body;
    await db("streams")
      .where({ id })
      .update({ name, grade_level, updated_at: db.fn.now() });
    res.json({ message: "Stream updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/streams/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db("streams").where({ id }).del();
    res.json({ message: "Stream deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// SUBJECTS CRUD
// ---------------------------------------------------------
app.get("/api/subjects", async (req, res) => {
  try {
    const subjects = await db("subjects").select("*").orderBy("name", "asc");
    
    // Map subjects to their streams
    for (const sub of subjects) {
      const mappedStreams = await db("stream_subjects")
        .join("streams", "stream_subjects.stream_id", "streams.id")
        .where("stream_subjects.subject_id", sub.id)
        .select("streams.id", "streams.name");
      sub.streams = mappedStreams;
    }
    
    res.json(subjects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/subjects", async (req, res) => {
  try {
    const { name, code, stream_ids } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: "Missing name or code" });
    }
    const id = uuidv4();
    await db.transaction(async (trx) => {
      await trx("subjects").insert({ id, name, code });
      
      if (Array.isArray(stream_ids) && stream_ids.length > 0) {
        const pivotEntries = stream_ids.map(streamId => ({
          stream_id: streamId,
          subject_id: id
        }));
        await trx("stream_subjects").insert(pivotEntries);
      }
    });
    res.status(201).json({ id, name, code });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/subjects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, stream_ids } = req.body;
    await db.transaction(async (trx) => {
      await trx("subjects").where({ id }).update({ name, code, updated_at: trx.fn.now() });
      await trx("stream_subjects").where({ subject_id: id }).del();
      
      if (Array.isArray(stream_ids) && stream_ids.length > 0) {
        const pivotEntries = stream_ids.map(streamId => ({
          stream_id: streamId,
          subject_id: id
        }));
        await trx("stream_subjects").insert(pivotEntries);
      }
    });
    res.json({ message: "Subject updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/subjects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db("subjects").where({ id }).del();
    res.json({ message: "Subject deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// SCORES CRUD & LISTING
// ---------------------------------------------------------
app.get("/api/scores", async (req, res) => {
  try {
    const { stream_id, subject_id, academic_term, assessment_type } = req.query;
    
    // Base query to list students in the stream
    let query = db("students")
      .leftJoin("streams", "students.stream_id", "streams.id")
      .select(
        "students.id as student_id",
        "students.first_name",
        "students.last_name",
        "students.admission_number",
        "streams.name as stream_name"
      );

    if (stream_id) {
      query = query.where("students.stream_id", stream_id as string);
    }

    const students = await query.orderBy("students.admission_number", "asc");

    // Fetch corresponding scores
    const scores = await db("assessment_scores")
      .where({
        subject_id: (subject_id as string) || "",
        academic_term: (academic_term as string) || "",
        assessment_type: (assessment_type as string) || ""
      });

    // Fetch grading scales to map scores to letters
    const gradingScales = await db("grading_scales").select("*");

    const result = students.map((student) => {
      const match = scores.find(s => s.student_id === student.student_id);
      let grade = "--";
      if (match && match.score !== null) {
        const val = Number(match.score);
        const scale = gradingScales.find(g => val >= Number(g.min_score) && val <= Number(g.max_score));
        if (scale) grade = scale.grade;
      }

      return {
        ...student,
        score_id: match ? match.id : null,
        score: match ? Number(match.score) : null,
        grade,
        status: match ? "Completed" : "Pending"
      };
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent scores joined with students, subjects, streams
app.get("/api/scores/recent", async (req, res) => {
  try {
    const scores = await db("assessment_scores")
      .join("students", "assessment_scores.student_id", "students.id")
      .join("subjects", "assessment_scores.subject_id", "subjects.id")
      .leftJoin("streams", "students.stream_id", "streams.id")
      .select(
        "students.first_name",
        "students.last_name",
        "students.admission_number",
        "streams.name as stream_name",
        "subjects.name as subject_name",
        "assessment_scores.assessment_type",
        "assessment_scores.score"
      )
      .orderBy("assessment_scores.created_at", "desc")
      .limit(10);

    const gradingScales = await db("grading_scales").select("*");

    const formatted = scores.map(s => {
      const val = Number(s.score);
      const scale = gradingScales.find(g => val >= Number(g.min_score) && val <= Number(g.max_score));
      return {
        name: `${s.first_name} ${s.last_name}`,
        adm: s.admission_number,
        stream: s.stream_name || "N/A",
        subject: s.subject_name,
        type: s.assessment_type,
        score: val,
        grade: scale ? scale.grade : "--",
        status: "Completed"
      };
    });

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk upsert scores for a class matrix
app.post("/api/scores/bulk", async (req, res) => {
  try {
    const { subject_id, academic_term, assessment_type, scores } = req.body;
    
    if (!subject_id || !academic_term || !assessment_type || !Array.isArray(scores)) {
      return res.status(400).json({ error: "Invalid scoring matrix payload" });
    }

    await db.transaction(async (trx) => {
      for (const entry of scores) {
        const { student_id, score } = entry;
        
        // If score is null or empty, delete any existing grade entry
        if (score === null || score === undefined || score === "") {
          await trx("assessment_scores")
            .where({ student_id, subject_id, academic_term, assessment_type })
            .del();
          continue;
        }

        // Check if there is an existing entry
        const existing = await trx("assessment_scores")
          .where({ student_id, subject_id, academic_term, assessment_type })
          .first();

        if (existing) {
          await trx("assessment_scores")
            .where({ id: existing.id })
            .update({
              score: Number(score),
              updated_at: trx.fn.now()
            });
        } else {
          await trx("assessment_scores").insert({
            id: uuidv4(),
            student_id,
            subject_id,
            assessment_type,
            academic_term,
            score: Number(score)
          });
        }
      }
    });

    res.json({ message: "Scores updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// REPORTS & ANALYTICS ROUTE (using Window functions for ranking)
// ---------------------------------------------------------
app.get("/api/reports/rankings", async (req, res) => {
  try {
    const { academic_term, stream_id } = req.query;
    
    if (!academic_term) {
      return res.status(400).json({ error: "Academic term is required for analytics" });
    }

    // Rank students by their mean score in the specified term.
    // We utilize SQL Window functions (RANK() OVER) to sort and rank students.
    let rawQuery = `
      SELECT 
        s.id as student_id,
        s.first_name,
        s.last_name,
        s.admission_number,
        st.name as stream_name,
        avg(as_sc.score) as mean_score,
        RANK() OVER (ORDER BY avg(as_sc.score) DESC) as term_rank
      FROM students s
      JOIN streams st ON s.stream_id = st.id
      JOIN assessment_scores as_sc ON s.id = as_sc.student_id
      WHERE as_sc.academic_term = ?
    `;

    const params: any[] = [academic_term];

    if (stream_id) {
      rawQuery += ` AND s.stream_id = ? `;
      params.push(stream_id);
    }

    rawQuery += `
      GROUP BY s.id
      ORDER BY mean_score DESC
    `;

    const rankings = await db.raw(rawQuery, params);
    
    // Fetch grading scales to assign overall grade
    const gradingScales = await db("grading_scales").select("*");

    const formattedRankings = rankings[0].map((r: any) => {
      const mean = Number(r.mean_score);
      const scale = gradingScales.find(g => mean >= Number(g.min_score) && mean <= Number(g.max_score));
      return {
        ...r,
        mean_score: Number(mean.toFixed(2)),
        overall_grade: scale ? scale.grade : "--"
      };
    });

    res.json(formattedRankings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// mock PDF download endpoint
app.get("/api/reports/pdf/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academic_term } = req.query;

    const student = await db("students")
      .leftJoin("streams", "students.stream_id", "streams.id")
      .where("students.id", studentId)
      .select("students.*", "streams.name as stream_name")
      .first();

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Report_${student.admission_number}.pdf`);
    
    // For this assessment context, we will send back a text-based dummy PDF representation
    // to act as a placeholder for report files.
    res.send(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << >> /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 100 >>
stream
BT
/F1 12 Tf
100 700 Td
(Ikonex Academy - Report Card) Tj
0 -20 Td
(Name: ${student.first_name} ${student.last_name}) Tj
0 -20 Td
(Adm No: ${student.admission_number}) Tj
0 -20 Td
(Stream: ${student.stream_name || "N/A"}) Tj
0 -20 Td
(Term: ${academic_term || "All Terms"}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000056 00000 n 
0000000111 00000 n 
0000000185 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
335
%%EOF`);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
