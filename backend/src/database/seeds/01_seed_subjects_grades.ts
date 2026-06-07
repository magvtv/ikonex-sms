import type { Knex } from "knex";

import { v4 as uuidv4 } from "uuid";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("stream_subjects").del();
  await knex("assessment_scores").del();
  await knex("students").del();
  await knex("subjects").del();
  await knex("grading_scales").del();
  await knex("streams").del();

  // Inserts seed entries for Streams
  const streams: any[] = [];
  const forms = ["Form 1", "Form 2", "Form 3"];
  const streamNames = ["Alpha", "Central", "Middle", "Pole"];
  
  for (const form of forms) {
    for (const streamName of streamNames) {
      streams.push({
        id: uuidv4(),
        name: `${form} ${streamName}`,
        grade_level: form,
      });
    }
  }
  await knex("streams").insert(streams);

  // Inserts seed entries for Subjects
  const subjects = [
    { id: uuidv4(), name: "Mathematics", code: "MAT" },
    { id: uuidv4(), name: "English", code: "ENG" },
    { id: uuidv4(), name: "Swahili", code: "SWA" },
    { id: uuidv4(), name: "Biology", code: "BIO" },
    { id: uuidv4(), name: "Physics", code: "PHY" },
    { id: uuidv4(), name: "Chemistry", code: "CHE" },
    { id: uuidv4(), name: "History", code: "HIS" },
    { id: uuidv4(), name: "Geography", code: "GEO" },
    { id: uuidv4(), name: "Christian Religious Education", code: "CRE" },
    { id: uuidv4(), name: "Business Studies", code: "BST" },
    { id: uuidv4(), name: "Music", code: "MUS" },
    { id: uuidv4(), name: "Agriculture", code: "AGR" },
    { id: uuidv4(), name: "Home Science", code: "HSC" },
    { id: uuidv4(), name: "French", code: "FRE" },
    { id: uuidv4(), name: "German", code: "GER" },
  ];

  await knex("subjects").insert(subjects);

  // Inserts seed entries for Grading Scales
  const gradingScales = [
    { id: uuidv4(), grade: "A", min_score: 80, max_score: 100 },
    { id: uuidv4(), grade: "A-", min_score: 75, max_score: 79.99 },
    { id: uuidv4(), grade: "B+", min_score: 70, max_score: 74.99 },
    { id: uuidv4(), grade: "B", min_score: 65, max_score: 69.99 },
    { id: uuidv4(), grade: "B-", min_score: 60, max_score: 64.99 },
    { id: uuidv4(), grade: "C+", min_score: 55, max_score: 59.99 },
    { id: uuidv4(), grade: "C", min_score: 50, max_score: 54.99 },
    { id: uuidv4(), grade: "C-", min_score: 45, max_score: 49.99 },
    { id: uuidv4(), grade: "D+", min_score: 40, max_score: 44.99 },
    { id: uuidv4(), grade: "D", min_score: 35, max_score: 39.99 },
    { id: uuidv4(), grade: "D-", min_score: 30, max_score: 34.99 },
    { id: uuidv4(), grade: "E", min_score: 0, max_score: 29.99 },
  ];

  await knex("grading_scales").insert(gradingScales);
}
