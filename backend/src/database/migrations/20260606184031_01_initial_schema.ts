import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  // Streams Table
  await knex.schema.createTable("streams", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("name").notNullable();
    table.string("grade_level").notNullable();
    table.timestamps(true, true);
  });

  // Subjects Table
  await knex.schema.createTable("subjects", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("name").notNullable().unique();
    table.string("code").nullable().unique();
    table.timestamps(true, true);
  });

  // Stream Subjects (Many-to-Many)
  await knex.schema.createTable("stream_subjects", (table) => {
    table.uuid("stream_id").references("id").inTable("streams").onDelete("CASCADE");
    table.uuid("subject_id").references("id").inTable("subjects").onDelete("CASCADE");
    table.primary(["stream_id", "subject_id"]);
  });

  // Students Table
  await knex.schema.createTable("students", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("first_name").notNullable();
    table.string("last_name").notNullable();
    table.string("admission_number").notNullable().unique();
    table.uuid("stream_id").references("id").inTable("streams").onDelete("SET NULL");
    table.timestamps(true, true);
  });

  // Grading Scales Table
  await knex.schema.createTable("grading_scales", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("grade", 5).notNullable().unique();
    table.decimal("min_score", 5, 2).notNullable();
    table.decimal("max_score", 5, 2).notNullable();
  });

  // Assessments Scores Table
  await knex.schema.createTable("assessment_scores", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("student_id").references("id").inTable("students").onDelete("CASCADE");
    table.uuid("subject_id").references("id").inTable("subjects").onDelete("CASCADE");
    table.string("assessment_type").notNullable(); // e.g., 'Mid-Term', 'Final'
    table.string("academic_term").notNullable(); // e.g., 'Term 1 - 2026'
    table.decimal("score", 5, 2).notNullable();
    table.timestamps(true, true);

    // Composite unique constraint to prevent duplicate score entries
    table.unique(["student_id", "subject_id", "assessment_type", "academic_term"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("assessment_scores");
  await knex.schema.dropTableIfExists("grading_scales");
  await knex.schema.dropTableIfExists("students");
  await knex.schema.dropTableIfExists("stream_subjects");
  await knex.schema.dropTableIfExists("subjects");
  await knex.schema.dropTableIfExists("streams");
}

