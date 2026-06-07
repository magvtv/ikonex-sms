import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from "./database/supabase";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Helper to assign grade letter from score
function getGrade(score: number, gradingScales: any[]): string {
  const scale = gradingScales.find(
    (g) => score >= Number(g.min_score) && score <= Number(g.max_score)
  );
  return scale ? scale.grade : "--";
}

// ---------------------------------------------------------
// DASHBOARD STATS
// ---------------------------------------------------------
app.get("/api/dashboard/stats", async (_req, res) => {
  try {
    const [
      { count: students },
      { count: streams },
      { count: subjects },
      { data: scores },
      { data: gradingScales },
    ] = await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("streams").select("*", { count: "exact", head: true }),
      supabase.from("subjects").select("*", { count: "exact", head: true }),
      supabase.from("assessment_scores").select("score"),
      supabase.from("grading_scales").select("*"),
    ]);

    let highCount = 0, midCount = 0, lowCount = 0;
    const scoreList = scores || [];
    scoreList.forEach((s) => {
      const g = getGrade(Number(s.score), gradingScales || []);
      if (["A", "A-", "B+", "B", "B-"].includes(g)) highCount++;
      else if (["C+", "C", "C-", "D+", "D", "D-"].includes(g)) midCount++;
      else lowCount++;
    });

    const avg = scoreList.length
      ? scoreList.reduce((acc, s) => acc + Number(s.score), 0) / scoreList.length
      : 0;
    const total = scoreList.length || 1;

    res.json({
      students: students ?? 0,
      streams: streams ?? 0,
      subjects: subjects ?? 0,
      averageScore: Number(avg.toFixed(2)),
      distribution: {
        high: Math.round((highCount / total) * 100),
        mid: Math.round((midCount / total) * 100),
        low: Math.round((lowCount / total) * 100),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// STUDENTS CRUD
// ---------------------------------------------------------
app.get("/api/students", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("id, first_name, last_name, admission_number, stream_id, streams(name)")
      .order("admission_number");
    if (error) throw error;
    const students = (data || []).map((s: any) => ({
      ...s,
      stream_name: s.streams?.name ?? null,
      streams: undefined,
    }));
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/students", async (req, res) => {
  try {
    const { first_name, last_name, admission_number, stream_id } = req.body;
    if (!first_name || !last_name || !admission_number)
      return res.status(400).json({ error: "Missing required student details" });

    const { data, error } = await supabase
      .from("students")
      .insert({ first_name, last_name, admission_number, stream_id: stream_id || null })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, admission_number, stream_id } = req.body;
    const { error } = await supabase
      .from("students")
      .update({ first_name, last_name, admission_number, stream_id: stream_id || null, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    res.json({ message: "Student updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("students").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Student deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// STREAMS CRUD
// ---------------------------------------------------------
app.get("/api/streams", async (_req, res) => {
  try {
    const { data: streams, error } = await supabase
      .from("streams")
      .select("id, name, grade_level")
      .order("name");
    if (error) throw error;

    const { data: students } = await supabase.from("students").select("stream_id");
    const countMap: Record<string, number> = {};
    (students || []).forEach((s: any) => {
      if (s.stream_id) countMap[s.stream_id] = (countMap[s.stream_id] || 0) + 1;
    });

    res.json((streams || []).map((s) => ({ ...s, student_count: countMap[s.id] || 0 })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/streams", async (req, res) => {
  try {
    const { name, grade_level } = req.body;
    if (!name || !grade_level)
      return res.status(400).json({ error: "Missing required stream details" });
    const { data, error } = await supabase
      .from("streams").insert({ name, grade_level }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/streams/:id", async (req, res) => {
  try {
    const { name, grade_level } = req.body;
    const { error } = await supabase
      .from("streams").update({ name, grade_level, updated_at: new Date().toISOString() }).eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Stream updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/streams/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("streams").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Stream deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// SUBJECTS CRUD
// ---------------------------------------------------------
app.get("/api/subjects", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("subjects")
      .select("id, name, code, stream_subjects(stream_id, streams(id, name))")
      .order("name");
    if (error) throw error;

    const subjects = (data || []).map((s: any) => ({
      id: s.id, name: s.name, code: s.code,
      streams: (s.stream_subjects || []).map((ss: any) => ss.streams).filter(Boolean),
    }));
    res.json(subjects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/subjects", async (req, res) => {
  try {
    const { name, code, stream_ids } = req.body;
    if (!name || !code) return res.status(400).json({ error: "Missing name or code" });

    const { data, error } = await supabase
      .from("subjects").insert({ name, code }).select().single();
    if (error) throw error;

    if (Array.isArray(stream_ids) && stream_ids.length > 0) {
      await supabase.from("stream_subjects").insert(
        stream_ids.map((sid: string) => ({ stream_id: sid, subject_id: data.id }))
      );
    }
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/subjects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, stream_ids } = req.body;
    const { error } = await supabase
      .from("subjects").update({ name, code, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;

    await supabase.from("stream_subjects").delete().eq("subject_id", id);
    if (Array.isArray(stream_ids) && stream_ids.length > 0) {
      await supabase.from("stream_subjects").insert(
        stream_ids.map((sid: string) => ({ stream_id: sid, subject_id: id }))
      );
    }
    res.json({ message: "Subject updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/subjects/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("subjects").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Subject deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// SCORES
// ---------------------------------------------------------
app.get("/api/scores", async (req, res) => {
  try {
    const { stream_id, subject_id, academic_term, assessment_type } = req.query as any;

    let studentsQuery = supabase
      .from("students")
      .select("id, first_name, last_name, admission_number, streams(name)")
      .order("admission_number");
    if (stream_id) studentsQuery = studentsQuery.eq("stream_id", stream_id);

    const [{ data: students }, { data: scores }, { data: gradingScales }] = await Promise.all([
      studentsQuery,
      supabase.from("assessment_scores").select("*")
        .eq("subject_id", subject_id || "")
        .eq("academic_term", academic_term || "")
        .eq("assessment_type", assessment_type || ""),
      supabase.from("grading_scales").select("*"),
    ]);

    const result = (students || []).map((student: any) => {
      const match = (scores || []).find((s) => s.student_id === student.id);
      const grade = match ? getGrade(Number(match.score), gradingScales || []) : "--";
      return {
        student_id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        admission_number: student.admission_number,
        stream_name: student.streams?.name ?? null,
        score_id: match?.id ?? null,
        score: match ? Number(match.score) : null,
        grade,
        status: match ? "Completed" : "Pending",
      };
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/scores/recent", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("assessment_scores")
      .select("score, assessment_type, students(first_name, last_name, admission_number, streams(name)), subjects(name)")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;

    const { data: gradingScales } = await supabase.from("grading_scales").select("*");
    const formatted = (data || []).map((s: any) => ({
      name: `${s.students.first_name} ${s.students.last_name}`,
      adm: s.students.admission_number,
      stream: s.students.streams?.name ?? "N/A",
      subject: s.subjects.name,
      type: s.assessment_type,
      score: Number(s.score),
      grade: getGrade(Number(s.score), gradingScales || []),
      status: "Completed",
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/scores/bulk", async (req, res) => {
  try {
    const { subject_id, academic_term, assessment_type, scores } = req.body;
    if (!subject_id || !academic_term || !assessment_type || !Array.isArray(scores))
      return res.status(400).json({ error: "Invalid scoring matrix payload" });

    for (const entry of scores) {
      const { student_id, score } = entry;
      if (score === null || score === undefined || score === "") {
        await supabase.from("assessment_scores").delete().match({
          student_id, subject_id, academic_term, assessment_type,
        });
      } else {
        await supabase.from("assessment_scores").upsert(
          { student_id, subject_id, academic_term, assessment_type, score: Number(score), updated_at: new Date().toISOString() },
          { onConflict: "student_id,subject_id,assessment_type,academic_term" }
        );
      }
    }
    res.json({ message: "Scores updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// REPORTS
// ---------------------------------------------------------
app.get("/api/reports/rankings", async (req, res) => {
  try {
    const { academic_term, stream_id } = req.query as any;
    if (!academic_term)
      return res.status(400).json({ error: "Academic term is required for analytics" });

    const { data, error } = await supabase.rpc("get_rankings", {
      p_academic_term: academic_term,
      p_stream_id: stream_id || null,
    });
    if (error) throw error;

    const { data: gradingScales } = await supabase.from("grading_scales").select("*");
    const formatted = (data || []).map((r: any) => ({
      ...r,
      mean_score: Number(Number(r.mean_score).toFixed(2)),
      overall_grade: getGrade(Number(r.mean_score), gradingScales || []),
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reports/pdf/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academic_term } = req.query;
    const { data: student, error } = await supabase
      .from("students")
      .select("*, streams(name)")
      .eq("id", studentId)
      .single();
    if (error || !student) return res.status(404).json({ error: "Student not found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Report_${student.admission_number}.pdf`);
    res.send(`%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << >> /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 100 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Ikonex Academy - Report Card) Tj\n0 -20 Td\n(Name: ${student.first_name} ${student.last_name}) Tj\n0 -20 Td\n(Adm No: ${student.admission_number}) Tj\n0 -20 Td\n(Stream: ${(student as any).streams?.name ?? "N/A"}) Tj\n0 -20 Td\n(Term: ${academic_term || "All Terms"}) Tj\nET\nendstream\nendobj\ntrailer\n<< /Size 5 /Root 1 0 R >>\n%%EOF`);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
