-- =============================================================
-- Ikonex SMS - Supabase Database Setup
-- Run this entire script in the Supabase SQL Editor
-- =============================================================

-- TABLES

CREATE TABLE IF NOT EXISTS streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  grade_level text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stream_subjects (
  stream_id uuid REFERENCES streams(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (stream_id, subject_id)
);

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  admission_number text NOT NULL UNIQUE,
  stream_id uuid REFERENCES streams(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grading_scales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade text NOT NULL UNIQUE,
  min_score numeric(5,2) NOT NULL,
  max_score numeric(5,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS assessment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  assessment_type text NOT NULL,
  academic_term text NOT NULL,
  score numeric(5,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_score_entry UNIQUE (student_id, subject_id, assessment_type, academic_term)
);

-- DISABLE ROW LEVEL SECURITY (backend service access)
ALTER TABLE streams DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE stream_subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE grading_scales DISABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_scores DISABLE ROW LEVEL SECURITY;

-- RANKINGS STORED FUNCTION (used by reports endpoint)
CREATE OR REPLACE FUNCTION get_rankings(p_academic_term text, p_stream_id uuid DEFAULT NULL)
RETURNS TABLE(
  student_id uuid, first_name text, last_name text,
  admission_number text, stream_name text,
  mean_score numeric, term_rank bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.first_name, s.last_name, s.admission_number, st.name,
    avg(sc.score)::numeric,
    RANK() OVER (ORDER BY avg(sc.score) DESC)
  FROM students s
  JOIN streams st ON s.stream_id = st.id
  JOIN assessment_scores sc ON s.id = sc.student_id
  WHERE sc.academic_term = p_academic_term
    AND (p_stream_id IS NULL OR s.stream_id = p_stream_id)
  GROUP BY s.id, s.first_name, s.last_name, s.admission_number, st.name
  ORDER BY avg(sc.score) DESC;
END;
$$ LANGUAGE plpgsql;

-- SEED: Grading Scales
INSERT INTO grading_scales (grade, min_score, max_score) VALUES
  ('A',   80.00, 100.00),
  ('A-',  75.00,  79.99),
  ('B+',  70.00,  74.99),
  ('B',   65.00,  69.99),
  ('B-',  60.00,  64.99),
  ('C+',  55.00,  59.99),
  ('C',   50.00,  54.99),
  ('C-',  45.00,  49.99),
  ('D+',  40.00,  44.99),
  ('D',   35.00,  39.99),
  ('D-',  30.00,  34.99),
  ('E',    0.00,  29.99)
ON CONFLICT (grade) DO NOTHING;

-- SEED: Streams
INSERT INTO streams (name, grade_level) VALUES
  ('Form 1 Alpha',   'Form 1'), ('Form 1 Central', 'Form 1'),
  ('Form 1 Middle',  'Form 1'), ('Form 1 Pole',    'Form 1'),
  ('Form 2 Alpha',   'Form 2'), ('Form 2 Central', 'Form 2'),
  ('Form 2 Middle',  'Form 2'), ('Form 2 Pole',    'Form 2'),
  ('Form 3 Alpha',   'Form 3'), ('Form 3 Central', 'Form 3'),
  ('Form 3 Middle',  'Form 3'), ('Form 3 Pole',    'Form 3')
ON CONFLICT DO NOTHING;

-- SEED: Subjects
INSERT INTO subjects (name, code) VALUES
  ('Mathematics',               'MATH'),
  ('English',                   'ENG'),
  ('Swahili',                   'SWA'),
  ('Biology',                   'BIO'),
  ('Physics',                   'PHY'),
  ('Chemistry',                 'CHEM'),
  ('History',                   'HIST'),
  ('Geography',                 'GEO'),
  ('Christian Religious Education', 'CRE'),
  ('Business Studies',          'BST'),
  ('Music',                     'MUS'),
  ('Agriculture',               'AGR'),
  ('Home Science',              'HSC'),
  ('French',                    'FRE'),
  ('German',                    'GER')
ON CONFLICT (name) DO NOTHING;
